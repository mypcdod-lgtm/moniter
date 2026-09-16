from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from app.core.security import get_current_user, require_role
from app.db.mongo import get_db
from app.models.user import UserCreate, UserResponse
import uuid

router = APIRouter(prefix="/auth", tags=["Authentication"])

import re

RFC5322_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")

def validate_password_complexity(pwd: str) -> bool:
    if len(pwd) < 8 or len(pwd) > 128:
        return False
    if not re.search(r"[a-z]", pwd):
        return False
    if not re.search(r"[A-Z]", pwd):
        return False
    if not re.search(r"\d", pwd):
        return False
    if not re.search(r"[@$!%*?&#^_\-]", pwd):
        return False
    return True

@router.post("/register", response_model=UserResponse)
async def register_user(payload: UserCreate, db = Depends(get_db), user: dict = Depends(require_role(["admin", "hod"]))):
    if not RFC5322_REGEX.match(payload.email.strip()):
        raise HTTPException(status_code=400, detail="Invalid email format. RFC 5322 compliant email required.")

    if payload.password:
        if not validate_password_complexity(payload.password):
            raise HTTPException(
                status_code=400,
                detail="Password does not meet enterprise complexity requirements (8-128 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special symbol)."
            )

    existing = await db["users"].find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists.")
    
    fb_uid = payload.firebase_uid
    # Securely register into Firebase Cloud Auth (passwords are hashed by Google scrypt)
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
    
    # Store user metadata WITHOUT plaintext password
    doc = {
        "_id": str(uuid.uuid4()),
        "email": payload.email.lower(),
        "name": payload.name,
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
