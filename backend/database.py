import os
import aiosqlite
from datetime import datetime, timedelta
from auth import get_password_hash
import uuid

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
default_db_path = os.path.join(BASE_DIR, "signal_clone.db")

DATABASE_URL = os.environ.get("DATABASE_URL", default_db_path)
if "://" in DATABASE_URL:
    if DATABASE_URL.startswith("sqlite:///"):
        DATABASE_URL = DATABASE_URL.replace("sqlite:///", "")
    else:
        # Render sometimes auto-injects Postgres URLs, but this app uses SQLite
        DATABASE_URL = default_db_path

async def get_db():
    db = await aiosqlite.connect(DATABASE_URL)
    db.row_factory = aiosqlite.Row
    try:
        yield db
    finally:
        await db.close()

async def init_db():
    async with aiosqlite.connect(DATABASE_URL) as db:
        await db.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE,
            display_name TEXT,
            phone TEXT UNIQUE,
            avatar_color TEXT DEFAULT '#7C3AED',
            avatar_url TEXT,
            about TEXT,
            password_hash TEXT,
            is_online INT DEFAULT 0,
            last_seen TIMESTAMP,
            created_at TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS contacts (
            user_id TEXT,
            contact_id TEXT,
            created_at TIMESTAMP,
            PRIMARY KEY(user_id, contact_id)
        );
        
        CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            type TEXT CHECK(type IN ('direct','group')),
            name TEXT,
            avatar_url TEXT,
            created_by TEXT,
            is_pinned INT DEFAULT 0,
            is_archived INT DEFAULT 0,
            is_muted INT DEFAULT 0,
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS conversation_members (
            conversation_id TEXT,
            user_id TEXT,
            role TEXT CHECK(role IN ('admin','member')) DEFAULT 'member',
            unread_count INT DEFAULT 0,
            joined_at TIMESTAMP,
            PRIMARY KEY(conversation_id, user_id)
        );
        
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            conversation_id TEXT,
            sender_id TEXT,
            content TEXT,
            message_type TEXT CHECK(message_type IN ('text','system','image')) DEFAULT 'text',
            status TEXT CHECK(status IN ('sending','sent','delivered','read')) DEFAULT 'sent',
            created_at TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS message_receipts (
            message_id TEXT,
            user_id TEXT,
            status TEXT CHECK(status IN ('delivered','read')) DEFAULT 'delivered',
            timestamp TIMESTAMP,
            PRIMARY KEY(message_id, user_id)
        );
        """)
        await db.commit()
        # await seed_data(db)

# async def seed_data(db):
#     cursor = await db.execute("SELECT count(*) FROM users")
#     count = (await cursor.fetchone())[0]
#     if count > 0:
#         return # already seeded
    
#     password_hash = get_password_hash('123456')
#     now = datetime.utcnow()
    
#     users = [
#         ('1', 'vinith', 'Vinith Reddy', '079956 60947', '#D4C5A9'),
#         ('2', 'omkar_m', 'omkar manikanta', '0000000002', '#7C3AED'),
#         ('3', 'omkar_r', 'omkar reddy', '0000000003', '#4CAF50'),
#         ('4', 'sai_teja', 'Sai Teja', '0000000004', '#9E9E9E'),
#         ('5', 'harsh', 'Harsh', '0000000005', '#F44336'),
#         ('6', 'priya', 'Priya Sharma', '0000000006', '#E91E63'),
#     ]
    
#     for u in users:
#         await db.execute("""
#             INSERT INTO users (id, username, display_name, phone, avatar_color, password_hash, created_at)
#             VALUES (?, ?, ?, ?, ?, ?, ?)
#         """, (u[0], u[1], u[2], u[3], u[4], password_hash, now))
        
#     # Contacts
#     for i in range(2, 7):
#         await db.execute("INSERT INTO contacts (user_id, contact_id, created_at) VALUES (?, ?, ?)", ('1', str(i), now))
#         await db.execute("INSERT INTO contacts (user_id, contact_id, created_at) VALUES (?, ?, ?)", (str(i), '1', now))
        
#     def create_conv(id, type, members, msgs):
#         return {
#             'id': id,
#             'type': type,
#             'members': members,
#             'messages': msgs
#         }
        
#     convs = [
#         create_conv('c1', 'direct', ['1', '2'], [
#             ('1', 'Hey Omkar, how are you?'),
#             ('2', 'I am good, Vinith! You?'),
#             ('1', 'Doing well.'),
#             ('2', 'Are we still meeting later?'),
#             ('1', 'Yes, around 5 PM.'),
#             ('2', 'Cool, see you then.'),
#             ('1', 'Bring the documents.'),
#             ('2', 'Will do!'),
#         ]),
#         create_conv('c2', 'direct', ['1', '3'], [
#             ('1', 'Hey Omkar R!'),
#             ('3', 'Hello Vinith!'),
#             ('1', 'Did you finish the task?'),
#             ('3', 'Almost done, give me 10 mins.'),
#             ('1', 'Awesome.'),
#         ]),
#         create_conv('c3', 'direct', ['1', '4'], [
#             ('4', 'Vinith, are you there?'),
#             ('1', 'Yes, what is up?'),
#             ('4', 'Need some help with the API.'),
#         ])
#     ]
    
#     for c in convs:
#         await db.execute("INSERT INTO conversations (id, type, created_at, updated_at) VALUES (?, ?, ?, ?)", (c['id'], c['type'], now, now))
#         for m in c['members']:
#             await db.execute("INSERT INTO conversation_members (conversation_id, user_id, joined_at) VALUES (?, ?, ?)", (c['id'], m, now))
        
#         msg_time = now - timedelta(minutes=60)
#         for i, m in enumerate(c['messages']):
#             msg_id = str(uuid.uuid4())
#             await db.execute("INSERT INTO messages (id, conversation_id, sender_id, content, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
#                 (msg_id, c['id'], m[0], m[1], 'read', msg_time + timedelta(minutes=i*2)))
#             await db.execute("UPDATE conversations SET updated_at = ? WHERE id = ?", (msg_time + timedelta(minutes=i*2), c['id']))
            
#     # Group conv
#     group_id = 'c4'
#     await db.execute("INSERT INTO conversations (id, type, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)", (group_id, 'group', 'Team', now, now))
#     for m in ['1', '2', '3', '4']:
#         await db.execute("INSERT INTO conversation_members (conversation_id, user_id, joined_at) VALUES (?, ?, ?)", (group_id, m, now))
        
#     team_msgs = [
#         ('1', 'Welcome to the team group!'),
#         ('2', 'Thanks!'),
#         ('3', 'Hello everyone.'),
#         ('4', 'Hi!'),
#         ('1', 'Let us discuss the project now.'),
#     ]
#     msg_time = now - timedelta(minutes=30)
#     for i, m in enumerate(team_msgs):
#         msg_id = str(uuid.uuid4())
#         await db.execute("INSERT INTO messages (id, conversation_id, sender_id, content, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
#             (msg_id, group_id, m[0], m[1], 'read', msg_time + timedelta(minutes=i)))
#         await db.execute("UPDATE conversations SET updated_at = ? WHERE id = ?", (msg_time + timedelta(minutes=i), group_id))
        
#     await db.commit()
