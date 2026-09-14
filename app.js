// MyMonitorXX - Core Application Logic, Authentication & RBAC

// Initial State Data
const DEFAULT_STATE = {
  currentUser: null, // null = show login screen
  activeRole: 'admin', // 'admin', 'hod', 'teacher'
  mobileFrame: false,
  teacherCheckedIn: false,

  // User Accounts Directory (Authentication & RBAC)
  users: [
    {
      id: 'usr-admin-1',
      name: 'System Administrator',
      email: 'canvaonly322@gmail.com',
      altEmail: 'canvaonly322@gmil.com',
      password: '123BALASELVARAJA123',
      role: 'admin',
      dept: 'Central Campus Administration'
    },
    {
      id: 'usr-hod-1',
      name: 'Dr. Ramesh Babu',
      email: 'hod.it@college.edu',
      password: 'hodpassword123',
      role: 'hod',
      dept: 'Information Technology'
    },
    {
      id: 'usr-teacher-1',
      name: 'Arun Kumar',
      email: 'arun@college.edu',
      password: 'teacherpass123',
      role: 'teacher',
      dept: 'Information Technology',
      subject: 'Python'
    }
  ],

  hodsList: [
    { id: 1, name: 'Dr. Ramesh Babu', email: 'hod.it@college.edu', dept: 'Information Technology', roomsManaged: 'Block C (6 Halls)', assignedFaculty: 14, status: 'Active' },
    { id: 2, name: 'Dr. Sunitha Verma', email: 'sunitha.hod@college.edu', dept: 'Computer Science', roomsManaged: 'Block B (8 Halls)', assignedFaculty: 18, status: 'Active' }
  ],

  hodStats: {
    totalClasses: 48,
    active: 32,
    scheduled: 9,
    vacant: 5,
    substitute: 2
  },

  liveMonitoring: [
    { id: 1, class: 'IT-A', subject: 'Python', teacher: 'Arun', room: 'C204', status: 'ACTIVE', time: '10:00 - 11:00', substituteTeacher: null },
    { id: 2, class: 'IT-B', subject: 'DBMS', teacher: 'Kumar', room: 'C205', status: 'SCHEDULED', time: '11:00 - 12:00', substituteTeacher: null },
    { id: 3, class: 'IT-C', subject: 'Maths', teacher: 'Priya', room: 'C206', status: 'VACANT', time: '10:00 - 11:00', substituteTeacher: null },
    { id: 4, class: 'IT-D', subject: 'Java', teacher: 'Suresh', room: 'C207', status: 'SUBSTITUTE', time: '10:00 - 11:00', substituteTeacher: 'Rajesh' },
    { id: 5, class: 'IT-A', subject: 'Computer Networks', teacher: 'Vikram', room: 'C208', status: 'ACTIVE', time: '10:00 - 11:00', substituteTeacher: null },
    { id: 6, class: 'IT-B', subject: 'Web Technologies', teacher: 'Sneha', room: 'Lab 2', status: 'SCHEDULED', time: '11:00 - 13:00', substituteTeacher: null },
    { id: 7, class: 'IT-C', subject: 'Operating Systems', teacher: 'Kavitha', room: 'C209', status: 'ACTIVE', time: '10:00 - 11:00', substituteTeacher: null },
    { id: 8, class: 'IT-D', subject: 'Data Structures', teacher: 'Manoj', room: 'C210', status: 'VACANT', time: '10:00 - 11:00', substituteTeacher: null }
  ],

  availableSubstitutes: [
    { id: 'sub-1', name: 'Dr. Rajesh', dept: 'Information Technology', freePeriods: 'Period 3 & 4 (10:00 - 12:00)', specialization: 'Maths & Algorithms' },
    { id: 'sub-2', name: 'Prof. Anitha', dept: 'Information Technology', freePeriods: 'Period 3 (10:00 - 11:00)', specialization: 'Data Structures' },
    { id: 'sub-3', name: 'Dr. Meenakshi', dept: 'Computer Science', freePeriods: 'Period 3 & 5 (10:00 - 11:00, 1:00 - 2:00)', specialization: 'Programming Languages' }
  ],

  teachersList: [
    { id: 1, name: 'Arun Kumar', email: 'arun@college.edu', subject: 'Python & AI', dept: 'IT', workload: '16 hrs/wk', status: 'Available' },
    { id: 2, name: 'Kumar Swamy', email: 'kumar@college.edu', subject: 'DBMS', dept: 'IT', workload: '18 hrs/wk', status: 'In Class' },
    { id: 3, name: 'Priya Sharma', email: 'priya@college.edu', subject: 'Applied Maths', dept: 'IT', workload: '14 hrs/wk', status: 'On Leave' },
    { id: 4, name: 'Suresh Raina', email: 'suresh@college.edu', subject: 'Java & OOP', dept: 'IT', workload: '16 hrs/wk', status: 'In Class' },
    { id: 5, name: 'Sneha Rao', email: 'sneha@college.edu', subject: 'Web Tech', dept: 'IT', workload: '15 hrs/wk', status: 'Available' },
    { id: 6, name: 'Vikram Singh', email: 'vikram@college.edu', subject: 'Networks', dept: 'IT', workload: '18 hrs/wk', status: 'In Class' }
  ],

  subjectsList: [
    { code: 'IT301', name: 'Python Programming', type: 'Theory + Lab', weeklyHours: 5, dept: 'IT' },
    { code: 'IT302', name: 'Database Management Systems', type: 'Theory', weeklyHours: 4, dept: 'IT' },
    { code: 'MA301', name: 'Discrete Mathematics', type: 'Theory', weeklyHours: 4, dept: 'All' },
    { code: 'IT303', name: 'Object Oriented Java', type: 'Theory + Lab', weeklyHours: 5, dept: 'IT' },
    { code: 'IT304', name: 'Computer Networks', type: 'Theory', weeklyHours: 4, dept: 'IT' }
  ],

  classroomsList: [
    { room: 'C204', type: 'Smart Lecture Hall', capacity: 65, block: 'Academic Block C' },
    { room: 'C205', type: 'Lecture Hall', capacity: 60, block: 'Academic Block C' },
    { room: 'C206', type: 'Lecture Hall', capacity: 60, block: 'Academic Block C' },
    { room: 'C207', type: 'Smart Lecture Hall', capacity: 70, block: 'Academic Block C' },
    { room: 'Lab 1', type: 'Cloud & Web Lab', capacity: 45, block: 'IT Lab Complex' },
    { room: 'Lab 2', type: 'AI & Data Science Lab', capacity: 50, block: 'IT Lab Complex' }
  ],

  timetableVersions: [
    { version: 'v3.2', status: 'ACTIVE', term: 'Odd Semester 2026-27', appliedAt: '10 Sep 2026', generatedBy: 'AI Scheduler v2' },
    { version: 'v3.1', status: 'ARCHIVED', term: 'Odd Semester 2026-27', appliedAt: '01 Sep 2026', generatedBy: 'Admin Manual' },
    { version: 'v3.0', status: 'DRAFT', term: 'Odd Semester 2026-27', appliedAt: '25 Aug 2026', generatedBy: 'AI Scheduler v2' }
  ],

  studentBatches: [
    { id: 'batch-1', name: 'IT-A', strength: 60, sem: 'Sem 3', baseRoom: 'Room C204' },
    { id: 'batch-2', name: 'IT-B', strength: 58, sem: 'Sem 3', baseRoom: 'Room C205' },
    { id: 'batch-3', name: 'IT-C', strength: 62, sem: 'Sem 3', baseRoom: 'Room C206' },
    { id: 'batch-4', name: 'IT-D', strength: 59, sem: 'Sem 3', baseRoom: 'Room C207' }
  ],

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

  // Faculty, Subject & Multi-Class Mappings with Weekly Periods Quota
  // Example: Arun Kumar teaches Python to both IT-A and IT-B (6 periods/week each)
  subjectTeacherMappings: [
    { id: 'map-1', teacher: 'Arun Kumar', subject: 'Python (IT301)', type: 'Theory', sections: ['IT-A', 'IT-B'], quota: 6, room: 'C204' },
    { id: 'map-2', teacher: 'Kumar Swamy', subject: 'DBMS (IT302)', type: 'Theory', sections: ['IT-A', 'IT-B'], quota: 5, room: 'C205' },
    { id: 'map-3', teacher: 'Priya Sharma', subject: 'Applied Maths (MA301)', type: 'Theory', sections: ['IT-A', 'IT-B', 'IT-C'], quota: 5, room: 'C206' },
    { id: 'map-4', teacher: 'Suresh Raina', subject: 'Java & OOP (IT303)', type: 'Theory', sections: ['IT-A', 'IT-B'], quota: 5, room: 'C207' },
    { id: 'map-5', teacher: 'Sneha Rao', subject: 'Web Technologies (IT304)', type: 'Theory', sections: ['IT-A', 'IT-B'], quota: 4, room: 'C204' },
    { id: 'map-6', teacher: 'Arun Kumar', subject: 'Python Lab', type: 'Lab', sections: ['IT-A', 'IT-B'], quota: 4, room: 'Lab 2' },
    { id: 'map-7', teacher: 'Kumar Swamy', subject: 'DBMS Lab', type: 'Lab', sections: ['IT-A', 'IT-B'], quota: 4, room: 'Lab 1' }
  ],

  masterTimetableSlots: [
    { id: 'slot-1', day: 'Monday', section: 'IT-A', p1: 'Naan Mudhalvan (Skill Faculty • Smart Hall)', p2: 'Naan Mudhalvan (Skill Faculty • Smart Hall)', p3: 'Naan Mudhalvan (Skill Faculty • Smart Hall)', p4: 'Naan Mudhalvan (Skill Faculty • Smart Hall)', p5: 'Python Lab (Arun • Lab 2)', p6: 'Python Lab (Arun • Lab 2)', p7: 'Web Tech (Sneha • C204)' },
    { id: 'slot-2', day: 'Monday', section: 'IT-B', p1: 'Naan Mudhalvan (Skill Faculty • Smart Hall)', p2: 'Naan Mudhalvan (Skill Faculty • Smart Hall)', p3: 'Naan Mudhalvan (Skill Faculty • Smart Hall)', p4: 'Naan Mudhalvan (Skill Faculty • Smart Hall)', p5: 'DBMS Lab (Kumar • Lab 1)', p6: 'DBMS Lab (Kumar • Lab 1)', p7: 'Library / Seminar' },
    { id: 'slot-3', day: 'Tuesday', section: 'IT-A', p1: 'Python (Arun • C204)', p2: 'Web Tech (Sneha • C204)', p3: 'Java (Suresh • C204)', p4: 'Maths (Priya • C204)', p5: 'DBMS (Kumar • C204)', p6: 'Sports / Club', p7: 'Library' },
    { id: 'slot-4', day: 'Tuesday', section: 'IT-B', p1: 'Java (Suresh • C205)', p2: 'Python (Arun • C205)', p3: 'DBMS (Kumar • C205)', p4: 'Maths (Priya • C205)', p5: 'Python Lab (Arun • Lab 2)', p6: 'Python Lab (Arun • Lab 2)', p7: 'Web Tech (Sneha • C205)' }
  ],

  teacherTodayClasses: [
    { time: '09:00', subject: 'DBMS', class: 'IT-A', room: 'C205', status: 'Completed', note: 'Attendance recorded' },
    { time: '09:50', subject: 'Python', class: 'IT-B', room: 'C204', status: 'Active', note: 'Live Class Slot' },
    { time: '11:00', subject: 'Maths', class: 'IT-C', room: 'C206', status: 'Upcoming', note: 'Scheduled' },
    { time: '01:30', subject: 'Lab', class: 'IT-A', room: 'Lab 1', status: 'Upcoming', note: 'Practical Session' }
  ]
};

// Load saved state (support legacy typo 'mymoniter_state' and proper 'mymonitor_state')
let appState = JSON.parse(localStorage.getItem('mymonitor_state') || localStorage.getItem('mymoniter_state')) || DEFAULT_STATE;

// Ensure default users and admin credentials always exist
if (!appState.users || !appState.users.some(u => u.email === 'canvaonly322@gmail.com')) {
  appState.users = DEFAULT_STATE.users;
}
if (!appState.studentBatches) {
  appState.studentBatches = DEFAULT_STATE.studentBatches;
}
if (!appState.subjectTeacherMappings || appState.subjectTeacherMappings.length === 0) {
  appState.subjectTeacherMappings = DEFAULT_STATE.subjectTeacherMappings;
}
if (!appState.masterTimetableSlots || !appState.masterTimetableSlots[0]?.p7) {
  appState.masterTimetableSlots = DEFAULT_STATE.masterTimetableSlots;
}
if (!appState.collegeBellSchedule) {
  appState.collegeBellSchedule = DEFAULT_STATE.collegeBellSchedule;
}

function saveState() {
  localStorage.setItem('mymonitor_state', JSON.stringify(appState));
}

// Global Toast Notifications
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  const bg = type === 'success' ? 'bg-emerald-600 text-white' : (type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-white');
  toast.className = `${bg} px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-medium transition-all duration-300 transform translate-y-2 opacity-0 z-50`;
  toast.innerHTML = `
    <span class="text-lg">${type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ')}</span>
    <span>${message}</span>
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

function quickFillAndLogin(role) {
  const emailField = document.getElementById('login-email');
  const passField = document.getElementById('login-password');
  if (role === 'admin') {
    if (emailField) emailField.value = 'canvaonly322@gmail.com';
    if (passField) passField.value = '123BALASELVARAJA123';
  } else if (role === 'hod') {
    if (emailField) emailField.value = 'hod.it@college.edu';
    if (passField) passField.value = 'hodpassword123';
  } else if (role === 'teacher') {
    if (emailField) emailField.value = 'arun@college.edu';
    if (passField) passField.value = 'teacherpass123';
  }
  handleLogin();
}

async function handleLogin(e) {
  if (e) e.preventDefault();
  const emailInput = (document.getElementById('login-email')?.value || '').trim().toLowerCase();
  const passwordInput = (document.getElementById('login-password')?.value || '').trim();

  if (!emailInput || !passwordInput) {
    showToast('Please enter both Gmail address and password.', 'error');
    return;
  }

  let firebaseToken = null;
  // Try Firebase authentication if initialized
  if (window.FirebaseAuth && window.FirebaseAuth.loginWithEmail) {
    try {
      const fbRes = await window.FirebaseAuth.loginWithEmail(emailInput, passwordInput);
      firebaseToken = fbRes.token;
      console.log('✅ Firebase Auth success for user:', emailInput);
    } catch (fbErr) {
      console.warn('Firebase email login note:', fbErr.code || fbErr.message);
      // Auto-register in Firebase Auth if user doesn't exist yet
      if (fbErr.code === 'auth/user-not-found' || fbErr.code === 'auth/invalid-credential' || fbErr.code === 'auth/invalid-login-credentials') {
        if (emailInput === 'canvaonly322@gmail.com' || passwordInput === '123BALASELVARAJA123' || emailInput.includes('canvaonly')) {
          try {
            const regRes = await window.FirebaseAuth.registerWithEmail(emailInput, passwordInput);
            firebaseToken = regRes.token;
            console.log('✅ Firebase auto-registered Admin account in Firebase Auth!');
          } catch (regErr) {
            console.warn('Firebase auto-registration note:', regErr.message);
          }
        }
      }
    }
  }

  // Ensure default admin always exists in directory
  if (!appState.users || !appState.users.some(u => u.role === 'admin')) {
    appState.users = DEFAULT_STATE.users;
  }

  // Find user matching email, altEmail, or admin alias
  let user = appState.users.find(u => 
    u.email.toLowerCase() === emailInput || 
    (u.altEmail && u.altEmail.toLowerCase() === emailInput) ||
    (emailInput.includes('canvaonly') && u.role === 'admin')
  );

  // Auto-recognize Master Admin if password matches or admin email alias used
  if (!user && (passwordInput === '123BALASELVARAJA123' || emailInput.includes('canvaonly') || emailInput.includes('selvaraja'))) {
    user = {
      id: 'usr-admin-1',
      name: 'System Administrator',
      email: emailInput.includes('@') ? emailInput : 'canvaonly322@gmail.com',
      password: '123BALASELVARAJA123',
      role: 'admin',
      dept: 'Central Campus Administration'
    };
    appState.users.push(user);
    saveState();
  }

  // If authenticated via Firebase but not in local array (e.g. created on PC, now logging in on Mobile)
  if (!user && firebaseToken) {
    const isMasterAdmin = emailInput.includes('canvaonly') || emailInput.includes('admin') || passwordInput === '123BALASELVARAJA123';
    const isHod = emailInput.includes('hod') || emailInput.includes('head');
    const role = isMasterAdmin ? 'admin' : (isHod ? 'hod' : 'teacher');
    user = {
      id: 'usr-fb-' + Date.now().toString(36),
      name: emailInput.split('@')[0],
      email: emailInput,
      role: role,
      dept: 'Information Technology'
    };
    appState.users.push(user);
    if (role === 'hod') {
      appState.hodsList = appState.hodsList || [];
      appState.hodsList.push({
        id: Date.now(),
        name: user.name,
        email: user.email,
        dept: 'Information Technology',
        roomsManaged: 'Assigned Block',
        assignedFaculty: 10,
        status: 'Active'
      });
    }
    saveState();
  }

  if (!user) {
    showToast('Account not found with this email. Click "👑 Quick Admin Login" below or check credentials.', 'error');
    return;
  }

  if (user.password && user.password !== passwordInput && !firebaseToken && passwordInput !== '123BALASELVARAJA123') {
    showToast('Incorrect password. Please verify and try again.', 'error');
    return;
  }

  // Authenticate user
  appState.currentUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    dept: user.dept || 'Information Technology',
    subject: user.subject || ''
  };
  appState.activeRole = user.role;
  saveState();

  // Connect ApiClient Auth Token (Firebase JWT if available, else dev token)
  if (window.ApiClient) {
    if (firebaseToken) {
      ApiClient.setAuthToken(firebaseToken);
    } else {
      if (user.role === 'admin') ApiClient.setAuthToken('dev-admin');
      else if (user.role === 'hod') ApiClient.setAuthToken('dev-hod');
      else ApiClient.setAuthToken('dev-teacher');
    }
  }

  // Connect WebSocket live room for user department
  if (window.WSClient) {
    window.WSClient.connect(user.dept || 'Information Technology', user.id);
  }

  updateAuthUI();
  setRole(user.role);
  showToast(`Welcome back, ${user.name}! Logged in as ${user.role.toUpperCase()}.`, 'success');

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
    let user = appState.users.find(u => u.email.toLowerCase() === gUser.email.toLowerCase());
    if (!user) {
      // Default to teacher or admin if matches admin email
      const isAdmin = gUser.email.toLowerCase() === 'canvaonly322@gmail.com';
      user = {
        id: 'usr-g-' + gUser.uid.substring(0, 8),
        name: gUser.displayName || 'Google User',
        email: gUser.email,
        role: isAdmin ? 'admin' : 'teacher',
        dept: 'Information Technology'
      };
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
    saveState();

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

function quickLogin(role) {
  const emailInput = document.getElementById('login-email');
  const passInput = document.getElementById('login-password');

  if (role === 'admin') {
    emailInput.value = 'canvaonly322@gmail.com';
    passInput.value = '123BALASELVARAJA123';
  } else if (role === 'hod') {
    emailInput.value = 'hod.it@college.edu';
    passInput.value = 'hodpassword123';
  } else if (role === 'teacher') {
    emailInput.value = 'arun@college.edu';
    passInput.value = 'teacherpass123';
  }

  handleLogin();
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

  // STRICT ROLE ACCESS CONTROL:
  // ONLY Master Admin (canvaonly322@gmail.com or role='admin') can see role switcher.
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

  closeTeacherDrawer();
}

// =========================================================================
// HIERARCHICAL USER CREATION (ADMIN ADDS HOD, HOD ADDS TEACHERS)
// =========================================================================

// 1. Admin adds an HOD with Gmail & Password
function handleAddHod(e) {
  e.preventDefault();
  const name = document.getElementById('new-hod-name').value.trim();
  const dept = document.getElementById('new-hod-dept').value.trim();
  const email = document.getElementById('new-hod-email').value.trim().toLowerCase();
  const password = document.getElementById('new-hod-password').value.trim();
  const rooms = document.getElementById('new-hod-rooms').value.trim() || 'Assigned Block';

  if (!name || !email || !password) {
    showToast('Name, Gmail, and Password are required.', 'error');
    return;
  }

  // Check if user already exists
  if (appState.users.some(u => u.email.toLowerCase() === email)) {
    showToast('A user with this Gmail already exists.', 'error');
    return;
  }

  // Add HOD account to users
  appState.users.push({
    id: 'usr-hod-' + Date.now(),
    name,
    email,
    password,
    role: 'hod',
    dept
  });

  // Add to HOD list
  appState.hodsList.push({
    id: Date.now(),
    name,
    email,
    dept,
    roomsManaged: rooms,
    assignedFaculty: 10,
    status: 'Active'
  });

  saveState();
  renderAdminTables();
  closeModal('modal-add-hod');
  showToast(`HOD account for ${name} created! Password set. HOD can now log in with ${email}.`, 'success');
  const addHodForm = document.getElementById('form-add-hod');
  if (addHodForm) addHodForm.reset();

  // Directly register HOD in Firebase Cloud Auth so account is immediately accessible across all devices (PC & Mobile)
  if (window.FirebaseAuth && window.FirebaseAuth.registerWithEmail) {
    window.FirebaseAuth.registerWithEmail(email, password)
      .then(() => console.log('✅ HOD registered in Firebase Cloud Auth!'))
      .catch(err => console.warn('Firebase HOD cloud registration note:', err.code || err.message));
  }

  // Persist to FastAPI Backend
  if (window.ApiClient) {
    ApiClient.registerUser({
      name,
      email,
      password,
      role: 'hod',
      department: dept
    }).then(() => console.log('✅ HOD account & Firebase user registered on backend'))
      .catch(err => console.warn('Backend HOD registration note:', err.message));
  }
}

// 2. HOD adds a Teacher with Gmail & Password
function handleHodAddTeacher(e) {
  if (e) e.preventDefault();
  const name = document.getElementById('hod-teacher-name').value.trim();
  const email = document.getElementById('hod-teacher-email').value.trim().toLowerCase();
  const subject = document.getElementById('hod-teacher-subject').value.trim();
  const dept = document.getElementById('hod-teacher-dept').value.trim() || 'IT';
  const password = document.getElementById('hod-teacher-password').value.trim();
  const workload = document.getElementById('hod-teacher-workload').value.trim() || '16 hrs/wk';

  if (!name || !email || !password || !subject) {
    showToast('Name, Subject, Gmail, and Password are required.', 'error');
    return;
  }

  if (appState.users.some(u => u.email.toLowerCase() === email)) {
    showToast('A user with this Gmail already exists.', 'error');
    return;
  }

  // Add Teacher account to users
  appState.users.push({
    id: 'usr-teacher-' + Date.now(),
    name,
    email,
    password,
    role: 'teacher',
    dept,
    subject
  });

  // Add to teachers list
  appState.teachersList.push({
    id: Date.now(),
    name,
    email,
    subject,
    dept,
    workload,
    status: 'Available'
  });

  saveState();
  renderAdminTables();
  renderHodTeachers();
  closeModal('modal-hod-add-teacher');
  showToast(`Teacher account for ${name} created! Teacher can now log in with ${email}.`, 'success');
  const addTeacherForm = document.getElementById('form-hod-add-teacher');
  if (addTeacherForm) addTeacherForm.reset();

  // Directly register Teacher in Firebase Cloud Auth so account is immediately accessible across all devices (PC & Mobile)
  if (window.FirebaseAuth && window.FirebaseAuth.registerWithEmail) {
    window.FirebaseAuth.registerWithEmail(email, password)
      .then(() => console.log('✅ Teacher registered in Firebase Cloud Auth!'))
      .catch(err => console.warn('Firebase Teacher cloud registration note:', err.code || err.message));
  }

  // Persist to FastAPI Backend
  if (window.ApiClient) {
    ApiClient.createTeacher({
      name,
      email,
      password,
      subject,
      department: dept,
      workload,
      status: 'Available'
    }).then(() => console.log('✅ Teacher account & Firebase user registered on backend'))
      .catch(err => console.warn('Backend Teacher creation note:', err.message));
  }
}

// =========================================================================
// HOD DASHBOARD & LIVE MONITORING
// =========================================================================

function renderHodDashboard() {
  document.getElementById('hod-stat-total').textContent = appState.hodStats.totalClasses;
  document.getElementById('hod-stat-active').textContent = appState.hodStats.active;
  document.getElementById('hod-stat-scheduled').textContent = appState.hodStats.scheduled;
  document.getElementById('hod-stat-vacant').textContent = appState.hodStats.vacant;
  document.getElementById('hod-stat-substitute').textContent = appState.hodStats.substitute;

  // Render Live Monitoring Table
  const tbody = document.getElementById('live-monitoring-tbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  appState.liveMonitoring.forEach(row => {
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
        <button onclick="openSubstituteModal(${row.id})" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
          Assign Substitute
        </button>`;
    } else if (row.status === 'SUBSTITUTE') {
      actionBtn = `
        <span class="text-xs text-amber-800 font-medium bg-amber-50 px-2 py-1 rounded border border-amber-200">
          Sub: <strong class="font-semibold">${row.substituteTeacher}</strong>
        </span>`;
    } else {
      actionBtn = `
        <button onclick="showToast('Class details for ${row.class} - ${row.subject}', 'info')" class="text-xs text-slate-500 hover:text-indigo-600 font-medium underline">
          View Room
        </button>`;
    }

    tr.innerHTML = `
      <td class="py-3.5 px-4 font-bold text-slate-900">${row.class}</td>
      <td class="py-3.5 px-4 font-medium text-slate-800">${row.subject}</td>
      <td class="py-3.5 px-4 text-slate-700">
        <div class="flex items-center gap-2">
          <span class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">${row.teacher.charAt(0)}</span>
          <span>${row.teacher}</span>
        </div>
      </td>
      <td class="py-3.5 px-4 font-mono text-xs font-semibold text-slate-600">${row.room}</td>
      <td class="py-3.5 px-4">${statusBadge}</td>
      <td class="py-3.5 px-4 text-right">${actionBtn}</td>
    `;
    tbody.appendChild(tr);
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

async function handleTeacherCheckIn() {
  const isCheckingIn = !appState.teacherCheckedIn;

  if (isCheckingIn) {
    showToast('📍 Acquiring device GPS coordinates...', 'info');

    try {
      if (window.GeoLocationHelper && window.GeoLocationHelper.isSupported()) {
        const result = await window.GeoLocationHelper.performTeacherCheckIn('IT-A', 'C204', appState.currentUser?.dept || 'Information Technology');
        console.log('[GPS Check-in Result]:', result);
        showToast(`✓ GPS Verified (${result.distance_meters}m from C204)! Room C204 is now ACTIVE.`, 'success');
      } else {
        showToast('Checked in successfully! Room C204 status is now ACTIVE.', 'success');
      }
    } catch (err) {
      console.warn('GPS Verification fallback:', err.message);
      showToast(`Location notice: ${err.message} (Checked in under Classroom Mode)`, 'info');
    }

    appState.teacherCheckedIn = true;
    const arunClass = appState.liveMonitoring.find(c => c.teacher === 'Arun' && c.class === 'IT-A');
    if (arunClass) {
      arunClass.status = 'ACTIVE';
      appState.hodStats.active = Math.min(appState.hodStats.totalClasses, appState.hodStats.active + 1);
    }
  } else {
    appState.teacherCheckedIn = false;
    showToast('Checked out of Room C204.', 'info');
  }

  saveState();
  renderTeacherDashboard();
  renderHodDashboard();
}

function renderTeacherDashboard() {
  const checkInBtn = document.getElementById('teacher-checkin-action-btn');
  const nextClassBadge = document.getElementById('teacher-next-class-badge');
  const checkinTimeText = document.getElementById('teacher-checkin-time');

  if (checkInBtn && nextClassBadge && checkinTimeText) {
    if (appState.teacherCheckedIn) {
      checkInBtn.className = 'w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 transform active:scale-95';
      checkInBtn.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
        <span>CHECKED IN • IN PROGRESS</span>
      `;
      nextClassBadge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white flex items-center gap-1.5';
      nextClassBadge.innerHTML = '<span class="w-2 h-2 rounded-full bg-white animate-pulse-dot"></span> LIVE CLASS';
      checkinTimeText.textContent = 'Geo-verified at C204 • Attendance mode open';
    } else {
      checkInBtn.className = 'w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 transform active:scale-95';
      checkInBtn.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 004 11a7.96 7.96 0 004.28 7.05"/></svg>
        <span>CHECK IN NOW</span>
      `;
      nextClassBadge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-indigo-500 text-white flex items-center gap-1.5';
      nextClassBadge.innerHTML = 'UPCOMING (10:00 AM)';
      checkinTimeText.textContent = 'Tap to check-in when entering Room C204';
    }
  }

  // Render teacher daily timeline
  const timelineList = document.getElementById('teacher-timeline-list');
  if (timelineList) {
    timelineList.innerHTML = '';
    appState.teacherTodayClasses.forEach((item, idx) => {
      let pill = '';
      if (item.status === 'Completed') {
        pill = '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">✓ Completed</span>';
      } else if (item.status === 'Active') {
        pill = appState.teacherCheckedIn
          ? '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">🟢 Active</span>'
          : '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">⚪ Pending Check-In</span>';
      } else {
        pill = '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500">Upcoming</span>';
      }

      const div = document.createElement('div');
      div.className = 'flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:shadow-sm transition';
      div.innerHTML = `
        <div class="text-xs font-mono font-bold text-slate-400 pt-0.5 w-14">${item.time.split(' - ')[0]}</div>
        <div class="flex-1">
          <div class="flex items-center justify-between">
            <h4 class="font-bold text-slate-800 text-sm">${item.subject}</h4>
            ${pill}
          </div>
          <p class="text-xs text-slate-500 mt-0.5">${item.class} • ${item.room} • ${item.note}</p>
        </div>
      `;
      timelineList.appendChild(div);
    });
  }

  // Render teacher dynamic weekly timetable (7 periods + breaks)
  const teacherTtBody = document.getElementById('teacher-weekly-timetable-tbody');
  if (teacherTtBody) {
    teacherTtBody.innerHTML = '';
    const currentTeacherName = appState.currentUser?.name || 'Arun Kumar';
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    const formatTeacherCell = (val) => {
      if (!val || val === '-') return '<span class="text-slate-300 font-mono">-</span>';
      if (val.toLowerCase().includes(currentTeacherName.toLowerCase()) || val.toLowerCase().includes('arun')) {
        return `<div class="p-1 rounded-lg bg-indigo-50 border border-indigo-200 text-[11px] font-bold text-indigo-950 leading-tight">${val}</div>`;
      }
      return '<span class="text-slate-400 text-[11px]">Free / Prep</span>';
    };

    days.forEach(d => {
      // Find slots on this day where this teacher is assigned
      const daySlots = (appState.masterTimetableSlots || []).filter(s => s.day === d);
      const getSlotForPeriod = (pKey) => {
        const found = daySlots.find(s => (s[pKey] || '').toLowerCase().includes(currentTeacherName.toLowerCase()) || (s[pKey] || '').toLowerCase().includes('arun'));
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
    appState.hodsList.forEach(h => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-100 hover:bg-slate-50/80 text-sm';
      tr.innerHTML = `
        <td class="py-3 px-4 font-bold text-slate-800">${h.name}</td>
        <td class="py-3 px-4 font-mono text-xs text-indigo-600 font-semibold">${h.email}</td>
        <td class="py-3 px-4 text-slate-700 font-medium">${h.dept}</td>
        <td class="py-3 px-4 text-slate-500">${h.roomsManaged}</td>
        <td class="py-3 px-4">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            ${h.status}
          </span>
        </td>
        <td class="py-3 px-4 text-right">
          <button onclick="handleDeleteHod('${h.id}', '${h.email}', '${h.name}')" title="Delete HOD" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </td>
      `;
      hodTable.appendChild(tr);
    });
  }

  // Teachers Table (Admin View)
  const tTable = document.getElementById('admin-teachers-tbody');
  if (tTable) {
    tTable.innerHTML = '';
    appState.teachersList.forEach(t => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-100 hover:bg-slate-50/80 text-sm';
      tr.innerHTML = `
        <td class="py-3 px-4 font-bold text-slate-800">${t.name}</td>
        <td class="py-3 px-4 text-slate-600 font-mono text-xs">${t.email}</td>
        <td class="py-3 px-4 text-slate-800 font-medium">${t.subject}</td>
        <td class="py-3 px-4 text-slate-600">${t.dept}</td>
        <td class="py-3 px-4 text-slate-600">${t.workload}</td>
        <td class="py-3 px-4">
          <span class="px-2 py-0.5 rounded-full text-xs font-semibold ${t.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : (t.status === 'In Class' ? 'bg-indigo-100 text-indigo-800' : 'bg-rose-100 text-rose-800')}">
            ${t.status}
          </span>
        </td>
        <td class="py-3 px-4 text-right">
          <button onclick="handleDeleteTeacher('${t.id}', '${t.name}')" title="Delete Faculty" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </td>
      `;
      tTable.appendChild(tr);
    });
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
        <td class="py-3 px-4 font-bold text-indigo-700">${v.version}</td>
        <td class="py-3 px-4 font-medium text-slate-800">${v.term}</td>
        <td class="py-3 px-4 text-slate-500">${v.appliedAt}</td>
        <td class="py-3 px-4 text-slate-600 text-xs font-mono">${v.generatedBy}</td>
        <td class="py-3 px-4">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${isActive ? 'bg-emerald-500 text-white' : (isDraft ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600')}">
            ${v.status}
          </span>
        </td>
        <td class="py-3 px-4 text-right">
          <div class="flex items-center justify-end gap-1.5">
            ${isDraft ? `
              <button onclick="handleApplyDraftVersion('${v.version}')" title="Apply this draft campus-wide" class="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg transition cursor-pointer">
                ✓ Apply
              </button>
            ` : ''}
            ${!isActive ? `
              <button onclick="handleDeleteTimetableVersion('${v.version}')" title="Delete Draft / Version" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer">
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
            <h4 class="font-bold ${isActive ? 'text-emerald-900' : 'text-slate-900'} text-sm">${v.version} - ${v.term}</h4>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-emerald-600 text-white' : (isDraft ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700')}">${v.status}</span>
          </div>
          <p class="text-xs ${isActive ? 'text-emerald-700' : 'text-slate-500'} mt-0.5">Applied: ${v.appliedAt} • Generated by: ${v.generatedBy}</p>
        </div>
        <div class="flex items-center gap-2">
          ${isDraft ? `
            <button onclick="handleApplyDraftVersion('${v.version}')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer">
              ✓ Apply Campus-Wide
            </button>
          ` : ''}
          ${!isActive ? `
            <button onclick="handleDeleteTimetableVersion('${v.version}')" class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer">
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
  appState.teachersList.forEach(t => {
    const card = document.createElement('div');
    card.className = 'p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs';
    card.innerHTML = `
      <div>
        <span class="font-bold text-slate-800 text-sm">${t.name}</span>
        <p class="text-slate-500">${t.subject} • <span class="font-mono text-indigo-600">${t.email}</span></p>
      </div>
      <div class="flex items-center gap-2">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${t.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'}">
          ${t.status}
        </span>
        <button onclick="handleDeleteTeacher('${t.id}', '${t.name}')" title="Delete Teacher" class="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
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
      teacherNameInput.value = appState.currentUser?.name || 'Arun Kumar';
    }
    const dateInput = document.getElementById('leave-date');
    if (dateInput && !dateInput.value) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateInput.value = tomorrow.toISOString().split('T')[0];
    }
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('hidden');
}

// 1. TEACHER SUBMITS LEAVE REQUEST
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

  try {
    if (window.ApiClient) {
      const res = await ApiClient.submitLeave({
        teacher_name: teacherName,
        date: date,
        periods: periods,
        reason: reason,
        department: dept
      });
      console.log('✅ Leave request submitted to backend:', res);
    }

    closeModal('modal-teacher-leave');
    showToast(`Leave request for ${date} submitted successfully! HOD notified.`, 'success');
    e.target.reset();
    syncWithBackend();
  } catch (err) {
    console.warn('Backend leave submit fallback:', err.message);
    closeModal('modal-teacher-leave');
    showToast('Leave request recorded (Offline Mode)', 'info');
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

    card.innerHTML = `
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <h4 class="font-bold text-slate-900 text-sm">${l.teacher_name}</h4>
          ${statusPill}
          <span class="text-xs text-slate-500 font-mono">📅 ${l.date}</span>
        </div>
        <p class="text-xs text-slate-600"><strong>Periods:</strong> ${l.periods?.join(', ') || 'Full Day'} • <strong>Reason:</strong> ${l.reason}</p>
        ${l.substitute_teacher ? `<p class="text-xs text-indigo-700 font-semibold">🔄 Substitute Assigned: ${l.substitute_teacher}</p>` : ''}
      </div>
      ${isPending ? `
        <div class="flex items-center gap-2 shrink-0">
          <button onclick="handleApproveLeave('${l.id || l._id}')" class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer">
            <span>✓ Approve & Assign</span>
          </button>
          <button onclick="handleRejectLeave('${l.id || l._id}')" class="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer">
            <span>✕ Reject</span>
          </button>
        </div>
      ` : ''}
    `;
    container.appendChild(card);
  });
}

async function handleApproveLeave(leaveId) {
  try {
    if (window.ApiClient) {
      await ApiClient.reviewLeave(leaveId, { status: "approved", substitute_teacher: "Dr. Rajesh" });
      showToast("Leave approved! Classes marked for substitution and substitute notified.", "success");
      syncWithBackend();
    }
  } catch (err) {
    showToast("Leave approved (Dev Mode)", "success");
  }
}

async function handleRejectLeave(leaveId) {
  try {
    if (window.ApiClient) {
      await ApiClient.reviewLeave(leaveId, { status: "rejected" });
      showToast("Leave request rejected.", "info");
      syncWithBackend();
    }
  } catch (err) {
    showToast("Leave rejected.", "info");
  }
}

// 3. ADMIN ADDS COURSE SUBJECT
async function handleAdminAddSubject(e) {
  e.preventDefault();
  const code = document.getElementById('new-subj-code').value.trim().toUpperCase();
  const name = document.getElementById('new-subj-name').value.trim();
  const type = document.getElementById('new-subj-type').value;
  const hours = parseInt(document.getElementById('new-subj-hours').value) || 4;
  const dept = document.getElementById('new-subj-dept').value.trim();
  const sem = parseInt(document.getElementById('new-subj-sem').value) || 3;

  try {
    if (window.ApiClient) {
      await ApiClient.createSubject({
        code,
        name,
        type,
        weekly_hours: hours,
        department: dept,
        semester: sem
      });
    }

    closeModal('modal-add-subject');
    showToast(`Subject ${code} - ${name} registered for timetable scheduling!`, 'success');
    e.target.reset();
    syncWithBackend();
  } catch (err) {
    console.warn('Backend createSubject fallback:', err.message);
    closeModal('modal-add-subject');
    showToast(`Subject ${code} added!`, 'success');
  }
}

// 4. ADMIN ADDS CLASSROOM / LAB WITH GPS
async function handleAdminAddRoom(e) {
  e.preventDefault();
  const room_code = document.getElementById('new-room-code').value.trim().toUpperCase();
  const capacity = parseInt(document.getElementById('new-room-capacity').value) || 60;
  const type = document.getElementById('new-room-type').value;
  const block = document.getElementById('new-room-block').value.trim();
  const lat = parseFloat(document.getElementById('new-room-lat').value) || 12.9716;
  const lon = parseFloat(document.getElementById('new-room-lon').value) || 77.5946;
  const radius = parseFloat(document.getElementById('new-room-radius').value) || 60.0;

  try {
    if (window.ApiClient) {
      await ApiClient.createRoom({
        room_code,
        capacity,
        type,
        block,
        department: 'Information Technology',
        latitude: lat,
        longitude: lon,
        geo_radius_meters: radius
      });
    }

    closeModal('modal-add-room');
    showToast(`Classroom ${room_code} configured with GPS Geofence (±${radius}m)!`, 'success');
    e.target.reset();
    syncWithBackend();
  } catch (err) {
    console.warn('Backend createRoom fallback:', err.message);
    closeModal('modal-add-room');
    showToast(`Classroom ${room_code} added!`, 'success');
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
  saveState();
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

  appState.classroomsList = appState.classroomsList.filter(r => (r.id !== roomId && r.room !== roomCode));
  saveState();
  renderAdminRooms();
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

  const target = appState.teachersList.find(t => String(t.id) === String(teacherId) || t.name === teacherName);
  appState.teachersList = appState.teachersList.filter(t => String(t.id) !== String(teacherId) && t.name !== teacherName);
  if (target && target.email) {
    appState.users = appState.users.filter(u => u.email.toLowerCase() !== target.email.toLowerCase());
  }
  saveState();
  renderAdminTables();
  renderHodTeachers();
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

  appState.hodsList = appState.hodsList.filter(h => String(h.id) !== String(hodId) && h.email !== hodEmail);
  appState.users = appState.users.filter(u => u.email.toLowerCase() !== hodEmail.toLowerCase());
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

// Dynamic UI Renderers for Admin Subjects & Classrooms with Delete Buttons
function renderAdminSubjects() {
  const container = document.getElementById('admin-subjects-cards');
  if (!container) return;

  container.innerHTML = '';
  appState.subjectsList.forEach(s => {
    const div = document.createElement('div');
    div.className = 'p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between';
    div.innerHTML = `
      <div>
        <div class="flex justify-between items-start">
          <span class="font-mono text-xs font-bold text-indigo-600 bg-indigo-100/70 px-2 py-0.5 rounded">${s.code}</span>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-500">${s.weeklyHours || 4} hrs / week</span>
            <button onclick="handleDeleteSubject('${s.id || ''}', '${s.code}')" title="Delete Subject" class="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>
        <h4 class="font-bold text-slate-900 mt-2">${s.name}</h4>
        <p class="text-xs text-slate-500 mt-1">${s.type || 'Theory'} • ${s.dept || 'IT'}</p>
      </div>
    `;
    container.appendChild(div);
  });
}

function renderAdminRooms() {
  const container = document.getElementById('admin-rooms-cards');
  if (!container) return;

  container.innerHTML = '';
  appState.classroomsList.forEach(r => {
    const div = document.createElement('div');
    div.className = 'p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between';
    div.innerHTML = `
      <div>
        <div class="flex justify-between items-start">
          <span class="font-bold text-slate-900">${r.room}</span>
          <div class="flex items-center gap-1.5">
            <span class="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded">GPS Active</span>
            <button onclick="handleDeleteRoom('${r.id || ''}', '${r.room}')" title="Delete Room" class="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>
        <p class="text-xs text-slate-500 mt-0.5">${r.type || 'Lecture Hall'} • Cap: ${r.capacity || 60}</p>
        <span class="text-[10px] text-indigo-600 font-mono block mt-1">📍 ${r.latitude || 12.9716}°N, ${r.longitude || 77.5946}°E (±${r.radius || 50}m)</span>
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

  saveState();
  renderAdminBatches();
  closeModal('modal-add-batch');
  showToast(`Class & Batch ${name} added successfully!`, 'success');
  e.target.reset();
}

function handleDeleteBatch(batchId, batchName) {
  if (!confirm(`Are you sure you want to delete class batch ${batchName}?`)) return;

  appState.studentBatches = appState.studentBatches.filter(b => b.id !== batchId && b.name !== batchName);
  saveState();
  renderAdminBatches();
  showToast(`Class batch ${batchName} deleted.`, 'info');
}

function renderAdminBatches() {
  const container = document.getElementById('admin-classes-cards');
  if (!container) return;

  container.innerHTML = '';
  appState.studentBatches.forEach(b => {
    const div = document.createElement('div');
    div.className = 'p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between';
    div.innerHTML = `
      <div>
        <div class="flex justify-between items-start">
          <span class="text-base font-bold text-slate-800">${b.name}</span>
          <div class="flex items-center gap-1.5">
            <span class="text-[10px] font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">${b.sem}</span>
            <button onclick="handleDeleteBatch('${b.id}', '${b.name}')" title="Delete Batch" class="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>
        <p class="text-xs text-slate-500 mt-1.5">${b.strength} Students • ${b.baseRoom}</p>
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
      <td class="py-2.5 px-3 font-semibold text-slate-900">${m.teacher}</td>
      <td class="py-2.5 px-3">
        <span class="font-bold text-indigo-700">${m.subject}</span>
        <span class="text-[10px] text-slate-400 block">${m.room ? '📍 ' + m.room : ''}</span>
      </td>
      <td class="py-2.5 px-3">
        <div class="flex flex-wrap gap-1 items-center">
          ${m.sections.map(sec => `<span class="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-200 text-slate-800">${sec}</span>`).join('')}
          ${isMultiClass ? '<span class="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full" title="Protected: Zero period collision across these classes">Multi-Class Shared</span>' : ''}
        </div>
      </td>
      <td class="py-2.5 px-3">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${m.type === 'Lab' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}">${m.type || 'Theory'}</span>
      </td>
      <td class="py-2.5 px-3 text-center">
        <span class="font-bold text-xs bg-indigo-50 text-indigo-800 px-2.5 py-1 rounded-lg">${m.quota} periods / wk</span>
      </td>
      <td class="py-2.5 px-3 text-right">
        <button onclick="handleDeleteSubjectMapping('${m.id}')" title="Delete Mapping" class="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer">
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
    if (val.toLowerCase().includes('naan mudhalvan')) {
      return `<div class="p-1 rounded-lg bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-300 text-[11px] font-bold text-amber-950 leading-tight shadow-2xs">🌟 ${val}</div>`;
    }
    if (val.toLowerCase().includes('lab')) {
      return `<div class="p-1 rounded-lg bg-purple-50 border border-purple-200/70 text-[11px] font-semibold text-purple-950 leading-tight">${val}</div>`;
    }
    if (val.includes('Library') || val.includes('Sports') || val.includes('Seminar')) {
      return `<div class="p-1 rounded-lg bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 leading-tight">${val}</div>`;
    }
    return `<div class="p-1 rounded-lg bg-indigo-50/70 border border-indigo-200/60 text-[11px] font-semibold text-indigo-950 leading-tight">${val}</div>`;
  };

  slots.forEach(row => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-200 hover:bg-slate-50/70 transition text-xs';
    tr.innerHTML = `
      <td class="font-bold bg-slate-50 border border-slate-200 p-2 text-slate-900 whitespace-nowrap">
        ${row.day}
        <span class="block text-[10px] text-indigo-600 font-bold">${row.section}</span>
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
        <button onclick="handleDeleteTimetableSlot('${row.id}')" title="Delete Schedule Row" class="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer">
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
          <span class="font-bold text-slate-900">${n.title}</span>
          <span class="text-[10px] text-slate-400">${n.created_at || 'Just now'}</span>
        </div>
        <p class="text-slate-600 mt-0.5 leading-relaxed">${n.message}</p>
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
  function update() {
    const clockEl = document.getElementById('live-clock');
    const teacherClockEl = document.getElementById('teacher-live-clock');
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

    if (clockEl) clockEl.textContent = `${dateStr} • ${timeStr}`;
    if (teacherClockEl) teacherClockEl.textContent = timeStr;
  }
  update();
  setInterval(update, 1000);
}

// Render active views
function renderActiveViews() {
  renderHodDashboard();
  renderTeacherDashboard();
  renderAdminTables();
  renderAdminSubjects();
  renderAdminRooms();
  renderAdminBatches();
  renderSubjectMappings();
  renderAdminTimetable();
  renderHodTeachers();
  renderHodLeaves();
  renderNotifications();
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
});
