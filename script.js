/* ==========================================================================
   AQUASOURCE CLIENT APPLICATION ENGINE (script.js)
   ========================================================================== */

// Global Application State
let activeTrackingCode = null;
let currentShipmentData = null;
let fbUnsubscribe = null;

// Map & Audio handles
let leafletMap = null;
let truckMarker = null;
let originMarker = null;
let destMarker = null;
let routePolyline = null;
let audioContext = null;
let toastTimer = null;

// SVG Icons Dictionary for Clean Vector Rendering
const ICONS = {
  truck: '<svg class="svg-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>',
  hatchery: '<svg class="svg-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="9" y1="22" x2="9" y2="22.01"></line><line x1="15" y1="22" x2="15" y2="22.01"></line><line x1="10" y1="6" x2="14" y2="6"></line><line x1="10" y1="10" x2="14" y2="10"></line><line x1="10" y1="14" x2="14" y2="14"></line><line x1="10" y1="18" x2="14" y2="18"></line></svg>',
  pin: '<svg class="svg-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
  target: '<svg class="svg-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>',
  ban: '<svg class="svg-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>',
  clock: '<svg class="svg-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
  check: '<svg class="svg-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
  warning: '<svg class="svg-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
  box: '<svg class="svg-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>'
};


/* =========================================================================
   APPLICATION LIFECYCLE
   ========================================================================= */

window.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Firebase connection
  if (typeof initFirebaseApp === 'function') {
    initFirebaseApp();
  }

  // 2. Initialize Leaflet Interactive GPS Map
  initLeafletMap();

  // 3. Check for tracking code query parameter in URL (e.g. ?code=AQS-7X29K)
  const urlParams = new URLSearchParams(window.location.search);
  const codeParam = urlParams.get('code') || urlParams.get('track');
  if (codeParam) {
    const inputEl = document.getElementById('codeInput');
    if (inputEl) {
      inputEl.value = codeParam.trim();
      trackShipment();
    }
  }

  // 4. Bind Enter Key on search input
  const codeInput = document.getElementById('codeInput');
  if (codeInput) {
    codeInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        trackShipment();
      }
    });
  }
});

/* =========================================================================
   TRACKING & DATABASE SUBSCRIPTIONS
   ========================================================================= */

/**
 * Main tracking lookup handler
 */
function trackShipment() {
  const inputEl = document.getElementById('codeInput');
  const errEl = document.getElementById('codeError');
  const errText = document.getElementById('codeErrorMsg');

  if (!inputEl) return;
  const rawInput = inputEl.value.trim().toUpperCase();

  if (!rawInput) {
    if (errText) errText.textContent = 'Please enter a valid tracking code.';
    if (errEl) errEl.classList.add('show');
    return;
  }

  activeTrackingCode = rawInput;
  currentShipmentData = null;
  if (errEl) errEl.classList.remove('show');

  // Unsubscribe previous listeners
  if (fbUnsubscribe) {
    fbUnsubscribe();
    fbUnsubscribe = null;
  }

  listenToShipmentTracking(activeTrackingCode);
}

/**
 * Universal real-time listener across Firestore ('orders', 'shipments') and RTDB
 */
function listenToShipmentTracking(code) {
  let hasFound = false;

  // 1. Query Cloud Firestore
  if (isFirebaseOnline && fbFirestore) {
    try {
      // A. Query 'orders' collection by doc ID
      const unsubOrdersDoc = fbFirestore.collection('orders').doc(code).onSnapshot((doc) => {
        if (doc.exists) {
          hasFound = true;
          onShipmentDataReceived(normalizeShipmentData(doc.data(), code));
        }
      }, (err) => console.warn('Firestore orders doc note:', err));

      // B. Query 'orders' collection where code field matches
      const unsubOrdersQuery = fbFirestore.collection('orders').where('code', '==', code).onSnapshot((snap) => {
        if (!snap.empty) {
          hasFound = true;
          const firstDoc = snap.docs[0].data();
          onShipmentDataReceived(normalizeShipmentData(firstDoc, code));
        }
      }, (err) => console.warn('Firestore orders query note:', err));

      fbUnsubscribe = () => {
        try { unsubOrdersDoc(); } catch (e) {}
        try { unsubOrdersQuery(); } catch (e) {}
      };
    } catch (e) {
      console.warn('Firestore tracking setup error:', e);
    }
  }

  // 2. Check for non-existent tracking code
  setTimeout(() => {
    if (!hasFound && !currentShipmentData) {
      handleCodeNotFound(code);
    }
  }, 1200);
}

/**
 * Normalizes any database order/shipment schema into the Buyer UI structure
 */
function normalizeShipmentData(raw, code) {
  if (!raw) return null;

  const trackingCode = raw.trackingCode || raw.code || code;
  const isCancelled = raw.status === 'cancelled' || raw.statusLabel === 'Cancelled';
  const stage = typeof raw.stage === 'number' ? raw.stage : (raw.status === 'delivered' ? 3 : (raw.status === 'transit' ? 1 : 0));
  const isDelivered = raw.status === 'delivered' || raw.statusLabel === 'Delivered' || stage === 3 || raw.isExpired === true;
  const isExpired = isDelivered;
  const statusLabel = isCancelled ? 'Cancelled' : (isDelivered ? 'Delivered (Expired)' : (raw.status?.label || raw.statusLabel || 'In Transit'));
  const progressPercent = isCancelled ? 100 : (typeof raw.status?.progressPercent === 'number' ? raw.status.progressPercent : (stage === 3 ? 100 : (stage === 2 ? 82 : 45)));

  // Extract water quality
  let turbVal = 6.0, doVal = 6.8, phVal = 7.2, tempVal = 28.5;
  if (raw.waterQuality) {
    turbVal = raw.waterQuality.turbidity?.value ?? raw.waterQuality.turbidity ?? 6.0;
    doVal = raw.waterQuality.dissolvedOxygen?.value ?? raw.waterQuality.dissolvedOxygen ?? 6.8;
    phVal = raw.waterQuality.ph?.value ?? raw.waterQuality.ph ?? 7.2;
    tempVal = raw.waterQuality.temperature?.value ?? raw.waterQuality.temp ?? 28.5;
  } else {
    turbVal = Number(raw.turbidity || 6.0);
    doVal = Number(raw.dissolvedOxygen || 6.8);
    phVal = Number(raw.pH || 7.2);
    tempVal = Number(raw.temp || 28.5);
  }

  const sellerName = raw.parties?.seller || raw.sellerName || raw.hatchery || raw.hatcheryName || 'Bluewater Tilapia Hatchery';
  const buyerName = raw.parties?.buyer || raw.buyer || 'Green Water Farms';
  const destAddress = raw.parties?.destination || raw.dest || 'Aquaculture Farm';
  const originAddress = raw.parties?.origin || raw.origin || 'Hatchery Dispatch Center';
  const driverName = raw.driverName || raw.transport?.driver || raw.personnel || 'Transport Driver';
  const driverPhone = raw.driverPhone || raw.phone || raw.personnelPhone || raw.contactNumber || '0917 555 0101';
  const unitId = (raw.transport?.monitoringUnit || raw.unit || '').trim();
  const species = raw.shipment?.species || raw.species || 'Tilapia Fingerlings';
  const qty = raw.shipment?.quantity || (raw.quantity ? `${Number(raw.quantity).toLocaleString()} pcs` : '3,000 pcs');
  const dispatchedAt = raw.shipment?.dispatchedAt || (raw.dispatchTime ? new Date(raw.dispatchTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently');

  return {
    id: trackingCode,
    trackingCode: trackingCode,
    batchId: raw.batchId || `Tracking #${trackingCode}`,
    parties: {
      seller: sellerName,
      buyer: buyerName,
      origin: originAddress,
      destination: destAddress
    },
    shipment: {
      species: isCancelled ? '— (Order Cancelled)' : species,
      quantity: isCancelled ? '—' : qty,
      dispatchedAt: isCancelled ? 'Cancelled' : dispatchedAt,
      expectedArrival: isCancelled ? 'Cancelled' : (stage === 3 ? 'Delivered' : (raw.eta || '28 mins'))
    },
    transport: {
      driver: isCancelled ? '—' : driverName,
      driverName: isCancelled ? '—' : driverName,
      driverPhone: isCancelled ? '—' : driverPhone,
      monitoringUnit: isCancelled ? '—' : unitId,
      route: isCancelled ? 'Shipment Cancelled' : `${originAddress} → ${destAddress}`
    },
    status: {
      stage: isCancelled ? 0 : stage,
      label: statusLabel,
      progressPercent: progressPercent,
      etaMinutes: isCancelled ? 0 : (stage === 3 ? 0 : (stage === 2 ? 8 : 28)),
      distanceKm: isCancelled ? 0.0 : (stage === 3 ? 0.0 : 18.2),
      speedKmH: 0
    },
    location: {
      lat: stage === 3 ? 10.1500 : (stage === 2 ? 10.2200 : 10.2850),
      lng: stage === 3 ? 123.6400 : (stage === 2 ? 123.7500 : 123.8250),
      currentRoad: isCancelled ? 'Shipment Cancelled' : destAddress
    },
    waterQuality: isCancelled ? {
      turbidity: { value: '—', unit: '', status: 'Cancelled', color: 'grey' },
      dissolvedOxygen: { value: '—', unit: '', status: 'Cancelled', color: 'grey' },
      ph: { value: '—', unit: '', status: 'Cancelled', color: 'grey' },
      temperature: { value: '—', unit: '', status: 'Cancelled', color: 'grey' },
      lastUpdated: 'Tracking Inactive'
    } : {
      turbidity: { value: turbVal, unit: 'NTU', status: turbVal > 25 ? 'Critical (> 25 NTU)' : 'Safe (< 20 NTU)', color: turbVal > 25 ? 'red' : 'green' },
      dissolvedOxygen: { value: doVal, unit: 'mg/L', status: doVal < 4.0 ? 'Critical (< 4.0 mg/L)' : 'Safe (> 5.0 mg/L)', color: doVal < 4.0 ? 'red' : 'green' },
      ph: { value: phVal, unit: 'pH', status: (phVal < 6.5 || phVal > 8.5) ? 'Warning (6.5 - 8.5)' : 'Safe (6.8 – 8.2)', color: (phVal < 6.5 || phVal > 8.5) ? 'amber' : 'green' },
      temperature: { value: tempVal, unit: '°C', status: tempVal > 32.0 ? 'Warm (> 32°C)' : 'Safe (26°C – 30°C)', color: tempVal > 32.0 ? 'amber' : 'green' },
      lastUpdated: new Date().toLocaleTimeString()
    },
    notifications: isCancelled ? [
      { id: 'n1', type: 'critical', icon: ICONS.ban, title: 'Shipment Cancelled', time: raw.cancelledAt ? new Date(raw.cancelledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently', body: `Tracking #${trackingCode} has been cancelled upon buyer request.` }
    ] : (raw.notifications || [
      { id: 'n1', type: 'info', icon: ICONS.truck, title: 'Shipment En Route', time: 'Recently', body: `Tracking #${trackingCode} is en route to ${buyerName}.` }
    ]),
    deliverySummary: {
      deliveredAt: stage === 3 ? 'Completed' : 'In Progress',
      totalDuration: stage === 3 ? '1h 25m' : 'In Progress',
      distanceTraveled: '42 km',
      avgSpeed: '48 km/h',
      survivalRate: '99.8%',
      finalReport: {
        turbidity: `${turbVal} NTU — Safe`,
        dissolvedOxygen: `${doVal} mg/L — Safe`,
        ph: `${phVal} — Safe`,
        temperature: `${tempVal}°C — Safe`
      }
    }
  };
}

/**
 * Handle invalid or missing tracking codes
 */
function handleCodeNotFound(code) {
  const errEl = document.getElementById('codeError');
  const errText = document.getElementById('codeErrorMsg');
  if (errText) errText.innerHTML = `Shipment <b>${code}</b> not found in database. Please verify tracking code with your seller.`;
  if (errEl) errEl.classList.add('show');

  const dash = document.getElementById('dashboard');
  const comp = document.getElementById('complete');
  const badge = document.getElementById('navBadge');

  if (dash) dash.classList.remove('show');
  if (comp) comp.classList.remove('show');
  if (badge) badge.classList.remove('show');
}

/* =========================================================================
   UI RENDERING & TELEMETRY UPDATES
   ========================================================================= */

/**
 * Main telemetry updater
 */
function onShipmentDataReceived(data) {
  currentShipmentData = data;
  const errEl = document.getElementById('codeError');
  const errText = document.getElementById('codeErrorMsg');

  if (data.isExpired || data.status?.stage === 3 || String(data.status?.label).toLowerCase().includes('delivered')) {
    if (errText) errText.innerHTML = `${ICONS.clock} <b>Tracking Code Expired:</b> Shipment #${data.trackingCode} has been delivered and completed. Real-time telemetry tracking is closed.`;
    if (errEl) {
      errEl.className = 'code-error show expired-notice';
    }
  } else {
    if (errEl) errEl.classList.remove('show');
  }

  // 1. Tracking Code & Sub-header
  const batchEl = document.getElementById('dashBatchId');
  const routeSub = document.getElementById('dashRouteSub');
  if (batchEl) batchEl.textContent = data.batchId || `Tracking #${data.trackingCode}`;
  if (routeSub) routeSub.textContent = `${data.parties?.seller || 'Farm Owner'} → ${data.parties?.buyer || 'Fish Farm'}`;

  renderAppUI(data);
}

function renderAppUI(data) {
  const stage = data.status?.stage ?? 1;
  const statusLabel = data.status?.label || 'In Transit';
  const isCancelled = statusLabel === 'Cancelled';

  // 2. Main Pill Status
  const pill = document.getElementById('statusPill');
  const pillText = document.getElementById('statusPillText');
  const navBadge = document.getElementById('navBadge');
  const navBadgeText = document.getElementById('navBadgeText');

  if (pill && pillText) {
    pill.className = isCancelled ? 'status-pill critical' : 'status-pill';
    pillText.textContent = statusLabel;
  }
  if (navBadge && navBadgeText) {
    navBadgeText.textContent = statusLabel;
    navBadge.className = isCancelled ? 'nav-badge critical show' : 'nav-badge show';
  }

  // 3. Threshold Check for Emergency Alert / Status
  const isCriticalDO = !isCancelled && data.waterQuality?.dissolvedOxygen?.value < 4.0;
  const isCriticalTemp = !isCancelled && (data.waterQuality?.temperature?.value > 32.0 || data.waterQuality?.temperature?.value < 22.0);

  if (isCancelled) {
    if (pill) pill.classList.add('critical');
    if (navBadge) navBadge.classList.add('critical');
  } else if (isCriticalDO || isCriticalTemp) {
    if (pill) pill.classList.add('critical');
    triggerWaterAlertModal(data.waterQuality);
  } else if (stage === 3 || statusLabel === 'Delivered') {
    if (pill) pill.classList.add('success');
  }

  // 4. Progress Track & Milestones
  const progressFill = document.getElementById('progressFill');
  const percent = isCancelled ? 100 : (data.status?.progressPercent || (stage === 1 ? 45 : (stage === 2 ? 85 : 100)));
  if (progressFill) {
    progressFill.style.width = percent + '%';
    if (isCancelled) progressFill.style.background = 'var(--critical)';
  }

  const stepDeparted = document.getElementById('stepDeparted');
  const stepHalfway = document.getElementById('stepHalfway');
  const stepNear = document.getElementById('stepNear');
  const stepArrived = document.getElementById('stepArrived');

  if (stepDeparted) stepDeparted.className = isCancelled ? '' : 'done';
  if (stepHalfway) stepHalfway.className = (!isCancelled && stage >= 1) ? 'done' : '';
  if (stepNear) stepNear.className = (!isCancelled && stage >= 2) ? 'done' : '';
  if (stepArrived) stepArrived.className = (!isCancelled && stage >= 3) ? 'done' : '';

  // 5. ETA & Distance
  const etaEl = document.getElementById('etaValue');
  const distEl = document.getElementById('distValue');
  if (etaEl) etaEl.innerHTML = isCancelled ? `—` : `${data.status?.etaMinutes || 0}<span>min</span>`;
  if (distEl) distEl.innerHTML = isCancelled ? `—` : `${data.status?.distanceKm || 0.0}<span>km</span>`;

  // 6. Map Telemetry Info
  const speedEl = document.getElementById('dashSpeed');
  const locEl = document.getElementById('dashLocation');
  const coordsEl = document.getElementById('dashCoords');
  if (speedEl) speedEl.textContent = isCancelled ? '0 km/h' : `${data.status?.speedKmH || 0} km/h`;
  if (locEl) locEl.textContent = isCancelled ? 'Shipment Cancelled' : (data.location?.currentRoad || 'Transport Route');
  if (coordsEl) {
    coordsEl.textContent = isCancelled ? '—' : (data.location?.lat ? `${data.location.lat.toFixed(4)}, ${data.location.lng.toFixed(4)}` : '10.3157, 123.8854');
  }

  // 7. Water Quality Cards
  renderWaterQuality(data.waterQuality, isCancelled);

  // 8. Driver & Vehicle Information Card
  const driverNameEl = document.getElementById('detailDriverName');
  const driverPhoneEl = document.getElementById('detailDriverPhone');
  const driverPillBadge = document.getElementById('driverPillBadge');
  const driverStatusText = document.getElementById('driverStatusText');

  if (driverNameEl) driverNameEl.textContent = isCancelled ? '— (Shipment Cancelled)' : (data.transport?.driver || 'Transport Personnel');
  if (driverPhoneEl) driverPhoneEl.textContent = isCancelled ? '—' : (data.transport?.driverPhone || '—');
  if (driverPillBadge) {
    driverPillBadge.textContent = isCancelled ? 'Cancelled' : 'Active Driver';
    driverPillBadge.className = isCancelled ? 'status-pill critical' : 'status-pill success';
  }
  if (driverStatusText) {
    driverStatusText.textContent = isCancelled ? 'Shipment Cancelled' : 'Assigned & Active';
    driverStatusText.style.color = isCancelled ? 'var(--critical)' : 'var(--success)';
  }

  // 9. Parties & Shipment Info Details
  const detailSeller = document.getElementById('detailSeller');
  const detailBuyer = document.getElementById('detailBuyer');
  const detailCode = document.getElementById('detailTrackingCode');
  const detailSpecies = document.getElementById('detailSpecies');
  const detailQuantity = document.getElementById('detailQuantity');
  const detailDispatched = document.getElementById('detailDispatched');
  const detailExpectedArrival = document.getElementById('detailExpectedArrival');
  const detailUnit = document.getElementById('detailUnit');
  const detailLastSync = document.getElementById('detailLastSync');

  if (detailSeller) detailSeller.textContent = data.parties?.seller || 'Bluewater Hatchery';
  if (detailBuyer) detailBuyer.textContent = data.parties?.buyer || 'Green Water Farms';
  if (detailCode) detailCode.textContent = data.trackingCode || activeTrackingCode;
  if (detailSpecies) detailSpecies.textContent = isCancelled ? '—' : (data.shipment?.species || 'Tilapia Fingerlings');
  if (detailQuantity) detailQuantity.textContent = isCancelled ? '—' : (data.shipment?.quantity || '3,000 pcs');
  if (detailDispatched) detailDispatched.textContent = isCancelled ? 'Cancelled' : (data.shipment?.dispatchedAt || 'Today, 07:10 AM');
  if (detailExpectedArrival) detailExpectedArrival.textContent = isCancelled ? 'Cancelled' : (data.shipment?.expectedArrival || 'Today, 09:05 AM');
  if (detailUnit) detailUnit.textContent = isCancelled ? '—' : ((data.transport?.monitoringUnit && data.transport.monitoringUnit !== 'undefined' && data.transport.monitoringUnit.trim() !== '') ? data.transport.monitoringUnit : 'Pending Driver Scan');
  if (detailLastSync) detailLastSync.textContent = isCancelled ? 'Tracking Inactive' : (data.waterQuality?.lastUpdated || 'Just now');

  // 9. Dispatch Notifications
  renderNotifications(data.notifications || []);

  // 10. Live Map Marker & Dynamic Route Update (Seller Origin -> Buyer Destination)
  if (!isCancelled) {
    initOrUpdateBuyerMap(data);
  }

  // 11. Toggle Dashboard vs Delivery Completed View
  const dashEl = document.getElementById('dashboard');
  const compEl = document.getElementById('complete');

  if (stage === 3 || statusLabel === 'Delivered') {
    renderDeliveryCompleteView(data);
  } else {
    if (compEl) compEl.classList.remove('show');
    if (dashEl) dashEl.classList.add('show');
  }

  // Smooth scroll into telemetry view
  setTimeout(() => {
    const target = (stage === 3) ? compEl : dashEl;
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

/**
 * Render Water Quality Telemetry
 */
function renderWaterQuality(wq, isCancelled = false) {
  if (isCancelled || !wq) {
    setWQCard('Turb', '—', '', 'grey', 'Cancelled');
    setWQCard('DO', '—', '', 'grey', 'Cancelled');
    setWQCard('PH', '—', '', 'grey', 'Cancelled');
    setWQCard('Temp', '—', '', 'grey', 'Cancelled');
    return;
  }

  const turb = wq.turbidity || { value: 6, unit: 'NTU', status: 'Safe (< 20 NTU)', color: 'green' };
  setWQCard('Turb', turb.value, turb.unit, turb.color || 'green', turb.status || 'Safe (< 20 NTU)');

  const doData = wq.dissolvedOxygen || { value: 6.7, unit: 'mg/L', status: 'Safe (> 5.0 mg/L)', color: 'green' };
  setWQCard('DO', doData.value, doData.unit, doData.color || 'green', doData.status || 'Safe (> 5.0 mg/L)');

  const phData = wq.ph || { value: 7.2, unit: 'pH', status: 'Safe (6.8 – 8.2)', color: 'green' };
  setWQCard('PH', phData.value, phData.unit, phData.color || 'green', phData.status || 'Safe (6.8 – 8.2)');

  const tempData = wq.temperature || { value: 29.2, unit: '°C', status: 'Safe (26°C – 30°C)', color: 'green' };
  setWQCard('Temp', tempData.value, tempData.unit, tempData.color || 'green', tempData.status || 'Safe (26°C – 30°C)');
}

function setWQCard(key, value, unit, color, label) {
  const card = document.getElementById('wqCard' + key);
  const valEl = document.getElementById('wq' + key);
  const dotEl = document.getElementById('wqDot' + key);
  const statusEl = document.getElementById('wqStatus' + key);

  if (!valEl) return;
  valEl.innerHTML = `${value}<span class="wq-unit">${unit}</span>`;
  if (dotEl) dotEl.className = 'wq-dot dot-' + color;
  if (statusEl) {
    statusEl.textContent = label;
    statusEl.className = 'wq-status status-' + color;
  }

  if (card) {
    if (color === 'red') {
      card.classList.add('alert-flash');
    } else {
      card.classList.remove('alert-flash');
    }
  }
}

/**
 * Render Notification Stream
 */
function renderNotifications(notifs) {
  const wrap = document.getElementById('notifList');
  if (!wrap) return;
  wrap.innerHTML = '';

  if (!notifs || notifs.length === 0) {
    wrap.innerHTML = '<div style="font-size:12.5px; color:var(--text-faint); padding:10px 0;">No notifications recorded for this batch.</div>';
    return;
  }

  notifs.forEach(n => {
    const icoClass = n.type === 'critical' ? 'ico-critical' : (n.type === 'success' ? 'ico-success' : 'ico-info');
    const isCriticalCard = n.type === 'critical' ? 'critical' : 'unread';
    const div = document.createElement('div');
    div.className = `notif-card ${isCriticalCard}`;
    div.innerHTML = `
      <div class="notif-top">
        <div class="notif-ico ${icoClass}">${n.icon || ICONS.pin}</div>
        <div>
          <div class="notif-title">${n.title}</div>
          <div class="notif-time">${n.time || 'Just now'}</div>
          <div class="notif-body">${n.body}</div>
        </div>
      </div>
    `;
    wrap.appendChild(div);
  });
}

/**
 * Render Final Delivery View
 */
function renderDeliveryCompleteView(data) {
  const dashEl = document.getElementById('dashboard');
  const compEl = document.getElementById('complete');
  if (dashEl) dashEl.classList.remove('show');
  if (compEl) compEl.classList.add('show');

  const title = document.getElementById('completeTitle');
  const expBadge = document.getElementById('completeExpiredBadge');
  const sub = document.getElementById('completeBatchSub');
  const time = document.getElementById('completeTime');
  const dur = document.getElementById('compDuration');
  const dist = document.getElementById('compDistance');
  const spd = document.getElementById('compAvgSpeed');
  const surv = document.getElementById('compSurvival');

  if (title) title.textContent = 'Delivery Completed (Tracking Expired)';
  if (expBadge) expBadge.innerHTML = `${ICONS.clock} Tracking #${data.trackingCode} Expired`;
  if (sub) sub.textContent = `Tracking #${data.trackingCode} has expired following arrival at ${data.parties?.buyer || 'your farm'}. Live telemetry is closed.`;
  if (time) time.textContent = data.deliverySummary?.deliveredAt || '09:02 AM';
  if (dur) dur.textContent = data.deliverySummary?.totalDuration || '1h 52m';
  if (dist) dist.textContent = data.deliverySummary?.distanceTraveled || '41.6 km';
  if (spd) spd.textContent = data.deliverySummary?.avgSpeed || '46 km/h';
  if (surv) surv.textContent = data.deliverySummary?.survivalRate || '99.7%';

  if (data.deliverySummary?.finalReport) {
    const r = data.deliverySummary.finalReport;
    const turb = document.getElementById('compTurb');
    const doEl = document.getElementById('compDO');
    const ph = document.getElementById('compPH');
    const temp = document.getElementById('compTemp');

    if (turb) turb.textContent = r.turbidity || '6 NTU — Safe';
    if (doEl) doEl.textContent = r.dissolvedOxygen || '6.5 mg/L — Safe';
    if (ph) ph.textContent = r.ph || '7.3 — Safe';
    if (temp) temp.textContent = r.temperature || '29.0°C — Safe';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* =========================================================================
   DYNAMIC GEOCODING & ROUTING ENGINE
   ========================================================================= */

function isWithinPhilippines(lat, lon) {
  return typeof lat === 'number' && typeof lon === 'number' &&
         !isNaN(lat) && !isNaN(lon) &&
         lat >= 4.5 && lat <= 21.5 &&
         lon >= 116.0 && lon <= 127.0;
}

const KNOWN_PLACE_COORDINATES = {
  // Metro Cebu (Talisay, Mandaue, Cebu City, Lapu-Lapu, Cordova, Minglanilla, Naga)
  'talisay': [10.2550, 123.8400],
  'talisay city': [10.2550, 123.8400],
  'talisay cebu': [10.2550, 123.8400],
  'talisay cebu city': [10.2550, 123.8400],
  'tabunok': [10.2600, 123.8350],
  'tabunok talisay': [10.2600, 123.8350],
  'bulacao talisay': [10.2650, 123.8450],
  'dumlog': [10.2450, 123.8420],
  'pooc': [10.2442, 123.8115],
  'tangke': [10.2450, 123.8210],
  'san roque talisay': [10.2472, 123.8320],
  'cansojong': [10.2520, 123.8380],
  'poblacion talisay': [10.2550, 123.8400],
  'mohon talisay': [10.2530, 123.8250],
  'lagtang': [10.2680, 123.8300],
  'lawaan i': [10.2435, 123.8030],
  'lawaan ii': [10.2428, 123.7940],
  'linao talisay': [10.2415, 123.7850],

  'mandaue': [10.3400, 123.9400],
  'mandaue city': [10.3400, 123.9400],
  'mandaue cebu': [10.3400, 123.9400],
  'subangdaku': [10.3250, 123.9250],
  'tipolo': [10.3280, 123.9300],
  'guizo': [10.3320, 123.9380],
  'centro mandaue': [10.3400, 123.9400],
  'banilad mandaue': [10.3450, 123.9300],
  'cabancalan': [10.3550, 123.9350],
  'maguikay': [10.3420, 123.9450],
  'bakilid': [10.3370, 123.9350],
  'jagobiao': [10.3700, 123.9550],
  'basak mandaue': [10.3600, 123.9450],
  'canduman': [10.3680, 123.9400],
  'casuntingan': [10.3500, 123.9350],
  'alang-alang': [10.3350, 123.9450],
  'umapad': [10.3380, 123.9550],
  'opao': [10.3300, 123.9500],
  'paknaan': [10.3550, 123.9550],
  'tingub': [10.3620, 123.9480],

  'cebu': [10.3157, 123.8854],
  'cebu city': [10.3157, 123.8854],
  'srp': [10.2750, 123.8650],
  'south road properties': [10.2750, 123.8650],
  'lahug': [10.3350, 123.8950],
  'mabolo': [10.3200, 123.9150],
  'guadalupe cebu': [10.3250, 123.8800],
  'banilad cebu': [10.3400, 123.9150],
  'labangon': [10.3050, 123.8750],
  'mambaling': [10.2900, 123.8700],
  'pardo': [10.2800, 123.8600],
  'bulacao cebu': [10.2720, 123.8520],
  'tisa': [10.3000, 123.8700],
  'punta princesa': [10.2950, 123.8680],
  'inayawan': [10.2750, 123.8580],
  'talamban': [10.3700, 123.9150],

  'lapu-lapu': [10.3150, 123.9500],
  'lapu lapu': [10.3150, 123.9500],
  'lapu-lapu city': [10.3150, 123.9500],
  'mactan': [10.3000, 123.9800],
  'pusok': [10.3250, 123.9650],
  'marigondon': [10.2750, 123.9800],
  'cordova': [10.2500, 123.9500],

  'minglanilla': [10.2440, 123.7970],
  'poblacion ward 1': [10.2440, 123.7970],
  'poblacion ward 2': [10.2430, 123.7950],
  'tungkil': [10.2420, 123.7760],
  'calajoan': [10.2410, 123.7670],
  'calajo-an': [10.2410, 123.7670],
  'lipata': [10.2355, 123.7530],
  'tungkop': [10.2310, 123.7480],

  'naga': [10.2070, 123.7570],
  'naga city': [10.2070, 123.7570],
  'colon': [10.2015, 123.7410],
  'tinaan': [10.2180, 123.7420],
  'inoburan': [10.1900, 123.7450],
  'langtad': [10.1825, 123.7435],
  'pangdan': [10.1920, 123.7425],

  'san fernando': [10.1550, 123.7280],
  'san isidro': [10.1550, 123.7280],
  'sangat': [10.1380, 123.7130],

  'carcar': [10.1060, 123.6420],
  'carcar city': [10.1060, 123.6420],
  'carcar fish pond': [10.1085, 123.6480],
  'carcar rotunda': [10.1110, 123.6680],
  'valladolid': [10.1230, 123.6750],
  'tuyom': [10.1160, 123.6810],
  'liburon': [10.1020, 123.6350],
  'poblacion i': [10.1070, 123.6440],
  'poblacion ii': [10.1090, 123.6460],
  'poblacion iii': [10.1110, 123.6490],
  'bolinawan': [10.1250, 123.6620],
  'ocana': [10.0820, 123.6210],
  'ocaña': [10.0820, 123.6210],
  'guadalupe': [10.1380, 123.6150],
  'can-asujan': [10.1450, 123.6000],
  'perrelos': [10.1290, 123.7040],

  'sibonga': [10.0150, 123.6200],
  'argao': [9.8800, 123.6000],
  'dalaguete': [9.7600, 123.5350],
  'alcoy': [9.7150, 123.5100],
  'boljoon': [9.6450, 123.4800],
  'oslob': [9.5200, 123.4300],
  'santander': [9.4200, 123.3400],
  'samboan': [9.5250, 123.3050],
  'ginatilan': [9.5700, 123.3250],
  'malabuyoc': [9.6600, 123.3150],
  'alegria': [9.7600, 123.3600],
  'badian': [9.8650, 123.3950],
  'moalboal': [9.9550, 123.4000],
  'alcantara': [9.9750, 123.4150],
  'ronda': [9.9950, 123.4450],
  'dumanjug': [10.0550, 123.4900],
  'barili': [10.1450, 123.5300],
  'japitan': [10.1550, 123.5100],
  'aloguinsan': [10.2250, 123.5500],
  'pinamungajan': [10.2700, 123.5850],
  'toledo': [10.3750, 123.6400],
  'toledo city': [10.3750, 123.6400],
  'bato': [10.3600, 123.6300],
  'balamban': [10.5000, 123.7150],
  'asturias': [10.5650, 123.7550],
  'tuburan': [10.7300, 123.8250],
  'tabuelan': [10.9000, 123.8750],
  'san remigio': [10.9900, 123.9300],
  'medellin': [11.1300, 123.9600],
  'daanbantayan': [11.2550, 124.0200],
  'bogo': [11.0500, 124.0050],
  'bogo city': [11.0500, 124.0050],
  'tabogon': [10.9300, 124.0300],
  'borbon': [10.8300, 124.0200],
  'sogod': [10.7500, 124.0000],
  'catmon': [10.6800, 124.0100],
  'carmen': [10.5800, 124.0200],
  'danao': [10.5200, 124.0300],
  'danao city': [10.5200, 124.0300],
  'compostela': [10.4550, 124.0150],
  'liloan': [10.3950, 123.9980],
  'consolacion': [10.3700, 123.9550],
  'bantayan': [11.1700, 123.7200],
  'santa fe': [11.1550, 123.8050],
  'madridejos': [11.2600, 123.7300],

  // Key Visayas, Mindanao & Luzon Centers
  'tagbilaran': [9.6500, 123.8500],
  'tagbilaran city': [9.6500, 123.8500],
  'panglao': [9.5800, 123.7700],
  'dumaguete': [9.3100, 123.3000],
  'dumaguete city': [9.3100, 123.3000],
  'bacolod': [10.6700, 122.9500],
  'bacolod city': [10.6700, 122.9500],
  'iloilo': [10.7200, 122.5600],
  'iloilo city': [10.7200, 122.5600],
  'roxas city': [11.5850, 122.7500],
  'kalibo': [11.7100, 122.3650],
  'tacloban': [11.2400, 125.0000],
  'tacloban city': [11.2400, 125.0000],
  'ormoc': [11.0050, 124.6100],
  'ormoc city': [11.0050, 124.6100],
  'manila': [14.5995, 120.9842],
  'quezon city': [14.6760, 121.0437],
  'makati': [14.5547, 121.0244],
  'pasig': [14.5764, 121.0851],
  'taguig': [14.5176, 121.0509],
  'davao': [7.1907, 125.4553],
  'davao city': [7.1907, 125.4553],
  'cagayan de oro': [8.4542, 124.6319],
  'general santos': [6.1164, 125.1716],
  'zamboanga': [6.9214, 122.0790],
  'zamboanga city': [6.9214, 122.0790],

  // Major Cebu & Regional Landmarks, Malls, Ports & Public Facilities
  'sm seaside': [10.2818, 123.8817],
  'sm seaside city cebu': [10.2818, 123.8817],
  'sm seaside cebu': [10.2818, 123.8817],
  'sm city cebu': [10.3117, 123.9184],
  'sm cebu': [10.3117, 123.9184],
  'ayala center cebu': [10.3173, 123.9056],
  'ayala cebu': [10.3173, 123.9056],
  'it park': [10.3297, 123.9066],
  'cebu it park': [10.3297, 123.9066],
  'robinsons galleria cebu': [10.3060, 123.9110],
  'il corso': [10.2640, 123.8740],
  'il corso srp': [10.2640, 123.8740],
  'parkmall': [10.3242, 123.9333],
  'parkmall mandaue': [10.3242, 123.9333],
  'pacific mall mandaue': [10.3440, 123.9430],
  'j centre mall': [10.3390, 123.9380],
  'gaisano grand mall talisay': [10.2620, 123.8340],
  'gaisano fiesta mall tabunok': [10.2625, 123.8360],
  'gaisano tabunok': [10.2625, 123.8360],
  'gaisano grand carcar': [10.1130, 123.6650],
  'south town centre': [10.2680, 123.8400],
  'cebu south bus terminal': [10.2985, 123.8938],
  'south bus terminal': [10.2985, 123.8938],
  'cebu north bus terminal': [10.3245, 123.9335],
  'north bus terminal': [10.3245, 123.9335],
  'mactan cebu international airport': [10.3075, 123.9790],
  'mactan airport': [10.3075, 123.9790],
  'mcia': [10.3075, 123.9790],
  'cebu pier 1': [10.2950, 123.9070],
  'cebu port': [10.3000, 123.9100],
  'pier 1 cebu': [10.2950, 123.9070],
  'pier 3 cebu': [10.3020, 123.9120],
  'hagnaya port': [11.0450, 123.9450],
  'maya port': [11.2650, 124.0500],
  'toledo port': [10.3750, 123.6350],
  'bato port santander': [9.4200, 123.3400],
  'liloan port': [10.3950, 124.0050],
  'tabunok public market': [10.2610, 123.8355],
  'tabunok market': [10.2610, 123.8355],
  'carbon market': [10.2915, 123.8990],
  'carbon market cebu': [10.2915, 123.8990],
  'pasil market': [10.2925, 123.8912],
  'pasil fish port': [10.2925, 123.8912],
  'mandaue city public market': [10.3340, 123.9420],
  'carcar public market': [10.1080, 123.6450],
  'naga boardwalk': [10.2075, 123.7585],
  'naga city boardwalk': [10.2075, 123.7585],
  'cebu provincial capitol': [10.3160, 123.8910],
  'cebu capitol': [10.3160, 123.8910],
  'talisay city hall': [10.2520, 123.8380],
  'mandaue city hall': [10.3315, 123.9415],
  'lapu-lapu city hall': [10.3140, 123.9510],
  'naga city hall': [10.2080, 123.7580],
  'carcar city hall': [10.1065, 123.6430],
  'minglanilla municipal hall': [10.2445, 123.7975],
  'san fernando municipal hall': [10.1555, 123.7285],
  'barili municipal hall': [10.1455, 123.5305],
  'toledo city hall': [10.3755, 123.6405],
  'balamban municipal hall': [10.5005, 123.7155],
  'danao city hall': [10.5205, 124.0305],
  'vicente sotto': [10.3100, 123.8915],
  'vsmmc': [10.3100, 123.8915],
  'chong hua hospital': [10.3120, 123.8920],
  'chong hua mandaue': [10.3235, 123.9315],
  'ucmed': [10.3240, 123.9320],
  'talisay district hospital': [10.2525, 123.8375],
  'cebu doctors university hospital': [10.3135, 123.8930],
  'usc talamban': [10.3540, 123.9125],
  'university of san carlos': [10.3000, 123.8980],
  'up cebu': [10.3200, 123.8990],
  'cit university': [10.2950, 123.8800],
  'uc main': [10.2980, 123.8990],
  'usjr basak': [10.2920, 123.8680],
  'bfar 7': [10.3015, 123.8965],
  'bfar cebu': [10.3015, 123.8965],
  'aquasource hatchery': [10.2550, 123.8400],
  'carcar fish pond': [10.1085, 123.6480],
  'barili fish sanctuary': [10.1450, 123.5300],
  'carmen marine sanctuary': [10.5800, 124.0200],
  'asturias tilapia farm': [10.5650, 123.7550],
  'bantayan fishpond': [11.1700, 123.7200],
  'talisay fish landing': [10.2450, 123.8210]
};

async function resolveLocationCoordinates(addressText, secondaryText = '', fallbackDefault = [10.3157, 123.8854]) {
  const primary = (addressText || '').trim();
  const secondary = (secondaryText || '').trim();
  if (!primary && !secondary) return fallbackDefault;

  const cleanPrimary = primary.toLowerCase().replace(/,\s*philippines/gi, '').replace(/,\s*cebu/gi, '').trim();
  const combined = `${primary} ${secondary}`.trim().toLowerCase();

  const sortedKeys = Object.keys(KNOWN_PLACE_COORDINATES).sort((a, b) => b.length - a.length);

  // 1. Exact direct match on primary address or clean primary
  for (const key of sortedKeys) {
    if (cleanPrimary === key || primary.toLowerCase() === key) {
      const coords = KNOWN_PLACE_COORDINATES[key];
      if (isWithinPhilippines(coords[0], coords[1])) return coords;
    }
  }

  // 2. Specific landmark or place name match (ignoring generic 'cebu' and 'philippines')
  for (const key of sortedKeys) {
    if (key === 'cebu' || key === 'philippines' || key === 'cebu city') continue;
    const regex = new RegExp('\\b' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
    if (regex.test(combined) || combined.includes(key)) {
      const coords = KNOWN_PLACE_COORDINATES[key];
      if (isWithinPhilippines(coords[0], coords[1])) return coords;
    }
  }

  // 3. Online live geocoding lookup via Photon bounded to Philippines
  if (navigator.onLine && primary) {
    try {
      const q = encodeURIComponent(`${cleanPrimary || primary} Cebu Philippines`);
      const resp = await fetch(`https://photon.komoot.io/api/?q=${q}&limit=3&lat=10.3157&lon=123.8854&bbox=116.0,4.5,127.0,21.5`);
      if (resp.ok) {
        const json = await resp.json();
        if (json && json.features && json.features.length > 0) {
          for (const feature of json.features) {
            if (feature.geometry && feature.geometry.coordinates) {
              const [lon, lat] = feature.geometry.coordinates;
              if (isWithinPhilippines(lat, lon)) {
                return [lat, lon];
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('Geocoding lookup note:', e);
    }
  }

  // 4. Fallback check for Cebu City / generic Cebu
  if (combined.includes('cebu') || combined.includes('philippines')) {
    return KNOWN_PLACE_COORDINATES['cebu'] || fallbackDefault;
  }

  return fallbackDefault;
}

let currentRoadPath = [];
let routeGlowPolyline = null;

async function loadDynamicRoadRoute(startCoord, endCoord, mapInstance) {
  currentRoadPath = [startCoord, endCoord];
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startCoord[1]},${startCoord[0]};${endCoord[1]},${endCoord[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && data.routes && data.routes[0] && data.routes[0].geometry && data.routes[0].geometry.coordinates) {
        const roadWaypoints = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
        if (roadWaypoints.length >= 2) {
          currentRoadPath = roadWaypoints;
        }
      }
    }
  } catch (err) {
    console.warn('OSRM road route fetch note:', err);
    currentRoadPath = [startCoord, endCoord];
  }

  if (routeGlowPolyline && mapInstance.hasLayer(routeGlowPolyline)) mapInstance.removeLayer(routeGlowPolyline);
  if (routePolyline && mapInstance.hasLayer(routePolyline)) mapInstance.removeLayer(routePolyline);

  const pathToDraw = (currentRoadPath && currentRoadPath.length >= 2) ? currentRoadPath : [startCoord, endCoord];

  routeGlowPolyline = L.polyline(pathToDraw, {
    color: '#0B5D7A',
    weight: 8,
    opacity: 0.35,
    lineCap: 'round',
    lineJoin: 'round'
  }).addTo(mapInstance);

  routePolyline = L.polyline(pathToDraw, {
    color: '#00B4D8',
    weight: 4.5,
    opacity: 0.95,
    lineCap: 'round',
    lineJoin: 'round'
  }).addTo(mapInstance);
}

const CEBU_KEY_LANDMARKS = [
  // Aquaculture & Hatcheries
  { name: 'BFAR Regional Office 7 Multi-Species Hatchery', type: 'hatchery', tag: 'BFAR Facility', coords: [10.3015, 123.8965], desc: 'Arellano Blvd, Cebu City · Government Central Marine Hatchery' },
  { name: 'AquaSource Central Hatchery', type: 'hatchery', tag: 'Hatchery Station', coords: [10.2550, 123.8400], desc: 'Talisay City, Cebu · Fingerling Production & Testing Facility' },
  { name: 'Carcar Fish Ponds & Aquaculture Center', type: 'hatchery', tag: 'Fish Ponds', coords: [10.1085, 123.6480], desc: 'Carcar City, Cebu · Freshwater Tilapia & Bangus Grow-out Ponds' },
  { name: 'Barili Freshwater Fish Sanctuary', type: 'hatchery', tag: 'Fish Sanctuary', coords: [10.1450, 123.5300], desc: 'Barili, Cebu · Tilapia Breeding Farm & Fish Sanctuary' },
  { name: 'Asturias Tilapia Breeding Farm', type: 'hatchery', tag: 'Tilapia Farm', coords: [10.5650, 123.7550], desc: 'Asturias, Cebu · Inland Aquaculture Ponds' },
  { name: 'Bantayan Aqua Marine Farm', type: 'hatchery', tag: 'Marine Farm', coords: [11.1700, 123.7200], desc: 'Bantayan Island, Cebu · Marine Hatchery & Crab Ponds' },

  // Commercial Malls & Centers
  { name: 'SM Seaside City Cebu', type: 'mall', tag: 'Shopping Mall', coords: [10.2818, 123.8817], desc: 'South Road Properties (SRP), Cebu City' },
  { name: 'SM City Cebu', type: 'mall', tag: 'Shopping Mall', coords: [10.3117, 123.9184], desc: 'North Reclamation Area, Cebu City' },
  { name: 'Ayala Center Cebu', type: 'mall', tag: 'Business Center', coords: [10.3173, 123.9056], desc: 'Cebu Business Park, Cebu City' },
  { name: 'Cebu IT Park', type: 'mall', tag: 'IT Hub', coords: [10.3297, 123.9066], desc: 'Lahug, Cebu City · Commercial & Tech District' },
  { name: 'Parkmall Mandaue', type: 'mall', tag: 'Commercial Hub', coords: [10.3242, 123.9333], desc: 'Ouano Ave, Mandaue City' },
  { name: 'Gaisano Fiesta Mall Tabunok', type: 'mall', tag: 'Shopping Mall', coords: [10.2625, 123.8360], desc: 'Tabunok, Talisay City, Cebu' },
  { name: 'Gaisano Grand Carcar', type: 'mall', tag: 'Shopping Mall', coords: [10.1130, 123.6650], desc: 'Carcar City, Cebu' },

  // Transport Hubs & Ports
  { name: 'Cebu South Bus Terminal (CSBT)', type: 'transport', tag: 'Bus Terminal', coords: [10.2985, 123.8938], desc: 'N. Bacalso Ave, Cebu City · Main Southbound Transport Hub' },
  { name: 'Cebu North Bus Terminal (CNBT)', type: 'transport', tag: 'Bus Terminal', coords: [10.3245, 123.9335], desc: 'Logarta Ave, Mandaue City · Main Northbound Transport Hub' },
  { name: 'Mactan-Cebu International Airport (MCIA)', type: 'transport', tag: 'Airport', coords: [10.3075, 123.9790], desc: 'Lapu-Lapu City, Cebu · Terminal 1 & 2' },
  { name: 'Cebu International Port / Pier 1', type: 'port', tag: 'Sea Port', coords: [10.2950, 123.9070], desc: 'Cebu City · Passenger & Cargo Sea Port' },
  { name: 'Hagnaya Port', type: 'port', tag: 'Ferry Port', coords: [11.0450, 123.9450], desc: 'San Remigio, Cebu · Ferry Gate to Bantayan' },
  { name: 'Toledo FastCat Sea Port', type: 'port', tag: 'Sea Port', coords: [10.3750, 123.6350], desc: 'Toledo City, Cebu · Ferry Gate to Negros' },
  { name: 'Bato Ferry Terminal', type: 'port', tag: 'Ferry Port', coords: [9.4200, 123.3400], desc: 'Santander, Cebu · Southern Ferry Connection' },

  // Public Markets & Fish Ports
  { name: 'Tabunok Public Market', type: 'market', tag: 'Public Market', coords: [10.2610, 123.8355], desc: 'Talisay City, Cebu · Wholesale Agri-Fisheries Market' },
  { name: 'Pasil Fish Port & Market', type: 'market', tag: 'Wholesale Fish Market', coords: [10.2925, 123.8912], desc: 'Pasil, Cebu City · Central Seafood Distribution' },
  { name: 'Carbon Public Market', type: 'market', tag: 'Central Market', coords: [10.2915, 123.8990], desc: 'Cebu City · Historic Central Agri Market' },
  { name: 'Mandaue City Public Market', type: 'market', tag: 'Public Market', coords: [10.3340, 123.9420], desc: 'Centro, Mandaue City, Cebu' },
  { name: 'Carcar City Public Market', type: 'market', tag: 'Public Market', coords: [10.1080, 123.6450], desc: 'Carcar Rotunda, Carcar City, Cebu' },
  { name: 'Naga City Boardwalk', type: 'market', tag: 'Baywalk Park', coords: [10.2075, 123.7585], desc: 'City of Naga, Cebu · Coastal Promenade' },

  // Civic Government Centers
  { name: 'Cebu Provincial Capitol', type: 'civic', tag: 'Provincial Capitol', coords: [10.3160, 123.8910], desc: 'Escario St, Cebu City' },
  { name: 'Talisay City Hall', type: 'civic', tag: 'City Hall', coords: [10.2520, 123.8380], desc: 'Dumlog, Talisay City, Cebu' },
  { name: 'Mandaue City Hall', type: 'civic', tag: 'City Hall', coords: [10.3315, 123.9415], desc: 'Centro, Mandaue City, Cebu' },
  { name: 'Lapu-Lapu City Hall', type: 'civic', tag: 'City Hall', coords: [10.3140, 123.9510], desc: 'Pajo, Lapu-Lapu City, Cebu' },
  { name: 'Naga City Hall', type: 'civic', tag: 'City Hall', coords: [10.2080, 123.7580], desc: 'Naga City, Cebu' },
  { name: 'Carcar City Hall', type: 'civic', tag: 'City Hall', coords: [10.1065, 123.6430], desc: 'Carcar City, Cebu' },
  { name: 'Minglanilla Municipal Hall', type: 'civic', tag: 'Municipal Hall', coords: [10.2445, 123.7975], desc: 'Minglanilla, Cebu' }
];

function buildLandmarksLayerGroup() {
  const layer = L.layerGroup();
  
  const iconSVGs = {
    hatchery: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12c.5-2.5 2.5-4 5-4 4 0 7 4 7 4s-3 4-7 4c-2.5 0-4.5-1.5-5-4z"></path><circle cx="9" cy="11" r="1"></circle></svg>',
    mall: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>',
    transport: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>',
    port: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="3"></circle><line x1="12" y1="22" x2="12" y2="8"></line><path d="M5 12H2a10 10 0 0 0 20 0h-3"></path></svg>',
    market: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>',
    civic: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>'
  };

  CEBU_KEY_LANDMARKS.forEach(lm => {
    const iconHtml = `
      <div class="landmark-pin pin-${lm.type}" style="width:26px; height:26px;" title="${escapeHtml(lm.name)}">
        ${iconSVGs[lm.type] || iconSVGs.civic}
      </div>
    `;
    const landmarkIcon = L.divIcon({
      className: 'custom-landmark-icon',
      html: iconHtml,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });

    const marker = L.marker(lm.coords, { icon: landmarkIcon });
    marker.bindPopup(`
      <div style="font-size:13px; line-height:1.4;">
        <span style="display:inline-block; padding:2px 8px; border-radius:10px; font-size:10px; font-weight:800; background:#E8F7FB; color:#0B5D7A; text-transform:uppercase; margin-bottom:4px;">${escapeHtml(lm.tag)}</span>
        <div style="font-weight:800; color:#1A3038; font-size:13.5px; margin-bottom:3px;">${escapeHtml(lm.name)}</div>
        <div style="color:#5B7A85; font-size:11.5px;">📍 ${escapeHtml(lm.desc)}</div>
      </div>
    `);
    marker.addTo(layer);
  });

  return layer;
}

let buyerLandmarksLayer = null;

function initLeafletMap() {
  const mapEl = document.getElementById('leafletMap');
  if (!mapEl || typeof L === 'undefined') return;

  if (leafletMap) return;

  const defaultCoords = [10.2550, 123.8400];
  leafletMap = L.map('leafletMap', {
    zoomControl: true,
    attributionControl: false,
    maxZoom: 21
  }).setView(defaultCoords, 11);

  // High-Definition Google Maps Base Layers
  const googleStreets = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    maxZoom: 21,
    maxNativeZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Maps'
  });

  const googleHybrid = L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
    maxZoom: 21,
    maxNativeZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Satellite'
  });

  const googleTerrain = L.tileLayer('https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
    maxZoom: 21,
    maxNativeZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Terrain'
  });

  // Default to Google Streets
  googleStreets.addTo(leafletMap);

  // Build Landmarks & POI Overlay
  buyerLandmarksLayer = buildLandmarksLayerGroup();
  buyerLandmarksLayer.addTo(leafletMap); // Active by default

  // Google Maps Layer & Overlay Switcher
  const baseLayers = {
    '🗺️ Google Map': googleStreets,
    '🛰️ Satellite Hybrid': googleHybrid,
    '🏔️ Terrain': googleTerrain
  };
  const overlays = {
    '📍 Key Cebu Landmarks & POIs': buyerLandmarksLayer
  };

  L.control.layers(baseLayers, overlays, { position: 'topright' }).addTo(leafletMap);
  L.control.scale({ imperial: false, metric: true, position: 'bottomleft' }).addTo(leafletMap);
}

async function initOrUpdateBuyerMap(data) {
  const mapEl = document.getElementById('leafletMap');
  if (!mapEl || typeof L === 'undefined') return;

  const originAddress = data?.parties?.origin || 'Talisay City, Cebu';
  const sellerName = data?.parties?.seller || 'Seller Origin Farm';
  const destAddress = data?.parties?.destination || 'Mandaue City, Cebu';
  const buyerName = data?.parties?.buyer || 'Buyer Destination Farm';

  const originCoords = await resolveLocationCoordinates(originAddress, sellerName, [10.2550, 123.8400]);
  const destCoords = await resolveLocationCoordinates(destAddress, buyerName, [10.3400, 123.9400]);

  if (!leafletMap) {
    initLeafletMap();
  }

  if (!leafletMap) return;

  // Destination Marker (Buyer Farm)
  const destIcon = L.divIcon({
    className: 'custom-map-icon',
    html: `<div style="background:#FF5A5F; color:#fff; border-radius:50%; width:34px; height:34px; display:flex; align-items:center; justify-content:center; border:2px solid #fff; box-shadow:0 3px 10px rgba(0,0,0,0.3);">${ICONS.pin}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });

  if (!destMarker) {
    destMarker = L.marker(destCoords, { icon: destIcon }).addTo(leafletMap);
  } else {
    destMarker.setLatLng(destCoords);
  }
  destMarker.bindPopup(`<b>Destination Farm</b><br><b>${escapeHtml(buyerName)}</b><br><span style="color:#5B7A85; font-size:11.5px;">📍 ${escapeHtml(destAddress)}</span>`);

  // 3. Dynamic Road Route Calculation
  await loadDynamicRoadRoute(originCoords, destCoords, leafletMap);

  // 4. Live Transport Truck Marker
  const stage = data?.status?.stage ?? 1;
  const progressPercent = typeof data?.status?.progressPercent === 'number' ? data.status.progressPercent : (stage === 3 ? 100 : (stage === 2 ? 80 : 45));
  const path = (currentRoadPath && currentRoadPath.length > 0) ? currentRoadPath : [originCoords, destCoords];
  const idx = Math.min(path.length - 1, Math.max(0, Math.floor((progressPercent / 100) * (path.length - 1))));
  const truckPos = (stage === 3) ? destCoords : (stage === 0 ? originCoords : (path[idx] || originCoords));

  const truckIcon = L.divIcon({
    className: 'custom-map-icon',
    html: `<div style="background:#00B4D8; color:#fff; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; border:2px solid #fff; box-shadow:0 4px 14px rgba(0,180,216,0.5);">${ICONS.truck}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });

  if (!truckMarker) {
    truckMarker = L.marker(truckPos, { icon: truckIcon }).addTo(leafletMap);
  } else {
    truckMarker.setLatLng(truckPos);
  }
  truckMarker.bindPopup(`<b>AquaSource Live Transport Unit</b><br>Driver: ${escapeHtml(data?.transport?.driver || 'Transport Driver')}<br>From: ${escapeHtml(originAddress)}<br>To: ${escapeHtml(destAddress)}`);

  // 5. Fit Map Bounds
  const bounds = L.latLngBounds([originCoords, destCoords]);
  leafletMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });

  setTimeout(() => {
    if (leafletMap) leafletMap.invalidateSize();
  }, 200);
}

function updateMapPosition(lat, lng, stage, driver, progressPercent) {
  if (!leafletMap || !truckMarker) return;

  const path = (currentRoadPath && currentRoadPath.length > 0) ? currentRoadPath : [[lat, lng]];
  let pct = typeof progressPercent === 'number' ? progressPercent : (stage === 3 ? 100 : (stage === 2 ? 80 : 45));
  const idx = Math.min(path.length - 1, Math.max(0, Math.floor((pct / 100) * (path.length - 1))));
  const pos = path[idx] || [lat, lng];

  truckMarker.setLatLng(pos);
  if (driver) {
    truckMarker.setPopupContent(`<b>AquaSource Live Transport Unit</b><br>Driver: ${escapeHtml(driver)}`);
  }
  leafletMap.panTo(pos);
}

/* =========================================================================
   CRITICAL ALERT & AUDIO CHIME
   ========================================================================= */

function triggerWaterAlertModal(wq) {
  const modal = document.getElementById('criticalModal');
  const alertText = document.getElementById('alertModalText');

  if (wq && wq.dissolvedOxygen && wq.dissolvedOxygen.value < 4.0) {
    if (alertText) alertText.innerHTML = `Dissolved oxygen dropped to <b>${wq.dissolvedOxygen.value} mg/L</b> (Safe minimum: 5.0 mg/L) inside the transport tank for ${currentShipmentData?.batchId || 'this shipment'}.`;
  } else if (wq && wq.temperature && (wq.temperature.value > 32.0 || wq.temperature.value < 22.0)) {
    if (alertText) alertText.innerHTML = `Water temperature fluctuated to <b>${wq.temperature.value}°C</b> (Safe range: 26.0°C–30.0°C) inside the transport tank.`;
  }

  if (modal) modal.classList.add('active');
  playAlertChime();
}

function closeCriticalModal() {
  const modal = document.getElementById('criticalModal');
  if (modal) modal.classList.remove('active');
}

function playAlertChime() {
  try {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioContext.currentTime); // A5 tone
    osc.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.4);
    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + 0.45);
  } catch (e) {
    // Suppress Web Audio policy restrictions before user interaction
  }
}

/* =========================================================================
   DELIVERY CERTIFICATE GENERATOR
   ========================================================================= */

function downloadDeliveryReport() {
  const data = currentShipmentData || DEFAULT_SHIPMENTS['AQS-7X29K'];
  const win = window.open('', '_blank');

  const reportHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>AquaSource Delivery Certificate — ${data.trackingCode}</title>
    <style>
      body{ font-family:'Helvetica Neue',Arial,sans-serif; color:#0B2530; padding:40px; line-height:1.6; max-width:800px; margin:0 auto; }
      .header{ display:flex; justify-content:space-between; border-bottom:3px solid #0B5D7A; padding-bottom:20px; margin-bottom:28px; }
      .brand{ font-size:24px; font-weight:800; color:#0B5D7A; }
      .cert-title{ font-size:20px; font-weight:800; text-transform:uppercase; margin-bottom:4px; }
      .grid{ display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:26px; }
      .box{ background:#F2F8FB; border-radius:12px; padding:16px; border:1px solid #E1EFF4; }
      .box h4{ margin:0 0 10px; font-size:13px; text-transform:uppercase; color:#5B7A85; }
      table{ width:100%; border-collapse:collapse; margin-top:8px; font-size:13px; }
      table td{ padding:6px 0; border-bottom:1px solid #E1EFF4; }
      table td:last-child{ text-align:right; font-weight:bold; }
      .pass-badge{ display:inline-block; background:#E1F7EF; color:#06A77D; padding:4px 10px; border-radius:8px; font-weight:bold; font-size:12px; }
      .footer-sign{ margin-top:40px; display:flex; justify-content:space-between; border-top:1px dashed #BEE7F2; padding-top:24px; }
    </style>
  </head>
  <body>
    <div class="header">
      <div style="display:flex; align-items:center; gap:12px;">
        <img src="logo-transparent.png" alt="AquaSource Logo" style="height:48px; width:auto;">
        <div>
          <div class="brand">AquaSource Telemetry</div>
          <div style="font-size:13px; color:#5B7A85;">Live Fingerling Transport Certification</div>
        </div>
      </div>
      <div style="text-align:right;">
        <div class="cert-title">Delivery Certificate</div>
        <div style="font-family:monospace; font-weight:bold;">${data.trackingCode}</div>
      </div>
    </div>

    <div class="grid">
      <div class="box">
        <h4>Hatchery & Buyer Parties</h4>
        <table>
          <tr><td>Seller / Hatchery</td><td>${data.parties?.seller || 'Bluewater Hatchery'}</td></tr>
          <tr><td>Buyer / Farm</td><td>${data.parties?.buyer || 'Green Water Farms'}</td></tr>
          <tr><td>Dispatched Time</td><td>${data.shipment?.dispatchedAt || '07:10 AM'}</td></tr>
          <tr><td>Arrival Time</td><td>${data.deliverySummary?.deliveredAt || '09:02 AM'}</td></tr>
        </table>
      </div>

      <div class="box">
        <h4>Shipment & Transport Logistics</h4>
        <table>
          <tr><td>Species</td><td>${data.shipment?.species || 'Tilapia Fingerlings'}</td></tr>
          <tr><td>Quantity</td><td>${data.shipment?.quantity || '3,000 pcs'}</td></tr>
          <tr><td>Vehicle</td><td>${data.transport?.vehicle || 'TRK-207'}</td></tr>
          <tr><td>Survival Rate</td><td><span class="pass-badge">${data.deliverySummary?.survivalRate || '99.7%'}</span></td></tr>
        </table>
      </div>
    </div>

    <div class="box" style="margin-bottom:26px;">
      <h4>Final Telemetry & Water Quality Safety Log</h4>
      <table>
        <tr><td>Dissolved Oxygen</td><td>${data.deliverySummary?.finalReport?.dissolvedOxygen || '6.5 mg/L (Safe)'}</td></tr>
        <tr><td>Turbidity</td><td>${data.deliverySummary?.finalReport?.turbidity || '6 NTU (Safe)'}</td></tr>
        <tr><td>pH Level</td><td>${data.deliverySummary?.finalReport?.ph || '7.3 (Safe)'}</td></tr>
        <tr><td>Temperature</td><td>${data.deliverySummary?.finalReport?.temperature || '29.0°C (Safe)'}</td></tr>
      </table>
    </div>

    <div class="footer-sign">
      <div>
        <div style="height:40px;"></div>
        <div>_______________________________</div>
        <div style="font-size:12px; color:#5B7A85; margin-top:4px;">Transport Driver Signature (${data.transport?.driver || 'Driver'})</div>
      </div>
      <div>
        <div style="height:40px;"></div>
        <div>_______________________________</div>
        <div style="font-size:12px; color:#5B7A85; margin-top:4px;">Receiving Farm Manager Signature</div>
      </div>
    </div>
    <script>window.onload = function(){ window.print(); };<\/script>
  </body>
  </html>
  `;

  win.document.write(reportHtml);
  win.document.close();
}

function resetTracking() {
  const comp = document.getElementById('complete');
  const dash = document.getElementById('dashboard');
  const badge = document.getElementById('navBadge');
  const input = document.getElementById('codeInput');
  const err = document.getElementById('codeError');
  const track = document.getElementById('track');

  if (comp) comp.classList.remove('show');
  if (dash) dash.classList.remove('show');
  if (badge) badge.classList.remove('show');
  if (input) input.value = '';
  if (err) err.classList.remove('show');
  if (track) track.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* =========================================================================
   NOTIFICATION TOAST HELPER
   ========================================================================= */

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

