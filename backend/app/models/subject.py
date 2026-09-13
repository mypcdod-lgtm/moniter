from pydantic import BaseModel, ConfigDict
from typing import Optional

class SubjectBase(BaseModel):
    code: str
    name: str
    type: str = "Theory"
    weekly_hours: int = 4
    department: str = "Information Technology"
    semester: int = 3

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    weekly_hours: Optional[int] = None
    semester: Optional[int] = None

class SubjectResponse(SubjectBase):
    model_config = ConfigDict(populate_by_name=True)
    id: str = ""

    def __init__(self, **data):
        if "_id" in data and "id" not in data:
            data["id"] = str(data["_id"])
        super().__init__(**data)
