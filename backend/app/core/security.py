import logging
import os
from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

logger = logging.getLogger("security")
security_scheme = HTTPBearer(auto_error=False)

firebase_initialized = False
try:
    import firebase_admin
    from firebase_admin import credentials, auth
    if os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred, {"projectId": settings.FIREBASE_PROJECT_ID})
        firebase_initialized = True
        logger.info(f"Firebase Admin SDK initialized with certificate for project '{settings.FIREBASE_PROJECT_ID}'.")
    elif not firebase_admin._apps:
        try:
            firebase_admin.initialize_app(options={"projectId": settings.FIREBASE_PROJECT_ID})
            firebase_initialized = True
            logger.info(f"Firebase Admin SDK initialized with default options for project '{settings.FIREBASE_PROJECT_ID}'.")
        except Exception as e:
            logger.info(f"Firebase Admin app init note: {e}")
except Exception as e:
    logger.info(f"Firebase Admin module note: {e}")

async def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)) -> dict:
    if not creds:
        if settings.DEV_MODE:
            return {
                "uid": "usr-admin-1",
                "email": "canvaonly322@gmail.com",
                "name": "System Administrator",
                "role": "admin",
                "department": "Central Administration"
            }
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization Bearer Header"
        )

    token = creds.credentials

    # Fast local developer / test bypass
    if settings.DEV_MODE and token.startswith("dev-"):
        role = token.replace("dev-", "").lower()
        if role == "admin":
            return {"uid": "usr-admin-1", "email": "canvaonly322@gmail.com", "name": "Admin Balaselvaraja", "role": "admin", "department": "All"}
        elif role == "hod":
            return {"uid": "usr-hod-1", "email": "hod.it@college.edu", "name": "Dr. Ramesh Babu", "role": "hod", "department": "Information Technology"}
        elif role == "teacher":
            return {"uid": "usr-teacher-1", "email": "arun@college.edu", "name": "Arun Kumar", "role": "teacher", "department": "Information Technology"}

    if firebase_initialized:
        try:
            from firebase_admin import auth
            decoded_token = auth.verify_id_token(token)
            return decoded_token
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid or expired Firebase ID token: {str(e)}"
            )

    if settings.DEV_MODE:
        return {
            "uid": f"dev-{token[:8]}",
            "email": "dev.user@college.edu",
            "name": "Developer User",
            "role": "admin",
            "department": "Information Technology"
        }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Firebase authentication is not configured on server."
    )

def require_role(allowed_roles: List[str]):
    async def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        user_role = current_user.get("role", "").lower()
        if user_role not in [r.lower() for r in allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Requires one of {allowed_roles}, your role is '{user_role}'"
            )
        return current_user
    return role_checker
