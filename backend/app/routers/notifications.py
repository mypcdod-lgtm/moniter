from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from app.core.security import get_current_user
from app.db.mongo import get_db
from app.models.notification import NotificationResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationResponse])
async def list_notifications(department: Optional[str] = "Information Technology", db = Depends(get_db)):
    cursor = db["notifications"].find({"department": department})
    return await cursor.to_list(50)

@router.put("/{notif_id}/read")
async def mark_read(notif_id: str, db = Depends(get_db)):
    await db["notifications"].update_one({"_id": notif_id}, {"$set": {"is_read": True}})
    return {"status": "success"}

@router.put("/read-all")
async def mark_all_read(department: str = "Information Technology", db = Depends(get_db)):
    all_notifs = await db["notifications"].find().to_list(100)
    for n in all_notifs:
        await db["notifications"].update_one({"_id": n["_id"]}, {"$set": {"is_read": True}})
    return {"status": "success"}
