from pydantic import BaseModel, ConfigDict
from typing import Optional

class TeacherBase(BaseModel):
    name: str
    email: str
    department: str = "Information Technology"
    subject: str
    workload: str = "16 hrs/wk"
    status: str = "Available"

class TeacherCreate(TeacherBase):
    password: Optional[str] = None

class TeacherUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    subject: Optional[str] = None
    workload: Optional[str] = None
    status: Optional[str] = None

class TeacherResponse(TeacherBase):
    model_config = ConfigDict(populate_by_name=True)
    id: str = ""
    user_id: Optional[str] = None

    def __init__(self, **data):
        if "_id" in data and "id" not in data:
            data["id"] = str(data["_id"])
        super().__init__(**data)
