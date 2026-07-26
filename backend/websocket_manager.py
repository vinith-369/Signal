from fastapi import WebSocket
from typing import Dict, Any, List

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal(self, user_id: str, data: Any):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(data)
            except Exception:
                pass # Connection might be closed

    async def broadcast_to_conversation(self, member_ids: List[str], data: Any, exclude_user: str = None):
        for member_id in member_ids:
            if member_id != exclude_user:
                await self.send_personal(member_id, data)

manager = ConnectionManager()
