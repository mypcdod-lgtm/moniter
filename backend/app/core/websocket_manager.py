from fastapi import WebSocket
from typing import Dict, Set, Any
import logging

logger = logging.getLogger("ws_manager")

class ConnectionManager:
    def __init__(self):
        # Room-partitioned WebSockets: department -> set(WebSocket)
        self.active_rooms: Dict[str, Set[WebSocket]] = {}
        # User-specific notification WebSockets: user_id -> set(WebSocket)
        self.user_connections: Dict[str, Set[WebSocket]] = {}

    async def connect_room(self, websocket: WebSocket, room: str):
        await websocket.accept()
        if room not in self.active_rooms:
            self.active_rooms[room] = set()
        self.active_rooms[room].add(websocket)

    def disconnect_room(self, websocket: WebSocket, room: str):
        if room in self.active_rooms:
            self.active_rooms[room].discard(websocket)
            if not self.active_rooms[room]:
                del self.active_rooms[room]

    async def broadcast_to_room(self, room: str, message: dict):
        if room not in self.active_rooms:
            return
        dead = set()
        for ws in self.active_rooms[room]:
            try:
                await ws.send_json(message)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.disconnect_room(ws, room)

    async def connect_user(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        self.user_connections[user_id].add(websocket)

    def disconnect_user(self, websocket: WebSocket, user_id: str):
        if user_id in self.user_connections:
            self.user_connections[user_id].discard(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]

    async def send_to_user(self, user_id: str, message: dict):
        if user_id not in self.user_connections:
            return
        dead = set()
        for ws in self.user_connections[user_id]:
            try:
                await ws.send_json(message)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.disconnect_user(ws, user_id)

ws_manager = ConnectionManager()
