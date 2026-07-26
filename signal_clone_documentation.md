# Signal Clone Documentation

This document covers the complete implementation details of your Signal clone, including the database schema, backend architecture, how to connect to the database, and instructions for deploying the application on Render.

## 1. What We Have Implemented

We have built a fully functional end-to-end Signal Messenger clone with a strict adherence to Signal's dark theme design and core messaging workflows.

### **Frontend (Next.js & React)**
- **Pixel-perfect Signal UI**: Implemented standard Signal components like the Icon Rail, Sidebar with chats/settings/calls, dynamic Chat Pane, Profile Cards, and interactive Message Bubbles.
- **Strict CSS Architecture**: Created a comprehensive, 1000+ line `globals.css` file utilizing CSS variables to strictly map Signal's design system tokens (e.g., `--msg-sent: #2C6BED`, `--chat-pane-bg: #121316`).
- **Real-time State**: Used a custom `WebSocketClient` class coupled with React hooks to manage live typing indicators, online statuses, and real-time message delivery/read receipts.
- **Auth Flow**: Built Signal-style Login and Registration pages that interface with a JWT-based authentication system.

### **Backend (FastAPI & SQLite)**
- **Async API**: Built a high-performance backend using FastAPI and `aiosqlite`.
- **WebSocket Manager**: Engineered a robust real-time communication hub capable of broadcasting `new_message`, `typing`, `message_delivered`, `message_read`, `user_online`, and `user_offline` events.
- **REST Endpoints**: Comprehensive CRUD API for managing Users, Contacts, Groups, Conversations, and Messages.

---

## 2. Database Schema

The database utilizes SQLite asynchronously (`aiosqlite`). Here is the complete schema we implemented:

### `users`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | TEXT (PK) | UUID identifying the user |
| `username` | TEXT (Unique) | Unique identifier for the user |
| `display_name` | TEXT | The name shown in the UI |
| `phone_number` | TEXT (Unique) | The user's phone number |
| `password_hash` | TEXT | Securely hashed password |
| `avatar_color` | TEXT | Hex color for fallback avatar |
| `avatar_url` | TEXT | Optional URL for an uploaded avatar image |
| `about` | TEXT | User's bio/status message |
| `is_online` | BOOLEAN | Real-time connection status |
| `last_seen` | TIMESTAMP | Timestamp of the user's last activity |

### `contacts`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | TEXT (PK) | UUID for the contact relationship |
| `user_id` | TEXT (FK) | ID of the user who owns the contact list |
| `contact_user_id` | TEXT (FK)| ID of the user being added as a contact |
| `created_at` | TIMESTAMP | When the contact was added |

### `conversations`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | TEXT (PK) | UUID for the chat |
| `type` | TEXT | `direct` or `group` |
| `name` | TEXT | Optional group name |
| `avatar_url` | TEXT | Optional group avatar image |
| `created_at` | TIMESTAMP | When the chat was created |
| `updated_at` | TIMESTAMP | Last time the chat was active |

### `conversation_members`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | TEXT (PK) | UUID for the membership record |
| `conversation_id`| TEXT (FK) | ID of the chat |
| `user_id` | TEXT (FK) | ID of the member |
| `role` | TEXT | `admin` or `member` |
| `joined_at` | TIMESTAMP | When the user joined the chat |

### `messages`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | TEXT (PK) | UUID for the message |
| `conversation_id`| TEXT (FK) | ID of the chat the message belongs to |
| `sender_id` | TEXT (FK) | ID of the user who sent it |
| `content` | TEXT | The actual message text |
| `message_type` | TEXT | `text`, `image`, or `system` |
| `status` | TEXT | `sent`, `delivered`, or `read` |
| `created_at` | TIMESTAMP | Send timestamp |
| `delivered_at` | TIMESTAMP | Delivery timestamp |
| `read_at` | TIMESTAMP | Read timestamp |

---

## 3. How to Connect to the Database

Because this project uses SQLite, your database is simply a file on the disk (e.g., `signal_clone.db`).

### **In Development**
The backend automatically creates and connects to the SQLite file based on the `DATABASE_URL` environment variable. By default, it connects to a local file:
```env
DATABASE_URL=sqlite+aiosqlite:///./signal_clone.db
```
When you run `python main.py` or `uvicorn main:app`, the `database.py` script automatically runs the `CREATE TABLE IF NOT EXISTS` commands to initialize the schema if it doesn't exist.

### **Connecting Manually (CLI)**
To inspect the database manually during development, you can use the standard SQLite command line tool:
```bash
sqlite3 backend/signal_clone.db
```
*Example queries:*
```sql
sqlite> .tables
sqlite> SELECT username, is_online FROM users;
```

---

## 4. Deployment Instructions (Render)

Render is an excellent platform for deploying this stack. You will deploy the Backend as a "Web Service" and the Frontend as a "Static Site" (or Next.js Web Service).

### **Step 1: Deploy the Backend (FastAPI)**
1. In the Render Dashboard, click **New +** and select **Web Service**.
2. Connect your GitHub repository.
3. Configure the settings:
   - **Name**: `signal-clone-api`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variables:
   - `JWT_SECRET_KEY`: Generate a random secure string (e.g., `openssl rand -hex 32`)
   - `DATABASE_URL`: `sqlite+aiosqlite:///./data/signal_clone.db`
5. **CRITICAL FOR SQLITE**: SQLite is file-based. On a PaaS like Render, the disk is ephemeral and wipes on every deploy. To prevent data loss, you must attach a **Disk**:
   - Go to the **Disks** section in your Web Service settings.
   - Name: `sqlite-data`
   - Mount Path: `/opt/render/project/src/backend/data`
   - Size: 1GB

### **Step 2: Deploy the Frontend (Next.js)**
1. Go to the Render Dashboard, click **New +** and select **Web Service** (Next.js requires a Node server for API routes/SSR, so don't choose Static Site unless you use `next export`).
2. Connect the same GitHub repository.
3. Configure the settings:
   - **Name**: `signal-clone-web`
   - **Root Directory**: `frontend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
4. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL`: The URL of your deployed Render backend (e.g., `https://signal-clone-api.onrender.com`)
   - `NEXT_PUBLIC_WS_URL`: The WebSocket URL of your deployed backend (e.g., `wss://signal-clone-api.onrender.com`)
5. Click **Deploy**.

Once both services are live, open your Next.js frontend URL, and your Signal Clone will be fully operational in the cloud!
