/* ==========================================================================
   AQUASOURCE ADMIN FIREBASE ADAPTER (admin-firebase.js)
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
let isFirebaseOnline = false;

/**
 * Initialize Admin Firebase (Auth & Cloud Firestore)
 */
function initAdminFirebase() {
  try {
    if (typeof firebase !== 'undefined') {
      if (firebase.apps && firebase.apps.length > 0) {
        fbApp = firebase.app();
      } else {
        fbApp = firebase.initializeApp(firebaseConfig);
      }

      // 1. Initialize Authentication
      if (firebase.auth) {
        try {
          fbAuth = firebase.auth();
        } catch (e) {
          console.warn('Firebase Auth error:', e);
        }
      }

      // 2. Initialize Cloud Firestore (Primary Database)
      if (firebase.firestore) {
        try {
          fbFirestore = firebase.firestore();
          console.info('Cloud Firestore connected successfully.');
        } catch (e) {
          console.warn('Firestore initialization error:', e);
        }
      }

      isFirebaseOnline = true;
    }
  } catch (err) {
    console.warn('Admin Firebase initialization warning:', err);
    isFirebaseOnline = false;
  }
}

/**
 * Register a new Admin Account using Firebase Authentication & Cloud Firestore
 */
async function registerAdminFirebase(email, password) {
  if (!fbAuth) {
    throw new Error('Firebase Authentication is not initialized. Check your internet connection.');
  }

  // 1. Create user in Firebase Authentication
  const userCredential = await fbAuth.createUserWithEmailAndPassword(email, password);
  const user = userCredential.user;

  // 2. Prepare admin document
  const adminProfile = {
    uid: user.uid,
    email: user.email,
    role: 'Administrator',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 3. Write directly to Cloud Firestore collection 'adminUsers'
  if (fbFirestore) {
    try {
      await fbFirestore.collection('adminUsers').doc(user.uid).set(adminProfile);
      console.log('Successfully written to Cloud Firestore collection: adminUsers/' + user.uid);
    } catch (firestoreErr) {
      console.error('Firestore write error:', firestoreErr);
      throw new Error('Auth created, but Firestore write failed: ' + firestoreErr.message);
    }
  }

  return user;
}

/**
 * Sign In an Admin Account using Firebase Authentication & sync Firestore record
 */
async function loginAdminFirebase(email, password) {
  if (!email || !password) throw new Error('Please enter both email and password.');
  if (!fbAuth) throw new Error('Firebase Authentication is not available. Please check your network connection.');

  const userCredential = await fbAuth.signInWithEmailAndPassword(email, password);
  const user = userCredential.user;

  // Sync admin record to Cloud Firestore
  if (fbFirestore && user) {
    try {
      await fbFirestore.collection('adminUsers').doc(user.uid).set({
        uid: user.uid,
        email: user.email,
        role: 'Administrator',
        lastLogin: new Date().toISOString()
      }, { merge: true });
      console.log('Synced admin login to Firestore.');
    } catch (e) {
      console.warn('Firestore sync note:', e);
    }
  }

  return user;
}

/**
 * Sign Out current Admin from Firebase
 */
async function logoutAdminFirebase() {
  if (fbAuth) {
    await fbAuth.signOut();
  }
}

/**
 * Send official Firebase password reset email link to admin's inbox
 */
async function sendAdminPasswordResetLink(email) {
  if (!email || !email.includes('@')) {
    throw new Error('Please provide a valid admin email address.');
  }
  if (!fbAuth) {
    throw new Error('Firebase Authentication is not initialized.');
  }

  await fbAuth.sendPasswordResetEmail(email);
  console.log('Password reset link successfully sent to ' + email);
  return true;
}

/**
 * Real-time subscription to Sellers in Cloud Firestore
 */
function subscribeAdminDatabase(onAccountsUpdate) {
  if (!isFirebaseOnline || !fbFirestore) return;

  try {
    // Listen to 'sellers' collection in Firestore
    fbFirestore.collection('sellers').onSnapshot((snapshot) => {
      const list = [];
      snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      onAccountsUpdate(list);
    }, (err) => {
      console.warn('Firestore sellers listener note:', err);
    });
  } catch (e) {
    console.warn('Firestore subscription setup error:', e);
  }
}

/**
 * Sync status update for a seller (e.g. approve/reject) to Cloud Firestore
 */
function syncAccountToFirebase(account) {
  if (!isFirebaseOnline || !fbFirestore || !account) return;

  fbFirestore.collection('sellers').doc(String(account.id)).set(account, { merge: true }).catch(err => {
    console.warn('Firestore seller write error:', err);
  });
}

/**
 * Send official BFAR Approval Confirmation Email to the Farm Owner
 * Writes to 'mail' collection (Firebase Trigger Email extension integration)
 * and dispatches multi-channel email notification
 */
async function sendApprovalEmailFirebase(email, farmName) {
  if (!email) return;
  const name = farmName || 'Farm Owner';
  const subject = `🎉 Your AquaSource Account Has Been Approved! — BFAR Verified`;
  const textBody = `Dear ${name},\n\nCongratulations! We are pleased to inform you that your BFAR Fishpond / Aquaculture Farm registration has been reviewed and officially APPROVED by the Bureau of Fisheries and Aquatic Resources (BFAR).\n\nYou can now sign in to your AquaSource Farm Owner Console using your registered email and password.\n\nSign In Here: http://localhost:8080/index.html\n\nInside your console, you can:\n- Dispatch live fingerling transport shipments\n- Assign transport drivers and IoT telemetry monitoring units\n- Monitor dissolved oxygen, turbidity, pH, and water temperature in real-time\n\nThank you for ensuring compliance with BFAR aquatic transport standards.\n\nBest regards,\nBureau of Fisheries and Aquatic Resources (BFAR)\nAquaSource Aquaculture Monitoring System`;

  // 1. Channel A: Firestore 'mail' collection (Firebase Trigger Email Extension)
  const mailDoc = {
    to: [email],
    message: {
      subject: subject,
      text: textBody,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #E1EFF4; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
          <div style="background: linear-gradient(135deg, #0B5D7A 0%, #027368 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">AquaSource</h1>
            <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Bureau of Fisheries and Aquatic Resources (BFAR) Compliance</p>
          </div>
          <div style="padding: 30px 28px; color: #0B2530; line-height: 1.6;">
            <div style="display: inline-block; background-color: #E1F7EF; color: #06A77D; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: bold; margin-bottom: 18px;">
              ✅ Application Status: APPROVED &amp; VERIFIED
            </div>
            <h2 style="font-size: 20px; color: #0B2530; margin-top: 0; margin-bottom: 12px;">Welcome, ${name}!</h2>
            <p style="font-size: 14px; color: #5B7A85; margin-bottom: 20px;">
              Your BFAR Fishpond / Aquaculture Farm permit registration has been thoroughly reviewed and <b>officially approved</b>. Your credentials are now active on the AquaSource platform.
            </p>
            <div style="background-color: #F2F8FB; border-left: 4px solid #06A77D; padding: 14px 18px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 13.5px; color: #0B2530;">
                <b>Registered Email:</b> ${email}<br>
                <b>Permit Status:</b> BFAR Verified &amp; Compliant
              </p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:8080/index.html" style="background: linear-gradient(135deg, #0B5D7A, #027368); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14.5px; display: inline-block; box-shadow: 0 4px 12px rgba(11, 93, 122, 0.3);">
                Sign In to Farm Owner Console →
              </a>
            </div>
            <p style="font-size: 12.5px; color: #8FA8B0; margin-top: 28px; border-top: 1px solid #E1EFF4; padding-top: 18px;">
              This is an automated notification from AquaSource &amp; the Bureau of Fisheries and Aquatic Resources.
            </p>
          </div>
        </div>
      `
    },
    status: 'approved',
    accountStatus: 'approved',
    type: 'farm_owner_approval',
    recipientEmail: email,
    farmName: name,
    createdAt: new Date().toISOString()
  };

  if (fbFirestore) {
    try {
      await fbFirestore.collection('mail').add(mailDoc);
      console.log('✅ [Channel A] Queued in Firestore mail collection for:', email);
    } catch (e) {
      console.warn('Firestore mail queue note:', e);
    }
  }

  // 2. Channel B: EmailJS Client Dispatch
  if (typeof emailjs !== 'undefined') {
    try {
      emailjs.send('service_default', 'template_approval', {
        to_email: email,
        recipient_name: name,
        subject: subject,
        message: textBody
      }).catch(() => {});
    } catch (e) {}
  }
}

/**
 * Send BFAR Disapproval/Rejection Email to Farm Owner with Reason
 */
async function sendRejectionEmailFirebase(email, farmName, reason) {
  if (!email) return;
  const name = farmName || 'Farm Owner';

  const mailDoc = {
    to: [email],
    message: {
      subject: `AquaSource Registration Notice — Action Required`,
      text: `Dear ${name},\n\nThank you for applying for an AquaSource Farm Owner account. Upon reviewing your permit submission, BFAR Administrators were unable to approve your application at this time.\n\nReason: ${reason || 'Permit document requires clarification.'}\n\nYou may log in to update your permit document and re-apply.\n\nSign In Portal: http://localhost:8080/index.html\n\nBureau of Fisheries and Aquatic Resources (BFAR)`,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #E1EFF4;">
          <div style="background-color: #0B5D7A; padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 22px;">AquaSource</h1>
            <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">BFAR Compliance Review</p>
          </div>
          <div style="padding: 26px; color: #0B2530; line-height: 1.6;">
            <div style="display: inline-block; background-color: #FFE7E8; color: #FF5A5F; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: bold; margin-bottom: 16px;">
              Application Notice: Action Required
            </div>
            <h2 style="font-size: 18px; margin-top: 0;">Hello, ${name}</h2>
            <p style="font-size: 13.5px; color: #5B7A85;">
              Your Farm Owner registration was reviewed by BFAR Administrators. At this time, your submission requires attention before approval:
            </p>
            <div style="background-color: #FDF1DD; border-left: 4px solid #F2A93B; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 18px 0;">
              <b>Reason provided:</b><br>
              <span style="font-size: 13.5px; color: #0B2530;">${reason || 'Please provide updated permit document.'}</span>
            </div>
            <p style="font-size: 13.5px; color: #5B7A85;">
              You can re-register or update your permit at any time on the portal.
            </p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="http://localhost:8080/index.html" style="background-color: #0B5D7A; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13.5px; display: inline-block;">
                Go to Portal
              </a>
            </div>
          </div>
        </div>
      `
    },
    status: 'rejected',
    accountStatus: 'rejected',
    type: 'farm_owner_rejection',
    recipientEmail: email,
    farmName: name,
    reason: reason,
    createdAt: new Date().toISOString()
  };

  if (fbFirestore) {
    try {
      await fbFirestore.collection('mail').add(mailDoc);
    } catch (e) {}
  }
}

/**
 * Clean and normalize Philippine mobile numbers to standard local format (09XXXXXXXXX)
 */
function normalizePHPhoneNumber(phone) {
  if (!phone) return '';
  let cleaned = String(phone).replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+63')) {
    cleaned = '0' + cleaned.substring(3);
  } else if (cleaned.startsWith('63') && cleaned.length === 12) {
    cleaned = '0' + cleaned.substring(2);
  }
  return cleaned;
}

/**
 * Send official BFAR Approval SMS Notification to Farm Owner's Mobile Phone
 * Dispatches via SMS Gateway (Semaphore API) and logs to Firestore 'sms_notifications'
 */
async function sendApprovalSMS(phone, farmName) {
  if (!phone) return;
  const name = farmName || 'Farm Owner';
  const cleanPhone = normalizePHPhoneNumber(phone);
  const message = `AquaSource Notice: Congratulations ${name}! Your BFAR Fishpond / Farm registration has been officially APPROVED. You can now sign in at http://localhost:8080/index.html`;

  const smsRecord = {
    recipientPhone: cleanPhone,
    originalPhone: phone,
    farmName: name,
    type: 'approval_sms',
    message: message,
    status: 'sent',
    sentAt: new Date().toISOString()
  };

  // 1. Log to Firestore 'sms_notifications' collection
  if (fbFirestore) {
    try {
      await fbFirestore.collection('sms_notifications').add(smsRecord);
      console.log(`📱 [SMS Queued] Sent approval SMS to ${cleanPhone}`);
    } catch (e) {
      console.warn('Firestore SMS record note:', e);
    }
  }

  // 2. Dispatch via Philippine SMS Gateway (Semaphore API if configured)
  const semaphoreApiKey = localStorage.getItem('aquasource_semaphore_key') || '';
  if (semaphoreApiKey && cleanPhone.length === 11) {
    try {
      await fetch('https://api.semaphore.co/api/v4/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          apikey: semaphoreApiKey,
          number: cleanPhone,
          message: message,
          sendername: 'AQUASOURCE'
        })
      });
      console.log(`📡 [Semaphore SMS] Dispatched to ${cleanPhone}`);
    } catch (apiErr) {
      console.warn('Semaphore SMS API note:', apiErr);
    }
  }
}

/**
 * Send BFAR Disapproval/Rejection SMS Notification to Farm Owner's Mobile Phone
 */
async function sendRejectionSMS(phone, farmName, reason) {
  if (!phone) return;
  const name = farmName || 'Farm Owner';
  const cleanPhone = normalizePHPhoneNumber(phone);
  const cleanReason = reason || 'Permit document requires clarification.';
  const message = `AquaSource Notice: Your farm registration (${name}) was reviewed by BFAR. Status: ACTION REQUIRED. Reason: ${cleanReason}. Please sign in to update permit.`;

  const smsRecord = {
    recipientPhone: cleanPhone,
    originalPhone: phone,
    farmName: name,
    reason: cleanReason,
    type: 'rejection_sms',
    message: message,
    status: 'sent',
    sentAt: new Date().toISOString()
  };

  if (fbFirestore) {
    try {
      await fbFirestore.collection('sms_notifications').add(smsRecord);
      console.log(`📱 [SMS Queued] Sent rejection SMS to ${cleanPhone}`);
    } catch (e) {
      console.warn('Firestore SMS record note:', e);
    }
  }

  const semaphoreApiKey = localStorage.getItem('aquasource_semaphore_key') || '';
  if (semaphoreApiKey && cleanPhone.length === 11) {
    try {
      await fetch('https://api.semaphore.co/api/v4/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          apikey: semaphoreApiKey,
          number: cleanPhone,
          message: message,
          sendername: 'AQUASOURCE'
        })
      });
    } catch (apiErr) {}
  }
}
