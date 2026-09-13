from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any

class NotificationCreate(BaseModel):
    user_id: Optional[str] = None
    department: Optional[str] = None
    title: str
    message: str
    type: str = "info"
    data: Optional[Dict[str, Any]] = None

class NotificationResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str = ""
    title: str
    message: str
    type: str
    is_read: bool = False
    created_at: Optional[str] = None

    def __init__(self, **data):
        if "_id" in data and "id" not in data:
            data["id"] = str(data["_id"])
        super().__init__(**data)
