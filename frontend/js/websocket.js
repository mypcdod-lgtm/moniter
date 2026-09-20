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

  async connect(department = "Information Technology", userId = null) {
    this.department = department;
    const wsBase = this.getWsBaseUrl();

    // Authenticate WebSocket stream with Firebase ID token (JWT)
    let token = "";
    if (window.FirebaseAuth && typeof window.FirebaseAuth.getIdToken === "function") {
      try {
        token = await window.FirebaseAuth.getIdToken();
      } catch (e) {}
    }

    if (!userId) {
      const user = (window.appState && window.appState.currentUser) ? window.appState.currentUser : null;
      userId = user ? (user.email || user.id) : "usr-admin-1";
    }

    const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : "";

    // 1. Live Monitoring Room Connection
    try {
      if (this.wsLive) {
        this.wsLive.close();
      }
      this.wsLive = new WebSocket(`${wsBase}/ws/live/${encodeURIComponent(department)}${tokenQuery}`);
      
      this.wsLive.onopen = () => {
        console.log(`[WS] Connected to Live Monitoring Room for ${department} (JWT Authenticated)`);
      };

      this.wsLive.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.dispatch("live_update", payload);
          if (payload.type === "TOPIC_UPDATE") {
            this.dispatch("topic_update", payload);
          } else if (payload.type === "TOPIC_DELETED") {
            this.dispatch("topic_deleted", payload);
          } else if (payload.type === "DUTY_REPORT_UPDATE") {
            this.dispatch("duty_report_update", payload);
          } else if (payload.type === "CHECK_IN_UPDATE") {
            this.dispatch("check_in_update", payload);
          }
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
      this.wsNotif = new WebSocket(`${wsBase}/ws/notifications/${encodeURIComponent(userId)}${tokenQuery}`);
      
      this.wsNotif.onopen = () => {
        console.log(`[WS] Connected to personal alerts stream for ${userId} (JWT Authenticated)`);
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
