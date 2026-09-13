// Centralized WebSocket Manager for Live Monitoring & Alerts
class WebSocketClient {
  constructor() {
    this.wsLive = null;
    this.wsNotif = null;
    this.listeners = new Map();
    this.reconnectTimer = null;
    this.department = "Information Technology";
  }

  getWsBaseUrl() {
    const customBackend = localStorage.getItem("mymonitor_backend_url");
    if (customBackend) {
      return customBackend.replace(/^http/, "ws").replace(/\/api\/?$/, "");
    }
    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (isLocal) {
      return "ws://localhost:8000";
    }
    return "wss://mymonitorxx-backend.onrender.com";
  }

  connect(department = "Information Technology", userId = "usr-admin-1") {
    this.department = department;
    const wsBase = this.getWsBaseUrl();

    // 1. Live Monitoring Room Connection
    try {
      if (this.wsLive) {
        this.wsLive.close();
      }
      this.wsLive = new WebSocket(`${wsBase}/ws/live/${encodeURIComponent(department)}`);
      
      this.wsLive.onopen = () => {
        console.log(`[WS] Connected to Live Monitoring Room for ${department}`);
      };

      this.wsLive.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.dispatch("live_update", payload);
        } catch (e) {
          console.warn("[WS] Non-JSON live message:", event.data);
        }
      };

      this.wsLive.onclose = () => {
        console.warn("[WS] Live monitoring channel disconnected. Reconnecting in 3s...");
        this.scheduleReconnect();
      };
    } catch (err) {
      console.warn("[WS] Live channel connection failed:", err);
    }

    // 2. Personal Notification Stream
    try {
      if (this.wsNotif) {
        this.wsNotif.close();
      }
      this.wsNotif = new WebSocket(`${wsBase}/ws/notifications/${encodeURIComponent(userId)}`);
      
      this.wsNotif.onopen = () => {
        console.log(`[WS] Connected to personal alerts stream for ${userId}`);
      };

      this.wsNotif.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.dispatch("notification", payload);
          if (typeof window.showToast === "function") {
            window.showToast(payload.data?.message || "New Campus Alert!", "info");
          }
        } catch (e) {
          console.warn("[WS] Non-JSON notification message:", event.data);
        }
      };
    } catch (err) {
      console.warn("[WS] Notifications channel connection failed:", err);
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(this.department);
    }, 3000);
  }

  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);
  }

  dispatch(eventType, data) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach((cb) => {
        try { cb(data); } catch (e) { console.error("[WS Dispatch Error]:", e); }
      });
    }
  }
}

window.WSClient = new WebSocketClient();
