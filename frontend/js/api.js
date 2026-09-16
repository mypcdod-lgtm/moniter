// Centralized MyMonitorXX API Client
// Supports localhost default or custom deployed Render/cloud URL stored in localStorage
const API_BASE = localStorage.getItem("mymonitor_backend_url") || 
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
    ? "http://localhost:8000/api" 
    : "https://mymonitorxx-backend.onrender.com/api");

class ApiClient {
  static async getAuthToken() {
    if (window.FirebaseAuth && typeof window.FirebaseAuth.getIdToken === "function") {
      try {
        const token = await window.FirebaseAuth.getIdToken();
        if (token) return token;
      } catch (e) {}
    }
    return sessionStorage.getItem("mymonitor_token") || "";
  }

  static setAuthToken(token) {
    if (token) {
      sessionStorage.setItem("mymonitor_token", token);
    } else {
      sessionStorage.removeItem("mymonitor_token");
    }
    // Cleanse any legacy tokens lingering on persistent disk
    try { localStorage.removeItem("mymonitor_token"); } catch (e) {}
  }

  static async request(endpoint, options = {}) {
    const token = await this.getAuthToken();
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || `Request failed with status ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Health
  static getHealth() { return this.request("/health"); }

  // Auth & Profile
  static getProfile() { return this.request("/auth/me"); }
  static registerUser(userData) { return this.request("/auth/register", { method: "POST", body: JSON.stringify(userData) }); }
  static deleteUser(userId) { return this.request(`/users/${userId}`, { method: "DELETE" }); }

  // Teachers
  static getTeachers(dept = "") { return this.request(`/teachers?department=${encodeURIComponent(dept)}`); }
  static createTeacher(data) { return this.request("/teachers", { method: "POST", body: JSON.stringify(data) }); }
  static updateTeacher(id, data) { return this.request(`/teachers/${id}`, { method: "PUT", body: JSON.stringify(data) }); }
  static deleteTeacher(id) { return this.request(`/teachers/${id}`, { method: "DELETE" }); }

  // Subjects
  static getSubjects(dept = "") { return this.request(`/subjects?department=${encodeURIComponent(dept)}`); }
  static createSubject(data) { return this.request("/subjects", { method: "POST", body: JSON.stringify(data) }); }
  static deleteSubject(id) { return this.request(`/subjects/${id}`, { method: "DELETE" }); }

  // Classrooms / Rooms with GPS coordinates
  static getRooms(dept = "") { return this.request(`/rooms?department=${encodeURIComponent(dept)}`); }
  static createRoom(data) { return this.request("/rooms", { method: "POST", body: JSON.stringify(data) }); }
  static deleteRoom(id) { return this.request(`/rooms/${id}`, { method: "DELETE" }); }

  // Timetable
  static getTimetableVersions(dept = "") { return this.request(`/timetable/versions?department=${encodeURIComponent(dept)}`); }
  static getActiveTimetable(dept = "") { return this.request(`/timetable/active?department=${encodeURIComponent(dept)}`); }
  static generateTimetable(payload) { return this.request("/timetable/generate", { method: "POST", body: JSON.stringify(payload) }); }
  static applyTimetable(id) { return this.request(`/timetable/${id}/apply`, { method: "PUT" }); }

  // Live Attendance & GPS Check-In
  static getLiveSessions(dept = "") { return this.request(`/attendance/live?department=${encodeURIComponent(dept)}`); }
  static checkIn(checkInData) { return this.request("/attendance/check-in", { method: "POST", body: JSON.stringify(checkInData) }); }

  // Leaves
  static getLeaves(dept = "") { return this.request(`/leaves?department=${encodeURIComponent(dept)}`); }
  static submitLeave(data) { return this.request("/leaves", { method: "POST", body: JSON.stringify(data) }); }
  static reviewLeave(id, reviewData) { return this.request(`/leaves/${id}/review`, { method: "PUT", body: JSON.stringify(reviewData) }); }

  // Substitutions
  static findSubstitutes(time, dept = "") { return this.request(`/substitution/find?time=${encodeURIComponent(time)}&department=${encodeURIComponent(dept)}`); }
  static assignSubstitute(data) { return this.request("/substitution/assign", { method: "POST", body: JSON.stringify(data) }); }

  // Notifications
  static getNotifications(dept = "") { return this.request(`/notifications?department=${encodeURIComponent(dept)}`); }
  static markNotificationRead(id) { return this.request(`/notifications/${id}/read`, { method: "PUT" }); }
  static markAllNotificationsRead(dept = "") { return this.request(`/notifications/read-all?department=${encodeURIComponent(dept)}`, { method: "PUT" }); }

  // Weekly Topic Tracker
  static getTopics(weekKey = "", className = "", dept = "") {
    return this.request(`/attendance/topics?week_key=${encodeURIComponent(weekKey)}&class_name=${encodeURIComponent(className)}&department=${encodeURIComponent(dept)}`);
  }
  static saveTopic(data) {
    return this.request("/attendance/topics", { method: "POST", body: JSON.stringify(data) });
  }
  static deleteTopicWeek(weekKey) {
    return this.request(`/attendance/topics/${encodeURIComponent(weekKey)}`, { method: "DELETE" });
  }
}

window.ApiClient = ApiClient;
