from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from app.core.security import require_role
from app.db.mongo import get_db
from app.models.user import UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=List[UserResponse])
async def list_users(role: Optional[str] = None, department: Optional[str] = None, db = Depends(get_db), current_user = Depends(require_role(["admin"]))):
    query = {}
    if role:
        query["role"] = role.lower()
    if department:
        query["department"] = department
    cursor = db["users"].find(query)
    users = await cursor.to_list(100)
    return users

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, payload: UserUpdate, db = Depends(get_db), current_user = Depends(require_role(["admin"]))):
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    await db["users"].update_one({"_id": user_id}, {"$set": update_data})
    doc = await db["users"].find_one({"_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    return doc

@router.delete("/{user_id}")
async def delete_user(user_id: str, db = Depends(get_db), current_user = Depends(require_role(["admin"]))):
    res = await db["users"].delete_one({"_id": user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}
