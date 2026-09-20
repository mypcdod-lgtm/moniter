from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from app.core.security import get_current_user, require_role
from app.db.mongo import get_db
from app.models.attendance import (
    CheckInRequest, CheckInResponse, LiveSessionResponse,
    TopicEntryRequest, TopicEntryResponse,
    DutyReportRequest, DutyReportResponse
)
from app.services.geolocation import verify_teacher_location, haversine_distance
from app.core.websocket_manager import ws_manager
from app.core.config import settings
import datetime
import uuid
import zoneinfo

COLLEGE_TZ = zoneinfo.ZoneInfo(settings.COLLEGE_TIMEZONE)

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

    # 1. Lookup classroom GPS coordinates safely
    room = await db["rooms"].find_one({"room_code": payload.room_code.upper()})
    room_lat = (room.get("latitude") if room else None) or settings.DEFAULT_LATITUDE
    room_lon = (room.get("longitude") if room else None) or settings.DEFAULT_LONGITUDE
    max_radius = (room.get("geo_radius_meters") if room else None) or settings.DEFAULT_CHECKIN_RADIUS_METERS

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

    # 3. Calculate 5-minute grace period timeliness in College Timezone (IST)
    now_local = datetime.datetime.now(COLLEGE_TZ)
    cur_mins = now_local.hour * 60 + now_local.minute
    timeliness_status = "ON_TIME"
    minutes_late = 0
    if payload.scheduled_start_min is not None and payload.scheduled_start_min > 0:
        if cur_mins <= payload.scheduled_start_min + 5:
            timeliness_status = "ON_TIME"
            minutes_late = 0
        else:
            timeliness_status = "LATE"
            minutes_late = max(0, cur_mins - payload.scheduled_start_min)

    # 4. Update Live Class State in DB
    teacher_name = current_user.get("name", "Arun Kumar")
    # Find matching session
    session = await db["live_sessions"].find_one({"room": payload.room_code, "class_name": payload.class_name})
    if session:
        await db["live_sessions"].update_one(
            {"_id": session["_id"]},
            {"$set": {
                "status": "ACTIVE",
                "teacher": teacher_name,
                "timeliness_status": timeliness_status,
                "minutes_late": minutes_late
            }}
        )
    
    # 5. Broadcast live update to HOD Monitoring Dashboard via WebSocket!
    await ws_manager.broadcast_to_room(payload.department, {
        "type": "STATUS_UPDATE",
        "room": payload.room_code,
        "class_name": payload.class_name,
        "teacher": teacher_name,
        "status": "ACTIVE",
        "timeliness_status": timeliness_status,
        "minutes_late": minutes_late,
        "time": datetime.datetime.now().strftime("%I:%M %p")
    })

    # 6. Record verified check-in audit log in db
    await db["check_ins"].insert_one({
        "user_email": teacher_email,
        "teacher_name": teacher_name,
        "room_code": payload.room_code,
        "class_name": payload.class_name,
        "department": payload.department,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "accuracy_meters": payload.accuracy_meters,
        "timeliness_status": timeliness_status,
        "minutes_late": minutes_late,
        "timestamp": now_ts,
        "created_at": datetime.datetime.now(datetime.timezone.utc)
    })

    return CheckInResponse(
        success=True,
        status="ACTIVE",
        gps_verified=True,
        distance_meters=loc_check["distance_meters"],
        room_code=payload.room_code,
        message=f"GPS verified! Checked in to Room {payload.room_code} ({loc_check['distance_meters']}m away). Status: {timeliness_status}.",
        timeliness_status=timeliness_status,
        minutes_late=minutes_late
    )

@router.post("/topics", response_model=TopicEntryResponse)
async def record_daily_topic(payload: TopicEntryRequest, db = Depends(get_db), current_user = Depends(get_current_user)):
    now = datetime.datetime.now(datetime.timezone.utc)
    date_str = payload.date or now.strftime("%Y-%m-%d")
    iso_year, iso_week, _ = now.isocalendar()
    week_key = payload.week_key or f"{iso_year}-W{iso_week:02d}"
    day_name = now.strftime("%A")

    teacher_name = payload.teacher_name or current_user.get("name", "Faculty Member")
    teacher_email = current_user.get("email", "")

    doc = {
        "_id": str(uuid.uuid4()),
        "class_name": payload.class_name,
        "room_code": payload.room_code or "",
        "period": payload.period,
        "period_name": payload.period_name or (f"Period {payload.period}" if payload.period else "Period"),
        "time_slot": payload.time_slot or "",
        "subject": payload.subject,
        "topic_title": payload.topic_title.strip(),
        "department": payload.department or current_user.get("department", "Information Technology"),
        "teacher_name": teacher_name,
        "teacher_email": teacher_email,
        "date": date_str,
        "day": day_name,
        "week_key": week_key,
        "created_at": now.isoformat()
    }

    # Upsert: if teacher submits or updates topic for the same class, period, and date
    query = {
        "class_name": payload.class_name,
        "period": payload.period,
        "date": date_str
    }
    existing = await db["topics"].find_one(query)
    if existing:
        await db["topics"].update_one(
            {"_id": existing["_id"]},
            {"$set": {
                "topic_title": payload.topic_title.strip(),
                "subject": payload.subject,
                "room_code": payload.room_code or existing.get("room_code", ""),
                "time_slot": payload.time_slot or existing.get("time_slot", ""),
                "teacher_name": teacher_name,
                "updated_at": now.isoformat()
            }}
        )
        doc = await db["topics"].find_one({"_id": existing["_id"]})
    else:
        await db["topics"].insert_one(doc)

    # Broadcast live topic update to HOD Monitoring Dashboard via WebSocket
    await ws_manager.broadcast_to_room(doc.get("department", "Information Technology"), {
        "type": "TOPIC_UPDATE",
        "topic": {
            "id": str(doc["_id"]),
            "class_name": doc["class_name"],
            "period": doc.get("period"),
            "period_name": doc.get("period_name"),
            "time_slot": doc.get("time_slot"),
            "subject": doc["subject"],
            "topic_title": doc["topic_title"],
            "teacher_name": doc["teacher_name"],
            "date": doc["date"],
            "day": doc["day"],
            "week_key": doc["week_key"]
        }
    })

    return doc

@router.get("/topics", response_model=List[TopicEntryResponse])
async def get_weekly_topics(
    week_key: Optional[str] = None,
    class_name: Optional[str] = None,
    department: Optional[str] = None,
    db = Depends(get_db)
):
    query = {}
    if week_key:
        query["week_key"] = week_key
    if class_name and class_name.lower() != "all":
        query["class_name"] = class_name
    if department:
        query["department"] = department

    docs = await db["topics"].find(query).sort("created_at", -1).to_list(500)
    return docs

@router.delete("/topics/{week_key}")
async def delete_week_topics(
    week_key: str,
    db = Depends(get_db),
    current_user = Depends(require_role(["admin", "hod"]))
):
    result = await db["topics"].delete_many({"week_key": week_key})
    await ws_manager.broadcast_to_room("Information Technology", {
        "type": "TOPIC_DELETED",
        "week_key": week_key,
        "deleted_count": result.deleted_count
    })
    return {
        "success": True,
        "deleted_count": result.deleted_count,
        "message": f"Successfully deleted {result.deleted_count} topic records for week {week_key}."
    }

@router.post("/duty-report", response_model=DutyReportResponse)
async def report_on_duty(payload: DutyReportRequest, db = Depends(get_db), current_user = Depends(get_current_user)):
    now = datetime.datetime.now(COLLEGE_TZ)
    cur_mins = now.hour * 60 + now.minute
    date_str = payload.date or now.strftime("%Y-%m-%d")
    reported_at = payload.reported_at or now.strftime("%I:%M %p")

    # Duty reporting rules:
    # Operating college start: 09:00 AM (540 mins)
    # If turned ON after 09:00 AM, teacher is marked LATE COMER
    # If turned ON after 09:50 AM (Period 1 end), first period was missed
    # Afternoon cutoff: 12:00 PM (720 mins). Cannot report ON_DUTY in the afternoon.
    if payload.status == "ON_DUTY" and cur_mins >= 720:
        raise HTTPException(
            status_code=400,
            detail="Duty reporting is closed in the afternoon (after 12:00 PM). Unreported classes remain marked as VACANT."
        )

    is_late_comer = payload.is_late_comer if payload.is_late_comer is not None else False
    first_period_missed = payload.first_period_missed if payload.first_period_missed is not None else False
    if payload.status == "ON_DUTY" and cur_mins > 540:
        is_late_comer = True
        if cur_mins > 590:
            first_period_missed = True

    teacher_name = payload.teacher_name or current_user.get("name", "Faculty Member")
    teacher_email = payload.teacher_email or current_user.get("email", "")
    department = payload.department or current_user.get("department", "Information Technology")

    doc = {
        "_id": str(uuid.uuid4()),
        "teacher_name": teacher_name,
        "teacher_email": teacher_email,
        "department": department,
        "status": payload.status,
        "is_late_comer": is_late_comer,
        "first_period_missed": first_period_missed,
        "reported_at": reported_at,
        "date": date_str,
        "timestamp": now.timestamp()
    }

    # Upsert per teacher per date
    query = {"teacher_email": doc["teacher_email"], "date": date_str}
    existing = await db["duty_reports"].find_one(query)
    if existing:
        await db["duty_reports"].update_one({"_id": existing["_id"]}, {"$set": doc})
        doc["_id"] = existing["_id"]
    else:
        await db["duty_reports"].insert_one(doc)

    # Broadcast to HOD via WebSocket
    await ws_manager.broadcast_to_room(department, {
        "type": "DUTY_REPORT_UPDATE",
        "duty_report": {
            "teacher_name": doc["teacher_name"],
            "teacher_email": doc["teacher_email"],
            "department": doc["department"],
            "status": doc["status"],
            "is_late_comer": doc["is_late_comer"],
            "first_period_missed": doc["first_period_missed"],
            "reported_at": doc["reported_at"],
            "date": doc["date"]
        }
    })

    msg = f"Duty status updated to {doc['status']}."
    if is_late_comer:
        msg += " Flagged as Late Comer (reported after period start)."

    return DutyReportResponse(
        id=str(doc["_id"]),
        teacher_name=doc["teacher_name"],
        teacher_email=doc["teacher_email"],
        department=doc["department"],
        status=doc["status"],
        is_late_comer=doc["is_late_comer"],
        first_period_missed=doc["first_period_missed"],
        reported_at=doc["reported_at"],
        date=doc["date"],
        message=msg
    )

@router.get("/duty-report", response_model=List[DutyReportResponse])
async def get_duty_reports(date: Optional[str] = None, department: Optional[str] = None, db = Depends(get_db)):
    query = {}
    if date:
        query["date"] = date
    if department:
        query["department"] = department
    docs = await db["duty_reports"].find(query).sort("timestamp", -1).to_list(200)
    return docs


