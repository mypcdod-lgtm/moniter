from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from app.core.security import get_current_user, require_role
from app.db.mongo import get_db
from app.models.user import UserCreate, UserResponse
import uuid

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse)
async def register_user(payload: UserCreate, db = Depends(get_db), user: dict = Depends(require_role(["admin", "hod"]))):
    existing = await db["users"].find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists.")
    
    fb_uid = payload.firebase_uid
    # Automatically register into Firebase Auth if password provided
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
        except Exception as e:
            pass
    
    doc = {
        "_id": str(uuid.uuid4()),
        "email": payload.email.lower(),
        "name": payload.name,
        "password": payload.password,
        "role": payload.role.lower(),
        "department": payload.department or "Information Technology",
        "is_active": True,
        "firebase_uid": fb_uid,
        "created_by": user.get("email")
    }
    await db["users"].insert_one(doc)
    return doc

@router.get("/me")
async def get_current_user_profile(user: dict = Depends(get_current_user), db = Depends(get_db)):
    profile = await db["users"].find_one({"email": user.get("email", "").lower()})
    if not profile:
        return user
    return profile
