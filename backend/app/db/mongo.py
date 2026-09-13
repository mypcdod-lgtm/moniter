import logging
from typing import Any, Dict, List, Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from fastapi import Request
from app.core.config import settings

logger = logging.getLogger("db")

class MockCollection:
    def __init__(self, name: str):
        self.name = name
        self._data: List[Dict[str, Any]] = []

    async def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        for item in self._data:
            match = True
            for k, v in query.items():
                if k == "$or":
                    match = any(all(item.get(qk) == qv for qk, qv in cond.items()) for cond in v)
                elif item.get(k) != v:
                    match = False
                    break
            if match:
                return dict(item)
        return None

    def find(self, query: Optional[Dict[str, Any]] = None):
        q = query or {}
        results = []
        for item in self._data:
            match = True
            for k, v in q.items():
                if k == "$or":
                    match = any(all(item.get(qk) == qv for qk, qv in cond.items()) for cond in v)
                elif item.get(k) != v:
                    match = False
                    break
            if match:
                results.append(dict(item))
        
        class Cursor:
            def __init__(self, items):
                self._items = items
            def sort(self, key, direction=1):
                return self
            async def to_list(self, length: Optional[int] = None):
                return self._items[:length] if length else self._items
            def __aiter__(self):
                self._iter = iter(self._items)
                return self
            async def __anext__(self):
                try:
                    return next(self._iter)
                except StopIteration:
                    raise StopAsyncIteration

        return Cursor(results)

    async def insert_one(self, doc: Dict[str, Any]):
        new_doc = dict(doc)
        if "_id" not in new_doc:
            import uuid
            new_doc["_id"] = str(uuid.uuid4())
        self._data.append(new_doc)
        class Result:
            inserted_id = new_doc["_id"]
        return Result()

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any]):
        for item in self._data:
            match = all(item.get(k) == v for k, v in query.items())
            if match:
                if "$set" in update:
                    item.update(update["$set"])
                class Result:
                    modified_count = 1
                return Result()
        class Result:
            modified_count = 0
        return Result()

    async def delete_one(self, query: Dict[str, Any]):
        for idx, item in enumerate(self._data):
            if all(item.get(k) == v for k, v in query.items()):
                self._data.pop(idx)
                class Result:
                    deleted_count = 1
                return Result()
        class Result:
            deleted_count = 0
        return Result()

    async def create_index(self, *args, **kwargs):
        return "index_created"

class MockDatabase:
    def __init__(self):
        self._collections: Dict[str, MockCollection] = {}
        self._seed_initial_data()

    def __getitem__(self, name: str) -> MockCollection:
        if name not in self._collections:
            self._collections[name] = MockCollection(name)
        return self._collections[name]

    def _seed_initial_data(self):
        self["users"]._data = [
            {"_id": "usr-admin-1", "email": "canvaonly322@gmail.com", "name": "System Administrator", "role": "admin", "department": "Central Administration", "is_active": True},
            {"_id": "usr-hod-1", "email": "hod.it@college.edu", "name": "Dr. Ramesh Babu", "role": "hod", "department": "Information Technology", "is_active": True},
            {"_id": "usr-teacher-1", "email": "arun@college.edu", "name": "Arun Kumar", "role": "teacher", "department": "Information Technology", "is_active": True}
        ]
        self["teachers"]._data = [
            {"_id": "t-1", "user_id": "usr-teacher-1", "name": "Arun Kumar", "email": "arun@college.edu", "department": "Information Technology", "subject": "Python & AI", "workload": "16 hrs/wk", "status": "Available"},
            {"_id": "t-2", "name": "Kumar Swamy", "email": "kumar@college.edu", "department": "Information Technology", "subject": "DBMS", "workload": "18 hrs/wk", "status": "In Class"},
            {"_id": "t-3", "name": "Priya Sharma", "email": "priya@college.edu", "department": "Information Technology", "subject": "Applied Maths", "workload": "14 hrs/wk", "status": "Available"},
            {"_id": "t-4", "name": "Suresh Raina", "email": "suresh@college.edu", "department": "Information Technology", "subject": "Java & OOP", "workload": "16 hrs/wk", "status": "In Class"},
            {"_id": "t-5", "name": "Sneha Rao", "email": "sneha@college.edu", "department": "Information Technology", "subject": "Web Tech", "workload": "15 hrs/wk", "status": "Available"},
            {"_id": "t-6", "name": "Dr. Rajesh", "email": "rajesh@college.edu", "department": "Information Technology", "subject": "Maths & Algorithms", "workload": "12 hrs/wk", "status": "Available"}
        ]
        self["subjects"]._data = [
            {"_id": "s-1", "code": "IT301", "name": "Python Programming", "type": "Theory + Lab", "weekly_hours": 5, "department": "Information Technology", "semester": 3},
            {"_id": "s-2", "code": "IT302", "name": "Database Management Systems", "type": "Theory", "weekly_hours": 4, "department": "Information Technology", "semester": 3},
            {"_id": "s-3", "code": "MA301", "name": "Discrete Mathematics", "type": "Theory", "weekly_hours": 4, "department": "Information Technology", "semester": 3},
            {"_id": "s-4", "code": "IT303", "name": "Object Oriented Java", "type": "Theory + Lab", "weekly_hours": 5, "department": "Information Technology", "semester": 3},
            {"_id": "s-5", "code": "IT304", "name": "Computer Networks", "type": "Theory", "weekly_hours": 4, "department": "Information Technology", "semester": 3}
        ]
        self["rooms"]._data = [
            {"_id": "r-1", "room_code": "C204", "type": "Smart Lecture Hall", "capacity": 65, "block": "Academic Block C", "department": "Information Technology", "latitude": 12.9716, "longitude": 77.5946, "geo_radius_meters": 50.0},
            {"_id": "r-2", "room_code": "C205", "type": "Lecture Hall", "capacity": 60, "block": "Academic Block C", "department": "Information Technology", "latitude": 12.9717, "longitude": 77.5947, "geo_radius_meters": 50.0},
            {"_id": "r-3", "room_code": "C206", "type": "Lecture Hall", "capacity": 60, "block": "Academic Block C", "department": "Information Technology", "latitude": 12.9718, "longitude": 77.5948, "geo_radius_meters": 50.0},
            {"_id": "r-4", "room_code": "C207", "type": "Smart Lecture Hall", "capacity": 70, "block": "Academic Block C", "department": "Information Technology", "latitude": 12.9719, "longitude": 77.5949, "geo_radius_meters": 50.0},
            {"_id": "r-5", "room_code": "Lab 1", "type": "Cloud & Web Lab", "capacity": 45, "block": "IT Lab Complex", "department": "Information Technology", "latitude": 12.9720, "longitude": 77.5950, "geo_radius_meters": 60.0},
            {"_id": "r-6", "room_code": "Lab 2", "type": "AI & Data Science Lab", "capacity": 50, "block": "IT Lab Complex", "department": "Information Technology", "latitude": 12.9721, "longitude": 77.5951, "geo_radius_meters": 60.0}
        ]
        self["live_sessions"]._data = [
            {"_id": "live-1", "class_name": "IT-A", "subject": "Python", "teacher": "Arun Kumar", "room": "C204", "status": "ACTIVE", "time": "10:00 - 11:00", "substitute": None, "department": "Information Technology"},
            {"_id": "live-2", "class_name": "IT-B", "subject": "DBMS", "teacher": "Kumar Swamy", "room": "C205", "status": "SCHEDULED", "time": "11:00 - 12:00", "substitute": None, "department": "Information Technology"},
            {"_id": "live-3", "class_name": "IT-C", "subject": "Maths", "teacher": "Priya Sharma", "room": "C206", "status": "VACANT", "time": "10:00 - 11:00", "substitute": None, "department": "Information Technology"},
            {"_id": "live-4", "class_name": "IT-D", "subject": "Java", "teacher": "Suresh Raina", "room": "C207", "status": "SUBSTITUTE", "time": "10:00 - 11:00", "substitute": "Dr. Rajesh", "department": "Information Technology"},
            {"_id": "live-5", "class_name": "IT-A", "subject": "Computer Networks", "teacher": "Sneha Rao", "room": "C208", "status": "ACTIVE", "time": "10:00 - 11:00", "substitute": None, "department": "Information Technology"}
        ]
        self["timetables"]._data = [
            {"_id": "tt-1", "version": "v3.2", "status": "ACTIVE", "term": "Odd Semester 2026-27", "applied_at": "10 Sep 2026", "generated_by": "AI Scheduler v2", "department": "Information Technology", "slots": []},
            {"_id": "tt-2", "version": "v3.1", "status": "ARCHIVED", "term": "Odd Semester 2026-27", "applied_at": "01 Sep 2026", "generated_by": "Admin Manual", "department": "Information Technology", "slots": []}
        ]

class MongoDB:
    client: Optional[AsyncIOMotorClient] = None
    db: Any = None

mongodb = MongoDB()

async def seed_atlas_data_if_empty(db):
    try:
        user_count = await db["users"].count_documents({})
        if user_count == 0:
            logger.info("Fresh database detected. Auto-seeding initial campus data into MongoDB Atlas...")
            mock = MockDatabase()
            for col_name in ["users", "teachers", "subjects", "rooms", "live_sessions", "timetables"]:
                docs = mock[col_name]._data
                if docs:
                    await db[col_name].insert_many([dict(d) for d in docs])
            logger.info("Successfully seeded users, teachers, subjects, rooms, live sessions, and timetables into MongoDB Atlas!")
    except Exception as e:
        logger.warning(f"Auto-seed check failed (non-critical): {e}")

async def init_db():
    try:
        if settings.MONGODB_URI and not settings.MONGODB_URI.startswith("mongodb://localhost"):
            logger.info("Connecting to MongoDB Atlas...")
            client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=8000)
            await client.admin.command("ping")
            mongodb.client = client
            mongodb.db = client[settings.DATABASE_NAME]
            logger.info(f"Connected to MongoDB Atlas: {settings.DATABASE_NAME}")
            await seed_atlas_data_if_empty(mongodb.db)
        else:
            client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=1000)
            await client.admin.command("ping")
            mongodb.client = client
            mongodb.db = client[settings.DATABASE_NAME]
            logger.info("Connected to local MongoDB.")
            await seed_atlas_data_if_empty(mongodb.db)
    except Exception as e:
        logger.warning(f"Using in-memory store for dev mode: {e}")
        mongodb.db = MockDatabase()

async def close_db():
    if mongodb.client:
        mongodb.client.close()
        logger.info("MongoDB connection closed.")

async def get_db(request: Request = None):
    if mongodb.db is None:
        await init_db()
    return mongodb.db
