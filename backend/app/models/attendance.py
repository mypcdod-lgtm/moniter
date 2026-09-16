from pydantic import BaseModel, ConfigDict
from typing import Optional

class CheckInRequest(BaseModel):
    class_name: str = "IT-A"
    room_code: str = "C204"
    latitude: float
    longitude: float
    accuracy_meters: Optional[float] = None
    timestamp: Optional[float] = None
    is_mock: Optional[bool] = False
    department: str = "Information Technology"

class CheckInResponse(BaseModel):
    success: bool
    status: str
    gps_verified: bool
    distance_meters: float
    room_code: str
    message: str

class LiveSessionResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str = ""
    class_name: str
    subject: str
    teacher: str
    room: str
    status: str
    time: str
    substitute: Optional[str] = None
    department: str = "Information Technology"

    def __init__(self, **data):
        if "_id" in data and "id" not in data:
            data["id"] = str(data["_id"])
        super().__init__(**data)

class TopicEntryRequest(BaseModel):
    class_name: str
    room_code: Optional[str] = None
    period: Optional[int] = None
    period_name: Optional[str] = None
    time_slot: Optional[str] = None
    subject: str
    topic_title: str
    department: Optional[str] = "Information Technology"
    teacher_name: Optional[str] = None
    date: Optional[str] = None
    week_key: Optional[str] = None

class TopicEntryResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str = ""
    class_name: str
    room_code: Optional[str] = None
    period: Optional[int] = None
    period_name: Optional[str] = None
    time_slot: Optional[str] = None
    subject: str
    topic_title: str
    department: str = "Information Technology"
    teacher_name: str = ""
    teacher_email: Optional[str] = None
    date: str = ""
    day: str = ""
    week_key: str = ""
    created_at: str = ""

    def __init__(self, **data):
        if "_id" in data and "id" not in data:
            data["id"] = str(data["_id"])
        super().__init__(**data)

