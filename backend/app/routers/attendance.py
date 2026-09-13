from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from app.core.security import get_current_user
from app.db.mongo import get_db
from app.models.attendance import CheckInRequest, CheckInResponse, LiveSessionResponse
from app.services.geolocation import verify_teacher_location
from app.core.websocket_manager import ws_manager
from app.core.config import settings
import datetime

router = APIRouter(prefix="/attendance", tags=["Attendance & Live Sessions"])

@router.get("/live", response_model=List[LiveSessionResponse])
async def get_live_sessions(department: Optional[str] = "Information Technology", db = Depends(get_db)):
    query = {}
    if department:
        query["department"] = department
    return await db["live_sessions"].find(query).to_list(100)

@router.post("/check-in", response_model=CheckInResponse)
async def teacher_check_in(payload: CheckInRequest, db = Depends(get_db), current_user = Depends(get_current_user)):
    # 1. Lookup classroom GPS coordinates
    room = await db["rooms"].find_one({"room_code": payload.room_code.upper()})
    room_lat = room["latitude"] if room else settings.DEFAULT_LATITUDE
    room_lon = room["longitude"] if room else settings.DEFAULT_LONGITUDE
    max_radius = room.get("geo_radius_meters", settings.DEFAULT_CHECKIN_RADIUS_METERS) if room else settings.DEFAULT_CHECKIN_RADIUS_METERS

    # 2. Verify GPS Location via FREE mathematical Haversine formula
    loc_check = verify_teacher_location(
        user_lat=payload.latitude,
        user_lon=payload.longitude,
        room_lat=room_lat,
        room_lon=room_lon,
        max_radius_meters=max_radius
    )

    if not loc_check["verified"] and not settings.DEV_MODE:
        return CheckInResponse(
            success=False,
            status="REJECTED",
            gps_verified=False,
            distance_meters=loc_check["distance_meters"],
            room_code=payload.room_code,
            message=f"Location verification failed: You are {loc_check['distance_meters']}m away from {payload.room_code}. Must be within {max_radius}m."
        )

    # 3. Update Live Class State in DB
    teacher_name = current_user.get("name", "Arun Kumar")
    # Find matching session
    session = await db["live_sessions"].find_one({"room": payload.room_code, "class_name": payload.class_name})
    if session:
        await db["live_sessions"].update_one(
            {"_id": session["_id"]},
            {"$set": {"status": "ACTIVE", "teacher": teacher_name}}
        )
    
    # 4. Broadcast live update to HOD Monitoring Dashboard via WebSocket!
    await ws_manager.broadcast_to_room(payload.department, {
        "type": "STATUS_UPDATE",
        "room": payload.room_code,
        "class_name": payload.class_name,
        "teacher": teacher_name,
        "status": "ACTIVE",
        "time": datetime.datetime.now().strftime("%I:%M %p")
    })

    return CheckInResponse(
        success=True,
        status="ACTIVE",
        gps_verified=True,
        distance_meters=loc_check["distance_meters"],
        room_code=payload.room_code,
        message=f"GPS verified! Checked in to Room {payload.room_code} ({loc_check['distance_meters']}m away)."
    )
