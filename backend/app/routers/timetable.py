from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from app.core.security import require_role
from app.db.mongo import get_db
from app.models.timetable import TimetableGenerateRequest, TimetableResponse
from app.services.timetable_solver import generate_timetable_schedule
from app.core.websocket_manager import ws_manager
import uuid
import datetime

router = APIRouter(prefix="/timetable", tags=["Timetable"])

@router.get("/versions", response_model=List[TimetableResponse])
async def list_timetable_versions(department: Optional[str] = None, db = Depends(get_db)):
    query = {}
    if department:
        query["department"] = department
    return await db["timetables"].find(query).to_list(20)

@router.get("/active", response_model=Optional[TimetableResponse])
async def get_active_timetable(department: str = "Information Technology", db = Depends(get_db)):
    doc = await db["timetables"].find_one({"department": department, "status": "ACTIVE"})
    if not doc:
        # Fallback to any active
        doc = await db["timetables"].find_one({"status": "ACTIVE"})
    return doc

@router.post("/generate", response_model=TimetableResponse)
async def generate_timetable(payload: TimetableGenerateRequest, db = Depends(get_db), current_user = Depends(require_role(["admin"]))):
    teachers = await db["teachers"].find({"department": payload.department}).to_list(100)
    subjects = await db["subjects"].find({"department": payload.department}).to_list(100)
    rooms = await db["rooms"].find({"department": payload.department}).to_list(100)

    # Run Solver
    slots = generate_timetable_schedule(
        teachers=teachers,
        subjects=subjects,
        rooms=rooms,
        sections=payload.sections,
        days=payload.days,
        periods_per_day=payload.periods_per_day or 7
    )

    # Generate version string based on current count
    count = len(await db["timetables"].find().to_list(100))
    version_str = f"v3.{count + 1}"

    timetable_doc = {
        "_id": str(uuid.uuid4()),
        "version": version_str,
        "status": "DRAFT",
        "term": payload.term,
        "department": payload.department,
        "generated_by": "OR-Tools Constraint Engine v2",
        "applied_at": None,
        "slots": slots
    }
    await db["timetables"].insert_one(timetable_doc)
    return timetable_doc

@router.put("/{timetable_id}/apply")
async def apply_timetable(timetable_id: str, db = Depends(get_db), current_user = Depends(require_role(["admin"]))):
    target = await db["timetables"].find_one({"_id": timetable_id})
    if not target:
        raise HTTPException(status_code=404, detail="Timetable version not found")

    dept = target.get("department", "Information Technology")
    
    # Archive existing active
    all_tt = await db["timetables"].find().to_list(100)
    for tt in all_tt:
        if tt.get("status") == "ACTIVE" and tt.get("department") == dept:
            await db["timetables"].update_one({"_id": tt["_id"]}, {"$set": {"status": "ARCHIVED"}})

    # Activate selected version
    applied_time = datetime.datetime.now().strftime("%d %b %Y, %I:%M %p")
    await db["timetables"].update_one(
        {"_id": timetable_id},
        {"$set": {"status": "ACTIVE", "applied_at": applied_time}}
    )

    # Broadcast update to HODs and Teachers via WebSocket
    await ws_manager.broadcast_to_room(dept, {
        "type": "TIMETABLE_APPLIED",
        "version": target.get("version"),
        "applied_at": applied_time,
        "department": dept
    })

    return {"message": f"Timetable {target.get('version')} applied campus-wide!", "applied_at": applied_time}
