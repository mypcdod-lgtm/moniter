from pydantic import BaseModel, ConfigDict
from typing import Optional, List

class LeaveRequestCreate(BaseModel):
    teacher_name: str
    date: str
    periods: List[int]
    reason: str
    department: str = "Information Technology"

class LeaveApprovalRequest(BaseModel):
    status: str
    substitute_teacher: Optional[str] = None
    comment: Optional[str] = None

class LeaveResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str = ""
    teacher_id: Optional[str] = None
    teacher_name: str
    department: str
    date: str
    periods: List[int]
    reason: str
    status: str = "pending"
    substitute_teacher: Optional[str] = None
    created_at: Optional[str] = None

    def __init__(self, **data):
        if "_id" in data and "id" not in data:
            data["id"] = str(data["_id"])
        super().__init__(**data)
