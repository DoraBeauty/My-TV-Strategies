import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
    getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
    getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, getDocs
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import {
    getStorage, ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";


const firebaseConfig = {
  apiKey: "AIzaSyB-H_WrTxjXkb1eVTDK-Xa9Bo-JXYl6KSc",
  authDomain: "business-trip-f7328.firebaseapp.com",
  projectId: "business-trip-f7328",
  storageBucket: "business-trip-f7328.firebasestorage.app",
  messagingSenderId: "898958315644",
  appId: "1:898958315644:web:f3b2f8a01661458029b9f9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let currentUser = null;

// UI Elements
const loginView = document.getElementById('loginView');
const dashboardView = document.getElementById('dashboardView');
const loginBtn = document.getElementById('loginBtn');
const largeLoginBtn = document.getElementById('largeLoginBtn');
const guestLoginBtn = document.getElementById('guestLoginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const exportBtn = document.getElementById('exportBtn');
const unsettledBadgeBtn = document.getElementById('unsettledBadgeBtn');

// Theme Toggle Logic
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIcon = document.getElementById('themeIcon');

let isDarkMode = localStorage.getItem('theme') === 'dark';

function updateTheme() {
    if (isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeIcon.classList.remove('bi-moon-stars');
        themeIcon.classList.add('bi-sun-fill');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
        themeIcon.classList.remove('bi-sun-fill');
        themeIcon.classList.add('bi-moon-stars');
        localStorage.setItem('theme', 'light');
    }
}

updateTheme();

themeToggleBtn.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    updateTheme();
});

// View Toggle Elements
const btnList = document.getElementById('btnList');
const btnCalendar = document.getElementById('btnCalendar');
const btnAuditLog = document.getElementById('btnAuditLog');

const listControlsWrapper = document.getElementById('listControlsWrapper');
const searchInput = document.getElementById('searchInput');
const statusFilterSelect = document.getElementById('statusFilterSelect');
const recordsContainer = document.getElementById('recordsContainer');
const calendarViewWrapper = document.getElementById('calendarViewWrapper');
const auditLogViewWrapper = document.getElementById('auditLogViewWrapper');
const statsViewWrapper = document.getElementById('statsViewWrapper');
const segmentSlider = document.getElementById('segmentSlider');
const viewToggleGroup = document.getElementById('viewToggleGroup');
const fabBtn = document.getElementById('fabBtn');

function updateSegmentSlider() {
    // Assuming 3 options, 33.333% width each
    segmentSlider.style.width = '33.333%';
    if (btnList.checked) {
        segmentSlider.style.transform = 'translateX(0)';
    } else if (btnCalendar.checked) {
        segmentSlider.style.transform = 'translateX(100%)';
    } else if (btnMap.checked) {
        segmentSlider.style.transform = 'translateX(200%)';
    }
}

// Run initially
updateSegmentSlider();


// Helper: Promise Timeout
const withTimeout = (promise, ms, errorMessage = '操作逾時，請檢查網路狀態') => {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(errorMessage)), ms))
    ]);
};

// Form Elements
const form = document.getElementById('recordForm');
const recordIdInput = document.getElementById('recordId');
const modalTitle = document.getElementById('modalTitle');
const saveRecordBtn = document.getElementById('saveRecordBtn');
const saveSpinner = document.getElementById('saveSpinner');

const startTimeInput = document.getElementById('startTime');
const endTimeInput = document.getElementById('endTime');
const allowanceInput = document.getElementById('allowance');
const timeCalcHint = document.getElementById('timeCalcHint');

const companionsContainer = document.getElementById('companionsContainer');
const addCompanionBtn = document.getElementById('addCompanionBtn');
const transportTypeSelect = document.getElementById('transportType');
const driverSection = document.getElementById('driverSection');
const driverSelect = document.getElementById('driverSelect');
const mileageSection = document.getElementById('mileageSection');
const mileageInput = document.getElementById('mileage');
const mileageRateHint = document.getElementById('mileageRateHint');

const receiptsContainer = document.getElementById('receiptsContainer');
const addReceiptBtn = document.getElementById('addReceiptBtn');

const totalAmountInput = document.getElementById('totalAmount');
const totalAmountDisplay = document.getElementById('totalAmountDisplay');

let dynamicReceiptCount = 0;
let currentRecords = [];

// --- Auth & Setup ---

const handleLogin = async () => {
    try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    } catch (error) {
        alert("登入失敗：" + error.message);
    }
};

const handleLogout = async () => {
    if (currentUser && currentUser.isGuest) {
        window.location.reload();
        return;
    }
    try {
        await signOut(auth);
    } catch (error) {
        console.error(error);
    }
};


const guestModeAlert = document.getElementById('guestModeAlert');

const startGuestMode = () => {
    if (guestModeAlert) guestModeAlert.style.display = 'block';

    currentUser = { uid: 'guest_user', isGuest: true };

    loginView.style.display = 'none';
    dashboardView.style.display = 'block';
    loginBtn.classList.remove('d-flex');
    loginBtn.classList.add('d-none');

    logoutBtn.classList.remove('d-none');
    logoutBtn.classList.add('d-flex');

    exportBtn.style.display = 'inline-block';
    statsNavBtn.style.display = 'inline-block';
    unsettledBadgeBtn.style.display = 'inline-block';

    let mockListeners = [];
    const triggerListeners = () => {
        const raw = localStorage.getItem('guest_records');
        const records = raw ? JSON.parse(raw) : [];
        const snapshot = records.map(r => ({
            id: r.id,
            data: () => r
        }));
        mockListeners.forEach(cb => cb(snapshot));
    };

    window.firebaseData = {
        currentUser,
        db: 'mock_db', storage: 'mock_storage',
        collection: (db, path) => path,
        addDoc: async (colPath, data) => {
            const raw = localStorage.getItem('guest_records');
            const records = raw ? JSON.parse(raw) : [];
            const newDoc = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() };
            records.unshift(newDoc);
            localStorage.setItem('guest_records', JSON.stringify(records));
            triggerListeners();
            return { id: newDoc.id };
        },
        doc: (db, path, id) => id,
        updateDoc: async (docId, updateData) => {
            const raw = localStorage.getItem('guest_records');
            let records = raw ? JSON.parse(raw) : [];
            records = records.map(r => r.id === docId ? { ...r, ...updateData } : r);
            localStorage.setItem('guest_records', JSON.stringify(records));
            triggerListeners();
        },
        deleteDoc: async (docId) => {
            const raw = localStorage.getItem('guest_records');
            let records = raw ? JSON.parse(raw) : [];
            records = records.filter(r => r.id !== docId);
            localStorage.setItem('guest_records', JSON.stringify(records));
            triggerListeners();
        },
        query: () => 'mock_query', where: () => null, orderBy: () => null,
        getDocs: async (q) => {
            if (q === 'mock_audit_query') {
                const raw = localStorage.getItem('guest_audit_logs');
                const logs = raw ? JSON.parse(raw) : [];
                return {
                    forEach: (cb) => logs.forEach(r => cb({ id: r.id, data: () => r })),
                    empty: logs.length === 0,
                    size: logs.length
                };
            }
            return { forEach: () => {}, empty: true, size: 0 };
        },
        onSnapshot: (q, cb, errCb) => {
            mockListeners.push(cb);
            triggerListeners();
            return () => { mockListeners = mockListeners.filter(l => l !== cb); };
        },
        serverTimestamp: () => new Date().toISOString(),
        ref: (storage, path) => path,
        uploadBytes: async (refPath, file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                    localStorage.setItem('img_' + refPath, reader.result);
                    resolve();
                };
                reader.onerror = error => reject(error);
            });
        },
        getDownloadURL: async (refPath) => localStorage.getItem('img_' + refPath),
        deleteObject: async (refPath) => localStorage.removeItem('img_' + refPath)
    };

    window.dispatchEvent(new Event('authReady'));
};

loginBtn.addEventListener('click', handleLogin);
largeLoginBtn.addEventListener('click', handleLogin);
if (guestLoginBtn) guestLoginBtn.addEventListener('click', startGuestMode);
logoutBtn.addEventListener('click', handleLogout);

onAuthStateChanged(auth, (user) => {
    if (currentUser && currentUser.isGuest) return;

    if (user) {
        currentUser = user;
        loginView.style.display = 'none';
        dashboardView.style.display = 'block';

        loginBtn.classList.remove('d-flex');
        loginBtn.classList.add('d-none');

        logoutBtn.classList.remove('d-none');
        logoutBtn.classList.add('d-flex');

        exportBtn.style.display = 'inline-block';
        statsNavBtn.style.display = 'inline-block';
        unsettledBadgeBtn.style.display = 'inline-block';

        window.firebaseData = {
            db, storage, collection, addDoc, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, ref, uploadBytes, getDownloadURL, getDocs, deleteObject, currentUser
        };

        window.dispatchEvent(new Event('authReady'));
    } else {
        currentUser = null;
        loginView.style.display = 'block';
        dashboardView.style.display = 'none';

        loginBtn.classList.remove('d-none');
        loginBtn.classList.add('d-flex');

        logoutBtn.classList.remove('d-flex');
        logoutBtn.classList.add('d-none');

        exportBtn.style.display = 'none';
        statsNavBtn.style.display = 'none';
        unsettledBadgeBtn.style.display = 'none';
    }
});


const mapViewWrapper = document.getElementById('mapViewWrapper');

// --- View Toggle (List/Calendar/Audit) ---
const restoreMainViews = () => {
    statsViewWrapper.style.display = 'none';
    auditLogViewWrapper.style.display = 'none';
    viewToggleGroup.style.display = 'flex';
    if (fabBtn) fabBtn.style.display = 'flex';


    if (btnList.checked) {
        if (listControlsWrapper) listControlsWrapper.style.display = 'flex';
        recordsContainer.style.display = 'flex';

        calendarViewWrapper.style.display = 'none';
        auditLogViewWrapper.style.display = 'none';
        if (mapViewWrapper) mapViewWrapper.style.display = 'none';
    } else if (btnCalendar.checked) {
        if (listControlsWrapper) listControlsWrapper.style.display = 'none';
        recordsContainer.style.display = 'none';
        calendarViewWrapper.style.display = 'block';
        auditLogViewWrapper.style.display = 'none';
        if (mapViewWrapper) mapViewWrapper.style.display = 'none';
        renderCustomCalendar();
    } else if (btnMap.checked) {
        if (listControlsWrapper) listControlsWrapper.style.display = 'none';
        recordsContainer.style.display = 'none';
        calendarViewWrapper.style.display = 'none';
        auditLogViewWrapper.style.display = 'none';
        if (mapViewWrapper) mapViewWrapper.style.display = 'block';
        if (fabBtn) fabBtn.style.display = 'none'; // Hide FAB on map view
    }
};


btnAuditLog.addEventListener('click', () => {
    // Hide main views
    if (listControlsWrapper) listControlsWrapper.style.display = 'none';
    recordsContainer.style.display = 'none';
    calendarViewWrapper.style.display = 'none';
    if (mapViewWrapper) mapViewWrapper.style.display = 'none';

    // Hide the view toggle segment slider completely and fab btn
    viewToggleGroup.style.display = 'none';
    if (fabBtn) fabBtn.style.display = 'none';

    // Show audit log
    auditLogViewWrapper.style.display = 'block';

    if (typeof fetchAndRenderAuditLogs === 'function') fetchAndRenderAuditLogs();
});

btnList.addEventListener('change', () => {
    if (btnList.checked) {
        updateSegmentSlider();
        restoreMainViews();
    }
});

btnMap.addEventListener('change', () => {
    if (btnMap.checked) {
        updateSegmentSlider();
        restoreMainViews();
    }
});

btnCalendar.addEventListener('change', () => {
    if (btnCalendar.checked) {
        updateSegmentSlider();
        restoreMainViews();
    }
});

// Stats View Toggle
const statsNavBtn = document.getElementById('statsNavBtn');
const backFromStatsBtn = document.getElementById('backFromStatsBtn');

statsNavBtn.addEventListener('click', () => {
    // Hide main views
    if (listControlsWrapper) listControlsWrapper.style.display = 'none';
    recordsContainer.style.display = 'none';
    calendarViewWrapper.style.display = 'none';
    auditLogViewWrapper.style.display = 'none';
    viewToggleGroup.style.display = 'none';
    if (fabBtn) fabBtn.style.display = 'none';

    // Show stats
    statsViewWrapper.style.display = 'block';

    // Trigger render
    if (typeof calculateAndRenderStats === 'function') {
        calculateAndRenderStats();
    }
});

backFromStatsBtn.addEventListener('click', restoreMainViews);

const backFromAuditBtn = document.getElementById('backFromAuditBtn');
if (backFromAuditBtn) {
    backFromAuditBtn.addEventListener('click', restoreMainViews);
}


// Renders the continuous capsule backgrounds behind the dates.
function updateCalendarRecords(date) {
    if (!currentRecords) return;

    const allDayWrappers = document.querySelectorAll('.calendar-day-wrapper');
    if (allDayWrappers.length === 0) return;

    // First, clear old highlights if any
    document.querySelectorAll('.trip-highlight').forEach(el => el.remove());

    // Generate date map from wrappers
    const cellMap = {};
    allDayWrappers.forEach(wrapper => {
        if (wrapper.dataset.date) {
            cellMap[wrapper.dataset.date] = wrapper;
        }
    });

    currentRecords.forEach(record => {
        if (!record.startTime || !record.endTime) return;

        // Convert to YYYY-MM-DD
        const startStr = record.startTime.split('T')[0];
        const endStr = record.endTime.split('T')[0];

        const startDate = new Date(startStr);
        const endDate = new Date(endStr);

        // Make sure it doesn't cross if it's identical
        const isSingleDay = startStr === endStr;

        // Iterate through all days in this trip's range
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const dateKey = `${y}-${m}-${day}`;

            const wrapper = cellMap[dateKey];
            if (wrapper) {
                const highlight = document.createElement('div');
                highlight.className = 'trip-highlight';

                if (record.isSettled) {
                    highlight.classList.add('settled');
                } else {
                    highlight.classList.add('unsettled');
                }

                if (isSingleDay) {
                    highlight.classList.add('single');
                } else if (dateKey === startStr) {
                    highlight.classList.add('start');
                } else if (dateKey === endStr) {
                    highlight.classList.add('end');
                } else {
                    highlight.classList.add('mid');
                }

                wrapper.appendChild(highlight);
            }
        }
    });

    // After setting the background capsules, we also update the details list (Step 5)
    renderCalendarList();
}


// --- Form Dynamic Logic ---

const calculateAllowance = (systemOnly = false) => {
    const startVal = startTimeInput.value;
    const endVal = endTimeInput.value;

    if (!startVal || !endVal) {
        if (!allowanceInput.dataset.manualOverride) {
            allowanceInput.value = 0;
            timeCalcHint.textContent = "請先輸入起訖時間計算雜費";
        }
        calculateTotal();
        return 0;
    }

    const start = new Date(startVal);
    const end = new Date(endVal);

    if (end <= start) {
        if (!allowanceInput.dataset.manualOverride) {
            allowanceInput.value = 0;
            timeCalcHint.textContent = "結束時間必須晚於開始時間";
            timeCalcHint.classList.add('text-danger');
        }
        calculateTotal();
        return 0;
    }

    timeCalcHint.classList.remove('text-danger');

    let totalAllowance = 0;
    let daysCount = 0;

    const currentDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    while (currentDay <= endDay) {
        daysCount++;
        const dayStart = new Date(currentDay);
        const dayEnd = new Date(currentDay);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const overlapStart = start > dayStart ? start : dayStart;
        const overlapEnd = end < dayEnd ? end : dayEnd;
        const overlapMs = overlapEnd - overlapStart;

        if (overlapMs > 0) {
            const overlapHours = overlapMs / (1000 * 60 * 60);
            if (overlapHours >= 4) {
                totalAllowance += 400;
            } else {
                totalAllowance += 200;
            }
        }
        currentDay.setDate(currentDay.getDate() + 1);
    }

    // Save the system estimated value for reference
    allowanceInput.dataset.systemEstimate = totalAllowance;

    if (systemOnly) return totalAllowance;

    if (!allowanceInput.dataset.manualOverride) {
        allowanceInput.value = totalAllowance;
        timeCalcHint.innerHTML = `<span class="badge bg-primary">系統試算</span> 依規定按日計算：共 ${daysCount} 天，雜費合計 ${totalAllowance}`;
    } else {
         timeCalcHint.innerHTML = `<span class="badge bg-warning text-dark">手動修改</span> 已手動調整雜費（原系統估算為 ${allowanceInput.dataset.systemEstimate || 0}）`;
    }
    calculateTotal();
    return totalAllowance;
};

startTimeInput.addEventListener('change', () => {
    delete allowanceInput.dataset.manualOverride;
    calculateAllowance();
});
endTimeInput.addEventListener('change', () => {
    delete allowanceInput.dataset.manualOverride;
    calculateAllowance();
});

allowanceInput.addEventListener('input', function() {
    if (this.value !== '') {
        this.dataset.manualOverride = 'true';
        timeCalcHint.innerHTML = `<span class="badge bg-warning text-dark">手動修改</span> 已手動調整雜費（原系統估算為 ${allowanceInput.dataset.systemEstimate || 0}）`;
    } else {
        delete this.dataset.manualOverride;
        calculateAllowance();
    }
    calculateTotal();
});

const getCompanionsList = () => {
    const inputs = companionsContainer.querySelectorAll('.companion-input');
    const list = [];
    inputs.forEach(input => {
        const val = input.value.trim();
        if (val) list.push(val);
    });
    return list;
};

// Add Companion Button
addCompanionBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'ios-input mb-2 companion-input';
    const num = companionsContainer.querySelectorAll('.companion-input').length + 1;
    input.placeholder = `人員 ${num}`;
    input.addEventListener('input', updateDriverOptions);
    companionsContainer.appendChild(input);
});

const updateDriverOptions = () => {
    const type = transportTypeSelect.value;
    if (type !== 'car' && type !== 'motorcycle') {
        driverSection.classList.remove('show');
        mileageSection.classList.remove('show');
        return;
    }

    driverSection.classList.add('show');
    const companions = getCompanionsList();

    // Save current selection to restore if possible
    const currentVal = driverSelect.value;
    driverSelect.innerHTML = '<option value="self">自己 (計算里程費)</option>';

    companions.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = `${c} (不計算里程費)`;
        driverSelect.appendChild(opt);
    });

    if (Array.from(driverSelect.options).some(o => o.value === currentVal)) {
        driverSelect.value = currentVal;
    }
    handleDriverChange();
};

transportTypeSelect.addEventListener('change', updateDriverOptions);

// Bind initial companion inputs
document.querySelectorAll('.companion-input').forEach(input => {
    input.addEventListener('input', updateDriverOptions);
});


const handleDriverChange = () => {
    const type = transportTypeSelect.value;
    if (type !== 'car' && type !== 'motorcycle') return;

    if (driverSelect.value === 'self') {
        mileageSection.classList.add('show');
        if (type === 'car') {
            mileageRateHint.textContent = "汽車：每公里補助 $3";
            mileageInput.dataset.rate = "3";
        } else {
            mileageRateHint.textContent = "機車：每公里補助 $2";
            mileageInput.dataset.rate = "2";
        }
    } else {
        // Someone else is driving, no mileage for self
        mileageSection.classList.remove('show');
        mileageInput.value = '';
    }
    calculateTotal();
};
driverSelect.addEventListener('change', handleDriverChange);
mileageInput.addEventListener('input', calculateTotal);

// Dynamic Receipts
const createReceiptEl = (data = null) => {
    const id = `receipt_${Date.now()}_${dynamicReceiptCount++}`;
    const el = document.createElement('div');
    el.className = 'receipt-item position-relative';
    el.dataset.id = id;

    // Use existing image path if provided (for edit mode)
    let imgHidden = '';
    let imgUrlHidden = '';
    let imgThumbHtml = '';
    if (data && data.path) {
        imgHidden = `<input type="hidden" class="receipt-old-path" value="${data.path}">`;
        imgUrlHidden = `<input type="hidden" class="receipt-old-url" value="${data.url}">`;
        imgThumbHtml = `<img src="${data.url}" class="receipt-thumbnail mt-2">`;
    }

    el.innerHTML = `
        <button type="button" class="delete-receipt-btn"><i class="bi bi-x"></i></button>
        <div class="mb-2">
            <input type="text" class="ios-input receipt-name" placeholder="發票項目名稱 (例如：高鐵去程, 住宿)" value="${data ? escapeHtml(data.name) : ''}" required>
        </div>
        <div class="d-flex align-items-center mb-2">
            <span class="fw-bold text-muted me-2">$</span>
            <input type="number" class="ios-input receipt-price" placeholder="金額" min="0" value="${data ? data.price : ''}" required>
        </div>
        <div>
            <input type="file" class="ios-input receipt-file" accept="image/*" style="font-size: 0.8rem;">
            ${imgHidden}
            ${imgUrlHidden}
            ${imgThumbHtml}
        </div>
    `;

    el.querySelector('.delete-receipt-btn').addEventListener('click', () => {
        el.remove();
        calculateTotal();
    });

    el.querySelector('.receipt-price').addEventListener('input', calculateTotal);

    return el;
};

addReceiptBtn.addEventListener('click', () => {
    receiptsContainer.appendChild(createReceiptEl());
});

function calculateTotal() {
    const allowance = parseFloat(allowanceInput.value) || 0;

    let transportCost = 0;
    const type = transportTypeSelect.value;
    if ((type === 'car' || type === 'motorcycle') && driverSelect.value === 'self') {
        const mileage = parseFloat(mileageInput.value) || 0;
        const rate = parseFloat(mileageInput.dataset.rate) || 0;
        transportCost = mileage * rate;
    }

    let receiptTotal = 0;
    document.querySelectorAll('.receipt-price').forEach(input => {
        receiptTotal += parseFloat(input.value) || 0;
    });

    const total = allowance + transportCost + receiptTotal;
    totalAmountInput.value = Math.round(total);
    totalAmountDisplay.textContent = Math.round(total);
}


// --- CRUD Operations ---
let bootstrapModalInstance = null;
document.addEventListener('DOMContentLoaded', () => {
    const modalEl = document.getElementById('recordModal');
    if (modalEl) {
        bootstrapModalInstance = new bootstrap.Modal(modalEl);

        // Reset form on open if no ID (Create Mode)
        modalEl.addEventListener('show.bs.modal', (e) => {
            // Reset override flag and hint on open
            delete allowanceInput.dataset.manualOverride;
            timeCalcHint.innerHTML = '';

            if (!e.relatedTarget || !e.relatedTarget.closest) return;
            const btn = e.relatedTarget.closest('.fab');
            if (btn) {
                form.reset();
                recordIdInput.value = '';
                modalTitle.textContent = '新增紀錄';
                receiptsContainer.innerHTML = '';

                totalAmountDisplay.textContent = '0';
                timeCalcHint.textContent = '請輸入起訖時間計算雜費';
                timeCalcHint.classList.remove('text-danger');

                // Prefill dates to current time and +1 hour
                const now = new Date();
                // offset timezone
                now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                startTimeInput.value = now.toISOString().slice(0,16);
                const later = new Date(now.getTime() + 60 * 60 * 1000);
                endTimeInput.value = later.toISOString().slice(0,16);
                calculateAllowance();
                updateDriverOptions();
            }
        });
    }
});


saveRecordBtn.addEventListener('click', async () => {
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // Explicit auth check: must be a guest, or a logged in google user
    if (!currentUser || (!currentUser.isGuest && !currentUser.uid)) {
        alert('尚未登入，請先使用 Google 登入後再儲存！');
        return;
    }

    if (!window.firebaseData) {
        alert('系統尚未就緒，請重新整理後再試');
        return;
    }

    try {
        saveRecordBtn.disabled = true;
        saveSpinner.classList.remove('d-none');

        const { db, storage, collection, doc, addDoc, updateDoc, serverTimestamp, ref, uploadBytes, getDownloadURL, currentUser } = window.firebaseData;

        const isEdit = !!recordIdInput.value;
        const tripName = document.getElementById('tripName').value;
        const location = document.getElementById('location').value;
        const visitingUnit = document.getElementById('visitingUnit').value;
        const startVal = startTimeInput.value;
        const endVal = endTimeInput.value;
        const allowanceVal = parseInt(allowanceInput.value);
        const leaderVal = document.getElementById('leader').value.trim();
        const companions = getCompanionsList().join(', '); // Join array into string for saving
        const transportTypeVal = transportTypeSelect.value;
        const driver = driverSelect.value;

        let mileageVal = null;
        let transportCostVal = 0;

        if ((transportTypeVal === 'car' || transportTypeVal === 'motorcycle') && driver === 'self') {
            mileageVal = parseFloat(mileageInput.value) || 0;
            const rate = parseFloat(mileageInput.dataset.rate) || 0;
            transportCostVal = Math.round(mileageVal * rate);
        }

        // Process Receipts
        const receipts = [];
        const receiptEls = document.querySelectorAll('#receiptsContainer .receipt-item');
        for (const el of receiptEls) {
            const name = el.querySelector('.receipt-name').value;
            const price = parseFloat(el.querySelector('.receipt-price').value) || 0;
            const fileInput = el.querySelector('.receipt-file');

            let path = el.querySelector('.receipt-old-path') ? el.querySelector('.receipt-old-path').value : null;
            let url = el.querySelector('.receipt-old-url') ? el.querySelector('.receipt-old-url').value : null;

            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                const filename = `receipts/${currentUser.uid}/${Date.now()}_${file.name}`;
                const storageRef = ref(storage, filename);
                await withTimeout(uploadBytes(storageRef, file), 15000, '圖片上傳逾時，請檢查網路狀態或 Firebase Storage 規則');
                url = await getDownloadURL(storageRef);
                path = filename;
            }

            receipts.push({ name, price, path, url });
        }

        const totalVal = parseInt(totalAmountInput.value);

        const recordData = {
            userId: currentUser.uid,
            tripName,
            location,
            visitingUnit,
            startTime: startVal,
            endTime: endVal,
            allowance: allowanceVal,
            leader: leaderVal,
            companions,
            transportType: transportTypeVal,
            driver,
            mileage: mileageVal,
            transportCost: transportCostVal,
            receipts,
            totalAmount: totalVal,
        };

        if (isEdit) {
            recordData.updatedAt = serverTimestamp();
            const docRef = doc(db, 'records', recordIdInput.value);
            await withTimeout(updateDoc(docRef, recordData), 15000, '更新紀錄逾時，請檢查網路狀態或 Firestore 規則');
            logAction('update', tripName);
        } else {
            recordData.isSettled = false;
            recordData.settledAt = null;
            recordData.createdAt = serverTimestamp();
            await withTimeout(addDoc(collection(db, 'records'), recordData), 15000, '新增紀錄逾時，請檢查網路狀態或 Firestore 規則');
            logAction('create', tripName);
        }

        const modalEl = document.getElementById('recordModal');
        if (modalEl) {
            const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modalInstance.hide();
        }

    } catch (error) {
        console.error("Save error:", error.code, error.message, error);

        let errorMsg = `儲存失敗：\n${error.message}`;
        if (error.code === 'permission-denied' || (error.message && error.message.includes('permission'))) {
            errorMsg = "Firebase 權限不足，請到 Console 設定 Firestore / Storage 規則。\n詳細：" + error.message;
        } else if (error.message && error.message.includes('逾時')) {
            errorMsg = error.message;
        } else if (error.code === 'unavailable' || error.message.includes('network')) {
            errorMsg = "網路連線異常，請檢查您的網路狀態。";
        }

        alert(errorMsg);
    } finally {
        saveRecordBtn.disabled = false;
        saveSpinner.classList.add('d-none');
    }
});


// Load & Display Records
let unsubscribeRecords = null;
window.addEventListener('authReady', () => {
    const { db, collection, query, where, orderBy, onSnapshot, currentUser } = window.firebaseData;

    if (unsubscribeRecords) unsubscribeRecords();

    const loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.style.display = 'block';
    recordsContainer.innerHTML = '';

    // Also load locations
    loadLocations();

    const q = query(
        collection(db, 'records'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
    );

    unsubscribeRecords = onSnapshot(q, async (snapshot) => {
        loadingIndicator.style.display = 'none';
        recordsContainer.innerHTML = '';
        currentRecords = [];
        let unsettledTotal = 0;

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const record = { id: docSnap.id, ...data };
            currentRecords.push(record);

            if (!record.isSettled) unsettledTotal += record.totalAmount;
        });

        // Use the new render function to apply active filters/search queries
        if (typeof renderFilteredRecordsList === 'function') {
            renderFilteredRecordsList();
        } else {
            currentRecords.forEach(r => renderRecordCard(r));
        }

        if (unsettledTotal > 0) {
            unsettledBadgeBtn.textContent = `未入帳 $${unsettledTotal.toLocaleString()}`;
            unsettledBadgeBtn.className = 'btn btn-sm btn-danger rounded-pill px-3 me-2 fw-bold shadow-sm';
        } else {
            unsettledBadgeBtn.textContent = '未入帳 $0';
            unsettledBadgeBtn.className = 'btn btn-sm btn-secondary rounded-pill px-3 me-2 fw-bold shadow-sm opacity-50';
        }

        if (btnCalendar.checked) {
            renderCustomCalendar();
        }

        // Also ensure audit logs are pre-fetched and available when switching
        fetchAndRenderAuditLogs();

        await cleanupOldImages(currentRecords);
    });
});

const escapeHtml = (unsafe) => (unsafe || '').toString().replace(/[&<"'>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const renderRecordCard = (record, container = recordsContainer) => {
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6 col-lg-4';

    const typeMap = { 'car': '自行開車', 'motorcycle': '自行騎車', 'public': '大眾/其他' };

    let detailsHtml = '';
    if (record.leader) {
        detailsHtml += `<div class="text-muted small">帶隊官：${escapeHtml(record.leader)}</div>`;
    }
    if (record.companions && record.companions.trim() !== '') {
        detailsHtml += `<div class="text-muted small">同行人員：${escapeHtml(record.companions)}</div>`;
    }
    if (record.transportType === 'car' || record.transportType === 'motorcycle') {
        detailsHtml += `<div class="text-muted small">駕駛：${escapeHtml(record.driver === 'self' ? '自己' : record.driver)} (里程: ${record.mileage || 0}km)</div>`;
    }

    let receiptsHtml = '';
    if (record.receipts && record.receipts.length > 0) {
        receiptsHtml = `<div class="mt-2 border-top pt-2"><div class="small fw-bold mb-1">發票明細：</div>`;
        record.receipts.forEach(r => {
            let img = r.url ? `<a href="${r.url}" target="_blank" class="ms-2"><i class="bi bi-image text-primary"></i></a>` : '';
            receiptsHtml += `<div class="d-flex justify-content-between text-muted small">
                <span>${escapeHtml(r.name)} ${img}</span>
                <span>$${r.price}</span>
            </div>`;
        });
        receiptsHtml += `</div>`;
    }

    let statusHtml = '';
    if (record.isSettled) {
        let settledStr = '已入帳';
        if (record.settledAt) {
            // Check if it's a date string or timestamp, format to YYYY/MM/DD
            const d = new Date(record.settledAt);
            if (!isNaN(d.getTime())) {
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                settledStr = `已入帳於 ${yyyy}/${mm}/${dd}`;
            }
        }
        statusHtml = `<span class="badge bg-success rounded-pill px-2">${settledStr}</span>`;
    }

    let cardClass = record.isSettled ? 'card record-card status-settled bg-custom-card text-main-custom' : 'card record-card bg-custom-card text-main-custom';

    // settled logic
    let actionBtnHtml = '';
    if (record.isSettled) {
        const diffDays = Math.ceil(Math.abs(new Date() - (record.settledAt ? new Date(record.settledAt) : new Date())) / (1000 * 60 * 60 * 24));
        if (diffDays <= 30) {
            actionBtnHtml = `<button class="btn btn-sm btn-outline-secondary w-100 mt-3 toggle-settle-btn rounded-pill fw-bold" data-id="${record.id}" data-action="undo"><i class="bi bi-arrow-counterclockwise"></i> 復原未入帳</button>`;
        }
    } else {
        actionBtnHtml = `<button class="btn btn-sm btn-outline-primary w-100 mt-3 toggle-settle-btn rounded-pill fw-bold" data-id="${record.id}" data-action="settle"><i class="bi bi-check2-circle"></i> 標記為已入帳</button>`;
    }

    col.innerHTML = `
        <div class="${cardClass}">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h5 class="card-title fw-bold m-0 text-truncate text-main-custom">${escapeHtml(record.tripName)}</h5>
                    ${statusHtml}
                </div>
                <div class="small text-primary mb-2"><i class="bi bi-geo-alt-fill me-1"></i>${escapeHtml(record.location)} ${record.visitingUnit ? '('+escapeHtml(record.visitingUnit)+')' : ''}</div>
                <div class="small text-muted mb-2"><i class="bi bi-clock me-1"></i>${record.startTime.replace('T', ' ')} ~<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${record.endTime.replace('T', ' ')}</div>

                <div class="d-flex justify-content-between text-muted small border-top pt-2 mt-2" style="border-color: var(--border-color) !important;">
                    <span>雜費</span><span>$${record.allowance}</span>
                </div>
                <div class="d-flex justify-content-between text-muted small">
                    <span>交通費 (${typeMap[record.transportType] || '無'})</span><span>$${record.transportCost}</span>
                </div>
                ${detailsHtml}
                ${receiptsHtml}

                <div class="mt-3 pt-2 border-top d-flex justify-content-between align-items-center" style="border-color: var(--border-color) !important;">
                    <span class="fw-bold text-main-custom">總計</span>
                    <span class="fw-bold text-danger fs-5">$${record.totalAmount}</span>
                </div>

                <div class="d-flex gap-2 mt-3">
                    <button class="btn btn-custom-light btn-sm flex-fill edit-record-btn text-primary fw-bold rounded-pill" data-id="${record.id}"><i class="bi bi-pencil-square"></i> 編輯</button>
                    <button class="btn btn-custom-light btn-sm flex-fill delete-record-btn text-danger fw-bold rounded-pill" data-id="${record.id}" data-trip="${escapeHtml(record.tripName)}"><i class="bi bi-trash"></i> 刪除</button>
                </div>
                ${actionBtnHtml}
            </div>
        </div>
    `;
    container.appendChild(col);
};

// Handle Settle Date Confirmation
document.getElementById('confirmSettleBtn').addEventListener('click', async () => {
    if (!pendingSettleDocId) return;

    const settleDateStr = document.getElementById('settleDateInput').value;
    if (!settleDateStr) {
        alert("請選擇入帳日期");
        return;
    }

    if (!window.firebaseData) {
        alert('系統尚未就緒，請重新整理後再試');
        return;
    }

    const confirmBtn = document.getElementById('confirmSettleBtn');

    try {
        confirmBtn.disabled = true;
        const { db, doc, updateDoc } = window.firebaseData;

        // Parse date string into full ISO string to match DB format
        const settleDateObj = new Date(settleDateStr);
        await updateDoc(doc(db, 'records', pendingSettleDocId), {
            isSettled: true,
            settledAt: settleDateObj.toISOString()
        });

        const record = currentRecords.find(r => r.id === pendingSettleDocId);
        if (record) {
            logAction('settle', record.tripName, { settledDate: settleDateStr.replace(/-/g, '/') });
        }

        const modalEl = document.getElementById('settleDateModal');
        if (modalEl) {
            const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modalInstance.hide();
        }

    } catch (error) {
        console.error("Settle error:", error);
        alert("更新狀態失敗：" + error.message);
    } finally {
        confirmBtn.disabled = false;
        pendingSettleDocId = null;
    }
});

// Handle Settle/Undo Toggle
let pendingSettleDocId = null;
const settleDateModal = new bootstrap.Modal(document.getElementById('settleDateModal'));

document.getElementById('dashboardView').addEventListener('click', async (e) => {
    const settleBtn = e.target.closest('.toggle-settle-btn');
    if (settleBtn) {
        const docId = settleBtn.dataset.id;
        const action = settleBtn.dataset.action;

        if (action === 'settle') {
            // Open modal to pick date instead of settling immediately
            pendingSettleDocId = docId;
            // Use local date string instead of strict UTC to prevent off-by-one errors in Taiwan timezone
            const now = new Date();
            const offset = now.getTimezoneOffset() * 60000;
            const localDateStr = new Date(now.getTime() - offset).toISOString().split('T')[0];
            document.getElementById('settleDateInput').value = localDateStr;
            settleDateModal.show();
        } else if (action === 'undo') {
            // Undo immediately
            const { db, doc, updateDoc } = window.firebaseData;
            try {
                settleBtn.disabled = true;
                await updateDoc(doc(db, 'records', docId), {
                    isSettled: false,
                    settledAt: null
                });

                const record = currentRecords.find(r => r.id === docId);
                if (record) {
                    logAction('unsettle', record.tripName);
                }
            } catch (error) {
                alert("更新狀態失敗：" + error.message);
                settleBtn.disabled = false;
            }
        }
        return;
    }

    const editBtn = e.target.closest('.edit-record-btn');
    if (editBtn) {
        const id = editBtn.dataset.id;
        const record = currentRecords.find(r => r.id === id);
        if (record) openEditModal(record);
        return;
    }

    const deleteBtn = e.target.closest('.delete-record-btn');
    if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        const tripName = deleteBtn.dataset.trip;
        openDeleteConfirmModal(id, tripName);
    }
});

let deleteModalInstance = null;
let currentDeleteId = null;
let currentDeleteTripName = null;

const openDeleteConfirmModal = (id, tripName) => {
    currentDeleteId = id;
    currentDeleteTripName = tripName;
    const modalEl = document.getElementById('deleteConfirmModal');
    if (!deleteModalInstance) {
        deleteModalInstance = new bootstrap.Modal(modalEl);
    }
    document.getElementById('deleteSpinner').classList.add('d-none');
    document.getElementById('confirmDeleteBtn').disabled = false;
    deleteModalInstance.show();
};

document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    if (!currentDeleteId) return;

    const { db, doc, deleteDoc } = window.firebaseData;
    const btn = document.getElementById('confirmDeleteBtn');
    const spinner = document.getElementById('deleteSpinner');

    try {
        btn.disabled = true;
        spinner.classList.remove('d-none');

        await deleteDoc(doc(db, 'records', currentDeleteId));
        // Note: the associated images will be orphaned in storage initially,
        // but this behavior is consistent with the app's existing cleanup logic
        // which could be extended later to handle immediate deletion if needed.

        // Log the deletion action
        if (typeof logAction === 'function') {
            logAction('delete', currentDeleteTripName);
        }

        deleteModalInstance.hide();
        currentDeleteId = null;
        currentDeleteTripName = null;
    } catch (error) {
        alert("刪除失敗：" + error.message);
        btn.disabled = false;
        spinner.classList.add('d-none');
    }
});


const openEditModal = (record) => {
    recordIdInput.value = record.id;
    modalTitle.textContent = '編輯紀錄';

    document.getElementById('tripName').value = record.tripName || '';
    document.getElementById('location').value = record.location || '';
    document.getElementById('visitingUnit').value = record.visitingUnit || '';
    startTimeInput.value = record.startTime || '';
    endTimeInput.value = record.endTime || '';
    document.getElementById('leader').value = record.leader || '';

    // Clear and populate companions
    companionsContainer.innerHTML = '';
    const companionsList = record.companions ? record.companions.split(',').map(s => s.trim()) : [];
    // Ensure at least 3 inputs are shown initially, like a fresh form
    const totalInputs = Math.max(3, companionsList.length);
    for(let i=0; i<totalInputs; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'ios-input mb-2 companion-input';
        input.placeholder = `人員 ${i+1}`;
        if (companionsList[i]) input.value = companionsList[i];
        input.addEventListener('input', updateDriverOptions);
        companionsContainer.appendChild(input);
    }

    transportTypeSelect.value = record.transportType || '';

    updateDriverOptions();
    if (record.driver) driverSelect.value = record.driver;
    handleDriverChange();

    if (record.mileage !== null) mileageInput.value = record.mileage;

    receiptsContainer.innerHTML = '';
    if (record.receipts) {
        record.receipts.forEach(r => {
            receiptsContainer.appendChild(createReceiptEl(r));
        });
    }

    // Calculate system total to get the baseline estimate, but don't apply it to UI yet
    const systemEst = calculateAllowance(true);
    allowanceInput.dataset.systemEstimate = systemEst;

    if (record.allowance !== undefined && record.allowance !== null && String(record.allowance) !== String(systemEst)) {
        // If the saved allowance differs from what the system calculates NOW, it means it was manually overridden.
        allowanceInput.value = record.allowance;
        allowanceInput.dataset.manualOverride = 'true';
        timeCalcHint.innerHTML = `<span class="badge bg-warning text-dark">手動修改</span> 已手動調整雜費（原系統估算為 ${systemEst}）`;
    } else {
        // Safe to use system default
        delete allowanceInput.dataset.manualOverride;
        calculateAllowance(); // Force UI update
    }

    calculateTotal(); // updates total

    if (bootstrapModalInstance) bootstrapModalInstance.show();
};


const cleanupOldImages = async (records) => {
    const { db, storage, doc, updateDoc, ref, deleteObject } = window.firebaseData;
    const now = new Date();
    for (const record of records) {
        if (record.isSettled && record.settledAt && record.receipts) {
            const diffDays = Math.ceil(Math.abs(now - new Date(record.settledAt)) / (1000 * 60 * 60 * 24));
            if (diffDays > 30) {
                let updated = false;
                const newReceipts = [...record.receipts];
                for (let i = 0; i < newReceipts.length; i++) {
                    const r = newReceipts[i];
                    if (r.path && r.url) {
                        try {
                            await deleteObject(ref(storage, r.path));
                            newReceipts[i].path = null;
                            newReceipts[i].url = null;
                            updated = true;
                        } catch(e){}
                    }
                }
                if (updated) {
                    await updateDoc(doc(db, 'records', record.id), { receipts: newReceipts });
                }
            }
        }
    }
};


// --- Calendar Logic ---
const calendarRecordsContainer = document.getElementById('calendarRecordsContainer');
const selectedDateTitle = document.getElementById('selectedDateTitle');
let selectedDateStr = new Date().toISOString().slice(0,10); // Default to today

const renderCalendarList = () => {
    calendarRecordsContainer.innerHTML = '';
    const dateObj = new Date(selectedDateStr);

    // Check if the selected date falls between any record's start and end times
    const filteredRecords = currentRecords.filter(r => {
        const rStartStr = r.startTime.slice(0, 10);
        let rEndStr = r.endTime.slice(0, 10);
        return selectedDateStr >= rStartStr && selectedDateStr <= rEndStr;
    });

    if (filteredRecords.length === 0) {
        calendarRecordsContainer.innerHTML = '<div class="col-12 text-center text-muted py-4 small">本日無出差紀錄</div>';
    } else {
        filteredRecords.forEach(r => renderRecordCard(r, calendarRecordsContainer));
    }
};


// --- CSV Export Logic ---
exportBtn.addEventListener('click', () => {
    if (!currentRecords || currentRecords.length === 0) return alert('沒有可匯出的紀錄。');

    const headers = ['出差名稱', '地點', '拜訪單位', '帶隊官', '同行', '開始時間', '結束時間', '雜費', '交通方式', '駕駛', '里程數', '交通費', '發票總計', '總計金額', '狀態'];

    const rows = currentRecords.map(r => {
        const typeMap = { 'car': '自行開車', 'motorcycle': '自行騎車', 'public': '大眾/其他' };
        let receiptTotal = 0;
        if (r.receipts) r.receipts.forEach(x => receiptTotal += x.price);

        const row = [
            `"${(r.tripName || '').replace(/"/g, '""')}"`,
            `"${(r.location || '').replace(/"/g, '""')}"`,
            `"${(r.visitingUnit || '').replace(/"/g, '""')}"`,
            `"${(r.leader || '').replace(/"/g, '""')}"`,
            `"${(r.companions || '').replace(/"/g, '""')}"`,
            r.startTime.replace('T', ' '),
            r.endTime.replace('T', ' '),
            r.allowance || 0,
            typeMap[r.transportType] || '',
            r.driver === 'self' ? '自己' : r.driver || '',
            r.mileage !== null ? r.mileage : '',
            r.transportCost || 0,
            receiptTotal,
            r.totalAmount || 0,
            r.isSettled ? '已入帳' : '未入帳'
        ];
        return row.join(',');
    });

    const csvContent = headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `差旅費紀錄_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// --- Custom Vanilla JS Calendar Logic ---
let currentDate = new Date();
let selectedDate = new Date();

function renderCustomCalendar() {
    const calendarContainer = document.getElementById('calendar');
    if (!calendarContainer) return;

    calendarContainer.innerHTML = '';
    calendarContainer.className = 'custom-calendar text-main-custom';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Header
    const header = document.createElement('div');
    header.className = 'calendar-header';

    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '<i class="bi bi-chevron-left"></i>';
    prevBtn.onclick = () => {
        currentDate.setMonth(month - 1);
        renderCustomCalendar();
    };

    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '<i class="bi bi-chevron-right"></i>';
    nextBtn.onclick = () => {
        currentDate.setMonth(month + 1);
        renderCustomCalendar();
    };

    const title = document.createElement('h5');
    title.textContent = `${year}年 ${month + 1}月`;

    header.appendChild(prevBtn);
    header.appendChild(title);
    header.appendChild(nextBtn);
    calendarContainer.appendChild(header);

    // Weekdays
    const weekdays = document.createElement('div');
    weekdays.className = 'calendar-weekdays';
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    days.forEach(day => {
        const div = document.createElement('div');
        div.textContent = day;
        weekdays.appendChild(div);
    });
    calendarContainer.appendChild(weekdays);

    // Grid
    const grid = document.createElement('div');
    grid.className = 'calendar-grid';

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);

    const startDayIndex = firstDay.getDay(); // 0 (Sun) to 6 (Sat)

    // Previous month's days
    for (let i = startDayIndex - 1; i >= 0; i--) {
        const dayDiv = createCalendarDay(year, month - 1, prevLastDay.getDate() - i, true);
        grid.appendChild(dayDiv);
    }

    // Current month's days
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const dayDiv = createCalendarDay(year, month, i, false);
        grid.appendChild(dayDiv);
    }

    // Next month's days (to fill 42 cells)
    const totalCells = grid.children.length;
    for (let i = 1; i <= (42 - totalCells); i++) {
        const dayDiv = createCalendarDay(year, month + 1, i, true);
        grid.appendChild(dayDiv);
    }

    calendarContainer.appendChild(grid);

    // After rendering calendar, also render continuous trips (Step 4)
    // and trigger update for selected date
    updateCalendarRecords(selectedDate);
}

function createCalendarDay(year, month, day, isOtherMonth) {
    const dateObj = new Date(year, month, day);
    const wrapper = document.createElement('div');
    wrapper.className = 'calendar-day-wrapper';

    // Store exact date as yyyy-mm-dd for easy comparison later
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    wrapper.dataset.date = `${y}-${m}-${d}`;

    const cell = document.createElement('div');
    cell.className = 'calendar-cell';
    cell.textContent = day;

    if (isOtherMonth) {
        cell.classList.add('other-month');
    }

    const today = new Date();
    if (dateObj.getDate() === today.getDate() &&
        dateObj.getMonth() === today.getMonth() &&
        dateObj.getFullYear() === today.getFullYear()) {
        cell.classList.add('today');
    }

    if (dateObj.getDate() === selectedDate.getDate() &&
        dateObj.getMonth() === selectedDate.getMonth() &&
        dateObj.getFullYear() === selectedDate.getFullYear()) {
        cell.classList.add('selected');
    }

    cell.onclick = () => {
        selectedDate = new Date(dateObj);

        // Sync the globally used selectedDateStr
        const y = selectedDate.getFullYear();
        const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const d = String(selectedDate.getDate()).padStart(2, '0');
        selectedDateStr = `${y}-${m}-${d}`;

        // Update the display title
        if (selectedDateTitle) {
            const isToday = y === new Date().getFullYear() &&
                            selectedDate.getMonth() === new Date().getMonth() &&
                            selectedDate.getDate() === new Date().getDate();
            selectedDateTitle.textContent = isToday ? '今天' : `${m}月${d}日`;
        }

        renderCustomCalendar(); // Re-render to update selected state and details
    };

    wrapper.appendChild(cell);
    return wrapper;
}

// --- Global Audit Log Logic ---
let auditLogs = [];

const logAction = async (actionType, tripName, details = null) => {
    const { db, collection, addDoc, serverTimestamp, currentUser } = window.firebaseData;
    if (!currentUser || !db) return;

    try {
        const logData = {
            userId: currentUser.uid,
            actionType,
            tripName: tripName || '未命名行程',
            createdAt: serverTimestamp ? serverTimestamp() : new Date().toISOString()
        };
        if (details) {
            logData.details = details;
        }

        if (db === 'mock_db') {
            // Guest mode: save to local storage
            const raw = localStorage.getItem('guest_audit_logs');
            const logs = raw ? JSON.parse(raw) : [];
            const newLog = { ...logData, id: Date.now().toString(), createdAt: new Date().toISOString() };
            logs.unshift(newLog);
            localStorage.setItem('guest_audit_logs', JSON.stringify(logs));
            // Trigger log render if currently in audit view
            fetchAndRenderAuditLogs();
        } else {
            // Real Firebase
            await addDoc(collection(db, 'auditLogs'), logData);
        }
    } catch (e) {
        console.error("Failed to log action:", e);
        // Do not alert on every small log error to prevent annoying users, but log strictly
    }
};

const fetchAndRenderAuditLogs = async () => {
    const { db, collection, query, where, orderBy, getDocs, currentUser } = window.firebaseData;
    if (!currentUser || !db) return;

    const container = document.getElementById('auditLogsContainer');
    if (!container) return;

    container.innerHTML = '<div class="col-12 text-center text-muted py-4 small"><div class="spinner-border spinner-border-sm text-primary me-2"></div>載入中...</div>';

    try {
        let fetchedLogs = [];

        if (db === 'mock_db') {
            const raw = localStorage.getItem('guest_audit_logs');
            fetchedLogs = raw ? JSON.parse(raw) : [];
        } else {
            // Note: This requires a composite index in Firestore on 'userId' ASC and 'createdAt' DESC.
            /*
            Firestore Security Rules required:
            rules_version = '2';
            service cloud.firestore {
              match /databases/{database}/documents {
                match /records/{id} {
                  allow read, write: if request.auth != null && request.resource.data.userId == request.auth.uid;
                  allow read, update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
                }
                match /auditLogs/{id} {
                  allow read, write: if request.auth != null && request.resource.data.userId == request.auth.uid;
                  allow read: if request.auth != null && resource.data.userId == request.auth.uid;
                }
              }
            }
            */
            const q = query(
                collection(db, 'auditLogs'),
                where('userId', '==', currentUser.uid),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            snapshot.forEach(docSnap => {
                fetchedLogs.push({ id: docSnap.id, ...docSnap.data() });
            });
        }

        auditLogs = fetchedLogs;
        renderAuditLogs();

    } catch (error) {
        container.innerHTML = `<div class="col-12 text-center text-danger py-4 small">讀取紀錄失敗<br><span class="text-muted mt-2 d-block" style="font-size:0.7rem;">(若為「需建立索引」錯誤，請至 Firebase Console 設定 Composite Index)</span></div>`;
        console.error("Fetch audit logs error:", error);
    }
};

const renderAuditLogs = () => {
    const container = document.getElementById('auditLogsContainer');
    if (!container) return;

    if (auditLogs.length === 0) {
        container.innerHTML = '<div class="col-12 text-center py-5"><i class="bi bi-clock-history text-muted mb-3 d-block" style="font-size: 4rem; opacity: 0.5;"></i><h5 class="fw-bold text-main-custom">目前無任何編輯紀錄</h5><p class="text-muted small mb-4">當您新增、修改或刪除任務時，系統會自動將操作日誌紀錄於此。</p></div>';
        return;
    }

    let html = '';

    auditLogs.forEach(log => {
        let actionStr = '';
        let iconHtml = '';
        let colorClass = '';

        switch (log.actionType) {
            case 'create':
                actionStr = '新增了行程';
                iconHtml = '<i class="bi bi-plus-circle text-primary"></i>';
                colorClass = 'text-primary';
                break;
            case 'update':
                actionStr = '修改了行程';
                iconHtml = '<i class="bi bi-pencil-square text-info"></i>';
                colorClass = 'text-info';
                break;
            case 'delete':
                actionStr = '刪除了行程';
                iconHtml = '<i class="bi bi-trash text-danger"></i>';
                colorClass = 'text-danger';
                break;
            case 'settle':
                actionStr = '標記為已入帳';
                if (log.details && log.details.settledDate) {
                    actionStr += ` (入帳日期為 ${log.details.settledDate})`;
                }
                iconHtml = '<i class="bi bi-check-circle-fill text-success"></i>';
                colorClass = 'text-success';
                break;
            case 'unsettle':
                actionStr = '復原為未入帳';
                iconHtml = '<i class="bi bi-arrow-counterclockwise text-secondary"></i>';
                colorClass = 'text-secondary';
                break;
            default:
                actionStr = '操作了行程';
                iconHtml = '<i class="bi bi-activity text-muted"></i>';
                colorClass = 'text-muted';
        }

        // Format Date
        let dateStr = '';
        if (log.createdAt && log.createdAt.toDate) {
            // Firestore Timestamp
            dateStr = log.createdAt.toDate().toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        } else if (log.createdAt) {
            // ISO String
            const d = new Date(log.createdAt);
            dateStr = d.toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        }

        html += `
        <div class="col-12">
            <div class="card record-card bg-custom-card text-main-custom p-3 d-flex flex-row align-items-center">
                <div class="me-3 fs-3">
                    ${iconHtml}
                </div>
                <div class="flex-grow-1">
                    <div class="fw-bold mb-1">
                        <span class="${colorClass}">${actionStr}</span>：${escapeHtml(log.tripName)}
                    </div>
                    <div class="small text-muted">${dateStr}</div>
                </div>
            </div>
        </div>`;
    });

    container.innerHTML = html;
};

// --- Stats & Calculations Logic ---
const calculateAndRenderStats = () => {
    if (!currentRecords) return;

    const startFilter = document.getElementById('statsStartDate').value;
    const endFilter = document.getElementById('statsEndDate').value;

    let filteredRecords = currentRecords;

    if (startFilter || endFilter) {
        filteredRecords = currentRecords.filter(r => {
            const tripDate = r.startTime.split('T')[0];
            let pass = true;
            if (startFilter && tripDate < startFilter) pass = false;
            if (endFilter && tripDate > endFilter) pass = false;
            return pass;
        });
    }

    let totalDays = 0;
    let totalAllowance = 0;
    let totalAccommodation = 0;
    let totalTransport = 0;
    let totalOther = 0;
    let grandTotal = 0;

    let breakdownHtml = '';

    filteredRecords.forEach(record => {
        // Calculate Days
        let days = 1;
        if (record.startTime && record.endTime) {
            const msStart = new Date(record.startTime).getTime();
            const msEnd = new Date(record.endTime).getTime();
            if (msEnd > msStart) {
                days = Math.max(1, Math.ceil((msEnd - msStart) / (1000 * 60 * 60 * 24)));
            }
        }
        totalDays += days;

        // Add to main buckets
        const allowance = record.allowance || 0;
        totalAllowance += allowance;

        let transport = record.transportCost || 0;
        let accommodation = 0;
        let other = 0;

        // Process Receipts
        let receiptBreakdownHtml = '';
        if (record.receipts && record.receipts.length > 0) {
            record.receipts.forEach(receipt => {
                const name = receipt.name.toLowerCase();
                const price = receipt.price || 0;

                // Categorization Rules
                if (/住宿|飯店|旅館|民宿|hotel|motel|inn/i.test(name)) {
                    accommodation += price;
                } else if (/車票|高鐵|台鐵|火車|客運|捷運|計程車|機票|taxi|ticket/i.test(name)) {
                    transport += price;
                } else {
                    other += price;
                }

                receiptBreakdownHtml += `
                    <div class="d-flex justify-content-between text-muted small ms-3 mb-1 border-start ps-2 border-primary">
                        <span><i class="bi bi-receipt me-1"></i>${escapeHtml(receipt.name)}</span>
                        <span>$${price}</span>
                    </div>
                `;
            });
        }

        totalAccommodation += accommodation;
        totalTransport += transport;
        totalOther += other;

        const recordTotal = allowance + transport + accommodation + other;
        grandTotal += recordTotal;

        // Build Breakdown Card HTML
        breakdownHtml += `
            <div class="card bg-custom-card border-0 shadow-sm rounded-4 text-main-custom p-3">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h6 class="fw-bold mb-0 text-primary">${escapeHtml(record.tripName)}</h6>
                    <span class="badge bg-light text-dark border">${days} 天</span>
                </div>
                <div class="small text-muted mb-2"><i class="bi bi-clock me-1"></i>${record.startTime.split('T')[0]}</div>
                <div class="d-flex justify-content-between small mb-1">
                    <span>雜費</span><span>$${allowance}</span>
                </div>
                <div class="d-flex justify-content-between small mb-1">
                    <span>交通費(含油資)</span><span>$${transport}</span>
                </div>
                <div class="d-flex justify-content-between small mb-1">
                    <span>住宿費</span><span>$${accommodation}</span>
                </div>
                <div class="d-flex justify-content-between small mb-1">
                    <span>其他費用</span><span>$${other}</span>
                </div>
                ${receiptBreakdownHtml}
                <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top" style="border-color: var(--border-color) !important;">
                    <span class="fw-bold small text-main-custom">單趟總計</span>
                    <span class="fw-bold text-danger">$${recordTotal}</span>
                </div>
            </div>
        `;
    });

    if (filteredRecords.length === 0) {
        breakdownHtml = '<div class="text-center text-muted py-5">此區間沒有任何出差紀錄。</div>';
    }

    // Update DOM
    document.getElementById('statDays').textContent = `${totalDays} 天`;
    document.getElementById('statAllowance').textContent = totalAllowance;
    document.getElementById('statAccommodation').textContent = totalAccommodation;
    document.getElementById('statTransport').textContent = totalTransport;
    document.getElementById('statOther').textContent = totalOther;
    document.getElementById('statTotal').textContent = grandTotal;

    document.getElementById('statsBreakdownContainer').innerHTML = breakdownHtml;
};

// Event Listeners for Filters
document.getElementById('filterStatsBtn').addEventListener('click', calculateAndRenderStats);
document.getElementById('resetStatsFilterBtn').addEventListener('click', () => {
    document.getElementById('statsStartDate').value = '';
    document.getElementById('statsEndDate').value = '';
    calculateAndRenderStats();
});


// --- Search and Filter Logic for List View ---
const renderFilteredRecordsList = () => {
    recordsContainer.innerHTML = '';


    if (!currentRecords || currentRecords.length === 0) {
        recordsContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-folder2-open text-muted mb-3 d-block" style="font-size: 4rem; opacity: 0.5;"></i>
                <h5 class="fw-bold text-main-custom">目前尚無差旅紀錄</h5>
                <p class="text-muted small mb-4">點擊右下角的 ＋ 按鈕，新增您的第一筆任務紀錄吧！</p>
            </div>
        `;
        return;
    }


    const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const statusFilter = statusFilterSelect ? statusFilterSelect.value : 'all';

    const results = currentRecords.filter(r => {
        // Status Filter
        if (statusFilter === 'settled' && !r.isSettled) return false;
        if (statusFilter === 'unsettled' && r.isSettled) return false;

        // Keyword Filter
        if (keyword) {
            const tripNameMatch = r.tripName && r.tripName.toLowerCase().includes(keyword);
            const locationMatch = r.location && r.location.toLowerCase().includes(keyword);
            const unitMatch = r.visitingUnit && r.visitingUnit.toLowerCase().includes(keyword);

            if (!tripNameMatch && !locationMatch && !unitMatch) return false;
        }

        return true;
    });

    if (results.length === 0) {
        recordsContainer.innerHTML = `
            <div class="col-12 text-center text-muted py-5">
                <i class="bi bi-search" style="font-size: 2.5rem; opacity: 0.5;"></i>
                <h6 class="mt-3 fw-bold">找不到符合條件的紀錄</h6>
                <p class="small mb-0">請嘗試更換關鍵字或篩選狀態。</p>
            </div>
        `;
    } else {
        results.forEach(r => renderRecordCard(r));
    }
};

if (searchInput) {
    searchInput.addEventListener('input', renderFilteredRecordsList);
}
if (statusFilterSelect) {
    statusFilterSelect.addEventListener('change', renderFilteredRecordsList);
}

// Click unsettled badge to filter list
unsettledBadgeBtn.addEventListener('click', () => {
    // Switch to List View via existing mechanisms
    document.getElementById('dashboardView').style.display = 'block';
    btnList.checked = true;
    updateSegmentSlider();
    restoreMainViews();

    // Set filter and trigger render
    statusFilterSelect.value = 'unsettled';
    renderFilteredRecordsList();
});

// --- Locations CRUD Logic ---
let unsubscribeLocations = null;

const locationsContainer = document.getElementById('locationsContainer');
const locationModal = new bootstrap.Modal(document.getElementById('locationModal'));
const locationForm = document.getElementById('locationForm');
const locIdInput = document.getElementById('locId');
const locRegionInput = document.getElementById('locRegion');
const locNameInput = document.getElementById('locName');
const locUrlInput = document.getElementById('locUrl');
const saveLocationBtn = document.getElementById('saveLocationBtn');
const saveLocationSpinner = document.getElementById('saveLocationSpinner');

const deleteLocationConfirmModal = new bootstrap.Modal(document.getElementById('deleteLocationConfirmModal'));
const confirmDeleteLocationBtn = document.getElementById('confirmDeleteLocationBtn');
const deleteLocationSpinner = document.getElementById('deleteLocationSpinner');
let locationToDeleteId = null;

function loadLocations() {
    if (unsubscribeLocations) {
        unsubscribeLocations();
    }

    // For guest mode
    if (currentUser && currentUser.isGuest) {
        const localData = JSON.parse(localStorage.getItem('guest_locations') || '[]');
        renderLocations(localData);
        return;
    }

    if (!currentUser) return;

    try {
        const q = query(
            collection(db, "locations"),
            where("userId", "==", currentUser.uid),
            orderBy("createdAt", "desc")
        );

        unsubscribeLocations = onSnapshot(q, (snapshot) => {
            const locs = [];
            snapshot.forEach((doc) => {
                locs.push({ id: doc.id, ...doc.data() });
            });
            renderLocations(locs);
        }, (error) => {
            console.error("Error loading locations:", error);
            locationsContainer.innerHTML = `<div class="text-danger text-center">載入陣地資料失敗: ${error.message}</div>`;
        });
    } catch (e) {
        console.error("Setup locations listener failed", e);
    }
}

function renderLocations(locations) {
    if (!locations || locations.length === 0) {
        locationsContainer.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="bi bi-geo-alt opacity-50 mb-3 d-block" style="font-size: 3rem;"></i>
                <p>目前還沒有任何陣地圖資，點擊右上角新增吧！</p>
            </div>
        `;
        return;
    }

    // Group by region
    const grouped = {
        '北部': [],
        '中部': [],
        '南部': [],
        '東部': [],
        '外島': []
    };

    const others = [];

    locations.forEach(loc => {
        if (grouped[loc.region]) {
            grouped[loc.region].push(loc);
        } else {
            others.push(loc);
        }
    });

    let html = '';

    // Admin email
    const ADMIN_EMAIL = 'hephaestus161@gmail.com';
    const isUserAdmin = currentUser && currentUser.email === ADMIN_EMAIL;
    const currentUserId = currentUser ? currentUser.uid : null;

    const renderGroup = (regionName, locs) => {
        if (locs.length === 0) return '';

        let groupHtml = `
            <div class="card record-card bg-custom-card border-0 shadow-sm mb-3">
                <div class="card-header bg-custom-light border-0 py-2 d-flex align-items-center rounded-top-4">
                    <i class="bi bi-geo-alt text-primary me-2"></i>
                    <span class="fw-bold text-main-custom">${escapeHtml(regionName)}</span>
                    <span class="badge bg-secondary ms-2 rounded-pill">${locs.length}</span>
                </div>
                <div class="list-group list-group-flush rounded-bottom-4">
        `;

        locs.forEach(loc => {
            const isOwner = currentUserId === loc.userId;
            const canEditOrDelete = isOwner || isUserAdmin;

            groupHtml += `
                <div class="list-group-item bg-transparent border-color d-flex justify-content-between align-items-center py-3">
                    <div class="d-flex flex-column gap-1">
                        <span class="fw-bold text-main-custom">${escapeHtml(loc.name)}</span>
                        ${isUserAdmin && !isOwner ? `<small class="text-muted"><i class="bi bi-person me-1"></i>建立者: ${escapeHtml(loc.userId)}</small>` : ''}
                    </div>
                    <div class="d-flex gap-2">
                        <a href="${escapeHtml(loc.mapUrl)}" target="_blank" class="btn btn-sm btn-outline-primary rounded-pill d-flex align-items-center">
                            <i class="bi bi-cursor-fill me-1"></i> 導航
                        </a>
                        ${canEditOrDelete ? `
                            <div class="dropdown">
                                <button class="btn btn-sm btn-custom-light text-main-custom rounded-circle" type="button" data-bs-toggle="dropdown" aria-expanded="false" style="width: 30px; height: 30px; padding: 0;">
                                    <i class="bi bi-three-dots-vertical"></i>
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0" style="border-radius: 12px;">
                                    <li><button class="dropdown-item edit-location-btn" data-id="${loc.id}"><i class="bi bi-pencil me-2 text-muted"></i>編輯</button></li>
                                    <li><button class="dropdown-item text-danger delete-location-btn" data-id="${loc.id}"><i class="bi bi-trash me-2"></i>刪除</button></li>
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });

        groupHtml += `
                </div>
            </div>
        `;
        return groupHtml;
    };

    html += renderGroup('北部', grouped['北部']);
    html += renderGroup('中部', grouped['中部']);
    html += renderGroup('南部', grouped['南部']);
    html += renderGroup('東部', grouped['東部']);
    html += renderGroup('外島', grouped['外島']);

    if (others.length > 0) {
        html += renderGroup('其他', others);
    }

    locationsContainer.innerHTML = html;

    // Attach events
    document.querySelectorAll('.edit-location-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const loc = locations.find(l => l.id === id);
            if (loc) {
                document.getElementById('locationModalTitle').textContent = '編輯陣地';
                locIdInput.value = loc.id;
                locRegionInput.value = loc.region;
                locNameInput.value = loc.name;
                locUrlInput.value = loc.mapUrl;
                locationModal.show();
            }
        });
    });

    document.querySelectorAll('.delete-location-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            locationToDeleteId = e.currentTarget.getAttribute('data-id');
            deleteLocationConfirmModal.show();
        });
    });
}

// Ensure add button clears form
document.getElementById('addLocationBtn').addEventListener('click', () => {
    document.getElementById('locationModalTitle').textContent = '新增陣地';
    locationForm.reset();
    locIdInput.value = '';
});

saveLocationBtn.addEventListener('click', async () => {
    if (!locationForm.checkValidity()) {
        locationForm.reportValidity();
        return;
    }

    const locId = locIdInput.value;
    const region = locRegionInput.value;
    const name = locNameInput.value.trim();
    const mapUrl = locUrlInput.value.trim();

    if (!currentUser) {
        alert("請先登入");
        return;
    }

    saveLocationBtn.disabled = true;
    saveLocationSpinner.classList.remove('d-none');

    try {
        const locationData = {
            region,
            name,
            mapUrl,
            updatedAt: (currentUser && currentUser.isGuest) ? new Date().toISOString() : serverTimestamp()
        };

        if (currentUser && currentUser.isGuest) {
            let localData = JSON.parse(localStorage.getItem('guest_locations') || '[]');
            if (locId) {
                // Update
                const index = localData.findIndex(l => l.id === locId);
                if (index !== -1) {
                    localData[index] = { ...localData[index], ...locationData };
                }
            } else {
                // Add
                locationData.id = Date.now().toString();
                locationData.userId = 'guest_user';
                locationData.createdAt = new Date().toISOString();
                localData.unshift(locationData);
            }
            localStorage.setItem('guest_locations', JSON.stringify(localData));
            loadLocations();
        } else {
            if (locId) {
                // Update
                const locRef = doc(db, "locations", locId);
                await withTimeout(updateDoc(locRef, locationData), 15000, '更新陣地逾時');
            } else {
                // Add
                locationData.userId = currentUser.uid;
                locationData.createdAt = serverTimestamp();
                await withTimeout(addDoc(collection(db, "locations"), locationData), 15000, '新增陣地逾時');
            }
        }
        locationModal.hide();
    } catch (error) {
        console.error("Error saving location:", error);
        alert("儲存陣地失敗: " + error.message);
    } finally {
        saveLocationBtn.disabled = false;
        saveLocationSpinner.classList.add('d-none');
    }
});

confirmDeleteLocationBtn.addEventListener('click', async () => {
    if (!locationToDeleteId) return;

    confirmDeleteLocationBtn.disabled = true;
    deleteLocationSpinner.classList.remove('d-none');

    try {
        if (currentUser && currentUser.isGuest) {
            let localData = JSON.parse(localStorage.getItem('guest_locations') || '[]');
            localData = localData.filter(l => l.id !== locationToDeleteId);
            localStorage.setItem('guest_locations', JSON.stringify(localData));
            loadLocations();
        } else {
            await withTimeout(deleteDoc(doc(db, "locations", locationToDeleteId)), 15000, '刪除陣地逾時');
        }
        deleteLocationConfirmModal.hide();
        locationToDeleteId = null;
    } catch (error) {
        console.error("Error deleting location:", error);
        alert("刪除失敗: " + error.message);
    } finally {
        confirmDeleteLocationBtn.disabled = false;
        deleteLocationSpinner.classList.add('d-none');
    }
});
