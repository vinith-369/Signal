# Signal Clone - Comprehensive Interview & Project Guide

This document is your ultimate "cheat sheet" for the Signal Clone project. If you read and understand everything here, you will be able to answer any question about how the app was built, how it works under the hood, and what design decisions were made.

---

## 1. High-Level Architecture
The project is split into a separated Frontend and Backend, communicating via RESTful APIs and WebSockets.
- **Frontend**: Built with **Next.js 14** (React) using TypeScript. It uses pure CSS (Vanilla CSS in `globals.css`) for high-fidelity styling without relying on Tailwind.
- **Backend**: Built with **FastAPI** (Python). Chosen for its extreme speed and native, built-in support for asynchronous programming (`async/await`) and WebSockets.
- **Database**: **SQLite** (using the `aiosqlite` library). We use `aiosqlite` so that database reads/writes don't block the Python event loop, allowing the server to handle thousands of concurrent WebSocket connections efficiently.

---

## 2. Authentication Flow (How Login Works)
- **Registration**: When a user registers, we hash their password using `bcrypt` (never store plain-text passwords!) and insert them into the `users` table. We enforce strictly unique usernames.
- **Login**: We use **JWT (JSON Web Tokens)**. When a user logs in with the correct username/password, the backend generates a JWT token signed with a secret key.
- **Storage**: The frontend receives this token and stores it in the browser's `localStorage` as `signal_token`.
- **Security**: For every private API request, the frontend sends this token in the HTTP `Authorization: Bearer <token>` header.
- **Session Time**: The token is configured in `backend/auth.py` to expire after 7 days (`ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7`).

---

## 3. Real-Time WebSockets (The Heart of the Chat)
Instead of the frontend constantly asking the server "Are there new messages?" (Polling), we use a WebSocket connection to keep an open, two-way tunnel between the browser and the server.

- **`ConnectionManager`**: In `websocket_manager.py`, we created a class that keeps a dictionary of all online users (`active_connections: dict[str, WebSocket]`). 
- When a user sends a message, the server saves it to the database, looks up the other user's ID in the `active_connections` dictionary, and instantly pushes the message down the socket to them.
- **Types of WebSocket Events**: We handle `new_message`, `typing` (is typing / stopped typing), `message_update` (delivered/read checkmarks), and `message_deleted`.

---

## 4. The Database Schema (Tables)
The backend uses a relational database model in `database.py`:
- `users`: Stores user info, hashed password, and an auto-assigned random avatar color.
- `contacts`: A mapping table linking a `user_id` to a `contact_id`.
- `conversations`: Stores the chat rooms. Contains a `type` column (`direct` or `group`).
- `conversation_members`: Links users to conversations. This handles Group Chats easily because a group is just a conversation with multiple rows in this table.
- `messages`: Stores the actual chat messages, the `sender_id`, the text content, and the current `status` (sent/delivered/read).

---

## 5. Clever "Demo" Features (Simulations)
Because it's hard to demonstrate a chat app by yourself during an interview, we added clever background tasks (`asyncio.create_task`) to simulate another person on the other end:
1. **Auto-Updating Checkmarks**: When you send a message, it is marked as `sent` (✓). The server waits **10 seconds** and automatically pushes a `delivered` (✓✓) WebSocket event. After **20 seconds**, it pushes a `read` (blue ✓✓) event.
2. **AI Mock Typing**: If you start typing a message, the server checks if the other person is online. If they are offline, the server waits **2 seconds** and then sends you a WebSocket event saying *they* are typing back! This lasts for **4 seconds** before turning off.
3. **Delayed Delete**: When you "Delete for everyone", it instantly disappears from your screen, but the backend waits **2 seconds** before sending the WebSocket event to delete it on the other person's screen.

*All of these timers can be found and easily tweaked in `backend/main.py`.*

---

## 6. Key Frontend Components
- **State Management**: We rely heavily on React Hooks (`useState`, `useEffect`, `useCallback`, `useRef`). 
- **`ws.onMessage`**: In `page.tsx`, we have a master listener. If a message arrives, it either appends it to the currently open chat, OR if it's from a brand new chat, it silently calls `api.getConversations()` in the background to refresh the sidebar.
- **Infinite Scrolling**: When you scroll to the top of a chat, we fire `api.getMessages` to load older messages. We use a `loadingMoreRef` to ensure we don't accidentally fire the API 50 times if the user scrolls too fast.

---

## 7. Common Interview Questions & How to Answer Them

**Q: Why did you use SQLite instead of PostgreSQL or MongoDB?**
> A: "For this assignment, I chose SQLite because it allows the project to be completely self-contained and perfectly portable without requiring complex Docker setups or external database hosting. However, because I used the `aiosqlite` library and standard SQL queries, swapping to PostgreSQL for a production environment would be virtually seamless."

**Q: How do you handle scalability with WebSockets?**
> A: "Right now, the `ConnectionManager` stores active websockets in the server's local RAM. If we needed to scale to multiple servers, local RAM wouldn't work (User A might connect to Server 1, and User B to Server 2). To solve this, I would introduce **Redis Pub/Sub**. When Server 1 receives a message, it publishes it to Redis, and Server 2 subscribes and forwards it to User B."

**Q: Why did you choose Next.js and FastAPI?**
> A: "Next.js provides an incredible developer experience with its App Router, built-in optimization, and easy deployment on Vercel. I chose FastAPI for the backend because it is extremely fast, automatically generates Swagger documentation, and has native, first-class support for WebSockets, which is the most critical part of a chat application."

**Q: How did you handle the "Delete for Everyone" logic safely?**
> A: "When a user requests a deletion, the backend first verifies they are the actual `sender_id` of the message. If they are, it deletes the row from the `messages` table and broadcasts a `message_deleted` WebSocket event to all members of that specific `conversation_id` so their UI updates instantly."
