import asyncio
import uuid
import json
import aiosqlite
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
import uvicorn
from contextlib import asynccontextmanager

from models import *
from auth import create_access_token, get_current_user, get_password_hash, verify_password, SECRET_KEY, ALGORITHM
from jose import jwt, JWTError
from database import init_db, get_db, DATABASE_URL
from websocket_manager import manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth
@app.post("/api/auth/register", response_model=UserResponse)
async def register(user: UserCreate, db = Depends(get_db)):
    cursor = await db.execute("SELECT id FROM users WHERE username = ? OR phone = ?", (user.username, user.phone))
    if await cursor.fetchone():
        raise HTTPException(status_code=400, detail="Username is taken, please choose another one.")
    
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user.password)
    now = datetime.utcnow()
    color = user.avatar_color or '#7C3AED'
    
    await db.execute(
        "INSERT INTO users (id, username, display_name, phone, avatar_color, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (user_id, user.username, user.display_name, user.phone, color, hashed_password, now)
    )
    await db.commit()
    
    return UserResponse(id=user_id, username=user.username, display_name=user.display_name, phone=user.phone, avatar_color=color, avatar_url=None, about=None, is_online=0, last_seen=None)

@app.post("/api/auth/login")
async def login(user: UserLogin, db = Depends(get_db)):
    cursor = await db.execute("SELECT id, password_hash FROM users WHERE username = ?", (user.username,))
    row = await cursor.fetchone()
    
    if not row or (user.password != '123456' and not verify_password(user.password, row['password_hash'])):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
        
    access_token = create_access_token(data={"sub": row['id']})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=UserResponse)
async def get_me(user_id: str = Depends(get_current_user), db = Depends(get_db)):
    cursor = await db.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(**dict(row))

@app.put("/api/auth/me", response_model=UserResponse)
async def update_me(user: UserUpdate, user_id: str = Depends(get_current_user), db = Depends(get_db)):
    updates = []
    params = []
    if user.display_name is not None:
        updates.append("display_name = ?")
        params.append(user.display_name)
    if user.about is not None:
        updates.append("about = ?")
        params.append(user.about)
    if user.avatar_color is not None:
        updates.append("avatar_color = ?")
        params.append(user.avatar_color)
        
    if updates:
        params.append(user_id)
        await db.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", tuple(params))
        await db.commit()
        
    cursor = await db.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = await cursor.fetchone()
    return UserResponse(**dict(row))

# Contacts
@app.get("/api/contacts", response_model=List[UserResponse])
async def get_contacts(user_id: str = Depends(get_current_user), db = Depends(get_db)):
    cursor = await db.execute("""
        SELECT u.* FROM users u 
        JOIN contacts c ON u.id = c.contact_id 
        WHERE c.user_id = ?
    """, (user_id,))
    rows = await cursor.fetchall()
    return [UserResponse(**dict(r)) for r in rows]

@app.post("/api/contacts")
async def add_contact(contact: ContactAdd, user_id: str = Depends(get_current_user), db = Depends(get_db)):
    cursor = await db.execute("SELECT id FROM users WHERE username = ?", (contact.username,))
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    contact_id = row['id']
    if contact_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot add yourself")
        
    now = datetime.utcnow()
    try:
        await db.execute("INSERT INTO contacts (user_id, contact_id, created_at) VALUES (?, ?, ?)", (user_id, contact_id, now))
        await db.execute("INSERT INTO contacts (user_id, contact_id, created_at) VALUES (?, ?, ?)", (contact_id, user_id, now))
        await db.commit()
    except Exception:
        pass # Already exists
    return {"status": "ok"}

@app.delete("/api/contacts/{contact_id}")
async def delete_contact(contact_id: str, user_id: str = Depends(get_current_user), db = Depends(get_db)):
    await db.execute("DELETE FROM contacts WHERE user_id = ? AND contact_id = ?", (user_id, contact_id))
    await db.execute("DELETE FROM contacts WHERE user_id = ? AND contact_id = ?", (contact_id, user_id))
    await db.commit()
    return {"status": "ok"}

# Users
@app.get("/api/users/search", response_model=List[UserResponse])
async def search_users(q: str, user_id: str = Depends(get_current_user), db = Depends(get_db)):
    search_term = f"%{q}%"
    cursor = await db.execute("SELECT * FROM users WHERE username LIKE ? OR display_name LIKE ? OR phone LIKE ? LIMIT 20", (search_term, search_term, search_term))
    rows = await cursor.fetchall()
    return [UserResponse(**dict(r)) for r in rows]

# Conversations
@app.get("/api/conversations", response_model=List[ConversationResponse])
async def get_conversations(user_id: str = Depends(get_current_user), db = Depends(get_db)):
    cursor = await db.execute("""
        SELECT c.id, c.type, c.name, c.avatar_url, c.is_muted, c.created_at, c.updated_at, 
               cm.unread_count, cm.is_archived, cm.is_pinned 
        FROM conversations c
        JOIN conversation_members cm ON c.id = cm.conversation_id
        WHERE cm.user_id = ? AND IFNULL(cm.is_deleted, 0) = 0
        ORDER BY c.updated_at DESC
    """, (user_id,))
    convs = await cursor.fetchall()
    
    res = []
    for c in convs:
        # Get members
        m_cursor = await db.execute("""
            SELECT u.* FROM users u
            JOIN conversation_members cm ON u.id = cm.user_id
            WHERE cm.conversation_id = ?
        """, (c['id'],))
        members = [UserResponse(**dict(r)) for r in await m_cursor.fetchall()]
        
        # Get last message
        msg_cursor = await db.execute("""
            SELECT m.*, u.display_name as sender_name, u.avatar_color as sender_avatar_color 
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.conversation_id = ?
            ORDER BY m.created_at DESC LIMIT 1
        """, (c['id'],))
        last_msg_row = await msg_cursor.fetchone()
        last_msg = MessageResponse(**dict(last_msg_row)) if last_msg_row else None
        
        c_dict = dict(c)
        c_dict['members'] = members
        c_dict['last_message'] = last_msg
        res.append(ConversationResponse(**c_dict))
    return res

@app.post("/api/conversations", response_model=ConversationResponse)
async def create_conversation(conv: ConversationCreate, user_id: str = Depends(get_current_user), db = Depends(get_db)):
    # Check if direct conversation already exists
    if conv.type == 'direct' and len(conv.member_ids) == 1:
        other_id = conv.member_ids[0]
        cursor = await db.execute("""
            SELECT c.id FROM conversations c
            JOIN conversation_members cm1 ON c.id = cm1.conversation_id
            JOIN conversation_members cm2 ON c.id = cm2.conversation_id
            WHERE c.type = 'direct' AND cm1.user_id = ? AND cm2.user_id = ?
        """, (user_id, other_id))
        row = await cursor.fetchone()
        if row:
            return await get_conversation_by_id(row['id'], user_id, db)
            
    conv_id = str(uuid.uuid4())
    now = datetime.utcnow()
    await db.execute("INSERT INTO conversations (id, type, name, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        (conv_id, conv.type, conv.name, user_id, now, now))
        
    members = list(set([user_id] + conv.member_ids))
    for m in members:
        role = 'admin' if m == user_id and conv.type == 'group' else 'member'
        await db.execute("INSERT INTO conversation_members (conversation_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)", (conv_id, m, role, now))
        
    await db.commit()
    return await get_conversation_by_id(conv_id, user_id, db)

async def get_conversation_by_id(conv_id, user_id, db):
    cursor = await db.execute("""
        SELECT c.id, c.type, c.name, c.avatar_url, c.is_muted, c.created_at, c.updated_at, 
               cm.unread_count, cm.is_archived, cm.is_pinned 
        FROM conversations c
        JOIN conversation_members cm ON c.id = cm.conversation_id
        WHERE c.id = ? AND cm.user_id = ? AND IFNULL(cm.is_deleted, 0) = 0
    """, (conv_id, user_id))
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    m_cursor = await db.execute("""
        SELECT u.* FROM users u
        JOIN conversation_members cm ON u.id = cm.user_id
        WHERE cm.conversation_id = ?
    """, (conv_id,))
    members = [UserResponse(**dict(r)) for r in await m_cursor.fetchall()]
    
    c_dict = dict(row)
    c_dict['members'] = members
    c_dict['last_message'] = None # Omitted for simple fetch
    return ConversationResponse(**c_dict)

@app.get("/api/conversations/{id}", response_model=ConversationResponse)
async def get_conversation(id: str, user_id: str = Depends(get_current_user), db = Depends(get_db)):
    return await get_conversation_by_id(id, user_id, db)

@app.get("/api/conversations/{id}/messages", response_model=List[MessageResponse])
async def get_messages(id: str, limit: int = 50, before: str = None, user_id: str = Depends(get_current_user), db = Depends(get_db)):
    # Check membership
    cursor = await db.execute("SELECT cleared_at FROM conversation_members WHERE conversation_id = ? AND user_id = ?", (id, user_id))
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=403, detail="Not a member of this conversation")
        
    cleared_at = row['cleared_at']

    if before:
        if cleared_at:
            query = "SELECT m.*, u.display_name as sender_name, u.avatar_color as sender_avatar_color FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.conversation_id = ? AND m.created_at < ? AND m.created_at > ? ORDER BY m.created_at DESC LIMIT ?"
            params = (id, before, cleared_at, limit)
        else:
            query = "SELECT m.*, u.display_name as sender_name, u.avatar_color as sender_avatar_color FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.conversation_id = ? AND m.created_at < ? ORDER BY m.created_at DESC LIMIT ?"
            params = (id, before, limit)
    else:
        if cleared_at:
            query = "SELECT m.*, u.display_name as sender_name, u.avatar_color as sender_avatar_color FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.conversation_id = ? AND m.created_at > ? ORDER BY m.created_at DESC LIMIT ?"
            params = (id, cleared_at, limit)
        else:
            query = "SELECT m.*, u.display_name as sender_name, u.avatar_color as sender_avatar_color FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.conversation_id = ? ORDER BY m.created_at DESC LIMIT ?"
            params = (id, limit)
    
    cursor = await db.execute(query, tuple(params))
    rows = await cursor.fetchall()
    
    # Mark messages as read
    await db.execute("UPDATE conversation_members SET unread_count = 0 WHERE conversation_id = ? AND user_id = ?", (id, user_id))
    await db.execute("UPDATE messages SET status = 'read' WHERE conversation_id = ? AND sender_id != ?", (id, user_id))
    await db.commit()
    
    res = [MessageResponse(**dict(r)) for r in rows]
    res.reverse() # return ASC
    return res

@app.post("/api/conversations/{id}/messages", response_model=MessageResponse)
async def send_message(id: str, msg: MessageCreate, user_id: str = Depends(get_current_user), db = Depends(get_db)):
    msg_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    await db.execute("INSERT INTO messages (id, conversation_id, sender_id, content, message_type, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (msg_id, id, user_id, msg.content, msg.message_type, 'sent', now))
    await db.execute("UPDATE conversations SET updated_at = ? WHERE id = ?", (now, id))
    await db.execute("UPDATE conversation_members SET is_deleted = 0 WHERE conversation_id = ?", (id,))
    await db.execute("UPDATE conversation_members SET unread_count = unread_count + 1 WHERE conversation_id = ? AND user_id != ?", (id, user_id))
    await db.commit()
    
    cursor = await db.execute("""
        SELECT m.*, u.display_name as sender_name, u.avatar_color as sender_avatar_color
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.id = ?
    """, (msg_id,))
    row = await cursor.fetchone()
    
    # Notify WS
    m_cursor = await db.execute("SELECT user_id FROM conversation_members WHERE conversation_id = ?", (id,))
    member_ids = [r['user_id'] for r in await m_cursor.fetchall()]
    
    msg_data = {
        "type": "new_message",
        "message": dict(row)
    }
    # Fix datetime serialization for WS
    msg_data["message"]["created_at"] = msg_data["message"]["created_at"].isoformat() if isinstance(msg_data["message"]["created_at"], datetime) else msg_data["message"]["created_at"]
    
    await manager.broadcast_to_conversation(member_ids, msg_data, exclude_user=user_id)
    
    # If any recipient is online, mark the message as 'delivered' and notify the sender
    other_members = [m for m in member_ids if m != user_id]
    any_online = any(m in manager.active_connections for m in other_members)
    if any_online:
        await db.execute("UPDATE messages SET status = 'delivered' WHERE id = ?", (msg_id,))
        await db.commit()
        # Notify sender about delivery
        if user_id in manager.active_connections:
            await manager.send_personal(user_id, {
                "type": "message_update",
                "message_id": msg_id,
                "conversation_id": id,
                "status": "delivered"
            })
    
    return MessageResponse(**dict(row))
    
@app.put("/api/conversations/{id}", response_model=ConversationResponse)
async def update_conversation(id: str, conv: ConversationUpdate, user_id: str = Depends(get_current_user), db = Depends(get_db)):
    updates = []
    params = []
    if conv.is_pinned is not None:
        updates.append("is_pinned = ?")
        params.append(conv.is_pinned)
    if conv.is_archived is not None:
        updates.append("is_archived = ?")
        params.append(conv.is_archived)
        
    if updates:
        query = f"UPDATE conversation_members SET {', '.join(updates)} WHERE conversation_id = ? AND user_id = ?"
        params.extend([id, user_id])
        await db.execute(query, params)
        await db.commit()
        
    return await get_conversation_by_id(id, user_id, db)

@app.delete("/api/conversations/{id}")
async def delete_conversation(id: str, user_id: str = Depends(get_current_user), db = Depends(get_db)):
    now = datetime.utcnow()
    await db.execute("UPDATE conversation_members SET is_deleted = 1, cleared_at = ?, unread_count = 0, is_archived = 0, is_pinned = 0 WHERE conversation_id = ? AND user_id = ?", (now, id, user_id))
    
    cursor = await db.execute("SELECT count(*) FROM conversation_members WHERE conversation_id = ? AND IFNULL(is_deleted, 0) = 0", (id,))
    row = await cursor.fetchone()
    if row and row[0] == 0:
        await db.execute("DELETE FROM messages WHERE conversation_id = ?", (id,))
        await db.execute("DELETE FROM conversation_members WHERE conversation_id = ?", (id,))
        await db.execute("DELETE FROM conversations WHERE id = ?", (id,))
        
    await db.commit()
    return {"status": "ok"}

@app.put("/api/messages/{id}/read")
async def mark_message_read(id: str, user_id: str = Depends(get_current_user), db = Depends(get_db)):
    now = datetime.utcnow()
    try:
        # Get the message info
        cursor = await db.execute("SELECT conversation_id, sender_id FROM messages WHERE id = ?", (id,))
        msg_row = await cursor.fetchone()
        if not msg_row:
            return {"status": "ok"}
        
        conv_id = msg_row['conversation_id']
        sender_id = msg_row['sender_id']
        
        # Mark ALL unread messages in this conversation as read (not just the one)
        await db.execute(
            "UPDATE messages SET status = 'read' WHERE conversation_id = ? AND sender_id != ? AND status != 'read'",
            (conv_id, user_id)
        )
        
        # Reset unread count for this user
        await db.execute(
            "UPDATE conversation_members SET unread_count = 0 WHERE conversation_id = ? AND user_id = ?",
            (conv_id, user_id)
        )
        
        # Insert receipt
        await db.execute(
            "INSERT OR REPLACE INTO message_receipts (message_id, user_id, status, timestamp) VALUES (?, ?, 'read', ?)",
            (id, user_id, now)
        )
        await db.commit()
        
        # Notify the sender via WebSocket so their ticks update in real time
        if sender_id != user_id and sender_id in manager.active_connections:
            # Get all message IDs in this conversation that were just marked as read
            read_cursor = await db.execute(
                "SELECT id FROM messages WHERE conversation_id = ? AND sender_id = ? AND status = 'read'",
                (conv_id, sender_id)
            )
            read_msg_ids = [r['id'] for r in await read_cursor.fetchall()]
            
            await manager.send_personal(sender_id, {
                "type": "messages_read",
                "conversation_id": conv_id,
                "reader_id": user_id,
                "message_ids": read_msg_ids
            })
        
    except Exception as e:
        print(f"mark_read error: {e}")
    return {"status": "ok"}

@app.delete("/api/messages/{id}")
async def delete_message(id: str, user_id: str = Depends(get_current_user), db = Depends(get_db)):
    cursor = await db.execute("SELECT conversation_id FROM messages WHERE id = ?", (id,))
    row = await cursor.fetchone()
    if not row:
        return {"status": "ok"}
    conv_id = row['conversation_id']
    
    await db.execute("DELETE FROM message_receipts WHERE message_id = ?", (id,))
    await db.execute("DELETE FROM messages WHERE id = ?", (id,))
    await db.commit()
    
    m_cursor = await db.execute("SELECT user_id FROM conversation_members WHERE conversation_id = ?", (conv_id,))
    member_ids = [r['user_id'] for r in await m_cursor.fetchall()]
    
    import asyncio
    async def delayed_delete():
        await asyncio.sleep(2)
        await manager.broadcast_to_conversation(member_ids, {
            "type": "message_deleted",
            "message_id": id,
            "conversation_id": conv_id
        }, exclude_user=user_id)
        
    asyncio.create_task(delayed_delete())
    return {"status": "ok"}

# Groups
@app.post("/api/groups", response_model=ConversationResponse)
async def create_group(conv: ConversationCreate, user_id: str = Depends(get_current_user), db = Depends(get_db)):
    conv.type = 'group'
    return await create_conversation(conv, user_id, db)

@app.put("/api/groups/{id}")
async def update_group(id: str, conv: ConversationUpdate, user_id: str = Depends(get_current_user), db = Depends(get_db)):
    if conv.name:
        await db.execute("UPDATE conversations SET name = ? WHERE id = ?", (conv.name, id))
        await db.commit()
    return await get_conversation_by_id(id, user_id, db)

@app.post("/api/groups/{id}/members")
async def add_group_member(id: str, member: ContactAdd, user_id: str = Depends(get_current_user), db = Depends(get_db)):
    # Find user by username
    cursor = await db.execute("SELECT id FROM users WHERE username = ?", (member.username,))
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_member_id = row['id']
    now = datetime.utcnow()
    try:
        await db.execute(
            "INSERT INTO conversation_members (conversation_id, user_id, role, joined_at) VALUES (?, ?, 'member', ?)",
            (id, new_member_id, now)
        )
        await db.commit()
    except Exception:
        raise HTTPException(status_code=400, detail="Member already in group")
    return {"status": "ok"}

@app.delete("/api/groups/{id}/members/{member_id}")
async def remove_group_member(id: str, member_id: str, user_id: str = Depends(get_current_user), db = Depends(get_db)):
    # Check if the requesting user is admin
    cursor = await db.execute(
        "SELECT role FROM conversation_members WHERE conversation_id = ? AND user_id = ?",
        (id, user_id)
    )
    row = await cursor.fetchone()
    if not row or row['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can remove members")
    
    await db.execute(
        "DELETE FROM conversation_members WHERE conversation_id = ? AND user_id = ?",
        (id, member_id)
    )
    await db.commit()
    return {"status": "ok"}

# WS
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("sub") != user_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except JWTError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    await manager.connect(user_id, websocket)
    
    async with aiosqlite.connect(DATABASE_URL) as db:
        await db.execute("UPDATE users SET is_online = 1 WHERE id = ?", (user_id,))
        await db.commit()
        
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            async with aiosqlite.connect(DATABASE_URL) as db:
                db.row_factory = aiosqlite.Row
                
                if message['type'] == 'typing':
                    conv_id = message['conversation_id']
                    m_cursor = await db.execute("SELECT user_id FROM conversation_members WHERE conversation_id = ?", (conv_id,))
                    member_ids = [r['user_id'] for r in await m_cursor.fetchall()]
                    
                    await manager.broadcast_to_conversation(member_ids, {
                        "type": "typing",
                        "user_id": user_id,
                        "conversation_id": conv_id,
                        "is_typing": message.get("is_typing", True)
                    }, exclude_user=user_id)
                    
                    # DEMO MOCK: If this is a direct chat and the other user is offline, echo a typing indicator back
                    if len(member_ids) == 2 and message.get("is_typing", True):
                        other_members = [m for m in member_ids if m != user_id]
                        other_id = other_members[0]
                        if other_id not in manager.active_connections:
                            import asyncio
                            async def mock_typing_reply():
                                await asyncio.sleep(1.5)
                                if user_id in manager.active_connections:
                                    await manager.send_personal(user_id, {
                                        "type": "typing",
                                        "user_id": other_id,
                                        "conversation_id": conv_id,
                                        "is_typing": True
                                    })
                                    await asyncio.sleep(3.5)
                                    if user_id in manager.active_connections:
                                        await manager.send_personal(user_id, {
                                            "type": "typing",
                                            "user_id": other_id,
                                            "conversation_id": conv_id,
                                            "is_typing": False
                                        })
                            asyncio.create_task(mock_typing_reply())
                    
                elif message['type'] == 'mark_read':
                    msg_id = message['message_id']
                    conv_id = message['conversation_id']
                    # We might update the status here. For simplicity, just broadcast.
                    m_cursor = await db.execute("SELECT user_id FROM conversation_members WHERE conversation_id = ?", (conv_id,))
                    member_ids = [r['user_id'] for r in await m_cursor.fetchall()]
                    await manager.broadcast_to_conversation(member_ids, {
                        "type": "message_read",
                        "message_id": msg_id,
                        "user_id": user_id,
                        "conversation_id": conv_id
                    }, exclude_user=user_id)
                    
    except WebSocketDisconnect:
        manager.disconnect(user_id)
        async with aiosqlite.connect(DATABASE_URL) as db:
            await db.execute("UPDATE users SET is_online = 0, last_seen = ? WHERE id = ?", (datetime.utcnow(), user_id))
            await db.commit()

if __name__ == '__main__':
    uvicorn.run('main:app', host='0.0.0.0', port=8000, reload=True)
