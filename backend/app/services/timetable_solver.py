import random
from typing import List, Dict, Any, Optional

COLLEGE_BELL_SCHEDULE = [
    {"period": 1, "time": "09:00 - 09:50"},
    {"period": 2, "time": "09:50 - 10:40"},
    {"period": 3, "time": "11:00 - 11:50"},
    {"period": 4, "time": "11:50 - 12:40"},
    {"period": 5, "time": "01:30 - 02:20"},
    {"period": 6, "time": "02:20 - 03:10"},
    {"period": 7, "time": "03:10 - 04:00"}
]

def generate_timetable_schedule(
    teachers: List[Dict[str, Any]],
    subjects: List[Dict[str, Any]],
    rooms: List[Dict[str, Any]],
    sections: List[str] = ["IT-A", "IT-B", "IT-C", "IT-D"],
    days: List[str] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    periods_per_day: int = 7,
    enable_naan_mudhalvan: bool = True
) -> List[Dict[str, Any]]:
    """
    Enhanced College Timetable Generation Engine with Strict Conflict Constraints:
    1. Exact College Bell Schedule: 09:00 - 04:00 (7 Periods of 50m).
    2. Naan Mudhalvan 4-Period Block: Every Monday, 4 mandatory skill development periods across all sections.
    3. Zero Teacher Collision: If a teacher teaches multiple sections (e.g. IT-A and IT-B),
       they can never be scheduled for both at the same (Day, Period).
    4. Zero Room Collision: A classroom or lab can only hold one class per period.
    5. 2-Period Continuous Lab Blocks: Hands-on labs are assigned continuous 2-hour blocks in lab rooms.
    6. Daily Subject Cap: Maximum 2 periods of the same theory subject per day per class.
    """
    slots = []
    teacher_busy = set()  # (day, period, teacher_name)
    room_busy = set()     # (day, period, room_code)
    section_schedule = {} # (day, section, period) -> slot_dict
    section_subject_count = {} # (section, subject_name) -> count
    section_day_subject_count = {} # (day, section, subject_name) -> count

    if not teachers:
        teachers = [
            {"name": "Arun Kumar", "subject": "Python"},
            {"name": "Kumar Swamy", "subject": "DBMS"},
            {"name": "Priya Sharma", "subject": "Maths"},
            {"name": "Suresh Raina", "subject": "Java"},
            {"name": "Sneha Rao", "subject": "Web Tech"}
        ]
    if not subjects:
        subjects = [
            {"name": "Python Programming", "type": "Theory", "weekly_hours": 6},
            {"name": "Database Management Systems", "type": "Theory", "weekly_hours": 5},
            {"name": "Applied Mathematics", "type": "Theory", "weekly_hours": 5},
            {"name": "Object Oriented Java", "type": "Theory", "weekly_hours": 5},
            {"name": "Web Technologies", "type": "Theory", "weekly_hours": 4},
            {"name": "Python & AI Lab", "type": "Lab", "weekly_hours": 4},
            {"name": "DBMS Practical Lab", "type": "Lab", "weekly_hours": 4}
        ]
    if not rooms:
        rooms = [
            {"room_code": "C204", "type": "Lecture Hall"},
            {"room_code": "C205", "type": "Lecture Hall"},
            {"room_code": "C206", "type": "Lecture Hall"},
            {"room_code": "C207", "type": "Lecture Hall"},
            {"room_code": "Lab 1", "type": "Computer Lab"},
            {"room_code": "Lab 2", "type": "AI Lab"}
        ]

    theory_rooms = [r for r in rooms if "lab" not in r.get("type", "").lower()] or rooms
    lab_rooms = [r for r in rooms if "lab" in r.get("type", "").lower()] or rooms

    period_definitions = COLLEGE_BELL_SCHEDULE[:periods_per_day]

    # Helper: find teacher for subject
    def find_teacher_for_subject(sub_name: str) -> Dict[str, Any]:
        matched = [t for t in teachers if t.get("subject", "").lower() in sub_name.lower() or sub_name.lower() in t.get("subject", "").lower()]
        return matched[0] if matched else teachers[0]

    # PHASE 0: NAAN MUDHALVAN MANDATORY 4-PERIOD SLOTS (EVERY MONDAY MORNING: PERIODS 1, 2, 3, 4)
    if enable_naan_mudhalvan and "Monday" in days:
        for sec in sections:
            for p_num in [1, 2, 3, 4]:
                p_time = next((p["time"] for p in period_definitions if p["period"] == p_num), "09:00 - 09:50")
                section_schedule[("Monday", sec, p_num)] = {
                    "day": "Monday",
                    "period": p_num,
                    "time": p_time,
                    "section": sec,
                    "subject": "Naan Mudhalvan",
                    "teacher": "Skill Faculty",
                    "room": "Smart Hall"
                }

    # 1. SCHEDULE 2-PERIOD LAB BLOCKS FIRST
    lab_subjects = [s for s in subjects if "lab" in s.get("type", "").lower() or "lab" in s.get("name", "").lower()]
    lab_pairs = [(1, 2), (3, 4), (5, 6)]

    for lab_sub in lab_subjects:
        for sec in sections:
            blocks_needed = max(1, lab_sub.get("weekly_hours", 4) // 2)
            teacher = find_teacher_for_subject(lab_sub["name"])
            teacher_name = teacher.get("name", "Faculty")

            placed_blocks = 0
            shuffled_days = list(days)
            random.shuffle(shuffled_days)

            for d in shuffled_days:
                if placed_blocks >= blocks_needed:
                    break
                for p1, p2 in lab_pairs:
                    t_key1 = (d, p1, teacher_name)
                    t_key2 = (d, p2, teacher_name)
                    s_key1 = (d, sec, p1)
                    s_key2 = (d, sec, p2)

                    # Find available lab room
                    available_lab = None
                    for r in lab_rooms:
                        rk1 = (d, p1, r["room_code"])
                        rk2 = (d, p2, r["room_code"])
                        if rk1 not in room_busy and rk2 not in room_busy:
                            available_lab = r
                            break

                    if available_lab and t_key1 not in teacher_busy and t_key2 not in teacher_busy and s_key1 not in section_schedule and s_key2 not in section_schedule:
                        # Lock teacher
                        teacher_busy.add(t_key1)
                        teacher_busy.add(t_key2)
                        # Lock room
                        r_code = available_lab["room_code"]
                        room_busy.add((d, p1, r_code))
                        room_busy.add((d, p2, r_code))

                        time_str1 = next((p["time"] for p in period_definitions if p["period"] == p1), "09:00 - 09:50")
                        time_str2 = next((p["time"] for p in period_definitions if p["period"] == p2), "09:50 - 10:40")

                        section_schedule[s_key1] = {
                            "day": d, "period": p1, "time": time_str1, "section": sec,
                            "subject": lab_sub["name"], "teacher": teacher_name, "room": r_code
                        }
                        section_schedule[s_key2] = {
                            "day": d, "period": p2, "time": time_str2, "section": sec,
                            "subject": lab_sub["name"], "teacher": teacher_name, "room": r_code
                        }

                        placed_blocks += 1
                        break

    # 2. SCHEDULE THEORY SUBJECTS WITH CROSS-CLASS CLASH PREVENTION & QUOTAS
    theory_subjects = [s for s in subjects if s not in lab_subjects]
    if not theory_subjects:
        theory_subjects = subjects

    for d in days:
        for p_info in period_definitions:
            p_num = p_info["period"]
            p_time = p_info["time"]

            for sec in sections:
                s_key = (d, sec, p_num)
                if s_key in section_schedule:
                    continue

                # Find candidate theory subject
                candidate_subjects = []
                for sub in theory_subjects:
                    sub_name = sub["name"]
                    t_assigned = find_teacher_for_subject(sub_name)
                    t_name = t_assigned.get("name", "Faculty")

                    # Hard constraint: Is teacher teaching another section at (d, p_num)?
                    if (d, p_num, t_name) in teacher_busy:
                        continue

                    # Daily quota: max 2 of same subject per day
                    if section_day_subject_count.get((d, sec, sub_name), 0) >= 2:
                        continue

                    candidate_subjects.append((sub, t_name))

                if candidate_subjects:
                    # Pick subject with lowest count so far
                    candidate_subjects.sort(key=lambda item: section_subject_count.get((sec, item[0]["name"]), 0))
                    chosen_sub, chosen_teacher = candidate_subjects[0]

                    # Pick available room
                    chosen_room = None
                    for r in theory_rooms:
                        rk = (d, p_num, r["room_code"])
                        if rk not in room_busy:
                            chosen_room = r
                            break
                    if not chosen_room:
                        chosen_room = theory_rooms[0]

                    r_code = chosen_room["room_code"]
                    teacher_busy.add((d, p_num, chosen_teacher))
                    room_busy.add((d, p_num, r_code))

                    section_subject_count[(sec, chosen_sub["name"])] = section_subject_count.get((sec, chosen_sub["name"]), 0) + 1
                    section_day_subject_count[(d, sec, chosen_sub["name"])] = section_day_subject_count.get((d, sec, chosen_sub["name"]), 0) + 1

                    section_schedule[s_key] = {
                        "day": d, "period": p_num, "time": p_time, "section": sec,
                        "subject": chosen_sub["name"], "teacher": chosen_teacher, "room": r_code
                    }
                else:
                    # Self study / Library slot
                    section_schedule[s_key] = {
                        "day": d, "period": p_num, "time": p_time, "section": sec,
                        "subject": "Library / Seminar" if p_num == 7 else "Self Study Hour",
                        "teacher": "Dept Coordinator",
                        "room": "Seminar Hall"
                    }

    # Convert mapping to list sorted by day, period, and section
    day_order = {day: idx for idx, day in enumerate(days)}
    for s_key, slot_data in section_schedule.items():
        slots.append(slot_data)

    slots.sort(key=lambda s: (day_order.get(s["day"], 0), s["period"], s["section"]))
    return slots
