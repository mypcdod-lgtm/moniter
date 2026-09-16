import pytest
import asyncio
import datetime
from httpx import AsyncClient, ASGITransport
import sys
import os
sys.path.insert(0, os.path.abspath("backend"))

from app.main import app

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"
        assert data["app"] == "MyMonitorXX API"

@pytest.mark.asyncio
async def test_list_teachers():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/teachers")
        assert res.status_code == 200
        teachers = res.json()
        assert len(teachers) > 0
        assert teachers[0]["name"] == "Arun Kumar"

@pytest.mark.asyncio
async def test_list_subjects():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/subjects")
        assert res.status_code == 200
        subjects = res.json()
        assert len(subjects) > 0
        assert any(s["code"] == "IT301" for s in subjects)

@pytest.mark.asyncio
async def test_list_rooms():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/rooms")
        assert res.status_code == 200
        rooms = res.json()
        assert len(rooms) > 0
        assert any(r["room_code"] == "C204" for r in rooms)

@pytest.mark.asyncio
async def test_live_attendance_and_gps_checkin():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/attendance/live")
        assert res.status_code == 200
        sessions = res.json()
        assert len(sessions) > 0

        checkin_payload = {
            "class_name": "IT-A",
            "room_code": "C204",
            "latitude": 12.97161,
            "longitude": 77.59461,
            "department": "Information Technology"
        }
        headers = {"Authorization": "Bearer dev-teacher"}
        res = await ac.post("/api/attendance/check-in", json=checkin_payload, headers=headers)
        assert res.status_code == 200
        result = res.json()
        assert result["success"] is True
        assert result["gps_verified"] is True
        assert result["status"] == "ACTIVE"

@pytest.mark.asyncio
async def test_timetable_generate():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = {"Authorization": "Bearer dev-admin"}
        gen_payload = {
            "department": "Information Technology",
            "term": "Odd Semester 2026-27",
            "sections": ["IT-A", "IT-B"],
            "days": ["Monday", "Tuesday"],
            "periods_per_day": 5
        }
        res = await ac.post("/api/timetable/generate", json=gen_payload, headers=headers)
        assert res.status_code == 200
        tt = res.json()
        assert tt["status"] == "DRAFT"
        assert len(tt["slots"]) > 0

@pytest.mark.asyncio
async def test_leave_and_substitution_workflow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        leave_payload = {
            "teacher_name": "Priya Sharma",
            "date": "2026-09-15",
            "periods": [3, 4],
            "reason": "Family function",
            "department": "Information Technology"
        }
        headers_teacher = {"Authorization": "Bearer dev-teacher"}
        res = await ac.post("/api/leaves", json=leave_payload, headers=headers_teacher)
        assert res.status_code == 200
        leave_doc = res.json()
        leave_id = leave_doc.get("id") or leave_doc.get("_id")

        headers_hod = {"Authorization": "Bearer dev-hod"}
        review_payload = {
            "status": "approved",
            "substitute_teacher": "Dr. Rajesh",
            "comment": "Approved"
        }
        res = await ac.put(f"/api/leaves/{leave_id}/review", json=review_payload, headers=headers_hod)
        assert res.status_code == 200
        assert res.json()["status"] == "approved"

        res = await ac.get("/api/substitution/find?time=10:00%20-%2011:00&department=Information%20Technology")
        assert res.status_code == 200
        subs = res.json()
        assert len(subs) > 0

@pytest.mark.asyncio
async def test_duty_report_and_timeliness():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers_teacher = {"Authorization": "Bearer dev-teacher"}
        duty_payload = {
            "teacher_name": "Arun Kumar",
            "teacher_email": "arun@college.edu",
            "department": "Information Technology",
            "status": "ON_DUTY"
        }
        res = await ac.post("/api/attendance/duty-report", json=duty_payload, headers=headers_teacher)
        assert res.status_code == 200
        report = res.json()
        assert report["status"] == "ON_DUTY"
        assert report["teacher_email"] == "arun@college.edu"

        # Check retrieval
        res_get = await ac.get("/api/attendance/duty-report?department=Information%20Technology")
        assert res_get.status_code == 200
        reports = res_get.json()
        assert len(reports) > 0
        assert any(r["teacher_email"] == "arun@college.edu" for r in reports)

        # Check in with 5-minute grace period (start min: current time)
        now_dt = datetime.datetime.now()
        cur_mins = now_dt.hour * 60 + now_dt.minute
        checkin_payload = {
            "class_name": "IT-A",
            "room_code": "C204",
            "latitude": 12.97161,
            "longitude": 77.59461,
            "department": "Information Technology",
            "scheduled_start_min": cur_mins
        }
        res_checkin = await ac.post("/api/attendance/check-in", json=checkin_payload, headers=headers_teacher)
        assert res_checkin.status_code == 200
        ci = res_checkin.json()
        assert ci["success"] is True
        assert ci["timeliness_status"] == "ON_TIME"

