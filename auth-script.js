/* ==========================================================================
   AQUASOURCE UNIFIED AUTHENTICATION ENGINE (auth-script.js)
   ========================================================================== */

/**
 * AquaSource Firebase Project Configuration
 */
const firebaseConfig = {
  apiKey: "AIzaSyCAmwsW7BnyljRblb3Oe3N5BnjDhGxSt40",
  authDomain: "aquasource-bc968.firebaseapp.com",
  projectId: "aquasource-bc968",
  storageBucket: "aquasource-bc968.firebasestorage.app",
  messagingSenderId: "337344568561",
  appId: "1:337344568561:web:418b20c42492d432d01d50",
  measurementId: "G-5ESNKSBXL8"
};

// Global Firebase Handles
let fbApp = null;
let fbAuth = null;
let fbFirestore = null;
let permitFileBase64 = '';
let permitFileName = '';
let permitUploaded = false;
let currentPendingSeller = null;
let editPermitFileBase64 = '';
let editPermitFileName = '';
let toastTimer = null;

/* =========================================================================
   INITIALIZATION
   ========================================================================= */

window.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Firebase
  try {
    if (typeof firebase !== 'undefined') {
      fbApp = firebase.apps.length > 0 ? firebase.app() : firebase.initializeApp(firebaseConfig);
      if (firebase.auth) fbAuth = firebase.auth();
      if (firebase.firestore) fbFirestore = firebase.firestore();
    }
  } catch (err) {
    console.warn('Firebase init warning:', err);
  }

  // 2. Bind Enter key on Login
  const loginPass = document.getElementById('loginPass');
  if (loginPass) {
    loginPass.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') handleLoginSubmit();
    });
  }

  // 3. Restore remembered session / email & password if previously selected
  const rememberBox = document.getElementById('rememberBox');
  const loginEmail = document.getElementById('loginEmail');
  const isRemembered = localStorage.getItem('aquasource_remember_session') === 'true';
  const savedEmail = localStorage.getItem('aquasource_remember_email');
  const savedPassEnc = localStorage.getItem('aquasource_remember_pass');

  if (isRemembered) {
    if (savedEmail && loginEmail) {
      loginEmail.value = savedEmail;
    }
    if (savedPassEnc && loginPass) {
      try {
        loginPass.value = decodeURIComponent(atob(savedPassEnc));
      } catch (e) {
        loginPass.value = savedPassEnc;
      }
    }
    if (rememberBox) {
      rememberBox.classList.add('checked');
      rememberBox.textContent = '✓';
    }
  }
});

/* =========================================================================
   UNIFIED SIGN IN & ROLE-BASED ROUTING
   ========================================================================= */

async function handleLoginSubmit() {
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPass');
  const errEl = document.getElementById('loginError');
  const successEl = document.getElementById('loginSuccess');
  const submitBtn = document.getElementById('loginSubmitBtn');

  const email = emailInput ? emailInput.value.trim() : '';
  const pass = passInput ? passInput.value : '';

  if (successEl) successEl.classList.remove('show');
  hideAlert(errEl);

  // Input Trappings
  if (!email) {
    showAlert(errEl, 'Please enter your registered email address.');
    if (emailInput) emailInput.focus();
    return;
  }

  if (!validateEmail(email)) {
    showAlert(errEl, 'Please enter a valid email address.');
    if (emailInput) emailInput.focus();
    return;
  }

  if (!pass) {
    showAlert(errEl, 'Please enter your password.');
    if (passInput) passInput.focus();
    return;
  }

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Verifying Account…';
    }
    showToast('Authenticating with Firebase…');

    if (!fbAuth) {
      throw new Error('Firebase Authentication is not available.');
    }

    // Handle "Remember Session" configuration
    const rememberBox = document.getElementById('rememberBox');
    const isRemembered = rememberBox ? rememberBox.classList.contains('checked') : false;

    if (fbAuth && firebase && firebase.auth && firebase.auth.Auth && firebase.auth.Auth.Persistence) {
      try {
        const persistence = isRemembered
          ? firebase.auth.Auth.Persistence.LOCAL
          : firebase.auth.Auth.Persistence.SESSION;
        await fbAuth.setPersistence(persistence);
      } catch (pErr) {
        console.warn('Could not set auth persistence:', pErr);
      }
    }

    if (isRemembered) {
      localStorage.setItem('aquasource_remember_session', 'true');
      localStorage.setItem('aquasource_remember_email', email);
      try {
        localStorage.setItem('aquasource_remember_pass', btoa(encodeURIComponent(pass)));
      } catch (e) {
        localStorage.setItem('aquasource_remember_pass', pass);
      }
    } else {
      localStorage.removeItem('aquasource_remember_session');
      localStorage.removeItem('aquasource_remember_email');
      localStorage.removeItem('aquasource_remember_pass');
    }

    // 1. Authenticate user credentials
    const userCredential = await fbAuth.signInWithEmailAndPassword(email, pass);
    const user = userCredential.user;

    // 2. Check for Administrator Role
    let isAdmin = false;
    if (email.toLowerCase().includes('admin') || email.toLowerCase() === 'admin@aquasource.ph') {
      isAdmin = true;
    }

    if (fbFirestore && !isAdmin) {
      try {
        const adminDoc = await fbFirestore.collection('adminUsers').doc(user.uid).get();
        if (adminDoc.exists) isAdmin = true;
      } catch (e) {}
    }

    if (isAdmin) {
      localStorage.setItem('aquasource_admin_auth', 'true');
      localStorage.setItem('aquasource_admin_email', user.email);
      showToast('Welcome, Administrator! Redirecting…');
      setTimeout(() => window.location.href = 'AdminAquaSource.html', 400);
      return;
    }

    // 3. Check for Farm Owner / Seller Role
    let sellerDoc = null;
    if (fbFirestore) {
      try {
        const docSnap = await fbFirestore.collection('sellers').doc(user.uid).get();
        if (docSnap.exists) {
          sellerDoc = { id: docSnap.id, ...docSnap.data() };
        } else {
          // Check query by email if doc ID was custom
          const q = await fbFirestore.collection('sellers').where('email', '==', email).get();
          if (!q.empty) {
            sellerDoc = { id: q.docs[0].id, ...q.docs[0].data() };
          }
        }
      } catch (e) {
        console.warn('Firestore seller check error:', e);
      }
    }

    if (sellerDoc) {
      currentPendingSeller = sellerDoc;
      const status = (sellerDoc.status || 'pending').toLowerCase();
      if (status === 'pending') {
        await fbAuth.signOut();
        showAlert(errEl, `
          <div style="text-align:left; line-height:1.4;">
            <div style="font-size:14px; font-weight:700; margin-bottom:4px;">⏳ Application Under Review</div>
            <div style="font-size:12px; opacity:0.95; margin-bottom:8px;">Your farm registration is currently under review by BFAR Administrators. Need to correct your information or permit image?</div>
            <button type="button" class="btn btn-outline btn-sm" style="background:#fff; color:var(--primary); border-color:var(--primary); width:100%; font-weight:700;" onclick="openEditApplicationModal()">
              ✏️ Edit Submitted Details / Change Permit
            </button>
          </div>
        `);
        return;
      }

      if (status === 'rejected') {
        await fbAuth.signOut();
        const reasonText = sellerDoc.reason ? `<br><b>BFAR Reason:</b> ${sellerDoc.reason}` : '';
        showAlert(errEl, `
          <div style="text-align:left; line-height:1.4;">
            <div style="font-size:14px; font-weight:700; margin-bottom:4px;">⛔ Registration Requires Update</div>
            <div style="font-size:12px; margin-bottom:8px;">Your farm owner registration was disapproved.${reasonText}</div>
            <button type="button" class="btn btn-primary btn-sm" style="width:100%; font-weight:700;" onclick="openEditApplicationModal()">
              ✏️ Update Permit & Re-Submit Application
            </button>
          </div>
        `);
        return;
      }

      // Approved Farm Owner
      localStorage.setItem('aquasource_seller_auth', 'true');
      localStorage.setItem('aquasource_seller_email', user.email);
      showToast('Welcome, Farm Owner! Redirecting…');
      setTimeout(() => window.location.href = 'SellerAquaSource.html', 400);
      return;
    }

    // 4. Default: Redirect to Buyer Delivery Tracking Portal
    showToast('Redirecting to Buyer Portal…');
    setTimeout(() => window.location.href = 'BuyerAquaSource.html', 400);

  } catch (err) {
    console.error('Login error:', err);
    let msg = 'Invalid email or password. Please try again.';
    if (err.code === 'auth/user-not-found') {
      msg = 'No account found with this email address.';
    } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-login-credentials') {
      msg = 'Incorrect password. Please check your credentials or reset your password.';
    } else if (err.code === 'auth/invalid-email') {
      msg = 'Please enter a valid email address.';
    } else if (err.code === 'auth/too-many-requests') {
      msg = 'Too many failed login attempts. Please wait a moment or use "Forgot password?".';
    } else if (err.message) {
      msg = err.message;
    }
    showAlert(errEl, msg);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
    }
  }
}

/* =========================================================================
   FARM OWNER SIGNUP & REGISTRATION
   ========================================================================= */

function showSignup() {
  const loginCard = document.getElementById('loginCard');
  const signupCard = document.getElementById('signupCard');
  const signupError = document.getElementById('signupError');

  hideAlert(signupError);
  if (loginCard) loginCard.style.display = 'none';
  if (signupCard) signupCard.style.display = 'block';
}

function showLogin() {
  const loginCard = document.getElementById('loginCard');
  const signupCard = document.getElementById('signupCard');
  const loginError = document.getElementById('loginError');

  hideAlert(loginError);
  if (signupCard) signupCard.style.display = 'none';
  if (loginCard) loginCard.style.display = 'block';
}

/**
 * Automatically resize and compress image to ensure it never exceeds Firestore document limits
 */
function compressImageFile(file, maxWidth = 1024, maxHeight = 1024, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = function(e) {
      const img = new Image();
      img.onerror = reject;
      img.onload = function() {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to optimized JPEG data URL
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function handlePermitUpload(event) {
  const file = event.target.files ? event.target.files[0] : null;
  if (!file) return;

  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!validTypes.includes(file.type)) {
    showToast('Please upload an image file (JPG, PNG, or WEBP).');
    return;
  }

  try {
    showToast('Processing & optimizing image…');
    permitFileBase64 = await compressImageFile(file);
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
    if (nameEl) nameEl.textContent = '✓ ' + file.name + ' (Optimized)';

    showToast('BFAR Permit image optimized & ready!');
  } catch (err) {
    console.error('Image compression error:', err);
    showToast('Could not process image: ' + err.message);
  }
}

async function handleSignupSubmit() {
  const firstNameInput = document.getElementById('signupFirstName');
  const lastNameInput = document.getElementById('signupLastName');
  const nameInput = document.getElementById('signupFarm');
  const emailInput = document.getElementById('signupEmail');
  const passInput = document.getElementById('signupPass');
  const confirmPassInput = document.getElementById('signupConfirmPass');
  const phoneInput = document.getElementById('signupPhone');
  const addressInput = document.getElementById('signupAddress');
  const errEl = document.getElementById('signupError');
  const submitBtn = document.getElementById('signupSubmitBtn');

  const firstName = firstNameInput ? firstNameInput.value.trim() : '';
  const lastName = lastNameInput ? lastNameInput.value.trim() : '';
  const farmName = nameInput ? nameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim() : '';
  const pass = passInput ? passInput.value : '';
  const confirmPass = confirmPassInput ? confirmPassInput.value : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';
  const address = addressInput ? addressInput.value.trim() : '';

  // Validation Trappings
  if (!firstName || firstName.length < 2) {
    showAlert(errEl, 'Please enter your First Name (at least 2 characters).');
    if (firstNameInput) firstNameInput.focus();
    return;
  }

  if (!lastName || lastName.length < 2) {
    showAlert(errEl, 'Please enter your Last Name (at least 2 characters).');
    if (lastNameInput) lastNameInput.focus();
    return;
  }

  if (!farmName || farmName.length < 3) {
    showAlert(errEl, 'Please enter your registered Farm / Business Name (at least 3 characters).');
    if (nameInput) nameInput.focus();
    return;
  }

  // Strict Gmail requirement
  if (!email || !validateGmail(email)) {
    showAlert(errEl, 'Please enter a valid Gmail address ending with @gmail.com (e.g., yourfarm@gmail.com). Other email domains are not allowed.');
    if (emailInput) emailInput.focus();
    return;
  }

  // Strict Password Validation (At least 8 chars, 1 uppercase letter, 1 special character)
  const passCheck = validatePasswordComplexity(pass);
  if (!passCheck.valid) {
    showAlert(errEl, passCheck.message);
    if (passInput) passInput.focus();
    return;
  }

  if (pass !== confirmPass) {
    showAlert(errEl, 'Passwords do not match. Please re-enter your password.');
    if (confirmPassInput) confirmPassInput.focus();
    return;
  }

  // Strict numeric contact phone validation (No strings/letters allowed)
  if (!phone) {
    showAlert(errEl, 'Please enter your contact phone number.');
    if (phoneInput) phoneInput.focus();
    return;
  }

  if (/[a-zA-Z]/.test(phone)) {
    showAlert(errEl, 'Contact number cannot contain letters or text words. Please enter numbers only (e.g., 0917 555 0101 or +63 917 555 0101).');
    if (phoneInput) phoneInput.focus();
    return;
  }

  const phoneDigits = phone.replace(/[\s\-().+]/g, '');
  if (!/^\d{7,15}$/.test(phoneDigits)) {
    showAlert(errEl, 'Contact number must be between 7 and 15 numeric digits (e.g., 09175550101).');
    if (phoneInput) phoneInput.focus();
    return;
  }

  if (!address || address.length < 5) {
    showAlert(errEl, 'Please enter your complete physical farm address.');
    if (addressInput) addressInput.focus();
    return;
  }

  if (!permitUploaded || !permitFileBase64) {
    showAlert(errEl, 'Please upload a photo of your BFAR Fishpond/Farm Permit.');
    return;
  }

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting Application…';
    }
    hideAlert(errEl);
    showToast('Submitting registration to Firebase…');

    // 1. Check if an approved account already exists
    let existingSeller = null;
    if (fbFirestore) {
      try {
        const q = await fbFirestore.collection('sellers').where('email', '==', email).get();
        if (!q.empty) {
          existingSeller = { id: q.docs[0].id, ...q.docs[0].data() };
        }
      } catch (e) {}
    }

    if (existingSeller) {
      const existingStatus = (existingSeller.status || '').toLowerCase();
      if (existingStatus === 'approved') {
        throw new Error('An approved farm owner account with this email already exists. Please sign in instead.');
      }
      if (existingStatus === 'pending') {
        throw new Error('Your registration is currently under review by BFAR Administrators. Please wait for approval.');
      }
      // If rejected, allow re-application
    }

    // 2. Create or authenticate in Firebase Auth
    let user = null;
    try {
      const userCredential = await fbAuth.createUserWithEmailAndPassword(email, pass);
      user = userCredential.user;
    } catch (authErr) {
      if (authErr.code === 'auth/email-already-in-use') {
        if (existingSeller && existingSeller.status === 'approved') {
          throw new Error('An approved farm owner account with this email already exists. Please sign in.');
        } else if (existingSeller && existingSeller.status === 'pending') {
          throw new Error('Your registration is currently under review by BFAR Administrators. Please wait for approval.');
        } else {
          // If previous registration was rejected, deleted, or unlinked:
          // Try to sign in with provided password
          try {
            const cred = await fbAuth.signInWithEmailAndPassword(email, pass);
            user = cred.user;
          } catch (signInErr) {
            // If password was different, use the existing document UID or generate one
            user = { uid: (existingSeller && (existingSeller.id || existingSeller.uid)) || ('seller_' + Date.now()), email: email };
          }
        }
      } else {
        throw authErr;
      }
    }

    const uid = (user && user.uid) || (existingSeller && (existingSeller.id || existingSeller.uid)) || ('seller_' + Date.now());

    // 3. Prepare seller document
    const fullName = `${firstName} ${lastName}`.trim();
    const sellerProfile = {
      id: uid,
      uid: uid,
      firstName: firstName,
      lastName: lastName,
      fullName: fullName,
      applicant: fullName,
      ownerName: fullName,
      hatchery: farmName,
      hatcheryName: farmName,
      farmName: farmName,
      email: email,
      phone: phone,
      address: address,
      permitFileName: permitFileName || 'bfar-permit.jpg',
      permitUrl: permitFileBase64,
      permitSeed: Math.floor(Math.random() * 900) + 100,
      role: 'Seller',
      status: 'pending',
      reason: '',
      submitted: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      createdAt: (existingSeller && existingSeller.createdAt) || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalDeliveries: (existingSeller && existingSeller.totalDeliveries) || 0,
      activeShipments: (existingSeller && existingSeller.activeShipments) || 0
    };

    // 4. Save directly into Cloud Firestore with rollback protection
    if (fbFirestore) {
      try {
        await fbFirestore.collection('sellers').doc(uid).set(sellerProfile, { merge: true });
      } catch (firestoreErr) {
        console.error('Firestore save error:', firestoreErr);
        // Roll back and delete newly created auth user so no orphaned email is left in Auth
        if (user && typeof user.delete === 'function') {
          try {
            await user.delete();
            console.log('Rolled back Auth user due to Firestore failure.');
          } catch (delErr) {
            console.warn('Could not roll back auth user:', delErr);
          }
        }
        throw new Error('Could not save registration profile: ' + firestoreErr.message);
      }
    }

    // 5. Always sign out after registration so account awaits approval
    try { await fbAuth.signOut(); } catch (e) {}

    // 6. Switch back to login with clear approval banner
    currentPendingSeller = sellerProfile;
    showLogin();
    const loginSuccess = document.getElementById('loginSuccess');
    if (loginSuccess) {
      loginSuccess.innerHTML = `
        <div style="text-align:left; line-height:1.4;">
          <div style="font-size:14px; font-weight:700; margin-bottom:4px;">✅ Registration Submitted!</div>
          <div style="font-size:12px; margin-bottom:8px;">Your BFAR permit is now under review by BFAR Administrators. Need to correct details or replace the permit photo?</div>
          <button type="button" class="btn btn-outline btn-sm" style="background:#fff; color:#06A77D; border-color:#06A77D; width:100%; font-weight:700;" onclick="openEditApplicationModal()">
            ✏️ Review &amp; Edit Submitted Details
          </button>
        </div>
      `;
      loginSuccess.classList.add('show');
    }

    const loginEmailInput = document.getElementById('loginEmail');
    if (loginEmailInput) loginEmailInput.value = email;

    showToast('Application submitted! Awaiting BFAR Admin approval.');

  } catch (err) {
    console.error('Registration error:', err);
    let msg = err.message || 'Could not complete registration. Please try again.';
    showAlert(errEl, msg);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account & Submit Permit';
    }
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

  hideAlert(errEl);
  if (successMsg) successMsg.style.display = 'none';
  if (formContent) formContent.style.display = 'block';

  const modal = document.getElementById('forgotPassModal');
  if (modal) modal.classList.add('active');
}

function closeForgotPassModal() {
  const modal = document.getElementById('forgotPassModal');
  if (modal) modal.classList.remove('active');
  const errEl = document.getElementById('fpError');
  hideAlert(errEl);
}

async function handleSendResetLink() {
  const emailInput = document.getElementById('fpEmail');
  const btn = document.getElementById('fpSendLinkBtn');
  const errEl = document.getElementById('fpError');
  const email = emailInput ? emailInput.value.trim() : '';

  if (!email || !validateEmail(email)) {
    showAlert(errEl, 'Please enter a valid email address.');
    if (emailInput) emailInput.focus();
    return;
  }

  try {
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Sending Link…';
    }
    hideAlert(errEl);
    showToast('Sending password reset link…');

    if (!fbAuth) throw new Error('Firebase Auth is not available.');
    await fbAuth.sendPasswordResetEmail(email);

    const successMsg = document.getElementById('fpSuccessMsg');
    const formContent = document.getElementById('fpFormContent');
    if (successMsg) successMsg.style.display = 'block';
    if (formContent) formContent.style.display = 'none';

    showToast('Password reset link sent to ' + email);
  } catch (err) {
    console.error('Password reset link error:', err);
    let msg = 'Failed to send reset email. Please try again.';
    if (err.code === 'auth/user-not-found') {
      msg = 'No registered account found with this email.';
    } else if (err.code === 'auth/invalid-email') {
      msg = 'Please enter a valid email format.';
    } else if (err.message) {
      msg = err.message;
    }
    showAlert(errEl, msg);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Send Reset Link ✉️';
    }
  }
}

/* =========================================================================
   UI HELPERS & UTILITIES
   ========================================================================= */

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateGmail(email) {
  if (!email) return false;
  const clean = String(email).trim().toLowerCase();
  return /^[a-z0-9._%+-]+@gmail\.com$/i.test(clean);
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

function showAlert(el, msg) {
  if (el) {
    el.innerHTML = msg;
    el.classList.add('show');
  }
}

function hideAlert(el) {
  if (el) {
    el.innerHTML = '';
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
    if (!isChecked && (box.id === 'rememberBox' || el.id === 'rememberBox')) {
      localStorage.removeItem('aquasource_remember_session');
      localStorage.removeItem('aquasource_remember_email');
      localStorage.removeItem('aquasource_remember_pass');
    }
  }
}

/* =========================================================================
   EDIT / UPDATE SUBMITTED APPLICATION ENGINE
   ========================================================================= */

function openEditApplicationModal(sellerObj) {
  const seller = sellerObj || currentPendingSeller;
  if (!seller) {
    showToast('Please sign in or enter your Gmail address first.');
    return;
  }

  currentPendingSeller = seller;
  editPermitFileBase64 = seller.permitUrl || '';
  editPermitFileName = seller.permitFileName || 'bfar-permit.jpg';

  const fnInput = document.getElementById('editAppFirstName');
  const lnInput = document.getElementById('editAppLastName');
  const farmInput = document.getElementById('editAppFarm');
  const emailInput = document.getElementById('editAppEmail');
  const phoneInput = document.getElementById('editAppPhone');
  const addrInput = document.getElementById('editAppAddress');
  const prevImg = document.getElementById('editPermitPreview');
  const nameEl = document.getElementById('editPermitFileName');
  const errEl = document.getElementById('editAppError');
  const succEl = document.getElementById('editAppSuccess');

  hideAlert(errEl);
  hideAlert(succEl);

  if (fnInput) fnInput.value = seller.firstName || (seller.fullName ? seller.fullName.split(' ')[0] : '') || '';
  if (lnInput) lnInput.value = seller.lastName || (seller.fullName ? seller.fullName.split(' ').slice(1).join(' ') : '') || '';
  if (farmInput) farmInput.value = seller.farmName || seller.hatcheryName || seller.hatchery || '';
  if (emailInput) emailInput.value = seller.email || '';
  if (phoneInput) phoneInput.value = seller.phone || '';
  if (addrInput) addrInput.value = seller.address || '';

  if (prevImg) {
    if (seller.permitUrl) {
      prevImg.src = seller.permitUrl;
      prevImg.style.display = 'block';
    } else {
      prevImg.style.display = 'none';
    }
  }
  if (nameEl) nameEl.textContent = 'Current Permit: ' + editPermitFileName;

  const modal = document.getElementById('editAppModal');
  if (modal) modal.classList.add('active');
}

function closeEditApplicationModal() {
  const modal = document.getElementById('editAppModal');
  if (modal) modal.classList.remove('active');
}

async function handleEditPermitUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
    showToast('Only JPG, PNG, and WEBP image files are allowed.');
    return;
  }

  try {
    showToast('Optimizing permit photo…');
    editPermitFileBase64 = await compressImageFile(file);
    editPermitFileName = file.name;

    const preview = document.getElementById('editPermitPreview');
    const nameEl = document.getElementById('editPermitFileName');

    if (preview) {
      preview.src = editPermitFileBase64;
      preview.style.display = 'block';
    }
    if (nameEl) nameEl.textContent = '✓ Updated: ' + file.name + ' (Optimized)';
    showToast('New permit photo optimized & ready!');
  } catch (err) {
    console.error('Image compression error:', err);
    showToast('Could not process image: ' + err.message);
  }
}

async function handleSaveApplicationEdit() {
  if (!currentPendingSeller) {
    showToast('No active application found to update.');
    return;
  }

  const fnInput = document.getElementById('editAppFirstName');
  const lnInput = document.getElementById('editAppLastName');
  const farmInput = document.getElementById('editAppFarm');
  const emailInput = document.getElementById('editAppEmail');
  const phoneInput = document.getElementById('editAppPhone');
  const addrInput = document.getElementById('editAppAddress');
  const errEl = document.getElementById('editAppError');
  const btn = document.getElementById('editAppSubmitBtn');

  const firstName = fnInput ? fnInput.value.trim() : '';
  const lastName = lnInput ? lnInput.value.trim() : '';
  const farmName = farmInput ? farmInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';
  const address = addrInput ? addrInput.value.trim() : '';

  hideAlert(errEl);

  if (!firstName || firstName.length < 2) {
    showAlert(errEl, 'Please enter your First Name.');
    if (fnInput) fnInput.focus();
    return;
  }

  if (!lastName || lastName.length < 2) {
    showAlert(errEl, 'Please enter your Last Name.');
    if (lnInput) lnInput.focus();
    return;
  }

  if (!farmName || farmName.length < 3) {
    showAlert(errEl, 'Please enter your Farm / Business Name (at least 3 characters).');
    if (farmInput) farmInput.focus();
    return;
  }

  if (!email || !validateGmail(email)) {
    showAlert(errEl, 'Please enter a valid Gmail address ending with @gmail.com (e.g., yourfarm@gmail.com).');
    if (emailInput) emailInput.focus();
    return;
  }

  if (!phone) {
    showAlert(errEl, 'Please enter your contact phone number.');
    if (phoneInput) phoneInput.focus();
    return;
  }

  if (/[a-zA-Z]/.test(phone)) {
    showAlert(errEl, 'Contact number cannot contain letters. Numbers only.');
    if (phoneInput) phoneInput.focus();
    return;
  }

  const phoneDigits = phone.replace(/[\s\-().+]/g, '');
  if (!/^\d{7,15}$/.test(phoneDigits)) {
    showAlert(errEl, 'Please enter a valid phone number (7 to 15 digits).');
    if (phoneInput) phoneInput.focus();
    return;
  }

  if (!address || address.length < 5) {
    showAlert(errEl, 'Please enter your complete physical farm address.');
    if (addrInput) addrInput.focus();
    return;
  }

  if (!editPermitFileBase64) {
    showAlert(errEl, 'Please provide a valid photo of your BFAR Farm Permit.');
    return;
  }

  try {
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Saving Changes…';
    }

    const fullName = `${firstName} ${lastName}`.trim();
    const docId = currentPendingSeller.id || currentPendingSeller.uid;

    const updatedData = {
      firstName: firstName,
      lastName: lastName,
      fullName: fullName,
      applicant: fullName,
      ownerName: fullName,
      farmName: farmName,
      hatchery: farmName,
      hatcheryName: farmName,
      email: email,
      phone: phone,
      address: address,
      permitUrl: editPermitFileBase64,
      permitFileName: editPermitFileName,
      status: 'pending', // Re-mark as pending for BFAR review
      reason: '',
      updatedAt: new Date().toISOString()
    };

    // Save to Cloud Firestore
    if (fbFirestore && docId) {
      await fbFirestore.collection('sellers').doc(docId).set(updatedData, { merge: true });
    }

    // Try updating Firebase Auth profile email if currently authenticated
    if (fbAuth && fbAuth.currentUser && fbAuth.currentUser.email !== email) {
      try {
        await fbAuth.currentUser.updateEmail(email);
      } catch (authEmailErr) {
        console.warn('Auth email sync note:', authEmailErr);
      }
    }

    currentPendingSeller = { ...currentPendingSeller, ...updatedData };

    // Update login email input so user can easily sign in with corrected email
    const loginEmailInput = document.getElementById('loginEmail');
    if (loginEmailInput) loginEmailInput.value = email;

    showToast('Application updated & resubmitted to BFAR Admins!');
    closeEditApplicationModal();

    // Update login error/status box with confirmation
    const errElLogin = document.getElementById('loginError');
    if (errElLogin) {
      showAlert(errElLogin, `
        <div style="text-align:left; line-height:1.4;">
          <div style="font-size:14px; font-weight:700; color:#06A77D; margin-bottom:4px;">✅ Updated &amp; Resubmitted!</div>
          <div style="font-size:12px; margin-bottom:8px;">Your revised farm details and permit photo have been saved and are ready for BFAR Admin verification.</div>
          <button type="button" class="btn btn-outline btn-sm" style="background:#fff; color:var(--primary); border-color:var(--primary); width:100%; font-weight:700;" onclick="openEditApplicationModal()">
            ✏️ Edit Details Again
          </button>
        </div>
      `);
    }

  } catch (err) {
    console.error('Application update error:', err);
    showAlert(errEl, 'Error updating application: ' + (err.message || err));
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Save & Update Application';
    }
  }
}
