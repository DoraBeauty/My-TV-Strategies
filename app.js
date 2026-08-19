import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
    getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
    getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, getDocs, setDoc, getDoc
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

// Helper to get complete transport cost for display/stats
function getCompleteTransportCost(record) {
    let cost = parseFloat(record.transportCost) || 0;
    if (record.transportCostIncludesTickets) {
        return cost;
    }
    // Backward compatibility for old records
    if (record.tickets) {
        if (record.tickets.hsr) {
            cost += parseFloat(record.tickets.hsr.go?.amount) || 0;
            cost += parseFloat(record.tickets.hsr.return?.amount) || 0;
        }
        if (record.tickets.bus) {
            cost += parseFloat(record.tickets.bus.go?.amount) || 0;
            cost += parseFloat(record.tickets.bus.return?.amount) || 0;
        }
    }
    return cost;
}

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

// HSR / Bus Form Elements
const hsrRadio = document.getElementById('hsrRadio');
const hsrSection = document.getElementById('hsrSection');
const hsrGoPrice = document.getElementById('hsrGoPrice');
const hsrReturnPrice = document.getElementById('hsrReturnPrice');

const busRadio = document.getElementById('busRadio');
const busSection = document.getElementById('busSection');
const busGoPrice = document.getElementById('busGoPrice');
const busReturnPrice = document.getElementById('busReturnPrice');

const recordNote = document.getElementById('recordNote');
const publicTransportSection = document.getElementById('publicTransportSection');
const clearPublicTransitBtn = document.getElementById('clearPublicTransitBtn');


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
            db, storage, collection, addDoc, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, ref, uploadBytes, getDownloadURL, getDocs, deleteObject, setDoc, getDoc, currentUser
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

// Helper to create companion input wrapper
const createCompanionInput = (value = '', index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'd-flex align-items-center mb-2 companion-wrapper';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'ios-input companion-input flex-grow-1';
    input.placeholder = `人員`;
    if (value) input.value = value;
    input.addEventListener('input', updateDriverOptions);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn-link text-danger p-0 ms-2';
    deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
    deleteBtn.addEventListener('click', () => {
        wrapper.remove();
        updateDriverOptions();
    });

    wrapper.appendChild(input);
    wrapper.appendChild(deleteBtn);
    return wrapper;
};

// Add Companion Button
addCompanionBtn.addEventListener('click', () => {
    const num = companionsContainer.querySelectorAll('.companion-input').length + 1;
    companionsContainer.appendChild(createCompanionInput('', num));
});

const updateDriverOptions = () => {
    const type = transportTypeSelect.value;

    // Reset and hide everything first
    driverSection.classList.remove('show');
    mileageSection.classList.remove('show');
    publicTransportSection.classList.remove('show');

    if (type === 'none') {
        // Clear public transport selection
        radioLastChecked = null;
        hsrRadio.checked = false;
        busRadio.checked = false;
        hsrRadio.dispatchEvent(new Event('change'));
        busRadio.dispatchEvent(new Event('change'));
        clearPublicTransitBtn.style.display = 'none';

        // Clear driver/mileage
        driverSelect.value = 'self';
        mileageInput.value = '';

        return;
    } else if (type === 'public') {
        publicTransportSection.classList.add('show');

        // Clear driver/mileage
        driverSelect.value = 'self';
        mileageInput.value = '';
        return;
    } else if (type === 'car' || type === 'motorcycle') {
        // Clear public transport selection
        radioLastChecked = null;
        hsrRadio.checked = false;
        busRadio.checked = false;
        hsrRadio.dispatchEvent(new Event('change'));
        busRadio.dispatchEvent(new Event('change'));
        clearPublicTransitBtn.style.display = 'none';

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
    }
};

transportTypeSelect.addEventListener('change', updateDriverOptions);

// Make radios deselectable
let radioLastChecked = null;
const handlePublicTransitChange = () => {
    clearPublicTransitBtn.style.display = (hsrRadio.checked || busRadio.checked) ? 'inline-block' : 'none';

    if (hsrRadio.checked) {
        hsrSection.classList.add('show');
    } else {
        hsrSection.classList.remove('show');
        hsrGoPrice.value = '';
        hsrReturnPrice.value = '';
        ['hsrGoThumb', 'hsrReturnThumb'].forEach(id => {
            const el = document.getElementById(id);
            if(el) { el.innerHTML = ''; el.dataset.url = ''; el.dataset.path = ''; }
        });
        document.querySelectorAll('.hsr-go-file, .hsr-return-file').forEach(el => el.value = '');
    }

    if (busRadio.checked) {
        busSection.classList.add('show');
    } else {
        busSection.classList.remove('show');
        busGoPrice.value = '';
        busReturnPrice.value = '';
        ['busGoThumb', 'busReturnThumb'].forEach(id => {
            const el = document.getElementById(id);
            if(el) { el.innerHTML = ''; el.dataset.url = ''; el.dataset.path = ''; }
        });
        document.querySelectorAll('.bus-go-file, .bus-return-file').forEach(el => el.value = '');
    }

    calculateTotal();
};

hsrRadio.addEventListener('change', handlePublicTransitChange);
busRadio.addEventListener('change', handlePublicTransitChange);

clearPublicTransitBtn.addEventListener('click', () => {
    hsrRadio.checked = false;
    busRadio.checked = false;
    handlePublicTransitChange();
});





[hsrGoPrice, hsrReturnPrice, busGoPrice, busReturnPrice].forEach(input => {
    if (input) input.addEventListener('input', calculateTotal);
});


// Initialize default companion inputs on load
document.addEventListener('DOMContentLoaded', () => {
    // We already do this on modal open, but for initial state if modal is already open/in HTML:
    if(companionsContainer.children.length === 0) {
        for(let i=1; i<=3; i++) {
            companionsContainer.appendChild(createCompanionInput('', i));
        }
    }
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

        // Let calculateTotal handle the text updates so it's always consistent
        calculateTotal();
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
        <button type="button" class="delete-receipt-btn"><i class="bi bi-trash"></i></button>
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

function getRouteFees() {
    const price = userSettings.pricePerKm || 3;
    const hsrKm = userSettings.hsrKm || 0;
    const busKm = userSettings.busKm || 0;
    return {
        hsr: { km: hsrKm, roundTripKm: hsrKm * 2, fee: Math.round(hsrKm * 2 * price) },
        bus: { km: busKm, roundTripKm: busKm * 2, fee: Math.round(busKm * 2 * price) }
    };
}

function calculateTotal() {
    const allowance = parseFloat(allowanceInput.value) || 0;

    let transportCost = 0;
    const type = transportTypeSelect.value;
    if ((type === 'car' || type === 'motorcycle') && driverSelect.value === 'self') {
        const mileage = parseFloat(mileageInput.value) || 0;
        const rate = parseFloat(mileageInput.dataset.rate) || 0;
        const cost = (mileage * rate) || 0;
        transportCost += cost;

        // Update UI dynamically to show the user the calculated amount
        const typeStr = type === 'car' ? '汽車' : '機車';
        if (mileage > 0) {
            mileageRateHint.innerHTML = `${typeStr}：每公里補助 $${rate}<br><span class="text-primary fw-bold">總計費：${mileage}km × $${rate} = $${cost}</span>`;
        } else {
            mileageRateHint.innerHTML = `${typeStr}：每公里補助 $${rate}`;
        }
    }

    let notesArr = [];

    const routeFees = getRouteFees();

    if (hsrRadio.checked) {
        transportCost += parseFloat(hsrGoPrice.value) || 0;
        transportCost += parseFloat(hsrReturnPrice.value) || 0;
        transportCost += (routeFees.hsr.fee || 0);
        notesArr.push(`已含高鐵路程費 $${routeFees.hsr.fee}（來回${routeFees.hsr.roundTripKm}km）`);
    } else if (busRadio.checked) {
        transportCost += parseFloat(busGoPrice.value) || 0;
        transportCost += parseFloat(busReturnPrice.value) || 0;
        transportCost += (routeFees.bus.fee || 0);
        notesArr.push(`已含客運路程費 $${routeFees.bus.fee}（來回${routeFees.bus.roundTripKm}km）`);
    }

    if (notesArr.length > 0) {
        recordNote.value = notesArr.join('\n');
    } else {
        recordNote.value = "無自動路程費";
    }

    let receiptTotal = 0;
    document.querySelectorAll('.receipt-price').forEach(input => {
        receiptTotal += parseFloat(input.value) || 0;
    });

    const total = allowance + transportCost + receiptTotal;
    totalAmountInput.value = Math.round(total) || 0;
    totalAmountDisplay.textContent = Math.round(total) || 0;
}


// --- CRUD Operations ---
let bootstrapModalInstance = null;
document.addEventListener('DOMContentLoaded', () => {
    const modalEl = document.getElementById('recordModal');
    if (modalEl) {
        bootstrapModalInstance = new bootstrap.Modal(modalEl);

        // Reset form on open if no ID (Create Mode)
        modalEl.addEventListener('show.bs.modal', (e) => {
            // Only reset if opened specifically by the FAB button.
            const isFab = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.fab');
            if (!isFab) return;

            // Reset override flag and hint on open
            delete allowanceInput.dataset.manualOverride;
            timeCalcHint.innerHTML = '';

            // Reset the form for new record
            form.reset();
            recordIdInput.value = '';
            modalTitle.textContent = '新增紀錄';
            receiptsContainer.innerHTML = '';

            // Set default start/end times
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');

            // Construct strings for today at 07:00 and 18:00
            const defaultStart = `${yyyy}-${mm}-${dd}T07:00`;
            const defaultEnd = `${yyyy}-${mm}-${dd}T18:00`;

            document.getElementById('startTime').value = defaultStart;
            document.getElementById('endTime').value = defaultEnd;

            // Clear and add default 3 empty companion inputs
            companionsContainer.innerHTML = '';
            for(let i=1; i<=3; i++) {
                companionsContainer.appendChild(createCompanionInput('', i));
            }

            // Reset transport UI explicitly
            transportTypeSelect.value = 'none';
            updateDriverOptions();

            totalAmountDisplay.textContent = '0';
            timeCalcHint.textContent = '請輸入起訖時間計算雜費';

            // Trigger time inputs to calculate allowance and total
            startTimeInput.dispatchEvent(new Event('input'));
            endTimeInput.dispatchEvent(new Event('input'));
        });
    }
});


saveRecordBtn.addEventListener('click', async () => {
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    if (transportTypeSelect.value === 'public' && !hsrRadio.checked && !busRadio.checked) {
        alert('請選擇高鐵或客運');
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
        const allowanceVal = parseInt(allowanceInput.value) || 0;
        const leaderVal = document.getElementById('leader').value.trim();
        const companions = getCompanionsList().join(', '); // Join array into string for saving
        const transportTypeVal = transportTypeSelect.value;
        const driver = driverSelect.value;

        let mileageVal = null;
        let transportCostVal = 0;

        if ((transportTypeVal === 'car' || transportTypeVal === 'motorcycle') && driver === 'self') {
            mileageVal = parseFloat(mileageInput.value) || 0;
            const rate = parseFloat(mileageInput.dataset.rate) || 0;
            transportCostVal = Math.round(mileageVal * rate) || 0;
        }

        // Helper for file upload
        const uploadFileIfPresent = async (fileInput, oldPath, oldUrl) => {
            if (fileInput && fileInput.files.length > 0) {
                const file = fileInput.files[0];
                const filename = `receipts/${currentUser.uid}/${Date.now()}_${file.name}`;
                const storageRef = ref(storage, filename);
                await withTimeout(uploadBytes(storageRef, file), 15000, '圖片上傳逾時，請檢查網路狀態或 Firebase Storage 規則');
                const url = await getDownloadURL(storageRef);
                return { path: filename, url: url };
            }
            return { path: oldPath || null, url: oldUrl || null };
        };

        // Process Receipts
        const receipts = [];
        const receiptEls = document.querySelectorAll('#receiptsContainer .receipt-item');
        for (const el of receiptEls) {
            const name = el.querySelector('.receipt-name').value;
            const price = parseFloat(el.querySelector('.receipt-price').value) || 0;
            const fileInput = el.querySelector('.receipt-file');
            let oldPath = el.querySelector('.receipt-old-path') ? el.querySelector('.receipt-old-path').value : null;
            let oldUrl = el.querySelector('.receipt-old-url') ? el.querySelector('.receipt-old-url').value : null;

            const uploaded = await uploadFileIfPresent(fileInput, oldPath, oldUrl);
            receipts.push({ name, price, path: uploaded.path, url: uploaded.url });
        }

        // Process HSR/Bus Tickets
        let transportTypes = [];
        if (hsrRadio.checked) transportTypes.push('hsr');
        if (busRadio.checked) transportTypes.push('bus');

        const currentRouteFees = getRouteFees();

        let tickets = {
            hsr: null,
            bus: null
        };

        if (hsrRadio.checked || hsrGoPrice.value !== '' || hsrReturnPrice.value !== '' || document.getElementById('hsrGoThumb').dataset.url || document.getElementById('hsrReturnThumb').dataset.url) {
            tickets.hsr = {
                go: { amount: hsrGoPrice.value !== '' ? parseFloat(hsrGoPrice.value) : null, imageUrl: document.getElementById('hsrGoThumb').dataset.url || null, imagePath: document.getElementById('hsrGoThumb').dataset.path || null },
                return: { amount: hsrReturnPrice.value !== '' ? parseFloat(hsrReturnPrice.value) : null, imageUrl: document.getElementById('hsrReturnThumb').dataset.url || null, imagePath: document.getElementById('hsrReturnThumb').dataset.path || null },
                routeFee: currentRouteFees.hsr.fee,
                routeKmRoundTrip: currentRouteFees.hsr.roundTripKm
            };
        }

        if (busRadio.checked || busGoPrice.value !== '' || busReturnPrice.value !== '' || document.getElementById('busGoThumb').dataset.url || document.getElementById('busReturnThumb').dataset.url) {
            tickets.bus = {
                go: { amount: busGoPrice.value !== '' ? parseFloat(busGoPrice.value) : null, imageUrl: document.getElementById('busGoThumb').dataset.url || null, imagePath: document.getElementById('busGoThumb').dataset.path || null },
                return: { amount: busReturnPrice.value !== '' ? parseFloat(busReturnPrice.value) : null, imageUrl: document.getElementById('busReturnThumb').dataset.url || null, imagePath: document.getElementById('busReturnThumb').dataset.path || null },
                routeFee: currentRouteFees.bus.fee,
                routeKmRoundTrip: currentRouteFees.bus.roundTripKm
            };
        }

        if (tickets.hsr) {
            const hsrGoUploaded = await uploadFileIfPresent(document.querySelector('.hsr-go-file'), tickets.hsr.go.imagePath, tickets.hsr.go.imageUrl);
            tickets.hsr.go.imageUrl = hsrGoUploaded.url; tickets.hsr.go.imagePath = hsrGoUploaded.path;

            const hsrReturnUploaded = await uploadFileIfPresent(document.querySelector('.hsr-return-file'), tickets.hsr.return.imagePath, tickets.hsr.return.imageUrl);
            tickets.hsr.return.imageUrl = hsrReturnUploaded.url; tickets.hsr.return.imagePath = hsrReturnUploaded.path;

            if (hsrRadio.checked) {
                transportCostVal += (tickets.hsr.routeFee || 0);
                transportCostVal += parseFloat(tickets.hsr.go.amount) || 0;
                transportCostVal += parseFloat(tickets.hsr.return.amount) || 0;
            }
        }

        if (tickets.bus) {
            const busGoUploaded = await uploadFileIfPresent(document.querySelector('.bus-go-file'), tickets.bus.go.imagePath, tickets.bus.go.imageUrl);
            tickets.bus.go.imageUrl = busGoUploaded.url; tickets.bus.go.imagePath = busGoUploaded.path;

            const busReturnUploaded = await uploadFileIfPresent(document.querySelector('.bus-return-file'), tickets.bus.return.imagePath, tickets.bus.return.imageUrl);
            tickets.bus.return.imageUrl = busReturnUploaded.url; tickets.bus.return.imagePath = busReturnUploaded.path;

            if (busRadio.checked) {
                transportCostVal += (tickets.bus.routeFee || 0);
                transportCostVal += parseFloat(tickets.bus.go.amount) || 0;
                transportCostVal += parseFloat(tickets.bus.return.amount) || 0;
            }
        }

        const totalVal = parseInt(totalAmountInput.value) || 0;

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
            transportCostIncludesTickets: true,
            receipts,
            totalAmount: totalVal,
            transportTypes,
            tickets,
            note: recordNote.value
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

    let totalTransportDisplay = getCompleteTransportCost(record);

    let detailsHtml = '';
    if (record.leader) {
        detailsHtml += `<div class="text-muted small">帶隊官：${escapeHtml(record.leader)}</div>`;
    }

    if (record.companions) {
        let companionsArr = [];
        if (Array.isArray(record.companions)) {
            companionsArr = record.companions.filter(Boolean);
        } else if (typeof record.companions === 'string' && record.companions.trim() !== '') {
            companionsArr = record.companions.split(',').map(s => s.trim()).filter(Boolean);
        }

        if (companionsArr.length > 0) {
            detailsHtml += `<div class="text-muted small">同行人員：${escapeHtml(companionsArr.join(', '))}</div>`;
        }
    }

    if (record.transportType === 'car' || record.transportType === 'motorcycle') {
        detailsHtml += `<div class="text-muted small">駕駛：${escapeHtml(record.driver === 'self' ? '自己' : record.driver)} (里程: ${record.mileage || 0}km)</div>`;
    }
    if (record.note && record.note !== "無自動路程費") {
        const notes = record.note.split('\n');
        notes.forEach(n => {
            detailsHtml += `<div class="text-muted small">${escapeHtml(n)}</div>`;
        });
    }

    // Aggregate public transport types for display label
    let publicTransportStr = [];
    if (record.transportTypes) {
        if (record.transportTypes.includes('hsr')) publicTransportStr.push('高鐵');
        if (record.transportTypes.includes('bus')) publicTransportStr.push('客運');
    } else if (record.transportType === 'public') {
        publicTransportStr.push('大眾/其他'); // Legacy fallback
    }
    const ptLabel = publicTransportStr.length > 0 ? publicTransportStr.join('/') : '';
    const mainTypeLabel = typeMap[record.transportType] || '';

    // Combine labels
    let comboLabel = [mainTypeLabel, ptLabel].filter(Boolean).join(' + ');
    if (!comboLabel) comboLabel = '無';


    let receiptsHtml = '';

    let allReceipts = [];
    if (record.receipts && record.receipts.length > 0) {
        allReceipts = [...record.receipts];
    }

    if (record.tickets) {
        if (record.tickets.hsr) {
            if (record.tickets.hsr.go.amount > 0 || record.tickets.hsr.go.imageUrl) allReceipts.push({ name: '高鐵去程', price: record.tickets.hsr.go.amount, url: record.tickets.hsr.go.imageUrl });
            if (record.tickets.hsr.return.amount > 0 || record.tickets.hsr.return.imageUrl) allReceipts.push({ name: '高鐵回程', price: record.tickets.hsr.return.amount, url: record.tickets.hsr.return.imageUrl });
        }
        if (record.tickets.bus) {
            if (record.tickets.bus.go.amount > 0 || record.tickets.bus.go.imageUrl) allReceipts.push({ name: '客運去程', price: record.tickets.bus.go.amount, url: record.tickets.bus.go.imageUrl });
            if (record.tickets.bus.return.amount > 0 || record.tickets.bus.return.imageUrl) allReceipts.push({ name: '客運回程', price: record.tickets.bus.return.amount, url: record.tickets.bus.return.imageUrl });
        }
    }

    if (allReceipts.length > 0) {
        receiptsHtml += `<div class="mt-2 pt-2 border-top" style="border-color: var(--border-color) !important;">`;
        allReceipts.forEach(r => {
            if (r.url) {
                receiptsHtml += `<div class="d-flex justify-content-between text-muted small">
                    <span><a href="${r.url}" target="_blank" class="text-decoration-none"><i class="bi bi-file-earmark-image me-1"></i>${escapeHtml(r.name)}</a></span>
                    <span>$${r.price}</span>
                </div>`;
            } else {
                receiptsHtml += `<div class="d-flex justify-content-between text-muted small">
                    <span>${escapeHtml(r.name)}</span>
                    <span>$${r.price}</span>
                </div>`;
            }
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
                    <span>交通費 (${comboLabel})</span><span>$${totalTransportDisplay}</span>
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
    let companionsList = [];
    if (Array.isArray(record.companions)) {
        companionsList = record.companions;
    } else if (typeof record.companions === 'string' && record.companions.trim() !== '') {
        companionsList = record.companions.split(',').map(s => s.trim());
    }
    // Ensure at least 3 inputs are shown initially, like a fresh form
    const totalInputs = Math.max(3, companionsList.length);
    for(let i=0; i<totalInputs; i++) {
        companionsContainer.appendChild(createCompanionInput(companionsList[i] || '', i + 1));
    }

    transportTypeSelect.value = record.transportType || '';
    updateDriverOptions();

    if (record.driver) driverSelect.value = record.driver;
    handleDriverChange();

    if (record.mileage !== null) mileageInput.value = record.mileage;

    // Handle public transit selections & tickets without triggering event listeners that clear them
    let transportTypes = record.transportTypes || [];

    // Legacy fallback inference if transportTypes is empty but tickets exist
    if (transportTypes.length === 0 && record.tickets) {
        if (record.tickets.hsr && ((record.tickets.hsr.go && (record.tickets.hsr.go.amount !== undefined && record.tickets.hsr.go.amount !== null || record.tickets.hsr.go.imageUrl)) || (record.tickets.hsr.return && (record.tickets.hsr.return.amount !== undefined && record.tickets.hsr.return.amount !== null || record.tickets.hsr.return.imageUrl)))) {
            transportTypes.push('hsr');
        }
        if (record.tickets.bus && ((record.tickets.bus.go && (record.tickets.bus.go.amount !== undefined && record.tickets.bus.go.amount !== null || record.tickets.bus.go.imageUrl)) || (record.tickets.bus.return && (record.tickets.bus.return.amount !== undefined && record.tickets.bus.return.amount !== null || record.tickets.bus.return.imageUrl)))) {
            transportTypes.push('bus');
        }
    }

    // Set checkboxes and show sections manually
    hsrRadio.checked = transportTypes.includes('hsr');
    busRadio.checked = transportTypes.includes('bus');

    if (hsrRadio.checked) hsrSection.classList.add('show');
    else hsrSection.classList.remove('show');

    if (busRadio.checked) busSection.classList.add('show');
    else busSection.classList.remove('show');

    clearPublicTransitBtn.style.display = (hsrRadio.checked || busRadio.checked) ? 'inline-block' : 'none';

    // Helper to setup ticket UI
    const setupTicketUI = (ticketData, priceInputId, thumbContainerId) => {
        const priceInput = document.getElementById(priceInputId);
        const thumbContainer = document.getElementById(thumbContainerId);

        if (ticketData) {
            if (ticketData.amount !== undefined && ticketData.amount !== null && String(ticketData.amount).trim() !== '') {
                priceInput.value = ticketData.amount;
            } else {
                priceInput.value = '';
            }

            if (ticketData.imageUrl) {
                thumbContainer.innerHTML = `<img src="${ticketData.imageUrl}" class="img-thumbnail mt-2" style="max-height: 100px;">`;
                thumbContainer.dataset.url = ticketData.imageUrl;
                thumbContainer.dataset.path = ticketData.imagePath || '';
            } else if (ticketData.amount > 0 && ticketData.imagePath === null) {
                // If there's an amount and the imagePath is explicitly null (likely cleaned up)
                thumbContainer.innerHTML = `<span class="badge bg-secondary mt-2">圖片已清除</span>`;
                thumbContainer.dataset.url = '';
                thumbContainer.dataset.path = '';
            } else {
                thumbContainer.innerHTML = '';
                thumbContainer.dataset.url = '';
                thumbContainer.dataset.path = '';
            }
        } else {
            priceInput.value = '';
            thumbContainer.innerHTML = '';
            thumbContainer.dataset.url = '';
            thumbContainer.dataset.path = '';
        }
    };

    if (record.tickets) {
        if (record.tickets.hsr) {
            setupTicketUI(record.tickets.hsr.go, 'hsrGoPrice', 'hsrGoThumb');
            setupTicketUI(record.tickets.hsr.return, 'hsrReturnPrice', 'hsrReturnThumb');
        } else {
            setupTicketUI(null, 'hsrGoPrice', 'hsrGoThumb');
            setupTicketUI(null, 'hsrReturnPrice', 'hsrReturnThumb');
        }
        if (record.tickets.bus) {
            setupTicketUI(record.tickets.bus.go, 'busGoPrice', 'busGoThumb');
            setupTicketUI(record.tickets.bus.return, 'busReturnPrice', 'busReturnThumb');
        } else {
            setupTicketUI(null, 'busGoPrice', 'busGoThumb');
            setupTicketUI(null, 'busReturnPrice', 'busReturnThumb');
        }
    } else {
        setupTicketUI(null, 'hsrGoPrice', 'hsrGoThumb');
        setupTicketUI(null, 'hsrReturnPrice', 'hsrReturnThumb');
        setupTicketUI(null, 'busGoPrice', 'busGoThumb');
        setupTicketUI(null, 'busReturnPrice', 'busReturnThumb');
    }

    calculateTotal();

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
        if (record.isSettled && record.settledAt) {
            const diffDays = Math.ceil(Math.abs(now - new Date(record.settledAt)) / (1000 * 60 * 60 * 24));
            if (diffDays > 30) {
                let updatedReceipts = false;
                let updatedTickets = false;

                // Cleanup Receipts
                if (record.receipts) {
                    const newReceipts = [...record.receipts];
                    for (let i = 0; i < newReceipts.length; i++) {
                        const r = newReceipts[i];
                        if (r.path && r.url) {
                            try {
                                await deleteObject(ref(storage, r.path));
                                newReceipts[i].path = null;
                                newReceipts[i].url = null;
                                updatedReceipts = true;
                            } catch (e) {
                                console.error('Failed to delete receipt image', e);
                            }
                        }
                    }
                    if (updatedReceipts) {
                        await updateDoc(doc(db, 'records', record.id), { receipts: newReceipts });
                    }
                }

                // Cleanup Tickets
                if (record.tickets) {
                    const newTickets = JSON.parse(JSON.stringify(record.tickets)); // Deep clone
                    const checkAndDeleteTicketImage = async (ticketNode) => {
                        if (ticketNode && ticketNode.imagePath) {
                            try {
                                await deleteObject(ref(storage, ticketNode.imagePath));
                                ticketNode.imagePath = null;
                                ticketNode.imageUrl = null;
                                updatedTickets = true;
                            } catch (e) {
                                console.error('Failed to delete ticket image', e);
                            }
                        }
                    };

                    if (newTickets.hsr) {
                        await checkAndDeleteTicketImage(newTickets.hsr.go);
                        await checkAndDeleteTicketImage(newTickets.hsr.return);
                    }
                    if (newTickets.bus) {
                        await checkAndDeleteTicketImage(newTickets.bus.go);
                        await checkAndDeleteTicketImage(newTickets.bus.return);
                    }

                    if (updatedTickets) {
                        await updateDoc(doc(db, 'records', record.id), { tickets: newTickets });
                    }
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
            getCompleteTransportCost(r),
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

        let transport = getCompleteTransportCost(record);
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
        // Group by month
        const groups = {};
        // Sort descending by start time so newest is first
        results.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

        results.forEach(r => {
            const date = new Date(r.startTime);
            const monthKey = `${date.getFullYear()}年 ${String(date.getMonth() + 1).padStart(2, '0')}月`;
            if (!groups[monthKey]) groups[monthKey] = [];
            groups[monthKey].push(r);
        });

        const accordionId = 'recordsAccordion';
        let html = `<div class="accordion w-100" id="${accordionId}">`;

        // Ensure month keys are sorted descending as well
        const sortedMonths = Object.keys(groups).sort((a, b) => {
            // Replace strings to get format like 202305 to sort numerically
            const aNum = parseInt(a.replace('年 ', '').replace('月', ''));
            const bNum = parseInt(b.replace('年 ', '').replace('月', ''));
            return bNum - aNum;
        });

        // They should all be collapsed by default according to the new request
        sortedMonths.forEach((month, index) => {
            // Need a valid ID for Bootstrap collapse without spaces
            const collapseId = `collapseMonth_${index}`;
            const headerId = `headingMonth_${index}`;

            html += `
            <div class="accordion-item bg-transparent border-0 mb-3">
                <h2 class="accordion-header" id="${headerId}">
                    <button class="accordion-button collapsed bg-custom-light text-main-custom fw-bold rounded-4 shadow-sm" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}" style="border: none;">
                        <i class="bi bi-calendar-check me-2 text-primary"></i> ${month} <span class="badge bg-primary rounded-pill ms-2">${groups[month].length}</span>
                    </button>
                </h2>
                <div id="${collapseId}" class="accordion-collapse collapse" aria-labelledby="${headerId}">
                    <div class="accordion-body px-0 py-3">
                        <div class="row g-3" id="groupContainer_${index}"></div>
                    </div>
                </div>
            </div>`;
        });
        html += `</div>`;
        recordsContainer.innerHTML = html;

        // Now append cards to their respective containers
        sortedMonths.forEach((month, index) => {
            const container = document.getElementById(`groupContainer_${index}`);
            groups[month].forEach(r => {
                renderRecordCard(r, container);
            });
        });
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
let currentLocations = [];
const locationSearchInput = document.getElementById('locationSearchInput');

function loadLocations() {
    if (unsubscribeLocations) {
        unsubscribeLocations();
    }

    // For guest mode
    if (currentUser && currentUser.isGuest) {
        currentLocations = JSON.parse(localStorage.getItem('guest_locations') || '[]');
        renderLocations();
        return;
    }

    if (!currentUser) return;

    try {
        const q = query(collection(db, "locations"));

        unsubscribeLocations = onSnapshot(q, (snapshot) => {
            currentLocations = [];
            snapshot.forEach((doc) => {
                currentLocations.push({ id: doc.id, ...doc.data() });
            });

            // Sort by createdAt descending client-side to avoid index requirement
            currentLocations.sort((a, b) => {
                const timeA = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate().getTime() : 0;
                const timeB = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate().getTime() : 0;
                return timeB - timeA;
            });

            renderLocations();
        }, (error) => {
            console.error("Error loading locations:", error);
            locationsContainer.innerHTML = `<div class="text-danger text-center">載入陣地資料失敗: ${error.message}</div>`;
        });
    } catch (e) {
        console.error("Setup locations listener failed", e);
    }
}

if (locationSearchInput) {
    locationSearchInput.addEventListener('input', () => {
        renderLocations();
    });
}

function renderLocations() {
    let locations = currentLocations;
    const keyword = locationSearchInput ? locationSearchInput.value.trim().toLowerCase() : '';

    if (keyword) {
        locations = locations.filter(loc => loc.name && loc.name.toLowerCase().includes(keyword));
    }
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

    const ADMIN_EMAIL = 'hephaestus161@gmail.com';
    const isUserAdmin = currentUser && currentUser.email === ADMIN_EMAIL;

    const addLocationBtn = document.getElementById('addLocationBtn');
    if (addLocationBtn) {
        if (isUserAdmin || (currentUser && currentUser.isGuest)) {
            addLocationBtn.style.display = 'inline-block';
        } else {
            addLocationBtn.style.display = 'none';
        }
    }

    const others = [];

    locations.forEach(loc => {
        if (grouped[loc.region]) {
            grouped[loc.region].push(loc);
        } else {
            others.push(loc);
        }
    });

    let html = '';

    const currentUserId = currentUser ? currentUser.uid : null;

    let regionIndex = 0;
    const renderGroup = (regionName, locs) => {
        if (locs.length === 0) return '';

        // Ensure a unique, HTML-safe ID for the collapse section
        const regionIdSafe = `collapseRegion_${regionIndex++}`;

        // If searching, auto-expand, otherwise default to collapsed
        const isExpanded = keyword !== '' ? 'true' : 'false';
        const collapseClass = keyword !== '' ? 'collapse show' : 'collapse';
        const buttonClass = keyword !== '' ? 'accordion-button bg-custom-light text-main-custom fw-bold rounded-4 shadow-sm' : 'accordion-button collapsed bg-custom-light text-main-custom fw-bold rounded-4 shadow-sm';

        let groupHtml = `
            <div class="accordion-item bg-transparent border-0 mb-3">
                <h2 class="accordion-header" id="heading_${regionIdSafe}">
                    <button class="${buttonClass}" type="button" data-bs-toggle="collapse" data-bs-target="#${regionIdSafe}" aria-expanded="${isExpanded}" aria-controls="${regionIdSafe}" style="border: none;">
                        <i class="bi bi-geo-alt text-primary me-2"></i>
                        <span class="fw-bold text-main-custom me-2">${escapeHtml(regionName)}</span>
                        <span class="badge bg-secondary rounded-pill">${locs.length}</span>
                    </button>
                </h2>
                <div id="${regionIdSafe}" class="accordion-collapse ${collapseClass}" aria-labelledby="heading_${regionIdSafe}">
                    <div class="accordion-body p-0 mt-2 rounded-4 shadow-sm bg-custom-card">
                        <div class="list-group list-group-flush rounded-4">
        `;

        locs.forEach(loc => {
            const canEditOrDelete = isUserAdmin || (currentUser && currentUser.isGuest);
            const isOwner = currentUserId ? loc.userId === currentUserId : false;

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
                </div>
            </div>
        `;
        return groupHtml;
    };

    html = `<div class="accordion" id="locationsAccordion">${renderGroup('北部', grouped['北部'])}`;
    html += renderGroup('中部', grouped['中部']);
    html += renderGroup('南部', grouped['南部']);
    html += renderGroup('東部', grouped['東部']);
    html += renderGroup('外島', grouped['外島']);

    if (others.length > 0) {
        html += renderGroup('其他', others);
    }

    html += `</div>`; // Close accordion wrapper

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


// --- Route Settings & Firestore Sync ---
const settingHsrKm = document.getElementById('settingHsrKm');
const settingHsrRoundTrip = document.getElementById('settingHsrRoundTrip');
const settingHsrFee = document.getElementById('settingHsrFee');
const settingBusKm = document.getElementById('settingBusKm');
const settingBusRoundTrip = document.getElementById('settingBusRoundTrip');
const settingBusFee = document.getElementById('settingBusFee');
const saveRouteSettingsBtn = document.getElementById('saveRouteSettingsBtn');
const routeSettingsForm = document.getElementById('routeSettingsForm');

let userSettings = {
    hsrKm: 20,
    busKm: 10,
    pricePerKm: 3
};

// Update local UI when inputs change
const updateSettingsUI = () => {
    if (!settingHsrKm || !settingBusKm) return;
    const hsrKm = parseFloat(settingHsrKm.value) || 0;
    settingHsrRoundTrip.textContent = (hsrKm * 2).toFixed(1).replace(/\.0$/, '');
    settingHsrFee.textContent = Math.round(hsrKm * 2 * userSettings.pricePerKm);

    const busKm = parseFloat(settingBusKm.value) || 0;
    settingBusRoundTrip.textContent = (busKm * 2).toFixed(1).replace(/\.0$/, '');
    settingBusFee.textContent = Math.round(busKm * 2 * userSettings.pricePerKm);
};

if (settingHsrKm) settingHsrKm.addEventListener('input', updateSettingsUI);
if (settingBusKm) settingBusKm.addEventListener('input', updateSettingsUI);

const loadSettings = async () => {
    // 1. Load from localStorage
    const localStr = localStorage.getItem('userSettings');
    if (localStr) {
        try {
            userSettings = { ...userSettings, ...JSON.parse(localStr) };
        } catch (e) { console.error('Failed to parse local settings'); }
    }

    // 2. Overwrite with Cloud Sync if logged in
    if (window.firebaseData && window.firebaseData.currentUser && !(currentUser && currentUser.isGuest)) {
        try {
            const { db, doc, getDoc } = window.firebaseData;
            const docSnap = await getDoc(doc(db, "userSettings", window.firebaseData.currentUser.uid));
            if (docSnap.exists()) {
                userSettings = { ...userSettings, ...docSnap.data() };
                localStorage.setItem('userSettings', JSON.stringify(userSettings)); // sync to local
            }
        } catch(error) {
            console.error("Error loading settings from Firestore:", error);
        }
    }

    if (settingHsrKm) settingHsrKm.value = userSettings.hsrKm;
    if (settingBusKm) settingBusKm.value = userSettings.busKm;
    updateSettingsUI();
};

if (saveRouteSettingsBtn) {
    saveRouteSettingsBtn.addEventListener('click', async () => {
        if (routeSettingsForm && !routeSettingsForm.checkValidity()) {
            routeSettingsForm.reportValidity();
            return;
        }

        const newSettings = {
            hsrKm: parseFloat(settingHsrKm.value) || 0,
            busKm: parseFloat(settingBusKm.value) || 0,
            pricePerKm: 3
        };

        // Save locally
        localStorage.setItem('userSettings', JSON.stringify(newSettings));
        userSettings = newSettings;

        alert('設定已更新！');

        // Sync to cloud
        if (window.firebaseData && window.firebaseData.currentUser && !(currentUser && currentUser.isGuest)) {
            try {
                const { db, doc, setDoc } = window.firebaseData;
                await setDoc(doc(db, "userSettings", window.firebaseData.currentUser.uid), newSettings, { merge: true });
                console.log("Settings synced to Firestore successfully.");
            } catch (error) {
                console.error("Error syncing settings to Firestore:", error);
                alert(`雲端同步失敗 (${error.code || 'unknown'}): ${error.message || '發生未知錯誤'}，但已儲存在本機`);
            }
        }

        const modalEl = document.getElementById('routeSettingsModal');
        if (modalEl) {
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
        }

        // Trigger updates if modal is open
        if (transportTypeSelect && transportTypeSelect.value === 'public') {
            handlePublicTransitChange();
        }
    });
}

// Hook into existing global auth state updates, or handle it via a global setup.
// We can just rely on the existing observer setting window.firebaseData.
const checkAuthAndLoad = () => {
    if ((currentUser && currentUser.isGuest) || (window.firebaseData && window.firebaseData.currentUser)) {
        loadSettings();
    } else {
        setTimeout(checkAuthAndLoad, 500); // Check again in 500ms
    }
};
checkAuthAndLoad();


// Load settings initially (for guest mode / before auth loads)
loadSettings();
