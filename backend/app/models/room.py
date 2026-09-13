from pydantic import BaseModel, ConfigDict
from typing import Optional

class RoomBase(BaseModel):
    room_code: str
    type: str = "Lecture Hall"
    capacity: int = 60
    block: str = "Academic Block C"
    department: str = "Information Technology"
    latitude: float = 12.9716
    longitude: float = 77.5946
    geo_radius_meters: float = 50.0

class RoomCreate(RoomBase):
    pass

class RoomUpdate(BaseModel):
    type: Optional[str] = None
    capacity: Optional[int] = None
    block: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    geo_radius_meters: Optional[float] = None

class RoomResponse(RoomBase):
    model_config = ConfigDict(populate_by_name=True)
    id: str = ""

    def __init__(self, **data):
        if "_id" in data and "id" not in data:
            data["id"] = str(data["_id"])
        super().__init__(**data)
