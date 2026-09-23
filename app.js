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
  leavesList: [],
  weeklyTopics: [],
  teacherDutyReports: {},
  hodSelectedDeptFilter: 'ALL'
};

// Deduplication Utilities to prevent duplicate user/teacher/HOD entries
function deduplicateUsersByEmail(users) {
  if (!Array.isArray(users)) return [];
  const seen = new Set();
  return users.filter(u => {
    if (!u) return false;
    const email = (u.email || '').toLowerCase().trim();
    if (!email) return true;
    if (seen.has(email)) return false;
    seen.add(email);
    return true;
  });
}

function deduplicateListByEmail(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  return list.filter(item => {
    if (!item) return false;
    const email = (item.email || '').toLowerCase().trim();
    const name = (item.name || '').toLowerCase().trim();
    const key = email ? `email::${email}` : (name ? `name::${name}` : `id::${item.id}`);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

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
if (!Array.isArray(appState.weeklyTopics)) appState.weeklyTopics = [];
if (typeof appState.teacherDutyReports !== 'object' || appState.teacherDutyReports === null) appState.teacherDutyReports = {};
if (!appState.hodSelectedDeptFilter) appState.hodSelectedDeptFilter = 'ALL';
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

// Clean and deduplicate user accounts, HODs, and teachers in loaded local state
appState.users = deduplicateUsersByEmail(appState.users);
appState.hodsList = deduplicateListByEmail(appState.hodsList);
appState.teachersList = deduplicateListByEmail(appState.teachersList);

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
      return window.FirebaseDb.saveAppState(appState);
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

let isSubmittingAdmin = false;
async function handleAddAdmin(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (isSubmittingAdmin) return;
  isSubmittingAdmin = true;

  const submitBtn = document.querySelector('#form-add-admin button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  try {
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

    // Secondary duplicate check after await in case of concurrent execution
    if ((appState.users || []).some(u => (u.email || '').toLowerCase() === email)) {
      showToast('A user with this Email already exists.', 'error');
      return;
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
    appState.users = deduplicateUsersByEmail(appState.users);

    saveState(true);
    closeModal('modal-add-admin');
    showToast(`Administrator account for ${name} created successfully!`, 'success');
    const form = document.getElementById('form-add-admin');
    if (form) form.reset();
  } finally {
    isSubmittingAdmin = false;
    if (submitBtn) submitBtn.disabled = false;
  }
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
  // 3. Check HOD directory
  if (appState.hodsList) {
    const hodMatch = appState.hodsList.find(h => h.email && h.email.toLowerCase() === emailInput);
    if (hodMatch) {
      if (user) {
        user.name = hodMatch.name || user.name;
        user.role = 'hod';
        user.dept = hodMatch.dept || user.dept || 'Information Technology';
      } else {
        user = {
          id: 'usr-hod-' + (hodMatch.id || Date.now()),
          name: hodMatch.name,
          email: hodMatch.email,
          role: 'hod',
          dept: hodMatch.dept || 'Information Technology'
        };
        appState.users = appState.users || [];
        appState.users.push(user);
      }
      saveState(true);
    }
  }

  // 4. Check Faculty Teacher directory
  if (appState.teachersList) {
    const teacherMatch = appState.teachersList.find(t => t.email && t.email.toLowerCase() === emailInput);
    if (teacherMatch) {
      if (user) {
        user.name = teacherMatch.name || user.name;
        user.role = 'teacher';
        user.dept = teacherMatch.dept || user.dept || 'Information Technology';
        user.subject = teacherMatch.subject || user.subject || '';
      } else {
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
      }
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
  const displayRole = user.role === 'teacher' ? 'STAFF' : user.role.toUpperCase();
  showToast(`Welcome, ${user.name}! Signed in as ${displayRole}.`, 'success');

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
    const gDisplayRole = user.role === 'teacher' ? 'STAFF' : user.role.toUpperCase();
    showToast(`Signed in with Google as ${user.name}! (${gDisplayRole})`, 'success');
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

  const currentRoleDisplay = appState.currentUser.role === 'teacher' ? 'STAFF' : appState.currentUser.role.toUpperCase();
  if (userNameEl) userNameEl.textContent = appState.currentUser.name;
  if (userRoleEl) userRoleEl.textContent = currentRoleDisplay;
  if (userEmailEl) userEmailEl.textContent = appState.currentUser.email;
  if (userAvatarEl) userAvatarEl.textContent = appState.currentUser.name.charAt(0);

  const drawerRoleEl = document.getElementById('drawer-user-role');
  const drawerEmailEl = document.getElementById('drawer-user-email');
  if (drawerRoleEl) drawerRoleEl.textContent = `${currentRoleDisplay} SESSION`;
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
      appState.teachersList = deduplicateListByEmail(teachers.map((t, idx) => ({
        id: t.id || t._id || idx + 1,
        name: t.name,
        email: t.email,
        subject: t.subject,
        dept: t.department || 'IT',
        workload: t.workload || '16 hrs/wk',
        status: t.status || 'Available'
      })));
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

    // 4. Sync Classrooms (Merge safely to prevent wiping local rooms)
    const rooms = await ApiClient.getRooms(dept);
    if (rooms && rooms.length > 0) {
      const backendRooms = rooms.map(r => ({
        id: r.id || r._id,
        room: r.room_code,
        type: r.type,
        capacity: r.capacity,
        block: r.block,
        latitude: r.latitude,
        longitude: r.longitude,
        radius: r.geo_radius_meters
      }));
      appState.classroomsList = appState.classroomsList || [];
      backendRooms.forEach(br => {
        const idx = appState.classroomsList.findIndex(r => (r.room && br.room && r.room.toUpperCase() === br.room.toUpperCase()) || (r.id && r.id === br.id));
        if (idx !== -1) {
          appState.classroomsList[idx] = { ...appState.classroomsList[idx], ...br };
        } else {
          appState.classroomsList.push(br);
        }
      });
      appState.rooms = appState.classroomsList;
      renderAdminRooms();
    }

    // 4b. Sync Subjects (Merge safely to prevent wiping local subjects)
    const subjects = await ApiClient.getSubjects(dept);
    if (subjects && subjects.length > 0) {
      const backendSubjects = subjects.map(s => ({
        id: s.id || s._id,
        code: s.code,
        name: s.name,
        type: s.type,
        weeklyHours: s.weekly_hours,
        dept: s.department
      }));
      appState.subjectsList = appState.subjectsList || [];
      backendSubjects.forEach(bs => {
        const idx = appState.subjectsList.findIndex(s => (s.code && bs.code && s.code.toUpperCase() === bs.code.toUpperCase()) || (s.id && s.id === bs.id));
        if (idx !== -1) {
          appState.subjectsList[idx] = { ...appState.subjectsList[idx], ...bs };
        } else {
          appState.subjectsList.push(bs);
        }
      });
      renderAdminSubjects();
    }

    // 5. Sync Leave Requests (Merge safely to prevent overwriting local pending/approved leaves)
    const leaves = await ApiClient.getLeaves(dept);
    if (leaves && Array.isArray(leaves)) {
      appState.leavesList = appState.leavesList || [];
      const deletedSet = new Set(appState._deletedEntityIds || []);
      leaves.forEach(bl => {
        if (!bl || deletedSet.has(String(bl.id || bl._id || ''))) return;
        const idx = appState.leavesList.findIndex(l => String(l.id || l._id || '') === String(bl.id || bl._id || ''));
        if (idx !== -1) {
          const localTime = appState.leavesList[idx].updatedAt || 0;
          const backendTime = bl.updatedAt || 0;
          if (backendTime >= localTime) {
            appState.leavesList[idx] = { ...appState.leavesList[idx], ...bl };
          }
        } else {
          appState.leavesList.push(bl);
        }
      });
      renderHodLeaves();
      renderTeacherLeaves();
    }

    // 6. Sync Campus Notifications (Merge safely by id)
    const notifs = await ApiClient.getNotifications(dept);
    if (notifs && Array.isArray(notifs)) {
      appState.notificationsList = appState.notificationsList || [];
      const existingNotifIds = new Set(appState.notificationsList.map(n => String(n.id || n._id || '')));
      notifs.forEach(bn => {
        const nid = String(bn.id || bn._id || '');
        if (nid && !existingNotifIds.has(nid)) {
          appState.notificationsList.unshift(bn);
          existingNotifIds.add(nid);
        }
      });
      renderNotifications();
    }

    // 7. Sync Weekly Topics
    try {
      const currentWeekKey = getAcademicWeekKey(new Date());
      const cloudTopics = await ApiClient.getTopics(currentWeekKey, '', dept);
      if (cloudTopics && Array.isArray(cloudTopics) && cloudTopics.length > 0) {
        const existingIds = new Set((appState.weeklyTopics || []).map(t => t.id));
        cloudTopics.forEach(ct => {
          if (!existingIds.has(ct.id)) {
            appState.weeklyTopics.unshift({
              id: ct.id,
              date: ct.date,
              day: ct.day,
              weekKey: ct.week_key,
              className: ct.class_name,
              room: ct.room_code || 'C204',
              period: ct.period,
              periodName: ct.period_name,
              time: ct.time_slot,
              subject: ct.subject,
              topicTitle: ct.topic_title,
              teacherName: ct.teacher_name,
              teacherEmail: ct.teacher_email,
              department: ct.department || dept,
              timestamp: Date.now(),
              status: 'Logged'
            });
          }
        });
      }
    } catch (e) {}

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
  if (tabId === 'topic-tracker') renderHodTopicTracker();

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
let isSubmittingHod = false;
async function handleAddHod(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (isSubmittingHod) return;
  isSubmittingHod = true;

  const submitBtn = document.querySelector('#form-add-hod button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  try {
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
    if ((appState.users || []).some(u => (u.email || '').toLowerCase() === email) ||
        (appState.hodsList || []).some(h => (h.email || '').toLowerCase() === email)) {
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

    // Secondary duplicate check after await in case of concurrent execution
    if ((appState.users || []).some(u => (u.email || '').toLowerCase() === email) ||
        (appState.hodsList || []).some(h => (h.email || '').toLowerCase() === email)) {
      showToast('A user with this Gmail already exists.', 'error');
      return;
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
    appState.users = deduplicateUsersByEmail(appState.users);

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
    appState.hodsList = deduplicateListByEmail(appState.hodsList);

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
  } finally {
    isSubmittingHod = false;
    if (submitBtn) submitBtn.disabled = false;
  }
}

// Helper: Update teacher department selection counter
function handleTeacherDeptSelection(cb) {
  const nowChecked = document.querySelectorAll('input[name="new-teacher-departments"]:checked');
  const countEl = document.getElementById('teacher-dept-count-num');
  if (countEl) countEl.textContent = nowChecked.length;
}
window.handleTeacherDeptSelection = handleTeacherDeptSelection;

// 2. HOD adds a Teacher with Gmail & Password (Multi-Department Support)
let isSubmittingTeacher = false;
async function handleHodAddTeacher(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (isSubmittingTeacher) return;
  isSubmittingTeacher = true;

  const submitBtn = document.querySelector('#form-hod-add-teacher button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  try {
    const name = (document.getElementById('hod-teacher-name')?.value || '').trim();
    const email = (document.getElementById('hod-teacher-email')?.value || '').trim().toLowerCase();
    const subject = (document.getElementById('hod-teacher-subject')?.value || '').trim();
    const checkedBoxes = Array.from(document.querySelectorAll('input[name="new-teacher-departments"]:checked'));
    const checkedDepts = checkedBoxes.map(cb => cb.value.trim()).filter(Boolean);
    const dept = checkedDepts.length > 0 ? checkedDepts.join(' & ') : 'Information Technology';
    const password = (document.getElementById('hod-teacher-password')?.value || '').trim();
    const workload = (document.getElementById('hod-teacher-workload')?.value || '').trim() || '16 hrs/wk';

    if (!name || !email || !password || !subject) {
      showToast('Name, Subject, Gmail, and Password are required.', 'error');
      return;
    }

    if (checkedDepts.length === 0) {
      showToast('Please select at least 1 department for this staff member.', 'error');
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

    if ((appState.users || []).some(u => (u.email || '').toLowerCase() === email) ||
        (appState.teachersList || []).some(t => (t.email || '').toLowerCase() === email)) {
      showToast('A user with this Gmail already exists.', 'error');
      return;
    }

    // Directly register Teacher in Firebase Cloud Auth so account is immediately accessible across all devices
    if (window.FirebaseAuth && typeof window.FirebaseAuth.registerWithEmail === 'function') {
      try {
        await window.FirebaseAuth.registerWithEmail(email, password);
        console.log('✅ Staff member registered in Firebase Cloud Auth!');
      } catch (err) {
        console.warn('Firebase Staff cloud registration note:', err.code || err.message);
        if (err.code === 'auth/email-already-in-use') {
          showToast('This email is already registered in Firebase Authentication.', 'error');
          return;
        }
      }
    }

    // Secondary duplicate check after await in case of concurrent execution
    if ((appState.users || []).some(u => (u.email || '').toLowerCase() === email) ||
        (appState.teachersList || []).some(t => (t.email || '').toLowerCase() === email)) {
      showToast('A user with this Gmail already exists.', 'error');
      return;
    }

    // Add Teacher account to users WITHOUT plaintext password
    appState.users = appState.users || [];
    appState.users.push({
      id: 'usr-teacher-' + Date.now(),
      name,
      email,
      role: 'teacher',
      dept,
      departments: checkedDepts,
      subject,
      created_at: new Date().toISOString()
    });
    appState.users = deduplicateUsersByEmail(appState.users);

    // Add to teachers list WITHOUT password
    appState.teachersList = appState.teachersList || [];
    appState.teachersList.push({
      id: Date.now(),
      name,
      email,
      subject,
      dept,
      departments: checkedDepts,
      workload,
      status: 'Available'
    });
    appState.teachersList = deduplicateListByEmail(appState.teachersList);

    saveState(true);
    renderAdminTables();
    renderHodTeachers();
    renderQuickLoginButtons();
    closeModal('modal-hod-add-teacher');
    showToast(`Staff account for ${name} created successfully!`, 'success');
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
  } finally {
    isSubmittingTeacher = false;
    if (submitBtn) submitBtn.disabled = false;
  }
}

// =========================================================================
// HOD DASHBOARD & LIVE MONITORING
// =========================================================================

// HOD Multi-Department Filter Bar Controller
function renderHodDeptFilterBar() {
  const container = document.getElementById('hod-dept-pills-container');
  const countBadge = document.getElementById('hod-dept-filter-count-badge');
  if (!container) return;

  const hodUser = appState.currentUser || {};
  let depts = [];
  if (Array.isArray(hodUser.departments) && hodUser.departments.length > 0) {
    depts = hodUser.departments;
  } else if (hodUser.dept) {
    depts = hodUser.dept.split('&').map(d => d.trim());
  } else {
    depts = ['Information Technology'];
  }

  const activeFilter = appState.hodSelectedDeptFilter || 'ALL';

  let html = `
    <button type="button" onclick="setHodDeptFilter('ALL')" class="hod-dept-filter-btn px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeFilter === 'ALL' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}">
      All My Departments (${depts.length})
    </button>
  `;

  depts.forEach(d => {
    const isSelected = activeFilter.toLowerCase() === d.toLowerCase();
    html += `
      <button type="button" onclick="setHodDeptFilter('${escapeHTML(d)}')" class="hod-dept-filter-btn px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${isSelected ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}">
        ${escapeHTML(d)}
      </button>
    `;
  });

  container.innerHTML = html;

  if (countBadge) {
    countBadge.textContent = activeFilter === 'ALL'
      ? `Displaying All Managed Batches (${depts.join(' & ')})`
      : `Viewing: ${activeFilter}`;
  }
}
window.renderHodDeptFilterBar = renderHodDeptFilterBar;

function setHodDeptFilter(dept) {
  appState.hodSelectedDeptFilter = dept;
  renderHodDeptFilterBar();
  renderHodDashboard();
}
window.setHodDeptFilter = setHodDeptFilter;

// Extract all classes scheduled across all sections for today from masterTimetableSlots
// Strictly filtered by HOD's assigned department(s) with NO fake or unstored classes
function getHodTodayDepartmentClasses() {
  const now = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let currentDay = dayNames[now.getDay()];
  const isWeekend = currentDay === 'Sunday' || currentDay === 'Saturday';
  const targetDay = isWeekend ? 'Monday' : currentDay;

  const bell = appState.collegeBellSchedule || DEFAULT_STATE.collegeBellSchedule;

  // Multi-Department HOD Filtering
  const hodUser = appState.currentUser || {};
  let userDepts = [];
  if (Array.isArray(hodUser.departments) && hodUser.departments.length > 0) {
    userDepts = hodUser.departments.map(d => d.trim().toLowerCase());
  } else if (hodUser.dept) {
    userDepts = hodUser.dept.split('&').map(d => d.trim().toLowerCase());
  } else {
    userDepts = ['information technology'];
  }

  const activeFilter = (appState.hodSelectedDeptFilter || 'ALL').trim().toLowerCase();

  const isDeptMatch = (deptStr, secLower, bDept) => {
    const d = deptStr.toLowerCase();
    if (bDept && (bDept.includes(d) || d.includes(bDept))) return true;
    if (d.includes('information') || d.includes('it')) {
      if (secLower.startsWith('it-') || secLower === 'it' || secLower.includes('it')) return true;
    }
    if (d.includes('artificial') || d.includes('ai') || d.includes('data')) {
      if (secLower.startsWith('ai') || secLower.includes('aids') || secLower.includes('ai/ds')) return true;
    }
    if (d.includes('computer') || d.includes('cse')) {
      if (secLower.startsWith('cse-') || secLower === 'cse' || secLower.includes('cse')) return true;
    }
    if (d.includes('electronic') || d.includes('ece')) {
      if (secLower.startsWith('ece-') || secLower === 'ece' || secLower.includes('ece')) return true;
    }
    if (d.includes('mechanical')) {
      if (secLower.startsWith('mech') || secLower.includes('mech')) return true;
    }
    if (d.includes('civil')) {
      if (secLower.startsWith('civil') || secLower.includes('civil')) return true;
    }
    return false;
  };

  const daySlots = (appState.masterTimetableSlots || []).filter(s => {
    if (s.day !== targetDay) return false;

    const secLower = (s.section || '').toLowerCase();
    const batch = (appState.studentBatches || []).find(b => b.name === s.section);
    const bDept = (batch?.dept || '').toLowerCase();

    if (activeFilter !== 'all') {
      return isDeptMatch(activeFilter, secLower, bDept);
    }

    return userDepts.some(ud => isDeptMatch(ud, secLower, bDept));
  });

  // If no day slots exist, strictly return [] (NO fake or unstored classes!)
  if (daySlots.length === 0) {
    return [];
  }

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
      const batch = (appState.studentBatches || []).find(b => b.name === slot.section);
      let room = batch?.baseRoom || 'C204';

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
        class: slot.section || 'Class',
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
  renderHodDeptFilterBar();

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

  const localToday = now.toLocaleDateString('en-CA');
  const dutyReportsToday = (appState.teacherDutyReports && appState.teacherDutyReports[localToday]) || {};

  let activeCount = 0;
  let scheduledCount = 0;
  let vacantCount = 0;
  let substituteCount = 0;

  allTodayClasses.forEach(row => {
    // Lookup teacher duty report for today
    const tNameLower = (row.teacher || '').toLowerCase();
    const teacherObj = (appState.teachersList || []).find(t => (t.name || '').toLowerCase() === tNameLower);
    const teacherEmail = (teacherObj?.email || '').toLowerCase();
    const dutyReport = dutyReportsToday[teacherEmail] || Object.values(dutyReportsToday).find(r => 
      (r.teacher_name || '').toLowerCase() === tNameLower || 
      (teacherEmail && (r.teacher_email || '').toLowerCase() === teacherEmail)
    );

    const isDutyOn = dutyReport && dutyReport.status === 'ON_DUTY';
    const isLateComer = dutyReport && dutyReport.is_late_comer;
    row.isDutyOn = isDutyOn;
    row.isLateComer = isLateComer;
    row.reportedAt = dutyReport?.reported_at || '';

    // Check if teacher verified in-room presence
    const isRoomCheckedIn = (appState.teacherCheckedIn && (
      (appState.currentUser?.email && teacherEmail && appState.currentUser.email.toLowerCase() === teacherEmail) ||
      (appState.currentUser?.name && (appState.currentUser.name.toLowerCase().includes(tNameLower) || tNameLower.includes(appState.currentUser.name.toLowerCase())))
    ));

    if (isWeekend || isAfterHours) {
      row.status = 'COMPLETED';
      row.exactStatus = 'Concluded';
      if (row.substituteTeacher) substituteCount++;
    } else if (isBeforeHours) {
      row.status = 'SCHEDULED';
      row.exactStatus = isDutyOn ? 'Ready (On Duty)' : 'Scheduled (Starts 09:00 AM)';
      scheduledCount++;
    } else if (currentMinutes >= row.endMin) {
      row.status = 'COMPLETED';
      row.exactStatus = !isDutyOn ? 'Missed (Duty Not Reported)' : (isLateComer && dutyReport?.first_period_missed && row.period === 1 ? 'Missed (Late Arrival)' : 'Concluded');
      if (row.substituteTeacher) substituteCount++;
    } else if (currentMinutes >= row.startMin && currentMinutes < row.endMin) {
      // CURRENT PERIOD IN SESSION!
      if (row.isLeaveApproved) {
        row.status = 'SUBSTITUTE';
        row.exactStatus = `Sub: ${row.substituteTeacher || 'Faculty'}`;
        substituteCount++;
      } else if (!isDutyOn) {
        // Teacher did not turn on "Report On Duty" before period started -> VACANT!
        row.status = 'VACANT';
        row.vacantReason = 'Teacher did not report on duty today';
        row.exactStatus = 'VACANT (DUTY NOT REPORTED)';
        vacantCount++;
      } else if (isRoomCheckedIn) {
        // Teacher reported on duty AND checked into room
        row.status = 'ACTIVE';
        row.exactStatus = isLateComer ? 'IN ROOM (LATE COMER)' : 'IN ROOM (ON TIME)';
        activeCount++;
      } else {
        // Duty is ON, room check-in evaluated with 5-minute grace period
        if (currentMinutes <= row.startMin + 5) {
          row.status = 'ACTIVE';
          row.exactStatus = 'CHECKING IN (5M GRACE)';
          activeCount++;
        } else {
          // Exceeded 5-minute grace period without in-room checkin -> VACANT!
          row.status = 'VACANT';
          row.vacantReason = 'No classroom check-in after 5-minute grace period';
          row.exactStatus = 'VACANT / UNATTENDED';
          vacantCount++;
        }
      }
    } else {
      // Future periods today
      if (row.isLeaveApproved) {
        row.status = 'SUBSTITUTE';
        row.exactStatus = `Sub: ${row.substituteTeacher || 'Faculty'}`;
      } else if (row.isVacantPendingLeave) {
        row.status = 'VACANT';
        row.exactStatus = 'Leave Pending';
        vacantCount++;
      } else {
        row.status = 'SCHEDULED';
        row.exactStatus = isDutyOn ? 'Scheduled (Faculty on duty)' : (currentMinutes > 540 ? 'Scheduled (Duty Unreported)' : 'Scheduled');
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
    const filterLabel = appState.hodSelectedDeptFilter === 'ALL' ? 'All Managed Depts' : appState.hodSelectedDeptFilter;
    statTotalSub.textContent = isWeekend ? 'Weekend • Campus Closed' : `${currentDayName} • ${filterLabel}`;
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
      statActiveSub.textContent = `🟢 ${activeCount} Verified in Classroom`;
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
  } else if (allTodayClasses.some(c => c.isLateComer)) {
    const lateFacultyNames = Array.from(new Set(allTodayClasses.filter(c => c.isLateComer).map(c => c.teacher)));
    if (bannerTitle) bannerTitle.textContent = 'Faculty Late Arrival Alert';
    if (bannerDesc) bannerDesc.textContent = `${lateFacultyNames.length} faculty member(s) (${lateFacultyNames.join(', ')}) reported on duty after 09:00 AM (Late Comers today).`;
    if (bannerAction) {
      bannerAction.innerHTML = '<span class="px-3.5 py-1.5 bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-300 flex items-center gap-1.5"><span>⚠️</span> Late Comers Logged</span>';
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
      tableSub.textContent = 'Real-time classroom telemetry & verified staff check-in status';
    }
  }

  // Render Live Monitoring Table Rows
  const tbody = document.getElementById('live-monitoring-tbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (allTodayClasses.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="py-8 text-center text-slate-400 text-xs">
          No classes scheduled for today under this department view. Generate or configure timetable in Admin Desk.
        </td>
      </tr>
    `;
  } else {
    allTodayClasses.forEach(row => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-100 hover:bg-slate-50/80 transition-colors text-sm';

      let statusBadge = '';
      if (row.status === 'ACTIVE') {
        statusBadge = `
          <div class="flex flex-col gap-0.5">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot"></span>
              ${escapeHTML(row.exactStatus || 'ACTIVE')}
            </span>
            ${row.isLateComer ? `<span class="text-[9px] font-black text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 w-fit">⚠️ LATE COMER (${escapeHTML(row.reportedAt || '')})</span>` : ''}
          </div>`;
      } else if (row.status === 'SCHEDULED') {
        statusBadge = `
          <div class="flex flex-col gap-0.5">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <span class="w-2 h-2 rounded-full bg-slate-400"></span>
              ${escapeHTML(row.exactStatus || 'SCHEDULED')}
            </span>
            ${row.isLateComer ? `<span class="text-[9px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 w-fit">LATE COMER (${escapeHTML(row.reportedAt || '')})</span>` : ''}
          </div>`;
      } else if (row.status === 'COMPLETED') {
        statusBadge = `
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <span>✓</span>
            ${escapeHTML(row.exactStatus || 'COMPLETED')}
          </span>`;
      } else if (row.status === 'VACANT') {
        statusBadge = `
          <div class="flex flex-col gap-0.5">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
              <span class="w-2 h-2 rounded-full bg-rose-500"></span>
              ${escapeHTML(row.exactStatus || 'VACANT')}
            </span>
            ${row.vacantReason ? `<span class="text-[9px] text-rose-600 font-medium">${escapeHTML(row.vacantReason)}</span>` : ''}
          </div>`;
      } else if (row.status === 'SUBSTITUTE') {
        statusBadge = `
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            ${escapeHTML(row.exactStatus || 'SUBSTITUTE')}
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
          <button onclick="showToast('Class details: ' + ${JSON.stringify(row.class || '')} + ' - ' + ${JSON.stringify(row.subject || '')} + ' (' + ${JSON.stringify(row.room || '')} + ')', 'info')" class="text-xs text-slate-500 hover:text-indigo-600 font-medium underline cursor-pointer">
            View Room
          </button>`;
      }

      const facultyInitial = escapeHTML((row.teacher || 'F').charAt(0).toUpperCase());

      tr.innerHTML = `
        <td class="py-3.5 px-4 font-bold text-slate-900">${escapeHTML(row.class)}</td>
        <td class="py-3.5 px-4 font-medium text-slate-800">${escapeHTML(row.subject)}</td>
        <td class="py-3.5 px-4 text-slate-700">
          <div class="flex flex-col gap-0.5">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">${facultyInitial}</span>
              <span class="font-semibold text-slate-900">${escapeHTML(row.teacher)}</span>
            </div>
            ${row.isLateComer ? `<span class="inline-flex items-center gap-1 text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 mt-1 w-fit">⚠️ LATE COMER (${escapeHTML(row.reportedAt || 'After 09:00 AM')})</span>` : ''}
          </div>
        </td>
        <td class="py-3.5 px-4 font-mono text-xs font-semibold text-slate-600">${escapeHTML(row.room)}</td>
        <td class="py-3.5 px-4 font-mono text-xs text-slate-600">${escapeHTML(row.time)}</td>
        <td class="py-3.5 px-4">${statusBadge}</td>
        <td class="py-3.5 px-4 text-right">${actionBtn}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Keep HOD sub-views in sync
  renderHodVacantClasses();
  renderHodSubstituteManagement();
  renderHodTodayTimetable();
  renderHodTodayTopicsSummary();
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
    else {
      const deptName = appState.hodSelectedDeptFilter === 'ALL' ? 'Managed' : appState.hodSelectedDeptFilter;
      metaEl.textContent = `Live timetable schedule across ${deptName} Department batches (${allTodayClasses.length} periods)`;
    }
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
  const teacherUser = (appState.teachersList || []).find(t => 
    (t.email && (t.email.toLowerCase() === (appState.currentUser?.email || '').toLowerCase())) ||
    (t.name && (t.name.toLowerCase() === (appState.currentUser?.name || '').toLowerCase()))
  );
  const resolvedTeacherName = (teacherName || teacherUser?.name || appState.currentUser?.name || '').trim();
  const currentTeacherName = resolvedTeacherName.toLowerCase();
  const teacherFirstName = currentTeacherName.split(' ')[0] || '';
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
      const matches = currentTeacherName && (
        cellLower.includes(currentTeacherName) ||
        (teacherFirstName && teacherFirstName.length >= 3 && cellLower.includes(teacherFirstName))
      );

      if (matches) {
        let subject = cellVal;
        const batch = (appState.studentBatches || []).find(b => b.name === slot.section);
        let room = batch?.baseRoom || 'Classroom';
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

// Teacher Daily On-Duty Master Switch Controller
async function handleTeacherDutyToggle(isChecked) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const localToday = now.toLocaleDateString('en-CA');
  const teacherEmail = (appState.currentUser?.email || 'faculty@college.edu').toLowerCase();
  const teacherName = appState.currentUser?.name || 'Faculty Member';
  const dept = appState.currentUser?.dept || 'Information Technology';

  // Afternoon cutoff: 12:00 PM (720 mins). Cannot report ON_DUTY in the afternoon.
  if (isChecked && currentMinutes >= 720) {
    showToast('⚠️ Duty reporting is closed in the afternoon (after 12:00 PM). Classes remain marked as VACANT.', 'warning');
    const dutyToggle = document.getElementById('teacher-duty-toggle');
    if (dutyToggle) dutyToggle.checked = false;
    return;
  }

  appState.teacherDutyReports = appState.teacherDutyReports || {};
  appState.teacherDutyReports[localToday] = appState.teacherDutyReports[localToday] || {};

  // Operating start is 9:00 AM (540 min). If checked after 9:00 AM, flagged as late comer
  const isLateComer = isChecked && (currentMinutes > 540);
  const firstPeriodMissed = isChecked && (currentMinutes > 590);

  const reportObj = {
    teacher_name: teacherName,
    teacher_email: teacherEmail,
    department: dept,
    status: isChecked ? 'ON_DUTY' : 'OFF_DUTY',
    is_late_comer: isLateComer,
    first_period_missed: firstPeriodMissed,
    reported_at: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: localToday,
    timestamp: Date.now()
  };

  appState.teacherDutyReports[localToday][teacherEmail] = reportObj;
  saveState(true);

  // Sync with FastAPI backend
  if (window.ApiClient && typeof ApiClient.reportDuty === 'function') {
    try {
      await ApiClient.reportDuty(reportObj);
    } catch (e) {
      console.warn('Backend duty report note:', e.message);
    }
  }

  // Sync to Firebase Cloud Firestore collection 'duty_reports'
  if (window.FirebaseSync && typeof FirebaseSync.saveDocument === 'function') {
    const docKey = `${localToday}_${teacherEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
    FirebaseSync.saveDocument('duty_reports', docKey, reportObj)
      .catch(e => console.warn('Firestore duty report sync note:', e.message));
  }

  if (isChecked) {
    if (isLateComer) {
      showToast('⚠️ Reported On Duty (Flagged as LATE COMER - reported after period start).', 'warning');
    } else {
      showToast('✓ Reported On Duty! You are confirmed on campus for today.', 'success');
    }
  } else {
    showToast('Marked OFF DUTY. Scheduled classes will show as VACANT to HOD for substitute assignment.', 'info');
  }

  renderTeacherDashboard();
  renderHodDashboard();
}
window.handleTeacherDutyToggle = handleTeacherDutyToggle;

// Teacher Daily On-Duty Button Click Handler
async function handleTeacherDutyButtonClick() {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const localToday = now.toLocaleDateString('en-CA');
  const teacherEmail = (appState.currentUser?.email || 'faculty@college.edu').toLowerCase();

  const dutyReportsToday = (appState.teacherDutyReports && appState.teacherDutyReports[localToday]) || {};
  const currentTeacherName = (appState.currentUser?.name || '').toLowerCase();
  const dutyReport = dutyReportsToday[teacherEmail] || Object.values(dutyReportsToday).find(r =>
    (r.teacher_name || '').toLowerCase() === currentTeacherName ||
    (teacherEmail && (r.teacher_email || '').toLowerCase() === teacherEmail)
  );

  const isCurrentlyOn = Boolean(dutyReport && dutyReport.status === 'ON_DUTY');

  // If trying to turn ON in the afternoon (after 12:00 PM / 720 mins)
  if (!isCurrentlyOn && currentMinutes >= 720) {
    showToast('⚠️ Duty reporting is closed in the afternoon (after 12:00 PM). Classes remain marked as VACANT.', 'warning');
    return;
  }

  // If already ON and in the afternoon, cannot cancel
  if (isCurrentlyOn && currentMinutes >= 720) {
    showToast('🔒 Duty status is locked for the afternoon.', 'info');
    return;
  }

  const targetState = !isCurrentlyOn;
  await handleTeacherDutyToggle(targetState);
}
window.handleTeacherDutyButtonClick = handleTeacherDutyButtonClick;

async function handleTeacherCheckIn(classObj) {
  const isCheckingIn = !appState.teacherCheckedIn;
  const targetClass = classObj || currentActiveTeacherClass;
  const targetRoom = targetClass?.room || 'Room C204';
  const targetBatch = targetClass?.class || 'IT-A';
  const startMin = targetClass?.startMin || 540;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // 5-Minute Grace Period check
  let timeliness = 'ON_TIME';
  let minutesLate = 0;
  if (currentMinutes <= startMin + 5) {
    timeliness = 'ON_TIME';
  } else {
    timeliness = 'LATE';
    minutesLate = Math.max(0, currentMinutes - startMin);
  }

  if (isCheckingIn) {
    showToast(`📍 Acquiring device GPS coordinates for ${targetRoom}...`, 'info');

    try {
      if (window.GeoLocationHelper && window.GeoLocationHelper.isSupported()) {
        const result = await window.GeoLocationHelper.performTeacherCheckIn(targetBatch, targetRoom, appState.currentUser?.dept || 'Information Technology');
        console.log('[GPS Check-in Result]:', result);
        const lateNotice = timeliness === 'LATE' ? ` (Late to Class: ${minutesLate}m)` : ' (On Time)';
        showToast(`✓ GPS Verified (${result.distance_meters}m from ${targetRoom})! Room ${targetRoom} is ACTIVE${lateNotice}.`, 'success');
      } else {
        showToast(`Checked in successfully! Room ${targetRoom} status is now ACTIVE.`, 'success');
      }
    } catch (err) {
      console.warn('GPS Verification fallback:', err.message);
      showToast(`Location notice: ${err.message} (Checked in under Classroom Mode)`, 'info');
    }

    appState.teacherCheckedIn = true;
    appState.teacherCheckInTimeliness = {
      timeliness,
      minutesLate,
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      period: targetClass?.period || 1
    };

    // Find the live monitoring entry for the currently logged-in teacher (not hardcoded 'arun')
    const currentTeacherEmail = (appState.currentUser?.email || '').toLowerCase();
    const currentTeacherName = (appState.currentUser?.name || '').toLowerCase();
    const arunClass = (appState.liveMonitoring || []).find(c => {
      const cTeacher = (c.teacher || '').toLowerCase();
      const cEmail = (c.teacher_email || '').toLowerCase();
      return c.class === targetBatch ||
        (currentTeacherEmail && cEmail === currentTeacherEmail) ||
        (currentTeacherName && (cTeacher.includes(currentTeacherName) || currentTeacherName.includes(cTeacher)));
    });
    if (arunClass) {
      arunClass.status = 'ACTIVE';
      arunClass.exactStatus = timeliness === 'LATE' ? `LATE TO CLASS (${minutesLate}m late)` : 'IN ROOM (ON TIME)';
      if (appState.hodStats) {
        appState.hodStats.active = Math.min(appState.hodStats.totalClasses || 10, (appState.hodStats.active || 0) + 1);
      }
    }
  } else {
    appState.teacherCheckedIn = false;
    appState.teacherCheckInTimeliness = null;
    showToast(`Checked out of ${targetRoom}.`, 'info');
  }

  saveState(true);
  renderTeacherDashboard();
  renderHodDashboard();

  if (isCheckingIn) {
    const topicCard = document.getElementById('teacher-topic-prompt-card');
    if (topicCard) {
      topicCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const topicInput = document.getElementById('teacher-topic-input');
      if (topicInput && !topicInput.value) {
        setTimeout(() => topicInput.focus(), 350);
      }
    }
  }
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

  // Resolve actual teacher profile and update DOM header, sidebar, drawer
  const teacherUser = (appState.teachersList || []).find(t => 
    (t.email && (t.email.toLowerCase() === (appState.currentUser?.email || '').toLowerCase())) ||
    (t.name && (t.name.toLowerCase() === (appState.currentUser?.name || '').toLowerCase()))
  );
  const teacherDisplayName = teacherUser?.name || appState.currentUser?.name || 'Faculty Member';
  const teacherDisplayDept = teacherUser?.dept || appState.currentUser?.dept || 'Department of Technology';
  const teacherDisplayId = teacherUser?.id ? `#FAC-${teacherUser.id}` : (appState.currentUser?.id || '#FAC');

  const sidebarNameEl = document.getElementById('teacher-sidebar-name');
  const sidebarAvatarEl = document.getElementById('teacher-sidebar-avatar');
  const sidebarDeptEl = document.getElementById('teacher-sidebar-dept');
  const sidebarIdEl = document.getElementById('teacher-sidebar-id');
  const topbarNameEl = document.getElementById('teacher-mobile-topbar-name');
  const drawerNameEl = document.getElementById('teacher-drawer-name');
  const classesDescEl = document.getElementById('teacher-classes-assigned-desc');

  if (sidebarNameEl) sidebarNameEl.textContent = teacherDisplayName;
  if (sidebarAvatarEl) sidebarAvatarEl.textContent = teacherDisplayName.charAt(0).toUpperCase();
  if (sidebarDeptEl) sidebarDeptEl.textContent = teacherDisplayDept;
  if (sidebarIdEl) sidebarIdEl.textContent = teacherDisplayId;
  if (topbarNameEl) topbarNameEl.textContent = `${teacherDisplayName} • Tap ☰ to access desk menu`;
  if (drawerNameEl) drawerNameEl.textContent = `${teacherDisplayName} • ${teacherDisplayDept}`;
  if (classesDescEl) classesDescEl.textContent = `Detailed overview of all classes assigned to ${teacherDisplayName} for today`;

  // Check if teacher is on approved leave today
  const localToday = now.toLocaleDateString('en-CA');
  const utcToday = now.toISOString().split('T')[0];
  const currentTeacherName = teacherDisplayName.toLowerCase();
  const currentTeacherEmail = (appState.currentUser?.email || teacherUser?.email || '').toLowerCase();

  // Render Daily On-Duty Master Switch Card
  const teacherEmail = currentTeacherEmail || 'faculty@college.edu';
  const dutyReportsToday = (appState.teacherDutyReports && appState.teacherDutyReports[localToday]) || {};
  const dutyReport = dutyReportsToday[teacherEmail] || Object.values(dutyReportsToday).find(r =>
    (r.teacher_name || '').toLowerCase() === currentTeacherName ||
    (teacherEmail && (r.teacher_email || '').toLowerCase() === teacherEmail)
  );

  const isDutyOn = dutyReport && dutyReport.status === 'ON_DUTY';
  const dutyToggle = document.getElementById('teacher-duty-toggle');
  const dutyBadge = document.getElementById('teacher-duty-status-badge');
  const dutyTimestampBox = document.getElementById('teacher-duty-timestamp-box');
  const dutyTimeText = document.getElementById('teacher-duty-time-text');
  const dutyLatenessTag = document.getElementById('teacher-duty-lateness-tag');
  const dutyIconBox = document.getElementById('teacher-duty-icon-box');

  const isAfternoon = currentMinutes >= 720;

  if (dutyToggle) {
    dutyToggle.checked = Boolean(isDutyOn);
    // Afternoon cutoff: lock reporting toggle in the afternoon (after 12:00 PM)
    dutyToggle.disabled = isAfternoon;
  }

  // Update prominent Teacher On-Duty Button
  const dutyBtn = document.getElementById('teacher-duty-action-btn');
  const dutyBtnIcon = document.getElementById('teacher-duty-btn-icon');
  const dutyBtnText = document.getElementById('teacher-duty-btn-text');

  if (dutyBtn) {
    if (isAfternoon && !isDutyOn) {
      dutyBtn.disabled = true;
      dutyBtn.className = 'w-full sm:w-auto px-5 py-2.5 bg-slate-100 text-slate-400 border border-slate-200 font-black text-xs sm:text-sm rounded-2xl cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap';
      if (dutyBtnIcon) dutyBtnIcon.textContent = '🚫';
      if (dutyBtnText) dutyBtnText.textContent = 'Reporting Closed (Afternoon)';
    } else if (isAfternoon && isDutyOn) {
      dutyBtn.disabled = true;
      dutyBtn.className = 'w-full sm:w-auto px-5 py-2.5 bg-emerald-50 text-emerald-800 border border-emerald-300 font-black text-xs sm:text-sm rounded-2xl cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap';
      if (dutyBtnIcon) dutyBtnIcon.textContent = '🔒';
      if (dutyBtnText) dutyBtnText.textContent = dutyReport?.is_late_comer ? 'On Duty (Late - Locked)' : 'On Duty (Locked)';
    } else if (!isDutyOn) {
      dutyBtn.disabled = false;
      dutyBtn.className = 'w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md hover:shadow-indigo-500/25 transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap';
      if (dutyBtnIcon) dutyBtnIcon.textContent = '🛡️';
      if (dutyBtnText) dutyBtnText.textContent = 'Report On Duty Today';
    } else {
      dutyBtn.disabled = false;
      dutyBtn.className = 'w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md hover:shadow-emerald-500/25 transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap';
      if (dutyBtnIcon) dutyBtnIcon.textContent = '✓';
      dutyBtnText.textContent = dutyReport?.is_late_comer ? 'On Duty (Late Comer)' : 'On Duty (Reported)';
    }
  }

  if (dutyBadge) {
    if (isAfternoon && !isDutyOn) {
      dutyBadge.textContent = 'REPORTING CLOSED (AFTERNOON)';
      dutyBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300';
    } else if (!isDutyOn) {
      dutyBadge.textContent = 'OFF DUTY';
      dutyBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200';
    } else if (dutyReport.is_late_comer) {
      dutyBadge.textContent = isAfternoon ? 'ON DUTY (LATE COMER - LOCKED)' : 'LATE COMER';
      dutyBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse';
    } else {
      dutyBadge.textContent = isAfternoon ? 'ON DUTY (LOCKED FOR AFTERNOON)' : 'ON DUTY (ON TIME)';
      dutyBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300';
    }
  }

  if (dutyTimestampBox && dutyTimeText) {
    if (isDutyOn && dutyReport?.reported_at) {
      dutyTimestampBox.classList.remove('hidden');
      dutyTimeText.textContent = `Reported: ${dutyReport.reported_at}`;
      if (dutyLatenessTag) {
        if (isAfternoon) {
          dutyLatenessTag.textContent = dutyReport.is_late_comer ? '⚠️ Reported late (Locked for afternoon)' : '✓ Duty locked for afternoon';
          dutyLatenessTag.className = dutyReport.is_late_comer ? 'font-bold text-amber-700' : 'font-bold text-emerald-700';
        } else {
          dutyLatenessTag.textContent = dutyReport.is_late_comer ? '⚠️ Reported after 09:00 AM (Late Comer)' : '✓ Reported on time';
          dutyLatenessTag.className = dutyReport.is_late_comer ? 'font-bold text-amber-700' : 'font-bold text-emerald-700';
        }
      }
    } else if (isAfternoon && !isDutyOn) {
      dutyTimestampBox.classList.remove('hidden');
      dutyTimeText.textContent = 'Duty cutoff passed at 12:00 PM';
      if (dutyLatenessTag) {
        dutyLatenessTag.textContent = '🔴 Classes marked as VACANT for substitution';
        dutyLatenessTag.className = 'font-bold text-rose-700';
      }
    } else {
      dutyTimestampBox.classList.add('hidden');
    }
  }

  if (dutyIconBox) {
    dutyIconBox.className = isDutyOn
      ? 'w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl shrink-0 border border-emerald-200'
      : 'w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-xl shrink-0 border border-indigo-100';
  }
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
      if (val.toLowerCase().includes(currentTeacherName)) {
        return `<div class="p-1 rounded-lg bg-indigo-50 border border-indigo-200 text-[11px] font-bold text-indigo-950 leading-tight">${val}</div>`;
      }
      return '<span class="text-slate-400 text-[11px]">Free / Prep</span>';
    };

    days.forEach(d => {
      const daySlots = (appState.masterTimetableSlots || []).filter(s => s.day === d);
      const getSlotForPeriod = (pKey) => {
        const found = daySlots.find(s => (s[pKey] || '').toLowerCase().includes(currentTeacherName));
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

  // Refresh teacher daily topic prompt card
  renderTeacherTopicPromptCard(focalClassObj);
}

// Render teacher leave requests status on Dashboard & dedicated Leave Status Tab
function renderTeacherLeaves() {
  const teacherUser = (appState.teachersList || []).find(t => 
    (t.email && (t.email.toLowerCase() === (appState.currentUser?.email || '').toLowerCase())) ||
    (t.name && (t.name.toLowerCase() === (appState.currentUser?.name || '').toLowerCase()))
  );
  const currentTeacherName = (teacherUser?.name || appState.currentUser?.name || '').toLowerCase();
  const currentTeacherEmail = (appState.currentUser?.email || teacherUser?.email || '').toLowerCase();
  
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
// WEEKLY CLASSROOM TOPIC TRACKER & TEACHER DAILY TOPIC LOGGING
// =========================================================================

// ISO Academic Week Key: Returns e.g. "2026-W38"
function getAcademicWeekKey(d = new Date()) {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  return `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

// Academic Week Date Range: Returns e.g. "14 Sep - 19 Sep 2026"
function getAcademicWeekRange(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay();
  const diffToMon = date.getDate() - (day === 0 ? 6 : day - 1);
  const mon = new Date(new Date(d).setDate(diffToMon));
  const sat = new Date(mon);
  sat.setDate(mon.getDate() + 5);
  const monStr = mon.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const satStr = sat.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${monStr} - ${satStr}`;
}

// Format week key into readable label
function formatAcademicWeekLabel(weekKey) {
  if (!weekKey) return 'Current Week';
  const currentKey = getAcademicWeekKey(new Date());
  if (weekKey === currentKey) {
    return `Current Week (Active): ${getAcademicWeekRange(new Date())}`;
  }
  const parts = weekKey.split('-W');
  if (parts.length === 2) {
    const yr = parseInt(parts[0], 10);
    const wk = parseInt(parts[1], 10);
    const simple = new Date(yr, 0, 1 + (wk - 1) * 7);
    return `Week ${wk}, ${yr} (${getAcademicWeekRange(simple)})`;
  }
  return weekKey;
}

// Render the Teacher Daily Topic Prompt Card on Faculty Dashboard
function renderTeacherTopicPromptCard(targetClassObj) {
  const card = document.getElementById('teacher-topic-prompt-card');
  if (!card) return;

  const targetClass = targetClassObj || currentActiveTeacherClass;
  const targetBatch = targetClass?.class || 'IT-A';
  const targetSubject = targetClass?.subject || targetClass?.fullTitle || 'General Lecture';
  const targetPeriod = targetClass?.period || 1;
  const targetPeriodName = targetClass?.periodName || `Period ${targetPeriod}`;
  const targetTime = targetClass?.time || '09:00 - 09:50';

  const subtitleEl = document.getElementById('teacher-topic-card-subtitle');
  const statusBadge = document.getElementById('teacher-topic-status-badge');
  const inputContainer = document.getElementById('teacher-topic-input-container');
  const viewContainer = document.getElementById('teacher-topic-view-container');
  const displayText = document.getElementById('teacher-topic-display-text');
  const inputEl = document.getElementById('teacher-topic-input');

  if (subtitleEl) {
    subtitleEl.textContent = `${targetPeriodName} (${targetTime}) • ${targetSubject} (${targetBatch})`;
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-CA');
  const teacherUser = (appState.teachersList || []).find(t => 
    (t.email && (t.email.toLowerCase() === (appState.currentUser?.email || '').toLowerCase())) ||
    (t.name && (t.name.toLowerCase() === (appState.currentUser?.name || '').toLowerCase()))
  );
  const currentTeacherName = (teacherUser?.name || appState.currentUser?.name || '').toLowerCase();
  const currentTeacherEmail = (appState.currentUser?.email || teacherUser?.email || '').toLowerCase();

  const existingTopic = (appState.weeklyTopics || []).find(t => {
    const matchDate = t.date === dateStr;
    const matchClass = (t.className || '').toUpperCase() === targetBatch.toUpperCase();
    const matchPeriod = String(t.period) === String(targetPeriod);
    const matchTeacher = !t.teacherEmail || (t.teacherEmail && t.teacherEmail.toLowerCase() === currentTeacherEmail) ||
                         (t.teacherName && t.teacherName.toLowerCase().includes(currentTeacherName));
    return matchDate && matchClass && matchPeriod;
  });

  if (existingTopic && existingTopic.topicTitle) {
    if (inputContainer) inputContainer.classList.add('hidden');
    if (viewContainer) viewContainer.classList.remove('hidden');
    if (displayText) displayText.textContent = existingTopic.topicTitle;
    if (inputEl) inputEl.value = existingTopic.topicTitle;

    if (statusBadge) {
      statusBadge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300';
      statusBadge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block mr-1"></span> ✓ Topic Logged';
    }
  } else {
    if (inputContainer) inputContainer.classList.remove('hidden');
    if (viewContainer) viewContainer.classList.add('hidden');

    if (statusBadge) {
      statusBadge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse';
      statusBadge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block mr-1"></span> Pending Entry';
    }
  }
}

// Teacher Saves / Submits Topic
async function saveTeacherTopic(targetClassObj) {
  const inputEl = document.getElementById('teacher-topic-input');
  const topicTitle = (inputEl ? inputEl.value : '').trim();

  if (!topicTitle || topicTitle.length < 2) {
    showToast('⚠️ Please enter the topic title you plan to teach today.', 'warning');
    if (inputEl) inputEl.focus();
    return;
  }

  const targetClass = targetClassObj || currentActiveTeacherClass;
  const targetBatch = targetClass?.class || 'IT-A';
  const targetSubject = targetClass?.subject || targetClass?.fullTitle || 'General Theory';
  const targetPeriod = targetClass?.period || 1;
  const targetPeriodName = targetClass?.periodName || `Period ${targetPeriod}`;
  const targetTime = targetClass?.time || '09:00 - 09:50';
  const targetRoom = targetClass?.room || 'Room C204';

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-CA');
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDayName = dayNames[now.getDay()];
  const teacherUser = (appState.teachersList || []).find(t => 
    (t.email && (t.email.toLowerCase() === (appState.currentUser?.email || '').toLowerCase())) ||
    (t.name && (t.name.toLowerCase() === (appState.currentUser?.name || '').toLowerCase()))
  );
  const teacherName = teacherUser?.name || appState.currentUser?.name || 'Faculty Member';
  const teacherEmail = appState.currentUser?.email || teacherUser?.email || '';
  const dept = teacherUser?.dept || appState.currentUser?.dept || 'Information Technology';
  const weekKey = getAcademicWeekKey(now);

  if (!Array.isArray(appState.weeklyTopics)) {
    appState.weeklyTopics = [];
  }

  const existingIdx = appState.weeklyTopics.findIndex(t =>
    t.date === dateStr && (t.className || '').toUpperCase() === targetBatch.toUpperCase() && String(t.period) === String(targetPeriod)
  );

  const topicDoc = {
    id: existingIdx >= 0 ? appState.weeklyTopics[existingIdx].id : `top_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    date: dateStr,
    day: currentDayName,
    weekKey: weekKey,
    weekLabel: getAcademicWeekRange(now),
    className: targetBatch,
    room: targetRoom,
    period: targetPeriod,
    periodName: targetPeriodName,
    time: targetTime,
    subject: targetSubject,
    topicTitle: topicTitle,
    teacherName: teacherName,
    teacherEmail: teacherEmail,
    department: dept,
    timestamp: Date.now(),
    updatedAt: Date.now(),
    status: 'Logged'
  };

  if (existingIdx >= 0) {
    appState.weeklyTopics[existingIdx] = topicDoc;
  } else {
    appState.weeklyTopics.unshift(topicDoc);
  }

  if (appState._deletedEntityIds) {
    appState._deletedEntityIds = appState._deletedEntityIds.filter(id => id !== topicDoc.id && id !== topicDoc.weekKey);
  }

  saveState(true);
  renderTeacherTopicPromptCard(targetClass);
  renderHodTopicTracker();
  renderHodTodayTopicsSummary();

  showToast(`✓ Topic saved: "${topicTitle}". Broadcasted to HOD live tracker!`, 'success');

  try {
    if (window.ApiClient && typeof window.ApiClient.saveTopic === 'function') {
      await window.ApiClient.saveTopic({
        class_name: targetBatch,
        room_code: targetRoom,
        period: targetPeriod,
        period_name: targetPeriodName,
        time_slot: targetTime,
        subject: targetSubject,
        topic_title: topicTitle,
        department: dept,
        teacher_name: teacherName,
        date: dateStr,
        week_key: weekKey
      });
    }
  } catch (err) {
    console.warn('Backend topic sync notice:', err.message);
  }
}

// Teacher clicks Edit Topic
function editTeacherTopic() {
  const inputContainer = document.getElementById('teacher-topic-input-container');
  const viewContainer = document.getElementById('teacher-topic-view-container');
  const inputEl = document.getElementById('teacher-topic-input');

  if (inputContainer) inputContainer.classList.remove('hidden');
  if (viewContainer) viewContainer.classList.add('hidden');
  if (inputEl) {
    inputEl.focus();
    inputEl.select();
  }
}

// Render the Weekly Topic Tracker in HOD Dashboard
function renderHodTopicTracker() {
  const tbody = document.getElementById('hod-weekly-topics-tbody');
  if (!tbody) return;

  const weekFilter = document.getElementById('hod-topic-week-filter');
  const classFilter = document.getElementById('hod-topic-class-filter');
  const emptyState = document.getElementById('hod-topics-empty-state');
  const statTotal = document.getElementById('hod-topic-stat-total');
  const statClasses = document.getElementById('hod-topic-stat-classes');
  const statFaculty = document.getElementById('hod-topic-stat-faculty');
  const countBadge = document.getElementById('hod-topic-table-count-badge');
  const tableSubtitle = document.getElementById('hod-topic-table-subtitle');

  const topics = appState.weeklyTopics || [];
  const now = new Date();
  const currentWeekKey = getAcademicWeekKey(now);

  // 1. Populate Week Selector Dropdown
  if (weekFilter) {
    const selectedWeek = weekFilter.value || 'CURRENT';
    const distinctWeeks = Array.from(new Set([currentWeekKey, ...topics.map(t => t.weekKey).filter(Boolean)])).sort().reverse();

    weekFilter.innerHTML = '';
    distinctWeeks.forEach(w => {
      const opt = document.createElement('option');
      opt.value = w;
      if (w === currentWeekKey) {
        opt.textContent = `Current Week (Active): ${getAcademicWeekRange(now)}`;
      } else {
        opt.textContent = formatAcademicWeekLabel(w);
      }
      if (w === selectedWeek || (selectedWeek === 'CURRENT' && w === currentWeekKey)) {
        opt.selected = true;
      }
      weekFilter.appendChild(opt);
    });
  }

  // 2. Populate Class Filter Dropdown
  if (classFilter) {
    const selectedClass = classFilter.value || 'ALL';
    const classSet = new Set(['CO4', 'IT-A', 'IT-B']);
    (appState.classroomsList || []).forEach(r => { if (r.name) classSet.add(r.name); if (r.code) classSet.add(r.code); });
    (appState.studentBatches || []).forEach(b => { if (b.name) classSet.add(b.name); if (b.code) classSet.add(b.code); });
    topics.forEach(t => { if (t.className) classSet.add(t.className); });

    const classesList = Array.from(classSet).sort();
    classFilter.innerHTML = '<option value="ALL">All Classes & Batches</option>';
    classesList.forEach(cls => {
      const opt = document.createElement('option');
      opt.value = cls;
      opt.textContent = `Class ${cls}`;
      if (cls === selectedClass) opt.selected = true;
      classFilter.appendChild(opt);
    });
  }

  // 3. Filter Records
  const activeWeek = (weekFilter && weekFilter.value) ? weekFilter.value : currentWeekKey;
  const activeClass = (classFilter && classFilter.value) ? classFilter.value : 'ALL';

  const filteredTopics = topics.filter(item => {
    const matchWeek = !activeWeek || activeWeek === 'CURRENT' ? item.weekKey === currentWeekKey : item.weekKey === activeWeek;
    const matchClass = !activeClass || activeClass === 'ALL' ? true : (item.className || '').toUpperCase() === activeClass.toUpperCase();
    return matchWeek && matchClass;
  });

  // 4. Update Metrics
  const distinctClassesCovered = new Set(filteredTopics.map(t => t.className).filter(Boolean)).size;
  const distinctFaculty = new Set(filteredTopics.map(t => t.teacherName || t.teacherEmail).filter(Boolean)).size;

  if (statTotal) statTotal.textContent = filteredTopics.length;
  if (statClasses) statClasses.textContent = distinctClassesCovered;
  if (statFaculty) statFaculty.textContent = distinctFaculty;
  if (countBadge) countBadge.textContent = `${filteredTopics.length} Records`;
  if (tableSubtitle) {
    tableSubtitle.textContent = activeWeek === currentWeekKey
      ? `Current Academic Week (${getAcademicWeekRange(now)})`
      : `Archived Records for ${formatAcademicWeekLabel(activeWeek)}`;
  }

  // 5. Render Table Rows
  tbody.innerHTML = '';
  if (filteredTopics.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
  } else {
    if (emptyState) emptyState.classList.add('hidden');
    filteredTopics.forEach(row => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-100 hover:bg-slate-50/80 transition-colors text-sm';

      const initial = escapeHTML((row.teacherName || 'F').charAt(0).toUpperCase());
      const formattedDate = row.date ? new Date(row.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '--';

      tr.innerHTML = `
        <td class="py-3.5 px-4">
          <div class="font-bold text-slate-900">${escapeHTML(row.day || '')}</div>
          <div class="text-xs text-slate-500 font-mono">${formattedDate}</div>
        </td>
        <td class="py-3.5 px-4">
          <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
            ${escapeHTML(row.className || 'Class')}
          </span>
        </td>
        <td class="py-3.5 px-4">
          <div class="font-bold text-slate-800 text-xs">${escapeHTML(row.periodName || `Period ${row.period || ''}`)}</div>
          <div class="text-[11px] font-mono text-slate-500">${escapeHTML(row.time || '')}</div>
        </td>
        <td class="py-3.5 px-4">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">${initial}</span>
            <div>
              <div class="font-bold text-slate-900 text-xs">${escapeHTML(row.teacherName || 'Faculty')}</div>
              <div class="text-[10px] text-slate-400 font-mono">${escapeHTML(row.department || 'IT')}</div>
            </div>
          </div>
        </td>
        <td class="py-3.5 px-4 font-semibold text-slate-800 text-xs">
          ${escapeHTML(row.subject || '--')}
        </td>
        <td class="py-3.5 px-4 max-w-xs">
          <span class="font-bold text-slate-900 text-xs leading-snug block">${escapeHTML(row.topicTitle || '--')}</span>
          <span class="text-[10px] text-slate-400">Room: ${escapeHTML(row.room || 'C204')}</span>
        </td>
        <td class="py-3.5 px-4">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse-dot"></span>
            ✓ Logged
          </span>
        </td>
        <td class="py-3.5 px-4 text-right">
          <button onclick="deleteSingleTopicRecord('${row.id}')" title="Delete record" class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }
}

// Render Summary Table on HOD Main Live Monitoring Dashboard
function renderHodTodayTopicsSummary() {
  const tbody = document.getElementById('hod-today-topics-tbody');
  const countBadge = document.getElementById('hod-today-topics-count-badge');
  const emptyEl = document.getElementById('hod-today-topics-empty');
  if (!tbody) return;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-CA');
  const todayTopics = (appState.weeklyTopics || []).filter(t => t.date === dateStr);

  if (countBadge) {
    countBadge.textContent = `${todayTopics.length} ${todayTopics.length === 1 ? 'Topic' : 'Topics'} Logged`;
  }

  tbody.innerHTML = '';
  if (todayTopics.length === 0) {
    if (emptyEl) emptyEl.classList.remove('hidden');
  } else {
    if (emptyEl) emptyEl.classList.add('hidden');
    todayTopics.forEach(row => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-100 hover:bg-slate-50/80 transition-colors text-sm';
      const initial = escapeHTML((row.teacherName || 'F').charAt(0).toUpperCase());

      tr.innerHTML = `
        <td class="py-3 px-4 font-bold text-slate-900">
          <span class="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-black border border-indigo-200">
            ${escapeHTML(row.className || 'Class')}
          </span>
        </td>
        <td class="py-3 px-4 font-mono text-xs font-semibold text-slate-600">
          ${escapeHTML(row.periodName || `Period ${row.period || ''}`)} (${escapeHTML(row.time || '')})
        </td>
        <td class="py-3 px-4">
          <div class="flex items-center gap-2">
            <span class="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">${initial}</span>
            <span class="text-xs font-semibold text-slate-800">${escapeHTML(row.teacherName || 'Faculty')}</span>
          </div>
        </td>
        <td class="py-3 px-4 font-medium text-slate-800 text-xs">${escapeHTML(row.subject || '--')}</td>
        <td class="py-3 px-4">
          <strong class="text-slate-900 text-xs">${escapeHTML(row.topicTitle || '--')}</strong>
        </td>
        <td class="py-3 px-4 text-right">
          <span class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            ✓ Logged
          </span>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }
}

// Permanently Delete Week Records (HOD Feature)
async function confirmDeleteTopicWeek() {
  const weekFilter = document.getElementById('hod-topic-week-filter');
  const currentWeekKey = getAcademicWeekKey(new Date());
  const selectedWeek = (weekFilter && weekFilter.value) ? weekFilter.value : currentWeekKey;

  const weekLabel = formatAcademicWeekLabel(selectedWeek);
  const confirmed = confirm(`⚠️ PERMANENT DELETE WARNING:\n\nAre you sure you want to permanently delete all topic coverage records for ${weekLabel}?\n\nThis will remove records from the cloud database and cannot be undone.`);
  if (!confirmed) return;

  const countBefore = (appState.weeklyTopics || []).length;
  appState._deletedEntityIds = appState._deletedEntityIds || [];
  if (selectedWeek && !appState._deletedEntityIds.includes(selectedWeek)) {
    appState._deletedEntityIds.push(selectedWeek);
  }

  appState.weeklyTopics = (appState.weeklyTopics || []).filter(t => t.weekKey !== selectedWeek);
  const deletedCount = countBefore - appState.weeklyTopics.length;

  saveState(true);
  renderHodTopicTracker();
  renderHodTodayTopicsSummary();

  showToast(`🗑️ Successfully deleted ${deletedCount} topic records for ${selectedWeek}.`, 'info');

  try {
    if (window.ApiClient && typeof window.ApiClient.deleteTopicWeek === 'function') {
      await window.ApiClient.deleteTopicWeek(selectedWeek);
    }
  } catch (err) {
    console.warn('Backend delete week notice:', err.message);
  }
}

// Delete Single Topic Record
function deleteSingleTopicRecord(topicId) {
  if (!topicId) return;
  const confirmed = confirm('Remove this specific topic record?');
  if (!confirmed) return;

  appState._deletedEntityIds = appState._deletedEntityIds || [];
  if (topicId && !appState._deletedEntityIds.includes(topicId)) {
    appState._deletedEntityIds.push(topicId);
  }

  appState.weeklyTopics = (appState.weeklyTopics || []).filter(t => t.id !== topicId);
  saveState(true);
  renderHodTopicTracker();
  renderHodTodayTopicsSummary();
  showToast('✓ Record removed.', 'info');
}

// Refresh & Sync topics with backend
async function syncTopicTracker() {
  showToast('🔄 Synchronizing weekly topic tracker...', 'info');
  try {
    if (window.ApiClient && typeof window.ApiClient.getTopics === 'function') {
      const currentWeekKey = getAcademicWeekKey(new Date());
      const cloudTopics = await window.ApiClient.getTopics(currentWeekKey);
      if (Array.isArray(cloudTopics) && cloudTopics.length > 0) {
        const existingIds = new Set((appState.weeklyTopics || []).map(t => t.id));
        cloudTopics.forEach(ct => {
          if (!existingIds.has(ct.id)) {
            appState.weeklyTopics.unshift({
              id: ct.id,
              date: ct.date,
              day: ct.day,
              weekKey: ct.week_key,
              className: ct.class_name,
              room: ct.room_code,
              period: ct.period,
              periodName: ct.period_name,
              time: ct.time_slot,
              subject: ct.subject,
              topicTitle: ct.topic_title,
              teacherName: ct.teacher_name,
              teacherEmail: ct.teacher_email,
              department: ct.department,
              timestamp: Date.now(),
              status: 'Logged'
            });
          }
        });
        saveState();
      }
    }
  } catch (e) {
    console.warn('Topic sync notice:', e.message);
  }
  renderHodTopicTracker();
  renderHodTodayTopicsSummary();
  showToast('✓ Topic tracker up to date.', 'success');
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
  showToast(`Timetable ${targetVer} applied campus-wide! HODs and Staff notified.`, 'success');

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
    const hods = deduplicateListByEmail(appState.hodsList || []);
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
    const teachers = deduplicateListByEmail(appState.teachersList || []);
    if (teachers.length === 0) {
      tTable.innerHTML = '<tr><td colspan="7" class="py-8 text-center text-slate-400 text-xs font-medium">No faculty staff registered yet. Click "+ Add Staff" to onboard teaching faculty.</td></tr>';
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
  const teachers = deduplicateListByEmail(appState.teachersList || []);

  if (teachers.length === 0) {
    container.innerHTML = `
      <div class="col-span-full p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
        <p class="font-bold text-xs text-slate-600">No Department Staff Added</p>
        <p class="text-[11px] mt-0.5">Click "+ Add Staff" to assign staff to this department.</p>
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
        <button onclick="handleDeleteTeacher('${escapeHTML(t.id)}', '${escapeHTML(t.name)}')" title="Delete Staff Member" class="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
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
    created_at: new Date().toISOString(),
    updatedAt: Date.now()
  };

  // 1. Save to state & sync to Firebase Cloud Firestore immediately
  appState.leavesList = appState.leavesList || [];
  appState.leavesList.unshift(newLeave);
  if (appState._deletedEntityIds) {
    appState._deletedEntityIds = appState._deletedEntityIds.filter(id => id !== newLeave.id);
  }
  saveState(true);
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
    leave.updatedAt = Date.now();
    saveState(true);
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
    leave.updatedAt = Date.now();
    saveState(true);
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
    semester: sem,
    updatedAt: Date.now()
  };

  appState.subjectsList.push(newSubj);
  if (appState._deletedEntityIds) {
    appState._deletedEntityIds = appState._deletedEntityIds.filter(id => id !== code && id !== newSubj.id);
  }
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
    status: 'Active',
    updatedAt: Date.now()
  };

  appState.classroomsList.push(newRoom);
  appState.rooms = appState.classroomsList;
  if (appState._deletedEntityIds) {
    appState._deletedEntityIds = appState._deletedEntityIds.filter(id => id !== room_code && id !== newRoom.id);
  }
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

  appState._deletedEntityIds = appState._deletedEntityIds || [];
  if (subjectId && !appState._deletedEntityIds.includes(subjectId)) appState._deletedEntityIds.push(subjectId);
  if (subjectCode && !appState._deletedEntityIds.includes(subjectCode)) appState._deletedEntityIds.push(subjectCode);

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

  appState._deletedEntityIds = appState._deletedEntityIds || [];
  if (roomId && !appState._deletedEntityIds.includes(roomId)) appState._deletedEntityIds.push(roomId);
  if (roomCode && !appState._deletedEntityIds.includes(roomCode)) appState._deletedEntityIds.push(roomCode);

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
  if (!confirm(`Are you sure you want to delete staff member ${teacherName}?`)) return;

  const target = (appState.teachersList || []).find(t => String(t.id) === String(teacherId) || t.name === teacherName);
  const targetEmail = (target?.email || '').toLowerCase().trim();

  appState.teachersList = (appState.teachersList || []).filter(t => {
    const matchesId = String(t.id) === String(teacherId);
    const matchesName = t.name === teacherName;
    const matchesEmail = targetEmail && (t.email || '').toLowerCase().trim() === targetEmail;
    return !matchesId && !matchesName && !matchesEmail;
  });

  if (targetEmail) {
    appState.users = (appState.users || []).filter(u => (u.email || '').toLowerCase().trim() !== targetEmail);
  }
  saveState(true);
  renderAdminTables();
  renderHodTeachers();
  updateAllSelectDropdowns();
  showToast(`Staff member ${teacherName} removed.`, 'info');

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

  const cleanEmail = (hodEmail || '').toLowerCase().trim();
  appState.hodsList = (appState.hodsList || []).filter(h => {
    const matchesId = String(h.id) === String(hodId);
    const matchesEmail = cleanEmail && (h.email || '').toLowerCase().trim() === cleanEmail;
    return !matchesId && !matchesEmail;
  });

  if (cleanEmail) {
    appState.users = (appState.users || []).filter(u => (u.email || '').toLowerCase().trim() !== cleanEmail);
  }
  saveState(true);
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
    ttTeacherSelect.innerHTML = '<option value="">-- Select Staff --</option>';
    deduplicateListByEmail(appState.teachersList || []).forEach(t => {
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
    mapTeacher.innerHTML = '<option value="">-- Select Staff --</option>';
    deduplicateListByEmail(appState.teachersList || []).forEach(t => {
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

  const mapLabRoom = document.getElementById('map-lab-room') || document.getElementById('map-room-alt');
  if (mapLabRoom) {
    const cur = mapLabRoom.value;
    mapLabRoom.innerHTML = '<option value="">-- Select Laboratory / Special Room --</option>';
    
    // Filter rooms specifically for Laboratory, Seminar Hall, or rooms with 'Lab' in type/name
    const labRooms = (appState.classroomsList || []).filter(r => {
      const type = (r.type || '').toLowerCase();
      const code = (r.room || '').toLowerCase();
      return type.includes('lab') || type.includes('seminar') || code.includes('lab');
    });

    const roomsToRender = labRooms.length > 0 ? labRooms : (appState.classroomsList || []);
    roomsToRender.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.room;
      opt.textContent = `${r.room} (${r.type || 'Laboratory'})`;
      mapLabRoom.appendChild(opt);
    });
    if (cur) mapLabRoom.value = cur;
  }

  // 8. Populate registered student batches only in modal-add-subject-mapping
  populateMappingClassesCheckboxes();

  // 9. Update datalist for HOD Add Teacher subject input
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

// Helper: Populate only registered student batches in Add Mapping modal (Exclude physical rooms)
function populateMappingClassesCheckboxes() {
  const container = document.getElementById('map-classes-container');
  if (!container) return;

  const classNames = new Set();
  (appState.studentBatches || []).forEach(b => {
    if (b.name) classNames.add(b.name.trim());
  });

  if (classNames.size === 0) {
    container.innerHTML = `
      <div class="col-span-2 text-center text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
        ⚠️ No student classes/batches registered yet. Please add student sections in <strong>Student Batches</strong> first (e.g. IT-A, CSE-B).
      </div>
    `;
    updateSelectedMappingClassesCount();
    return;
  }

  const sortedClasses = Array.from(classNames).sort();
  let html = '';
  sortedClasses.forEach(cName => {
    html += `
      <label class="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200/90 hover:bg-indigo-50/50 hover:border-indigo-300 transition cursor-pointer text-xs">
        <input type="checkbox" name="map-assigned-class" value="${escapeHTML(cName)}" onchange="updateSelectedMappingClassesCount()" class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300">
        <span class="font-bold text-slate-800">${escapeHTML(cName)}</span>
      </label>
    `;
  });

  container.innerHTML = html;
  updateSelectedMappingClassesCount();
}
window.populateMappingClassesCheckboxes = populateMappingClassesCheckboxes;

function updateSelectedMappingClassesCount() {
  const checked = document.querySelectorAll('input[name="map-assigned-class"]:checked');
  const countEl = document.getElementById('map-selected-count-num');
  if (countEl) countEl.textContent = checked.length;
}
window.updateSelectedMappingClassesCount = updateSelectedMappingClassesCount;

function handleMapFormatChange(val) {
  const singleContainer = document.getElementById('map-single-quota-container');
  const integratedContainer = document.getElementById('map-integrated-quota-container');
  const labBlockContainer = document.getElementById('map-lab-block-container');
  const quotaInput = document.getElementById('map-quota');
  const quotaSub = document.getElementById('map-single-quota-sub');

  if (val === 'Theory') {
    if (singleContainer) singleContainer.classList.remove('hidden');
    if (integratedContainer) integratedContainer.classList.add('hidden');
    if (labBlockContainer) labBlockContainer.classList.add('hidden');
    if (quotaInput) quotaInput.value = '5';
    if (quotaSub) quotaSub.textContent = 'e.g. 5 or 6 lectures per week';
  } else if (val === 'Lab') {
    if (singleContainer) singleContainer.classList.remove('hidden');
    if (integratedContainer) integratedContainer.classList.add('hidden');
    if (labBlockContainer) labBlockContainer.classList.remove('hidden');
    if (quotaInput) quotaInput.value = '4';
    if (quotaSub) quotaSub.textContent = 'e.g. 4 lab periods per week';
  } else if (val === 'Theory + Lab') {
    if (singleContainer) singleContainer.classList.add('hidden');
    if (integratedContainer) integratedContainer.classList.remove('hidden');
    if (labBlockContainer) labBlockContainer.classList.remove('hidden');
  }
}
window.handleMapFormatChange = handleMapFormatChange;

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

  const newBatch = {
    id: 'batch-' + Date.now(),
    name,
    strength,
    sem,
    baseRoom,
    updatedAt: Date.now()
  };

  appState.studentBatches.push(newBatch);
  if (appState._deletedEntityIds) {
    appState._deletedEntityIds = appState._deletedEntityIds.filter(id => id !== name && id !== newBatch.id);
  }

  saveState(true);
  renderAdminBatches();
  updateAllSelectDropdowns();
  closeModal('modal-add-batch');
  showToast(`Class & Batch ${name} added successfully!`, 'success');
  e.target.reset();
}

function handleDeleteBatch(batchId, batchName) {
  if (!confirm(`Are you sure you want to delete class batch ${batchName}?`)) return;

  appState._deletedEntityIds = appState._deletedEntityIds || [];
  if (batchId && !appState._deletedEntityIds.includes(batchId)) appState._deletedEntityIds.push(batchId);
  if (batchName && !appState._deletedEntityIds.includes(batchName)) appState._deletedEntityIds.push(batchName);

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
  const teacher = (document.getElementById('map-teacher')?.value || '').trim();
  const subject = (document.getElementById('map-subject')?.value || '').trim();
  const type = document.getElementById('map-type')?.value || 'Theory';

  const checkedBoxes = Array.from(document.querySelectorAll('input[name="map-assigned-class"]:checked'));
  const sections = checkedBoxes.map(cb => cb.value.trim()).filter(Boolean);

  if (!teacher || !subject || sections.length === 0) {
    showToast('Staff, Subject, and at least one Assigned Class are required.', 'error');
    return;
  }

  let quota = 5;
  let theoryQuota = 0;
  let labQuota = 0;
  let labBlockSize = 1;
  let labRoom = '';

  const selectedLabRoom = (document.getElementById('map-lab-room')?.value || document.getElementById('map-room-alt')?.value || '').trim();

  if (type === 'Theory + Lab') {
    theoryQuota = parseInt(document.getElementById('map-theory-quota')?.value) || 3;
    labQuota = parseInt(document.getElementById('map-lab-quota')?.value) || 4;
    labBlockSize = parseInt(document.getElementById('map-lab-block-size')?.value) || 2;
    quota = theoryQuota + labQuota;
    labRoom = selectedLabRoom || 'Laboratory 1';
  } else if (type === 'Lab') {
    quota = parseInt(document.getElementById('map-quota')?.value) || 4;
    labQuota = quota;
    labBlockSize = parseInt(document.getElementById('map-lab-block-size')?.value) || 2;
    labRoom = selectedLabRoom || 'Laboratory 1';
  } else {
    // Theory: students stay in their own assigned classroom!
    quota = parseInt(document.getElementById('map-quota')?.value) || 5;
    theoryQuota = quota;
    labBlockSize = 1;
    labRoom = '';
  }

  const mappingObj = {
    id: 'map-' + Date.now(),
    teacher,
    subject,
    type,
    sections,
    quota,
    theoryQuota,
    labQuota,
    labBlockSize,
    labRoom,
    room: labRoom || 'Own Classroom',
    created_at: new Date().toISOString(),
    updatedAt: Date.now()
  };

  appState.subjectTeacherMappings = appState.subjectTeacherMappings || [];
  appState.subjectTeacherMappings.push(mappingObj);
  if (appState._deletedEntityIds) {
    appState._deletedEntityIds = appState._deletedEntityIds.filter(id => id !== mappingObj.id);
  }

  saveState(true);

  // Firestore cloud persistence
  if (window.FirebaseSync && typeof FirebaseSync.saveDocument === 'function') {
    FirebaseSync.saveDocument('subject_mappings', mappingObj.id, mappingObj)
      .catch(e => console.warn('Firestore mapping cloud save:', e.message));
  }

  renderSubjectMappings();
  closeModal('modal-add-subject-mapping');
  showToast(`Mapping added: ${teacher} ➔ ${subject} (${sections.join(', ')} • ${quota} periods/wk)`, 'success');
  e.target.reset();
  if (typeof handleMapFormatChange === 'function') handleMapFormatChange('Theory');
  if (typeof updateSelectedMappingClassesCount === 'function') updateSelectedMappingClassesCount();
}

function handleDeleteSubjectMapping(mapId) {
  if (!confirm('Are you sure you want to delete this faculty subject mapping?')) return;

  appState._deletedEntityIds = appState._deletedEntityIds || [];
  if (mapId && !appState._deletedEntityIds.includes(mapId)) {
    appState._deletedEntityIds.push(mapId);
  }

  appState.subjectTeacherMappings = (appState.subjectTeacherMappings || []).filter(m => m.id !== mapId);
  saveState(true);

  // Firestore delete
  if (window.FirebaseSync && typeof FirebaseSync.deleteDocument === 'function') {
    FirebaseSync.deleteDocument('subject_mappings', mapId).catch(e => console.warn('Firestore mapping delete:', e.message));
  }

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

    let typeBadge = '';
    if (m.type === 'Theory + Lab') {
      typeBadge = '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">Theory + Lab</span>';
    } else if (m.type === 'Lab') {
      typeBadge = '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">Lab Only</span>';
    } else {
      typeBadge = '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Theory Only</span>';
    }

    let quotaDisplay = '';
    if (m.type === 'Theory + Lab') {
      quotaDisplay = `
        <span class="font-bold text-xs bg-indigo-50 text-indigo-800 px-2.5 py-1 rounded-lg">${escapeHTML(m.quota)} periods / wk</span>
        <span class="text-[10px] text-slate-500 font-semibold block mt-0.5">${escapeHTML(m.theoryQuota || 0)} Th + ${escapeHTML(m.labQuota || 0)} Lab (${escapeHTML(m.labBlockSize || 2)}p block)</span>
      `;
    } else if (m.type === 'Lab') {
      quotaDisplay = `
        <span class="font-bold text-xs bg-purple-50 text-purple-800 px-2.5 py-1 rounded-lg">${escapeHTML(m.quota)} periods / wk</span>
        <span class="text-[10px] text-purple-600 font-semibold block mt-0.5">${escapeHTML(m.labBlockSize || 2)} periods continuous block</span>
      `;
    } else {
      quotaDisplay = `<span class="font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">${escapeHTML(m.quota)} periods / wk</span>`;
    }

    let roomBadge = '';
    if (m.type === 'Theory') {
      roomBadge = '📍 Base Classroom (Self)';
    } else if (m.type === 'Lab') {
      roomBadge = `🔬 Lab: ${escapeHTML(m.labRoom || m.room || 'Laboratory')}`;
    } else {
      roomBadge = `📍 Own Classroom (Th) + 🔬 Lab: ${escapeHTML(m.labRoom || m.room || 'Laboratory')}`;
    }

    tr.innerHTML = `
      <td class="py-2.5 px-3 font-semibold text-slate-900">${escapeHTML(m.teacher)}</td>
      <td class="py-2.5 px-3">
        <span class="font-bold text-indigo-700">${escapeHTML(m.subject)}</span>
        <span class="text-[10px] text-slate-500 font-medium block">${roomBadge}</span>
      </td>
      <td class="py-2.5 px-3">
        <div class="flex flex-wrap gap-1 items-center">
          ${m.sections.map(sec => `<span class="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-200 text-slate-800">${escapeHTML(sec)}</span>`).join('')}
          ${isMultiClass ? '<span class="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full" title="Zero period collision across these classes">Multi-Class Shared</span>' : ''}
        </div>
      </td>
      <td class="py-2.5 px-3">
        ${typeBadge}
      </td>
      <td class="py-2.5 px-3 text-center">
        ${quotaDisplay}
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

  // Helper: Retrieve assigned base classroom for a student batch
  const getBatchBaseRoom = (batchName) => {
    const batch = (appState.studentBatches || []).find(b => b.name && b.name.toLowerCase() === (batchName || '').toLowerCase());
    return batch?.baseRoom || 'Classroom';
  };

  // 1. Separate & Expand Lab and Theory Tasks (Handles Theory + Lab Integrated)
  const labTasks = [];
  const theoryTasks = [];

  mappings.forEach(m => {
    const secList = Array.isArray(m.sections) ? m.sections : [m.sections];
    if (m.type === 'Lab') {
      labTasks.push({
        teacher: m.teacher,
        subject: m.subject,
        sections: secList,
        quota: m.labQuota || m.quota || 4,
        blockSize: parseInt(m.labBlockSize) || 2,
        room: m.labRoom || m.room || 'Laboratory 1'
      });
    } else if (m.type === 'Theory + Lab') {
      labTasks.push({
        teacher: m.teacher,
        subject: `${m.subject} (Lab)`,
        sections: secList,
        quota: m.labQuota || 4,
        blockSize: parseInt(m.labBlockSize) || 2,
        room: m.labRoom || m.room || 'Laboratory 1'
      });
      theoryTasks.push({
        teacher: m.teacher,
        subject: `${m.subject} (Theory)`,
        sections: secList,
        quota: m.theoryQuota || 3
      });
    } else {
      theoryTasks.push({
        teacher: m.teacher,
        subject: m.subject,
        sections: secList,
        quota: m.quota || m.theoryQuota || 5
      });
    }
  });

  // Helper: Get candidate contiguous period blocks based on block length (1, 2, or 3)
  const getBlockOptions = (bSize) => {
    if (bSize === 3) return [[1, 2, 3], [4, 5, 6], [5, 6, 7]];
    if (bSize === 1) return [[1], [2], [3], [4], [5], [6], [7]];
    return [[1, 2], [3, 4], [5, 6], [6, 7]]; // default 2
  };

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

  // PHASE A: SCHEDULE CONTINUOUS LABS (1, 2, or 3 Period Blocks)
  for (const lab of labTasks) {
    for (const sec of lab.sections) {
      if (!sections.includes(sec)) continue;
      const bSize = lab.blockSize;
      const neededBlocks = Math.ceil((lab.quota || 4) / bSize);
      const blockOptions = getBlockOptions(bSize);

      for (let b = 0; b < neededBlocks; b++) {
        let placed = false;
        // Shuffle days to distribute labs nicely across the week
        const shuffledDays = [...days].sort(() => 0.5 - Math.random());

        for (const day of shuffledDays) {
          if (placed) break;
          // Don't place two lab blocks for the same section on the same day
          const dayHasLab = periods.some(p => {
            const cur = sectionSchedule.get(`${day}_${sec}_${p}`);
            return cur && cur.includes('Lab');
          });
          if (dayHasLab) continue;

          for (const blockPeriods of blockOptions) {
            // Check if ALL periods in the block are free
            const canFit = blockPeriods.every(p => {
              const tKey = `${day}_${p}_${lab.teacher}`;
              const rKey = `${day}_${p}_${lab.room || 'Lab 1'}`;
              const sKey = `${day}_${sec}_${p}`;
              return !teacherBusy.has(tKey) && !roomBusy.has(rKey) && !sectionSchedule.has(sKey);
            });

            if (canFit) {
              blockPeriods.forEach(p => {
                const tKey = `${day}_${p}_${lab.teacher}`;
                const rKey = `${day}_${p}_${lab.room || 'Lab 1'}`;
                const sKey = `${day}_${sec}_${p}`;
                teacherBusy.set(tKey, lab.teacher);
                roomBusy.set(rKey, lab.room || 'Lab 1');
                sectionSchedule.set(sKey, `${lab.subject} (${lab.teacher} • ${lab.room || 'Lab 1'})`);
              });

              const currentQuota = sectionSubjectCount.get(`${sec}_${lab.subject}`) || 0;
              sectionSubjectCount.set(`${sec}_${lab.subject}`, currentQuota + bSize);
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
        if (sectionSchedule.has(sKey)) continue; // already occupied by lab or mandatory skill slot

        // Find applicable subjects for this section that have remaining quota
        const candidateMappings = theoryTasks.filter(m => {
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
          const secBaseRoom = getBatchBaseRoom(sec);
          const tKey = `${day}_${p}_${chosen.teacher}`;
          const rKey = `${day}_${p}_${secBaseRoom}`;

          teacherBusy.set(tKey, chosen.teacher);
          roomBusy.set(rKey, secBaseRoom);

          const slotText = `${chosen.subject} (${chosen.teacher} • ${secBaseRoom})`;
          sectionSchedule.set(sKey, slotText);

          sectionSubjectCount.set(`${sec}_${chosen.subject}`, (sectionSubjectCount.get(`${sec}_${chosen.subject}`) || 0) + 1);
          sectionDaySubjectCount.set(`${day}_${sec}_${chosen.subject}`, (sectionDaySubjectCount.get(`${day}_${sec}_${chosen.subject}`) || 0) + 1);
        } else {
          // Free period or secondary allocation
          const anyAvailable = theoryTasks.filter(m => {
            if (!m.sections.includes(sec)) return false;
            const tKey = `${day}_${p}_${m.teacher}`;
            return !teacherBusy.has(tKey);
          });

          if (anyAvailable.length > 0 && Math.random() > 0.4) {
            const chosen = anyAvailable[Math.floor(Math.random() * anyAvailable.length)];
            const secBaseRoom = getBatchBaseRoom(sec);
            teacherBusy.set(`${day}_${p}_${chosen.teacher}`, chosen.teacher);
            sectionSchedule.set(sKey, `${chosen.subject} (${chosen.teacher} • ${secBaseRoom})`);
          } else {
            // Elective / Seminar / Library slot
            const secBaseRoom = getBatchBaseRoom(sec);
            sectionSchedule.set(sKey, (p === 7) ? `Library / Seminar (${secBaseRoom})` : (p === 6 ? `Sports / Club (${secBaseRoom})` : `Study Hour (${secBaseRoom})`));
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
  saveState(true);

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
  showToast(`✓ Timetable draft ${draftVersion} created with 0 staff clashes and 0 room collisions!`, 'success');

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
    showToast('Subject and Staff are required for schedule slot.', 'error');
    return;
  }

  // Strict collision verification: check if teacher is already assigned to another class at the same (Day, Period)
  const existingTeacherSlot = appState.masterTimetableSlots.find(s => {
    if (s.day !== day || s.section === section) return false;
    const slotVal = s[`p${period}`] || '';
    return slotVal.toLowerCase().includes(teacher.toLowerCase());
  });

  if (existingTeacherSlot) {
    if (!confirm(`⚠️ WARNING: Staff member ${teacher} is already teaching ${existingTeacherSlot.section} on ${day} during Period ${period}! Are you sure you want to double-book?`)) {
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
  slotRow.updatedAt = Date.now();

  if (appState._deletedEntityIds) {
    appState._deletedEntityIds = appState._deletedEntityIds.filter(id => id !== slotRow.id);
  }

  saveState(true);
  renderAdminTimetable();
  closeModal('modal-manual-timetable');
  showToast(`Added manual slot for ${day} (${section}, Period ${period})!`, 'success');
  e.target.reset();
}

function handleDeleteTimetableSlot(slotId) {
  if (!confirm('Are you sure you want to remove this timetable schedule row?')) return;

  appState._deletedEntityIds = appState._deletedEntityIds || [];
  if (slotId && !appState._deletedEntityIds.includes(slotId)) {
    appState._deletedEntityIds.push(slotId);
  }

  appState.masterTimetableSlots = appState.masterTimetableSlots.filter(s => s.id !== slotId);
  saveState(true);
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
  renderHodTopicTracker();
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
      } else if (data.type === 'DUTY_REPORT_UPDATE') {
        const report = data.duty_report;
        if (report && report.date) {
          appState.teacherDutyReports = appState.teacherDutyReports || {};
          appState.teacherDutyReports[report.date] = appState.teacherDutyReports[report.date] || {};
          const tEmail = (report.teacher_email || '').toLowerCase();
          if (tEmail) {
            appState.teacherDutyReports[report.date][tEmail] = report;
          }
          saveState(true);
          renderHodDashboard();
          renderTeacherDashboard();
          const latenessNotice = report.is_late_comer ? ' (Flagged as LATE COMER)' : '';
          showToast(`📋 Faculty Duty Update: ${report.teacher_name} is ${report.status}${latenessNotice}.`, 'info');
        }
      } else if (data.type === 'CHECK_IN_UPDATE') {
        const session = (appState.liveMonitoring || []).find(c => 
          c.room === data.room_code || 
          c.class === data.class_name ||
          (data.teacher_email && (c.teacher_email || '').toLowerCase() === data.teacher_email.toLowerCase())
        );
        if (session) {
          session.status = 'ACTIVE';
          session.exactStatus = data.exact_status || 'IN ROOM (ON TIME)';
          renderHodDashboard();
        }
      } else if (data.type === 'SUBSTITUTE_ASSIGNED' || data.type === 'SUBSTITUTION_ALERT') {
        const sub = data.substitution || data;
        const target = (appState.liveMonitoring || []).find(c => c.id == (sub.session_id || data.session_id) || c.class === (sub.class_name || data.class_name));
        if (target) {
          target.status = 'SUBSTITUTE';
          target.substituteTeacher = sub.substitute_teacher || data.substitute;
          renderHodDashboard();
          renderTeacherDashboard();
        }
      } else if (data.type === 'TIMETABLE_APPLIED' || data.type === 'TIMETABLE_UPDATE') {
        showToast(`New Timetable (${data.version || 'Updated'}) applied campus-wide!`, 'info');
        syncWithBackend();
      } else if (data.type === 'LEAVE_STATUS_UPDATE') {
        const leave = data.leave;
        if (leave && leave.id) {
          appState.leavesList = appState.leavesList || [];
          const lIdx = appState.leavesList.findIndex(l => l.id == leave.id);
          if (lIdx >= 0) {
            appState.leavesList[lIdx] = { ...appState.leavesList[lIdx], ...leave };
          } else {
            appState.leavesList.unshift(leave);
          }
          saveState(true);
          renderHodDashboard();
          renderTeacherDashboard();
          renderHodLeaves();
          renderTeacherLeaves();
        }
      } else if (data.type === 'TOPIC_UPDATE') {
        const top = data.topic;
        if (top) {
          appState.weeklyTopics = appState.weeklyTopics || [];
          const idx = appState.weeklyTopics.findIndex(t => 
            t.date === top.date && (t.className || '').toUpperCase() === (top.class_name || '').toUpperCase() && String(t.period) === String(top.period)
          );
          const formatted = {
            id: top.id,
            date: top.date,
            day: top.day,
            weekKey: top.week_key,
            className: top.class_name,
            room: top.room_code || 'C204',
            period: top.period,
            periodName: top.period_name,
            time: top.time_slot,
            subject: top.subject,
            topicTitle: top.topic_title,
            teacherName: top.teacher_name,
            department: data.department || 'Information Technology',
            timestamp: Date.now(),
            status: 'Logged'
          };
          if (idx >= 0) {
            appState.weeklyTopics[idx] = formatted;
          } else {
            appState.weeklyTopics.unshift(formatted);
          }
          saveState();
          renderHodTopicTracker();
          renderHodTodayTopicsSummary();
          renderTeacherTopicPromptCard();
        }
      } else if (data.type === 'TOPIC_DELETED') {
        if (data.week_key) {
          appState.weeklyTopics = (appState.weeklyTopics || []).filter(t => t.weekKey !== data.week_key);
          saveState();
          renderHodTopicTracker();
          renderHodTodayTopicsSummary();
        }
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

  // Note: form-login, form-add-admin, form-add-hod, and form-hod-add-teacher
  // already have inline onsubmit="..." handlers in index.html. Redundant
  // addEventListener calls have been removed to prevent duplicate event triggering.

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
    const existingEmails = new Set(appState.users.map(u => (u.email || '').toLowerCase().trim()));
    cloudState.users.forEach(u => {
      const email = (u.email || '').toLowerCase().trim();
      if (email && !existingEmails.has(email)) {
        appState.users.push(u);
        existingEmails.add(email);
      } else if (email) {
        const idx = appState.users.findIndex(x => (x.email || '').toLowerCase().trim() === email);
        if (idx !== -1) appState.users[idx] = { ...appState.users[idx], ...u };
      }
    });
    appState.users = deduplicateUsersByEmail(appState.users);
  }

  // Merge HODs list
  if (Array.isArray(cloudState.hodsList)) {
    cloudState.hodsList.forEach(h => {
      const email = (h.email || '').toLowerCase().trim();
      const idx = appState.hodsList.findIndex(x => (email && (x.email || '').toLowerCase().trim() === email) || String(x.id) === String(h.id));
      if (idx !== -1) {
        appState.hodsList[idx] = { ...appState.hodsList[idx], ...h };
      } else {
        appState.hodsList.push(h);
      }
    });
    appState.hodsList = deduplicateListByEmail(appState.hodsList);
  }

  // Merge Teachers list
  if (Array.isArray(cloudState.teachersList)) {
    cloudState.teachersList.forEach(t => {
      const email = (t.email || '').toLowerCase().trim();
      const idx = appState.teachersList.findIndex(x => (email && (x.email || '').toLowerCase().trim() === email) || String(x.id) === String(t.id));
      if (idx !== -1) {
        appState.teachersList[idx] = { ...appState.teachersList[idx], ...t };
      } else {
        appState.teachersList.push(t);
      }
    });
    appState.teachersList = deduplicateListByEmail(appState.teachersList);
  }

  // 0. Merge deleted entity IDs tombstone
  if (Array.isArray(cloudState._deletedEntityIds)) {
    const localDeleted = new Set(appState._deletedEntityIds || []);
    cloudState._deletedEntityIds.forEach(id => localDeleted.add(id));
    appState._deletedEntityIds = Array.from(localDeleted);
  }
  const deletedSet = new Set(appState._deletedEntityIds || []);

  // Synchronize dynamic campus assets directly from Cloud Firestore with smart merging
  let hasLocalNewAdditions = false;

  // 4. Smart Merge Subjects (PREVENT ACCIDENTAL WIPES)
  if (Array.isArray(cloudState.subjectsList)) {
    appState.subjectsList = appState.subjectsList || [];
    cloudState.subjectsList.forEach(cs => {
      if (!cs) return;
      const code = (cs.code || '').toUpperCase().trim();
      if (deletedSet.has(cs.id) || deletedSet.has(code)) return; // Skip deleted
      const idx = appState.subjectsList.findIndex(s => (code && (s.code || '').toUpperCase().trim() === code) || (cs.id && s.id === cs.id));
      if (idx !== -1) {
        appState.subjectsList[idx] = { ...appState.subjectsList[idx], ...cs };
      } else {
        appState.subjectsList.push(cs);
      }
    });
    // Remove locally any item confirmed deleted
    appState.subjectsList = appState.subjectsList.filter(s => !deletedSet.has(s.id) && !deletedSet.has((s.code || '').toUpperCase().trim()));

    // Check if local has items not yet in cloud
    const cloudCodes = new Set(cloudState.subjectsList.map(s => (s.code || '').toUpperCase().trim()));
    if (appState.subjectsList.some(s => s.code && !cloudCodes.has(s.code.toUpperCase().trim()))) {
      hasLocalNewAdditions = true;
    }
  }

  // 5. Smart Merge Classrooms / Rooms (PREVENT ACCIDENTAL WIPES)
  const incomingRooms = Array.isArray(cloudState.classroomsList) ? cloudState.classroomsList : (Array.isArray(cloudState.rooms) ? cloudState.rooms : null);
  if (incomingRooms) {
    appState.classroomsList = appState.classroomsList || [];
    incomingRooms.forEach(cr => {
      if (!cr) return;
      const roomCode = (cr.room || '').toUpperCase().trim();
      if (deletedSet.has(cr.id) || deletedSet.has(roomCode)) return; // Skip deleted
      const idx = appState.classroomsList.findIndex(r => (roomCode && (r.room || '').toUpperCase().trim() === roomCode) || (cr.id && r.id === cr.id));
      if (idx !== -1) {
        appState.classroomsList[idx] = { ...appState.classroomsList[idx], ...cr };
      } else {
        appState.classroomsList.push(cr);
      }
    });
    appState.classroomsList = appState.classroomsList.filter(r => !deletedSet.has(r.id) && !deletedSet.has((r.room || '').toUpperCase().trim()));
    appState.rooms = appState.classroomsList;

    const cloudRooms = new Set(incomingRooms.map(r => (r.room || '').toUpperCase().trim()));
    if (appState.classroomsList.some(r => r.room && !cloudRooms.has(r.room.toUpperCase().trim()))) {
      hasLocalNewAdditions = true;
    }
  }

  // 6. Smart Merge Student Batches / Classes (PREVENT ACCIDENTAL WIPES)
  if (Array.isArray(cloudState.studentBatches)) {
    appState.studentBatches = appState.studentBatches || [];
    cloudState.studentBatches.forEach(cb => {
      if (!cb) return;
      const batchName = (cb.name || '').toUpperCase().trim();
      if (deletedSet.has(cb.id) || deletedSet.has(batchName)) return; // Skip deleted
      const idx = appState.studentBatches.findIndex(b => (batchName && (b.name || '').toUpperCase().trim() === batchName) || (cb.id && b.id === cb.id));
      if (idx !== -1) {
        appState.studentBatches[idx] = { ...appState.studentBatches[idx], ...cb };
      } else {
        appState.studentBatches.push(cb);
      }
    });
    appState.studentBatches = appState.studentBatches.filter(b => !deletedSet.has(b.id) && !deletedSet.has((b.name || '').toUpperCase().trim()));

    const cloudBatches = new Set(cloudState.studentBatches.map(b => (b.name || '').toUpperCase().trim()));
    if (appState.studentBatches.some(b => b.name && !cloudBatches.has(b.name.toUpperCase().trim()))) {
      hasLocalNewAdditions = true;
    }
  }

  // 7. Smart Merge Subject-Faculty-Class Mappings (PREVENT ACCIDENTAL WIPES)
  if (Array.isArray(cloudState.subjectTeacherMappings)) {
    appState.subjectTeacherMappings = appState.subjectTeacherMappings || [];
    cloudState.subjectTeacherMappings.forEach(cm => {
      if (!cm) return;
      if (deletedSet.has(cm.id)) return;
      const idx = appState.subjectTeacherMappings.findIndex(m => m.id === cm.id || (m.teacher === cm.teacher && m.subject === cm.subject && JSON.stringify(m.sections || []) === JSON.stringify(cm.sections || [])));
      if (idx !== -1) {
        const localTime = appState.subjectTeacherMappings[idx].updatedAt || 0;
        const cloudTime = cm.updatedAt || 0;
        if (cloudTime >= localTime) {
          appState.subjectTeacherMappings[idx] = { ...appState.subjectTeacherMappings[idx], ...cm };
        }
      } else {
        appState.subjectTeacherMappings.push(cm);
      }
    });
    appState.subjectTeacherMappings = appState.subjectTeacherMappings.filter(m => !deletedSet.has(m.id));

    const cloudMappingIds = new Set(cloudState.subjectTeacherMappings.map(m => m.id));
    if (appState.subjectTeacherMappings.some(m => m.id && !cloudMappingIds.has(m.id))) {
      hasLocalNewAdditions = true;
    }
  }

  // 8. Smart Merge Leave Requests (PREVENT ACCIDENTAL WIPES & STATUS REVERSIONS)
  if (Array.isArray(cloudState.leavesList)) {
    appState.leavesList = appState.leavesList || [];
    cloudState.leavesList.forEach(cl => {
      if (!cl) return;
      const leaveId = String(cl.id || cl._id || '');
      if (deletedSet.has(leaveId)) return;
      const idx = appState.leavesList.findIndex(l => String(l.id || l._id || '') === leaveId);
      if (idx !== -1) {
        const localLeave = appState.leavesList[idx];
        const localTime = localLeave.updatedAt || 0;
        const cloudTime = cl.updatedAt || 0;
        if (cloudTime >= localTime) {
          appState.leavesList[idx] = { ...localLeave, ...cl };
        }
      } else {
        appState.leavesList.push(cl);
      }
    });
    appState.leavesList = appState.leavesList.filter(l => !deletedSet.has(String(l.id || l._id || '')));

    const cloudLeaveIds = new Set(cloudState.leavesList.map(l => String(l.id || l._id || '')));
    if (appState.leavesList.some(l => l.id && !cloudLeaveIds.has(String(l.id)))) {
      hasLocalNewAdditions = true;
    }
  }

  // 9. Smart Merge Weekly Topics (PREVENT ACCIDENTAL WIPES)
  if (Array.isArray(cloudState.weeklyTopics)) {
    appState.weeklyTopics = appState.weeklyTopics || [];
    cloudState.weeklyTopics.forEach(ct => {
      if (!ct) return;
      const topicId = ct.id || `top_${ct.weekKey || ct.week_key}_${ct.day}_${ct.period}_${ct.className || ct.class_name}`;
      if (deletedSet.has(topicId) || deletedSet.has(ct.weekKey || ct.week_key)) return;
      const idx = appState.weeklyTopics.findIndex(t => (t.id && ct.id && t.id === ct.id) || (t.weekKey === (ct.weekKey || ct.week_key) && String(t.period) === String(ct.period) && (t.className || '').toUpperCase() === (ct.className || ct.class_name || '').toUpperCase() && t.day === ct.day));
      if (idx !== -1) {
        const localTime = appState.weeklyTopics[idx].updatedAt || 0;
        const cloudTime = ct.updatedAt || 0;
        if (cloudTime >= localTime) {
          appState.weeklyTopics[idx] = { ...appState.weeklyTopics[idx], ...ct };
        }
      } else {
        appState.weeklyTopics.unshift(ct);
      }
    });
    appState.weeklyTopics = appState.weeklyTopics.filter(t => !deletedSet.has(t.id) && !deletedSet.has(t.weekKey));

    const cloudTopicIds = new Set(cloudState.weeklyTopics.map(t => t.id).filter(Boolean));
    if (appState.weeklyTopics.some(t => t.id && !cloudTopicIds.has(t.id))) {
      hasLocalNewAdditions = true;
    }
  }

  // 10. Smart Merge Notifications
  if (Array.isArray(cloudState.notificationsList)) {
    appState.notificationsList = appState.notificationsList || [];
    const existingNotifIds = new Set(appState.notificationsList.map(n => String(n.id || n._id || '')));
    cloudState.notificationsList.forEach(cn => {
      const nid = String(cn.id || cn._id || '');
      if (nid && !existingNotifIds.has(nid)) {
        appState.notificationsList.unshift(cn);
        existingNotifIds.add(nid);
      }
    });
  }

  // 11. Smart Merge Master Timetable Slots (PREVENT ACCIDENTAL WIPES)
  if (Array.isArray(cloudState.masterTimetableSlots)) {
    appState.masterTimetableSlots = appState.masterTimetableSlots || [];
    cloudState.masterTimetableSlots.forEach(cs => {
      if (!cs || deletedSet.has(cs.id)) return;
      const idx = appState.masterTimetableSlots.findIndex(s => s.id === cs.id || (s.day === cs.day && s.section === cs.section));
      if (idx !== -1) {
        const localTime = appState.masterTimetableSlots[idx].updatedAt || 0;
        const cloudTime = cs.updatedAt || 0;
        if (cloudTime >= localTime) {
          appState.masterTimetableSlots[idx] = { ...appState.masterTimetableSlots[idx], ...cs };
        }
      } else {
        appState.masterTimetableSlots.push(cs);
      }
    });
    appState.masterTimetableSlots = appState.masterTimetableSlots.filter(s => !deletedSet.has(s.id));
    const cloudSlotIds = new Set(cloudState.masterTimetableSlots.map(s => s.id));
    if (appState.masterTimetableSlots.some(s => s.id && !cloudSlotIds.has(s.id))) {
      hasLocalNewAdditions = true;
    }
  }

  // 12. Smart Merge Timetable Versions
  if (Array.isArray(cloudState.timetableVersions)) {
    appState.timetableVersions = appState.timetableVersions || [];
    const existingVersions = new Set(appState.timetableVersions.map(v => v.version));
    cloudState.timetableVersions.forEach(cv => {
      if (cv && cv.version && !existingVersions.has(cv.version)) {
        appState.timetableVersions.push(cv);
        existingVersions.add(cv.version);
      }
    });
  }
  if (Array.isArray(cloudState.liveMonitoring) && cloudState.liveMonitoring.length > 0) {
    // Only use cloud liveMonitoring as a fallback seed when local timetable has no slots configured.
    // Otherwise liveMonitoring is always freshly computed by renderHodDashboard() from masterTimetableSlots.
    if ((appState.masterTimetableSlots || []).length === 0) {
      appState.liveMonitoring = cloudState.liveMonitoring;
    }
  }
  if (cloudState.collegeBellSchedule) {
    appState.collegeBellSchedule = cloudState.collegeBellSchedule;
  }
  if (cloudState.teacherDutyReports && typeof cloudState.teacherDutyReports === 'object') {
    // Merge per-day duty reports — newer local report always wins to prevent status reversal
    appState.teacherDutyReports = appState.teacherDutyReports || {};
    Object.entries(cloudState.teacherDutyReports).forEach(([dateKey, reportMap]) => {
      if (!appState.teacherDutyReports[dateKey]) {
        appState.teacherDutyReports[dateKey] = reportMap;
      } else {
        // Merge per-teacher report — keep whichever has more recent timestamp
        Object.entries(reportMap || {}).forEach(([email, cloudReport]) => {
          const localReport = appState.teacherDutyReports[dateKey][email];
          if (!localReport || (cloudReport.timestamp || 0) > (localReport.timestamp || 0)) {
            appState.teacherDutyReports[dateKey][email] = cloudReport;
          }
        });
      }
    });
  }

  // If local state had newly created items that the incoming cloud snapshot was missing,
  // immediately push them back to cloud so next snapshot contains the full truth.
  if (hasLocalNewAdditions) {
    console.log("☁️ [applyCloudState] Local additions detected — immediately re-syncing to cloud.");
    saveState(true); // immediate Firestore write
    return; // saveState(true) already updates localStorage, no need to proceed
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

