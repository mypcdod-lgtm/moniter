from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from app.core.security import require_role
from app.db.mongo import get_db
from app.models.subject import SubjectCreate, SubjectUpdate, SubjectResponse
import uuid

router = APIRouter(prefix="/subjects", tags=["Subjects"])

@router.get("", response_model=List[SubjectResponse])
async def list_subjects(department: Optional[str] = None, semester: Optional[int] = None, db = Depends(get_db)):
    query = {}
    if department:
        query["department"] = department
    if semester:
        query["semester"] = semester
    return await db["subjects"].find(query).to_list(100)

@router.post("", response_model=SubjectResponse)
async def create_subject(payload: SubjectCreate, db = Depends(get_db), current_user = Depends(require_role(["admin", "hod"]))):
    doc = {
        "_id": str(uuid.uuid4()),
        "code": payload.code.upper(),
        "name": payload.name,
        "type": payload.type,
        "weekly_hours": payload.weekly_hours,
        "department": payload.department,
        "semester": payload.semester
    }
    await db["subjects"].insert_one(doc)
    return doc

@router.put("/{subject_id}", response_model=SubjectResponse)
async def update_subject(subject_id: str, payload: SubjectUpdate, db = Depends(get_db), current_user = Depends(require_role(["admin"]))):
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    await db["subjects"].update_one({"_id": subject_id}, {"$set": update_data})
    doc = await db["subjects"].find_one({"_id": subject_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Subject not found")
    return doc

@router.delete("/{subject_id}")
async def delete_subject(subject_id: str, db = Depends(get_db), current_user = Depends(require_role(["admin"]))):
    res = await db["subjects"].delete_one({"_id": subject_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subject not found")
    return {"message": "Subject deleted successfully"}
