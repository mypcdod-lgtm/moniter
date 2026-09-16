from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from app.core.security import get_current_user
from app.db.mongo import get_db
from app.models.attendance import CheckInRequest, CheckInResponse, LiveSessionResponse
from app.services.geolocation import verify_teacher_location, haversine_distance
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
    # 0a. Anti-Spoofing: Mock Location Detection
    if getattr(payload, "is_mock", False):
        return CheckInResponse(
            success=False,
            status="REJECTED",
            gps_verified=False,
            distance_meters=9999.0,
            room_code=payload.room_code,
            message="Mock/Spoofed GPS location detected. Device mock location provider is active."
        )

    # 0b. Coordinate Range Validation
    if not (-90.0 <= payload.latitude <= 90.0 and -180.0 <= payload.longitude <= 180.0):
        return CheckInResponse(
            success=False,
            status="REJECTED",
            gps_verified=False,
            distance_meters=9999.0,
            room_code=payload.room_code,
            message="Invalid GPS coordinate bounds. Latitude must be [-90, 90], Longitude [-180, 180]."
        )

    # 0c. Accuracy Guard (<= 100m)
    if payload.accuracy_meters is not None and payload.accuracy_meters > 100.0:
        return CheckInResponse(
            success=False,
            status="REJECTED",
            gps_verified=False,
            distance_meters=9999.0,
            room_code=payload.room_code,
            message=f"GPS fix accuracy too low (±{payload.accuracy_meters:.1f}m). High accuracy location fix (<= 100m) is strictly required."
        )

    now_ts = datetime.datetime.now(datetime.timezone.utc).timestamp()

    # 0d. Timestamp Freshness Guard (<= 60s)
    if payload.timestamp is not None:
        ts = payload.timestamp / 1000.0 if payload.timestamp > 1e11 else payload.timestamp
        if abs(now_ts - ts) > 60.0:
            return CheckInResponse(
                success=False,
                status="REJECTED",
                gps_verified=False,
                distance_meters=9999.0,
                room_code=payload.room_code,
                message="GPS timestamp is stale (> 60 seconds old). Replay attack prevented. Live GPS required."
            )

    teacher_email = current_user.get("email") or current_user.get("uid") or "unknown"

    # 0e. Velocity / Teleportation Anti-Spoofing Check (> 120 km/h)
    prev_checkin = await db["check_ins"].find_one(
        {"user_email": teacher_email},
        sort=[("timestamp", -1)]
    )
    if prev_checkin and "timestamp" in prev_checkin:
        prev_ts = prev_checkin["timestamp"]
        time_diff_sec = now_ts - prev_ts
        if 0 < time_diff_sec < 7200:  # Within past 2 hours
            dist_m = haversine_distance(
                payload.latitude, payload.longitude,
                prev_checkin["latitude"], prev_checkin["longitude"]
            )
            speed_kmh = (dist_m / 1000.0) / (time_diff_sec / 3600.0)
            if speed_kmh > 120.0:
                return CheckInResponse(
                    success=False,
                    status="REJECTED",
                    gps_verified=False,
                    distance_meters=round(dist_m, 1),
                    room_code=payload.room_code,
                    message=f"Impossible velocity detected ({speed_kmh:.1f} km/h across {dist_m:.1f}m in {time_diff_sec:.0f}s). Location teleportation prevented."
                )

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

    # 5. Record verified check-in audit log in db
    await db["check_ins"].insert_one({
        "user_email": teacher_email,
        "teacher_name": teacher_name,
        "room_code": payload.room_code,
        "class_name": payload.class_name,
        "department": payload.department,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "accuracy_meters": payload.accuracy_meters,
        "timestamp": now_ts,
        "created_at": datetime.datetime.now(datetime.timezone.utc)
    })

    return CheckInResponse(
        success=True,
        status="ACTIVE",
        gps_verified=True,
        distance_meters=loc_check["distance_meters"],
        room_code=payload.room_code,
        message=f"GPS verified! Checked in to Room {payload.room_code} ({loc_check['distance_meters']}m away)."
    )
