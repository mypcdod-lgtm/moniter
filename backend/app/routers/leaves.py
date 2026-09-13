from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from app.core.security import get_current_user, require_role
from app.db.mongo import get_db
from app.models.leave import LeaveRequestCreate, LeaveApprovalRequest, LeaveResponse
from app.services.notification_service import dispatch_notification
from app.core.websocket_manager import ws_manager
import uuid
import datetime

router = APIRouter(prefix="/leaves", tags=["Leaves"])

@router.get("", response_model=List[LeaveResponse])
async def list_leaves(department: Optional[str] = None, status: Optional[str] = None, db = Depends(get_db)):
    query = {}
    if department:
        query["department"] = department
    if status:
        query["status"] = status
    return await db["leave_requests"].find(query).to_list(100)

@router.post("", response_model=LeaveResponse)
async def submit_leave(payload: LeaveRequestCreate, db = Depends(get_db), current_user = Depends(get_current_user)):
    doc = {
        "_id": str(uuid.uuid4()),
        "teacher_name": payload.teacher_name or current_user.get("name", "Teacher"),
        "department": payload.department,
        "date": payload.date,
        "periods": payload.periods,
        "reason": payload.reason,
        "status": "pending",
        "substitute_teacher": None,
        "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    await db["leave_requests"].insert_one(doc)

    # Notify HOD via WebSocket and notifications
    await dispatch_notification(
        db=db,
        title="New Leave Request",
        message=f"{doc['teacher_name']} requested leave on {payload.date} (Periods: {payload.periods}). Reason: {payload.reason}",
        notification_type="alert",
        department=payload.department
    )
    return doc

@router.put("/{leave_id}/review", response_model=LeaveResponse)
async def review_leave(leave_id: str, payload: LeaveApprovalRequest, db = Depends(get_db), current_user = Depends(require_role(["admin", "hod"]))):
    leave = await db["leave_requests"].find_one({"_id": leave_id})
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    update = {"status": payload.status}
    if payload.substitute_teacher:
        update["substitute_teacher"] = payload.substitute_teacher

    await db["leave_requests"].update_one({"_id": leave_id}, {"$set": update})
    
    # If approved, mark corresponding active live sessions as VACANT or SUBSTITUTE
    if payload.status == "approved":
        t_name = leave.get("teacher_name")
        new_status = "SUBSTITUTE" if payload.substitute_teacher else "VACANT"
        all_sessions = await db["live_sessions"].find({"teacher": t_name}).to_list(20)
        for s in all_sessions:
            await db["live_sessions"].update_one(
                {"_id": s["_id"]},
                {"$set": {"status": new_status, "substitute": payload.substitute_teacher}}
            )
        # Broadcast HOD table update
        await ws_manager.broadcast_to_room(leave.get("department", "Information Technology"), {
            "type": "LEAVE_APPROVED",
            "teacher": t_name,
            "status": new_status,
            "substitute": payload.substitute_teacher
        })

    # Dispatch notification to teacher
    await dispatch_notification(
        db=db,
        title=f"Leave {payload.status.title()}",
        message=f"Your leave request for {leave.get('date')} has been {payload.status} by HOD.",
        notification_type="success" if payload.status == "approved" else "warning",
        department=leave.get("department")
    )

    return await db["leave_requests"].find_one({"_id": leave_id})
