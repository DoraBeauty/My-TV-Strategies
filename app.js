import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
    getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
    getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, getDocs
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import {
    getStorage, ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
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
const unsettledTotalText = document.getElementById('unsettledTotalText');

// Calendar View Elements
const btnList = document.getElementById('btnList');
const btnCalendar = document.getElementById('btnCalendar');
const recordsContainer = document.getElementById('recordsContainer');
const calendarViewWrapper = document.getElementById('calendarViewWrapper');
let calendarInstance = null;

// Form Elements
const form = document.getElementById('recordForm');
const recordIdInput = document.getElementById('recordId');
const modalTitle = document.getElementById('modalTitle');
const saveRecordBtn = document.getElementById('saveRecordBtn');
const saveSpinner = document.getElementById('saveSpinner');

const startTimeInput = document.getElementById('startTime');
const endTimeInput = document.getElementById('endTime');
const allowanceInput = document.getElementById('allowance');
const allowanceDisplay = document.getElementById('allowanceDisplay');
const timeCalcHint = document.getElementById('timeCalcHint');

const companionsInput = document.getElementById('companions');
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

const startGuestMode = () => {
    currentUser = { uid: 'guest_user', isGuest: true };

    loginView.style.display = 'none';
    dashboardView.style.display = 'block';
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    exportBtn.style.display = 'inline-block';
    unsettledTotalText.style.display = 'inline-block';

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
        query: () => 'mock_query', where: () => null, orderBy: () => null,
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
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
        exportBtn.style.display = 'inline-block';
        unsettledTotalText.style.display = 'inline-block';

        window.firebaseData = {
            db, storage, collection, addDoc, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, ref, uploadBytes, getDownloadURL, getDocs, deleteObject, currentUser
        };

        window.dispatchEvent(new Event('authReady'));
    } else {
        currentUser = null;
        loginView.style.display = 'block';
        dashboardView.style.display = 'none';
        loginBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        exportBtn.style.display = 'none';
        unsettledTotalText.style.display = 'none';
    }
});


// --- View Toggle (List/Calendar) ---
btnList.addEventListener('change', () => {
    if (btnList.checked) {
        recordsContainer.style.display = 'flex';
        calendarViewWrapper.style.display = 'none';
    }
});

btnCalendar.addEventListener('change', () => {
    if (btnCalendar.checked) {
        recordsContainer.style.display = 'none';
        calendarViewWrapper.style.display = 'block';
        if (calendarInstance) calendarInstance.render();
    }
});


// --- Form Dynamic Logic ---

const calculateAllowance = () => {
    const start = startTimeInput.value;
    const end = endTimeInput.value;

    if (!start || !end) {
        allowanceInput.value = 0;
        allowanceDisplay.textContent = '0';
        timeCalcHint.textContent = "請先輸入起訖時間計算雜費";
        calculateTotal();
        return;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (endDate <= startDate) {
        allowanceInput.value = 0;
        allowanceDisplay.textContent = '0';
        timeCalcHint.textContent = "結束時間必須晚於開始時間";
        timeCalcHint.classList.add('text-danger');
        calculateTotal();
        return;
    }

    timeCalcHint.classList.remove('text-danger');
    const diffMs = endDate - startDate;
    const diffHours = diffMs / (1000 * 60 * 60);

    const allowance = diffHours >= 4 ? 400 : 200;
    allowanceInput.value = allowance;
    allowanceDisplay.textContent = allowance;
    timeCalcHint.textContent = `共計 ${diffHours.toFixed(1)} 小時，雜費自動帶入`;
    calculateTotal();
};
startTimeInput.addEventListener('change', calculateAllowance);
endTimeInput.addEventListener('change', calculateAllowance);

const updateDriverOptions = () => {
    const type = transportTypeSelect.value;
    if (type !== 'car' && type !== 'motorcycle') {
        driverSection.style.display = 'none';
        mileageSection.style.display = 'none';
        return;
    }

    driverSection.style.display = 'block';
    const compText = companionsInput.value.trim();
    const companions = compText ? compText.split(/[,，、]+/).map(s => s.trim()).filter(s => s) : [];

    // Save current selection to restore if possible
    const currentVal = driverSelect.value;
    driverSelect.innerHTML = '<option value="self">駕駛：自己 (計算里程費)</option>';

    companions.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = `駕駛：${c} (不計算里程費)`;
        driverSelect.appendChild(opt);
    });

    if (Array.from(driverSelect.options).some(o => o.value === currentVal)) {
        driverSelect.value = currentVal;
    }
    handleDriverChange();
};
companionsInput.addEventListener('input', updateDriverOptions);
transportTypeSelect.addEventListener('change', updateDriverOptions);


const handleDriverChange = () => {
    const type = transportTypeSelect.value;
    if (type !== 'car' && type !== 'motorcycle') return;

    if (driverSelect.value === 'self') {
        mileageSection.style.display = 'block';
        if (type === 'car') {
            mileageRateHint.textContent = "x $3";
            mileageInput.dataset.rate = "3";
        } else {
            mileageRateHint.textContent = "x $2";
            mileageInput.dataset.rate = "2";
        }
    } else {
        // Someone else is driving, no mileage for self
        mileageSection.style.display = 'none';
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
    el.className = 'ios-form-group mb-3 position-relative';
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
        <button type="button" class="btn-close delete-receipt-btn" aria-label="Close" style="position: absolute; right: 10px; top: 10px; z-index: 5; font-size: 0.8rem;"></button>
        <div class="p-2 border-bottom">
            <input type="text" class="form-control form-control-sm border-0 fw-bold receipt-name" placeholder="發票項目名稱 (例如：高鐵去程, 住宿)" value="${data ? data.name : ''}" required>
        </div>
        <div class="d-flex p-2 border-bottom align-items-center">
            <span class="text-muted small me-2">$</span>
            <input type="number" class="form-control form-control-sm border-0 receipt-price" placeholder="金額" min="0" value="${data ? data.price : ''}" required>
        </div>
        <div class="p-2 bg-light">
            <input type="file" class="form-control form-control-sm receipt-file" accept="image/*">
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
            if (!e.relatedTarget || !e.relatedTarget.closest) return;
            const btn = e.relatedTarget.closest('.fab');
            if (btn) {
                form.reset();
                recordIdInput.value = '';
                modalTitle.textContent = '新增紀錄';
                receiptsContainer.innerHTML = '';
                allowanceDisplay.textContent = '0';
                totalAmountDisplay.textContent = '0';
                timeCalcHint.textContent = '請輸入起訖時間計算雜費';
                timeCalcHint.classList.remove('text-danger');
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

    const { db, storage, collection, doc, addDoc, updateDoc, serverTimestamp, ref, uploadBytes, getDownloadURL, currentUser } = window.firebaseData;

    try {
        saveRecordBtn.disabled = true;
        saveSpinner.classList.remove('d-none');

        const isEdit = !!recordIdInput.value;
        const tripName = document.getElementById('tripName').value;
        const location = document.getElementById('location').value;
        const visitingUnit = document.getElementById('visitingUnit').value;
        const startVal = startTimeInput.value;
        const endVal = endTimeInput.value;
        const allowanceVal = parseInt(allowanceInput.value);
        const companions = companionsInput.value;
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
        const receiptEls = document.querySelectorAll('#receiptsContainer .ios-form-group');
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
                await uploadBytes(storageRef, file);
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
            await updateDoc(docRef, recordData);
        } else {
            recordData.isSettled = false;
            recordData.settledAt = null;
            recordData.createdAt = serverTimestamp();
            await addDoc(collection(db, 'records'), recordData);
        }

        if (bootstrapModalInstance) bootstrapModalInstance.hide();

    } catch (error) {
        alert("儲存失敗：" + error.message);
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
            renderRecordCard(record);
        });

        unsettledTotalText.textContent = `未入帳：$${unsettledTotal}`;
        renderCalendar();
        await cleanupOldImages(currentRecords);
    });
});

const escapeHtml = (unsafe) => (unsafe || '').toString().replace(/[&<"'>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const renderRecordCard = (record) => {
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6 col-lg-4';

    const typeMap = { 'car': '自行開車', 'motorcycle': '自行騎車', 'public': '大眾/其他' };

    let detailsHtml = '';
    if (record.transportType === 'car' || record.transportType === 'motorcycle') {
        detailsHtml = `<div class="text-muted small">駕駛：${escapeHtml(record.driver === 'self' ? '自己' : record.driver)} (里程: ${record.mileage || 0}km)</div>`;
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

    let statusHtml = record.isSettled ? '<span class="badge bg-success rounded-pill px-2">已入帳</span>' : '';
    let cardClass = record.isSettled ? 'card record-card status-settled' : 'card record-card';

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
                    <h5 class="card-title fw-bold m-0 text-truncate">${escapeHtml(record.tripName)}</h5>
                    ${statusHtml}
                </div>
                <div class="small text-primary mb-2"><i class="bi bi-geo-alt-fill me-1"></i>${escapeHtml(record.location)} ${record.visitingUnit ? '('+escapeHtml(record.visitingUnit)+')' : ''}</div>
                <div class="small text-muted mb-2"><i class="bi bi-clock me-1"></i>${record.startTime.replace('T', ' ')} ~<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${record.endTime.replace('T', ' ')}</div>

                <div class="d-flex justify-content-between text-muted small border-top pt-2 mt-2">
                    <span>雜費</span><span>$${record.allowance}</span>
                </div>
                <div class="d-flex justify-content-between text-muted small">
                    <span>交通費 (${typeMap[record.transportType] || '無'})</span><span>$${record.transportCost}</span>
                </div>
                ${detailsHtml}
                ${receiptsHtml}

                <div class="mt-3 pt-2 border-top d-flex justify-content-between align-items-center">
                    <span class="fw-bold">總計</span>
                    <span class="fw-bold text-danger fs-5">$${record.totalAmount}</span>
                </div>

                <div class="d-flex gap-2 mt-3">
                    <button class="btn btn-light btn-sm w-100 edit-record-btn text-primary fw-bold rounded-pill" data-id="${record.id}"><i class="bi bi-pencil-square"></i> 編輯</button>
                </div>
                ${actionBtnHtml}
            </div>
        </div>
    `;
    recordsContainer.appendChild(col);
};

// Handle Settle/Undo Toggle
recordsContainer.addEventListener('click', async (e) => {
    const settleBtn = e.target.closest('.toggle-settle-btn');
    if (settleBtn) {
        const docId = settleBtn.dataset.id;
        const action = settleBtn.dataset.action;
        const { db, doc, updateDoc } = window.firebaseData;
        try {
            settleBtn.disabled = true;
            await updateDoc(doc(db, 'records', docId), {
                isSettled: action === 'settle',
                settledAt: action === 'settle' ? new Date().toISOString() : null
            });
        } catch (error) {
            alert("更新狀態失敗：" + error.message);
            settleBtn.disabled = false;
        }
        return;
    }

    const editBtn = e.target.closest('.edit-record-btn');
    if (editBtn) {
        const id = editBtn.dataset.id;
        const record = currentRecords.find(r => r.id === id);
        if (record) openEditModal(record);
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
    companionsInput.value = record.companions || '';
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

    calculateAllowance(); // updates total

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
const renderCalendar = () => {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;

    if (!calendarInstance) {
        calendarInstance = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'zh-tw',
            height: 'auto',
            headerToolbar: {
                left: 'prev,next',
                center: 'title',
                right: 'today'
            },
            eventClick: function(info) {
                const id = info.event.id;
                const record = currentRecords.find(r => r.id === id);
                if (record) openEditModal(record);
            }
        });
    }

    const events = currentRecords.map(r => ({
        id: r.id,
        title: r.tripName || r.location,
        start: r.startTime,
        end: r.endTime,
        backgroundColor: r.isSettled ? 'var(--ios-green)' : 'var(--ios-blue)',
        borderColor: r.isSettled ? 'var(--ios-green)' : 'var(--ios-blue)'
    }));

    calendarInstance.removeAllEvents();
    calendarInstance.addEventSource(events);

    // Render only if visible
    if (btnCalendar.checked) {
        calendarInstance.render();
    }
};

// --- CSV Export Logic ---
exportBtn.addEventListener('click', () => {
    if (!currentRecords || currentRecords.length === 0) return alert('沒有可匯出的紀錄。');

    const headers = ['出差名稱', '地點', '拜訪單位', '同行', '開始時間', '結束時間', '雜費', '交通方式', '駕駛', '里程數', '交通費', '發票總計', '總計金額', '狀態'];

    const rows = currentRecords.map(r => {
        const typeMap = { 'car': '自行開車', 'motorcycle': '自行騎車', 'public': '大眾/其他' };
        let receiptTotal = 0;
        if (r.receipts) r.receipts.forEach(x => receiptTotal += x.price);

        const row = [
            `"${(r.tripName || '').replace(/"/g, '""')}"`,
            `"${(r.location || '').replace(/"/g, '""')}"`,
            `"${(r.visitingUnit || '').replace(/"/g, '""')}"`,
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
