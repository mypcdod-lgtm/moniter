from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from typing import Optional
from app.core.websocket_manager import ws_manager
from app.core.config import settings
import logging

logger = logging.getLogger("ws_router")
router = APIRouter(tags=["WebSockets"])

async def authenticate_ws(websocket: WebSocket, token: Optional[str]) -> Optional[dict]:
    """Verify Firebase ID token for WebSocket connections"""
    if not token:
        if settings.DEV_MODE:
            return {"uid": "dev-user", "role": "admin", "email": "dev.user@college.edu"}
        logger.warning("[WS] Connection rejected: Missing authentication token")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Missing authentication token")
        return None

    if settings.DEV_MODE and token.startswith("dev-"):
        role = token.replace("dev-", "").lower()
        return {"uid": f"dev-{role}", "role": role, "email": f"{role}@college.edu"}

    if token.startswith("dev-") and not settings.DEV_MODE:
        logger.warning("[WS] Connection rejected: Dev tokens forbidden in production")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Developer bypass tokens forbidden in production")
        return None

    try:
        from firebase_admin import auth
        decoded = auth.verify_id_token(token)
        return decoded
    except Exception as e:
        logger.warning(f"[WS] Token verification failed: {e}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason=f"Invalid or expired token: {str(e)}")
        return None

@router.websocket("/ws/live/{department}")
async def websocket_live_monitoring(websocket: WebSocket, department: str, token: Optional[str] = Query(None)):
    """Real-time live class monitoring channel for verified HODs and Teachers"""
    user = await authenticate_ws(websocket, token)
    if not user:
        return

    await ws_manager.connect_room(websocket, department)
    try:
        while True:
            # Heartbeat / ping listener
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect_room(websocket, department)

@router.websocket("/ws/notifications/{user_id}")
async def websocket_notifications(websocket: WebSocket, user_id: str, token: Optional[str] = Query(None)):
    """Personal real-time notification push stream with JWT identity verification"""
    user = await authenticate_ws(websocket, token)
    if not user:
        return

    # Anti-Spoofing Guard: Ensure client cannot listen to another user's personal alerts
    if not settings.DEV_MODE:
        auth_uid = user.get("uid")
        auth_email = (user.get("email") or "").lower()
        target_id = user_id.lower()
        if target_id != auth_email and target_id != str(auth_uid).lower():
            logger.warning(f"[WS] Identity spoofing prevented: token is for '{auth_email}', but connection requested stream for '{user_id}'")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="User ID does not match authenticated token identity")
            return

    await ws_manager.connect_user(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect_user(websocket, user_id)
