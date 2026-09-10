/* ==========================================================================
   AQUASOURCE SELLER FIREBASE ADAPTER (seller-firebase.js)
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

// Active listeners storage for unsubscription
let activeListeners = [];

/**
 * Initialize Seller Firebase Services (Auth & Cloud Firestore)
 */
function initSellerFirebase() {
  try {
    if (typeof firebase !== 'undefined') {
      if (firebase.apps && firebase.apps.length > 0) {
        fbApp = firebase.app();
      } else {
        fbApp = firebase.initializeApp(firebaseConfig);
      }

      if (firebase.auth) {
        try {
          fbAuth = firebase.auth();
        } catch (e) {
          console.warn('Firebase Auth initialization warning:', e);
        }
      }

      if (firebase.firestore) {
        try {
          fbFirestore = firebase.firestore();
          console.info('Cloud Firestore connected successfully for Seller Portal.');
        } catch (e) {
          console.warn('Firestore initialization warning:', e);
        }
      }

      isFirebaseOnline = true;
    }
  } catch (err) {
    console.warn('Seller Firebase initialization error:', err);
    isFirebaseOnline = false;
  }
}

/**
 * Register a new Hatchery Seller Account (Allows re-application for rejected accounts, blocks approved accounts)
 */
async function registerSellerFirebase(sellerData) {
  if (!fbAuth) {
    throw new Error('Firebase Authentication is not available. Please check your internet connection.');
  }

  const { hatcheryName, email, password, phone, address, permitDataUrl, permitFileName } = sellerData;

  // 1. Check existing status in Cloud Firestore
  let existingSeller = null;
  if (fbFirestore) {
    try {
      const q = await fbFirestore.collection('sellers').where('email', '==', email).get();
      if (!q.empty) {
        existingSeller = { id: q.docs[0].id, ...q.docs[0].data() };
      }
    } catch (e) {
      console.warn('Check existing seller query note:', e);
    }
  }

  // 2. Enforce Approval vs Re-application Rules
  if (existingSeller) {
    const existingStatus = (existingSeller.status || '').toLowerCase();
    if (existingStatus === 'approved') {
      throw new Error('An approved hatchery account with this email already exists. Please sign in instead of registering.');
    }
    if (existingStatus === 'pending') {
      throw new Error('Your hatchery application is currently under review by BFAR Administrators. Please wait for approval before re-applying.');
    }
    // If existingStatus === 'rejected', we allow them to re-apply with new details & permit!
  }

  // 3. Create or Re-authenticate in Firebase Auth
  let user = null;
  try {
    const userCredential = await fbAuth.createUserWithEmailAndPassword(email, password);
    user = userCredential.user;
  } catch (authErr) {
    if (authErr.code === 'auth/email-already-in-use') {
      if (existingSeller && existingSeller.status === 'approved') {
        throw new Error('An approved hatchery account with this email already exists. Please sign in instead of registering.');
      } else if (existingSeller && existingSeller.status === 'pending') {
        throw new Error('Your hatchery application is currently under review by BFAR Administrators. Please wait for approval.');
      } else {
        // Re-application or registration recovery: try to sign in with provided password
        try {
          const cred = await fbAuth.signInWithEmailAndPassword(email, password);
          user = cred.user;
        } catch (signInErr) {
          user = { uid: (existingSeller && (existingSeller.id || existingSeller.uid)) || ('seller_' + Date.now()), email: email };
        }
      }
    } else {
      throw authErr;
    }
  }

  const uid = (user && user.uid) || (existingSeller && (existingSeller.id || existingSeller.uid)) || ('seller_' + Date.now());

  // 4. Prepare seller document with status reset to 'pending' for Admin review
  const sellerProfile = {
    id: uid,
    uid: uid,
    hatchery: hatcheryName,
    hatcheryName: hatcheryName,
    applicant: hatcheryName,
    email: email,
    phone: phone || '',
    address: address || '',
    permitFileName: permitFileName || 'bfar-permit.jpg',
    permitUrl: permitDataUrl || '',
    permitSeed: Math.floor(Math.random() * 900) + 100,
    role: 'Seller',
    status: 'pending', // Re-submitted application is back to pending review
    reason: '', // Clear previous rejection reason
    submitted: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    createdAt: (existingSeller && existingSeller.createdAt) || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalDeliveries: (existingSeller && existingSeller.totalDeliveries) || 0,
    activeShipments: (existingSeller && existingSeller.activeShipments) || 0
  };

  // 5. Save directly to Cloud Firestore 'sellers' collection
  if (fbFirestore) {
    try {
      await fbFirestore.collection('sellers').doc(uid).set(sellerProfile, { merge: true });
      console.log('Seller application saved in Firestore: sellers/' + uid);
    } catch (err) {
      console.error('Firestore seller record error:', err);
    }
  }

  // Always sign out after registration so user waits on login screen for admin review
  try {
    await fbAuth.signOut();
  } catch (e) {}

  return { user, profile: sellerProfile };
}

/**
 * Sign In Hatchery Seller
 */
async function loginSellerFirebase(email, password) {
  if (!email || !password) {
    throw new Error('Please enter both email and password.');
  }
  if (!fbAuth) {
    throw new Error('Firebase Authentication is not available.');
  }

  const userCredential = await fbAuth.signInWithEmailAndPassword(email, password);
  const user = userCredential.user;

  let sellerProfile = null;

  // Retrieve seller document from Firestore
  if (fbFirestore) {
    try {
      const docSnap = await fbFirestore.collection('sellers').doc(user.uid).get();
      if (docSnap.exists) {
        sellerProfile = { id: docSnap.id, ...docSnap.data() };
      }
    } catch (e) {
      console.warn('Firestore seller read note:', e);
    }
  }

  // Fallback profile if Firestore document does not exist yet
  if (!sellerProfile) {
    sellerProfile = {
      id: user.uid,
      uid: user.uid,
      email: user.email,
      hatcheryName: user.displayName || user.email.split('@')[0],
      hatchery: user.displayName || user.email.split('@')[0],
      status: 'pending',
      role: 'Seller'
    };
  }

  // Trapping: Enforce Admin Approval before allowing login
  const status = (sellerProfile.status || 'pending').toLowerCase();
  if (status === 'pending') {
    await fbAuth.signOut();
    throw new Error('⏳ Your seller registration is currently under review by BFAR Administrators. Please wait for account approval before logging in.');
  }

  if (status === 'rejected') {
    await fbAuth.signOut();
    const reasonText = sellerProfile.reason ? ` Reason: ${sellerProfile.reason}` : '';
    throw new Error(`⛔ Your seller registration was disapproved by BFAR Administrators.${reasonText}`);
  }

  return { user, profile: sellerProfile };
}

/**
 * Send Password Reset Link to Seller Email
 */
async function sendSellerPasswordResetLink(email) {
  if (!email || !email.includes('@')) {
    throw new Error('Please provide a valid email address.');
  }
  if (!fbAuth) {
    throw new Error('Firebase Authentication is not available.');
  }

  await fbAuth.sendPasswordResetEmail(email);
  console.log('Password reset email dispatched to ' + email);
  return true;
}

/**
 * Sign Out Current Seller
 */
async function logoutSellerFirebase() {
  // Clear any live snapshot subscriptions
  unsubscribeSellerData();

  if (fbAuth) {
    await fbAuth.signOut();
  }
}

/**
 * Real-time Subscription to Seller Data (Orders, Personnel, Telemetry, Notifications, Profile)
 */
function subscribeSellerData(sellerId, callbacks) {
  unsubscribeSellerData();
  if (!isFirebaseOnline || !fbFirestore || !sellerId) return;

  const { onOrders, onPersonnel, onTelemetry, onNotifications, onProfile } = callbacks;

  try {
    // 1. Subscribe to Seller Profile & Permit Status
    if (onProfile) {
      const unsubProfile = fbFirestore.collection('sellers').doc(sellerId).onSnapshot((doc) => {
        if (doc.exists) {
          onProfile({ id: doc.id, ...doc.data() });
        }
      }, (err) => console.warn('Seller profile listener note:', err));
      activeListeners.push(unsubProfile);
    }

    // 2. Subscribe to Transport Orders for this Seller
    if (onOrders) {
      const unsubOrders = fbFirestore.collection('orders')
        .where('sellerId', '==', sellerId)
        .onSnapshot((snapshot) => {
          const list = [];
          snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
          // Sort newest first
          list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          onOrders(list);
        }, (err) => {
          console.warn('Orders listener note:', err);
          // Fallback query without filter if composite index is pending
          fbFirestore.collection('orders').onSnapshot((snap) => {
            const list = [];
            snap.forEach(d => {
              const data = d.data();
              if (data.sellerId === sellerId) list.push({ id: d.id, ...data });
            });
            onOrders(list);
          });
        });
      activeListeners.push(unsubOrders);
    }

    // 3. Subscribe to Transport Personnel for this Seller
    if (onPersonnel) {
      const unsubPersonnel = fbFirestore.collection('personnel')
        .where('sellerId', '==', sellerId)
        .onSnapshot((snapshot) => {
          const list = [];
          snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
          onPersonnel(list);
        }, (err) => {
          console.warn('Personnel listener note:', err);
          fbFirestore.collection('personnel').onSnapshot((snap) => {
            const list = [];
            snap.forEach(d => {
              const data = d.data();
              if (data.sellerId === sellerId) list.push({ id: d.id, ...data });
            });
            onPersonnel(list);
          });
        });
      activeListeners.push(unsubPersonnel);
    }

    // 4. Subscribe to Telemetry History for this Seller
    if (onTelemetry) {
      const unsubTelemetry = fbFirestore.collection('telemetry')
        .where('sellerId', '==', sellerId)
        .onSnapshot((snapshot) => {
          const list = [];
          snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
          list.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
          onTelemetry(list);
        }, (err) => {
          console.warn('Telemetry listener note:', err);
          fbFirestore.collection('telemetry').onSnapshot((snap) => {
            const list = [];
            snap.forEach(d => {
              const data = d.data();
              if (data.sellerId === sellerId) list.push({ id: d.id, ...data });
            });
            onTelemetry(list);
          });
        });
      activeListeners.push(unsubTelemetry);
    }

    // 5. Subscribe to Notifications for this Seller
    if (onNotifications) {
      const unsubNotifs = fbFirestore.collection('notifications')
        .where('sellerId', '==', sellerId)
        .onSnapshot((snapshot) => {
          const list = [];
          snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
          list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          onNotifications(list);
        }, (err) => {
          console.warn('Notifications listener note:', err);
          fbFirestore.collection('notifications').onSnapshot((snap) => {
            const list = [];
            snap.forEach(d => {
              const data = d.data();
              if (data.sellerId === sellerId) list.push({ id: d.id, ...data });
            });
            onNotifications(list);
          });
        });
      activeListeners.push(unsubNotifs);
    }
  } catch (err) {
    console.error('Subscription error:', err);
  }
}

/**
 * Unsubscribe all active Firestore listeners
 */
function unsubscribeSellerData() {
  activeListeners.forEach(unsub => {
    if (typeof unsub === 'function') {
      try { unsub(); } catch (e) {}
    }
  });
  activeListeners = [];
}

/**
 * Create a new Transport Order in Cloud Firestore
 */
async function createOrderFirebase(orderData) {
  if (!fbFirestore) throw new Error('Firestore is not available.');

  const code = orderData.code;
  const docId = code || ('AQS-' + Math.random().toString(36).substring(2, 7).toUpperCase());

  const fullOrder = {
    ...orderData,
    id: docId,
    code: docId,
    trackingCode: docId,
    batchId: `Batch #${docId}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 1. Save to single 'orders' collection indexed by docId
  await fbFirestore.collection('orders').doc(docId).set(fullOrder);

  // 2. Log notification for the seller
  await addNotificationFirebase({
    sellerId: orderData.sellerId,
    type: 'info',
    title: `Order Created — Batch #${docId}`,
    body: `Transport order for ${orderData.buyer} (${orderData.quantity} pcs ${orderData.species}) has been assigned to ${orderData.personnel}.`,
    createdAt: new Date().toISOString()
  });

  return { id: docId, ...fullOrder };
}

/**
 * Update Order Fields (status, cancellation, telemetry, etc.)
 */
async function updateOrderFirebase(orderId, updateData) {
  if (!orderId || !fbFirestore) return;

  const dataToSave = {
    ...updateData,
    updatedAt: new Date().toISOString()
  };

  try {
    // 1. Direct update by doc ID
    await fbFirestore.collection('orders').doc(orderId).set(dataToSave, { merge: true });
  } catch (err) {
    console.warn('Direct doc update note:', err);
  }

  try {
    // 2. Query by 'code' to ensure consistency
    const q = await fbFirestore.collection('orders').where('code', '==', orderId).get();
    if (!q.empty) {
      for (const doc of q.docs) {
        await doc.ref.set(dataToSave, { merge: true });
      }
    }
  } catch (qErr) {
    console.warn('Query by code update note:', qErr);
  }

  return dataToSave;
}

/**
 * Update Full Order Details (buyer, destination, species, quantity, driver, etc.)
 */
async function updateOrderFullFirebase(orderId, updatedFields) {
  if (!orderId || !fbFirestore) return;

  const dataToSave = {
    ...updatedFields,
    updatedAt: new Date().toISOString()
  };

  await fbFirestore.collection('orders').doc(orderId).set(dataToSave, { merge: true });

  return dataToSave;
}

/**
 * Update Order Status (e.g. In Transit, Delivered, Telemetry changes)
 */
async function updateOrderStatusFirebase(orderId, status, extraData = {}) {
  if (!orderId || !fbFirestore) return;

  const updateData = {
    status: status,
    stage: extraData.stage || (status === 'delivered' ? 3 : status === 'transit' ? 1 : 0),
    updatedAt: new Date().toISOString(),
    ...extraData
  };

  try {
    await fbFirestore.collection('orders').doc(orderId).set(updateData, { merge: true });
  } catch (e) {
    console.warn('Firestore order update note:', e);
  }
}

/**
 * Add or Invite Transport Personnel
 */
async function addPersonnelFirebase(personnelData) {
  if (!fbFirestore) throw new Error('Firestore is not available.');

  const cleanData = {
    sellerId: personnelData.sellerId || '',
    firstName: personnelData.firstName || '',
    lastName: personnelData.lastName || '',
    name: personnelData.name || `${personnelData.firstName || ''} ${personnelData.lastName || ''}`.trim(),
    phone: personnelData.phone || '',
    email: personnelData.email || '',
    password: personnelData.password || '',
    unit: personnelData.unit || '',
    unitScanned: Boolean(personnelData.unitScanned),
    status: personnelData.status || 'active',
    createdAt: new Date().toISOString()
  };

  const docRef = await fbFirestore.collection('personnel').add(cleanData);
  return { id: docRef.id, ...cleanData };
}

/**
 * Update Personnel Status (Approve, Reject, or Toggle Online)
 */
async function updatePersonnelStatusFirebase(personnelId, status) {
  if (!fbFirestore || !personnelId) return;

  await fbFirestore.collection('personnel').doc(personnelId).set({
    status: status,
    updatedAt: new Date().toISOString()
  }, { merge: true });
}

/**
 * Delete / Remove Transport Personnel
 */
async function deletePersonnelFirebase(personnelId) {
  if (!fbFirestore || !personnelId) return;
  await fbFirestore.collection('personnel').doc(personnelId).delete();
}

/**
 * Update Seller Profile Info
 */
async function updateSellerProfileFirebase(sellerId, profileData) {
  if (!fbFirestore || !sellerId) throw new Error('Firestore is not available.');

  await fbFirestore.collection('sellers').doc(sellerId).set({
    ...profileData,
    updatedAt: new Date().toISOString()
  }, { merge: true });
}

/**
 * Log Telemetry Sensor Event in Firestore
 */
async function logTelemetryFirebase(telemetryData) {
  if (!fbFirestore) return;

  await fbFirestore.collection('telemetry').add({
    ...telemetryData,
    timestamp: new Date().toISOString()
  });
}

/**
 * Add In-App Notification in Firestore
 */
async function addNotificationFirebase(notificationData) {
  if (!fbFirestore) return;

  try {
    await fbFirestore.collection('notifications').add({
      ...notificationData,
      read: false,
      createdAt: new Date().toISOString()
    });
  } catch (e) {
    console.warn('Add notification note:', e);
  }
}
