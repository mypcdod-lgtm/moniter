from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from app.core.security import require_role
from app.db.mongo import get_db
from app.services.substitution_finder import find_available_substitutes
from app.core.websocket_manager import ws_manager
from app.services.notification_service import dispatch_notification

router = APIRouter(prefix="/substitution", tags=["Substitution"])

class AssignSubstituteRequest(BaseModel):
    session_id: str
    substitute_teacher: str
    department: str = "Information Technology"

@router.get("/find")
async def get_available_substitutes(time: str = "10:00 - 11:00", department: str = "Information Technology", db = Depends(get_db)):
    teachers = await db["teachers"].find({"department": department}).to_list(100)
    sessions = await db["live_sessions"].find({"department": department}).to_list(100)
    return find_available_substitutes(all_teachers=teachers, active_sessions=sessions, target_time=time)

@router.post("/assign")
async def assign_substitute(payload: AssignSubstituteRequest, db = Depends(get_db), current_user = Depends(require_role(["admin", "hod"]))):
    session = await db["live_sessions"].find_one({"_id": payload.session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Live session not found")

    await db["live_sessions"].update_one(
        {"_id": payload.session_id},
        {"$set": {"status": "SUBSTITUTE", "substitute": payload.substitute_teacher}}
    )

    # Broadcast live status update to HOD monitoring table
    await ws_manager.broadcast_to_room(payload.department, {
        "type": "SUBSTITUTE_ASSIGNED",
        "session_id": payload.session_id,
        "class_name": session.get("class_name"),
        "subject": session.get("subject"),
        "substitute": payload.substitute_teacher,
        "status": "SUBSTITUTE"
    })

    # Send in-app notification
    await dispatch_notification(
        db=db,
        title="Substitute Class Assigned",
        message=f"You have been assigned as substitute teacher for {session.get('class_name')} ({session.get('subject')}) in Room {session.get('room')}.",
        notification_type="alert",
        department=payload.department
    )

    return {"message": f"Assigned {payload.substitute_teacher} to {session.get('class_name')}", "status": "SUBSTITUTE"}
