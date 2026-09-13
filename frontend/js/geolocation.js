// Browser Geolocation API Helper (100% FREE - Device GPS Based)
class GeoLocationHelper {
  static isSupported() {
    return "geolocation" in navigator;
  }

  static async getCurrentPosition(options = {}) {
    if (!this.isSupported()) {
      throw new Error("Geolocation is not supported by your device or browser.");
    }

    const defaultOptions = {
      enableHighAccuracy: true, // Forces precise device GPS rather than coarse IP
      timeout: 10000,           // 10 second timeout
      maximumAge: 0             // Do not use cached stale coordinates
    };

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy // in meters
          });
        },
        (error) => {
          let message = "Unable to retrieve GPS coordinates.";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = "GPS permission denied. Please allow location access in your browser/device settings to check into class.";
              break;
            case error.POSITION_UNAVAILABLE:
              message = "Location unavailable. Please ensure GPS/location services are enabled on your device.";
              break;
            case error.TIMEOUT:
              message = "Location request timed out. Please check GPS signal and try again.";
              break;
          }
          reject(new Error(message));
        },
        { ...defaultOptions, ...options }
      );
    });
  }

  static async performTeacherCheckIn(className, roomCode, department = "Information Technology") {
    try {
      // 1. Fetch live GPS coordinates from device
      const coords = await this.getCurrentPosition();
      console.log(`[GPS] Acquired coordinates: lat=${coords.latitude}, lon=${coords.longitude}, accuracy=${coords.accuracy}m`);

      // 2. Submit to backend for Haversine distance verification against room coords
      const result = await ApiClient.checkIn({
        class_name: className,
        room_code: roomCode,
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy_meters: coords.accuracy,
        department: department
      });

      return result;
    } catch (err) {
      console.error("[GPS Check-in Failed]:", err);
      throw err;
    }
  }
}

window.GeoLocationHelper = GeoLocationHelper;
