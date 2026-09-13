import math

EARTH_RADIUS_METERS = 6371000.0

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two points on the Earth in meters.
    100% FREE mathematical calculation - no external paid API required!
    """
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) *
         math.sin(delta_lambda / 2.0) ** 2)
    
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(EARTH_RADIUS_METERS * c, 2)

def verify_teacher_location(user_lat: float, user_lon: float, room_lat: float, room_lon: float, max_radius_meters: float = 60.0) -> dict:
    distance = haversine_distance(user_lat, user_lon, room_lat, room_lon)
    is_valid = distance <= max_radius_meters
    return {
        "verified": is_valid,
        "distance_meters": distance,
        "max_allowed_meters": max_radius_meters
    }
