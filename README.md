# MyMonitorXX - Campus Timetable & Live Monitoring Portal

Automated college timetable generator, departmental live attendance monitoring, and teacher check-in PWA with role-based authentication and hierarchical user provisioning.

---

## 🔐 Authentication & Access Credentials

The login screen supports auto-role routing based on the registered Gmail address:

| Role | Login Gmail | Password | Access Rights |
|---|---|---|---|
| **👨💼 Admin (Default)** | `canvaonly322@gmail.com`<br>*(also `canvaonly322@gmil.com`)* | `123BALASELVARAJA123` | Master control: Generates timetables, sets campus rules, **provisions HOD accounts with Gmail & password**. |
| **👨🏫 HOD (IT Dept)** | `hod.it@college.edu` | `hodpassword123` | Department control: Live monitoring, vacant class substitution, **provisions Teacher accounts with Gmail & password**. |
| **📱 Teacher (Arun)** | `arun@college.edu` | `teacherpass123` | Mobile PWA check-in: View daily schedule, 1-tap class check-in to activate live classroom status. |

> **Tip**: The login page includes **1-Click Quick Login buttons** for instant testing without typing.

---

## 👑 Hierarchical User Provisioning

1. **Admin adds HODs**:
   - Go to Admin Panel $\rightarrow$ **Department Heads (HODs)** $\rightarrow$ Click **+ Add HOD**.
   - Input Name, Department, Gmail Address, and set an Access Password.
   - The HOD can immediately sign in using those credentials.

2. **HOD adds Teachers**:
   - Go to HOD Desk $\rightarrow$ **Department Teachers** $\rightarrow$ Click **+ Add Teacher**.
   - Input Name, Subject, Department, Gmail Address, and set an Access Password.
   - The teacher can immediately sign in using those credentials into their mobile PWA.

---

## 🌟 Portals & Workflow

### 1. 👨💼 Admin Portal
- **Main Workflow**:
  $$\text{Add College Data} \longrightarrow \text{Set Constraints} \longrightarrow \text{Generate Timetable} \longrightarrow \text{Review Conflicts} \longrightarrow \text{Apply Timetable} \longrightarrow \text{Manage Versions}$$
- **Features**: Autonomous Timetable Generator with constraint solver simulation, Faculty Directory, HOD Provisioning, Room allocation, and Version history.

### 2. 👨🏫 HOD Portal (Live Monitoring)
- **Counters**: Today's Classes (48) • Active (32 🟢) • Scheduled (9 ⚪) • Vacant (5 🔴) • Substitute (2 🟡).
- **Substitution Flow**:
  $$\text{Live Status} \longrightarrow \text{Vacant Class Alert} \longrightarrow \text{Find Free Teacher} \longrightarrow \text{1-Click Assign Substitute}$$

### 3. 📱 Teacher Portal (PWA)
- **Greeting**: "Good Morning, Arun 👋" with campus WiFi geo-verification.
- **NEXT CLASS Card**: 10:00 - 11:00 Python IT-A (Room C204) with **[ CHECK IN NOW ]** button.
- **Schedule**:
  - `09:00` DBMS IT-A ✓ Completed
  - `10:00` Python IT-B 🟢 Active
  - `11:00` Maths IT-C Upcoming
  - `12:00` Lab IT-A Upcoming

---

## 📱 PWA & Direct App Download (No App Store Needed!)

This application is configured as a full **Progressive Web App (PWA)**:
- Anyone in your college or department can visit the URL in Chrome, Edge, or Safari.
- Click the **`[ 📲 Install App ]`** button in the top navigation bar or select **"Add to Home Screen"** in your mobile browser.
- It immediately installs as an app on your phone, tablet, or PC without needing Google Play Store or Apple App Store.
- Includes offline fallback via `frontend/sw.js` and custom app icons.

---

## 📍 GPS Teacher Check-In (100% Free)

- Uses device hardware GPS through the browser `navigator.geolocation` API.
- Mathematically verified on the backend using the **Haversine formula** against classroom coordinates (`latitude`, `longitude`, `geo_radius_meters`).
- Zero external paid APIs required!

---

## 🚀 How to Run

### 1. Start the FastAPI Backend (API & WebSockets)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Docs & Swagger UI: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/health`

### 2. Run Backend Unit & Integration Tests
```bash
pytest backend/tests/test_api.py -v
```

### 3. Start the Web & PWA Frontend
```bash
python server.py
```
Open **`http://localhost:3000`** in any web browser.

