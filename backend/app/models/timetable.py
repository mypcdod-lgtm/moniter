from pydantic import BaseModel, ConfigDict
from typing import Optional, List

class TimetableSlot(BaseModel):
    day: str
    period: int
    time: str
    section: str
    subject: str
    teacher: str
    room: str

class TimetableGenerateRequest(BaseModel):
    department: str = "Information Technology"
    term: str = "Odd Semester 2026-27"
    sections: List[str] = ["IT-A", "IT-B", "IT-C", "IT-D"]
    days: List[str] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    periods_per_day: int = 5

class TimetableResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str = ""
    version: str
    status: str
    term: str
    applied_at: Optional[str] = None
    generated_by: str = "AI Constraint Engine v2"
    department: str = "Information Technology"
    slots: List[TimetableSlot] = []

    def __init__(self, **data):
        if "_id" in data and "id" not in data:
            data["id"] = str(data["_id"])
        super().__init__(**data)
