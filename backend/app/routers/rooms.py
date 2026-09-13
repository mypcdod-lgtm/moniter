from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from app.core.security import require_role
from app.db.mongo import get_db
from app.models.room import RoomCreate, RoomUpdate, RoomResponse
import uuid

router = APIRouter(prefix="/rooms", tags=["Classrooms"])

@router.get("", response_model=List[RoomResponse])
async def list_rooms(department: Optional[str] = None, db = Depends(get_db)):
    query = {}
    if department:
        query["department"] = department
    return await db["rooms"].find(query).to_list(100)

@router.post("", response_model=RoomResponse)
async def create_room(payload: RoomCreate, db = Depends(get_db), current_user = Depends(require_role(["admin"]))):
    doc = {
        "_id": str(uuid.uuid4()),
        "room_code": payload.room_code.upper(),
        "type": payload.type,
        "capacity": payload.capacity,
        "block": payload.block,
        "department": payload.department,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "geo_radius_meters": payload.geo_radius_meters or 50.0
    }
    await db["rooms"].insert_one(doc)
    return doc

@router.put("/{room_id}", response_model=RoomResponse)
async def update_room(room_id: str, payload: RoomUpdate, db = Depends(get_db), current_user = Depends(require_role(["admin"]))):
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    await db["rooms"].update_one({"_id": room_id}, {"$set": update_data})
    doc = await db["rooms"].find_one({"_id": room_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Room not found")
    return doc

@router.delete("/{room_id}")
async def delete_room(room_id: str, db = Depends(get_db), current_user = Depends(require_role(["admin"]))):
    res = await db["rooms"].delete_one({"_id": room_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Room not found")
    return {"message": "Room deleted successfully"}
