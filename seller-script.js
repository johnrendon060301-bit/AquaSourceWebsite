/* ==========================================================================
   AQUASOURCE SELLER APPLICATION ENGINE (seller-script.js)
   ========================================================================== */

const ICONS = {
  box: '<svg class="svg-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
  truck: '<svg class="svg-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>',
  check: '<svg class="svg-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06A77D" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
  user: '<svg class="svg-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
  users: '<svg class="svg-ico" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
  chart: '<svg class="svg-ico" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>',
  pin: '<svg class="svg-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
  cancel: '<svg class="svg-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>',
  copy: '<svg class="svg-ico" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
  edit: '<svg class="svg-ico" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
  eye: '<svg class="svg-ico" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
  trash: '<svg class="svg-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
  phone: '<svg class="svg-ico" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>',
  mail: '<svg class="svg-ico" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',
  warning: '<svg class="svg-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
  ban: '<svg class="svg-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>',
  clock: '<svg class="svg-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
  bell: '<svg class="svg-ico" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>',
  hatchery: '<svg class="svg-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="9" y1="22" x2="9" y2="22.01"></line><line x1="15" y1="22" x2="15" y2="22.01"></line><line x1="10" y1="6" x2="14" y2="6"></line><line x1="10" y1="10" x2="14" y2="10"></line><line x1="10" y1="14" x2="14" y2="14"></line><line x1="10" y1="18" x2="14" y2="18"></line></svg>'
};

// Application State (Clean initial state; loaded dynamically from Firebase)
let currentUser = null;
let sellerProfile = null;
let orders = [];
let personnel = [];
let telemetry = [];
let notifications = [];

let activeOrderId = null;
let selectedPersonnel = null;
let selectedUnit = null;
let toastTimer = null;
let permitUploaded = false;
let permitFileBase64 = '';
let permitFileName = '';

/* =========================================================================
   APPLICATION INITIALIZATION
   ========================================================================= */

window.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Firebase
  if (typeof initSellerFirebase === 'function') {
    initSellerFirebase();
  }

  // 2. Listen to Firebase Auth state safely (Enforce Seller Role & Approval Status)
  if (typeof fbAuth !== 'undefined' && fbAuth) {
    fbAuth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          if (typeof fbFirestore !== 'undefined' && fbFirestore) {
            const docSnap = await fbFirestore.collection('sellers').doc(user.uid).get();
            if (docSnap.exists) {
              const profile = { id: docSnap.id, ...docSnap.data() };
              const status = (profile.status || '').toLowerCase();
              if (status === 'approved') {
                onSellerAuthenticated(user, profile);
                return;
              } else if (status === 'pending') {
                onSellerSignedOut();
                const errEl = document.getElementById('loginError');
                showAuthError(errEl, '⏳ Your seller registration is currently under review by BFAR Administrators. Please wait for account approval before logging in.');
                return;
              } else if (status === 'rejected') {
                onSellerSignedOut();
                const errEl = document.getElementById('loginError');
                const reasonText = profile.reason ? ` Reason: ${profile.reason}` : '';
                showAuthError(errEl, `⛔ Your seller registration was disapproved by BFAR Administrators.${reasonText}`);
                return;
              }
            }
          }
        } catch (e) {
          console.warn('Seller auth state check note:', e);
        }
        onSellerSignedOut();
      } else {
        onSellerSignedOut();
      }
    });
  } else {
    checkLocalSellerSession();
  }

  // 3. Bind Enter key on Login & Signup
  const loginPass = document.getElementById('loginPass');
  if (loginPass) {
    loginPass.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') handleLoginSubmit();
    });
  }

  // 4. Initialize Buyer & Destination Place Autocomplete Suggestions
  initOrderAutocomplete();

  // 5. Responsive Check
  checkResponsive();
  window.addEventListener('resize', checkResponsive);
});

/* =========================================================================
   AUTHENTICATION & LOGIN
   ========================================================================= */

async function handleLoginSubmit() {
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPass');
  const errEl = document.getElementById('loginError');
  const loginSuccess = document.getElementById('loginSuccess');
  const submitBtn = document.getElementById('loginSubmitBtn');

  const email = emailInput ? emailInput.value.trim() : '';
  const pass = passInput ? passInput.value : '';

  if (loginSuccess) loginSuccess.classList.remove('show');

  // Input Trappings
  if (!email) {
    showAuthError(errEl, 'Please enter your registered hatchery email address.');
    if (emailInput) emailInput.focus();
    return;
  }

  if (!validateEmail(email)) {
    showAuthError(errEl, 'Please enter a valid email address (e.g. seller@hatchery.ph).');
    if (emailInput) emailInput.focus();
    return;
  }

  if (!pass) {
    showAuthError(errEl, 'Please enter your password.');
    if (passInput) passInput.focus();
    return;
  }

  try {
    if (submitBtn) submitBtn.disabled = true;
    hideAuthError(errEl);
    showToast('Authenticating with Firebase…');

    if (typeof loginSellerFirebase === 'function') {
      const res = await loginSellerFirebase(email, pass);
      showToast('Signed in successfully!');
      onSellerAuthenticated(res.user, res.profile);
    }
  } catch (err) {
    console.error('Login error:', err);
    let msg = 'Invalid email or password. Please try again.';
    if (err.code === 'auth/user-not-found') {
      msg = 'No hatchery seller account found with this email.';
    } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-login-credentials') {
      msg = 'Incorrect password. Please try again or click "Forgot password?".';
    } else if (err.code === 'auth/invalid-email') {
      msg = 'Please enter a valid email address.';
    } else if (err.code === 'auth/too-many-requests') {
      msg = 'Too many failed login attempts. Please wait a moment or reset your password.';
    } else if (err.message) {
      msg = err.message;
    }
    showAuthError(errEl, msg);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

/* =========================================================================
   SIGNUP & HATCHERY REGISTRATION
   ========================================================================= */

function showSignup() {
  const loginScreen = document.getElementById('loginScreen');
  const signupScreen = document.getElementById('signupScreen');
  const errEl = document.getElementById('signupError');

  hideAuthError(errEl);
  if (loginScreen) loginScreen.style.display = 'none';
  if (signupScreen) signupScreen.style.display = 'flex';
}

function showLoginFromSignup() {
  const loginScreen = document.getElementById('loginScreen');
  const signupScreen = document.getElementById('signupScreen');
  const errEl = document.getElementById('loginError');

  hideAuthError(errEl);
  if (signupScreen) signupScreen.style.display = 'none';
  if (loginScreen) loginScreen.style.display = 'flex';
}

function handlePermitUpload(event) {
  const file = event.target.files ? event.target.files[0] : null;
  if (!file) return;

  // File Trappings: File type & size (max 5MB)
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!validTypes.includes(file.type)) {
    showToast('Please upload an image file (JPG, PNG, or WEBP).');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast('Permit image must be under 5MB.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    permitFileBase64 = e.target.result;
    permitFileName = file.name;
    permitUploaded = true;

    const placeholder = document.getElementById('permitPlaceholder');
    const preview = document.getElementById('permitPreview');
    const changeBtn = document.getElementById('permitChangeBtn');
    const uploadBox = document.getElementById('permitUploadBox');
    const nameEl = document.getElementById('permitFileName');

    if (placeholder) placeholder.style.display = 'none';
    if (preview) {
      preview.src = permitFileBase64;
      preview.style.display = 'block';
    }
    if (changeBtn) changeBtn.style.display = 'block';
    if (uploadBox) uploadBox.classList.add('has-image');
    if (nameEl) nameEl.textContent = '✓ ' + file.name;

    showToast('BFAR Permit image selected!');
  };
  reader.readAsDataURL(file);
}

async function handleSignupSubmit() {
  const nameInput = document.getElementById('signupHatchery');
  const emailInput = document.getElementById('signupEmail');
  const passInput = document.getElementById('signupPass');
  const confirmPassInput = document.getElementById('signupConfirmPass');
  const phoneInput = document.getElementById('signupPhone');
  const addressInput = document.getElementById('signupAddress');
  const errEl = document.getElementById('signupError');
  const submitBtn = document.getElementById('signupSubmitBtn');

  const hatcheryName = nameInput ? nameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim() : '';
  const pass = passInput ? passInput.value : '';
  const confirmPass = confirmPassInput ? confirmPassInput.value : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';
  const address = addressInput ? addressInput.value.trim() : '';

  // Complete Form Trappings
  if (!hatcheryName || hatcheryName.length < 3) {
    showAuthError(errEl, 'Please enter your registered Hatchery or Farm Business Name (at least 3 characters).');
    if (nameInput) nameInput.focus();
    return;
  }

  if (!email || !validateEmail(email)) {
    showAuthError(errEl, 'Please enter a valid administrator email address.');
    if (emailInput) emailInput.focus();
    return;
  }

  if (!pass || pass.length < 6) {
    showAuthError(errEl, 'Password must be at least 6 characters in length.');
    if (passInput) passInput.focus();
    return;
  }

  if (pass !== confirmPass) {
    showAuthError(errEl, 'Passwords do not match. Please re-enter your password.');
    if (confirmPassInput) confirmPassInput.focus();
    return;
  }

  if (!phone || phone.length < 7) {
    showAuthError(errEl, 'Please enter a valid contact phone number.');
    if (phoneInput) phoneInput.focus();
    return;
  }

  if (!address || address.length < 5) {
    showAuthError(errEl, 'Please enter your complete hatchery facility physical address.');
    if (addressInput) addressInput.focus();
    return;
  }

  if (!permitUploaded || !permitFileBase64) {
    showAuthError(errEl, 'Please upload a photo of your BFAR Fishpond/Hatchery Permit for verification.');
    return;
  }

  try {
    if (submitBtn) submitBtn.disabled = true;
    hideAuthError(errEl);
    showToast('Creating your hatchery account in Firebase…');

    if (typeof registerSellerFirebase === 'function') {
      await registerSellerFirebase({
        hatcheryName,
        email,
        password: pass,
        phone,
        address,
        permitDataUrl: permitFileBase64,
        permitFileName: permitFileName || 'bfar-permit.jpg'
      });

      // Sign out immediately so pending account cannot access app shell before approval
      if (typeof fbAuth !== 'undefined' && fbAuth) {
        try { await fbAuth.signOut(); } catch (e) {}
      }

      // Return to login screen with clear instructions
      showLoginFromSignup();

      const loginSuccess = document.getElementById('loginSuccess');
      if (loginSuccess) {
        loginSuccess.innerHTML = '<b>✅ Registration Submitted!</b><br>Your BFAR permit is now under review by BFAR Administrators. Please wait for account approval before logging in.';
        loginSuccess.classList.add('show');
      }

      const loginEmailInput = document.getElementById('loginEmail');
      if (loginEmailInput) loginEmailInput.value = email;

      showToast('Registration submitted! Awaiting BFAR Admin approval.');
    } else {
      showLoginFromSignup();
      showToast('Registration submitted! Awaiting BFAR Admin approval.');
    }
  } catch (err) {
    console.error('Registration error:', err);
    let msg = 'Could not complete registration. Please try again.';
    if (err.code === 'auth/email-already-in-use') {
      msg = 'An account with this email already exists. Please sign in instead.';
    } else if (err.code === 'auth/weak-password') {
      msg = 'Password is too weak. Please use at least 6 characters.';
    } else if (err.message) {
      msg = err.message;
    }
    showAuthError(errEl, msg);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

/* =========================================================================
   FORGOT PASSWORD MODAL (EMAIL RESET LINK)
   ========================================================================= */

function handleForgotPassword() {
  const loginEmailInput = document.getElementById('loginEmail');
  const fpEmailInput = document.getElementById('fpEmail');
  const initialEmail = loginEmailInput ? loginEmailInput.value.trim() : '';

  if (fpEmailInput && initialEmail) {
    fpEmailInput.value = initialEmail;
  }

  const errEl = document.getElementById('fpError');
  const successMsg = document.getElementById('fpSuccessMsg');
  const formContent = document.getElementById('fpFormContent');

  hideAuthError(errEl);
  if (successMsg) successMsg.style.display = 'none';
  if (formContent) formContent.style.display = 'block';

  const modal = document.getElementById('forgotPassModal');
  if (modal) modal.classList.add('active');
}

function closeForgotPassModal() {
  const modal = document.getElementById('forgotPassModal');
  if (modal) modal.classList.remove('active');
  const errEl = document.getElementById('fpError');
  hideAuthError(errEl);
}

async function handleSendResetLink() {
  const emailInput = document.getElementById('fpEmail');
  const btn = document.getElementById('fpSendLinkBtn');
  const errEl = document.getElementById('fpError');
  const email = emailInput ? emailInput.value.trim() : '';

  if (!email || !validateEmail(email)) {
    showAuthError(errEl, 'Please enter a valid administrator email address.');
    if (emailInput) emailInput.focus();
    return;
  }

  try {
    if (btn) btn.disabled = true;
    hideAuthError(errEl);
    showToast('Sending password reset link…');

    if (typeof sendSellerPasswordResetLink === 'function') {
      await sendSellerPasswordResetLink(email);
    }

    const successMsg = document.getElementById('fpSuccessMsg');
    const formContent = document.getElementById('fpFormContent');
    if (successMsg) successMsg.style.display = 'block';
    if (formContent) formContent.style.display = 'none';

    showToast('Password reset link sent to ' + email);
  } catch (err) {
    console.error('Password reset link error:', err);
    let msg = 'Failed to send reset email. Please try again.';
    if (err.code === 'auth/user-not-found') {
      msg = 'No hatchery seller account found with this email.';
    } else if (err.code === 'auth/invalid-email') {
      msg = 'Please enter a valid email format.';
    } else if (err.message) {
      msg = err.message;
    }
    showAuthError(errEl, msg);
  } finally {
    if (btn) btn.disabled = false;
  }
}

/* =========================================================================
   SESSION & STATE MANAGEMENT
   ========================================================================= */

function onSellerAuthenticated(user, profile) {
  currentUser = user;
  sellerProfile = profile || {
    id: user.uid,
    uid: user.uid,
    email: user.email,
    hatcheryName: user.displayName || user.email.split('@')[0],
    hatchery: user.displayName || user.email.split('@')[0],
    status: 'pending'
  };

  localStorage.setItem('aquasource_seller_auth', 'true');
  localStorage.setItem('aquasource_seller_email', user.email);

  showDashboardView(sellerProfile);

  // Subscribe to real-time collections for this seller in Firestore
  if (typeof subscribeSellerData === 'function') {
    subscribeSellerData(user.uid, {
      onProfile: (liveProfile) => {
        sellerProfile = { ...sellerProfile, ...liveProfile };
        renderProfileView();
        renderDashboardStats();
      },
      onOrders: (liveOrders) => {
        orders = liveOrders || [];
        renderOrdersView();
        renderDashboardStats();
        if (activeOrderId) updateMonitoringModalState();
      },
      onPersonnel: (livePersonnel) => {
        personnel = livePersonnel || [];
        renderPersonnelView();
      },
      onTelemetry: (liveTelemetry) => {
        telemetry = liveTelemetry || [];
        renderTelemetryView();
      },
      onNotifications: (liveNotifs) => {
        notifications = liveNotifs || [];
        renderNotificationsView();
      }
    });
  }
}

function onSellerSignedOut() {
  currentUser = null;
  sellerProfile = null;
  orders = [];
  personnel = [];
  telemetry = [];
  notifications = [];

  localStorage.removeItem('aquasource_seller_auth');
  localStorage.removeItem('aquasource_seller_email');
  window.location.href = 'index.html';
}

function checkLocalSellerSession() {
  const session = localStorage.getItem('aquasource_seller_auth');
  if (session !== 'true') {
    window.location.href = 'index.html';
    return;
  }
}

function showDashboardView(prof) {
  // Update Topbar and Sidebar Profile Avatar
  const farmName = (prof && (prof.farmName || prof.hatcheryName || prof.hatchery)) || 'Farm Owner';
  const ownerName = (prof && (prof.fullName || prof.applicant || (prof.firstName ? `${prof.firstName} ${prof.lastName}` : ''))) || farmName;
  const email = (prof && prof.email) || localStorage.getItem('aquasource_seller_email') || 'seller@aquasource.ph';

  const sidebarName = document.getElementById('sidebarHatcheryName');
  const sidebarEmail = document.getElementById('sidebarEmail');
  const sidebarAvatar = document.getElementById('sidebarAvatar');
  const welcomeHatchery = document.getElementById('welcomeHatcheryName');

  if (sidebarName) sidebarName.textContent = ownerName;
  if (sidebarEmail) sidebarEmail.textContent = email;
  if (welcomeHatchery) welcomeHatchery.textContent = farmName;
  if (sidebarAvatar) {
    const initials = ownerName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'FO';
    sidebarAvatar.textContent = initials;
  }

  renderAll();
  initMaps();
}

function openLogoutConfirm() {
  const modal = document.getElementById('logoutModal');
  if (modal) modal.classList.add('active');
}

function closeLogoutConfirm() {
  const modal = document.getElementById('logoutModal');
  if (modal) modal.classList.remove('active');
}

async function doLogout() {
  closeLogoutConfirm();
  if (typeof logoutSellerFirebase === 'function') {
    await logoutSellerFirebase();
  }
  onSellerSignedOut();
}

/* =========================================================================
   VIEW ROUTING & NAVIGATION
   ========================================================================= */

function showView(name, el) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById('view-' + name);
  if (target) target.classList.add('active');

  document.querySelectorAll('.side-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');

  const titles = {
    dashboard: 'Dashboard Overview',
    orders: 'Transport Orders',
    personnel: 'Transport Personnel',
    history: 'Telemetry History',
    notifications: 'Notifications',
    profile: 'Farm Profile'
  };

  const topTitle = document.getElementById('topbarTitle');
  if (topTitle) topTitle.textContent = titles[name] || 'AquaSource Seller';

  if (name === 'notifications') {
    const notifDot = document.getElementById('notifDot');
    if (notifDot) notifDot.style.display = 'none';
  }

  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.remove('open');
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.toggle('open');
}

function refreshSellerData() {
  showToast('Synchronizing with Firebase…');
  renderAll();
}

/* =========================================================================
   UI RENDERING (DYNAMIC DATA BINDINGS)
   ========================================================================= */

function renderAll() {
  renderDashboardStats();
  renderOrdersView();
  renderPersonnelView();
  renderTelemetryView();
  renderNotificationsView();
  renderProfileView();
}

function renderDashboardStats() {
  const preparing = orders.filter(o => o.status === 'preparing' || !o.status);
  const transit = orders.filter(o => o.status === 'transit');
  const delivered = orders.filter(o => o.status === 'delivered');

  const statActive = document.getElementById('statActive');
  const statTransit = document.getElementById('statTransit');
  const statDelivered = document.getElementById('statDelivered');
  const statTotal = document.getElementById('statTotal');

  if (statActive) statActive.textContent = preparing.length + transit.length;
  if (statTransit) statTransit.textContent = transit.length;
  if (statDelivered) statDelivered.textContent = delivered.length;
  if (statTotal) statTotal.textContent = orders.length;

  // Render recent orders on dashboard
  const dashOrdersList = document.getElementById('dashOrdersList');
  if (dashOrdersList) {
    if (orders.length === 0) {
      dashOrdersList.innerHTML = emptyNote(ICONS.box, 'No active transport orders yet. Click "+ New Transport Order" to create one.');
    } else {
      dashOrdersList.innerHTML = orders.slice(0, 4).map(renderOrderCard).join('');
    }
  }

  // Render registered personnel on dashboard
  const dashPersonnelList = document.getElementById('dashPersonnelList');
  if (dashPersonnelList) {
    if (personnel.length === 0) {
      dashPersonnelList.innerHTML = emptyNote(ICONS.users, 'No drivers registered yet. Click "+ Add Personnel" to register your transport team.');
    } else {
      dashPersonnelList.innerHTML = personnel.slice(0, 4).map(p => {
        const displayName = p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Driver';
        return `
          <div class="order-item" onclick="showView('personnel', document.querySelector('[data-view=personnel]'))">
            <div class="order-ico" style="display:flex; align-items:center; justify-content:center;">${ICONS.user}</div>
            <div class="order-mid">
              <div class="order-title">${escapeHtml(displayName)}</div>
              <div class="order-sub">${ICONS.phone} ${escapeHtml(p.phone || '—')} · ${ICONS.mail} ${escapeHtml(p.email || '—')}</div>
            </div>
            <span class="order-badge badge-delivered">ACTIVE</span>
          </div>
        `;
      }).join('');
    }
  }
}

function renderOrderCard(o) {
  const badgeClass = o.status === 'transit' ? 'badge-transit' : o.status === 'delivered' ? 'badge-delivered' : o.status === 'cancelled' ? 'badge-cancelled' : 'badge-preparing';
  const badgeLabel = o.status === 'transit' ? 'IN TRANSIT' : o.status === 'delivered' ? 'DELIVERED' : o.status === 'cancelled' ? 'CANCELLED' : 'PREPARING';
  const icoHtml = o.status === 'delivered' ? ICONS.check : (o.status === 'transit' ? ICONS.truck : ICONS.box);

  return `
    <div class="order-item" onclick="openOrderDetail('${o.id}')">
      <div class="order-ico" style="display:flex; align-items:center; justify-content:center;">${icoHtml}</div>
      <div class="order-mid">
        <div class="order-title">
          <span class="mono" style="font-weight:700;">#${o.code || 'AQS-0000'}</span>
          <button class="btn-copy-code" title="Copy tracking code" onclick="event.stopPropagation(); copyTrackingCode('${o.code}')">${ICONS.copy}</button>
          · ${escapeHtml(o.buyer || 'Buyer')}
        </div>
        <div class="order-sub">${escapeHtml(o.personnel || 'Unassigned')} · ${o.quantity || 0} pcs ${escapeHtml(o.species || 'Fingerlings')}</div>
      </div>
      <span class="order-badge ${badgeClass}">${badgeLabel}</span>
    </div>
  `;
}

/* =========================================================================
   ORDERS VIEW & CREATION
   ========================================================================= */

function renderOrdersView() {
  const grid = document.getElementById('ordersTableBody');
  if (!grid) return;

  if (orders.length === 0) {
    grid.innerHTML = `<tr><td colspan="7">${emptyNote(ICONS.box, 'No transport orders recorded. Click "+ New Transport Order" to create your first shipment.')}</td></tr>`;
    return;
  }

  grid.innerHTML = orders.map(o => {
    const badgeClass = o.status === 'transit' ? 'badge-transit' : o.status === 'delivered' ? 'badge-delivered' : o.status === 'cancelled' ? 'badge-cancelled' : 'badge-preparing';
    const badgeLabel = o.status === 'transit' ? 'IN TRANSIT' : o.status === 'delivered' ? 'DELIVERED' : o.status === 'cancelled' ? 'CANCELLED' : 'PREPARING';

    return `
      <tr onclick="openOrderDetail('${o.id}')">
        <td>
          <b class="mono">#${o.code || 'AQS-0000'}</b>
          <button class="btn-copy-code" title="Copy tracking code to share with buyer" onclick="event.stopPropagation(); copyTrackingCode('${o.code}')">${ICONS.copy}</button>
        </td>
        <td><b>${escapeHtml(o.buyer || '—')}</b><br><small class="faint">${escapeHtml(o.dest || '—')}</small></td>
        <td>${escapeHtml(o.personnel || '—')}</td>
        <td><span class="mono">${(o.unit && o.unit !== 'undefined' && o.unit.trim() !== '') ? o.unit : (o.status === 'cancelled' ? '—' : 'Pending Mobile Link')}</span></td>
        <td>${Number(o.quantity || 0).toLocaleString()} pcs</td>
        <td><span class="order-badge ${badgeClass}">${badgeLabel}</span></td>
        <td>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); openEditOrderModal('${o.id}')">${ICONS.edit} Edit</button>
            <button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); openOrderDetail('${o.id}')">${ICONS.eye} Monitor</button>
            ${o.status !== 'cancelled' && o.status !== 'delivered' ? `<button class="btn btn-sm btn-outline" style="color:var(--critical); border-color:var(--critical);" onclick="event.stopPropagation(); cancelOrder('${o.id}', '${escapeHtml(o.code || '')}')">${ICONS.cancel} Cancel</button>` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function copyTrackingCode(code) {
  if (!code) return;
  const cleanCode = String(code).trim();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(cleanCode).then(() => {
      showToast(`📋 Copied tracking code ${cleanCode} to clipboard! Share with buyer.`);
    }).catch(() => fallbackCopy(cleanCode));
  } else {
    fallbackCopy(cleanCode);
  }
}

function fallbackCopy(text) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast(`📋 Copied tracking code ${text} to clipboard!`);
  } catch (e) {
    prompt('Copy tracking code:', text);
  }
}

let editingOrderId = null;

function openEditOrderModal(id) {
  const o = orders.find(x => String(x.id) === String(id) || String(x.code) === String(id));
  if (!o) {
    showToast('Order not found.');
    return;
  }

  editingOrderId = o.id || o.code;

  const codeSub = document.getElementById('editOrderCodeSub');
  const buyerInput = document.getElementById('editOrderBuyer');
  const speciesInput = document.getElementById('editOrderSpecies');
  const qtyInput = document.getElementById('editOrderQty');
  const destInput = document.getElementById('editOrderDest');
  const driverInput = document.getElementById('editOrderPersonnel');

  if (codeSub) codeSub.textContent = `Tracking #${o.code || o.id}`;
  if (buyerInput) buyerInput.value = o.buyer || '';
  if (speciesInput) speciesInput.value = o.species || '';
  if (qtyInput) qtyInput.value = o.quantity || '';
  if (destInput) destInput.value = o.dest || '';
  if (driverInput) driverInput.value = o.personnel || '';

  const modal = document.getElementById('editOrderModal');
  if (modal) modal.classList.add('active');
  hideAllAutocomplete();
}

function closeEditOrderModal() {
  hideAllAutocomplete();
  const modal = document.getElementById('editOrderModal');
  if (modal) modal.classList.remove('active');
  editingOrderId = null;
}

async function saveEditedOrder() {
  if (!editingOrderId) return;

  const buyerInput = document.getElementById('editOrderBuyer');
  const speciesInput = document.getElementById('editOrderSpecies');
  const qtyInput = document.getElementById('editOrderQty');
  const destInput = document.getElementById('editOrderDest');
  const driverInput = document.getElementById('editOrderPersonnel');
  const btn = document.getElementById('editOrderSubmitBtn');

  const buyer = buyerInput ? buyerInput.value.trim() : '';
  const species = speciesInput ? speciesInput.value.trim() : 'Tilapia Fingerlings';
  const qty = qtyInput ? parseInt(qtyInput.value, 10) : 0;
  const dest = destInput ? destInput.value.trim() : '';
  const personnel = driverInput ? driverInput.value.trim() : '';

  if (!buyer || buyer.length < 2) {
    showToast('Please enter the buyer / farm name.');
    if (buyerInput) buyerInput.focus();
    return;
  }
  if (!qty || qty <= 0) {
    showToast('Please enter a valid quantity.');
    if (qtyInput) qtyInput.focus();
    return;
  }
  if (!dest || dest.length < 3) {
    showToast('Please enter the destination address.');
    if (destInput) destInput.focus();
    return;
  }

  try {
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Saving…';
    }

    const updatedFields = {
      buyer: buyer,
      species: species,
      quantity: qty,
      dest: dest,
      personnel: personnel || 'Transport Driver',
      updatedAt: new Date().toISOString()
    };

    if (typeof updateOrderFullFirebase === 'function') {
      await updateOrderFullFirebase(editingOrderId, updatedFields);
    }

    // Update local cache
    const idx = orders.findIndex(x => String(x.id) === String(editingOrderId) || String(x.code) === String(editingOrderId));
    if (idx !== -1) {
      orders[idx] = { ...orders[idx], ...updatedFields };
    }

    closeEditOrderModal();
    renderAll();
    showToast(`Order #${editingOrderId} updated successfully!`);
  } catch (err) {
    console.error('Error saving edited order:', err);
    showToast('Could not save changes: ' + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Save & Update Order';
    }
  }
}

/* =========================================================================
   GOOGLE MAPS STYLE PLACE AUTOCOMPLETE & PREDICTIONS
   ========================================================================= */

const GOOGLE_MAPS_PLACES = [
  { main: 'San Fernando', sub: 'Cebu' },
  { main: 'San Fernando', sub: 'Pampanga' },
  { main: 'San Francisco', sub: 'CA, USA' },
  { main: 'San Fernando', sub: 'Cebu City, Cebu' },
  { main: 'San Fernando el Rey Parish', sub: 'Liloan, Cebu' },
  { main: 'San Fernando', sub: 'La Union' },
  { main: 'San Fernando', sub: 'Bukidnon' },
  { main: 'San Francisco', sub: 'Camotes Islands, Cebu' },
  { main: 'San Francisco', sub: 'Agusan del Sur' },
  { main: 'San Jose', sub: 'Cebu City, Cebu' },
  { main: 'San Jose', sub: 'Dinagat Islands' },
  { main: 'San Jose', sub: 'Occidental Mindoro' },
  { main: 'San Jose', sub: 'Antique' },
  { main: 'San Jose', sub: 'CA, USA' },
  { main: 'San Diego', sub: 'CA, USA' },
  { main: 'San Antonio', sub: 'TX, USA' },
  { main: 'San Juan', sub: 'Metro Manila' },
  { main: 'San Juan', sub: 'La Union' },
  { main: 'San Juan', sub: 'Siquijor' },
  { main: 'San Mateo', sub: 'Rizal' },
  { main: 'San Pedro', sub: 'Laguna' },
  { main: 'San Pablo', sub: 'Laguna' },
  { main: 'San Remigio', sub: 'Cebu' },
  { main: 'San Remigio', sub: 'Antique' },
  { main: 'San Carlos City', sub: 'Negros Occidental' },
  { main: 'San Carlos City', sub: 'Pangasinan' },
  { main: 'Carcar', sub: 'Cebu' },
  { main: 'Carcar City', sub: 'Cebu' },
  { main: 'Carcar Rotunda', sub: 'Carcar City, Cebu' },
  { main: 'Valladolid', sub: 'Carcar City, Cebu' },
  { main: 'Tuyom', sub: 'Carcar City, Cebu' },
  { main: 'Liburon', sub: 'Carcar City, Cebu' },
  { main: 'Poblacion I', sub: 'Carcar City, Cebu' },
  { main: 'Poblacion II', sub: 'Carcar City, Cebu' },
  { main: 'Poblacion III', sub: 'Carcar City, Cebu' },
  { main: 'Bolinawan', sub: 'Carcar City, Cebu' },
  { main: 'Ocaña', sub: 'Carcar City, Cebu' },
  { main: 'Guadalupe', sub: 'Carcar City, Cebu' },
  { main: 'Can-asujan', sub: 'Carcar City, Cebu' },
  { main: 'Perrelos', sub: 'Carcar City, Cebu' },
  { main: 'Naga', sub: 'Cebu' },
  { main: 'Naga City', sub: 'Cebu' },
  { main: 'Colon', sub: 'Naga City, Cebu' },
  { main: 'Tinaan', sub: 'Naga City, Cebu' },
  { main: 'Inoburan', sub: 'Naga City, Cebu' },
  { main: 'Toledo', sub: 'Cebu' },
  { main: 'Toledo City', sub: 'Cebu' },
  { main: 'Bato', sub: 'Toledo City, Cebu' },
  { main: 'Barili', sub: 'Cebu' },
  { main: 'Japitan', sub: 'Barili, Cebu' },
  { main: 'Argao', sub: 'Cebu' },
  { main: 'Bogo', sub: 'Argao, Cebu' },
  { main: 'Balamban', sub: 'Cebu' },
  { main: 'Bogo', sub: 'Cebu' },
  { main: 'Bogo City', sub: 'Cebu' },
  { main: 'Danao', sub: 'Cebu' },
  { main: 'Danao City', sub: 'Cebu' },
  { main: 'Minglanilla', sub: 'Cebu' },
  { main: 'Poblacion Ward 1', sub: 'Minglanilla, Cebu' },
  { main: 'Talisay', sub: 'Cebu' },
  { main: 'Talisay City', sub: 'Cebu' },
  { main: 'SRP (South Road Properties)', sub: 'Cebu City, Cebu' },
  { main: 'Cebu City', sub: 'Cebu' },
  { main: 'Mandaue', sub: 'Cebu' },
  { main: 'Mandaue City', sub: 'Cebu' },
  { main: 'Lapu-Lapu City', sub: 'Cebu' },
  { main: 'Liloan', sub: 'Cebu' },
  { main: 'Consolacion', sub: 'Cebu' },
  { main: 'Compostela', sub: 'Cebu' },
  { main: 'Carmen', sub: 'Cebu' },
  { main: 'Catmon', sub: 'Cebu' },
  { main: 'Sogod', sub: 'Cebu' },
  { main: 'Medellin', sub: 'Cebu' },
  { main: 'Daanbantayan', sub: 'Cebu' },
  { main: 'Bantayan', sub: 'Bantayan Island, Cebu' },
  { main: 'Santa Fe', sub: 'Bantayan Island, Cebu' },
  { main: 'Madridejos', sub: 'Bantayan Island, Cebu' },
  { main: 'Dumanjug', sub: 'Cebu' },
  { main: 'Ronda', sub: 'Cebu' },
  { main: 'Alcantara', sub: 'Cebu' },
  { main: 'Moalboal', sub: 'Cebu' },
  { main: 'Badian', sub: 'Cebu' },
  { main: 'Alegria', sub: 'Cebu' },
  { main: 'Malabuyoc', sub: 'Cebu' },
  { main: 'Ginatilan', sub: 'Cebu' },
  { main: 'Samboan', sub: 'Cebu' },
  { main: 'Santander', sub: 'Cebu' },
  { main: 'Oslob', sub: 'Cebu' },
  { main: 'Boljoon', sub: 'Cebu' },
  { main: 'Alcoy', sub: 'Cebu' },
  { main: 'Dalaguete', sub: 'Cebu' },
  { main: 'Sibonga', sub: 'Cebu' },
  { main: 'Aloguinsan', sub: 'Cebu' },
  { main: 'Pinamungajan', sub: 'Cebu' },
  { main: 'Asturias', sub: 'Cebu' },
  { main: 'Tuburan', sub: 'Cebu' },
  { main: 'Tabuelan', sub: 'Cebu' },
  { main: 'Tabogon', sub: 'Cebu' },
  { main: 'Borbon', sub: 'Cebu' },
  { main: 'Cordova', sub: 'Cebu' },
  { main: 'Tagbilaran City', sub: 'Bohol' },
  { main: 'Panglao', sub: 'Bohol' },
  { main: 'Calape', sub: 'Bohol' },
  { main: 'Tubigon', sub: 'Bohol' },
  { main: 'Ubay', sub: 'Bohol' },
  { main: 'Talibon', sub: 'Bohol' },
  { main: 'Dumaguete City', sub: 'Negros Oriental' },
  { main: 'Bais City', sub: 'Negros Oriental' },
  { main: 'Tanjay City', sub: 'Negros Oriental' },
  { main: 'Bacolod City', sub: 'Negros Occidental' },
  { main: 'Iloilo City', sub: 'Iloilo' },
  { main: 'Roxas City', sub: 'Capiz' },
  { main: 'Kalibo', sub: 'Aklan' },
  { main: 'Tacloban City', sub: 'Leyte' },
  { main: 'Ormoc City', sub: 'Leyte' },
  { main: 'Manila', sub: 'Metro Manila' },
  { main: 'Quezon City', sub: 'Metro Manila' },
  { main: 'Makati', sub: 'Metro Manila' },
  { main: 'Pasig', sub: 'Metro Manila' },
  { main: 'Taguig', sub: 'Metro Manila' },
  { main: 'Davao City', sub: 'Davao del Sur' },
  { main: 'Cagayan de Oro', sub: 'Misamis Oriental' },
  { main: 'General Santos', sub: 'South Cotabato' },
  { main: 'Zamboanga City', sub: 'Zamboanga del Sur' },
  { main: 'Angeles City', sub: 'Pampanga' },
  { main: 'Baguio City', sub: 'Benguet' },
  { main: 'Dagupan City', sub: 'Pangasinan' }
];

function hideAllAutocomplete() {
  document.querySelectorAll('.autocomplete-dropdown').forEach(el => {
    el.style.display = 'none';
    el.innerHTML = '';
  });
}

function getGoogleMapsPlacePredictions(query) {
  const rawQ = (query || '').trim().toLowerCase();
  if (!rawQ || rawQ.length === 0) return [];

  const tokens = rawQ.split(/\s+/).filter(Boolean);
  const seen = new Set();
  const results = [];

  // Prefix & token matching algorithm for Google Maps prediction
  for (const p of GOOGLE_MAPS_PLACES) {
    const key = (p.main + ' ' + (p.sub || '')).toLowerCase();
    const mainWords = p.main.toLowerCase().split(/\s+/);
    const allWords = key.split(/[\s,]+/);

    // Check if all query tokens match either the whole phrase or individual word prefixes
    let allTokensMatch = true;
    for (const t of tokens) {
      const hasPrefixMatch = allWords.some(w => w.startsWith(t));
      const hasSubstringMatch = key.includes(t);
      if (!hasPrefixMatch && !hasSubstringMatch) {
        allTokensMatch = false;
        break;
      }
    }

    if (allTokensMatch) {
      const itemKey = p.main.toLowerCase() + '|' + (p.sub || '').toLowerCase();
      if (!seen.has(itemKey)) {
        seen.add(itemKey);
        results.push(p);
      }
    }

    if (results.length >= 7) break;
  }

  return results;
}

function setupAutocomplete(inputId, dropdownId) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  if (!input || !dropdown) return;

  let selectedIndex = -1;
  let debounceTimer = null;

  function positionDropdown() {
    const rect = input.getBoundingClientRect();
    const modalBox = input.closest('.modal-box');
    let shouldDropUp = false;

    if (modalBox) {
      const modalRect = modalBox.getBoundingClientRect();
      const spaceBelow = modalRect.bottom - rect.bottom;
      const spaceAbove = rect.top - modalRect.top;
      if (spaceBelow < 220 && spaceAbove > 140) {
        shouldDropUp = true;
      }
    } else {
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      if (spaceBelow < 240 && spaceAbove > spaceBelow) {
        shouldDropUp = true;
      }
    }

    dropdown.classList.toggle('drop-up', shouldDropUp);
  }

  function renderPredictions(items) {
    if (!items || items.length === 0) {
      dropdown.style.display = 'none';
      dropdown.innerHTML = '';
      selectedIndex = -1;
      return;
    }

    selectedIndex = -1;

    dropdown.innerHTML = items.map((item, idx) => {
      return `
        <div class="autocomplete-item" data-index="${idx}">
          <div class="autocomplete-ico">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5F6368" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
          <div class="autocomplete-content">
            <span class="gmap-main">${escapeHtml(item.main)}</span>
            ${item.sub ? `<span class="gmap-sub">${escapeHtml(item.sub)}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');

    positionDropdown();
    dropdown.style.display = 'flex';

    // Click selection
    dropdown.querySelectorAll('.autocomplete-item').forEach((el, idx) => {
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        selectItem(items[idx]);
      });
    });
  }

  function selectItem(item) {
    if (!item) return;
    const fullText = item.sub ? `${item.main}, ${item.sub}` : item.main;
    input.value = fullText;
    dropdown.style.display = 'none';
    dropdown.innerHTML = '';
    selectedIndex = -1;
  }

  function updateSelection() {
    const itemEls = dropdown.querySelectorAll('.autocomplete-item');
    itemEls.forEach((el, idx) => {
      el.classList.toggle('selected', idx === selectedIndex);
      if (idx === selectedIndex) {
        el.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  input.addEventListener('focus', () => {
    const q = input.value.trim();
    if (q.length > 0) {
      const localMatches = getGoogleMapsPlacePredictions(q);
      if (localMatches.length > 0) {
        renderPredictions(localMatches);
      }
    }
  });

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = input.value.trim();

    if (!q || q.length === 0) {
      dropdown.style.display = 'none';
      dropdown.innerHTML = '';
      return;
    }

    const localMatches = getGoogleMapsPlacePredictions(q);
    renderPredictions(localMatches);

    // Real-time geocoding query fallback if online
    if (q.length >= 2 && navigator.onLine) {
      debounceTimer = setTimeout(() => {
        fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5&lat=10.3157&lon=123.8854`)
          .then(res => res.json())
          .then(data => {
            if (data && data.features && data.features.length > 0 && input === document.activeElement && input.value.trim().length > 0) {
              const onlineItems = data.features.map(f => {
                const props = f.properties || {};
                const mainName = props.name || props.street || props.city;
                const subParts = [props.city, props.state || props.county, props.country].filter(s => s && s !== mainName);
                const subName = subParts.join(', ');
                return { main: mainName, sub: subName };
              }).filter(oi => oi.main && !localMatches.some(lm => lm.main.toLowerCase() === oi.main.toLowerCase()));

              if (onlineItems.length > 0) {
                const combined = [...localMatches, ...onlineItems].slice(0, 7);
                renderPredictions(combined);
              }
            }
          })
          .catch(() => {});
      }, 300);
    }
  });

  input.addEventListener('keydown', (e) => {
    const itemEls = dropdown.querySelectorAll('.autocomplete-item');
    if (dropdown.style.display === 'none' || itemEls.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % itemEls.length;
      updateSelection();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + itemEls.length) % itemEls.length;
      updateSelection();
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < itemEls.length) {
        e.preventDefault();
        const currentMatches = getGoogleMapsPlacePredictions(input.value.trim());
        if (currentMatches[selectedIndex]) {
          selectItem(currentMatches[selectedIndex]);
        }
      }
    } else if (e.key === 'Escape') {
      dropdown.style.display = 'none';
      selectedIndex = -1;
    }
  });

  input.addEventListener('blur', () => {
    setTimeout(() => {
      dropdown.style.display = 'none';
      selectedIndex = -1;
    }, 200);
  });
}

function initOrderAutocomplete() {
  setupAutocomplete('buyerNameInput', 'buyerNameDropdown');
  setupAutocomplete('destInput', 'destDropdown');
  setupAutocomplete('editOrderBuyer', 'editBuyerDropdown');
  setupAutocomplete('editOrderDest', 'editDestDropdown');
  setupAutocomplete('editAddress', 'editAddressDropdown');

  // Close suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.autocomplete-wrap')) {
      hideAllAutocomplete();
    }
  });
}

function openNewOrderModal() {
  hideAllAutocomplete();

  // Reset Form
  selectedPersonnel = null;
  selectedUnit = null;

  const sel = document.getElementById('personnelSelect');
  const buyerInput = document.getElementById('buyerNameInput');
  const speciesInput = document.getElementById('speciesInput');
  const qtyInput = document.getElementById('qtyInput');
  const destInput = document.getElementById('destInput');
  const dispatchInput = document.getElementById('dispatchInput');

  if (sel) {
    sel.innerHTML = 'Select transport personnel<span>▾</span>';
    sel.classList.add('placeholder');
  }
  if (buyerInput) buyerInput.value = '';
  if (speciesInput) speciesInput.value = 'Tilapia Fingerlings';
  if (qtyInput) qtyInput.value = '';
  if (destInput) destInput.value = '';
  if (dispatchInput) dispatchInput.value = '';

  // Populate Personnel Dropdown from live data
  const opts = document.getElementById('personnelOptions');
  const activeStaff = personnel.filter(p => p.status === 'active' || p.status === 'approved' || !p.status);

  if (opts) {
    if (activeStaff.length === 0) {
      opts.innerHTML = `
        <div class="select-opt" style="color:var(--text-faint);" onclick="showToast('Please add active transport personnel first')">
          No active transport personnel found. Click "+ Add Personnel" in the Personnel tab.
        </div>
      `;
    } else {
      opts.innerHTML = activeStaff.map(p => {
        const displayName = p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Transport Personnel';
        const phone = p.phone ? ` · ${ICONS.phone} ${escapeHtml(p.phone)}` : '';
        return `
          <div class="select-opt" onclick="pickPersonnel('${escapeHtml(displayName)}', '${p.id}')">
            ${escapeHtml(displayName)}<small>Transport Personnel${phone}</small>
          </div>
        `;
      }).join('');
    }
  }

  const modal = document.getElementById('newOrderModal');
  if (modal) modal.classList.add('active');
}

function closeNewOrderModal() {
  hideAllAutocomplete();
  const modal = document.getElementById('newOrderModal');
  if (modal) modal.classList.remove('active');
}

function toggleSelect(id) {
  document.querySelectorAll('.select-options').forEach(el => {
    if (el.id !== id) el.classList.remove('show');
  });
  const target = document.getElementById(id);
  if (target) {
    const isShowing = target.classList.contains('show');
    if (!isShowing) {
      const wrap = target.closest('.select-wrap');
      if (wrap) {
        const rect = wrap.getBoundingClientRect();
        const modalBox = wrap.closest('.modal-box');
        let shouldDropUp = false;
        if (modalBox) {
          const modalRect = modalBox.getBoundingClientRect();
          const spaceBelow = modalRect.bottom - rect.bottom;
          const spaceAbove = rect.top - modalRect.top;
          if (spaceBelow < 200 && spaceAbove > 140) {
            shouldDropUp = true;
          }
        }
        target.classList.toggle('drop-up', shouldDropUp);
      }
      target.classList.add('show');
    } else {
      target.classList.remove('show');
    }
  }
}

function pickPersonnel(name, id) {
  selectedPersonnel = name;

  const sel = document.getElementById('personnelSelect');
  if (sel) {
    sel.innerHTML = `${name}<span>▾</span>`;
    sel.classList.remove('placeholder');
  }

  const opts = document.getElementById('personnelOptions');
  if (opts) opts.classList.remove('show');
}

function pickUnit(unitId) {
  selectedUnit = unitId;
  const sel = document.getElementById('unitSelect');
  if (sel) {
    sel.innerHTML = `${unitId}<span>▾</span>`;
    sel.classList.remove('placeholder');
  }
  const opts = document.getElementById('unitOptions');
  if (opts) opts.classList.remove('show');
}

async function createOrder() {
  const buyerInput = document.getElementById('buyerNameInput');
  const speciesInput = document.getElementById('speciesInput');
  const qtyInput = document.getElementById('qtyInput');
  const destInput = document.getElementById('destInput');
  const dispatchInput = document.getElementById('dispatchInput');

  const buyer = buyerInput ? buyerInput.value.trim() : '';
  const species = speciesInput ? speciesInput.value.trim() : 'Tilapia Fingerlings';
  const qty = qtyInput ? parseInt(qtyInput.value, 10) : 0;
  const dest = destInput ? destInput.value.trim() : '';
  const dispatchTime = dispatchInput ? dispatchInput.value : '';

  // Order Validation Trappings
  if (!selectedPersonnel) {
    showToast('Please select transport personnel for this shipment.');
    return;
  }

  if (!buyer || buyer.length < 2) {
    showToast('Please enter the buyer / aquaculture farm name.');
    if (buyerInput) buyerInput.focus();
    return;
  }

  if (!qty || qty <= 0) {
    showToast('Please enter a valid quantity of fingerlings (greater than 0).');
    if (qtyInput) qtyInput.focus();
    return;
  }

  if (!dest || dest.length < 3) {
    showToast('Please enter the delivery destination address.');
    if (destInput) destInput.focus();
    return;
  }

  // Trapping: Prevent Duplicate Active Orders with exact same buyer, destination, and species
  const isDuplicate = orders.some(o => {
    const status = (o.status || '').toLowerCase();
    if (status === 'delivered' || status === 'cancelled') return false;
    return (
      (o.buyer || '').trim().toLowerCase() === buyer.toLowerCase() &&
      (o.dest || '').trim().toLowerCase() === dest.toLowerCase() &&
      (o.species || '').trim().toLowerCase() === species.toLowerCase() &&
      Number(o.quantity) === Number(qty)
    );
  });

  if (isDuplicate) {
    const existing = orders.find(o => 
      (o.buyer || '').trim().toLowerCase() === buyer.toLowerCase() &&
      (o.dest || '').trim().toLowerCase() === dest.toLowerCase()
    );
    showToast(`Duplicate Order: An active shipment for ${buyer} at ${dest} already exists (${existing ? existing.code : ''}).`);
    return;
  }

  const code = 'AQS-' + Math.random().toString(36).substring(2, 7).toUpperCase();

  const matchedStaff = personnel.find(p => p.name === selectedPersonnel || `${p.firstName || ''} ${p.lastName || ''}`.trim() === selectedPersonnel);

  const newOrderData = {
    sellerId: (currentUser && currentUser.uid) || (sellerProfile && sellerProfile.uid) || 'default_seller',
    code: code,
    buyer: buyer,
    species: species,
    quantity: qty,
    dest: dest,
    personnel: selectedPersonnel,
    driverName: selectedPersonnel,
    driverPhone: matchedStaff ? (matchedStaff.phone || '') : '',
    unit: '', // Empty until transport personnel scans and links the IoT monitoring unit via mobile
    dispatchTime: dispatchTime || new Date().toISOString(),
    status: 'transit', // Starts in transit
    stage: 1,
    progress: 45,
    eta: '28 min',
    turbidity: 6,
    dissolvedOxygen: 6.8,
    pH: 7.3,
    temp: 28.5
  };

  try {
    showToast('Creating transport order…');
    if (typeof createOrderFirebase === 'function') {
      await createOrderFirebase(newOrderData);
    } else {
      orders.unshift({ id: code, ...newOrderData });
      renderAll();
    }

    closeNewOrderModal();
    showToast(`Transport Order #${code} created successfully!`);
    showView('orders', document.querySelector('[data-view="orders"]'));
  } catch (err) {
    console.error('Order creation error:', err);
    showToast('Could not save order: ' + err.message);
  }
}

/* =========================================================================
   LIVE MONITORING & TELEMETRY DETAIL MODAL
   ========================================================================= */

let sellerDetailMap = null;
let sellerTruckMarker = null;
let sellerDestMarker = null;

function openOrderDetail(id) {
  const o = orders.find(x => String(x.id) === String(id));
  if (!o) return;

  activeOrderId = id;
  updateMonitoringModalState();

  const modal = document.getElementById('orderDetailModal');
  if (modal) modal.classList.add('active');

  initOrUpdateSellerMap(o);
}

function closeOrderDetail() {
  const modal = document.getElementById('orderDetailModal');
  if (modal) modal.classList.remove('active');
  activeOrderId = null;
}

// High-precision road waypoints following Cebu South Coastal Road (CSCR) & N. Bacalso National Highway
const SELLER_ROAD_ROUTE_COORDS = [
  [10.2934, 123.8805], // SRP Hatchery Facility
  [10.2885, 123.8762], // SRP Highway Start
  [10.2820, 123.8710], // CSCR Viaduct North
  [10.2740, 123.8645], // CSCR Mid Viaduct
  [10.2660, 123.8570], // CSCR South Viaduct
  [10.2580, 123.8495], // Talisay Coastal Bridge
  [10.2515, 123.8415], // Laray Coastal Curve
  [10.2472, 123.8320], // San Roque Talisay
  [10.2450, 123.8210], // Tangke, Talisay
  [10.2442, 123.8115], // Pooc junction
  [10.2435, 123.8030], // Lawaan I, N. Bacalso merge
  [10.2428, 123.7940], // Lawaan II, Talisay
  [10.2415, 123.7850], // Linao border
  [10.2420, 123.7760], // Tungkil Minglanilla
  [10.2410, 123.7670], // Calajo-an Minglanilla
  [10.2390, 123.7595], // Minglanilla Poblacion
  [10.2355, 123.7530], // Lipata
  [10.2310, 123.7480], // Tungkop curve
  [10.2250, 123.7445], // Inayagan, Naga border
  [10.2180, 123.7420], // Tinaan Naga
  [10.2100, 123.7405], // City of Naga Boardwalk
  [10.2015, 123.7410], // Colon Naga
  [10.1920, 123.7425], // Pangdan Naga
  [10.1825, 123.7435], // Langtad Naga
  [10.1740, 123.7410], // South Naga highway
  [10.1650, 123.7360], // North San Fernando
  [10.1550, 123.7280], // San Isidro, San Fernando
  [10.1470, 123.7210], // South San Fernando
  [10.1380, 123.7130], // Sangat San Fernando
  [10.1290, 123.7040], // Perrelos border, Carcar
  [10.1220, 123.6930], // North Carcar highway
  [10.1160, 123.6810], // Tuyom Carcar
  [10.1110, 123.6680], // Carcar City Rotunda Approach
  [10.1080, 123.6550], // Carcar Poblacion
  [10.1060, 123.6420]  // Carcar Aquaculture Receiving Farm
];

let currentSellerRoadPath = [...SELLER_ROAD_ROUTE_COORDS];
let sellerRouteGlowPolyline = null;
let sellerRouteMainPolyline = null;

async function loadDynamicSellerRoadRoute(startCoord, endCoord, mapInstance) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startCoord[1]},${startCoord[0]};${endCoord[1]},${endCoord[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json();
    if (data && data.routes && data.routes[0] && data.routes[0].geometry && data.routes[0].geometry.coordinates) {
      const roadWaypoints = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
      if (roadWaypoints.length > 5) {
        currentSellerRoadPath = roadWaypoints;

        if (sellerRouteGlowPolyline && mapInstance.hasLayer(sellerRouteGlowPolyline)) mapInstance.removeLayer(sellerRouteGlowPolyline);
        if (sellerRouteMainPolyline && mapInstance.hasLayer(sellerRouteMainPolyline)) mapInstance.removeLayer(sellerRouteMainPolyline);

        sellerRouteGlowPolyline = L.polyline(currentSellerRoadPath, {
          color: '#0B5D7A',
          weight: 8,
          opacity: 0.35,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(mapInstance);

        sellerRouteMainPolyline = L.polyline(currentSellerRoadPath, {
          color: '#00B4D8',
          weight: 4.5,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(mapInstance);
      }
    }
  } catch (err) {
    console.warn('OSRM seller road route fetch note:', err);
  }
}

function initOrUpdateSellerMap(order) {
  const mapContainer = document.getElementById('sellerDetailMap');
  if (!mapContainer || typeof L === 'undefined') return;

  const defaultCoords = [10.2350, 123.7750];

  if (!sellerDetailMap) {
    sellerDetailMap = L.map('sellerDetailMap', {
      zoomControl: true,
      attributionControl: false
    }).setView(defaultCoords, 11);

    // High-Definition Google Maps Layer
    L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps'
    }).addTo(sellerDetailMap);

    // Origin Hatchery Marker (SRP Facility)
    const originIcon = L.divIcon({
      className: 'custom-map-icon',
      html: '<div style="background:#0B5D7A; color:#fff; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; border:2px solid #fff; box-shadow:0 3px 10px rgba(0,0,0,0.3);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"></path><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"></path></svg></div>',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    L.marker(SELLER_ROAD_ROUTE_COORDS[0], { icon: originIcon }).addTo(sellerDetailMap)
      .bindPopup('<b>Origin Facility</b><br>Hatchery Station');

    // Destination Farm Marker (Carcar)
    const destIcon = L.divIcon({
      className: 'custom-map-icon',
      html: '<div style="background:#FF5A5F; color:#fff; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; border:2px solid #fff; box-shadow:0 3px 10px rgba(0,0,0,0.3);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    sellerDestMarker = L.marker(SELLER_ROAD_ROUTE_COORDS[SELLER_ROAD_ROUTE_COORDS.length - 1], { icon: destIcon }).addTo(sellerDetailMap)
      .bindPopup(`<b>Destination Farm</b><br>${escapeHtml(order.dest || 'Receiving Farm')}`);

    // Live Transport Truck Marker (Positioned along road)
    const truckIcon = L.divIcon({
      className: 'custom-map-icon',
      html: '<div style="background:#00B4D8; color:#fff; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; border:2px solid #fff; box-shadow:0 4px 14px rgba(0,180,216,0.5);"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg></div>',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    const stage = order.stage || (order.status === 'delivered' ? 3 : (order.status === 'transit' ? 1 : 0));
    const path = (currentSellerRoadPath && currentSellerRoadPath.length > 0) ? currentSellerRoadPath : SELLER_ROAD_ROUTE_COORDS;
    const truckPos = stage === 1 ? path[Math.floor(path.length * 0.45)] : (stage === 2 ? path[Math.floor(path.length * 0.8)] : path[path.length - 1]);

    sellerTruckMarker = L.marker(truckPos, { icon: truckIcon }).addTo(sellerDetailMap)
      .bindPopup(`<b>${escapeHtml(order.code)} Transport Unit</b><br>Driver: ${escapeHtml(order.personnel || 'Driver')}`);

    // Route Polyline Glow & Main Highway Path
    sellerRouteGlowPolyline = L.polyline(SELLER_ROAD_ROUTE_COORDS, {
      color: '#0B5D7A',
      weight: 8,
      opacity: 0.35,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(sellerDetailMap);

    sellerRouteMainPolyline = L.polyline(SELLER_ROAD_ROUTE_COORDS, {
      color: '#00B4D8',
      weight: 4.5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(sellerDetailMap);

    // Fetch dynamic real turn-by-turn road geometry from routing network
    loadDynamicSellerRoadRoute(SELLER_ROAD_ROUTE_COORDS[0], SELLER_ROAD_ROUTE_COORDS[SELLER_ROAD_ROUTE_COORDS.length - 1], sellerDetailMap);
  } else {
    const stage = order.stage || (order.status === 'delivered' ? 3 : (order.status === 'transit' ? 1 : 0));
    const path = (currentSellerRoadPath && currentSellerRoadPath.length > 0) ? currentSellerRoadPath : SELLER_ROAD_ROUTE_COORDS;
    const truckPos = stage === 1 ? path[Math.floor(path.length * 0.45)] : (stage === 2 ? path[Math.floor(path.length * 0.8)] : path[path.length - 1]);

    if (sellerTruckMarker) {
      sellerTruckMarker.setLatLng(truckPos);
      sellerTruckMarker.setPopupContent(`<b>${escapeHtml(order.code)} Transport Unit</b><br>Driver: ${escapeHtml(order.personnel || 'Driver')}`);
    }
    if (sellerDestMarker) {
      sellerDestMarker.setPopupContent(`<b>Destination Farm</b><br>${escapeHtml(order.dest || 'Receiving Farm')}`);
    }
  }

  setTimeout(() => {
    if (sellerDetailMap) sellerDetailMap.invalidateSize();
  }, 200);
}

function updateMonitoringModalState() {
  const o = orders.find(x => String(x.id) === String(activeOrderId));
  if (!o) return;

  const titleSub = document.getElementById('modalOrderBatchSub');
  const bannerTitle = document.getElementById('statusTitle');
  const bannerSub = document.getElementById('statusSub');
  const bannerIco = document.getElementById('statusIco');
  const progressFill = document.getElementById('progressFill');
  const stepNear = document.getElementById('stepNear');
  const stepArrived = document.getElementById('stepArrived');

  const dtCode = document.getElementById('dtCode');
  const dtBuyer = document.getElementById('dtBuyer');
  const dtQty = document.getElementById('dtQty');
  const dtUnit = document.getElementById('dtUnit');

  if (titleSub) titleSub.textContent = `Tracking #${o.code || 'AQS-0000'}`;
  if (dtCode) dtCode.innerHTML = `${o.code || '—'} <button class="btn-copy-code" title="Copy tracking code" onclick="copyTrackingCode('${o.code}')">${ICONS.copy} Copy</button>`;
  if (dtBuyer) dtBuyer.textContent = o.buyer || '—';
  if (dtQty) dtQty.textContent = `${Number(o.quantity || 0).toLocaleString()} pcs (${o.species || 'Tilapia'})`;
  if (dtUnit) dtUnit.textContent = (o.unit && o.unit !== 'undefined' && o.unit.trim() !== '') ? o.unit : (o.status === 'cancelled' ? '—' : 'Pending Mobile Connection');

  const stage = o.stage || (o.status === 'delivered' ? 3 : o.status === 'transit' ? 1 : 0);

  if (stepNear) stepNear.classList.toggle('done', stage >= 2 && o.status !== 'cancelled');
  if (stepArrived) stepArrived.classList.toggle('done', stage >= 3 && o.status !== 'cancelled');

  const modalCancelBtn = document.getElementById('modalCancelBtn');
  if (modalCancelBtn) {
    modalCancelBtn.style.display = (o.status === 'cancelled' || o.status === 'delivered') ? 'none' : 'block';
  }

  const aiText = document.getElementById('aiText');
  const aiRecs = document.getElementById('aiRecs');
  const aiStress = document.getElementById('aiStress');
  const aiConfidence = document.getElementById('aiConfidence');

  if (o.status === 'cancelled') {
    if (progressFill) {
      progressFill.style.width = '100%';
      progressFill.style.background = 'var(--critical)';
    }
    if (bannerTitle) bannerTitle.textContent = 'Shipment Cancelled';
    if (bannerSub) bannerSub.textContent = `Tracking #${o.code} was cancelled upon buyer request.`;
    if (bannerIco) bannerIco.innerHTML = ICONS.cancel;

    if (aiText) aiText.textContent = 'Live telemetry tracking ended because this shipment was cancelled.';
    if (aiRecs) aiRecs.innerHTML = `<div class="ai-rec"><span style="display:flex; align-items:center;">${ICONS.cancel}</span><span>No active transport telemetry.</span></div>`;
    if (aiStress) {
      aiStress.textContent = '—';
      aiStress.className = 'ai-stat-value';
    }
    if (aiConfidence) aiConfidence.textContent = '—';

    // Disable live water quality metrics
    setWQ('Turb', '—', '', 'grey', 'Cancelled');
    setWQ('DO', '—', '', 'grey', 'Cancelled');
    setWQ('PH', '—', '', 'grey', 'Cancelled');
    setWQ('Temp', '—', '', 'grey', 'Cancelled');
  } else if (stage === 1) {
    if (progressFill) {
      progressFill.style.width = '45%';
      progressFill.style.background = '';
    }
    if (bannerTitle) bannerTitle.textContent = 'In Transit';
    if (bannerSub) bannerSub.textContent = `Tracking #${o.code} · ${o.personnel} → ${o.buyer}`;
    if (bannerIco) bannerIco.innerHTML = ICONS.truck;

    if (aiText) aiText.textContent = 'All water parameters are within optimal biological limits for tilapia transport.';
    if (aiRecs) aiRecs.innerHTML = '<div class="ai-rec"><span>▸</span><span>Maintain current aeration rate and transport speed.</span></div>';
    if (aiStress) {
      aiStress.textContent = 'Low';
      aiStress.className = 'ai-stat-value stress-low';
    }
    if (aiConfidence) aiConfidence.textContent = '96%';

    // Water Quality Sensor Readings
    setWQ('Turb', o.turbidity || 6, 'NTU', o.turbidity > 25 ? 'red' : 'green', o.turbidity > 25 ? 'Critical' : 'Safe');
    setWQ('DO', o.dissolvedOxygen || 6.7, 'mg/L', o.dissolvedOxygen < 4 ? 'red' : 'green', o.dissolvedOxygen < 4 ? 'Critical' : 'Safe');
    setWQ('PH', o.pH || 7.2, '', (o.pH < 6.5 || o.pH > 8.5) ? 'amber' : 'green', (o.pH < 6.5 || o.pH > 8.5) ? 'Warning' : 'Safe');
    setWQ('Temp', o.temp || 29.2, '°C', o.temp > 32 ? 'amber' : 'green', o.temp > 32 ? 'Warm' : 'Safe');
  } else if (stage === 2) {
    if (progressFill) {
      progressFill.style.width = '82%';
      progressFill.style.background = '';
    }
    if (bannerTitle) bannerTitle.textContent = 'Near Destination';
    if (bannerSub) bannerSub.textContent = `Tracking #${o.code} is approaching ${o.buyer}`;
    if (bannerIco) bannerIco.innerHTML = ICONS.pin;

    if (aiText) aiText.textContent = 'Approaching receiving destination. Prepare receiving acclimatization tanks.';
    if (aiRecs) aiRecs.innerHTML = '<div class="ai-rec"><span>▸</span><span>Prepare receiving acclimatization tanks.</span></div>';
    if (aiStress) {
      aiStress.textContent = 'Low';
      aiStress.className = 'ai-stat-value stress-low';
    }
    if (aiConfidence) aiConfidence.textContent = '98%';

    // Water Quality Sensor Readings
    setWQ('Turb', o.turbidity || 6, 'NTU', o.turbidity > 25 ? 'red' : 'green', o.turbidity > 25 ? 'Critical' : 'Safe');
    setWQ('DO', o.dissolvedOxygen || 6.7, 'mg/L', o.dissolvedOxygen < 4 ? 'red' : 'green', o.dissolvedOxygen < 4 ? 'Critical' : 'Safe');
    setWQ('PH', o.pH || 7.2, '', (o.pH < 6.5 || o.pH > 8.5) ? 'amber' : 'green', (o.pH < 6.5 || o.pH > 8.5) ? 'Warning' : 'Safe');
    setWQ('Temp', o.temp || 29.2, '°C', o.temp > 32 ? 'amber' : 'green', o.temp > 32 ? 'Warm' : 'Safe');
  } else if (stage >= 3) {
    if (progressFill) {
      progressFill.style.width = '100%';
      progressFill.style.background = 'var(--success)';
    }
    if (bannerTitle) bannerTitle.textContent = 'Delivered & Completed';
    if (bannerSub) bannerSub.textContent = `Tracking #${o.code} has arrived safely at ${o.buyer}`;
    if (bannerIco) bannerIco.innerHTML = ICONS.check;

    if (aiText) aiText.textContent = 'Delivery completed successfully with optimal fingerling survival rate.';
    if (aiRecs) aiRecs.innerHTML = `<div class="ai-rec"><span style="display:inline-flex; align-items:center;">${ICONS.check}</span><span>Acclimatization process initiated.</span></div>`;
    if (aiStress) {
      aiStress.textContent = 'Safe';
      aiStress.className = 'ai-stat-value stress-low';
    }
    if (aiConfidence) aiConfidence.textContent = '100%';

    // Water Quality Sensor Readings
    setWQ('Turb', o.turbidity || 6, 'NTU', o.turbidity > 25 ? 'red' : 'green', o.turbidity > 25 ? 'Critical' : 'Safe');
    setWQ('DO', o.dissolvedOxygen || 6.7, 'mg/L', o.dissolvedOxygen < 4 ? 'red' : 'green', o.dissolvedOxygen < 4 ? 'Critical' : 'Safe');
    setWQ('PH', o.pH || 7.2, '', (o.pH < 6.5 || o.pH > 8.5) ? 'amber' : 'green', (o.pH < 6.5 || o.pH > 8.5) ? 'Warning' : 'Safe');
    setWQ('Temp', o.temp || 29.2, '°C', o.temp > 32 ? 'amber' : 'green', o.temp > 32 ? 'Warm' : 'Safe');
  }
}

async function cancelOrder(id, code) {
  const order = orders.find(x => String(x.id) === String(id) || String(x.code) === String(code));
  const trackingCode = (order && order.code) || code || id;
  const buyer = (order && order.buyer) || 'the buyer';

  if (!confirm(`Are you sure you want to CANCEL transport order #${trackingCode} for ${buyer}?\n\nThis will stop live tracking and mark the shipment as Cancelled.`)) {
    return;
  }

  try {
    showToast(`Cancelling transport order #${trackingCode}…`);
    const updateData = {
      status: 'cancelled',
      statusLabel: 'Cancelled',
      cancelledAt: new Date().toISOString(),
      reason: 'Cancelled by seller upon buyer request'
    };

    if (typeof updateOrderFirebase === 'function') {
      await updateOrderFirebase(id, updateData);
      if (trackingCode && trackingCode !== id) {
        await updateOrderFirebase(trackingCode, updateData);
      }
    }

    if (order) {
      Object.assign(order, updateData);
    }

    renderAll();
    if (activeOrderId && String(activeOrderId) === String(id)) {
      updateMonitoringModalState();
      closeOrderDetail();
    }
    showToast(`🚫 Order #${trackingCode} has been successfully cancelled.`);
  } catch (err) {
    console.error('Cancel order error:', err);
    showToast('Could not cancel order: ' + err.message);
  }
}

function cancelActiveOrder() {
  if (!activeOrderId) return;
  const o = orders.find(x => String(x.id) === String(activeOrderId));
  if (o) cancelOrder(o.id, o.code);
}

function closeCriticalModal() {
  const modal = document.getElementById('criticalModal');
  if (modal) modal.classList.remove('active');
}

function setWQ(key, value, unit, color, label) {
  const valEl = document.getElementById('wq' + key);
  const dotEl = document.getElementById('wqDot' + key);
  const statEl = document.getElementById('wqStatus' + key);

  if (valEl) valEl.innerHTML = `${value}<span class="wq-unit">${unit}</span>`;
  if (dotEl) dotEl.className = 'wq-dot dot-' + color;
  if (statEl) {
    statEl.textContent = label;
    statEl.className = 'wq-status status-' + color;
  }
}

/* =========================================================================
   PERSONNEL MANAGEMENT & INVITATIONS
   ========================================================================= */

function renderPersonnelView() {
  const activeGrid = document.getElementById('activePersonnelGrid');
  if (!activeGrid) return;

  const activeStaff = personnel.filter(p => p.status === 'active' || p.status === 'approved' || !p.status);

  if (activeStaff.length === 0) {
    activeGrid.innerHTML = emptyNote(ICONS.users, 'No transport personnel registered yet. Click "+ Add Personnel" to register your drivers.');
    return;
  }

  activeGrid.innerHTML = activeStaff.map(p => {
    const displayName = p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Transport Driver';
    const phoneNum = p.phone || '—';

    const hasUnit = p.unit && String(p.unit).trim() !== '' && p.unit !== 'undefined' && p.unit !== 'AQS-001';
    const unitChip = hasUnit
      ? `<span class="device-chip" style="background:#E1F7EF; color:#06A77D; border:1px solid #A3E9D2;">Unit ${escapeHtml(p.unit)}</span>`
      : `<span class="device-chip" style="background:#F2F8FB; color:#5B7A85; border:1px dashed #CBDDE4;">No Unit Paired (Scan to link)</span>`;

    return `
      <div class="personnel-card">
        <div class="personnel-top">
          <div class="personnel-avatar">${(displayName.charAt(0) || 'D').toUpperCase()}</div>
          <div style="flex:1;">
            <div class="personnel-name">${escapeHtml(displayName)}</div>
            <div class="personnel-sub">${ICONS.phone} ${escapeHtml(phoneNum)} · ${ICONS.mail} ${escapeHtml(p.email || '—')}</div>
          </div>
          <button class="btn btn-sm btn-outline" style="color:var(--critical); border-color:var(--critical); padding:6px 10px;" title="Remove driver" onclick="deleteDriver('${p.id}', '${escapeHtml(displayName)}')">${ICONS.trash}</button>
        </div>
        <div class="personnel-devices">
          ${unitChip}
          <span class="device-chip">Driver Account Active</span>
        </div>
      </div>
    `;
  }).join('');
}

function openInviteModal() {
  const fnInput = document.getElementById('inviteFirstName');
  const lnInput = document.getElementById('inviteLastName');
  const phoneInput = document.getElementById('invitePhone');
  const emailInput = document.getElementById('inviteEmail');
  const passInput = document.getElementById('invitePassword');

  if (fnInput) fnInput.value = '';
  if (lnInput) lnInput.value = '';
  if (phoneInput) phoneInput.value = '';
  if (emailInput) emailInput.value = '';
  if (passInput) passInput.value = '';

  const modal = document.getElementById('inviteModal');
  if (modal) modal.classList.add('active');
}

function closeInviteModal() {
  const modal = document.getElementById('inviteModal');
  if (modal) modal.classList.remove('active');
}

function togglePass(id, btn) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el.type === 'password') {
    el.type = 'text';
    btn.textContent = 'HIDE';
  } else {
    el.type = 'password';
    btn.textContent = 'SHOW';
  }
}

function validatePasswordComplexity(pass) {
  if (!pass || pass.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters in length.' };
  }
  if (!/[A-Z]/.test(pass)) {
    return { valid: false, message: 'Password must contain at least one capital letter (A-Z).' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pass)) {
    return { valid: false, message: 'Password must contain at least one special character (e.g., ! @ # $ % ^ & *).' };
  }
  return { valid: true };
}

async function sendInvite() {
  const fnInput = document.getElementById('inviteFirstName');
  const lnInput = document.getElementById('inviteLastName');
  const phoneInput = document.getElementById('invitePhone');
  const emailInput = document.getElementById('inviteEmail');
  const passInput = document.getElementById('invitePassword');
  const btn = document.getElementById('inviteSubmitBtn');

  const firstName = fnInput ? fnInput.value.trim() : '';
  const lastName = lnInput ? lnInput.value.trim() : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  const password = passInput ? passInput.value : '';

  // Trapping & Validation
  if (!firstName || firstName.length < 2) {
    showToast('Please enter the driver\'s First Name.');
    if (fnInput) fnInput.focus();
    return;
  }

  if (!lastName || lastName.length < 2) {
    showToast('Please enter the driver\'s Last Name.');
    if (lnInput) lnInput.focus();
    return;
  }

  if (!phone) {
    showToast('Please enter the driver\'s contact phone number.');
    if (phoneInput) phoneInput.focus();
    return;
  }

  if (/[a-zA-Z]/.test(phone)) {
    showToast('Contact number must contain numbers only.');
    if (phoneInput) phoneInput.focus();
    return;
  }

  const phoneDigits = phone.replace(/[\s\-().+]/g, '');
  if (!/^\d{7,15}$/.test(phoneDigits)) {
    showToast('Contact number must be between 7 and 15 digits.');
    if (phoneInput) phoneInput.focus();
    return;
  }

  if (!email || !validateEmail(email)) {
    showToast('Please enter a valid email address for the driver.');
    if (emailInput) emailInput.focus();
    return;
  }

  const passCheck = validatePasswordComplexity(password);
  if (!passCheck.valid) {
    showToast(passCheck.message);
    if (passInput) passInput.focus();
    return;
  }

  const fullName = `${firstName} ${lastName}`.trim();

  try {
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Saving…';
    }

    const newPersonnelData = {
      sellerId: (currentUser && currentUser.uid) || (sellerProfile && sellerProfile.uid) || 'default_seller',
      firstName: firstName,
      lastName: lastName,
      name: fullName,
      phone: phone,
      email: email,
      password: password,
      unit: '',
      unitScanned: false,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    if (typeof addPersonnelFirebase === 'function') {
      await addPersonnelFirebase(newPersonnelData);
    } else {
      personnel.push({ id: 'p_' + Date.now(), ...newPersonnelData });
      renderPersonnelView();
    }

    closeInviteModal();
    showToast(`Driver ${fullName} registered successfully!`);
  } catch (err) {
    console.error('Add personnel error:', err);
    showToast('Error adding personnel: ' + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Save Driver';
    }
  }
}

async function deleteDriver(id, name) {
  if (!confirm(`Are you sure you want to remove driver "${name}" from your farm team?`)) return;

  try {
    if (typeof deletePersonnelFirebase === 'function') {
      await deletePersonnelFirebase(id);
    } else {
      personnel = personnel.filter(x => String(x.id) !== String(id));
      renderPersonnelView();
    }
    showToast(`Driver ${name} removed.`);
  } catch (err) {
    showToast('Could not remove driver: ' + err.message);
  }
}

/* =========================================================================
   TELEMETRY HISTORY & REPORT PRINTING
   ========================================================================= */

function renderTelemetryView() {
  const list = document.getElementById('teleList');
  if (!list) return;

  if (telemetry.length === 0) {
    list.innerHTML = emptyNote(ICONS.chart, 'No sensor telemetry recorded yet. Live data from active shipments will log here.');
    return;
  }

  list.innerHTML = telemetry.map(h => {
    const timeStr = h.timestamp ? new Date(h.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : (h.time || 'Recent');
    const isResolved = h.resolved !== false;
    const trackingLabel = h.trackingCode ? `Tracking #${h.trackingCode}` : (h.batch ? (h.batch.includes('Tracking') ? h.batch : `Tracking #${h.batch.replace('Batch #', '')}`) : 'Tracking #AQS');

    return `
      <div class="tele-item" data-search="${escapeHtml((trackingLabel + ' ' + h.sensor + ' ' + timeStr).toLowerCase())}">
        <div>
          <div class="tele-batch">${escapeHtml(trackingLabel)}</div>
          <div class="tele-sensor">${escapeHtml(h.sensor || 'Sensor')} · <b style="color:var(--text);">${escapeHtml(h.reading || '—')}</b></div>
        </div>
        <div style="text-align:right;">
          <div class="tele-time">${timeStr}</div>
          <span class="tele-resolved ${isResolved ? 'resolved-yes' : 'resolved-no'}">${isResolved ? 'RESOLVED' : 'ACTION NEEDED'}</span>
        </div>
      </div>
    `;
  }).join('');
}

function filterTelemetry(q) {
  q = (q || '').toLowerCase().trim();
  document.querySelectorAll('.tele-item').forEach(el => {
    const searchData = el.getAttribute('data-search') || '';
    el.style.display = searchData.includes(q) ? 'flex' : 'none';
  });
}

function printHistory() {
  const printDate = document.getElementById('printDate');
  const printBody = document.getElementById('printTableBody');

  if (printDate) printDate.textContent = new Date().toLocaleString();
  if (printBody) {
    if (telemetry.length === 0) {
      printBody.innerHTML = '<tr><td colspan="5" style="padding:14px; text-align:center;">No telemetry history to print.</td></tr>';
    } else {
      printBody.innerHTML = telemetry.map(h => {
        const timeStr = h.timestamp ? new Date(h.timestamp).toLocaleString() : (h.time || 'Recent');
        const isResolved = h.resolved !== false;
        const trackingLabel = h.trackingCode ? `Tracking #${h.trackingCode}` : (h.batch ? (h.batch.includes('Tracking') ? h.batch : `Tracking #${h.batch.replace('Batch #', '')}`) : 'Tracking #AQS');
        return `
          <tr style="border-bottom:1px solid #E1EFF4;">
            <td style="padding:8px 6px;">${escapeHtml(trackingLabel)}</td>
            <td style="padding:8px 6px;">${escapeHtml(h.sensor || '—')}</td>
            <td style="padding:8px 6px;">${timeStr}</td>
            <td style="padding:8px 6px;">${escapeHtml(h.reading || '—')}</td>
            <td style="padding:8px 6px; color:${isResolved ? '#06A77D' : '#FF5A5F'}; font-weight:700;">${isResolved ? 'Resolved' : 'Action Needed'}</td>
          </tr>
        `;
      }).join('');
    }
  }

  showToast('Preparing printable report…');
  setTimeout(() => window.print(), 300);
}

/* =========================================================================
   NOTIFICATIONS VIEW
   ========================================================================= */

function renderNotificationsView() {
  const list = document.getElementById('notifList');
  const notifDot = document.getElementById('notifDot');

  if (!list) return;

  if (notifications.length === 0) {
    list.innerHTML = emptyNote(ICONS.bell, 'No notifications. Real-time delivery and alert updates will appear here.');
    if (notifDot) notifDot.style.display = 'none';
    return;
  }

  const unreadCount = notifications.filter(n => !n.read).length;
  if (notifDot) notifDot.style.display = unreadCount > 0 ? 'block' : 'none';

  list.innerHTML = notifications.map(n => {
    const icoClass = n.type === 'critical' ? 'ico-critical' : n.type === 'success' ? 'ico-success' : 'ico-info';
    const icoSymbol = n.type === 'critical' ? ICONS.warning : n.type === 'success' ? ICONS.check : ICONS.box;
    const timeStr = n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';

    return `
      <div class="notif-card ${n.read ? '' : 'unread'}">
        <div class="notif-top">
          <div class="notif-ico ${icoClass}">${icoSymbol}</div>
          <div style="flex:1;">
            <div class="notif-title">${escapeHtml(n.title || 'Notification')}</div>
            <div class="notif-time">${timeStr}</div>
            <div class="notif-body">${escapeHtml(n.body || '')}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/* =========================================================================
   PROFILE VIEW & EDITING
   ========================================================================= */

function renderProfileView() {
  const profName = (sellerProfile && (sellerProfile.farmName || sellerProfile.hatcheryName || sellerProfile.hatchery)) || 'Farm Owner';
  const profEmail = (sellerProfile && sellerProfile.email) || (currentUser && currentUser.email) || 'owner@aquasource.ph';
  const profPhone = (sellerProfile && sellerProfile.phone) || '—';
  const profAddress = (sellerProfile && sellerProfile.address) || '—';
  const profStatus = (sellerProfile && sellerProfile.status) || 'pending';

  const pNameEl = document.getElementById('profHatcheryName');
  const pEmailEl = document.getElementById('profEmail');
  const pPhoneEl = document.getElementById('profPhone');
  const pAddressEl = document.getElementById('profAddress');
  const pStatusEl = document.getElementById('profPermitStatus');
  const pOrdersEl = document.getElementById('profTotalDeliveries');
  const pPersonnelEl = document.getElementById('profActivePersonnel');

  if (pNameEl) pNameEl.textContent = profName;
  if (pEmailEl) pEmailEl.textContent = profEmail;
  if (pPhoneEl) pPhoneEl.textContent = profPhone;
  if (pAddressEl) pAddressEl.textContent = profAddress;
  if (pOrdersEl) pOrdersEl.textContent = orders.length;
  if (pPersonnelEl) pPersonnelEl.textContent = personnel.length;

  if (pStatusEl) {
    if (profStatus === 'approved') {
      pStatusEl.innerHTML = `<span style="color:var(--success); font-weight:700; display:inline-flex; align-items:center; gap:5px;">${ICONS.check} Approved &amp; Verified</span>`;
    } else if (profStatus === 'rejected') {
      pStatusEl.innerHTML = `<span style="color:var(--critical); font-weight:700; display:inline-flex; align-items:center; gap:5px;">${ICONS.ban} Disapproved</span>`;
    } else {
      pStatusEl.innerHTML = `<span style="color:var(--warning); font-weight:700; display:inline-flex; align-items:center; gap:5px;">${ICONS.clock} Pending BFAR Review</span>`;
    }
  }
}

function openEditProfileModal() {
  const nameInput = document.getElementById('editHatcheryName');
  const phoneInput = document.getElementById('editPhone');
  const addressInput = document.getElementById('editAddress');

  if (nameInput) nameInput.value = (sellerProfile && (sellerProfile.hatcheryName || sellerProfile.hatchery)) || '';
  if (phoneInput) phoneInput.value = (sellerProfile && sellerProfile.phone) || '';
  if (addressInput) addressInput.value = (sellerProfile && sellerProfile.address) || '';

  const modal = document.getElementById('editProfileModal');
  if (modal) modal.classList.add('active');
}

function closeEditProfileModal() {
  const modal = document.getElementById('editProfileModal');
  if (modal) modal.classList.remove('active');
}

async function saveSellerProfile() {
  const nameInput = document.getElementById('editHatcheryName');
  const phoneInput = document.getElementById('editPhone');
  const addressInput = document.getElementById('editAddress');

  const hatcheryName = nameInput ? nameInput.value.trim() : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';
  const address = addressInput ? addressInput.value.trim() : '';

  if (!hatcheryName || hatcheryName.length < 3) {
    showToast('Please enter a valid farm business name.');
    return;
  }

  if (phone && /[a-zA-Z]/.test(phone)) {
    showToast('Contact phone number cannot contain letters or words. Numbers only.');
    return;
  }

  const uid = (currentUser && currentUser.uid) || (sellerProfile && sellerProfile.uid);
  if (!uid) return;

  try {
    showToast('Saving profile changes…');
    if (typeof updateSellerProfileFirebase === 'function') {
      await updateSellerProfileFirebase(uid, {
        hatcheryName: hatcheryName,
        hatchery: hatcheryName,
        phone: phone,
        address: address
      });
    }

    sellerProfile = { ...sellerProfile, hatcheryName, hatchery: hatcheryName, phone, address };
    showDashboardView(sellerProfile);
    closeEditProfileModal();
    showToast('Profile updated successfully!');
  } catch (err) {
    showToast('Error saving profile: ' + err.message);
  }
}

/* =========================================================================
   HELPERS, VALIDATORS & MAP SVG ENGINE
   ========================================================================= */

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showAuthError(el, msg) {
  if (el) {
    el.textContent = msg;
    el.classList.add('show');
  }
}

function hideAuthError(el) {
  if (el) {
    el.textContent = '';
    el.classList.remove('show');
  }
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

function emptyNote(icon, text) {
  const iconHtml = (typeof icon === 'string' && (icon.includes('<svg') || icon.includes('<div')))
    ? icon
    : (ICONS[icon] || (icon === '📦' ? ICONS.box : (icon === '👥' ? ICONS.users : (icon === '📈' ? ICONS.chart : icon))));
  return `<div class="empty-note"><div style="display:flex; justify-content:center; margin-bottom:8px; color:var(--accent);">${iconHtml}</div><div>${text}</div></div>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function togglePass(id, btn) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el.type === 'password') {
    el.type = 'text';
    btn.textContent = 'HIDE';
  } else {
    el.type = 'password';
    btn.textContent = 'SHOW';
  }
}

function toggleCheck(el) {
  const box = el.querySelector('.checkbox') || el;
  if (box) {
    const isChecked = box.classList.toggle('checked');
    box.textContent = isChecked ? '✓' : '';
  }
}

function checkResponsive() {
  const btn = document.getElementById('hamburgerBtn');
  if (btn) btn.style.display = window.innerWidth <= 760 ? 'flex' : 'none';
}

function buildMapSVG() {
  const routeD = "M30,228 C85,205 115,150 162,124 C213,96 268,90 338,48";
  return `
  <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <rect class="mapland" x="0" y="0" width="400" height="260"/>
    <polygon class="mapwater" points="0,260 0,175 34,158 66,178 92,215 78,260"/>
    <rect class="mappark" x="292" y="150" width="92" height="68" rx="16"/>
    <g class="mapblock">
      <rect x="110" y="20" width="34" height="24" rx="4"/><rect x="150" y="14" width="26" height="30" rx="4"/>
      <rect x="60" y="70" width="30" height="22" rx="4"/><rect x="180" y="150" width="36" height="26" rx="4"/>
      <rect x="230" y="180" width="28" height="22" rx="4"/><rect x="150" y="200" width="34" height="24" rx="4"/>
      <rect x="330" y="130" width="26" height="20" rx="4"/><rect x="20" y="30" width="26" height="20" rx="4"/>
      <rect x="260" y="30" width="30" height="22" rx="4"/>
    </g>
    <g fill="none" stroke-linecap="round">
      <path class="roadcasing" d="M0,55 C110,42 260,66 400,50" stroke-width="8"/><path class="roadfill" d="M0,55 C110,42 260,66 400,50" stroke-width="4.5"/>
      <path class="roadcasing" d="M0,145 C130,158 270,128 400,148" stroke-width="8"/><path class="roadfill" d="M0,145 C130,158 270,128 400,148" stroke-width="4.5"/>
      <path class="roadcasing" d="M64,0 C74,95 46,175 68,260" stroke-width="8"/><path class="roadfill" d="M64,0 C74,95 46,175 68,260" stroke-width="4.5"/>
      <path class="roadcasing" d="M222,0 C210,90 244,175 232,260" stroke-width="8"/><path class="roadfill" d="M222,0 C210,90 244,175 232,260" stroke-width="4.5"/>
      <path class="roadcasing" d="M0,222 C90,205 160,214 250,192" stroke-width="7"/><path class="roadfill" d="M0,222 C90,205 160,214 250,192" stroke-width="4"/>
      <path class="roadcasing" d="M296,142 C318,120 336,108 366,86" stroke-width="7"/><path class="roadfill" d="M296,142 C318,120 336,108 366,86" stroke-width="4"/>
    </g>
    <g fill="none" stroke-linecap="round">
      <path class="routecasing" d="${routeD}" stroke-width="11"/><path class="routefill" d="${routeD}" stroke-width="6.5"/>
    </g>
    <text class="streetlabel" x="16" y="48" font-size="7.5">N. BACALSO AVE</text>
    <text class="streetlabel" x="150" y="140" font-size="7.5">SOUTH COASTAL RD</text>
    <text class="streetlabel" x="248" y="255" font-size="7.5">CARCAR HWY</text>
    <text class="streetlabel" x="300" y="145" font-size="7" transform="rotate(2 300 145)">CITY PARK</text>
    <g class="startdot"><circle cx="30" cy="228" r="7" stroke-width="3"/></g>
    <g transform="translate(338,48)"><path class="pinbody" d="M0,-16 C8,-16 14,-10 14,-2 C14,8 0,20 0,20 C0,20 -14,8 -14,-2 C-14,-10 -8,-16 0,-16 Z"/><circle class="pindot" cx="0" cy="-2" r="4.5"/></g>
    <g class="compassring"><circle cx="30" cy="28" r="16" stroke-width="1.5"/></g>
    <text class="compasstext" x="30" y="24" font-size="9" text-anchor="middle">N</text>
    <polygon class="compasstext" points="30,14 27,22 33,22"/>
    <g>
      <circle class="truckbody" cx="0" cy="0" r="13" stroke-width="2.5"/>
      <g transform="translate(-7, -7) scale(0.6)">
        <rect x="1" y="3" width="15" height="13" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="5.5" cy="18.5" r="2.5" fill="none" stroke="#FFFFFF" stroke-width="2.2"/>
        <circle cx="18.5" cy="18.5" r="2.5" fill="none" stroke="#FFFFFF" stroke-width="2.2"/>
      </g>
      <animateMotion dur="9s" repeatCount="indefinite" keyPoints="0;1;0" keyTimes="0;0.5;1" calcMode="linear" path="${routeD}"/>
    </g>
  </svg>`;
}

function initMaps() {
  const sm = document.getElementById('mapVisual');
  if (sm) sm.innerHTML = buildMapSVG();
}
