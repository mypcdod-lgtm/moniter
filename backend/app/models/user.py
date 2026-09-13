from pydantic import BaseModel, ConfigDict
from typing import Optional

class UserBase(BaseModel):
    email: str
    name: str
    role: str = "teacher"  # admin, hod, teacher
    department: Optional[str] = "Information Technology"
    is_active: bool = True

class UserCreate(UserBase):
    password: Optional[str] = None
    firebase_uid: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    model_config = ConfigDict(populate_by_name=True)
    id: str = ""
    created_at: Optional[str] = None

    def __init__(self, **data):
        if "_id" in data and "id" not in data:
            data["id"] = str(data["_id"])
        super().__init__(**data)
