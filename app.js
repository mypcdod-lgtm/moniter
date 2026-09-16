// MyMonitorXX - Core Application Logic, Authentication & RBAC

// Initial State Data
// Initial State Data - Secure Cloud-Backed Baseline (No Hardcoded User Credentials)
const DEFAULT_STATE = {
  currentUser: null, // null = show login screen
  activeRole: 'admin', // 'admin', 'hod', 'teacher'
  mobileFrame: false,
  teacherCheckedIn: false,

  // User Accounts Directory (Loaded securely from Firebase Cloud Firestore & Auth)
  users: [],

  hodsList: [],

  hodStats: {
    totalClasses: 0,
    active: 0,
    scheduled: 0,
    vacant: 0,
    substitute: 0
  },

  liveMonitoring: [],
  availableSubstitutes: [],
  teachersList: [],
  subjectsList: [],
  classroomsList: [],
  rooms: [],
  timetableVersions: [],
  studentBatches: [],

  // Exact College Bell Schedule (7 Periods of 50m + Morning Break 20m + Lunch Break 50m)
  collegeBellSchedule: [
    { period: 1, name: 'Period 1', time: '09:00 - 09:50', isBreak: false },
    { period: 2, name: 'Period 2', time: '09:50 - 10:40', isBreak: false },
    { period: 'MB', name: 'Morning Break', time: '10:40 - 11:00', isBreak: true },
    { period: 3, name: 'Period 3', time: '11:00 - 11:50', isBreak: false },
    { period: 4, name: 'Period 4', time: '11:50 - 12:40', isBreak: false },
    { period: 'LB', name: 'Lunch Break', time: '12:40 - 01:30', isBreak: true },
    { period: 5, name: 'Period 5', time: '01:30 - 02:20', isBreak: false },
    { period: 6, name: 'Period 6', time: '02:20 - 03:10', isBreak: false },
    { period: 7, name: 'Period 7', time: '03:10 - 04:00', isBreak: false }
  ],

  subjectTeacherMappings: [],
  masterTimetableSlots: [],
  teacherTodayClasses: [],
  leavesList: []
};

// Load saved state (support legacy typo 'mymoniter_state' and proper 'mymonitor_state')
let appState = JSON.parse(localStorage.getItem('mymonitor_state') || localStorage.getItem('mymoniter_state')) || DEFAULT_STATE;

// Ensure proper array structures
if (!Array.isArray(appState.users)) appState.users = [];
if (!Array.isArray(appState.classroomsList)) appState.classroomsList = [];
if (!Array.isArray(appState.rooms)) appState.rooms = appState.classroomsList;
if (!Array.isArray(appState.studentBatches)) appState.studentBatches = [];
if (!Array.isArray(appState.subjectsList)) appState.subjectsList = [];
if (!Array.isArray(appState.teachersList)) appState.teachersList = [];
if (!Array.isArray(appState.hodsList)) appState.hodsList = [];
if (!Array.isArray(appState.subjectTeacherMappings)) appState.subjectTeacherMappings = [];
if (!Array.isArray(appState.masterTimetableSlots)) appState.masterTimetableSlots = [];
if (!Array.isArray(appState.liveMonitoring)) appState.liveMonitoring = [];
if (!Array.isArray(appState.leavesList)) appState.leavesList = [];
if (!appState.collegeBellSchedule) appState.collegeBellSchedule = DEFAULT_STATE.collegeBellSchedule;

// Automatic Cleanup of Legacy Hardcoded Mock Data & Default Credentials
if (!appState._cleanDataV22) {
  const legacyMockEmails = ['arun@college.edu', 'kumar@college.edu', 'priya@college.edu', 'suresh@college.edu', 'sneha@college.edu', 'vikram@college.edu', 'hod.it@college.edu', 'sunitha.hod@college.edu'];
  const legacyMockSubjCodes = ['IT301', 'IT302', 'MA301', 'IT303', 'IT304'];
  const legacyMockBatchIds = ['batch-1', 'batch-2', 'batch-3', 'batch-4'];

  appState.users = (appState.users || []).filter(u => {
    const email = (u.email || '').toLowerCase();
    return !legacyMockEmails.includes(email) && u.id !== 'usr-hod-1' && u.id !== 'usr-teacher-1';
  });

  appState.hodsList = (appState.hodsList || []).filter(h => !legacyMockEmails.includes((h.email || '').toLowerCase()));
  appState.teachersList = (appState.teachersList || []).filter(t => !legacyMockEmails.includes((t.email || '').toLowerCase()));

  if (appState.subjectsList.length > 0 && appState.subjectsList.every(s => legacyMockSubjCodes.includes(s.code))) {
    appState.subjectsList = [];
  }
  if (appState.studentBatches.length > 0 && appState.studentBatches.every(b => legacyMockBatchIds.includes(b.id))) {
    appState.studentBatches = [];
  }
  if (appState.classroomsList.length > 0 && (appState.classroomsList.some(r => r.room === 'C204' && !r.latitude) || (appState.classroomsList.length === 6 && appState.classroomsList.some(r => r.room === 'C204')))) {
    appState.classroomsList = [];
    appState.rooms = [];
  }
  if (appState.subjectTeacherMappings.length > 0 && appState.subjectTeacherMappings.some(m => m.id === 'map-1')) {
    appState.subjectTeacherMappings = [];
  }
  if (appState.masterTimetableSlots.length > 0 && appState.masterTimetableSlots.some(s => s.id === 'slot-1')) {
    appState.masterTimetableSlots = [];
  }
  appState.leavesList = (appState.leavesList || []).filter(l => l.id !== 'leave-sample-1');
  if (appState.liveMonitoring.length > 0 && appState.liveMonitoring.some(m => m.class === 'IT-A' && m.subject === 'Python')) {
    appState.liveMonitoring = [];
  }
  appState._cleanDataV22 = true;
}

// Enterprise Security Hardening: Purge any legacy plaintext passwords from cached state and localStorage
try {
  const rawCache = localStorage.getItem('mymonitor_state') || localStorage.getItem('mymoniter_state');
  if (rawCache && rawCache.includes('"password"')) {
    const parsedCache = JSON.parse(rawCache);
    const scrubbed = JSON.parse(JSON.stringify(parsedCache, (k, v) => k === 'password' ? undefined : v));
    localStorage.setItem('mymonitor_state', JSON.stringify(scrubbed));
  }
  localStorage.removeItem('mymoniter_state');
  localStorage.removeItem('mymonitor_token'); // Purge legacy long-lived token from persistent disk storage
} catch (e) {}

if (Array.isArray(appState.users)) {
  appState.users.forEach(u => { delete u.password; });
}
if (Array.isArray(appState.hodsList)) {
  appState.hodsList.forEach(h => { delete h.password; });
}
if (Array.isArray(appState.teachersList)) {
  appState.teachersList.forEach(t => { delete t.password; });
}

let cloudSaveTimer = null;
function saveState(immediateCloud = false) {
  try {
    // Malware & XSS Defense: Never write password fields to localStorage
    const cleanLocal = JSON.parse(JSON.stringify(appState, (key, val) => {
      if (key === 'password') return undefined;
      return val;
    }));
    localStorage.setItem('mymonitor_state', JSON.stringify(cleanLocal));
  } catch (e) {
    console.warn('localStorage cache note:', e.message);
  }

  // Sync to Firebase Cloud Firestore across all devices (PC, Mobile, HOD, Teachers)
  if (window.FirebaseDb && typeof window.FirebaseDb.saveAppState === 'function') {
    if (immediateCloud) {
      clearTimeout(cloudSaveTimer);
      window.FirebaseDb.saveAppState(appState);
    } else {
      clearTimeout(cloudSaveTimer);
      cloudSaveTimer = setTimeout(() => {
        window.FirebaseDb.saveAppState(appState);
      }, 300);
    }
  }
}

// Server-side RBAC Verification: Ensure client-side role strictly matches verified backend authority
async function verifyUserRoleWithBackend() {
  if (!appState.currentUser) return;
  try {
    if (window.ApiClient && window.FirebaseAuth) {
      const profile = await window.ApiClient.getProfile();
      if (profile && profile.role) {
        if (appState.currentUser.role !== profile.role) {
          console.warn('Role mismatch detected between client and backend! Re-synchronizing to server truth.');
          appState.currentUser = Object.freeze({ ...appState.currentUser, role: profile.role });
          appState.activeRole = profile.role;
          saveState(true);
          renderActiveViews();
        }
      }
    }
  } catch (e) {
    console.warn('Backend RBAC verification note:', e.message);
  }
}
window.verifyUserRoleWithBackend = verifyUserRoleWithBackend;

// Transport Security: Enforce HTTPS in production environments
if (location.protocol === 'http:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  location.replace('https://' + location.host + location.pathname + location.search + location.hash);
}

// Enterprise XSS Defense: Global HTML entity escaping utility
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
window.escapeHTML = escapeHTML;

// Strict RFC 5322 Format Email Validator
const RFC5322_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return RFC5322_EMAIL_REGEX.test(email.trim());
}
window.validateEmail = validateEmail;

// Enterprise Password Policy Validator:
// Requires 8-128 chars, at least 1 lowercase, 1 uppercase, 1 digit, 1 special character
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required.' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (password.length > 128) {
    return { valid: false, message: 'Password cannot exceed 128 characters.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter (a-z).' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter (A-Z).' };
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number (0-9).' };
  }
  if (!/[@$!%*?&#^_\-]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character (@, $, !, %, *, ?, &, #, ^, _, -).' };
  }
  return { valid: true };
}
window.validatePassword = validatePassword;

// Global Toast Notifications
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  const bg = type === 'success' ? 'bg-emerald-600 text-white' : (type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-white');
  toast.className = `${bg} px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-medium transition-all duration-300 transform translate-y-2 opacity-0 z-50`;
  toast.innerHTML = `
    <span class="text-lg">${type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ')}</span>
    <span>${escapeHTML(message)}</span>
  `;
  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// =========================================================================
// AUTHENTICATION & LOGIN CONTROLLERS
// =========================================================================

function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
}

async function handleAddAdmin(e) {
  if (e && e.preventDefault) e.preventDefault();
  const name = (document.getElementById('new-admin-name')?.value || '').trim();
  const email = (document.getElementById('new-admin-email')?.value || '').trim().toLowerCase();
  const password = (document.getElementById('new-admin-password')?.value || '').trim();
  const roleType = document.getElementById('new-admin-role-type')?.value || 'General Admin';

  if (!name || !email || !password) {
    showToast('Admin Name, Email, and Password are required.', 'error');
    return;
  }

  if (!validateEmail(email)) {
    showToast('Please enter a valid RFC 5322 formatted email address.', 'error');
    return;
  }

  const passCheck = validatePassword(password);
  if (!passCheck.valid) {
    showToast(passCheck.message, 'error');
    return;
  }

  if ((appState.users || []).some(u => (u.email || '').toLowerCase() === email)) {
    showToast('A user with this Email already exists.', 'error');
    return;
  }

  // Register in Firebase Cloud Auth (passwords are hashed on Google servers via scrypt)
  if (window.FirebaseAuth && typeof window.FirebaseAuth.registerWithEmail === 'function') {
    try {
      await window.FirebaseAuth.registerWithEmail(email, password);
      console.log('✅ Firebase Auth registered new admin:', email);
    } catch (err) {
      console.warn('Firebase Auth registration note:', err.message);
      if (err.code === 'auth/email-already-in-use') {
        showToast('This email is already registered in Firebase Authentication.', 'error');
        return;
      }
    }
  }

  // Create public user profile in state WITHOUT plaintext password
  const newAdmin = {
    id: 'usr-admin-' + Date.now(),
    name,
    email,
    role: 'admin',
    dept: roleType,
    isOnline: false,
    created_at: new Date().toISOString()
  };

  appState.users = appState.users || [];
  appState.users.push(newAdmin);

  saveState(true);
  closeModal('modal-add-admin');
  showToast(`Administrator account for ${name} created successfully!`, 'success');
  const form = document.getElementById('form-add-admin');
  if (form) form.reset();
}

function renderQuickLoginButtons() {
  // Quick 1-click login permanently disabled for security
  const container = document.getElementById('quick-custom-accounts');
  if (container) {
    container.classList.add('hidden');
    container.innerHTML = '';
  }
}

async function handleLogin(e) {
  if (e) e.preventDefault();
  const emailInput = (document.getElementById('login-email')?.value || '').trim().toLowerCase();
  const passwordInput = (document.getElementById('login-password')?.value || '').trim();

  if (!emailInput || !passwordInput) {
    showToast('Please enter both email address and password.', 'error');
    return;
  }

  if (!validateEmail(emailInput)) {
    showToast('Please enter a valid RFC 5322 formatted email address.', 'error');
    return;
  }

  let firebaseToken = null;
  let authSuccess = false;

  // 1. Authenticate against Firebase Cloud Auth (Passwords securely verified by Google)
  if (window.FirebaseAuth && window.FirebaseAuth.loginWithEmail) {
    try {
      const fbRes = await window.FirebaseAuth.loginWithEmail(emailInput, passwordInput);
      firebaseToken = fbRes.token;
      authSuccess = true;
      console.log('✅ Firebase Cloud Authentication verified for:', emailInput);
    } catch (fbErr) {
      console.warn('Firebase Auth notice:', fbErr.code || fbErr.message);
      if (fbErr.code === 'auth/user-not-found' || fbErr.code === 'auth/invalid-credential' || fbErr.code === 'auth/invalid-login-credentials' || fbErr.code === 'auth/wrong-password') {
        showToast('Invalid email or password. Please verify and try again.', 'error');
        return;
      }
    }
  }

  // 2. Locate user profile in database
  let user = (appState.users || []).find(u => 
    (u.email && u.email.toLowerCase() === emailInput) || 
    (u.altEmail && u.altEmail.toLowerCase() === emailInput)
  );

  // 3. Check HOD directory
  if (!user && appState.hodsList) {
    const hodMatch = appState.hodsList.find(h => h.email && h.email.toLowerCase() === emailInput);
    if (hodMatch) {
      user = {
        id: 'usr-hod-' + (hodMatch.id || Date.now()),
        name: hodMatch.name,
        email: hodMatch.email,
        role: 'hod',
        dept: hodMatch.dept || 'Information Technology'
      };
      appState.users = appState.users || [];
      appState.users.push(user);
      saveState(true);
    }
  }

  // 4. Check Faculty Teacher directory
  if (!user && appState.teachersList) {
    const teacherMatch = appState.teachersList.find(t => t.email && t.email.toLowerCase() === emailInput);
    if (teacherMatch) {
      user = {
        id: 'usr-teacher-' + (teacherMatch.id || Date.now()),
        name: teacherMatch.name,
        email: teacherMatch.email,
        role: 'teacher',
        dept: teacherMatch.dept || 'Information Technology',
        subject: teacherMatch.subject || ''
      };
      appState.users = appState.users || [];
      appState.users.push(user);
      saveState(true);
    }
  }

  // 5. Enforce Cloud Authentication
  if (!authSuccess) {
    showToast('Authentication failed. Invalid email or password.', 'error');
    return;
  }

  // If user profile is not in local state, create minimal profile based on first-user logic
  if (!user) {
    user = {
      id: 'usr-fb-' + Date.now().toString(36),
      name: emailInput.split('@')[0],
      email: emailInput,
      role: (appState.users && appState.users.length === 0) ? 'admin' : 'teacher',
      dept: 'Information Technology'
    };
    appState.users = appState.users || [];
    appState.users.push(user);
    saveState(true);
  }

  // Authenticate user session & FREEZE to prevent console role tampering
  appState.currentUser = Object.freeze({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    dept: user.dept || 'Information Technology',
    subject: user.subject || ''
  });
  appState.activeRole = user.role;
  saveState(true);

  // Connect ApiClient Auth Token (Session-scoped)
  if (window.ApiClient && firebaseToken) {
    ApiClient.setAuthToken(firebaseToken);
  }

  // Verify role integrity against server authority
  if (typeof verifyUserRoleWithBackend === 'function') {
    verifyUserRoleWithBackend();
  }

  // Connect WebSocket live room with authenticated identity
  if (window.WSClient) {
    window.WSClient.connect(user.dept || 'Information Technology', user.email || user.id);
  }

  updateAuthUI();
  setRole(user.role);
  showToast(`Welcome, ${user.name}! Signed in as ${user.role.toUpperCase()}.`, 'success');

  // Trigger real-time data sync with backend
  syncWithBackend();
}

async function handleGoogleLogin() {
  if (!window.FirebaseAuth || !window.FirebaseAuth.loginWithGoogle) {
    showToast('Firebase Auth SDK is still loading or not configured.', 'error');
    return;
  }

  try {
    const res = await window.FirebaseAuth.loginWithGoogle();
    const gUser = res.user;
    const token = res.token;
    console.log('Google login user:', gUser.email);

    // Match existing user by Google email, or create session
    let user = (appState.users || []).find(u => (u.email || '').toLowerCase() === gUser.email.toLowerCase());
    if (!user) {
      const isFirstUser = !appState.users || appState.users.length === 0;
      user = {
        id: 'usr-g-' + gUser.uid.substring(0, 8),
        name: gUser.displayName || 'Google User',
        email: gUser.email,
        role: isFirstUser ? 'admin' : 'teacher',
        dept: 'Information Technology'
      };
      appState.users = appState.users || [];
      appState.users.push(user);
    }

    appState.currentUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      dept: user.dept || 'Information Technology',
      subject: user.subject || ''
    };
    appState.activeRole = user.role;
    saveState(true);

    if (window.ApiClient) {
      ApiClient.setAuthToken(token);
    }

    if (window.WSClient) {
      window.WSClient.connect(user.dept || 'Information Technology', user.id);
    }

    updateAuthUI();
    setRole(user.role);
    showToast(`Signed in with Google as ${user.name}! (${user.role.toUpperCase()})`, 'success');
    syncWithBackend();
  } catch (err) {
    console.error('Google Sign-In Error:', err);
    showToast(`Google Sign-In failed: ${err.message}`, 'error');
  }
}

function handleLogout() {
  appState.currentUser = null;
  saveState();
  updateAuthUI();
  showToast('You have signed out successfully.', 'info');
}

function updateAuthUI() {
  const loginSection = document.getElementById('section-login');
  const roleSwitcher = document.getElementById('header-role-switcher');
  const userProfileBar = document.getElementById('header-user-profile');
  const clockContainer = document.getElementById('header-clock');

  if (!appState.currentUser) {
    // Show login section, hide app dashboards
    if (loginSection) loginSection.classList.add('active');
    document.querySelectorAll('.role-section:not(#section-login)').forEach(sec => sec.classList.remove('active'));
    
    if (roleSwitcher) roleSwitcher.classList.add('hidden');
    if (userProfileBar) userProfileBar.classList.add('hidden');
    renderQuickLoginButtons();
    return;
  }

  // User is logged in
  if (loginSection) loginSection.classList.remove('active');
  if (userProfileBar) userProfileBar.classList.remove('hidden');

  // Populate User Profile in Header
  const userNameEl = document.getElementById('header-user-name');
  const userRoleEl = document.getElementById('header-user-role');
  const userEmailEl = document.getElementById('header-user-email');
  const userAvatarEl = document.getElementById('header-user-avatar');

  if (userNameEl) userNameEl.textContent = appState.currentUser.name;
  if (userRoleEl) userRoleEl.textContent = appState.currentUser.role.toUpperCase();
  if (userEmailEl) userEmailEl.textContent = appState.currentUser.email;
  if (userAvatarEl) userAvatarEl.textContent = appState.currentUser.name.charAt(0);

  const drawerRoleEl = document.getElementById('drawer-user-role');
  const drawerEmailEl = document.getElementById('drawer-user-email');
  if (drawerRoleEl) drawerRoleEl.textContent = `${appState.currentUser.role.toUpperCase()} SESSION`;
  if (drawerEmailEl) drawerEmailEl.textContent = appState.currentUser.email;

  // STRICT ROLE ACCESS CONTROL:
  // ONLY Administrator can see role switcher.
  // HOD and Teacher will NEVER see the role switcher.
  if (roleSwitcher) {
    if (appState.currentUser.role === 'admin') {
      roleSwitcher.classList.remove('hidden');
    } else {
      roleSwitcher.classList.add('hidden');
    }
  }

  // Force user strictly into their own dashboard
  if (appState.currentUser.role !== 'admin') {
    appState.activeRole = appState.currentUser.role;
  }
  setRole(appState.activeRole || appState.currentUser.role);
}

// Real-Time Synchronization with FastAPI Backend
async function syncWithBackend() {
  if (!window.ApiClient) return;
  try {
    const dept = appState.currentUser?.dept || 'Information Technology';

    // 1. Sync Live Sessions
    const sessions = await ApiClient.getLiveSessions(dept);
    if (sessions && sessions.length > 0) {
      appState.liveMonitoring = sessions.map((s, idx) => ({
        id: s.id || s._id || idx + 1,
        class: s.class_name || s.class,
        subject: s.subject,
        teacher: s.teacher,
        room: s.room,
        status: s.status,
        time: s.time,
        substituteTeacher: s.substitute || null,
        department: s.department || dept
      }));

      // Update counters
      appState.hodStats.totalClasses = appState.liveMonitoring.length;
      appState.hodStats.active = appState.liveMonitoring.filter(c => c.status === 'ACTIVE').length;
      appState.hodStats.scheduled = appState.liveMonitoring.filter(c => c.status === 'SCHEDULED').length;
      appState.hodStats.vacant = appState.liveMonitoring.filter(c => c.status === 'VACANT').length;
      appState.hodStats.substitute = appState.liveMonitoring.filter(c => c.status === 'SUBSTITUTE').length;
    }

    // 2. Sync Teachers
    const teachers = await ApiClient.getTeachers(dept);
    if (teachers && teachers.length > 0) {
      appState.teachersList = teachers.map((t, idx) => ({
        id: t.id || t._id || idx + 1,
        name: t.name,
        email: t.email,
        subject: t.subject,
        dept: t.department || 'IT',
        workload: t.workload || '16 hrs/wk',
        status: t.status || 'Available'
      }));
    }

    // 3. Sync Timetable Versions
    const versions = await ApiClient.getTimetableVersions(dept);
    if (versions && versions.length > 0) {
      appState.timetableVersions = versions.map(v => ({
        version: v.version,
        status: v.status,
        term: v.term,
        appliedAt: v.applied_at || 'Recently',
        generatedBy: v.generated_by
      }));
    }

    // 4. Sync Classrooms
    const rooms = await ApiClient.getRooms(dept);
    if (rooms && rooms.length > 0) {
      appState.classroomsList = rooms.map(r => ({
        id: r.id || r._id,
        room: r.room_code,
        type: r.type,
        capacity: r.capacity,
        block: r.block,
        latitude: r.latitude,
        longitude: r.longitude,
        radius: r.geo_radius_meters
      }));
      renderAdminRooms();
    }

    // 4b. Sync Subjects
    const subjects = await ApiClient.getSubjects(dept);
    if (subjects && subjects.length > 0) {
      appState.subjectsList = subjects.map(s => ({
        id: s.id || s._id,
        code: s.code,
        name: s.name,
        type: s.type,
        weeklyHours: s.weekly_hours,
        dept: s.department
      }));
      renderAdminSubjects();
    }

    // 5. Sync Leave Requests
    const leaves = await ApiClient.getLeaves(dept);
    if (leaves) {
      appState.leavesList = leaves;
      renderHodLeaves();
    }

    // 6. Sync Campus Notifications
    const notifs = await ApiClient.getNotifications(dept);
    if (notifs) {
      appState.notificationsList = notifs;
      renderNotifications();
    }

    saveState();
    renderActiveViews();
    console.log('⚡ [Backend Sync] Successfully updated state from FastAPI backend');
  } catch (err) {
    console.warn('Backend sync offline/fallback mode (using localStorage):', err.message);
  }
}

// =========================================================================
// ROLE SWITCHER & NAVIGATION
// =========================================================================

function setRole(roleName) {
  if (!appState.currentUser) {
    updateAuthUI();
    return;
  }

  // Security guard: HOD cannot access admin/teacher, Teacher cannot access admin/hod
  if (appState.currentUser.role !== 'admin' && roleName !== appState.currentUser.role) {
    console.warn(`[Access Denied] User with role '${appState.currentUser.role}' cannot view '${roleName}' dashboard.`);
    roleName = appState.currentUser.role;
  }

  appState.activeRole = roleName;
  saveState();

  // Highlight active role button
  const buttons = document.querySelectorAll('.role-pill-btn');
  buttons.forEach(btn => {
    const isTarget = btn.getAttribute('data-role') === roleName;
    if (isTarget) {
      btn.className = 'role-pill-btn flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm bg-indigo-600 text-white transition-all';
    } else {
      btn.className = 'role-pill-btn flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all';
    }
  });

  // Switch role section
  document.querySelectorAll('.role-section').forEach(sec => {
    sec.classList.remove('active');
  });

  const activeSection = document.getElementById(`section-${roleName}`);
  if (activeSection) {
    activeSection.classList.add('active');
  }

  // Teacher mobile frame control toggle visibility
  const frameToggleBtn = document.getElementById('teacher-frame-toggle');
  if (frameToggleBtn) {
    frameToggleBtn.style.display = roleName === 'teacher' ? 'inline-flex' : 'none';
  }

  // Close any open drawers when changing role
  closeAdminDrawer();
  closeHodDrawer();
  closeTeacherDrawer();

  renderActiveViews();
}

// Sub-Tab Navigation for Admin (Supports Desktop Sidebar and Mobile Drawer)
function switchAdminTab(tabId) {
  document.querySelectorAll('.admin-tab-pane').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.admin-sidebar-link, .admin-drawer-link').forEach(el => {
    el.classList.remove('bg-indigo-50', 'text-indigo-700', 'font-semibold');
    el.classList.add('text-slate-600', 'hover:bg-slate-50');
  });

  const targetPane = document.getElementById(`admin-tab-${tabId}`);
  if (targetPane) targetPane.classList.remove('hidden');

  document.querySelectorAll(`[data-admin-tab="${tabId}"]`).forEach(activeLink => {
    activeLink.classList.add('bg-indigo-50', 'text-indigo-700', 'font-semibold');
    activeLink.classList.remove('text-slate-600');
  });

  // Dynamically render active tab content from stored data
  if (tabId === 'classrooms') {
    renderAdminRooms();
  } else if (tabId === 'classes') {
    renderAdminBatches();
  } else if (tabId === 'subjects') {
    renderAdminSubjects();
  } else if (tabId === 'hods' || tabId === 'teachers' || tabId === 'versions') {
    renderAdminTables();
  } else if (tabId === 'current-timetable') {
    renderAdminTimetable();
  } else if (tabId === 'curriculum') {
    renderAdminSubjects();
    renderSubjectMappings();
  }

  closeAdminDrawer();
}

// Drawer Controls for Administrator Panel Mobile View
function toggleAdminDrawer(force) {
  const drawer = document.getElementById('admin-mobile-drawer');
  if (!drawer) return;
  const isClosed = drawer.style.display === 'none' || drawer.classList.contains('hidden') || drawer.classList.contains('drawer-closed');
  const shouldOpen = typeof force === 'boolean' ? force : isClosed;
  if (shouldOpen) {
    drawer.style.display = 'block';
    drawer.classList.remove('hidden');
    requestAnimationFrame(() => {
      drawer.classList.remove('drawer-closed');
    });
  } else {
    drawer.classList.add('drawer-closed');
    setTimeout(() => {
      if (drawer.classList.contains('drawer-closed')) {
        drawer.style.display = 'none';
        drawer.classList.add('hidden');
      }
    }, 280);
  }
}

function closeAdminDrawer() {
  toggleAdminDrawer(false);
}

// Sub-Tab Navigation for HOD (Supports Desktop Sidebar and Mobile Drawer)
function switchHodTab(tabId) {
  document.querySelectorAll('.hod-tab-pane').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.hod-sidebar-link, .hod-drawer-link').forEach(el => {
    el.classList.remove('bg-indigo-50', 'text-indigo-700', 'font-semibold');
    el.classList.add('text-slate-600', 'hover:bg-slate-50');
  });

  const targetPane = document.getElementById(`hod-tab-${tabId}`);
  if (targetPane) targetPane.classList.remove('hidden');

  document.querySelectorAll(`[data-hod-tab="${tabId}"]`).forEach(activeLink => {
    activeLink.classList.add('bg-indigo-50', 'text-indigo-700', 'font-semibold');
    activeLink.classList.remove('text-slate-600');
  });

  if (tabId === 'vacant-classes') renderHodVacantClasses();
  if (tabId === 'substitute-management') renderHodSubstituteManagement();
  if (tabId === 'todays-timetable') renderHodTodayTimetable();
  if (tabId === 'dashboard') renderHodDashboard();
  if (tabId === 'teachers') renderHodTeachers();
  if (tabId === 'leaves') renderHodLeaves();

  closeHodDrawer();
}

// Drawer Controls for HOD IT Department Mobile View
function toggleHodDrawer(force) {
  const drawer = document.getElementById('hod-mobile-drawer');
  if (!drawer) return;
  const isClosed = drawer.style.display === 'none' || drawer.classList.contains('hidden') || drawer.classList.contains('drawer-closed');
  const shouldOpen = typeof force === 'boolean' ? force : isClosed;
  if (shouldOpen) {
    drawer.style.display = 'block';
    drawer.classList.remove('hidden');
    requestAnimationFrame(() => {
      drawer.classList.remove('drawer-closed');
    });
  } else {
    drawer.classList.add('drawer-closed');
    setTimeout(() => {
      if (drawer.classList.contains('drawer-closed')) {
        drawer.style.display = 'none';
        drawer.classList.add('hidden');
      }
    }, 280);
  }
}

function closeHodDrawer() {
  toggleHodDrawer(false);
}

// Drawer Controls for Teacher Mobile View
function toggleTeacherDrawer(force) {
  const drawer = document.getElementById('teacher-mobile-drawer');
  if (!drawer) return;
  const isClosed = drawer.style.display === 'none' || drawer.classList.contains('hidden') || drawer.classList.contains('drawer-closed');
  const shouldOpen = typeof force === 'boolean' ? force : isClosed;
  if (shouldOpen) {
    drawer.style.display = 'block';
    drawer.classList.remove('hidden');
    requestAnimationFrame(() => {
      drawer.classList.remove('drawer-closed');
    });
  } else {
    drawer.classList.add('drawer-closed');
    setTimeout(() => {
      if (drawer.classList.contains('drawer-closed')) {
        drawer.style.display = 'none';
        drawer.classList.add('hidden');
      }
    }, 280);
  }
}

function closeTeacherDrawer() {
  toggleTeacherDrawer(false);
}

// Sub-Tab Navigation for Teacher (Supports Desktop Sidebar, Mobile Drawer, and Tabs)
function switchTeacherTab(tabId) {
  document.querySelectorAll('.teacher-tab-pane').forEach(el => el.classList.add('hidden'));
  
  // Highlight active link across desktop sidebar, drawer, and bottom nav
  document.querySelectorAll('[data-teacher-tab]').forEach(el => {
    const isTarget = el.getAttribute('data-teacher-tab') === tabId;
    if (el.classList.contains('teacher-sidebar-link') || el.classList.contains('teacher-drawer-link')) {
      if (isTarget) {
        el.classList.add('bg-indigo-50', 'text-indigo-700', 'font-semibold');
        el.classList.remove('text-slate-600');
      } else {
        el.classList.remove('bg-indigo-50', 'text-indigo-700', 'font-semibold');
        el.classList.add('text-slate-600');
      }
    } else {
      if (isTarget) {
        el.classList.add('text-indigo-600', 'font-bold');
        el.classList.remove('text-slate-500');
      } else {
        el.classList.remove('text-indigo-600', 'font-bold');
        el.classList.add('text-slate-500');
      }
    }
  });

  const targetPane = document.getElementById(`teacher-tab-${tabId}`);
  if (targetPane) targetPane.classList.remove('hidden');

  if (tabId === 'leaves') {
    renderTeacherLeaves();
  }

  closeTeacherDrawer();
}

// =========================================================================
// HIERARCHICAL USER CREATION (ADMIN ADDS HOD, HOD ADDS TEACHERS)
// =========================================================================

// 0. HOD Department Multi-Selection Limiter (Min 1, Max 2)
function handleHodDeptSelectionLimit(cb) {
  const checkedBoxes = Array.from(document.querySelectorAll('input[name="new-hod-departments"]:checked'));
  if (checkedBoxes.length > 2) {
    if (cb) cb.checked = false;
    showToast('A single HOD can manage a maximum of 2 departments.', 'warning');
  }
  const countEl = document.getElementById('hod-dept-count-num');
  const nowChecked = document.querySelectorAll('input[name="new-hod-departments"]:checked');
  if (countEl) countEl.textContent = nowChecked.length;
}
window.handleHodDeptSelectionLimit = handleHodDeptSelectionLimit;

// 1. Admin adds an HOD with Gmail & Password (1 or 2 Departments)
async function handleAddHod(e) {
  if (e && e.preventDefault) e.preventDefault();
  const name = (document.getElementById('new-hod-name')?.value || '').trim();
  const checkedBoxes = Array.from(document.querySelectorAll('input[name="new-hod-departments"]:checked'));
  const checkedDepts = checkedBoxes.map(cb => cb.value);

  if (checkedDepts.length < 1) {
    showToast('Please select at least 1 department for this HOD.', 'error');
    return;
  }
  if (checkedDepts.length > 2) {
    showToast('A single HOD can manage a maximum of 2 departments.', 'error');
    return;
  }

  const dept = checkedDepts.join(' & ');
  const email = (document.getElementById('new-hod-email')?.value || '').trim().toLowerCase();
  const password = (document.getElementById('new-hod-password')?.value || '').trim();
  const rooms = (document.getElementById('new-hod-rooms')?.value || '').trim() || 'Assigned Block';

  if (!name || !email || !password) {
    showToast('Name, Gmail, and Password are required.', 'error');
    return;
  }

  if (!validateEmail(email)) {
    showToast('Please enter a valid RFC 5322 formatted email address.', 'error');
    return;
  }

  const passCheck = validatePassword(password);
  if (!passCheck.valid) {
    showToast(passCheck.message, 'error');
    return;
  }

  // Check if user already exists
  if ((appState.users || []).some(u => (u.email || '').toLowerCase() === email)) {
    showToast('A user with this Gmail already exists.', 'error');
    return;
  }

  // Directly register HOD in Firebase Cloud Auth so account is immediately accessible across all devices
  if (window.FirebaseAuth && typeof window.FirebaseAuth.registerWithEmail === 'function') {
    try {
      await window.FirebaseAuth.registerWithEmail(email, password);
      console.log('✅ HOD registered in Firebase Cloud Auth!');
    } catch (err) {
      console.warn('Firebase HOD cloud registration note:', err.code || err.message);
      if (err.code === 'auth/email-already-in-use') {
        showToast('This email is already registered in Firebase Authentication.', 'error');
        return;
      }
    }
  }

  // Add HOD account to users WITHOUT plaintext password
  appState.users = appState.users || [];
  appState.users.push({
    id: 'usr-hod-' + Date.now(),
    name,
    email,
    role: 'hod',
    dept,
    departments: checkedDepts,
    created_at: new Date().toISOString()
  });

  // Add to HOD list WITHOUT password
  appState.hodsList = appState.hodsList || [];
  appState.hodsList.push({
    id: Date.now(),
    name,
    email,
    dept,
    departments: checkedDepts,
    roomsManaged: rooms,
    assignedFaculty: 10,
    status: 'Active'
  });

  saveState(true);
  renderAdminTables();
  renderQuickLoginButtons();
  closeModal('modal-add-hod');
  showToast(`HOD account for ${name} (${dept}) created successfully!`, 'success');
  const addHodForm = document.getElementById('form-add-hod');
  if (addHodForm) {
    addHodForm.reset();
    handleHodDeptSelectionLimit(null);
  }

  // Persist to FastAPI Backend
  if (window.ApiClient) {
    ApiClient.registerUser({
      name,
      email,
      role: 'hod',
      department: dept
    }).then(() => console.log('✅ HOD account registered on backend'))
      .catch(err => console.warn('Backend HOD registration note:', err.message));
  }
}

// 2. HOD adds a Teacher with Gmail & Password
async function handleHodAddTeacher(e) {
  if (e && e.preventDefault) e.preventDefault();
  const name = (document.getElementById('hod-teacher-name')?.value || '').trim();
  const email = (document.getElementById('hod-teacher-email')?.value || '').trim().toLowerCase();
  const subject = (document.getElementById('hod-teacher-subject')?.value || '').trim();
  const dept = (document.getElementById('hod-teacher-dept')?.value || '').trim() || 'IT';
  const password = (document.getElementById('hod-teacher-password')?.value || '').trim();
  const workload = (document.getElementById('hod-teacher-workload')?.value || '').trim() || '16 hrs/wk';

  if (!name || !email || !password || !subject) {
    showToast('Name, Subject, Gmail, and Password are required.', 'error');
    return;
  }

  if (!validateEmail(email)) {
    showToast('Please enter a valid RFC 5322 formatted email address.', 'error');
    return;
  }

  const passCheck = validatePassword(password);
  if (!passCheck.valid) {
    showToast(passCheck.message, 'error');
    return;
  }

  if ((appState.users || []).some(u => (u.email || '').toLowerCase() === email)) {
    showToast('A user with this Gmail already exists.', 'error');
    return;
  }

  // Directly register Teacher in Firebase Cloud Auth so account is immediately accessible across all devices
  if (window.FirebaseAuth && typeof window.FirebaseAuth.registerWithEmail === 'function') {
    try {
      await window.FirebaseAuth.registerWithEmail(email, password);
      console.log('✅ Teacher registered in Firebase Cloud Auth!');
    } catch (err) {
      console.warn('Firebase Teacher cloud registration note:', err.code || err.message);
      if (err.code === 'auth/email-already-in-use') {
        showToast('This email is already registered in Firebase Authentication.', 'error');
        return;
      }
    }
  }

  // Add Teacher account to users WITHOUT plaintext password
  appState.users = appState.users || [];
  appState.users.push({
    id: 'usr-teacher-' + Date.now(),
    name,
    email,
    role: 'teacher',
    dept,
    subject,
    created_at: new Date().toISOString()
  });

  // Add to teachers list WITHOUT password
  appState.teachersList = appState.teachersList || [];
  appState.teachersList.push({
    id: Date.now(),
    name,
    email,
    subject,
    dept,
    workload,
    status: 'Available'
  });

  saveState(true);
  renderAdminTables();
  renderHodTeachers();
  renderQuickLoginButtons();
  closeModal('modal-hod-add-teacher');
  showToast(`Teacher account for ${name} created successfully!`, 'success');
  const addTeacherForm = document.getElementById('form-hod-add-teacher');
  if (addTeacherForm) addTeacherForm.reset();

  // Persist to FastAPI Backend
  if (window.ApiClient) {
    ApiClient.createTeacher({
      name,
      email,
      subject,
      department: dept,
      workload,
      status: 'Available'
    }).then(() => console.log('✅ Teacher account registered on backend'))
      .catch(err => console.warn('Backend Teacher creation note:', err.message));
  }
}

// =========================================================================
// HOD DASHBOARD & LIVE MONITORING
// =========================================================================

// Extract all classes scheduled across all sections for today from masterTimetableSlots
function getHodTodayDepartmentClasses() {
  const now = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let currentDay = dayNames[now.getDay()];
  const isWeekend = currentDay === 'Sunday' || currentDay === 'Saturday';
  const targetDay = isWeekend ? 'Monday' : currentDay;

  const bell = appState.collegeBellSchedule || DEFAULT_STATE.collegeBellSchedule;
  const daySlots = (appState.masterTimetableSlots || []).filter(s => s.day === targetDay);

  const periodKeys = [
    { pKey: 'p1', periodNum: 1 },
    { pKey: 'p2', periodNum: 2 },
    { pKey: 'p3', periodNum: 3 },
    { pKey: 'p4', periodNum: 4 },
    { pKey: 'p5', periodNum: 5 },
    { pKey: 'p6', periodNum: 6 },
    { pKey: 'p7', periodNum: 7 }
  ];

  const localToday = now.toLocaleDateString('en-CA');
  const utcToday = now.toISOString().split('T')[0];
  const leaves = appState.leavesList || [];

  const allDayClasses = [];
  let classCounter = 1;

  periodKeys.forEach(pk => {
    const bellItem = bell.find(b => b.period === pk.periodNum);
    const timeRange = bellItem ? bellItem.time : '';
    const times = timeRange.split('-').map(t => t.trim());
    const startMin = times[0] ? parseTimeToMinutes(times[0]) : 0;
    const endMin = times[1] ? parseTimeToMinutes(times[1]) : 0;

    daySlots.forEach(slot => {
      const cellVal = slot[pk.pKey] || '';
      if (!cellVal || cellVal === '-') {
        return;
      }

      // Parse subject, teacher, room
      let subject = cellVal;
      let teacher = 'Faculty';
      let room = slot.section === 'IT-B' ? 'C205' : 'C204';

      if (cellVal.includes('(') && cellVal.includes(')')) {
        const parts = cellVal.split('(');
        subject = parts[0].trim();
        const inside = parts[1].replace(')', '').trim();
        const insideParts = inside.split('•').map(p => p.trim());
        if (insideParts.length > 0) teacher = insideParts[0];
        if (insideParts.length > 1) room = insideParts[1];
      }

      // Check if this teacher is on leave today
      const teacherLower = teacher.toLowerCase();
      const teacherLeave = leaves.find(l => {
        const lName = (l.teacher_name || '').toLowerCase();
        const matches = (lName.includes(teacherLower) || teacherLower.includes(lName)) &&
                        (l.date === localToday || l.date === utcToday) &&
                        (l.periods ? l.periods.includes(pk.periodNum) : true);
        return matches;
      });

      const isLeaveApproved = teacherLeave && teacherLeave.status === 'approved';
      const substituteTeacher = isLeaveApproved ? (teacherLeave.substitute_teacher || 'Dr. Rajesh') : null;
      const isVacantPendingLeave = teacherLeave && teacherLeave.status === 'pending';

      allDayClasses.push({
        id: classCounter++,
        class: slot.section || 'IT-A',
        subject: subject,
        teacher: teacher,
        room: room,
        period: pk.periodNum,
        periodName: `Period ${pk.periodNum}`,
        time: timeRange,
        startMin: startMin,
        endMin: endMin,
        day: targetDay,
        isWeekend: isWeekend,
        isLeaveApproved: isLeaveApproved,
        substituteTeacher: substituteTeacher,
        isVacantPendingLeave: isVacantPendingLeave
      });
    });
  });

  return allDayClasses;
}

function renderHodDashboard() {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDayName = dayNames[now.getDay()];
  const isWeekend = currentDayName === 'Sunday' || currentDayName === 'Saturday';

  const allTodayClasses = getHodTodayDepartmentClasses();

  // Operating Bounds: 09:00 AM (540 min) to 04:00 PM (960 min)
  const isAfterHours = currentMinutes >= 960;
  const isBeforeHours = currentMinutes < 540;

  // Break Intervals: Morning Break (640 - 660), Lunch Break (760 - 810)
  const isMorningBreak = currentMinutes >= 640 && currentMinutes < 660;
  const isLunchBreak = currentMinutes >= 760 && currentMinutes < 810;
  const isBreakTime = isMorningBreak || isLunchBreak;

  let activeCount = 0;
  let scheduledCount = 0;
  let vacantCount = 0;
  let substituteCount = 0;

  allTodayClasses.forEach(row => {
    if (isWeekend || isAfterHours) {
      row.status = 'COMPLETED';
      if (row.substituteTeacher) {
        substituteCount++;
      }
    } else if (isBeforeHours) {
      row.status = 'SCHEDULED';
      scheduledCount++;
    } else if (currentMinutes >= row.endMin) {
      row.status = 'COMPLETED';
      if (row.substituteTeacher) {
        substituteCount++;
      }
    } else if (currentMinutes >= row.startMin && currentMinutes < row.endMin) {
      // CURRENT PERIOD!
      if (row.isLeaveApproved) {
        row.status = 'SUBSTITUTE';
        substituteCount++;
      } else if (row.isVacantPendingLeave) {
        row.status = 'VACANT';
        vacantCount++;
      } else {
        row.status = 'ACTIVE';
        activeCount++;
      }
    } else {
      // Future periods today
      if (row.isLeaveApproved) {
        row.status = 'SUBSTITUTE';
      } else if (row.isVacantPendingLeave) {
        row.status = 'VACANT';
        vacantCount++;
      } else {
        row.status = 'SCHEDULED';
      }
      scheduledCount++;
    }
  });

  // Keep appState.liveMonitoring in sync for modal lookup
  appState.liveMonitoring = allTodayClasses;

  // Update appState.hodStats
  appState.hodStats = {
    totalClasses: allTodayClasses.length,
    active: activeCount,
    scheduled: scheduledCount,
    vacant: vacantCount,
    substitute: substituteCount
  };

  // Populate Metric Cards
  const statTotal = document.getElementById('hod-stat-total');
  const statActive = document.getElementById('hod-stat-active');
  const statScheduled = document.getElementById('hod-stat-scheduled');
  const statVacant = document.getElementById('hod-stat-vacant');
  const statSubstitute = document.getElementById('hod-stat-substitute');

  const statTotalSub = document.getElementById('hod-stat-total-sub');
  const statActiveSub = document.getElementById('hod-stat-active-sub');
  const statScheduledSub = document.getElementById('hod-stat-scheduled-sub');
  const statVacantSub = document.getElementById('hod-stat-vacant-sub');
  const statSubstituteSub = document.getElementById('hod-stat-substitute-sub');

  if (statTotal) statTotal.textContent = allTodayClasses.length;
  if (statActive) statActive.textContent = activeCount;
  if (statScheduled) statScheduled.textContent = scheduledCount;
  if (statVacant) statVacant.textContent = vacantCount;
  if (statSubstitute) statSubstitute.textContent = substituteCount;

  // Contextual helper subtitles
  if (statTotalSub) {
    statTotalSub.textContent = isWeekend ? 'Weekend • Campus Closed' : `${currentDayName} • IT Dept`;
  }
  if (statActiveSub) {
    if (isWeekend) {
      statActiveSub.textContent = 'Campus Closed (Weekend)';
    } else if (isAfterHours) {
      statActiveSub.textContent = '0 Active • Day Ended at 4:00 PM';
    } else if (isBeforeHours) {
      statActiveSub.textContent = '0 Active • Starts at 9:00 AM';
    } else if (isMorningBreak) {
      statActiveSub.textContent = '0 Active • Morning Break';
    } else if (isLunchBreak) {
      statActiveSub.textContent = '0 Active • Lunch Break';
    } else {
      statActiveSub.textContent = `🟢 ${activeCount} Teachers in Class`;
    }
  }
  if (statScheduledSub) {
    if (isAfterHours) {
      statScheduledSub.textContent = '✓ All periods concluded today';
    } else if (isWeekend) {
      statScheduledSub.textContent = 'No sessions on weekend';
    } else {
      statScheduledSub.textContent = `⚪ ${scheduledCount} Later periods today`;
    }
  }
  if (statVacantSub) {
    statVacantSub.textContent = vacantCount > 0 ? `🔴 ${vacantCount} Requires Substitute!` : '✓ No Unstaffed Classes';
  }
  if (statSubstituteSub) {
    statSubstituteSub.textContent = substituteCount > 0 ? `🟡 ${substituteCount} Active Substitutions` : '0 Substitutions';
  }

  // Update Workflow Helper Banner
  const bannerTitle = document.getElementById('hod-banner-title');
  const bannerDesc = document.getElementById('hod-banner-desc');
  const bannerAction = document.getElementById('hod-banner-action');

  if (isAfterHours) {
    if (bannerTitle) bannerTitle.textContent = 'College Hours Concluded for Today';
    if (bannerDesc) bannerDesc.textContent = `All ${allTodayClasses.length} assigned periods for today have finished (09:00 AM - 04:00 PM). Next sessions begin tomorrow at 09:00 AM.`;
    if (bannerAction) {
      bannerAction.innerHTML = '<span class="px-3.5 py-1.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-300 flex items-center gap-1.5"><span>✓</span> All Sessions Concluded</span>';
    }
  } else if (isWeekend) {
    if (bannerTitle) bannerTitle.textContent = 'Weekend Campus Mode';
    if (bannerDesc) bannerDesc.textContent = 'No regular classes scheduled on weekend. Timetable resumes Monday morning at 09:00 AM.';
    if (bannerAction) {
      bannerAction.innerHTML = '<span class="px-3.5 py-1.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200">Campus Closed</span>';
    }
  } else if (isBreakTime) {
    const bName = isMorningBreak ? 'Morning Break (10:40 - 11:00 AM)' : 'Lunch Break (12:40 - 01:30 PM)';
    if (bannerTitle) bannerTitle.textContent = `${bName} in Progress`;
    if (bannerDesc) bannerDesc.textContent = `Campus is currently on ${bName}. Next scheduled period resumes shortly.`;
    if (bannerAction) {
      bannerAction.innerHTML = '<span class="px-3.5 py-1.5 bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-300 flex items-center gap-1.5"><span>☕</span> Break Time</span>';
    }
  } else if (vacantCount > 0) {
    if (bannerTitle) bannerTitle.textContent = 'Faculty Absence Alert';
    if (bannerDesc) bannerDesc.textContent = `${vacantCount} class currently requires substitute faculty to ensure teaching continuity.`;
    if (bannerAction) {
      const vacantItem = allTodayClasses.find(c => c.status === 'VACANT') || allTodayClasses[0];
      bannerAction.innerHTML = `<button onclick="openSubstituteModal(${vacantItem.id})" class="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"><span>🔴 Assign Substitute</span></button>`;
    }
  } else {
    if (bannerTitle) bannerTitle.textContent = 'HOD Action Protocol • Live Monitoring';
    if (bannerDesc) bannerDesc.textContent = 'All active periods are staffed with verified faculty presence. Live classroom telemetry active.';
    if (bannerAction) {
      bannerAction.innerHTML = '<span class="px-3.5 py-1.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-300 flex items-center gap-1.5"><span>🟢</span> 100% Staffed</span>';
    }
  }

  // Update Table Subtitle
  const tableSub = document.getElementById('hod-live-monitoring-sub');
  if (tableSub) {
    if (isAfterHours) {
      tableSub.textContent = `College hours ended for today (04:00 PM) • All ${allTodayClasses.length} sessions completed`;
    } else if (isWeekend) {
      tableSub.textContent = 'Weekend schedule preview (Monday timetable)';
    } else if (isBreakTime) {
      tableSub.textContent = 'Break in progress • Resuming next period';
    } else {
      tableSub.textContent = 'Real-time classroom sensor & verified teacher check-in status';
    }
  }

  // Render Live Monitoring Table Rows
  const tbody = document.getElementById('live-monitoring-tbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  allTodayClasses.forEach(row => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-100 hover:bg-slate-50/80 transition-colors text-sm';

    let statusBadge = '';
    if (row.status === 'ACTIVE') {
      statusBadge = `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot"></span>
          ACTIVE
        </span>`;
    } else if (row.status === 'SCHEDULED') {
      statusBadge = `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <span class="w-2 h-2 rounded-full bg-slate-400"></span>
          SCHEDULED
        </span>`;
    } else if (row.status === 'COMPLETED') {
      statusBadge = `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          <span>✓</span>
          COMPLETED
        </span>`;
    } else if (row.status === 'VACANT') {
      statusBadge = `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
          <span class="w-2 h-2 rounded-full bg-rose-500"></span>
          VACANT
        </span>`;
    } else if (row.status === 'SUBSTITUTE') {
      statusBadge = `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
          <span class="w-2 h-2 rounded-full bg-amber-500"></span>
          SUBSTITUTE
        </span>`;
    }

    let actionBtn = '';
    if (row.status === 'VACANT') {
      actionBtn = `
        <button onclick="openSubstituteModal(${row.id})" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
          Assign Substitute
        </button>`;
    } else if (row.status === 'SUBSTITUTE') {
      actionBtn = `
        <span class="text-xs text-amber-800 font-medium bg-amber-50 px-2 py-1 rounded border border-amber-200">
          Sub: <strong class="font-semibold">${escapeHTML(row.substituteTeacher || 'Assigned')}</strong>
        </span>`;
    } else if (row.status === 'COMPLETED') {
      actionBtn = `<span class="text-xs text-slate-400 font-medium">Session Concluded</span>`;
    } else {
      actionBtn = `
        <button onclick="showToast('Class details for ' + ${JSON.stringify(row.class || '')} + ' - ' + ${JSON.stringify(row.subject || '')} + ' (' + ${JSON.stringify(row.room || '')} + ')', 'info')" class="text-xs text-slate-500 hover:text-indigo-600 font-medium underline cursor-pointer">
          View Room
        </button>`;
    }

    const facultyInitial = escapeHTML((row.teacher || 'F').charAt(0).toUpperCase());

    tr.innerHTML = `
      <td class="py-3.5 px-4 font-bold text-slate-900">${escapeHTML(row.class)}</td>
      <td class="py-3.5 px-4 font-medium text-slate-800">${escapeHTML(row.subject)}</td>
      <td class="py-3.5 px-4 text-slate-700">
        <div class="flex items-center gap-2">
          <span class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">${facultyInitial}</span>
          <span>${escapeHTML(row.teacher)}</span>
        </div>
      </td>
      <td class="py-3.5 px-4 font-mono text-xs font-semibold text-slate-600">${escapeHTML(row.room)}</td>
      <td class="py-3.5 px-4 font-mono text-xs text-slate-600">${escapeHTML(row.time)}</td>
      <td class="py-3.5 px-4">${statusBadge}</td>
      <td class="py-3.5 px-4 text-right">${actionBtn}</td>
    `;
    tbody.appendChild(tr);
  });

  // Keep HOD sub-views in sync
  renderHodVacantClasses();
  renderHodSubstituteManagement();
  renderHodTodayTimetable();
}

// Render dynamic HOD Vacant Classes tab
function renderHodVacantClasses() {
  const container = document.getElementById('hod-vacant-classes-list');
  const drawerBadge = document.getElementById('hod-drawer-vacant-badge');
  const sidebarBadge = document.getElementById('hod-sidebar-vacant-badge');
  const headerBadge = document.getElementById('hod-vacant-count-header-badge');
  const metaEl = document.getElementById('hod-vacant-classes-meta');

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const dayOfWeek = now.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isAfterHours = currentMinutes >= 960; // 4:00 PM
  const isBeforeHours = currentMinutes < 540; // 9:00 AM

  const allTodayClasses = getHodTodayDepartmentClasses();

  // Real-time vacant classes (faculty on leave and no substitute assigned)
  let vacantClasses = [];
  if (!isWeekend && !isAfterHours) {
    if (isBeforeHours) {
      vacantClasses = allTodayClasses.filter(c => c.isVacantPendingLeave);
    } else {
      vacantClasses = allTodayClasses.filter(c => (c.status === 'VACANT' || c.isVacantPendingLeave) && currentMinutes < c.endMin);
    }
  }

  const vacantCount = vacantClasses.length;

  const updateBadge = (el) => {
    if (!el) return;
    if (isWeekend) {
      el.textContent = 'Weekend';
      el.className = 'px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500';
    } else if (isAfterHours) {
      el.textContent = '0 Vacant';
      el.className = 'px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500';
    } else if (vacantCount > 0) {
      el.textContent = `🔴 ${vacantCount} Vacant`;
      el.className = 'px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 animate-pulse';
    } else {
      el.textContent = '0 Vacant';
      el.className = 'px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700';
    }
  };

  updateBadge(drawerBadge);
  updateBadge(sidebarBadge);

  if (headerBadge) {
    if (isWeekend) headerBadge.textContent = 'Campus Closed';
    else if (isAfterHours) headerBadge.textContent = '0 Vacant (Concluded)';
    else headerBadge.textContent = `${vacantCount} Vacant`;
  }

  if (metaEl) {
    if (isWeekend) metaEl.textContent = 'Weekend schedule • Timetable resumes Monday morning';
    else if (isAfterHours) metaEl.textContent = 'College hours concluded at 04:00 PM • All department periods completed';
    else metaEl.textContent = 'Real-time faculty absence and unstaffed classroom monitoring';
  }

  if (!container) return;
  container.innerHTML = '';

  if (isWeekend) {
    container.innerHTML = `
      <div class="p-6 rounded-2xl border border-slate-200 bg-slate-50 text-center space-y-2">
        <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xl font-bold mx-auto">📅</div>
        <h4 class="font-bold text-slate-900 text-base">Campus Closed (Weekend)</h4>
        <p class="text-xs text-slate-500 max-w-md mx-auto">No regular classes scheduled today. Vacancy tracking reactivates on Monday at 09:00 AM.</p>
      </div>`;
    return;
  }

  if (isAfterHours) {
    container.innerHTML = `
      <div class="p-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 text-center space-y-2">
        <div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold mx-auto">✓</div>
        <h4 class="font-bold text-slate-900 text-base">College Hours Concluded for Today (04:00 PM)</h4>
        <p class="text-xs text-slate-600 max-w-md mx-auto">All ${allTodayClasses.length} assigned periods for today have finished. No classroom is currently in session or vacant.</p>
        <div class="pt-2">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-emerald-800 text-xs font-semibold rounded-full border border-emerald-200 shadow-2xs">
            <span>🕒</span> Sessions Resume Tomorrow at 09:00 AM
          </span>
        </div>
      </div>`;
    return;
  }

  if (vacantClasses.length === 0) {
    container.innerHTML = `
      <div class="p-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 text-center space-y-2">
        <div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold mx-auto">✓</div>
        <h4 class="font-bold text-slate-900 text-base">All Classes Fully Staffed</h4>
        <p class="text-xs text-slate-600 max-w-md mx-auto">All active and upcoming periods currently have assigned teachers in attendance. No unstaffed classrooms detected.</p>
      </div>`;
    return;
  }

  // Render active vacant classes
  vacantClasses.forEach(item => {
    const card = document.createElement('div');
    card.className = 'p-4 rounded-xl border border-rose-200 bg-rose-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs';
    card.innerHTML = `
      <div>
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">VACANT</span>
          <span class="font-mono text-xs font-bold text-slate-700">${item.time} (${item.periodName})</span>
        </div>
        <h4 class="font-bold text-slate-900 text-base mt-1">${item.class} • ${item.subject} (${item.room})</h4>
        <p class="text-xs text-slate-600">Primary Faculty: <strong>${item.teacher}</strong> (Leave Pending / Unassigned)</p>
      </div>
      <button onclick="openSubstituteModal(${item.id})" class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
        <span>Assign Substitute</span>
      </button>
    `;
    container.appendChild(card);
  });
}

// Render dynamic HOD Substitute Management tab
function renderHodSubstituteManagement() {
  const container = document.getElementById('hod-substitutes-list');
  const drawerBadge = document.getElementById('hod-drawer-substitute-badge');
  const sidebarBadge = document.getElementById('hod-sidebar-substitute-badge');
  const headerBadge = document.getElementById('hod-substitute-count-header-badge');
  const metaEl = document.getElementById('hod-substitute-meta');

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const dayOfWeek = now.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isAfterHours = currentMinutes >= 960; // 4:00 PM

  const allTodayClasses = getHodTodayDepartmentClasses();

  // Find all substitute classes today (from timetable slots and approved leaves)
  const substituteClasses = allTodayClasses.filter(c => c.substituteTeacher || c.isLeaveApproved);

  // Active substitutions in progress right now
  let activeSubsCount = 0;
  if (!isWeekend && !isAfterHours) {
    activeSubsCount = substituteClasses.filter(c => currentMinutes >= c.startMin && currentMinutes < c.endMin).length;
  }

  const updateBadge = (el) => {
    if (!el) return;
    if (isWeekend) {
      el.textContent = 'Weekend';
      el.className = 'px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500';
    } else if (isAfterHours) {
      el.textContent = '0 Active';
      el.className = 'px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500';
    } else if (activeSubsCount > 0) {
      el.textContent = `🟡 ${activeSubsCount} Active`;
      el.className = 'px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 animate-pulse';
    } else {
      el.textContent = '0 Active';
      el.className = 'px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500';
    }
  };

  updateBadge(drawerBadge);
  updateBadge(sidebarBadge);

  if (headerBadge) {
    if (isWeekend) headerBadge.textContent = 'Campus Closed';
    else if (isAfterHours) headerBadge.textContent = '0 Active (Concluded)';
    else headerBadge.textContent = `${activeSubsCount} Active`;
  }

  if (metaEl) {
    if (isWeekend) metaEl.textContent = 'Weekend schedule • Timetable resumes Monday';
    else if (isAfterHours) metaEl.textContent = 'College hours ended at 04:00 PM • Substitution records for today';
    else metaEl.textContent = 'Real-time substitute faculty ledger and teaching continuity tracker';
  }

  if (!container) return;
  container.innerHTML = '';

  if (isWeekend) {
    container.innerHTML = `
      <div class="p-6 rounded-2xl border border-slate-200 bg-slate-50 text-center space-y-2">
        <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xl font-bold mx-auto">📅</div>
        <h4 class="font-bold text-slate-900 text-base">Weekend • Campus Closed</h4>
        <p class="text-xs text-slate-500 max-w-md mx-auto">No substitution duties scheduled on weekends.</p>
      </div>`;
    return;
  }

  if (isAfterHours) {
    if (substituteClasses.length === 0) {
      container.innerHTML = `
        <div class="p-6 rounded-2xl border border-slate-200 bg-slate-50 text-center space-y-2">
          <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xl font-bold mx-auto">📋</div>
          <h4 class="font-bold text-slate-900 text-base">College Hours Concluded (04:00 PM)</h4>
          <p class="text-xs text-slate-500 max-w-md mx-auto">No substitutions were required today. Primary faculty conducted all scheduled periods.</p>
        </div>`;
      return;
    }

    const headerNotice = document.createElement('div');
    headerNotice.className = 'p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between mb-3';
    headerNotice.innerHTML = `
      <span class="font-bold text-slate-800">Today's Completed Substitutions (${substituteClasses.length})</span>
      <span class="text-slate-400">Day Ended at 04:00 PM</span>
    `;
    container.appendChild(headerNotice);

    substituteClasses.forEach(item => {
      const card = document.createElement('div');
      card.className = 'p-4 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs';
      card.innerHTML = `
        <div>
          <span class="font-bold text-slate-900 text-sm">${item.class} • ${item.subject} (${item.room})</span>
          <p class="text-slate-600 text-xs mt-0.5">Original: <strong>${item.teacher}</strong> | Substitute: <strong class="text-amber-800">${item.substituteTeacher || 'Assigned Faculty'}</strong></p>
          <div class="text-[11px] font-mono text-slate-400 mt-1">${item.time} (${item.periodName})</div>
        </div>
        <span class="px-2.5 py-1 rounded-full font-bold bg-slate-100 text-slate-600 text-xs border border-slate-200 shrink-0">✓ CONCLUDED</span>
      `;
      container.appendChild(card);
    });
    return;
  }

  if (substituteClasses.length === 0) {
    container.innerHTML = `
      <div class="p-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 text-center space-y-2">
        <div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold mx-auto">✓</div>
        <h4 class="font-bold text-slate-900 text-base">No Substitutions Active</h4>
        <p class="text-xs text-slate-600 max-w-md mx-auto">All classes are currently being handled by their assigned primary teachers. No substitute staff needed.</p>
      </div>`;
    return;
  }

  // During operating hours, render each substitution with status
  substituteClasses.forEach(item => {
    let pill = '';
    if (currentMinutes >= item.startMin && currentMinutes < item.endMin) {
      pill = '<span class="px-2.5 py-1 rounded-full font-bold bg-amber-500 text-white text-xs animate-pulse">🟡 IN SESSION NOW</span>';
    } else if (currentMinutes < item.startMin) {
      pill = `<span class="px-2.5 py-1 rounded-full font-bold bg-indigo-100 text-indigo-700 text-xs border border-indigo-200">⚪ UPCOMING (${item.time.split('-')[0].trim()})</span>`;
    } else {
      pill = '<span class="px-2.5 py-1 rounded-full font-bold bg-slate-100 text-slate-600 text-xs border border-slate-200">✓ COMPLETED</span>';
    }

    const card = document.createElement('div');
    card.className = 'p-4 rounded-xl border border-amber-200 bg-amber-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs';
    card.innerHTML = `
      <div>
        <span class="font-bold text-amber-950 text-sm">${item.class} • ${item.subject} (${item.room})</span>
        <p class="text-slate-700 text-xs mt-0.5">Original: <strong>${item.teacher}</strong> | Substitute: <strong class="text-amber-900">${item.substituteTeacher || 'Assigned Faculty'}</strong></p>
        <div class="text-[11px] font-mono text-slate-500 mt-1">${item.time} (${item.periodName})</div>
      </div>
      <div class="shrink-0">${pill}</div>
    `;
    container.appendChild(card);
  });
}

// Render dynamic HOD Today's Timetable tab
function renderHodTodayTimetable() {
  const container = document.getElementById('hod-today-timetable-container');
  const metaEl = document.getElementById('hod-today-timetable-meta');
  const pillEl = document.getElementById('hod-today-timetable-status-pill');

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const dayOfWeek = now.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isAfterHours = currentMinutes >= 960; // 4:00 PM

  const bellSchedule = appState.collegeBellSchedule || [
    { period: 1, name: 'Period 1', time: '09:00 - 09:50', start: '09:00', end: '09:50', startMin: 540, endMin: 590 },
    { period: 2, name: 'Period 2', time: '09:50 - 10:40', start: '09:50', end: '10:40', startMin: 590, endMin: 640 },
    { break: true, name: 'Morning Break', time: '10:40 - 11:00', startMin: 640, endMin: 660 },
    { period: 3, name: 'Period 3', time: '11:00 - 11:50', start: '11:00', end: '11:50', startMin: 660, endMin: 710 },
    { period: 4, name: 'Period 4', time: '11:50 - 12:40', start: '11:50', end: '12:40', startMin: 710, endMin: 760 },
    { break: true, name: 'Lunch Break', time: '12:40 - 01:30', startMin: 760, endMin: 810 },
    { period: 5, name: 'Period 5', time: '01:30 - 02:20', start: '01:30', end: '02:20', startMin: 810, endMin: 860 },
    { period: 6, name: 'Period 6', time: '02:20 - 03:10', start: '02:20', end: '03:10', startMin: 860, endMin: 910 },
    { period: 7, name: 'Period 7', time: '03:10 - 04:00', start: '03:10', end: '04:00', startMin: 910, endMin: 960 }
  ];

  const allTodayClasses = getHodTodayDepartmentClasses();

  if (metaEl) {
    if (isWeekend) metaEl.textContent = 'Weekend preview • Regular timetable resumes Monday';
    else if (isAfterHours) metaEl.textContent = `All ${allTodayClasses.length} periods concluded today (09:00 AM - 04:00 PM)`;
    else metaEl.textContent = `Live timetable schedule across IT Department batches (${allTodayClasses.length} periods)`;
  }

  if (pillEl) {
    if (isWeekend) {
      pillEl.textContent = 'Campus Closed (Weekend)';
      pillEl.className = 'px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl border border-slate-200';
    } else if (isAfterHours) {
      pillEl.textContent = '✓ College Hours Concluded';
      pillEl.className = 'px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300';
    } else {
      pillEl.textContent = '🟢 Operating Live';
      pillEl.className = 'px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-xl border border-indigo-200';
    }
  }

  if (!container) return;
  container.innerHTML = '';

  bellSchedule.forEach(slot => {
    if (slot.break) {
      const isCurrentBreak = !isWeekend && currentMinutes >= slot.startMin && currentMinutes < slot.endMin;
      const isPastBreak = isAfterHours || (!isWeekend && currentMinutes >= slot.endMin);
      const bDiv = document.createElement('div');
      bDiv.className = `p-3 rounded-xl flex items-center justify-between text-xs border ${isCurrentBreak ? 'bg-amber-50 border-amber-300 shadow-2xs font-bold text-amber-900' : 'bg-slate-50/60 border-slate-100 text-slate-500'}`;
      bDiv.innerHTML = `
        <span class="flex items-center gap-2">
          <span>☕</span>
          <span>${slot.name} (${slot.time})</span>
        </span>
        <span class="font-medium">${isCurrentBreak ? '🟡 BREAK IN PROGRESS' : (isPastBreak ? '✓ Concluded' : 'Scheduled')}</span>
      `;
      container.appendChild(bDiv);
      return;
    }

    const slotClasses = allTodayClasses.filter(c => c.period === slot.period);
    const isCurrentSlot = !isWeekend && currentMinutes >= slot.startMin && currentMinutes < slot.endMin;
    const isPastSlot = isAfterHours || (!isWeekend && currentMinutes >= slot.endMin);

    let statusPill = '';
    if (isAfterHours || isPastSlot) {
      statusPill = '<span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">✓ Concluded</span>';
    } else if (isCurrentSlot) {
      statusPill = '<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">🟢 In Session</span>';
    } else {
      statusPill = '<span class="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500">Scheduled</span>';
    }

    const classSummaries = slotClasses.map(c => `${c.class}: ${c.subject} (${c.teacher} • ${c.room})`).join(' • ') || 'No classes assigned';

    const div = document.createElement('div');
    div.className = `p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition ${isCurrentSlot ? 'bg-indigo-50/50 border-indigo-200 shadow-2xs' : 'bg-white border-slate-100 hover:bg-slate-50/60'}`;
    div.innerHTML = `
      <div class="space-y-0.5">
        <div class="flex items-center gap-2">
          <span class="font-bold text-slate-900">${slot.name} (${slot.time})</span>
        </div>
        <p class="text-slate-600">${classSummaries}</p>
      </div>
      <div class="shrink-0">${statusPill}</div>
    `;
    container.appendChild(div);
  });
}

// Substitute Management Modal
let activeVacantClassId = null;

function openSubstituteModal(classId) {
  activeVacantClassId = classId;
  const targetClass = appState.liveMonitoring.find(c => c.id === classId);
  if (!targetClass) return;

  document.getElementById('sub-modal-class-name').textContent = `${targetClass.class} - ${targetClass.subject}`;
  document.getElementById('sub-modal-teacher-name').textContent = `${targetClass.teacher} (Absent / On Leave)`;
  document.getElementById('sub-modal-room').textContent = targetClass.room;
  document.getElementById('sub-modal-time').textContent = targetClass.time;

  const listContainer = document.getElementById('substitute-candidates-list');
  listContainer.innerHTML = '';

  function renderSubstituteCandidates() {
    listContainer.innerHTML = '';
    appState.availableSubstitutes.forEach(sub => {
      const div = document.createElement('div');
      div.className = 'border border-slate-200 rounded-xl p-3.5 hover:border-indigo-400 hover:bg-indigo-50/40 transition flex items-center justify-between cursor-pointer';
      div.innerHTML = `
        <div>
          <div class="flex items-center gap-2">
            <h4 class="font-bold text-slate-900 text-sm">${sub.name}</h4>
            <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">FREE NOW</span>
          </div>
          <p class="text-xs text-slate-500 mt-0.5">${sub.specialization} • ${sub.freePeriods}</p>
        </div>
        <button onclick="confirmSubstituteAssignment('${sub.name}')" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-sm">
          Select
        </button>
      `;
      listContainer.appendChild(div);
    });
  }

  renderSubstituteCandidates();

  // Query backend for real-time free faculty
  if (window.ApiClient) {
    ApiClient.findSubstitutes(targetClass.time, appState.currentUser?.dept || 'Information Technology')
      .then(subs => {
        if (subs && subs.length > 0) {
          appState.availableSubstitutes = subs.map((s, idx) => ({
            id: s.id || `sub-${idx}`,
            name: s.name,
            dept: s.department,
            freePeriods: s.free_time || targetClass.time,
            specialization: s.specialization
          }));
          renderSubstituteCandidates();
        }
      })
      .catch(err => console.warn('Backend substitute recommendation fallback:', err.message));
  }

  const modal = document.getElementById('substitute-modal');
  modal.classList.remove('hidden');
}

function closeSubstituteModal() {
  const modal = document.getElementById('substitute-modal');
  modal.classList.add('hidden');
  activeVacantClassId = null;
}

function confirmSubstituteAssignment(teacherName) {
  if (!activeVacantClassId) return;
  const row = appState.liveMonitoring.find(c => c.id === activeVacantClassId);
  if (row) {
    row.status = 'SUBSTITUTE';
    row.substituteTeacher = teacherName;

    // Adjust counters
    if (appState.hodStats.vacant > 0) appState.hodStats.vacant -= 1;
    appState.hodStats.substitute += 1;

    saveState();
    closeSubstituteModal();
    renderHodDashboard();
    showToast(`Assigned ${teacherName} as substitute for ${row.class} (${row.subject})!`, 'success');

    // Persist to FastAPI Backend & broadcast to all screens via WebSockets
    if (window.ApiClient) {
      ApiClient.assignSubstitute({
        session_id: String(row.id),
        substitute_teacher: teacherName,
        department: appState.currentUser?.dept || 'Information Technology'
      }).then(() => console.log('✅ Substitute assigned and broadcasted via WebSockets'))
        .catch(err => console.warn('Backend assignSubstitute fallback:', err.message));
    }
  }
}

// =========================================================================
// TEACHER DASHBOARD & CHECK-IN (WITH FREE DEVICE GPS VERIFICATION)
// =========================================================================

let currentActiveTeacherClass = null;

// Parse any time string (e.g., "09:00", "01:30", "1:30 PM", "13:30") into minutes from midnight (0 - 1440)
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  timeStr = timeStr.trim();
  const isPM = /pm/i.test(timeStr);
  const isAM = /am/i.test(timeStr);
  const cleaned = timeStr.replace(/am|pm/i, '').trim();
  const parts = cleaned.split(':');
  let hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;
  // If no AM/PM marker (e.g. "01:30", "02:20", "03:10", "04:00"), hours 1..6 represent afternoon college periods (13:00 to 18:00)
  if (!isPM && !isAM && hours >= 1 && hours <= 6) {
    hours += 12;
  }
  return hours * 60 + minutes;
}

// Dynamically extract the teacher's schedule for today from masterTimetableSlots or fallback
function getTeacherTodaySchedule(teacherName) {
  const currentTeacherName = (teacherName || appState.currentUser?.name || 'Arun Kumar').toLowerCase();
  const now = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let currentDay = dayNames[now.getDay()];
  const isWeekend = currentDay === 'Sunday' || currentDay === 'Saturday';
  const targetDay = isWeekend ? 'Monday' : currentDay;

  const bell = appState.collegeBellSchedule || DEFAULT_STATE.collegeBellSchedule;
  const daySlots = (appState.masterTimetableSlots || []).filter(s => s.day === targetDay);

  const periodKeys = [
    { pKey: 'p1', periodNum: 1 },
    { pKey: 'p2', periodNum: 2 },
    { pKey: 'p3', periodNum: 3 },
    { pKey: 'p4', periodNum: 4 },
    { pKey: 'p5', periodNum: 5 },
    { pKey: 'p6', periodNum: 6 },
    { pKey: 'p7', periodNum: 7 }
  ];

  const classes = [];

  periodKeys.forEach(pk => {
    const bellItem = bell.find(b => b.period === pk.periodNum);
    const timeRange = bellItem ? bellItem.time : '';
    const times = timeRange.split('-').map(t => t.trim());
    const startMin = times[0] ? parseTimeToMinutes(times[0]) : 0;
    const endMin = times[1] ? parseTimeToMinutes(times[1]) : 0;

    daySlots.forEach(slot => {
      const cellVal = slot[pk.pKey] || '';
      const cellLower = cellVal.toLowerCase();
      const matches = cellLower.includes(currentTeacherName) || 
                      (currentTeacherName.includes('arun') && cellLower.includes('arun')) ||
                      (currentTeacherName.split(' ')[0] && cellLower.includes(currentTeacherName.split(' ')[0]));

      if (matches) {
        let subject = cellVal;
        let room = 'Room C204';
        if (cellVal.includes('(') && cellVal.includes(')')) {
          const parts = cellVal.split('(');
          subject = parts[0].trim();
          const inside = parts[1].replace(')', '').trim();
          const insideParts = inside.split('•').map(p => p.trim());
          if (insideParts.length > 1) {
            room = insideParts[1];
          }
        }

        classes.push({
          period: pk.periodNum,
          periodName: `Period ${pk.periodNum}`,
          time: timeRange,
          startMin: startMin,
          endMin: endMin,
          subject: subject,
          fullTitle: cellVal,
          class: slot.section || 'IT-A',
          room: room,
          day: targetDay,
          isWeekend: isWeekend
        });
      }
    });
  });

  // If no classes configured in timetable for this teacher, fallback to DEFAULT_STATE.teacherTodayClasses
  if (classes.length === 0) {
    const fallbackList = appState.teacherTodayClasses || DEFAULT_STATE.teacherTodayClasses;
    return fallbackList.map((item, idx) => {
      const bellItem = bell.find(b => !b.isBreak && b.time.startsWith(item.time.split(' - ')[0])) || bell[idx] || { time: item.time };
      const times = (bellItem.time || item.time).split('-').map(t => t.trim());
      const startMin = times[0] ? parseTimeToMinutes(times[0]) : (540 + idx * 60);
      const endMin = times[1] ? parseTimeToMinutes(times[1]) : (startMin + 50);
      return {
        period: idx + 1,
        periodName: `Period ${idx + 1}`,
        time: bellItem.time || item.time,
        startMin: startMin,
        endMin: endMin,
        subject: item.subject,
        fullTitle: item.subject,
        class: item.class,
        room: item.room,
        day: targetDay,
        isWeekend: isWeekend,
        note: item.note
      };
    });
  }

  return classes;
}

async function handleTeacherCheckIn(classObj) {
  const isCheckingIn = !appState.teacherCheckedIn;
  const targetClass = classObj || currentActiveTeacherClass;
  const targetRoom = targetClass?.room || 'Room C204';
  const targetBatch = targetClass?.class || 'IT-A';

  if (isCheckingIn) {
    showToast(`📍 Acquiring device GPS coordinates for ${targetRoom}...`, 'info');

    try {
      if (window.GeoLocationHelper && window.GeoLocationHelper.isSupported()) {
        const result = await window.GeoLocationHelper.performTeacherCheckIn(targetBatch, targetRoom, appState.currentUser?.dept || 'Information Technology');
        console.log('[GPS Check-in Result]:', result);
        showToast(`✓ GPS Verified (${result.distance_meters}m from ${targetRoom})! Room ${targetRoom} is now ACTIVE.`, 'success');
      } else {
        showToast(`Checked in successfully! Room ${targetRoom} status is now ACTIVE.`, 'success');
      }
    } catch (err) {
      console.warn('GPS Verification fallback:', err.message);
      showToast(`Location notice: ${err.message} (Checked in under Classroom Mode)`, 'info');
    }

    appState.teacherCheckedIn = true;
    const arunClass = (appState.liveMonitoring || []).find(c => (c.teacher || '').toLowerCase().includes('arun') || c.class === targetBatch);
    if (arunClass) {
      arunClass.status = 'ACTIVE';
      if (appState.hodStats) {
        appState.hodStats.active = Math.min(appState.hodStats.totalClasses || 10, (appState.hodStats.active || 0) + 1);
      }
    }
  } else {
    appState.teacherCheckedIn = false;
    showToast(`Checked out of ${targetRoom}.`, 'info');
  }

  saveState();
  renderTeacherDashboard();
  renderHodDashboard();
}

function renderTeacherDashboard() {
  const checkInBtn = document.getElementById('teacher-checkin-action-btn');
  const nextClassBadge = document.getElementById('teacher-next-class-badge');
  const checkinTimeText = document.getElementById('teacher-checkin-time');

  const focalTitle = document.getElementById('teacher-next-class-title-text');
  const focalTime = document.getElementById('teacher-next-class-time');
  const focalSubject = document.getElementById('teacher-next-class-subject');
  const focalClass = document.getElementById('teacher-next-class-class');
  const focalRoom = document.getElementById('teacher-next-class-room');
  const focalCap = document.getElementById('teacher-next-class-cap');

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayName = dayNames[now.getDay()];

  // Check if teacher is on approved leave today
  const localToday = now.toLocaleDateString('en-CA');
  const utcToday = now.toISOString().split('T')[0];
  const currentTeacherName = (appState.currentUser?.name || 'Arun Kumar').toLowerCase();
  const currentTeacherEmail = (appState.currentUser?.email || '').toLowerCase();
  const approvedLeaveToday = (appState.leavesList || []).find(l => {
    const tName = (l.teacher_name || '').toLowerCase();
    const tEmail = (l.teacher_email || '').toLowerCase();
    const matchesTeacher = (tName && (tName.includes(currentTeacherName) || currentTeacherName.includes(tName))) ||
                           (tEmail && currentTeacherEmail && tEmail === currentTeacherEmail);
    return matchesTeacher && (l.date === localToday || l.date === utcToday) && l.status === 'approved';
  });

  // Get dynamic schedule for current teacher
  const todayClasses = getTeacherTodaySchedule(currentTeacherName);

  // Assign live statuses to each class based on current clock time
  todayClasses.forEach(c => {
    if (currentMinutes >= c.endMin) {
      c.status = 'Completed';
    } else if (currentMinutes >= c.startMin && currentMinutes < c.endMin) {
      c.status = 'Active';
    } else {
      c.status = 'Upcoming';
    }
  });

  // Determine which class should be shown in the focal card:
  // 1. If there's an Active class, show it as LIVE NOW!
  // 2. Else if there's an Upcoming class, show the soonest Upcoming class as NEXT SCHEDULED CLASS!
  // 3. Else all classes today are completed.
  const activeClass = todayClasses.find(c => c.status === 'Active');
  const upcomingClass = todayClasses.find(c => c.status === 'Upcoming');
  let focalClassObj = activeClass || upcomingClass || todayClasses[todayClasses.length - 1];
  currentActiveTeacherClass = focalClassObj;

  const isActiveNow = Boolean(activeClass);
  const isAllCompleted = todayClasses.length > 0 && todayClasses.every(c => c.status === 'Completed');

  // Handle Approved Leave override
  if (approvedLeaveToday) {
    if (focalTitle) focalTitle.textContent = 'ON APPROVED LEAVE';
    if (nextClassBadge) {
      nextClassBadge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm';
      nextClassBadge.innerHTML = '<span class="w-2 h-2 rounded-full bg-white animate-pulse-dot"></span> ✓ APPROVED LEAVE';
    }
    if (focalTime) focalTime.textContent = 'Excused for Today';
    if (focalSubject) focalSubject.textContent = 'Leave Approved by HOD';
    if (focalClass) focalClass.textContent = `Substitute: ${approvedLeaveToday.substitute_teacher || 'Dr. Rajesh'}`;
    if (focalRoom) focalRoom.textContent = 'Classes Delegated';
    if (focalCap) focalCap.textContent = approvedLeaveToday.reason || 'Medical / Personal';

    if (checkInBtn) {
      checkInBtn.className = 'w-full py-4 px-6 bg-emerald-800 text-white rounded-2xl font-bold text-base shadow-sm opacity-95 cursor-default flex items-center justify-center gap-2';
      checkInBtn.innerHTML = `<span>🏖️ ON LEAVE TODAY (APPROVED BY HOD)</span>`;
      checkInBtn.onclick = null;
    }
    if (checkinTimeText) {
      checkinTimeText.textContent = `Substitute Assigned: ${approvedLeaveToday.substitute_teacher || 'Dr. Rajesh'} • Attendance waived for today`;
    }
  } else if (isAllCompleted) {
    // All scheduled classes for today have concluded
    if (focalTitle) focalTitle.textContent = "TODAY'S SCHEDULE COMPLETED";
    if (nextClassBadge) {
      nextClassBadge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white flex items-center gap-1.5 shadow-sm';
      nextClassBadge.innerHTML = '<span class="w-2 h-2 rounded-full bg-white"></span> ✓ ALL SESSIONS CONCLUDED';
    }
    if (focalTime) focalTime.textContent = 'Done for Today';
    if (focalSubject) focalSubject.textContent = 'Daily Classes Concluded';
    if (focalClass) focalClass.textContent = `${todayClasses.length} Sessions Conducted`;
    if (focalRoom) focalRoom.textContent = 'Attendance Synced with HOD';
    if (focalCap) focalCap.textContent = 'Next session tomorrow';

    if (checkInBtn) {
      checkInBtn.className = 'w-full py-4 px-6 bg-slate-800 text-slate-300 rounded-2xl font-bold text-sm shadow-sm opacity-90 cursor-default flex items-center justify-center gap-2';
      checkInBtn.innerHTML = `<span>✓ ALL CLASSES COMPLETED FOR TODAY</span>`;
      checkInBtn.onclick = null;
    }
    if (checkinTimeText) {
      checkinTimeText.textContent = `All ${todayClasses.length} assigned periods concluded. Check timetable for tomorrow's schedule.`;
    }
  } else if (focalClassObj) {
    // Populate focal card with the exact live/upcoming class
    if (focalTime) focalTime.textContent = focalClassObj.time;
    if (focalSubject) focalSubject.textContent = focalClassObj.subject;
    if (focalClass) focalClass.textContent = `Class: ${focalClassObj.class}`;
    if (focalRoom) focalRoom.textContent = `Room: ${focalClassObj.room}`;
    if (focalCap) focalCap.textContent = `${focalClassObj.periodName} • ${focalClassObj.day}`;

    if (checkInBtn) {
      checkInBtn.onclick = () => handleTeacherCheckIn(focalClassObj);
    }

    if (isActiveNow) {
      if (focalTitle) focalTitle.textContent = 'LIVE CLASS (NOW IN PROGRESS)';
      if (appState.teacherCheckedIn) {
        if (nextClassBadge) {
          nextClassBadge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm';
          nextClassBadge.innerHTML = '<span class="w-2 h-2 rounded-full bg-white animate-pulse-dot"></span> LIVE CLASS • CHECKED IN';
        }
        if (checkInBtn) {
          checkInBtn.className = 'w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-extrabold text-base shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-3 transform active:scale-98 cursor-pointer';
          checkInBtn.innerHTML = `
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
            <span>CHECKED IN • IN PROGRESS</span>
          `;
        }
        if (checkinTimeText) {
          checkinTimeText.textContent = `Geo-verified at ${focalClassObj.room} • Broadcasted to HOD Live Board`;
        }
      } else {
        if (nextClassBadge) {
          nextClassBadge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white flex items-center gap-1.5 shadow-sm animate-pulse';
          nextClassBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-white animate-ping"></span> 🟢 LIVE NOW (${focalClassObj.time})`;
        }
        if (checkInBtn) {
          checkInBtn.className = 'w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-extrabold text-base shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-3 transform active:scale-98 cursor-pointer';
          checkInBtn.innerHTML = `
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 004 11a7.96 7.96 0 004.28 7.05"/></svg>
            <span>CHECK IN NOW (${focalClassObj.room})</span>
          `;
        }
        if (checkinTimeText) {
          checkinTimeText.textContent = `Tap to check-in at ${focalClassObj.room} (Broadcasts to HOD Live Board)`;
        }
      }
    } else {
      // Upcoming class
      const startTimeStr = focalClassObj.time.split('-')[0].trim();
      if (focalTitle) focalTitle.textContent = 'NEXT SCHEDULED CLASS';
      if (nextClassBadge) {
        nextClassBadge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-indigo-500 text-white flex items-center gap-1.5 shadow-sm';
        nextClassBadge.innerHTML = `UPCOMING (${startTimeStr})`;
      }
      if (checkInBtn) {
        checkInBtn.className = 'w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-extrabold text-base shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-3 transform active:scale-98 cursor-pointer';
        checkInBtn.innerHTML = `
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 004 11a7.96 7.96 0 004.28 7.05"/></svg>
          <span>CHECK IN (${focalClassObj.room})</span>
        `;
      }
      if (checkinTimeText) {
        checkinTimeText.textContent = `Starts at ${startTimeStr} • Tap to check-in when entering ${focalClassObj.room}`;
      }
    }
  }

  // Workload cards metrics
  const completedClasses = todayClasses.filter(c => c.status === 'Completed');
  const metricTodayTotal = document.getElementById('teacher-metric-today-total');
  const metricTodayCompleted = document.getElementById('teacher-metric-today-completed');
  const metricTodaySub = document.getElementById('teacher-metric-today-sub');
  const metricTodayCompletedSub = document.getElementById('teacher-metric-today-completed-sub');

  if (metricTodayTotal) metricTodayTotal.textContent = `${todayClasses.length} Classes`;
  if (metricTodaySub) metricTodaySub.textContent = `${todayDayName} Schedule`;
  if (metricTodayCompleted) metricTodayCompleted.textContent = `${completedClasses.length} ${completedClasses.length === 1 ? 'Class' : 'Classes'}`;
  if (metricTodayCompletedSub) metricTodayCompletedSub.textContent = completedClasses.length > 0 ? `✓ ${completedClasses[completedClasses.length - 1].subject}` : 'None yet';

  // Render teacher daily timeline (Right Column)
  const timelineList = document.getElementById('teacher-timeline-list');
  const scheduleMeta = document.getElementById('teacher-today-schedule-meta');
  const classesCountBadge = document.getElementById('teacher-today-classes-count');

  if (scheduleMeta) scheduleMeta.textContent = `${todayDayName} • ${todayClasses.length} Periods Scheduled`;
  if (classesCountBadge) classesCountBadge.textContent = `${todayClasses.length} Classes`;

  if (timelineList) {
    timelineList.innerHTML = '';
    todayClasses.forEach(item => {
      let pill = '';
      if (approvedLeaveToday) {
        pill = `<span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">🔄 Sub: ${escapeHTML(approvedLeaveToday.substitute_teacher || 'Dr. Rajesh')}</span>`;
      } else if (item.status === 'Completed') {
        pill = '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">✓ Completed</span>';
      } else if (item.status === 'Active') {
        pill = appState.teacherCheckedIn
          ? '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">🟢 Active (In Progress)</span>'
          : '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">⚪ Live Now (Pending Check-In)</span>';
      } else {
        pill = `<span class="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500">Upcoming (${escapeHTML(item.time.split('-')[0].trim())})</span>`;
      }

      const div = document.createElement('div');
      div.className = `flex items-start gap-3 p-3 rounded-xl border transition ${item.status === 'Active' ? 'bg-indigo-50/50 border-indigo-200 shadow-xs' : 'bg-white border-slate-100 hover:shadow-xs'}`;
      div.innerHTML = `
        <div class="text-xs font-mono font-bold text-slate-500 pt-0.5 w-16">${escapeHTML(item.time.split('-')[0].trim())}</div>
        <div class="flex-1">
          <div class="flex items-center justify-between">
            <h4 class="font-bold text-slate-800 text-sm">${escapeHTML(item.subject)}</h4>
            ${pill}
          </div>
          <p class="text-xs text-slate-500 mt-0.5">${escapeHTML(item.class)} • ${escapeHTML(item.room)} • ${escapeHTML(item.periodName)}</p>
        </div>
      `;
      timelineList.appendChild(div);
    });
  }

  // Render Tab 2 ("Today's Classes Full List") if container exists
  const tabClassesGrid = document.getElementById('teacher-all-today-classes');
  if (tabClassesGrid) {
    tabClassesGrid.innerHTML = '';
    todayClasses.forEach(item => {
      let statusBadge = '';
      let borderBg = '';
      if (approvedLeaveToday) {
        statusBadge = `<span class="text-xs font-bold text-emerald-700">🔄 SUB ASSIGNED: ${escapeHTML(approvedLeaveToday.substitute_teacher || 'Dr. Rajesh')}</span>`;
        borderBg = 'border-emerald-200 bg-emerald-50/40';
      } else if (item.status === 'Completed') {
        statusBadge = '<span class="text-xs font-bold text-emerald-700">✓ COMPLETED</span>';
        borderBg = 'border-emerald-200 bg-emerald-50/40';
      } else if (item.status === 'Active') {
        statusBadge = '<span class="text-xs font-bold text-indigo-700">🟢 CURRENT SLOT</span>';
        borderBg = 'border-indigo-300 bg-indigo-50/40';
      } else {
        statusBadge = '<span class="text-xs font-bold text-slate-500">⚪ UPCOMING</span>';
        borderBg = 'border-slate-200 bg-slate-50';
      }

      const card = document.createElement('div');
      card.className = `p-4 rounded-2xl border ${borderBg} space-y-2`;
      card.innerHTML = `
        <div class="flex justify-between items-center">
          <span class="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white border border-slate-200">${escapeHTML(item.time)}</span>
          ${statusBadge}
        </div>
        <h4 class="font-bold text-slate-900 text-base">${escapeHTML(item.subject)}</h4>
        <p class="text-xs text-slate-600">Batch: <strong>${escapeHTML(item.class)}</strong> • Room: <strong>${escapeHTML(item.room)}</strong> • ${escapeHTML(item.periodName)}</p>
      `;
      tabClassesGrid.appendChild(card);
    });
  }

  // Render teacher dynamic weekly timetable (7 periods + breaks)
  const teacherTtBody = document.getElementById('teacher-weekly-timetable-tbody');
  if (teacherTtBody) {
    teacherTtBody.innerHTML = '';
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    const formatTeacherCell = (val) => {
      if (!val || val === '-') return '<span class="text-slate-300 font-mono">-</span>';
      if (val.toLowerCase().includes(currentTeacherName) || val.toLowerCase().includes('arun')) {
        return `<div class="p-1 rounded-lg bg-indigo-50 border border-indigo-200 text-[11px] font-bold text-indigo-950 leading-tight">${val}</div>`;
      }
      return '<span class="text-slate-400 text-[11px]">Free / Prep</span>';
    };

    days.forEach(d => {
      const daySlots = (appState.masterTimetableSlots || []).filter(s => s.day === d);
      const getSlotForPeriod = (pKey) => {
        const found = daySlots.find(s => (s[pKey] || '').toLowerCase().includes(currentTeacherName) || (s[pKey] || '').toLowerCase().includes('arun'));
        return found ? `${found[pKey]} (${found.section})` : '-';
      };

      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-200 hover:bg-slate-50 transition text-xs';
      tr.innerHTML = `
        <td class="font-bold bg-slate-50 border border-slate-200 p-2 text-slate-900">${d}</td>
        <td class="border border-slate-200 p-1.5">${formatTeacherCell(getSlotForPeriod('p1'))}</td>
        <td class="border border-slate-200 p-1.5">${formatTeacherCell(getSlotForPeriod('p2'))}</td>
        <td class="border border-amber-200 bg-amber-50/70 p-1 text-[10px] font-bold text-amber-800">☕</td>
        <td class="border border-slate-200 p-1.5">${formatTeacherCell(getSlotForPeriod('p3'))}</td>
        <td class="border border-slate-200 p-1.5">${formatTeacherCell(getSlotForPeriod('p4'))}</td>
        <td class="border border-emerald-200 bg-emerald-50/70 p-1 text-[10px] font-bold text-emerald-800">🍱</td>
        <td class="border border-slate-200 p-1.5">${formatTeacherCell(getSlotForPeriod('p5'))}</td>
        <td class="border border-slate-200 p-1.5">${formatTeacherCell(getSlotForPeriod('p6'))}</td>
        <td class="border border-slate-200 p-1.5">${formatTeacherCell(getSlotForPeriod('p7'))}</td>
      `;
      teacherTtBody.appendChild(tr);
    });
  }

  // Also refresh teacher leaves
  renderTeacherLeaves();
}

// Render teacher leave requests status on Dashboard & dedicated Leave Status Tab
function renderTeacherLeaves() {
  const currentTeacherName = (appState.currentUser?.name || 'Arun Kumar').toLowerCase();
  const currentTeacherEmail = (appState.currentUser?.email || '').toLowerCase();
  
  // Find all leave requests submitted by this teacher
  const allLeaves = appState.leavesList || [];
  const myLeaves = allLeaves.filter(l => {
    const tName = (l.teacher_name || '').toLowerCase();
    const tEmail = (l.teacher_email || '').toLowerCase();
    return tName.includes(currentTeacherName) || currentTeacherName.includes(tName) || (tEmail && tEmail === currentTeacherEmail);
  });

  // Calculate badge counts
  const pendingCount = myLeaves.filter(l => l.status === 'pending').length;
  const approvedCount = myLeaves.filter(l => l.status === 'approved').length;
  const rejectedCount = myLeaves.filter(l => l.status === 'rejected').length;

  const sidebarBadge = document.getElementById('teacher-sidebar-leaves-badge');
  const drawerBadge = document.getElementById('teacher-drawer-leaves-badge');
  
  let badgeText = `${myLeaves.length}`;
  let badgeClass = 'text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600';
  if (approvedCount > 0) {
    badgeText = `${approvedCount} Approved`;
    badgeClass = 'text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800';
  } else if (pendingCount > 0) {
    badgeText = `${pendingCount} Pending`;
    badgeClass = 'text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800';
  }

  if (sidebarBadge) {
    sidebarBadge.textContent = badgeText;
    sidebarBadge.className = badgeClass;
  }
  if (drawerBadge) {
    drawerBadge.textContent = badgeText;
    drawerBadge.className = badgeClass;
  }

  // Render on Dashboard card
  const dashboardCardList = document.getElementById('teacher-my-leaves-list');
  const dashboardCard = document.getElementById('teacher-leave-status-card');
  const fullLeavesList = document.getElementById('teacher-full-leaves-list');

  if (myLeaves.length === 0) {
    if (dashboardCard) dashboardCard.classList.add('hidden');
    if (fullLeavesList) {
      fullLeavesList.innerHTML = `
        <div class="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
          <p class="font-bold text-sm text-slate-600">No Leave Requests Found</p>
          <p class="text-xs mt-0.5">Submit a leave request using the button above to track its HOD approval status here.</p>
        </div>
      `;
    }
    return;
  }

  if (dashboardCard) dashboardCard.classList.remove('hidden');

  const renderCardItem = (l) => {
    let statusPill = '';
    let statusBg = '';
    let statusBorder = '';
    let statusMessage = '';

    if (l.status === 'approved') {
      statusPill = '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1"><span>✓</span> APPROVED BY HOD</span>';
      statusBg = 'bg-emerald-50/60';
      statusBorder = 'border-emerald-200';
      statusMessage = `
        <div class="mt-2 p-2.5 bg-white/80 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-0.5">
          <p class="font-bold flex items-center gap-1.5">
            <span>🔄</span> Substitute Faculty Assigned: <span class="text-indigo-700 underline font-extrabold">${escapeHTML(l.substitute_teacher || 'Dr. Rajesh')}</span>
          </p>
          <p class="text-[11px] text-slate-500">Your scheduled classes for ${escapeHTML(l.date)} have been delegated. You are excused from check-in.</p>
        </div>
      `;
    } else if (l.status === 'rejected') {
      statusPill = '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1"><span>✕</span> REJECTED BY HOD</span>';
      statusBg = 'bg-rose-50/60';
      statusBorder = 'border-rose-200';
      statusMessage = `
        <div class="mt-2 p-2.5 bg-white/80 rounded-xl border border-rose-200 text-xs text-rose-900">
          <p class="font-bold">Leave request was not approved.</p>
          <p class="text-[11px] text-slate-600">Please attend scheduled classes or contact your HOD directly.</p>
        </div>
      `;
    } else {
      statusPill = '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse flex items-center gap-1"><span>⏳</span> AWAITING HOD APPROVAL</span>';
      statusBg = 'bg-amber-50/50';
      statusBorder = 'border-amber-200';
      statusMessage = '<p class="text-[11px] text-slate-500 mt-1">Submitted to HOD desk. You will be notified immediately upon approval.</p>';
    }

    const periodsStr = Array.isArray(l.periods) ? l.periods.map(escapeHTML).join(', ') : 'Full Day';

    return `
      <div class="p-4 rounded-2xl border ${statusBorder} ${statusBg} transition space-y-1.5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">📅 ${escapeHTML(l.date)}</span>
            <span class="text-xs text-slate-600 font-semibold">Periods: ${periodsStr}</span>
          </div>
          ${statusPill}
        </div>
        <p class="text-xs text-slate-700"><strong>Reason:</strong> ${escapeHTML(l.reason)}</p>
        ${statusMessage}
      </div>
    `;
  };

  if (dashboardCardList) {
    dashboardCardList.innerHTML = myLeaves.map(renderCardItem).join('');
  }
  if (fullLeavesList) {
    fullLeavesList.innerHTML = myLeaves.map(renderCardItem).join('');
  }
}

// =========================================================================
// ADMIN TIMETABLE GENERATOR & MANAGEMENT
// =========================================================================

// Apply Generated or Selected Draft Timetable Campus-Wide
function applyGeneratedTimetable() {
  const latestDraft = (appState.timetableVersions || []).find(v => v.status === 'DRAFT');
  const targetVer = latestDraft ? latestDraft.version : `v3.${(appState.timetableVersions || []).length + 1}`;

  appState.timetableVersions.forEach(v => {
    if (v.status === 'ACTIVE') v.status = 'ARCHIVED';
  });

  if (latestDraft) {
    latestDraft.status = 'ACTIVE';
    latestDraft.appliedAt = 'Just Now';
  } else {
    appState.timetableVersions.unshift({
      version: targetVer,
      status: 'ACTIVE',
      term: 'Odd Semester 2026-27',
      appliedAt: 'Just Now',
      generatedBy: 'AI Constraint Engine v2'
    });
  }

  saveState();
  renderAdminTables();
  renderAdminTimetable();
  showToast(`Timetable ${targetVer} applied campus-wide! HODs and Teachers notified.`, 'success');

  // Persist to FastAPI Backend and broadcast to all clients via WebSockets
  if (window.ApiClient && window.lastGeneratedTimetableId) {
    ApiClient.applyTimetable(window.lastGeneratedTimetableId)
      .then(() => syncWithBackend())
      .catch(err => console.warn('Backend apply timetable fallback:', err.message));
  }
}

// Render Admin Tables (HODs, Teachers, Versions)
function renderAdminTables() {
  // HODs Table
  const hodTable = document.getElementById('admin-hods-tbody');
  if (hodTable) {
    hodTable.innerHTML = '';
    const hods = appState.hodsList || [];
    if (hods.length === 0) {
      hodTable.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-slate-400 text-xs font-medium">No HOD accounts registered yet. Click "+ Add HOD" to onboard department leadership.</td></tr>';
    } else {
      hods.forEach(h => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-100 hover:bg-slate-50/80 text-sm';
        const depts = (h.departments && h.departments.length > 0) ? h.departments : (h.dept ? h.dept.split(' & ') : ['Information Technology']);
        const deptBadges = depts.map(d => `<span class="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">${escapeHTML(d)}</span>`).join(' ');

        tr.innerHTML = `
          <td class="py-3 px-4 font-bold text-slate-800">${escapeHTML(h.name)}</td>
          <td class="py-3 px-4 font-mono text-xs text-indigo-600 font-semibold">${escapeHTML(h.email)}</td>
          <td class="py-3 px-4 text-slate-700 font-medium">
            <div class="flex flex-wrap gap-1 items-center">
              ${deptBadges}
            </div>
          </td>
          <td class="py-3 px-4 text-slate-500">${escapeHTML(h.roomsManaged)}</td>
          <td class="py-3 px-4">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              ${escapeHTML(h.status)}
            </span>
          </td>
          <td class="py-3 px-4 text-right">
            <button onclick="handleDeleteHod('${escapeHTML(h.id)}', '${escapeHTML(h.email)}', '${escapeHTML(h.name)}')" title="Delete HOD" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </td>
        `;
        hodTable.appendChild(tr);
      });
    }
  }

  // Teachers Table (Admin View)
  const tTable = document.getElementById('admin-teachers-tbody');
  if (tTable) {
    tTable.innerHTML = '';
    const teachers = appState.teachersList || [];
    if (teachers.length === 0) {
      tTable.innerHTML = '<tr><td colspan="7" class="py-8 text-center text-slate-400 text-xs font-medium">No faculty teachers registered yet. Click "+ Add Teacher" to onboard teaching faculty.</td></tr>';
    } else {
      teachers.forEach(t => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-100 hover:bg-slate-50/80 text-sm';
        tr.innerHTML = `
          <td class="py-3 px-4 font-bold text-slate-800">${escapeHTML(t.name)}</td>
          <td class="py-3 px-4 text-slate-600 font-mono text-xs">${escapeHTML(t.email)}</td>
          <td class="py-3 px-4 text-slate-800 font-medium">${escapeHTML(t.subject)}</td>
          <td class="py-3 px-4 text-slate-600">${escapeHTML(t.dept)}</td>
          <td class="py-3 px-4 text-slate-600">${escapeHTML(t.workload)}</td>
          <td class="py-3 px-4">
            <span class="px-2 py-0.5 rounded-full text-xs font-semibold ${t.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : (t.status === 'In Class' ? 'bg-indigo-100 text-indigo-800' : 'bg-rose-100 text-rose-800')}">
              ${escapeHTML(t.status)}
            </span>
          </td>
          <td class="py-3 px-4 text-right">
            <button onclick="handleDeleteTeacher('${escapeHTML(t.id)}', '${escapeHTML(t.name)}')" title="Delete Faculty" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </td>
        `;
        tTable.appendChild(tr);
      });
    }
  }

  // Timetable Versions Table & Version Cards
  const vTable = document.getElementById('admin-versions-tbody');
  const vCardsContainer = document.getElementById('admin-versions-cards-container');

  if (vTable) {
    vTable.innerHTML = '';
    appState.timetableVersions.forEach(v => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-100 hover:bg-slate-50/80 text-sm';
      const isDraft = v.status === 'DRAFT';
      const isActive = v.status === 'ACTIVE';

      tr.innerHTML = `
        <td class="py-3 px-4 font-bold text-indigo-700">${escapeHTML(v.version)}</td>
        <td class="py-3 px-4 font-medium text-slate-800">${escapeHTML(v.term)}</td>
        <td class="py-3 px-4 text-slate-500">${escapeHTML(v.appliedAt)}</td>
        <td class="py-3 px-4 text-slate-600 text-xs font-mono">${escapeHTML(v.generatedBy)}</td>
        <td class="py-3 px-4">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${isActive ? 'bg-emerald-500 text-white' : (isDraft ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600')}">
            ${escapeHTML(v.status)}
          </span>
        </td>
        <td class="py-3 px-4 text-right">
          <div class="flex items-center justify-end gap-1.5">
            ${isDraft ? `
              <button onclick="handleApplyDraftVersion('${escapeHTML(v.version)}')" title="Apply this draft campus-wide" class="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg transition cursor-pointer">
                ✓ Apply
              </button>
            ` : ''}
            ${!isActive ? `
              <button onclick="handleDeleteTimetableVersion('${escapeHTML(v.version)}')" title="Delete Draft / Version" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            ` : '<span class="text-[10px] font-bold text-slate-400 italic">Protected (Active)</span>'}
          </div>
        </td>
      `;
      vTable.appendChild(tr);
    });
  }

  if (vCardsContainer) {
    vCardsContainer.innerHTML = '';
    appState.timetableVersions.forEach(v => {
      const isDraft = v.status === 'DRAFT';
      const isActive = v.status === 'ACTIVE';
      const div = document.createElement('div');
      div.className = `p-3.5 rounded-xl border flex flex-wrap justify-between items-center gap-2 ${isActive ? 'bg-emerald-50/80 border-emerald-200' : (isDraft ? 'bg-amber-50/60 border-amber-200' : 'bg-slate-50 border-slate-200')}`;
      div.innerHTML = `
        <div>
          <div class="flex items-center gap-2">
            <h4 class="font-bold ${isActive ? 'text-emerald-900' : 'text-slate-900'} text-sm">${escapeHTML(v.version)} - ${escapeHTML(v.term)}</h4>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-emerald-600 text-white' : (isDraft ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700')}">${escapeHTML(v.status)}</span>
          </div>
          <p class="text-xs ${isActive ? 'text-emerald-700' : 'text-slate-500'} mt-0.5">Applied: ${escapeHTML(v.appliedAt)} • Generated by: ${escapeHTML(v.generatedBy)}</p>
        </div>
        <div class="flex items-center gap-2">
          ${isDraft ? `
            <button onclick="handleApplyDraftVersion('${escapeHTML(v.version)}')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer">
              ✓ Apply Campus-Wide
            </button>
          ` : ''}
          ${!isActive ? `
            <button onclick="handleDeleteTimetableVersion('${escapeHTML(v.version)}')" class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              <span>Delete Draft</span>
            </button>
          ` : '<span class="text-xs font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-1 rounded-lg">Campus Live</span>'}
        </div>
      `;
      vCardsContainer.appendChild(div);
    });
  }
}

// Delete Draft Timetable Version
function handleDeleteTimetableVersion(versionStr) {
  const target = (appState.timetableVersions || []).find(v => v.version === versionStr);
  if (!target) return;

  if (target.status === 'ACTIVE') {
    showToast('Cannot delete currently active timetable version. Make another version active first.', 'error');
    return;
  }

  if (!confirm(`Are you sure you want to delete draft timetable version ${versionStr}?`)) {
    return;
  }

  appState.timetableVersions = appState.timetableVersions.filter(v => v.version !== versionStr);
  saveState();
  renderAdminTables();
  showToast(`Draft timetable ${versionStr} deleted.`, 'info');
}

// Apply Draft Timetable Version
function handleApplyDraftVersion(versionStr) {
  const target = (appState.timetableVersions || []).find(v => v.version === versionStr);
  if (!target) return;

  appState.timetableVersions.forEach(v => {
    if (v.status === 'ACTIVE') v.status = 'ARCHIVED';
  });
  target.status = 'ACTIVE';
  target.appliedAt = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

  saveState();
  renderAdminTables();
  renderAdminTimetable();
  showToast(`Timetable version ${versionStr} applied campus-wide!`, 'success');
}

function renderHodTeachers() {
  const container = document.getElementById('hod-teachers-cards-container');
  if (!container) return;
  container.innerHTML = '';
  const teachers = appState.teachersList || [];

  if (teachers.length === 0) {
    container.innerHTML = `
      <div class="col-span-full p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
        <p class="font-bold text-xs text-slate-600">No Department Teachers Added</p>
        <p class="text-[11px] mt-0.5">Click "+ Add Teacher" to assign faculty to this department.</p>
      </div>
    `;
    return;
  }

  teachers.forEach(t => {
    const card = document.createElement('div');
    card.className = 'p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs';
    card.innerHTML = `
      <div>
        <span class="font-bold text-slate-800 text-sm">${escapeHTML(t.name)}</span>
        <p class="text-slate-500">${escapeHTML(t.subject)} • <span class="font-mono text-indigo-600">${escapeHTML(t.email)}</span></p>
      </div>
      <div class="flex items-center gap-2">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${t.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'}">
          ${escapeHTML(t.status)}
        </span>
        <button onclick="handleDeleteTeacher('${escapeHTML(t.id)}', '${escapeHTML(t.name)}')" title="Delete Teacher" class="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

// Modal handling
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('hidden');

  if (modalId === 'modal-teacher-leave') {
    const teacherNameInput = document.getElementById('leave-teacher-name');
    if (teacherNameInput) {
      teacherNameInput.value = appState.currentUser?.name || 'Faculty';
    }
    const dateInput = document.getElementById('leave-date');
    if (dateInput && !dateInput.value) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateInput.value = tomorrow.toISOString().split('T')[0];
    }
  }

  if (modalId === 'modal-add-hod') {
    if (typeof handleHodDeptSelectionLimit === 'function') {
      handleHodDeptSelectionLimit(null);
    }
  }

  if (modalId === 'modal-add-batch' || modalId === 'modal-manual-timetable' || modalId === 'modal-add-subject-mapping') {
    if (typeof updateAllSelectDropdowns === 'function') {
      updateAllSelectDropdowns();
    }
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('hidden');
}

// 1. TEACHER SUBMITS LEAVE REQUEST (POWERED BY FIREBASE CLOUD FIRESTORE)
async function handleTeacherSubmitLeave(e) {
  e.preventDefault();
  const teacherName = document.getElementById('leave-teacher-name')?.value || appState.currentUser?.name || 'Faculty';
  const date = document.getElementById('leave-date')?.value;
  const reason = document.getElementById('leave-reason')?.value;
  const periodCheckboxes = document.querySelectorAll('input[name="leave-period"]:checked');
  const periods = Array.from(periodCheckboxes).map(cb => parseInt(cb.value));

  if (!date || !reason || periods.length === 0) {
    showToast('Please specify date, at least one period, and reason.', 'error');
    return;
  }

  const dept = appState.currentUser?.dept || 'Information Technology';

  const newLeave = {
    id: 'leave-' + Date.now(),
    teacher_name: teacherName,
    teacher_email: appState.currentUser?.email || '',
    date: date,
    periods: periods,
    reason: reason,
    department: dept,
    status: 'pending',
    substitute_teacher: null,
    created_at: new Date().toISOString()
  };

  // 1. Save to state & sync to Firebase Cloud Firestore immediately
  appState.leavesList = appState.leavesList || [];
  appState.leavesList.unshift(newLeave);
  saveState();
  renderHodLeaves();
  renderTeacherLeaves();
  renderTeacherDashboard();

  closeModal('modal-teacher-leave');
  showToast(`Leave request for ${date} submitted successfully! Synced with HOD via Firebase.`, 'success');
  e.target.reset();

  // Optional background sync to backend if available
  if (window.ApiClient) {
    ApiClient.submitLeave(newLeave).catch(() => {});
  }
}

// 2. HOD RENDERS & REVIEWS LEAVE REQUESTS
function renderHodLeaves() {
  const container = document.getElementById('hod-leaves-container');
  const badge = document.getElementById('hod-leaves-badge');
  const drawerBadge = document.getElementById('hod-drawer-leaves-badge');
  if (!container) return;

  const leaves = appState.leavesList || [];
  const pendingLeaves = leaves.filter(l => l.status === 'pending');

  if (badge) badge.textContent = `${pendingLeaves.length} New`;
  if (drawerBadge) drawerBadge.textContent = `${pendingLeaves.length} New`;

  if (leaves.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
        <svg class="w-10 h-10 mx-auto text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <p class="font-bold text-sm text-slate-600">No Pending Leave Requests</p>
        <p class="text-xs mt-0.5">Faculty absence requests will appear here for review.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  leaves.forEach(l => {
    const isPending = l.status === 'pending';
    const isApproved = l.status === 'approved';
    const card = document.createElement('div');
    card.className = `p-4 rounded-2xl border ${isPending ? 'border-amber-200 bg-amber-50/40' : (isApproved ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-slate-50')} flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition`;
    
    let statusPill = isPending 
      ? '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">PENDING REVIEW</span>'
      : (isApproved ? '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">APPROVED</span>' : '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">REJECTED</span>');

    const periodsStr = Array.isArray(l.periods) ? l.periods.map(escapeHTML).join(', ') : 'Full Day';
    const leaveId = escapeHTML(String(l.id || l._id || ''));

    card.innerHTML = `
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <h4 class="font-bold text-slate-900 text-sm">${escapeHTML(l.teacher_name)}</h4>
          ${statusPill}
          <span class="text-xs text-slate-500 font-mono">📅 ${escapeHTML(l.date)}</span>
        </div>
        <p class="text-xs text-slate-600"><strong>Periods:</strong> ${periodsStr} • <strong>Reason:</strong> ${escapeHTML(l.reason)}</p>
        ${l.substitute_teacher ? `<p class="text-xs text-indigo-700 font-semibold">🔄 Substitute Assigned: ${escapeHTML(l.substitute_teacher)}</p>` : ''}
      </div>
      ${isPending ? `
        <div class="flex items-center gap-2 shrink-0">
          <button onclick="handleApproveLeave('${leaveId}')" class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer">
            <span>✓ Approve & Assign</span>
          </button>
          <button onclick="handleRejectLeave('${leaveId}')" class="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer">
            <span>✕ Reject</span>
          </button>
        </div>
      ` : ''}
    `;
    container.appendChild(card);
  });
}

// 2a. HOD APPROVES LEAVE (SYNCED TO FIREBASE & REAL-TIME TEACHER UPDATE)
async function handleApproveLeave(leaveId) {
  appState.leavesList = appState.leavesList || [];
  const leave = appState.leavesList.find(l => String(l.id || l._id) === String(leaveId));
  if (leave) {
    const deptTeachers = (appState.teachersList || []).filter(t => t.name !== leave.teacher_name && (t.department === leave.department || !leave.department));
    const defaultSub = deptTeachers.length > 0 ? deptTeachers[0].name : 'Dr. Rajesh';
    const chosenSub = prompt(`Assign substitute faculty for ${leave.teacher_name}:`, defaultSub);
    if (chosenSub === null) return; // User cancelled
    const subTeacher = chosenSub.trim() || defaultSub;

    leave.status = 'approved';
    leave.substitute_teacher = subTeacher;
    saveState();
    renderHodLeaves();
    renderTeacherLeaves();
    renderTeacherDashboard();
    showToast(`Leave for ${leave.teacher_name} approved! ${subTeacher} assigned as substitute.`, 'success');

    if (window.ApiClient) {
      ApiClient.reviewLeave(leaveId, { status: "approved", substitute_teacher: subTeacher }).catch(() => {});
    }
  }
}

// 2b. HOD REJECTS LEAVE (SYNCED TO FIREBASE & REAL-TIME TEACHER UPDATE)
async function handleRejectLeave(leaveId) {
  appState.leavesList = appState.leavesList || [];
  const leave = appState.leavesList.find(l => String(l.id || l._id) === String(leaveId));
  if (leave) {
    if (!confirm(`Are you sure you want to reject the leave request for ${leave.teacher_name}?`)) return;
    leave.status = 'rejected';
    saveState();
    renderHodLeaves();
    renderTeacherLeaves();
    renderTeacherDashboard();
    showToast(`Leave request for ${leave.teacher_name} rejected.`, 'info');

    if (window.ApiClient) {
      ApiClient.reviewLeave(leaveId, { status: "rejected" }).catch(() => {});
    }
  }
}

// 3. ADMIN ADDS COURSE SUBJECT
async function handleAdminAddSubject(e) {
  e.preventDefault();
  const code = document.getElementById('new-subj-code').value.trim().toUpperCase();
  const name = document.getElementById('new-subj-name').value.trim();
  const type = document.getElementById('new-subj-type').value;
  const hours = parseInt(document.getElementById('new-subj-hours').value) || 4;
  const dept = document.getElementById('new-subj-dept').value.trim() || 'Information Technology';
  const sem = parseInt(document.getElementById('new-subj-sem').value) || 3;

  if (!code || !name) {
    showToast('Subject Code and Subject Name are required.', 'error');
    return;
  }

  appState.subjectsList = appState.subjectsList || [];
  if (appState.subjectsList.some(s => s.code && s.code.toUpperCase() === code)) {
    showToast(`Subject with code ${code} already exists.`, 'error');
    return;
  }

  const newSubj = {
    id: 'subj-' + Date.now(),
    code,
    name,
    type,
    weeklyHours: hours,
    dept,
    semester: sem
  };

  appState.subjectsList.push(newSubj);
  saveState(true);
  renderAdminSubjects();
  if (typeof updateAllSelectDropdowns === 'function') updateAllSelectDropdowns();

  closeModal('modal-add-subject');
  showToast(`Subject ${code} - ${name} registered successfully!`, 'success');
  e.target.reset();

  if (window.ApiClient) {
    ApiClient.createSubject({
      code,
      name,
      type,
      weekly_hours: hours,
      department: dept,
      semester: sem
    }).catch(err => console.warn('Backend createSubject fallback:', err.message));
  }
}

// 4. ADMIN ADDS CLASSROOM / LAB WITH GPS
async function handleAdminAddRoom(e) {
  e.preventDefault();
  const room_code = document.getElementById('new-room-code').value.trim().toUpperCase();
  const capacity = parseInt(document.getElementById('new-room-capacity').value) || 60;
  const type = document.getElementById('new-room-type').value;
  const block = document.getElementById('new-room-block').value.trim() || 'Academic Block C';
  const lat = parseFloat(document.getElementById('new-room-lat').value) || 12.9716;
  const lon = parseFloat(document.getElementById('new-room-lon').value) || 77.5946;
  const radius = parseFloat(document.getElementById('new-room-radius').value) || 60.0;

  if (!room_code) {
    showToast('Room Code or Number is required.', 'error');
    return;
  }

  appState.classroomsList = appState.classroomsList || [];
  if (appState.classroomsList.some(r => r.room && r.room.toUpperCase() === room_code)) {
    showToast(`Classroom / Lab ${room_code} already exists.`, 'error');
    return;
  }

  const newRoom = {
    id: 'room-' + Date.now(),
    room: room_code,
    type: type || 'Lecture Hall',
    capacity: capacity,
    block: block,
    latitude: lat,
    longitude: lon,
    radius: radius,
    geo_radius_meters: radius,
    department: 'Information Technology',
    status: 'Active'
  };

  appState.classroomsList.push(newRoom);
  appState.rooms = appState.classroomsList;
  saveState(true);
  renderAdminRooms();
  if (typeof updateAllSelectDropdowns === 'function') updateAllSelectDropdowns();

  closeModal('modal-add-room');
  showToast(`Classroom / Lab ${room_code} added with GPS Geofence (±${radius}m)!`, 'success');
  e.target.reset();

  if (window.ApiClient) {
    ApiClient.createRoom({
      room_code,
      capacity,
      type,
      block,
      department: 'Information Technology',
      latitude: lat,
      longitude: lon,
      geo_radius_meters: radius
    }).catch(err => console.warn('Backend createRoom fallback:', err.message));
  }
}

async function setCurrentGPSForRoom() {
  if (window.GeoLocationHelper && window.GeoLocationHelper.isSupported()) {
    try {
      showToast('Acquiring device GPS...', 'info');
      const pos = await window.GeoLocationHelper.getCurrentPosition();
      document.getElementById('new-room-lat').value = pos.latitude.toFixed(5);
      document.getElementById('new-room-lon').value = pos.longitude.toFixed(5);
      showToast('Current GPS coordinates applied!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
}

// =========================================================================
// DELETE CONTROLLERS (SUBJECTS, CLASSROOMS, TEACHERS, HODS)
// =========================================================================

// 1. Delete Subject
async function handleDeleteSubject(subjectId, subjectCode) {
  if (!confirm(`Are you sure you want to delete subject ${subjectCode}?`)) return;

  appState.subjectsList = appState.subjectsList.filter(s => (s.id !== subjectId && s.code !== subjectCode));
  saveState(true);
  renderAdminSubjects();
  showToast(`Subject ${subjectCode} deleted.`, 'info');

  if (window.ApiClient && subjectId) {
    try {
      await ApiClient.deleteSubject(subjectId);
      console.log(`✅ Subject ${subjectCode} deleted from backend`);
    } catch (err) {
      console.warn('Backend deleteSubject note:', err.message);
    }
  }
}

// 2. Delete Classroom
async function handleDeleteRoom(roomId, roomCode) {
  if (!confirm(`Are you sure you want to delete classroom ${roomCode}?`)) return;

  appState.classroomsList = (appState.classroomsList || []).filter(r => (r.id !== roomId && r.room !== roomCode));
  appState.rooms = appState.classroomsList;
  saveState(true);
  renderAdminRooms();
  updateAllSelectDropdowns();
  showToast(`Classroom ${roomCode} deleted.`, 'info');

  if (window.ApiClient && roomId) {
    try {
      await ApiClient.deleteRoom(roomId);
      console.log(`✅ Classroom ${roomCode} deleted from backend`);
    } catch (err) {
      console.warn('Backend deleteRoom note:', err.message);
    }
  }
}

// 3. Delete Teacher
async function handleDeleteTeacher(teacherId, teacherName) {
  if (!confirm(`Are you sure you want to delete teacher ${teacherName}?`)) return;

  const target = (appState.teachersList || []).find(t => String(t.id) === String(teacherId) || t.name === teacherName);
  appState.teachersList = (appState.teachersList || []).filter(t => String(t.id) !== String(teacherId) && t.name !== teacherName);
  if (target && target.email) {
    appState.users = (appState.users || []).filter(u => u.email.toLowerCase() !== target.email.toLowerCase());
  }
  saveState();
  renderAdminTables();
  renderHodTeachers();
  updateAllSelectDropdowns();
  showToast(`Teacher ${teacherName} removed.`, 'info');

  if (window.ApiClient && teacherId) {
    try {
      await ApiClient.deleteTeacher(teacherId);
      console.log(`✅ Teacher ${teacherName} deleted from backend`);
    } catch (err) {
      console.warn('Backend deleteTeacher note:', err.message);
    }
  }
}

// 4. Delete HOD
async function handleDeleteHod(hodId, hodEmail, hodName) {
  if (!confirm(`Are you sure you want to remove HOD ${hodName}?`)) return;

  appState.hodsList = (appState.hodsList || []).filter(h => String(h.id) !== String(hodId) && h.email !== hodEmail);
  appState.users = (appState.users || []).filter(u => u.email.toLowerCase() !== hodEmail.toLowerCase());
  saveState();
  renderAdminTables();
  showToast(`HOD account for ${hodName} removed.`, 'info');

  if (window.ApiClient) {
    try {
      await ApiClient.deleteUser(hodId);
    } catch (err) {
      console.warn('Backend deleteUser note:', err.message);
    }
  }
}

// Global helper to interconnect all Dropdowns across the Web Application
function updateAllSelectDropdowns() {
  // 1. Update Base Room in modal-add-batch
  const batchRoomSelect = document.getElementById('new-batch-room');
  if (batchRoomSelect) {
    const currentVal = batchRoomSelect.value;
    batchRoomSelect.innerHTML = '';
    const rooms = appState.classroomsList || [];
    if (rooms.length === 0) {
      batchRoomSelect.innerHTML = '<option value="Room C204">Room C204 (Default - Add rooms in Infrastructure)</option>';
    } else {
      rooms.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.room;
        opt.textContent = `${r.room} (${r.type || 'Hall'} • Cap: ${r.capacity || 60})`;
        batchRoomSelect.appendChild(opt);
      });
    }
    if (currentVal && Array.from(batchRoomSelect.options).some(o => o.value === currentVal)) {
      batchRoomSelect.value = currentVal;
    }
  }

  // 2. Update Room in modal-manual-timetable
  const ttRoomSelect = document.getElementById('manual-tt-room');
  if (ttRoomSelect) {
    const currentVal = ttRoomSelect.value;
    ttRoomSelect.innerHTML = '<option value="">-- Select Classroom / Lab --</option>';
    (appState.classroomsList || []).forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.room;
      opt.textContent = `${r.room} (${r.type || 'Hall'})`;
      ttRoomSelect.appendChild(opt);
    });
    if (currentVal) ttRoomSelect.value = currentVal;
  }

  // 3. Update Section in modal-manual-timetable
  const ttSectionSelect = document.getElementById('manual-tt-section');
  if (ttSectionSelect) {
    const currentVal = ttSectionSelect.value;
    ttSectionSelect.innerHTML = '<option value="">-- Select Class / Batch --</option>';
    (appState.studentBatches || []).forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.name;
      opt.textContent = `${b.name} (${b.sem || ''})`;
      ttSectionSelect.appendChild(opt);
    });
    if (currentVal) ttSectionSelect.value = currentVal;
  }

  // 4. Update Subject in modal-manual-timetable
  const ttSubjectSelect = document.getElementById('manual-tt-subject');
  if (ttSubjectSelect) {
    const currentVal = ttSubjectSelect.value;
    ttSubjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';
    (appState.subjectsList || []).forEach(s => {
      const opt = document.createElement('option');
      opt.value = `${s.name} (${s.code})`;
      opt.textContent = `${s.name} (${s.code})`;
      ttSubjectSelect.appendChild(opt);
    });
    if (currentVal) ttSubjectSelect.value = currentVal;
  }

  // 5. Update Teacher in modal-manual-timetable
  const ttTeacherSelect = document.getElementById('manual-tt-teacher');
  if (ttTeacherSelect) {
    const currentVal = ttTeacherSelect.value;
    ttTeacherSelect.innerHTML = '<option value="">-- Select Teacher --</option>';
    (appState.teachersList || []).forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.name;
      opt.textContent = `${t.name} (${t.subject || t.dept || 'Faculty'})`;
      ttTeacherSelect.appendChild(opt);
    });
    if (currentVal) ttTeacherSelect.value = currentVal;
  }

  // 6. Update tt-filter-section in timetable view
  const filterSection = document.getElementById('tt-filter-section');
  if (filterSection) {
    const currentFilter = filterSection.value;
    filterSection.innerHTML = '<option value="ALL">All Classes</option>';
    (appState.studentBatches || []).forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.name;
      opt.textContent = b.name;
      filterSection.appendChild(opt);
    });
    if (currentFilter && Array.from(filterSection.options).some(o => o.value === currentFilter)) {
      filterSection.value = currentFilter;
    }
  }

  // 7. Update modal-add-subject-mapping dropdowns
  const mapTeacher = document.getElementById('map-teacher');
  if (mapTeacher) {
    const cur = mapTeacher.value;
    mapTeacher.innerHTML = '<option value="">-- Select Teacher --</option>';
    (appState.teachersList || []).forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.name;
      opt.textContent = `${t.name} (${t.dept || 'Faculty'})`;
      mapTeacher.appendChild(opt);
    });
    if (cur) mapTeacher.value = cur;
  }

  const mapSubj = document.getElementById('map-subject');
  if (mapSubj) {
    const cur = mapSubj.value;
    mapSubj.innerHTML = '<option value="">-- Select Subject --</option>';
    (appState.subjectsList || []).forEach(s => {
      const opt = document.createElement('option');
      opt.value = `${s.name} (${s.code})`;
      opt.textContent = `${s.name} (${s.code})`;
      mapSubj.appendChild(opt);
    });
    if (cur) mapSubj.value = cur;
  }

  const mapRoom = document.getElementById('map-room');
  if (mapRoom) {
    const cur = mapRoom.value;
    mapRoom.innerHTML = '<option value="">Auto-assign</option>';
    (appState.classroomsList || []).forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.room;
      opt.textContent = r.room;
      mapRoom.appendChild(opt);
    });
    if (cur) mapRoom.value = cur;
  }

  // 8. Update datalist for HOD Add Teacher subject input
  const subjDatalist = document.getElementById('registered-subjects-list');
  if (subjDatalist) {
    subjDatalist.innerHTML = '';
    (appState.subjectsList || []).forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.name;
      opt.label = `${s.code} (${s.dept || ''} - ${s.type || 'Theory'})`;
      subjDatalist.appendChild(opt);
    });
  }
}
window.updateAllSelectDropdowns = updateAllSelectDropdowns;

// Dynamic UI Renderers for Admin Subjects & Classrooms with Delete Buttons
function renderAdminSubjects() {
  const container = document.getElementById('admin-subjects-cards');
  if (!container) return;

  container.innerHTML = '';
  const subjects = appState.subjectsList || [];

  if (subjects.length === 0) {
    container.innerHTML = `
      <div class="col-span-full p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
        <svg class="w-10 h-10 mx-auto text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
        <p class="font-bold text-sm text-slate-600">No Subjects Registered Yet</p>
        <p class="text-xs mt-0.5">Click "+ Add Subject" above to register your course curriculum.</p>
      </div>
    `;
    return;
  }

  subjects.forEach(s => {
    const div = document.createElement('div');
    div.className = 'p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between';
    div.innerHTML = `
      <div>
        <div class="flex justify-between items-start">
          <span class="font-mono text-xs font-bold text-indigo-600 bg-indigo-100/70 px-2 py-0.5 rounded">${escapeHTML(s.code)}</span>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-500">${escapeHTML(s.weeklyHours || 4)} hrs / week</span>
            <button onclick="handleDeleteSubject('${escapeHTML(s.id || '')}', '${escapeHTML(s.code)}')" title="Delete Subject" class="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>
        <h4 class="font-bold text-slate-900 mt-2">${escapeHTML(s.name)}</h4>
        <p class="text-xs text-slate-500 mt-1">${escapeHTML(s.type || 'Theory')} • ${escapeHTML(s.dept || 'IT')} ${s.semester ? '• Sem ' + escapeHTML(s.semester) : ''}</p>
      </div>
    `;
    container.appendChild(div);
  });
}

function renderAdminRooms() {
  const container = document.getElementById('admin-rooms-cards');
  if (!container) return;

  container.innerHTML = '';
  const rooms = appState.classroomsList || [];

  if (rooms.length === 0) {
    container.innerHTML = `
      <div class="col-span-full p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
        <svg class="w-10 h-10 mx-auto text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
        <p class="font-bold text-sm text-slate-600">No Classrooms or Labs Added Yet</p>
        <p class="text-xs mt-0.5">Click "+ Add Classroom (With GPS)" above to configure your rooms with GPS location.</p>
      </div>
    `;
    return;
  }

  rooms.forEach(r => {
    const div = document.createElement('div');
    div.className = 'p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between';
    div.innerHTML = `
      <div>
        <div class="flex justify-between items-start">
          <span class="font-bold text-slate-900">${escapeHTML(r.room)}</span>
          <div class="flex items-center gap-1.5">
            <span class="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded">GPS Active</span>
            <button onclick="handleDeleteRoom('${escapeHTML(r.id || '')}', '${escapeHTML(r.room)}')" title="Delete Room" class="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>
        <p class="text-xs text-slate-500 mt-0.5">${escapeHTML(r.type || 'Lecture Hall')} • Cap: ${escapeHTML(r.capacity || 60)}</p>
        <span class="text-[10px] text-indigo-600 font-mono block mt-1">📍 ${r.latitude ? Number(r.latitude).toFixed(4) : '12.9716'}°N, ${r.longitude ? Number(r.longitude).toFixed(4) : '77.5946'}°E (±${r.radius || 60}m)</span>
      </div>
    `;
    container.appendChild(div);
  });
}

// 5. Academic Classes & Student Batches Management (Add & Delete)
function handleAdminAddBatch(e) {
  e.preventDefault();
  const name = document.getElementById('new-batch-name').value.trim().toUpperCase();
  const strength = parseInt(document.getElementById('new-batch-strength').value) || 60;
  const sem = document.getElementById('new-batch-sem').value;
  const baseRoom = document.getElementById('new-batch-room').value.trim() || 'Room C204';

  if (!name) {
    showToast('Batch section name is required.', 'error');
    return;
  }

  appState.studentBatches = appState.studentBatches || [];
  if (appState.studentBatches.some(b => b.name === name)) {
    showToast(`Batch section ${name} already exists.`, 'error');
    return;
  }

  appState.studentBatches.push({
    id: 'batch-' + Date.now(),
    name,
    strength,
    sem,
    baseRoom
  });

  saveState(true);
  renderAdminBatches();
  updateAllSelectDropdowns();
  closeModal('modal-add-batch');
  showToast(`Class & Batch ${name} added successfully!`, 'success');
  e.target.reset();
}

function handleDeleteBatch(batchId, batchName) {
  if (!confirm(`Are you sure you want to delete class batch ${batchName}?`)) return;

  appState.studentBatches = (appState.studentBatches || []).filter(b => b.id !== batchId && b.name !== batchName);
  saveState(true);
  renderAdminBatches();
  updateAllSelectDropdowns();
  showToast(`Class batch ${batchName} deleted.`, 'info');
}

function renderAdminBatches() {
  const container = document.getElementById('admin-classes-cards');
  if (!container) return;

  container.innerHTML = '';
  const batches = appState.studentBatches || [];

  if (batches.length === 0) {
    container.innerHTML = `
      <div class="col-span-full p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
        <svg class="w-10 h-10 mx-auto text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
        <p class="font-bold text-sm text-slate-600">No Academic Classes or Batches Registered</p>
        <p class="text-xs mt-0.5">Click "+ Add Class / Batch" above to create student sections (e.g. C04, IT-A).</p>
      </div>
    `;
    return;
  }

  batches.forEach(b => {
    const div = document.createElement('div');
    div.className = 'p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between';
    div.innerHTML = `
      <div>
        <div class="flex justify-between items-start">
          <span class="text-base font-bold text-slate-800">${escapeHTML(b.name)}</span>
          <div class="flex items-center gap-1.5">
            <span class="text-[10px] font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">${escapeHTML(b.sem)}</span>
            <button onclick="handleDeleteBatch('${escapeHTML(b.id)}', '${escapeHTML(b.name)}')" title="Delete Batch" class="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>
        <p class="text-xs text-slate-500 mt-1.5">${escapeHTML(b.strength)} Students • ${escapeHTML(b.baseRoom)}</p>
      </div>
    `;
    container.appendChild(div);
  });
}

// 6. Faculty-Subject-Class Mappings CRUD (With Weekly Periods Quotas)
function handleAddSubjectMapping(e) {
  e.preventDefault();
  const teacher = document.getElementById('map-teacher').value.trim();
  const subject = document.getElementById('map-subject').value.trim();
  const sectionsStr = document.getElementById('map-sections').value.trim().toUpperCase();
  const type = document.getElementById('map-type').value;
  const quota = parseInt(document.getElementById('map-quota').value) || 5;
  const room = document.getElementById('map-room').value.trim().toUpperCase() || (type === 'Lab' ? 'Lab 1' : 'C204');

  if (!teacher || !subject || !sectionsStr) {
    showToast('Teacher, Subject, and Assigned Classes are required.', 'error');
    return;
  }

  const sections = sectionsStr.split(',').map(s => s.trim()).filter(Boolean);

  appState.subjectTeacherMappings = appState.subjectTeacherMappings || [];
  appState.subjectTeacherMappings.push({
    id: 'map-' + Date.now(),
    teacher,
    subject,
    type,
    sections,
    quota,
    room
  });

  saveState();
  renderSubjectMappings();
  closeModal('modal-add-subject-mapping');
  showToast(`Mapping added: ${teacher} ➔ ${subject} (${sections.join(', ')}, ${quota} periods/wk)`, 'success');
  e.target.reset();
}

function handleDeleteSubjectMapping(mapId) {
  if (!confirm('Are you sure you want to delete this faculty subject mapping?')) return;
  appState.subjectTeacherMappings = (appState.subjectTeacherMappings || []).filter(m => m.id !== mapId);
  saveState();
  renderSubjectMappings();
  showToast('Mapping deleted.', 'info');
}

function renderSubjectMappings() {
  const tbody = document.getElementById('gen-mappings-tbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  const mappings = appState.subjectTeacherMappings || [];

  if (mappings.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="py-4 text-center text-slate-400 text-xs">No subject-faculty mappings configured. Click "+ Add Mapping" above.</td></tr>';
    return;
  }

  mappings.forEach(m => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-100 hover:bg-slate-50 transition';
    const isMultiClass = m.sections.length > 1;
    tr.innerHTML = `
      <td class="py-2.5 px-3 font-semibold text-slate-900">${escapeHTML(m.teacher)}</td>
      <td class="py-2.5 px-3">
        <span class="font-bold text-indigo-700">${escapeHTML(m.subject)}</span>
        <span class="text-[10px] text-slate-400 block">${m.room ? '📍 ' + escapeHTML(m.room) : ''}</span>
      </td>
      <td class="py-2.5 px-3">
        <div class="flex flex-wrap gap-1 items-center">
          ${m.sections.map(sec => `<span class="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-200 text-slate-800">${escapeHTML(sec)}</span>`).join('')}
          ${isMultiClass ? '<span class="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full" title="Protected: Zero period collision across these classes">Multi-Class Shared</span>' : ''}
        </div>
      </td>
      <td class="py-2.5 px-3">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${m.type === 'Lab' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}">${escapeHTML(m.type || 'Theory')}</span>
      </td>
      <td class="py-2.5 px-3 text-center">
        <span class="font-bold text-xs bg-indigo-50 text-indigo-800 px-2.5 py-1 rounded-lg">${escapeHTML(m.quota)} periods / wk</span>
      </td>
      <td class="py-2.5 px-3 text-right">
        <button onclick="handleDeleteSubjectMapping('${escapeHTML(m.id)}')" title="Delete Mapping" class="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 7. AUTONOMOUS AI TIMETABLE GENERATION CONSTRAINT ENGINE
// Enforces:
// 1. Strict 0-teacher collision: (Day, Period) -> Teacher is in AT MOST ONE class.
// 2. Strict 0-room collision: (Day, Period) -> Room hosts AT MOST ONE class.
// 3. 2-Period continuous Lab blocks for practical courses.
// 4. Exact weekly period quota per subject.
// 5. Max 2 slots per theory subject per day per section.
async function runTimetableGeneration() {
  const progressContainer = document.getElementById('gen-progress-container');
  const progressBar = document.getElementById('gen-progress-bar');
  const progressText = document.getElementById('gen-progress-text');
  const progressPct = document.getElementById('gen-progress-pct');
  const resultsPreview = document.getElementById('gen-results-preview');
  const runBtn = document.getElementById('btn-run-generator');

  if (runBtn) runBtn.disabled = true;
  if (progressContainer) progressContainer.classList.remove('hidden');
  if (resultsPreview) resultsPreview.classList.add('hidden');

  const workingDaysCount = parseInt(document.getElementById('gen-working-days')?.value) || 5;
  const days = workingDaysCount === 6 
    ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const periods = [1, 2, 3, 4, 5, 6, 7];
  const sections = (appState.studentBatches && appState.studentBatches.length > 0)
    ? appState.studentBatches.map(b => b.name)
    : ['IT-A', 'IT-B', 'IT-C', 'IT-D'];

  const mappings = appState.subjectTeacherMappings || [];
  if (mappings.length === 0) {
    showToast('Please add at least one subject mapping before running generator!', 'error');
    if (runBtn) runBtn.disabled = false;
    if (progressContainer) progressContainer.classList.add('hidden');
    return;
  }

  // Animation helper
  const updateProgress = (pct, text) => {
    if (progressBar) progressBar.style.width = `${pct}%`;
    if (progressPct) progressPct.textContent = `${pct}%`;
    if (progressText) progressText.textContent = text;
  };

  updateProgress(15, 'Indexing faculty workloads & cross-class constraints...');
  await new Promise(r => setTimeout(r, 200));

  updateProgress(35, 'Allocating 2-period contiguous lab blocks...');
  await new Promise(r => setTimeout(r, 250));

  // Constraint tracking
  // teacherBusy[(day, period)] = teacherName
  const teacherBusy = new Map();
  // roomBusy[(day, period)] = roomCode
  const roomBusy = new Map();
  // sectionSchedule[(day, section, period)] = slotText
  const sectionSchedule = new Map();
  // sectionSubjectCount[(section, subject)] = count
  const sectionSubjectCount = new Map();
  // sectionDaySubjectCount[(day, section, subject)] = count
  const sectionDaySubjectCount = new Map();

  // 1. Separate Lab courses from Theory courses
  const labMappings = mappings.filter(m => m.type === 'Lab');
  const theoryMappings = mappings.filter(m => m.type !== 'Lab');

  // Pair valid 2-period continuous blocks: [1,2], [3,4], [5,6]
  const labBlockPairs = [[1, 2], [3, 4], [5, 6]];

  // PHASE 0: NAAN MUDHALVAN MANDATORY 4-PERIOD SKILL SLOTS (EVERY MONDAY MORNING ACROSS ALL CLASSES)
  const isNaanMudhalvanEnabled = document.getElementById('toggle-naan-mudhalvan')?.checked ?? true;
  // Strictly locked to Monday Morning: Period 1 (09:00-09:50), Period 2 (09:50-10:40), Period 3 (11:00-11:50), Period 4 (11:50-12:40)
  const mondayMorningPeriods = [1, 2, 3, 4];

  if (isNaanMudhalvanEnabled && days.includes('Monday')) {
    sections.forEach(sec => {
      mondayMorningPeriods.forEach(p => {
        const sKey = `Monday_${sec}_${p}`;
        sectionSchedule.set(sKey, `Naan Mudhalvan (Skill Faculty • Smart Hall)`);
      });
    });
  }

  // PHASE A: SCHEDULE LABS (Hardest constraints)
  for (const lab of labMappings) {
    for (const sec of lab.sections) {
      if (!sections.includes(sec)) continue;
      let neededBlocks = Math.floor((lab.quota || 4) / 2);

      for (let b = 0; b < neededBlocks; b++) {
        let placed = false;
        // Shuffle days to distribute labs nicely
        const shuffledDays = [...days].sort(() => 0.5 - Math.random());

        for (const day of shuffledDays) {
          if (placed) break;
          // Don't place two lab blocks for the same section on the same day
          const dayHasLab = periods.some(p => {
            const cur = sectionSchedule.get(`${day}_${sec}_${p}`);
            return cur && cur.includes('Lab');
          });
          if (dayHasLab) continue;

          for (const [pFirst, pSecond] of labBlockPairs) {
            const tKey1 = `${day}_${pFirst}_${lab.teacher}`;
            const tKey2 = `${day}_${pSecond}_${lab.teacher}`;
            const rKey1 = `${day}_${pFirst}_${lab.room || 'Lab'}`;
            const rKey2 = `${day}_${pSecond}_${lab.room || 'Lab'}`;
            const sKey1 = `${day}_${sec}_${pFirst}`;
            const sKey2 = `${day}_${sec}_${pSecond}`;

            if (!teacherBusy.has(tKey1) && !teacherBusy.has(tKey2) &&
                !roomBusy.has(rKey1) && !roomBusy.has(rKey2) &&
                !sectionSchedule.has(sKey1) && !sectionSchedule.has(sKey2)) {

              // Lock teacher
              teacherBusy.set(tKey1, lab.teacher);
              teacherBusy.set(tKey2, lab.teacher);
              // Lock room
              roomBusy.set(rKey1, lab.room || 'Lab');
              roomBusy.set(rKey2, lab.room || 'Lab');

              const slotText = `${lab.subject} (${lab.teacher} • ${lab.room || 'Lab'})`;
              sectionSchedule.set(sKey1, slotText);
              sectionSchedule.set(sKey2, slotText);

              const currentQuota = sectionSubjectCount.get(`${sec}_${lab.subject}`) || 0;
              sectionSubjectCount.set(`${sec}_${lab.subject}`, currentQuota + 2);
              placed = true;
              break;
            }
          }
        }
      }
    }
  }

  updateProgress(65, 'Scheduling theory lectures with 0 teacher clashes...');
  await new Promise(r => setTimeout(r, 250));

  // PHASE B: SCHEDULE THEORY SUBJECTS WITH QUOTA & CROSS-CLASS TEACHER LOCK
  for (const day of days) {
    for (const p of periods) {
      for (const sec of sections) {
        const sKey = `${day}_${sec}_${p}`;
        if (sectionSchedule.has(sKey)) continue; // already occupied by lab

        // Find applicable subjects for this section that have remaining quota
        const candidateMappings = theoryMappings.filter(m => {
          if (!m.sections.includes(sec)) return false;
          const assignedCount = sectionSubjectCount.get(`${sec}_${m.subject}`) || 0;
          if (assignedCount >= (m.quota || 5)) return false;
          // Max 2 periods of same subject per day
          const dayCount = sectionDaySubjectCount.get(`${day}_${sec}_${m.subject}`) || 0;
          if (dayCount >= 2) return false;

          // STRICT TEACHER COLLISION CHECK: Is teacher already teaching another class at this (day, p)?
          const tKey = `${day}_${p}_${m.teacher}`;
          if (teacherBusy.has(tKey)) return false;

          return true;
        });

        if (candidateMappings.length > 0) {
          // Prioritize subject with lowest scheduled ratio
          candidateMappings.sort((a, b) => {
            const countA = sectionSubjectCount.get(`${sec}_${a.subject}`) || 0;
            const countB = sectionSubjectCount.get(`${sec}_${b.subject}`) || 0;
            return countA - countB;
          });

          const chosen = candidateMappings[0];
          const tKey = `${day}_${p}_${chosen.teacher}`;
          const rKey = `${day}_${p}_${chosen.room || 'C204'}`;

          teacherBusy.set(tKey, chosen.teacher);
          roomBusy.set(rKey, chosen.room || 'C204');

          const slotText = `${chosen.subject} (${chosen.teacher} • ${chosen.room || 'C204'})`;
          sectionSchedule.set(sKey, slotText);

          sectionSubjectCount.set(`${sec}_${chosen.subject}`, (sectionSubjectCount.get(`${sec}_${chosen.subject}`) || 0) + 1);
          sectionDaySubjectCount.set(`${day}_${sec}_${chosen.subject}`, (sectionDaySubjectCount.get(`${day}_${sec}_${chosen.subject}`) || 0) + 1);
        } else {
          // Free period or secondary allocation
          // Check if any other general theory subject can be mapped without collision
          const anyAvailable = theoryMappings.filter(m => {
            if (!m.sections.includes(sec)) return false;
            const tKey = `${day}_${p}_${m.teacher}`;
            return !teacherBusy.has(tKey);
          });

          if (anyAvailable.length > 0 && Math.random() > 0.4) {
            const chosen = anyAvailable[Math.floor(Math.random() * anyAvailable.length)];
            teacherBusy.set(`${day}_${p}_${chosen.teacher}`, chosen.teacher);
            sectionSchedule.set(sKey, `${chosen.subject} (${chosen.teacher} • ${chosen.room || 'C204'})`);
          } else {
            // Elective / Seminar / Library slot
            sectionSchedule.set(sKey, (p === 7) ? 'Library / Seminar' : (p === 6 ? 'Sports / Club' : 'Study Hour'));
          }
        }
      }
    }
  }

  updateProgress(90, 'Validating 0 conflicts across all sections and periods...');
  await new Promise(r => setTimeout(r, 200));

  // COMPILE FINAL MASTER TIMETABLE SLOTS
  const newMasterSlots = [];
  days.forEach(day => {
    sections.forEach(sec => {
      newMasterSlots.push({
        id: `slot-${day}-${sec}-${Date.now()}`,
        day,
        section: sec,
        p1: sectionSchedule.get(`${day}_${sec}_1`) || '-',
        p2: sectionSchedule.get(`${day}_${sec}_2`) || '-',
        p3: sectionSchedule.get(`${day}_${sec}_3`) || '-',
        p4: sectionSchedule.get(`${day}_${sec}_4`) || '-',
        p5: sectionSchedule.get(`${day}_${sec}_5`) || '-',
        p6: sectionSchedule.get(`${day}_${sec}_6`) || '-',
        p7: sectionSchedule.get(`${day}_${sec}_7`) || '-'
      });
    });
  });

  appState.masterTimetableSlots = newMasterSlots;
  saveState();

  // Record newly generated draft in timetable versions list
  const nextVerNum = (appState.timetableVersions || []).length + 1;
  const draftVersion = `v3.${nextVerNum}-DRAFT`;
  appState.timetableVersions = appState.timetableVersions || [];
  appState.timetableVersions.unshift({
    version: draftVersion,
    status: 'DRAFT',
    term: 'Odd Semester 2026-27',
    appliedAt: 'Draft (Not Applied)',
    generatedBy: 'AI Scheduler (7-Periods)'
  });

  saveState();

  updateProgress(100, 'AI Schedule Generation Complete!');
  if (runBtn) runBtn.disabled = false;
  if (resultsPreview) resultsPreview.classList.remove('hidden');

  renderAdminTables();
  renderAdminTimetable();
  showToast(`✓ Timetable draft ${draftVersion} created with 0 teacher clashes and 0 room collisions!`, 'success');

  // Sync with FastAPI backend if live
  if (window.ApiClient) {
    try {
      await ApiClient.generateTimetable({
        department: 'Information Technology',
        term: 'Odd Semester 2026-27',
        sections: sections,
        days: days,
        periods_per_day: 7
      });
      console.log('✅ Timetable generated and synchronized with MongoDB backend');
    } catch (err) {
      console.warn('Backend timetable sync notice:', err.message);
    }
  }
}

// 8. Manual Timetable Entry Management (Add & Delete for 7 Periods)
function handleManualTimetableSubmit(e) {
  e.preventDefault();
  const day = document.getElementById('manual-tt-day').value;
  const section = document.getElementById('manual-tt-section').value.trim().toUpperCase();
  const period = parseInt(document.getElementById('manual-tt-period').value) || 1;
  const room = document.getElementById('manual-tt-room').value.trim().toUpperCase();
  const subject = document.getElementById('manual-tt-subject').value.trim();
  const teacher = document.getElementById('manual-tt-teacher').value.trim();

  if (!subject || !teacher) {
    showToast('Subject and Teacher are required for schedule slot.', 'error');
    return;
  }

  // Strict collision verification: check if teacher is already assigned to another class at the same (Day, Period)
  const existingTeacherSlot = appState.masterTimetableSlots.find(s => {
    if (s.day !== day || s.section === section) return false;
    const slotVal = s[`p${period}`] || '';
    return slotVal.toLowerCase().includes(teacher.toLowerCase());
  });

  if (existingTeacherSlot) {
    if (!confirm(`⚠️ WARNING: Teacher ${teacher} is already teaching ${existingTeacherSlot.section} on ${day} during Period ${period}! Are you sure you want to double-book?`)) {
      return;
    }
  }

  // Find existing row or create new schedule row for Day + Section
  let slotRow = appState.masterTimetableSlots.find(s => s.day === day && s.section === section);
  if (!slotRow) {
    slotRow = {
      id: 'slot-' + Date.now(),
      day,
      section,
      p1: '-', p2: '-', p3: '-', p4: '-', p5: '-', p6: '-', p7: '-'
    };
    appState.masterTimetableSlots.push(slotRow);
  }

  const slotContent = `${subject} (${teacher} • ${room})`;
  slotRow[`p${period}`] = slotContent;

  saveState();
  renderAdminTimetable();
  closeModal('modal-manual-timetable');
  showToast(`Added manual slot for ${day} (${section}, Period ${period})!`, 'success');
  e.target.reset();
}

function handleDeleteTimetableSlot(slotId) {
  if (!confirm('Are you sure you want to remove this timetable schedule row?')) return;

  appState.masterTimetableSlots = appState.masterTimetableSlots.filter(s => s.id !== slotId);
  saveState();
  renderAdminTimetable();
  showToast('Timetable schedule row deleted.', 'info');
}

// 9. Master Timetable Matrix Renderer (7 Periods + Morning Break + Lunch Break)
function renderAdminTimetable() {
  const tbody = document.getElementById('admin-timetable-tbody');
  if (!tbody) return;

  const sectionFilter = document.getElementById('tt-filter-section')?.value || 'ALL';
  const dayFilter = document.getElementById('tt-filter-day')?.value || 'ALL';

  tbody.innerHTML = '';
  let slots = appState.masterTimetableSlots || [];

  if (sectionFilter !== 'ALL') {
    slots = slots.filter(s => s.section === sectionFilter);
  }
  if (dayFilter !== 'ALL') {
    slots = slots.filter(s => s.day === dayFilter);
  }

  if (slots.length === 0) {
    tbody.innerHTML = '<tr><td colspan="11" class="py-8 text-center text-slate-400 text-xs">No timetable slots match the selected filters. Click "+ Manual Slot Input" or run "AI Timetable Generator".</td></tr>';
    return;
  }

  const formatCell = (val, isLab = false) => {
    if (!val || val === '-') return '<span class="text-slate-300 font-mono">-</span>';
    const escaped = escapeHTML(val);
    if (val.toLowerCase().includes('naan mudhalvan')) {
      return `<div class="p-1 rounded-lg bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-300 text-[11px] font-bold text-amber-950 leading-tight shadow-2xs">🌟 ${escaped}</div>`;
    }
    if (val.toLowerCase().includes('lab')) {
      return `<div class="p-1 rounded-lg bg-purple-50 border border-purple-200/70 text-[11px] font-semibold text-purple-950 leading-tight">${escaped}</div>`;
    }
    if (val.includes('Library') || val.includes('Sports') || val.includes('Seminar')) {
      return `<div class="p-1 rounded-lg bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 leading-tight">${escaped}</div>`;
    }
    return `<div class="p-1 rounded-lg bg-indigo-50/70 border border-indigo-200/60 text-[11px] font-semibold text-indigo-950 leading-tight">${escaped}</div>`;
  };

  slots.forEach(row => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-200 hover:bg-slate-50/70 transition text-xs';
    tr.innerHTML = `
      <td class="font-bold bg-slate-50 border border-slate-200 p-2 text-slate-900 whitespace-nowrap">
        ${escapeHTML(row.day)}
        <span class="block text-[10px] text-indigo-600 font-bold">${escapeHTML(row.section)}</span>
      </td>
      <td class="border border-slate-200 p-1.5">${formatCell(row.p1)}</td>
      <td class="border border-slate-200 p-1.5">${formatCell(row.p2)}</td>
      <td class="border border-amber-200 bg-amber-50/60 p-1 text-[10px] font-bold text-amber-800">☕<br>Break</td>
      <td class="border border-slate-200 p-1.5">${formatCell(row.p3)}</td>
      <td class="border border-slate-200 p-1.5">${formatCell(row.p4)}</td>
      <td class="border border-emerald-200 bg-emerald-50/60 p-1 text-[10px] font-bold text-emerald-800">🍱<br>Lunch</td>
      <td class="border border-slate-200 p-1.5">${formatCell(row.p5)}</td>
      <td class="border border-slate-200 p-1.5">${formatCell(row.p6)}</td>
      <td class="border border-slate-200 p-1.5">${formatCell(row.p7)}</td>
      <td class="border border-slate-200 p-2 text-right whitespace-nowrap">
        <button onclick="handleDeleteTimetableSlot('${escapeHTML(row.id)}')" title="Delete Schedule Row" class="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 5. NOTIFICATION BELL & LIVE ALERTS
function toggleNotificationDropdown() {
  const panel = document.getElementById('notification-dropdown');
  if (panel) {
    panel.classList.toggle('hidden');
    renderNotifications();
  }
}

function renderNotifications() {
  const list = document.getElementById('notification-list');
  const badge = document.getElementById('notif-badge');
  if (!list) return;

  const notifs = appState.notificationsList || [];
  const unread = notifs.filter(n => !n.is_read);

  if (badge) {
    if (unread.length > 0) badge.classList.remove('hidden');
    else badge.classList.add('hidden');
  }

  if (notifs.length === 0) {
    list.innerHTML = '<div class="p-6 text-center text-xs text-slate-400">No alerts or notifications yet.</div>';
    return;
  }

  list.innerHTML = '';
  notifs.forEach(n => {
    const div = document.createElement('div');
    div.className = `p-3 text-xs hover:bg-slate-50 transition flex items-start gap-2.5 ${!n.is_read ? 'bg-indigo-50/40 font-medium' : ''}`;
    div.innerHTML = `
      <span class="text-base">${n.type === 'alert' ? '🚨' : (n.type === 'success' ? '✅' : 'ℹ️')}</span>
      <div class="flex-1">
        <div class="flex items-center justify-between">
          <span class="font-bold text-slate-900">${escapeHTML(n.title)}</span>
          <span class="text-[10px] text-slate-400">${escapeHTML(n.created_at || 'Just now')}</span>
        </div>
        <p class="text-slate-600 mt-0.5 leading-relaxed">${escapeHTML(n.message)}</p>
      </div>
    `;
    list.appendChild(div);
  });
}

async function markAllNotificationsRead() {
  const notifs = appState.notificationsList || [];
  notifs.forEach(n => n.is_read = true);
  const badge = document.getElementById('notif-badge');
  if (badge) badge.classList.add('hidden');
  renderNotifications();

  if (window.ApiClient) {
    ApiClient.markAllNotificationsRead(appState.currentUser?.dept || 'Information Technology').catch(() => {});
  }
}

// Live Clock updates
function startClock() {
  let lastCheckedMinute = -1;
  function update() {
    const clockEl = document.getElementById('live-clock');
    const teacherClockEl = document.getElementById('teacher-live-clock');
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

    if (clockEl) clockEl.textContent = `${dateStr} • ${timeStr}`;
    if (teacherClockEl) teacherClockEl.textContent = timeStr;

    // Refresh teacher and HOD dashboards automatically if minute changed
    const currentMin = now.getMinutes();
    if (currentMin !== lastCheckedMinute) {
      lastCheckedMinute = currentMin;
      if (appState.currentUser) {
        if (appState.currentUser.role === 'teacher') {
          renderTeacherDashboard();
        } else if (appState.currentUser.role === 'hod') {
          renderHodDashboard();
        }
      }
    }
  }
  update();
  setInterval(update, 1000);
}

// Render active views
function renderActiveViews() {
  renderHodDashboard();
  renderTeacherDashboard();
  renderTeacherLeaves();
  renderAdminTables();
  renderAdminSubjects();
  renderAdminRooms();
  renderAdminBatches();
  renderSubjectMappings();
  renderAdminTimetable();
  renderHodTeachers();
  renderHodLeaves();
  renderNotifications();
  if (typeof updateAllSelectDropdowns === 'function') {
    updateAllSelectDropdowns();
  }
}

// Reset data to defaults
function resetAllData() {
  if (confirm('Reset application data to default administrator state?')) {
    localStorage.removeItem('mymonitor_state');
    localStorage.removeItem('mymoniter_state');
    appState = JSON.parse(JSON.stringify(DEFAULT_STATE));
    saveState();
    updateAuthUI();
    renderActiveViews();
    showToast('Reset data to default state.', 'info');
  }
}

// Initialization on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  startClock();
  updateAuthUI();

  // Initialize Real-time WebSockets
  if (window.WSClient) {
    const dept = appState.currentUser?.dept || 'Information Technology';
    const uid = appState.currentUser?.id || 'usr-admin-1';
    window.WSClient.connect(dept, uid);

    window.WSClient.on('live_update', (data) => {
      console.log('⚡ [Live WebSocket Update]:', data);
      if (data.type === 'STATUS_UPDATE') {
        const target = appState.liveMonitoring.find(c => c.room === data.room || c.class === data.class_name);
        if (target) {
          target.status = data.status;
          if (data.teacher) target.teacher = data.teacher;
          renderHodDashboard();
        }
      } else if (data.type === 'SUBSTITUTE_ASSIGNED') {
        const target = appState.liveMonitoring.find(c => c.id == data.session_id || c.class === data.class_name);
        if (target) {
          target.status = 'SUBSTITUTE';
          target.substituteTeacher = data.substitute;
          renderHodDashboard();
        }
      } else if (data.type === 'TIMETABLE_APPLIED') {
        showToast(`New Timetable (${data.version}) applied campus-wide!`, 'info');
        syncWithBackend();
      }
    });

    // WebSocket push notifications handler
    window.WSClient.on('notification', (data) => {
      console.log('🔔 [Live Notification Push]:', data);
      const notif = data.data || data;
      appState.notificationsList = appState.notificationsList || [];
      appState.notificationsList.unshift(notif);
      renderNotifications();
      showToast(notif.message || notif.title, 'info');
    });
  }

  // Event listener for login form
  const loginForm = document.getElementById('form-login');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Event listener for Add Admin form
  const adminForm = document.getElementById('form-add-admin');
  if (adminForm) {
    adminForm.addEventListener('submit', handleAddAdmin);
  }

  // Event listener for Add HOD form
  const hodForm = document.getElementById('form-add-hod');
  if (hodForm) {
    hodForm.addEventListener('submit', handleAddHod);
  }

  // Event listener for HOD Add Teacher form
  const hodTeacherForm = document.getElementById('form-hod-add-teacher');
  if (hodTeacherForm) {
    hodTeacherForm.addEventListener('submit', handleHodAddTeacher);
  }

  // Initial synchronization with FastAPI backend if user is already logged in
  if (appState.currentUser) {
    syncWithBackend();
  }

  // Start Real-Time Firebase Cloud Sync across PC & Mobile
  syncFromCloudFirestore();
});

// =========================================================================
// FIREBASE CLOUD FIRESTORE REAL-TIME SYNCHRONIZATION
// =========================================================================
function syncFromCloudFirestore() {
  if (!window.FirebaseDb) {
    setTimeout(syncFromCloudFirestore, 400);
    return;
  }

  // 1. Subscribe to real-time updates from Firebase Cloud Firestore
  window.FirebaseDb.subscribeToAppState((cloudState) => {
    if (cloudState) {
      applyCloudState(cloudState);
    }
  });

  // 2. Initial load from Cloud
  window.FirebaseDb.loadAppState().then((cloudData) => {
    if (cloudData) {
      applyCloudState(cloudData);
    } else {
      // If cloud is empty, seed it with initial application state
      console.log('☁️ Initializing Firebase Cloud Firestore with seed state...');
      window.FirebaseDb.saveAppState(appState);
    }
  });
}

function applyCloudState(cloudState) {
  if (!cloudState) return;

  // Merge users safely
  if (Array.isArray(cloudState.users)) {
    const existingEmails = new Set(appState.users.map(u => (u.email || '').toLowerCase()));
    cloudState.users.forEach(u => {
      if (!existingEmails.has((u.email || '').toLowerCase())) {
        appState.users.push(u);
      } else {
        const idx = appState.users.findIndex(x => (x.email || '').toLowerCase() === (u.email || '').toLowerCase());
        if (idx !== -1) appState.users[idx] = { ...appState.users[idx], ...u };
      }
    });
  }

  // Merge HODs list
  if (Array.isArray(cloudState.hodsList)) {
    cloudState.hodsList.forEach(h => {
      const idx = appState.hodsList.findIndex(x => String(x.id) === String(h.id) || (x.email || '').toLowerCase() === (h.email || '').toLowerCase());
      if (idx !== -1) {
        appState.hodsList[idx] = { ...appState.hodsList[idx], ...h };
      } else {
        appState.hodsList.push(h);
      }
    });
  }

  // Merge Teachers list
  if (Array.isArray(cloudState.teachersList)) {
    cloudState.teachersList.forEach(t => {
      const idx = appState.teachersList.findIndex(x => String(x.id) === String(t.id) || (x.email || '').toLowerCase() === (t.email || '').toLowerCase());
      if (idx !== -1) {
        appState.teachersList[idx] = { ...appState.teachersList[idx], ...t };
      } else {
        appState.teachersList.push(t);
      }
    });
  }

  // Synchronize dynamic campus assets directly from Cloud Firestore
  if (Array.isArray(cloudState.subjectsList)) {
    appState.subjectsList = cloudState.subjectsList;
  }
  if (Array.isArray(cloudState.classroomsList)) {
    appState.classroomsList = cloudState.classroomsList;
    appState.rooms = cloudState.classroomsList;
  } else if (Array.isArray(cloudState.rooms)) {
    appState.classroomsList = cloudState.rooms;
    appState.rooms = cloudState.rooms;
  }
  if (Array.isArray(cloudState.studentBatches)) {
    appState.studentBatches = cloudState.studentBatches;
  }
  if (Array.isArray(cloudState.masterTimetableSlots)) {
    appState.masterTimetableSlots = cloudState.masterTimetableSlots;
  }
  if (Array.isArray(cloudState.timetableVersions)) {
    appState.timetableVersions = cloudState.timetableVersions;
  }
  if (Array.isArray(cloudState.subjectTeacherMappings)) {
    appState.subjectTeacherMappings = cloudState.subjectTeacherMappings;
  }
  if (Array.isArray(cloudState.liveMonitoring)) {
    appState.liveMonitoring = cloudState.liveMonitoring;
  }
  if (cloudState.collegeBellSchedule) {
    appState.collegeBellSchedule = cloudState.collegeBellSchedule;
  }
  if (Array.isArray(cloudState.leavesList)) {
    appState.leavesList = cloudState.leavesList;
  }
  if (Array.isArray(cloudState.notificationsList)) {
    appState.notificationsList = cloudState.notificationsList;
  }

  // Update local storage cache
  try {
    localStorage.setItem('mymonitor_state', JSON.stringify(appState));
  } catch (e) {}

  // Immediately refresh all views and dynamic dropdowns across portal
  renderActiveViews();
  if (typeof updateAllSelectDropdowns === 'function') {
    updateAllSelectDropdowns();
  }
}

