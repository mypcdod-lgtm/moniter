from typing import List, Dict, Any

def find_available_substitutes(
    all_teachers: List[Dict[str, Any]],
    active_sessions: List[Dict[str, Any]],
    target_time: str,
    exclude_teacher: str = ""
) -> List[Dict[str, Any]]:
    """
    Finds teachers who are NOT currently in a class during target_time
    and are not on leave.
    """
    busy_teacher_names = {
        session["teacher"] for session in active_sessions
        if session.get("time") == target_time and session.get("status") in ("ACTIVE", "SCHEDULED")
    }
    if exclude_teacher:
        busy_teacher_names.add(exclude_teacher)

    available = []
    for teacher in all_teachers:
        t_name = teacher["name"]
        t_status = teacher.get("status", "Available")
        if t_name not in busy_teacher_names and t_status != "On Leave":
            available.append({
                "id": str(teacher.get("_id", "")),
                "name": t_name,
                "email": teacher.get("email", ""),
                "department": teacher.get("department", "Information Technology"),
                "specialization": teacher.get("subject", "General"),
                "status": "Available",
                "free_time": target_time
            })
    return available
