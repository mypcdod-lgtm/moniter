import datetime
import uuid
from typing import Dict, Any, Optional
from app.core.websocket_manager import ws_manager

async def dispatch_notification(
    db,
    title: str,
    message: str,
    notification_type: str = "info",
    user_id: Optional[str] = None,
    department: Optional[str] = None,
    data: Optional[Dict[str, Any]] = None
):
    notif_doc = {
        "_id": str(uuid.uuid4()),
        "user_id": user_id,
        "department": department,
        "title": title,
        "message": message,
        "type": notification_type,
        "is_read": False,
        "data": data or {},
        "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    await db["notifications"].insert_one(notif_doc)

    # Broadcast real-time push notification
    payload = {
        "type": "NOTIFICATION",
        "data": {
            "id": notif_doc["_id"],
            "title": title,
            "message": message,
            "type": notification_type,
            "created_at": notif_doc["created_at"]
        }
    }
    if user_id:
        await ws_manager.send_to_user(user_id, payload)
    if department:
        await ws_manager.broadcast_to_room(department, payload)
