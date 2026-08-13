import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
    getFirestore,
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    serverTimestamp,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

// TODO: Replace with user's actual Firebase config
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Global State
let currentUser = null;

// DOM Elements - Auth & UI
const loginView = document.getElementById('loginView');
const dashboardView = document.getElementById('dashboardView');
const loginBtn = document.getElementById('loginBtn');
const largeLoginBtn = document.getElementById('largeLoginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const exportBtn = document.getElementById('exportBtn');
const unsettledTotalText = document.getElementById('unsettledTotalText');

// Auth Functions
const handleLogin = async () => {
    try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Login Error:", error);
        alert("登入失敗：" + error.message);
    }
};

const handleLogout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout Error:", error);
    }
};

loginBtn.addEventListener('click', handleLogin);
largeLoginBtn.addEventListener('click', handleLogin);
logoutBtn.addEventListener('click', handleLogout);

// Auth State Observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        loginView.style.display = 'none';
        dashboardView.style.display = 'block';
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
        exportBtn.style.display = 'inline-block';
        unsettledTotalText.style.display = 'inline-block';

        // Expose modules to window for step 4 and 5 logic implementation
        window.firebaseData = {
            db, storage, collection, addDoc, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, ref, uploadBytes, getDownloadURL, getDocs, deleteObject, currentUser
        };

        // Dispatch custom event to notify other scripts that auth is ready
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

// --- Form Business Logic ---

const startTimeInput = document.getElementById('startTime');
const endTimeInput = document.getElementById('endTime');
const allowanceInput = document.getElementById('allowance');
const timeCalcHint = document.getElementById('timeCalcHint');

const transportTypeSelect = document.getElementById('transportType');
const mileageSection = document.getElementById('mileageSection');
const publicTransportSection = document.getElementById('publicTransportSection');
const mileageInput = document.getElementById('mileage');
const ticketPriceInput = document.getElementById('ticketPrice');
const mileageRateHint = document.getElementById('mileageRateHint');
const totalAmountInput = document.getElementById('totalAmount');

// Calculate Allowance based on time
const calculateAllowance = () => {
    const start = startTimeInput.value;
    const end = endTimeInput.value;

    if (!start || !end) {
        allowanceInput.value = 0;
        timeCalcHint.textContent = "請先輸入起訖時間";
        calculateTotal();
        return;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (endDate <= startDate) {
        allowanceInput.value = 0;
        timeCalcHint.textContent = "結束時間必須晚於開始時間";
        timeCalcHint.classList.replace('text-primary', 'text-danger');
        calculateTotal();
        return;
    }

    timeCalcHint.classList.replace('text-danger', 'text-primary');

    const diffMs = endDate - startDate;
    const diffHours = diffMs / (1000 * 60 * 60);

    let allowance = 0;
    if (diffHours >= 4) {
        allowance = 400;
    } else {
        allowance = 200;
    }

    allowanceInput.value = allowance;
    timeCalcHint.textContent = \`共計 \${diffHours.toFixed(1)} 小時，雜費自動帶入 \$\${allowance}\`;
    calculateTotal();
};

startTimeInput.addEventListener('change', calculateAllowance);
endTimeInput.addEventListener('change', calculateAllowance);

// Handle Transport Type Change
const handleTransportChange = () => {
    const type = transportTypeSelect.value;

    // Reset values
    mileageInput.value = '';
    ticketPriceInput.value = '';
    document.getElementById('receiptImage').value = '';

    if (type === 'car') {
        mileageSection.style.display = 'block';
        publicTransportSection.style.display = 'none';
        mileageRateHint.textContent = "計算方式：里程數 x $3";
        mileageInput.dataset.rate = "3";
    } else if (type === 'motorcycle') {
        mileageSection.style.display = 'block';
        publicTransportSection.style.display = 'none';
        mileageRateHint.textContent = "計算方式：里程數 x $2";
        mileageInput.dataset.rate = "2";
    } else if (type === 'public') {
        mileageSection.style.display = 'none';
        publicTransportSection.style.display = 'block';
    } else {
        mileageSection.style.display = 'none';
        publicTransportSection.style.display = 'none';
    }

    calculateTotal();
};

transportTypeSelect.addEventListener('change', handleTransportChange);

// Calculate Total
const calculateTotal = () => {
    const allowance = parseFloat(allowanceInput.value) || 0;
    let transportCost = 0;

    const type = transportTypeSelect.value;
    if (type === 'car' || type === 'motorcycle') {
        const mileage = parseFloat(mileageInput.value) || 0;
        const rate = parseFloat(mileageInput.dataset.rate) || 0;
        transportCost = mileage * rate;
    } else if (type === 'public') {
        transportCost = parseFloat(ticketPriceInput.value) || 0;
    }

    totalAmountInput.value = Math.round(allowance + transportCost);
};

mileageInput.addEventListener('input', calculateTotal);
ticketPriceInput.addEventListener('input', calculateTotal);


// --- Dashboard & CRUD Logic ---

let unsubscribeRecords = null;
let currentRecords = []; // For export
let bootstrapModalInstance = null; // Store modal instance

// Initialize Modal
document.addEventListener('DOMContentLoaded', () => {
    const modalEl = document.getElementById('newRecordModal');
    if (modalEl) {
        bootstrapModalInstance = new bootstrap.Modal(modalEl);
    }
});


// Handle Submit Record
const saveRecordBtn = document.getElementById('saveRecordBtn');
const saveSpinner = document.getElementById('saveSpinner');

saveRecordBtn.addEventListener('click', async () => {
    const form = document.getElementById('recordForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const { db, storage, collection, addDoc, serverTimestamp, ref, uploadBytes, getDownloadURL, currentUser } = window.firebaseData;

    try {
        saveRecordBtn.disabled = true;
        saveSpinner.classList.remove('d-none');

        const locationVal = document.getElementById('location').value;
        const startVal = startTimeInput.value;
        const endVal = endTimeInput.value;
        const allowanceVal = parseInt(allowanceInput.value);
        const transportTypeVal = transportTypeSelect.value;

        let transportCostVal = 0;
        let mileageVal = null;
        let receiptImageUrl = null;
        let receiptImagePath = null;

        if (transportTypeVal === 'car' || transportTypeVal === 'motorcycle') {
            mileageVal = parseFloat(mileageInput.value) || 0;
            const rate = parseFloat(mileageInput.dataset.rate) || 0;
            transportCostVal = mileageVal * rate;
        } else if (transportTypeVal === 'public') {
            transportCostVal = parseInt(ticketPriceInput.value) || 0;

            const fileInput = document.getElementById('receiptImage');
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                const filename = \`receipts/\${currentUser.uid}/\${Date.now()}_\${file.name}\`;
                const storageRef = ref(storage, filename);
                await uploadBytes(storageRef, file);
                receiptImageUrl = await getDownloadURL(storageRef);
                receiptImagePath = filename;
            }
        }

        const totalVal = parseInt(totalAmountInput.value);

        const newRecord = {
            userId: currentUser.uid,
            location: locationVal,
            startTime: startVal,
            endTime: endVal,
            allowance: allowanceVal,
            transportType: transportTypeVal,
            mileage: mileageVal,
            transportCost: transportCostVal,
            totalAmount: totalVal,
            receiptImageUrl: receiptImageUrl,
            receiptImagePath: receiptImagePath, // store path for deletion
            isSettled: false,
            settledAt: null,
            createdAt: serverTimestamp()
        };

        await addDoc(collection(db, 'records'), newRecord);

        // Reset form & close modal
        form.reset();
        calculateAllowance();
        handleTransportChange();
        if (bootstrapModalInstance) {
            bootstrapModalInstance.hide();
        }

    } catch (error) {
        console.error("Save error:", error);
        alert("儲存失敗：" + error.message);
    } finally {
        saveRecordBtn.disabled = false;
        saveSpinner.classList.add('d-none');
    }
});


// Load & Display Records
window.addEventListener('authReady', () => {
    const { db, collection, query, where, orderBy, onSnapshot, currentUser } = window.firebaseData;

    if (unsubscribeRecords) {
        unsubscribeRecords();
    }

    const recordsContainer = document.getElementById('recordsContainer');
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

            if (!record.isSettled) {
                unsettledTotal += record.totalAmount;
            }

            renderRecordCard(record);
        });

        // Update Total
        unsettledTotalText.textContent = \`未入帳：$\${unsettledTotal}\`;

        // Lazy cleanup of old images
        await cleanupOldImages(currentRecords);
    }, (error) => {
        console.error("Fetch records error:", error);
        loadingIndicator.style.display = 'none';
        recordsContainer.innerHTML = '<div class="alert alert-danger">載入紀錄失敗。</div>';
    });
});

const renderRecordCard = (record) => {
    const recordsContainer = document.getElementById('recordsContainer');
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6 col-lg-4';

    const typeMap = {
        'car': '自行開車',
        'motorcycle': '自行騎機車',
        'public': '大眾運輸'
    };

    let detailsHtml = '';
    if (record.transportType === 'car' || record.transportType === 'motorcycle') {
        detailsHtml = \`<div class="text-muted small">里程數：\${record.mileage} km</div>\`;
    }

    let imageHtml = '';
    if (record.receiptImageUrl) {
        imageHtml = \`
            <div class="mt-2">
                <a href="\${record.receiptImageUrl}" target="_blank">
                    <img src="\${record.receiptImageUrl}" class="thumbnail rounded border" alt="票根">
                </a>
            </div>
        \`;
    }

    // Settled logic
    let statusHtml = '';
    let actionBtnHtml = '';
    let cardClass = 'card shadow-sm record-card h-100';

    if (record.isSettled) {
        cardClass += ' status-settled bg-light';
        statusHtml = '<span class="badge bg-success ms-2">已入帳</span>';

        // Check if within 30 days
        const settledDate = record.settledAt ? new Date(record.settledAt) : new Date();
        const now = new Date();
        const diffTime = Math.abs(now - settledDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 30) {
            actionBtnHtml = \`
                <button class="btn btn-sm btn-outline-secondary w-100 mt-3 toggle-settle-btn" data-id="\${record.id}" data-action="undo">
                    <i class="bi bi-arrow-counterclockwise"></i> 取消入帳 (30天內可復原)
                </button>
            \`;
        } else {
             actionBtnHtml = \`
                <div class="text-center text-muted small mt-3">已入帳超過30天不可更改</div>
            \`;
        }

    } else {
        actionBtnHtml = \`
            <button class="btn btn-sm btn-outline-success w-100 mt-3 toggle-settle-btn" data-id="\${record.id}" data-action="settle">
                <i class="bi bi-check-circle"></i> 標記為已入帳
            </button>
        \`;
    }

    const escapeHtml = (unsafe) => {
        return (unsafe || '').toString()
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    };

    col.innerHTML = \`
        <div class="\${cardClass}">
            <div class="card-body d-flex flex-column">
                <h5 class="card-title d-flex justify-content-between align-items-start">
                    \${escapeHtml(record.location)}
                    \${statusHtml}
                </h5>
                <h6 class="card-subtitle mb-2 text-muted small">
                    \${record.startTime.replace('T', ' ')} ~ \${record.endTime.replace('T', ' ')}
                </h6>

                <div class="mt-2">
                    <div class="d-flex justify-content-between text-muted small">
                        <span>雜費</span>
                        <span>$\${record.allowance}</span>
                    </div>
                    <div class="d-flex justify-content-between text-muted small">
                        <span>交通費 (\${typeMap[record.transportType] || '無'})</span>
                        <span>$\${record.transportCost}</span>
                    </div>
                    \${detailsHtml}
                </div>

                \${imageHtml}

                <div class="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
                    <span class="fw-bold text-dark">總計</span>
                    <span class="fw-bold text-danger fs-5">$\${record.totalAmount}</span>
                </div>

                \${actionBtnHtml}
            </div>
        </div>
    \`;

    recordsContainer.appendChild(col);
};

// Handle Settle/Undo Toggle (Event Delegation)
document.getElementById('recordsContainer').addEventListener('click', async (e) => {
    const btn = e.target.closest('.toggle-settle-btn');
    if (!btn) return;

    const docId = btn.dataset.id;
    const action = btn.dataset.action;
    const { db, doc, updateDoc } = window.firebaseData;

    try {
        btn.disabled = true;
        const docRef = doc(db, 'records', docId);

        if (action === 'settle') {
            await updateDoc(docRef, {
                isSettled: true,
                settledAt: new Date().toISOString()
            });
        } else if (action === 'undo') {
            await updateDoc(docRef, {
                isSettled: false,
                settledAt: null
            });
        }
    } catch (error) {
        console.error("Update status error:", error);
        alert("更新狀態失敗：" + error.message);
        btn.disabled = false;
    }
});


// Lazy Cleanup of Old Images
const cleanupOldImages = async (records) => {
    const { db, storage, doc, updateDoc, ref, deleteObject } = window.firebaseData;
    const now = new Date();

    for (const record of records) {
        if (record.isSettled && record.settledAt && record.receiptImagePath && record.receiptImageUrl) {
            const settledDate = new Date(record.settledAt);
            const diffTime = Math.abs(now - settledDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 30) {
                console.log(\`Cleaning up old image for record \${record.id}\`);
                try {
                    // Delete from storage
                    const fileRef = ref(storage, record.receiptImagePath);
                    await deleteObject(fileRef);

                    // Remove URL and Path from doc
                    const docRef = doc(db, 'records', record.id);
                    await updateDoc(docRef, {
                        receiptImageUrl: null,
                        receiptImagePath: null
                    });
                } catch (err) {
                    console.error("Cleanup error for", record.id, err);
                }
            }
        }
    }
};


// --- CSV Export Logic ---

exportBtn.addEventListener('click', () => {
    if (!currentRecords || currentRecords.length === 0) {
        alert('沒有可匯出的紀錄。');
        return;
    }

    const typeMap = {
        'car': '自行開車',
        'motorcycle': '自行騎機車',
        'public': '大眾運輸'
    };

    const headers = ['出差地點', '開始時間', '結束時間', '雜費', '交通方式', '里程數', '交通費', '總計金額', '狀態', '建立時間'];

    const rows = currentRecords.map(record => {
        const location = \`"\${(record.location || '').replace(/"/g, '""')}"\`;
        const start = record.startTime ? record.startTime.replace('T', ' ') : '';
        const end = record.endTime ? record.endTime.replace('T', ' ') : '';
        const allowance = record.allowance || 0;
        const transportType = typeMap[record.transportType] || '';
        const mileage = record.mileage !== null ? record.mileage : '';
        const transportCost = record.transportCost || 0;
        const total = record.totalAmount || 0;
        const status = record.isSettled ? '已入帳' : '未入帳';

        let createdAt = '';
        if (record.createdAt) {
            createdAt = record.createdAt.toDate ? record.createdAt.toDate().toLocaleString('zh-TW') : new Date(record.createdAt).toLocaleString('zh-TW');
        }

        return [location, start, end, allowance, transportType, mileage, transportCost, total, status, createdAt].join(',');
    });

    const csvContent = headers.join(',') + '\\n' + rows.join('\\n');

    // Add BOM for UTF-8 to ensure Excel reads Traditional Chinese correctly
    const bom = '\\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", \`差旅費紀錄_\${new Date().toISOString().slice(0,10)}.csv\`);
    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
});
