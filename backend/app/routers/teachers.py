from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from app.core.security import require_role, get_current_user
from app.db.mongo import get_db
from app.models.teacher import TeacherCreate, TeacherUpdate, TeacherResponse
import uuid

router = APIRouter(prefix="/teachers", tags=["Teachers"])

@router.get("", response_model=List[TeacherResponse])
async def list_teachers(department: Optional[str] = None, status: Optional[str] = None, db = Depends(get_db)):
    query = {}
    if department:
        query["department"] = department
    if status:
        query["status"] = status
    teachers = await db["teachers"].find(query).to_list(100)
    return teachers

@router.post("", response_model=TeacherResponse)
async def create_teacher(payload: TeacherCreate, db = Depends(get_db), current_user = Depends(require_role(["admin", "hod"]))):
    existing = await db["teachers"].find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Teacher with this email already exists.")
    
    doc = {
        "_id": str(uuid.uuid4()),
        "name": payload.name,
        "email": payload.email.lower(),
        "department": payload.department,
        "subject": payload.subject,
        "workload": payload.workload,
        "status": payload.status or "Available"
    }
    await db["teachers"].insert_one(doc)

    fb_uid = None
    if payload.password:
        try:
            import firebase_admin
            from firebase_admin import auth as fb_auth
            try:
                fb_user = fb_auth.get_user_by_email(payload.email.lower())
                fb_uid = fb_user.uid
            except Exception:
                fb_user = fb_auth.create_user(
                    email=payload.email.lower(),
                    password=payload.password,
                    display_name=payload.name
                )
                fb_uid = fb_user.uid
        except Exception:
            pass

    # Also register teacher in users table
    existing_user = await db["users"].find_one({"email": payload.email.lower()})
    if not existing_user:
        user_doc = {
            "_id": str(uuid.uuid4()),
            "email": payload.email.lower(),
            "name": payload.name,
            "role": "teacher",
            "department": payload.department,
            "firebase_uid": fb_uid,
            "is_active": True
        }
        await db["users"].insert_one(user_doc)
        doc["user_id"] = user_doc["_id"]

    return doc

@router.put("/{teacher_id}", response_model=TeacherResponse)
async def update_teacher(teacher_id: str, payload: TeacherUpdate, db = Depends(get_db), current_user = Depends(require_role(["admin", "hod"]))):
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    await db["teachers"].update_one({"_id": teacher_id}, {"$set": update_data})
    doc = await db["teachers"].find_one({"_id": teacher_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return doc

@router.delete("/{teacher_id}")
async def delete_teacher(teacher_id: str, db = Depends(get_db), current_user = Depends(require_role(["admin", "hod"]))):
    res = await db["teachers"].delete_one({"_id": teacher_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return {"message": "Teacher deleted successfully"}
