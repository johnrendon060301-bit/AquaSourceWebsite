/* ==========================================================================
   AQUASOURCE ADMIN APPLICATION ENGINE (admin-script.js)
   ========================================================================== */

// Application State
let accounts = [];
let farmOwners = [];
let activeAccountId = null;
let activeFarmId = null;
let toastTimer = null;

/* =========================================================================
   APPLICATION INITIALIZATION
   ========================================================================= */

window.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Firebase
  if (typeof initAdminFirebase === 'function') {
    initAdminFirebase();
  }

  // 2. Monitor Firebase Auth state
  if (typeof fbAuth !== 'undefined' && fbAuth) {
    fbAuth.onAuthStateChanged(async (user) => {
      if (user) {
        // If this user is actually a seller, don't auto-log them into Admin portal
        try {
          if (typeof fbFirestore !== 'undefined' && fbFirestore) {
            const sellerDoc = await fbFirestore.collection('sellers').doc(user.uid).get();
            if (sellerDoc.exists) {
              onAdminSignedOut();
              return;
            }
          }
        } catch (e) {}

        onAdminAuthenticated(user);
      } else {
        onAdminSignedOut();
      }
    });
  } else {
    checkLocalAuthSession();
  }

  // 3. Bind Enter key on Login Form
  const passInput = document.getElementById('loginPass');
  if (passInput) {
    passInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') handleLoginSubmit();
    });
  }

  // 4. Responsive check
  checkResponsive();
  window.addEventListener('resize', checkResponsive);

  // 5. Handle Firebase Password Reset Link from Email
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');
  const oobCode = urlParams.get('oobCode');

  if (mode === 'resetPassword' && oobCode) {
    setTimeout(() => {
      if (typeof fbAuth !== 'undefined' && fbAuth) {
        fbAuth.verifyPasswordResetCode(oobCode).then((email) => {
          fpCurrentEmail = email;
          fpVerifiedCode = oobCode;
          const modal = document.getElementById('forgotPassModal');
          if (modal) modal.classList.add('active');
          setFpStep(3);
          showToast('Verified reset link for ' + email);
        }).catch(err => {
          console.warn('Verify code error:', err);
        });
      }
    }, 500);
  }
});

/* =========================================================================
   AUTHENTICATION & LOGIN
   ========================================================================= */

async function handleLoginSubmit() {
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPass');
  const errEl = document.getElementById('loginError');
  const submitBtn = document.getElementById('authSubmitBtn');

  const email = emailInput ? emailInput.value.trim() : '';
  const pass = passInput ? passInput.value.trim() : '';

  if (!email || !pass) {
    showAuthError('Please enter both your admin email and password.');
    return;
  }

  try {
    if (submitBtn) submitBtn.disabled = true;
    if (errEl) errEl.classList.remove('show');
    showToast('Authenticating with Firebase…');

    if (typeof loginAdminFirebase === 'function') {
      const user = await loginAdminFirebase(email, pass);
      showToast('Signed in successfully!');
      onAdminAuthenticated(user);
    } else {
      localStorage.setItem('aquasource_admin_auth', 'true');
      localStorage.setItem('aquasource_admin_email', email);
      showDashboardView(email);
    }
  } catch (err) {
    console.error('Login error:', err);
    let msg = err.message || 'Invalid credentials.';
    if (err.code === 'auth/user-not-found') {
      msg = 'No user found with this email in Firebase Authentication.';
    } else if (err.code === 'auth/wrong-password') {
      msg = 'Incorrect password. Please try again.';
    } else if (err.code === 'auth/invalid-email') {
      msg = 'Please enter a valid email address format.';
    }
    showAuthError(msg);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

function showAuthError(msg) {
  const errEl = document.getElementById('loginError');
  if (errEl) {
    errEl.textContent = msg;
    errEl.classList.add('show');
  }
}

/* =========================================================================
   FORGOT PASSWORD (EMAIL RESET LINK)
   ========================================================================= */

function handleForgotPassword() {
  const loginEmailInput = document.getElementById('loginEmail');
  const fpEmailInput = document.getElementById('fpEmail');
  const initialEmail = loginEmailInput ? loginEmailInput.value.trim() : '';

  if (fpEmailInput && initialEmail) {
    fpEmailInput.value = initialEmail;
  }

  hideFpError();
  const successMsg = document.getElementById('fpSuccessMsg');
  const formContent = document.getElementById('fpFormContent');
  if (successMsg) successMsg.style.display = 'none';
  if (formContent) formContent.style.display = 'block';

  const modal = document.getElementById('forgotPassModal');
  if (modal) modal.classList.add('active');
}

function closeForgotPassModal() {
  const modal = document.getElementById('forgotPassModal');
  if (modal) modal.classList.remove('active');
  hideFpError();
}

function showFpError(msg) {
  const errEl = document.getElementById('fpError');
  if (errEl) {
    errEl.textContent = msg;
    errEl.classList.add('show');
  }
}

function hideFpError() {
  const errEl = document.getElementById('fpError');
  if (errEl) errEl.classList.remove('show');
}

async function handleSendResetLink() {
  const emailInput = document.getElementById('fpEmail');
  const btn = document.getElementById('fpSendLinkBtn');
  const email = emailInput ? emailInput.value.trim() : '';

  if (!email || !email.includes('@')) {
    showFpError('Please enter a valid administrator email address.');
    return;
  }

  try {
    if (btn) btn.disabled = true;
    hideFpError();
    showToast('Sending password reset link…');

    if (typeof sendAdminPasswordResetLink === 'function') {
      await sendAdminPasswordResetLink(email);
    }

    const successMsg = document.getElementById('fpSuccessMsg');
    const formContent = document.getElementById('fpFormContent');
    if (successMsg) successMsg.style.display = 'block';
    if (formContent) formContent.style.display = 'none';

    showToast('Reset link sent to ' + email);
  } catch (err) {
    console.error('Send reset link error:', err);
    let msg = err.message || 'Failed to send reset link.';
    if (err.code === 'auth/user-not-found') {
      msg = 'No administrator account found with this email.';
    } else if (err.code === 'auth/invalid-email') {
      msg = 'Please enter a valid email address format.';
    }
    showFpError(msg);
  } finally {
    if (btn) btn.disabled = false;
  }
}

function onAdminAuthenticated(user) {
  const email = user.email || 'Administrator';
  localStorage.setItem('aquasource_admin_auth', 'true');
  localStorage.setItem('aquasource_admin_email', email);

  // Sync admin record to Cloud Firestore adminUsers collection
  if (typeof fbFirestore !== 'undefined' && fbFirestore && user.uid) {
    fbFirestore.collection('adminUsers').doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      role: 'Administrator',
      status: 'active',
      lastActive: new Date().toISOString()
    }, { merge: true }).catch(console.warn);
  }

  // Update profile avatar in sidebar
  const adminEmailDisplay = document.getElementById('adminEmailDisplay');
  const adminAvatar = document.getElementById('adminAvatar');
  if (adminEmailDisplay) adminEmailDisplay.textContent = email;
  if (adminAvatar) {
    const initials = email.substring(0, 2).toUpperCase();
    adminAvatar.textContent = initials;
  }

  showDashboardView(email);

  // Subscribe to live Firebase database
  if (typeof subscribeAdminDatabase === 'function') {
    subscribeAdminDatabase(
      (liveAccounts) => {
        accounts = liveAccounts || [];
        renderAll();
      }
    );
  }
}

function onAdminSignedOut() {
  localStorage.removeItem('aquasource_admin_auth');
  localStorage.removeItem('aquasource_admin_email');
  window.location.href = 'index.html';
}

function checkLocalAuthSession() {
  const session = localStorage.getItem('aquasource_admin_auth');
  const email = localStorage.getItem('aquasource_admin_email');
  if (session !== 'true') {
    window.location.href = 'index.html';
    return;
  }
  showDashboardView(email || 'Administrator');
}

function showDashboardView(email) {
  const adminEmailDisplay = document.getElementById('adminEmailDisplay');
  if (adminEmailDisplay && email) adminEmailDisplay.textContent = email;
  renderAll();
}

async function doLogout() {
  if (typeof logoutAdminFirebase === 'function') {
    await logoutAdminFirebase();
  }
  onAdminSignedOut();
}

function refreshAdminData() {
  showToast('Synchronizing with Firebase…');
  renderAll();
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
  const box = el.querySelector('.checkbox');
  if (box) {
    box.classList.toggle('checked');
    box.textContent = box.classList.contains('checked') ? '✓' : '';
  }
}

/* =========================================================================
   NAVIGATION & VIEW ROUTING
   ========================================================================= */

function showView(name, el) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById('view-' + name);
  if (target) target.classList.add('active');

  document.querySelectorAll('.side-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');

  const titles = {
    dashboard: 'Dashboard Overview',
    pending: 'Pending Seller Verification',
    approved: 'Approved Seller Accounts',
    rejected: 'Rejected Seller Accounts'
  };

  const topTitle = document.getElementById('topbarTitle');
  if (topTitle) topTitle.textContent = titles[name] || 'AquaSource Admin';

  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.remove('open');
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.toggle('open');
}

/* =========================================================================
   PERMIT VECTOR DOCUMENT ENGINE
   ========================================================================= */

function buildPermitSVG(seed, large) {
  const skew = (seed % 3) - 1;
  const w = large ? 760 : 400, h = large ? 520 : 280;
  return `
  <svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${w}" height="${h}" fill="#DCE7E2"/>
    <g transform="translate(${w/2} ${h/2}) rotate(${skew}) translate(${-w/2} ${-h/2})">
      <rect x="${w*0.06}" y="${h*0.06}" width="${w*0.88}" height="${h*0.88}" fill="#FDFBF3" stroke="#C9C2A0" stroke-width="2"/>
      <rect x="${w*0.06}" y="${h*0.06}" width="${w*0.88}" height="${h*0.88}" fill="none" stroke="#8B7A4E" stroke-width="1" stroke-dasharray="4 3" transform="scale(0.97)" transform-origin="center"/>
      <circle cx="${w*0.5}" cy="${h*0.14}" r="${h*0.055}" fill="none" stroke="#0B5D7A" stroke-width="2"/>
      <text x="${w*0.5}" y="${h*0.145}" text-anchor="middle" font-family="Poppins, sans-serif" font-size="${h*0.028}" font-weight="800" fill="#0B5D7A">BFAR</text>
      <text x="${w*0.5}" y="${h*0.235}" text-anchor="middle" font-family="Poppins, sans-serif" font-size="${h*0.042}" font-weight="800" fill="#1B2A22">FISHPOND/HATCHERY PERMIT</text>
      <text x="${w*0.5}" y="${h*0.29}" text-anchor="middle" font-family="Inter, sans-serif" font-size="${h*0.024}" fill="#5B6A5E">Bureau of Fisheries and Aquatic Resources</text>
      <line x1="${w*0.14}" y1="${h*0.36}" x2="${w*0.86}" y2="${h*0.36}" stroke="#C9C2A0" stroke-width="1"/>
      <text x="${w*0.14}" y="${h*0.44}" font-family="Inter, sans-serif" font-size="${h*0.026}" fill="#3A473E">Permit No: BFAR-7-${1000 + (seed || 1) * 137}</text>
      <text x="${w*0.14}" y="${h*0.51}" font-family="Inter, sans-serif" font-size="${h*0.026}" fill="#3A473E">Holder: Certified Aquaculture Operator</text>
      <text x="${w*0.14}" y="${h*0.58}" font-family="Inter, sans-serif" font-size="${h*0.026}" fill="#3A473E">Valid Until: Dec 31, 2026</text>
      <text x="${w*0.14}" y="${h*0.65}" font-family="Inter, sans-serif" font-size="${h*0.026}" fill="#3A473E">Species Authorized: Tilapia & Bangus Fingerlings</text>
      <circle cx="${w*0.78}" cy="${h*0.82}" r="${h*0.09}" fill="none" stroke="#B23B3B" stroke-width="1.5" opacity="0.6"/>
      <text x="${w*0.78}" y="${h*0.815}" text-anchor="middle" font-family="Inter, sans-serif" font-size="${h*0.016}" fill="#B23B3B" opacity="0.7">OFFICIAL</text>
      <text x="${w*0.78}" y="${h*0.84}" text-anchor="middle" font-family="Inter, sans-serif" font-size="${h*0.016}" fill="#B23B3B" opacity="0.7">SEAL</text>
      <line x1="${w*0.14}" y1="${h*0.9}" x2="${w*0.4}" y2="${h*0.9}" stroke="#3A473E" stroke-width="1"/>
      <text x="${w*0.14}" y="${h*0.94}" font-family="Inter, sans-serif" font-size="${h*0.02}" fill="#5B6A5E">Authorized Government Signature</text>
    </g>
  </svg>`;
}

/* =========================================================================
   SELLER VERIFICATION & UI RENDERING
   ========================================================================= */

function statusBadge(status) {
  if (status === 'pending') return '<span class="account-thumb-badge badge-pending">PENDING</span>';
  if (status === 'approved') return '<span class="account-thumb-badge badge-approved">APPROVED</span>';
  return '<span class="account-thumb-badge badge-rejected">REJECTED</span>';
}

function accountCard(a) {
  const reasonHtml = a.status === 'rejected' ? `<div class="account-reason"><b>Reason for Rejection</b>${a.reason}</div>` : '';
  const thumbHtml = a.permitUrl 
    ? `<img src="${a.permitUrl}" alt="BFAR Permit" style="width:100%; height:100%; object-fit:cover; border-radius:10px;">` 
    : buildPermitSVG(a.permitSeed || 1, false);

  const farmTitle = a.farmName || a.hatchery || a.hatcheryName || 'Farm Application';
  const applicantName = a.fullName || a.applicant || (a.firstName ? `${a.firstName} ${a.lastName}` : '') || farmTitle;

  return `
    <div class="account-card" onclick="openReviewModal('${a.id}')">
      <div class="account-thumb">${thumbHtml}${statusBadge(a.status)}</div>
      <div class="account-body">
        <div class="account-name">${escapeHtml(farmTitle)}</div>
        <div class="account-applicant">${escapeHtml(applicantName)} · ${escapeHtml(a.email || '—')}</div>
        <div class="account-meta"><span>${a.submitted || 'Recent'}</span><span class="mono">#${String(a.id).substring(0, 6)}</span></div>
        ${reasonHtml}
      </div>
    </div>`;
}

function renderAll() {
  const pending = accounts.filter(a => a.status === 'pending');
  const approved = accounts.filter(a => a.status === 'approved');
  const rejected = accounts.filter(a => a.status === 'rejected');

  const pendingCountEl = document.getElementById('pendingCount');
  const statPending = document.getElementById('statPending');
  const statApproved = document.getElementById('statApproved');
  const statRejected = document.getElementById('statRejected');
  const statTotal = document.getElementById('statTotal');

  if (pendingCountEl) pendingCountEl.textContent = pending.length;
  if (statPending) statPending.textContent = pending.length;
  if (statApproved) statApproved.textContent = approved.length;
  if (statRejected) statRejected.textContent = rejected.length;
  if (statTotal) statTotal.textContent = accounts.length;

  const pendingHtml = pending.length ? pending.map(accountCard).join('') : emptyNote('🎉', 'No seller accounts waiting for review');
  const approvedHtml = approved.length ? approved.map(accountCard).join('') : emptyNote('📭', 'No approved seller accounts yet');
  const rejectedHtml = rejected.length ? rejected.map(accountCard).join('') : emptyNote('📭', 'No rejected seller accounts');

  const pendingGrid = document.getElementById('pendingGrid');
  const dashPendingGrid = document.getElementById('dashPendingGrid');
  const approvedGrid = document.getElementById('approvedGrid');
  const rejectedGrid = document.getElementById('rejectedGrid');

  if (pendingGrid) pendingGrid.innerHTML = pendingHtml;
  if (dashPendingGrid) dashPendingGrid.innerHTML = pendingHtml;
  if (approvedGrid) approvedGrid.innerHTML = approvedHtml;
  if (rejectedGrid) rejectedGrid.innerHTML = rejectedHtml;
}

function emptyNote(icon, text) {
  return `<div class="empty-note" style="grid-column:1/-1;"><div>${icon}</div><div>${text}</div></div>`;
}

/* =========================================================================
   REVIEW & APPROVAL MODALS
   ========================================================================= */

function openReviewModal(id) {
  const a = accounts.find(x => String(x.id) === String(id));
  if (!a) return;
  activeAccountId = id;

  const rName = document.getElementById('reviewName');
  const rMeta = document.getElementById('reviewMeta');
  const frame = document.getElementById('permitFrame');
  const rHatchery = document.getElementById('rHatchery');
  const rApplicant = document.getElementById('rApplicant');
  const rEmail = document.getElementById('rEmail');
  const rPhone = document.getElementById('rPhone');
  const rAddress = document.getElementById('rAddress');
  const rSubmitted = document.getElementById('rSubmitted');
  const statusEl = document.getElementById('rStatus');
  const reasonBlock = document.getElementById('rReasonBlock');
  const actionBtns = document.getElementById('reviewActionButtons');

  const farmTitle = a.farmName || a.hatchery || a.hatcheryName || 'Farm Application';
  const applicantName = a.fullName || a.applicant || (a.firstName ? `${a.firstName} ${a.lastName}` : '') || '—';

  if (rName) rName.textContent = farmTitle;
  if (rMeta) rMeta.textContent = 'Submitted ' + (a.submitted || 'Recently');
  
  if (frame) {
    if (a.permitUrl) {
      frame.innerHTML = `<img src="${a.permitUrl}" alt="Uploaded BFAR Permit" style="max-width:100%; max-height:460px; object-fit:contain; border-radius:10px; display:block; margin:0 auto; box-shadow:0 4px 14px rgba(0,0,0,0.12);">`;
    } else {
      frame.innerHTML = buildPermitSVG(a.permitSeed || 1, true);
    }
  }

  if (rHatchery) rHatchery.textContent = farmTitle;
  if (rApplicant) rApplicant.textContent = applicantName;
  if (rEmail) rEmail.textContent = a.email || '—';
  if (rPhone) rPhone.textContent = a.phone || '—';
  if (rAddress) rAddress.textContent = a.address || '—';
  if (rSubmitted) rSubmitted.textContent = a.submitted || '—';

  const statusLabels = { pending: '⏳ Pending Review', approved: '✅ Approved & Verified', rejected: '⛔ Disapproved' };
  const statusColors = { pending: 'var(--warning)', approved: 'var(--success)', rejected: 'var(--critical)' };

  if (statusEl) {
    statusEl.textContent = statusLabels[a.status] || a.status;
    statusEl.style.color = statusColors[a.status] || 'var(--text)';
  }

  if (reasonBlock) {
    if (a.status === 'rejected') {
      reasonBlock.style.display = 'block';
      const reasonTxt = document.getElementById('rReasonText');
      if (reasonTxt) reasonTxt.textContent = a.reason;
    } else {
      reasonBlock.style.display = 'none';
    }
  }

  if (actionBtns) actionBtns.style.display = a.status === 'pending' ? 'flex' : 'none';

  const modal = document.getElementById('reviewModal');
  if (modal) modal.classList.add('active');
}

function closeReviewModal() {
  const modal = document.getElementById('reviewModal');
  if (modal) modal.classList.remove('active');
}

function approveCurrentAccount() {
  const a = accounts.find(x => String(x.id) === String(activeAccountId));
  if (!a) return;
  a.status = 'approved';
  a.reason = '';

  if (typeof syncAccountToFirebase === 'function') syncAccountToFirebase(a);

  const farmName = a.farmName || a.hatcheryName || a.hatchery || 'Aquaculture Farm';

  // 1. Send SMS Notification to the Farm Owner's Mobile Phone
  if (typeof sendApprovalSMS === 'function' && a.phone) {
    sendApprovalSMS(a.phone, farmName);
    console.info(`[SMS Dispatched] Sent approval SMS to: ${a.phone}`);
  }

  // 2. Send official confirmation email (if email is present)
  if (typeof sendApprovalEmailFirebase === 'function' && a.email) {
    sendApprovalEmailFirebase(a.email, farmName);
    console.info(`[Email Dispatched] Sent approval notification to: ${a.email}`);
  }

  closeReviewModal();
  renderAll();
  showToast(`✅ ${farmName} approved! SMS notice sent to ${a.phone || a.email}.`);
}

/* =========================================================================
   REJECTION MODAL & PRESETS
   ========================================================================= */

function openRejectModal() {
  const input = document.getElementById('rejectReasonInput');
  if (input) input.value = '';

  const modal = document.getElementById('rejectModal');
  if (modal) modal.classList.add('active');
}

function closeRejectModal() {
  const modal = document.getElementById('rejectModal');
  if (modal) modal.classList.remove('active');
}

function useReason(el) {
  const input = document.getElementById('rejectReasonInput');
  if (input) input.value = el.textContent;
}

function confirmReject() {
  const input = document.getElementById('rejectReasonInput');
  const reason = input ? input.value.trim() : '';

  if (!reason) {
    showToast('Please provide a reason for rejection.');
    return;
  }

  const a = accounts.find(x => String(x.id) === String(activeAccountId));
  if (!a) return;
  a.status = 'rejected';
  a.reason = reason;

  if (typeof syncAccountToFirebase === 'function') syncAccountToFirebase(a);

  const farmName = a.farmName || a.hatcheryName || a.hatchery || 'Aquaculture Farm';

  // 1. Send SMS Notice to Farm Owner's Phone
  if (typeof sendRejectionSMS === 'function' && a.phone) {
    sendRejectionSMS(a.phone, farmName, reason);
    console.info(`[SMS Dispatched] Sent rejection SMS to: ${a.phone}`);
  }

  // 2. Send rejection notice email (if email is present)
  if (typeof sendRejectionEmailFirebase === 'function' && a.email) {
    sendRejectionEmailFirebase(a.email, farmName, reason);
  }

  closeRejectModal();
  closeReviewModal();
  renderAll();
  showToast(`Application disapproved. SMS notice sent to ${a.phone || a.email}.`);
}

/* =========================================================================
   UI HELPERS & TOAST
   ========================================================================= */

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

function checkResponsive() {
  const btn = document.getElementById('hamburgerBtn');
  if (btn) btn.style.display = window.innerWidth <= 760 ? 'flex' : 'none';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
