from pydantic import BaseModel, ConfigDict
from typing import Optional

class CheckInRequest(BaseModel):
    class_name: str = "IT-A"
    room_code: str = "C204"
    latitude: float
    longitude: float
    accuracy_meters: Optional[float] = None
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
