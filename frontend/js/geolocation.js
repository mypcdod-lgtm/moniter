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
          const accuracy = position.coords.accuracy; // in meters
          const timestamp = position.timestamp || Date.now();
          const ageSeconds = Math.abs(Date.now() - timestamp) / 1000;

          // ANTI-SPOOFING & PRECISION GUARD: Reject low-accuracy or stale fixes
          if (accuracy > 100) {
            reject(new Error(`GPS signal is too weak (accuracy ±${Math.round(accuracy)}m). You must have high-accuracy device GPS enabled (under ±100m) to check in.`));
            return;
          }

          if (ageSeconds > 60) {
            reject(new Error('GPS location fix is stale (older than 60s). Please re-acquire a live GPS fix.'));
            return;
          }

          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: accuracy,
            timestamp: timestamp
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
      // 1. Fetch live verified GPS coordinates from device
      const coords = await this.getCurrentPosition();
      console.log(`[GPS Verified] lat=${coords.latitude}, lon=${coords.longitude}, accuracy=±${Math.round(coords.accuracy)}m, timestamp=${coords.timestamp}`);

      // 2. Submit to backend for Haversine distance verification against room coords
      const result = await ApiClient.checkIn({
        class_name: className,
        room_code: roomCode,
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy_meters: coords.accuracy,
        timestamp: coords.timestamp,
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
