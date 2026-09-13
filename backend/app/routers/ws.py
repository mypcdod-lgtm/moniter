from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.websocket_manager import ws_manager
import logging

logger = logging.getLogger("ws_router")
router = APIRouter(tags=["WebSockets"])

@router.websocket("/ws/live/{department}")
async def websocket_live_monitoring(websocket: WebSocket, department: str):
    """Real-time live class monitoring channel for HODs and Teachers"""
    await ws_manager.connect_room(websocket, department)
    try:
        while True:
            # Heartbeat / ping listener
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect_room(websocket, department)

@router.websocket("/ws/notifications/{user_id}")
async def websocket_notifications(websocket: WebSocket, user_id: str):
    """Personal real-time notification push stream"""
    await ws_manager.connect_user(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect_user(websocket, user_id)
