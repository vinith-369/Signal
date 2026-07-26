import sqlite3

db = sqlite3.connect('/Users/vinithlankireddy/Projects/Scaler/backend/signal_clone.db')

try:
    db.execute("ALTER TABLE conversation_members ADD COLUMN is_deleted INT DEFAULT 0")
except Exception as e:
    print(e)
    
try:
    db.execute("ALTER TABLE conversation_members ADD COLUMN cleared_at TIMESTAMP")
except Exception as e:
    print(e)

try:
    db.execute("ALTER TABLE conversation_members ADD COLUMN is_archived INT DEFAULT 0")
except Exception as e:
    print(e)
    
try:
    db.execute("ALTER TABLE conversation_members ADD COLUMN is_pinned INT DEFAULT 0")
except Exception as e:
    print(e)

cursor = db.cursor()
cursor.execute("SELECT id FROM users WHERE username = 'vinith' OR display_name LIKE '%vinith%' COLLATE NOCASE")
user_row = cursor.fetchone()
if user_row:
    vinith_id = user_row[0]
    print(f"Vinith ID: {vinith_id}")
    
    # The user asked to "delete the archiced chats data in user vinith"
    cursor.execute("""
        SELECT c.id FROM conversations c 
        WHERE c.is_archived = 1 OR c.is_archived = '1' OR c.is_archived = 'true'
    """)
    archived_convs = cursor.fetchall()
    
    for (conv_id,) in archived_convs:
        # Just to be safe, only delete if Vinith is a member
        cursor.execute("SELECT 1 FROM conversation_members WHERE conversation_id = ? AND user_id = ?", (conv_id, vinith_id))
        if cursor.fetchone():
            db.execute("DELETE FROM messages WHERE conversation_id = ?", (conv_id,))
            db.execute("DELETE FROM conversation_members WHERE conversation_id = ?", (conv_id,))
            db.execute("DELETE FROM conversations WHERE id = ?", (conv_id,))
            print(f"Deleted archived conv: {conv_id}")
            
db.commit()
print("Done DB updates.")
