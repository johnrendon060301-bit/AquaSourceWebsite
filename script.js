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
      { id: 'n1', type: 'critical', icon: '🚫', title: 'Shipment Cancelled', time: raw.cancelledAt ? new Date(raw.cancelledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently', body: `Tracking #${trackingCode} has been cancelled upon buyer request.` }
    ] : (raw.notifications || [
      { id: 'n1', type: 'info', icon: '🚚', title: 'Shipment En Route', time: 'Recently', body: `Tracking #${trackingCode} is en route to ${buyerName}.` }
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
    if (errText) errText.innerHTML = `⏳ <b>Tracking Code Expired:</b> Shipment #${data.trackingCode} has been delivered and completed. Real-time telemetry tracking is closed.`;
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

  // 10. Live Map Marker Position Update
  if (!isCancelled && data.location && data.location.lat && data.location.lng) {
    updateMapPosition(data.location.lat, data.location.lng, stage, data.transport?.driver, data.status?.progressPercent);
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
        <div class="notif-ico ${icoClass}">${n.icon || '📍'}</div>
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
  if (expBadge) expBadge.textContent = `⏳ Tracking #${data.trackingCode} Expired`;
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

// High-precision road waypoints following Cebu South Coastal Road (CSCR) & N. Bacalso National Highway
const ROAD_ROUTE_COORDS = [
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

let currentRoadPath = [...ROAD_ROUTE_COORDS];
let routeGlowPolyline = null;

async function loadDynamicRoadRoute(startCoord, endCoord, mapInstance) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startCoord[1]},${startCoord[0]};${endCoord[1]},${endCoord[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json();
    if (data && data.routes && data.routes[0] && data.routes[0].geometry && data.routes[0].geometry.coordinates) {
      const roadWaypoints = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
      if (roadWaypoints.length > 5) {
        currentRoadPath = roadWaypoints;

        if (routeGlowPolyline && mapInstance.hasLayer(routeGlowPolyline)) mapInstance.removeLayer(routeGlowPolyline);
        if (routePolyline && mapInstance.hasLayer(routePolyline)) mapInstance.removeLayer(routePolyline);

        routeGlowPolyline = L.polyline(currentRoadPath, {
          color: '#0B5D7A',
          weight: 8,
          opacity: 0.35,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(mapInstance);

        routePolyline = L.polyline(currentRoadPath, {
          color: '#00B4D8',
          weight: 4.5,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(mapInstance);
      }
    }
  } catch (err) {
    console.warn('OSRM road route fetch note:', err);
  }
}

function initLeafletMap() {
  const mapEl = document.getElementById('leafletMap');
  if (!mapEl || typeof L === 'undefined') return;

  const defaultCoords = [10.2350, 123.7750];
  leafletMap = L.map('leafletMap', {
    zoomControl: true,
    attributionControl: false
  }).setView(defaultCoords, 11);

  // High-Definition Google Maps Layer
  L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Maps'
  }).addTo(leafletMap);

  // Origin Hatchery Marker (SRP Facility)
  const originIcon = L.divIcon({
    className: 'custom-map-icon',
    html: '<div style="background:#0B5D7A; color:#fff; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; border:2px solid #fff; box-shadow:0 3px 10px rgba(0,0,0,0.3); font-size:16px;">🏢</div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
  originMarker = L.marker(ROAD_ROUTE_COORDS[0], { icon: originIcon }).addTo(leafletMap)
    .bindPopup('<b>Origin Hatchery Facility</b><br>Station Dispatch');

  // Destination Farm Marker (Carcar)
  const destIcon = L.divIcon({
    className: 'custom-map-icon',
    html: '<div style="background:#FF5A5F; color:#fff; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; border:2px solid #fff; box-shadow:0 3px 10px rgba(0,0,0,0.3); font-size:16px;">🎯</div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
  destMarker = L.marker(ROAD_ROUTE_COORDS[ROAD_ROUTE_COORDS.length - 1], { icon: destIcon }).addTo(leafletMap)
    .bindPopup('<b>Destination Fish Farm</b><br>Receiving Facility');

  // Live Transport Truck Marker
  const truckIcon = L.divIcon({
    className: 'custom-map-icon',
    html: '<div style="background:#00B4D8; color:#fff; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; border:2px solid #fff; box-shadow:0 4px 14px rgba(0,180,216,0.5); font-size:18px;">🚚</div>',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
  truckMarker = L.marker(ROAD_ROUTE_COORDS[14], { icon: truckIcon }).addTo(leafletMap)
    .bindPopup('<b>AquaSource Live Transport Unit</b>');

  // Route Polyline Glow & Main Highway Path
  routeGlowPolyline = L.polyline(ROAD_ROUTE_COORDS, {
    color: '#0B5D7A',
    weight: 8,
    opacity: 0.35,
    lineCap: 'round',
    lineJoin: 'round'
  }).addTo(leafletMap);

  routePolyline = L.polyline(ROAD_ROUTE_COORDS, {
    color: '#00B4D8',
    weight: 4.5,
    opacity: 0.95,
    lineCap: 'round',
    lineJoin: 'round'
  }).addTo(leafletMap);

  // Fetch dynamic real turn-by-turn road geometry from routing network
  loadDynamicRoadRoute(ROAD_ROUTE_COORDS[0], ROAD_ROUTE_COORDS[ROAD_ROUTE_COORDS.length - 1], leafletMap);
}

function updateMapPosition(lat, lng, stage, driver, progressPercent) {
  if (!leafletMap || !truckMarker) return;

  const path = (currentRoadPath && currentRoadPath.length > 0) ? currentRoadPath : ROAD_ROUTE_COORDS;
  let pct = typeof progressPercent === 'number' ? progressPercent : (stage === 3 ? 100 : (stage === 2 ? 80 : 45));
  const idx = Math.min(path.length - 1, Math.max(0, Math.floor((pct / 100) * (path.length - 1))));
  const pos = path[idx] || [lat, lng];

  truckMarker.setLatLng(pos);
  if (driver) {
    truckMarker.setPopupContent(`<b>AquaSource Live Transport Unit</b><br>Driver: ${driver}`);
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

