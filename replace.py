import re

with open('app.js', 'r') as f:
    content = f.read()

# Modify mileage variables at the top
content = re.sub(
    r"const mileageSection = document.getElementById\('mileageSection'\);\nconst mileageInput = document.getElementById\('mileage'\);\nconst mileageRateHint = document.getElementById\('mileageRateHint'\);",
    r"const mileageSection = document.getElementById('mileageSection');\nconst mileageInput = document.getElementById('mileage');\nconst mileageRateHint = document.getElementById('mileageRateHint');\nconst roundTripBtn = document.getElementById('roundTripBtn');\nlet isRoundTripActive = false;",
    content
)

# Modify handleDriverChange to reset roundTripBtn
content = re.sub(
    r"mileageInput.value = '';\n    }\n    calculateTotal\(\);\n};\ndriverSelect.addEventListener\('change', handleDriverChange\);\nmileageInput.addEventListener\('input', calculateTotal\);",
    r"mileageInput.value = '';\n        isRoundTripActive = false;\n        roundTripBtn.classList.remove('active', 'btn-secondary');\n        roundTripBtn.classList.add('btn-outline-secondary');\n    }\n    calculateTotal();\n};\ndriverSelect.addEventListener('change', handleDriverChange);\n\nmileageInput.addEventListener('input', () => {\n    if (isRoundTripActive) {\n        isRoundTripActive = false;\n        roundTripBtn.classList.remove('active', 'btn-secondary');\n        roundTripBtn.classList.add('btn-outline-secondary');\n    }\n    calculateTotal();\n});\n\nroundTripBtn.addEventListener('click', () => {\n    const currentVal = parseFloat(mileageInput.value) || 0;\n    if (isRoundTripActive) {\n        isRoundTripActive = false;\n        roundTripBtn.classList.remove('active', 'btn-secondary');\n        roundTripBtn.classList.add('btn-outline-secondary');\n        mileageInput.value = currentVal / 2;\n    } else {\n        isRoundTripActive = true;\n        roundTripBtn.classList.remove('btn-outline-secondary');\n        roundTripBtn.classList.add('active', 'btn-secondary');\n        mileageInput.value = currentVal * 2;\n    }\n    calculateTotal();\n});",
    content
)

# Equipment Logic Changes

# Remove old FIXED_EQUIPMENT_LIST and initEquipmentUI, calculateEquipmentTotal
content = re.sub(
    r"const equipmentContainer = document.getElementById\('equipmentContainer'\);\nconst equipmentTotalQtyDisplay = document.getElementById\('equipmentTotalQty'\);\nconst equipmentNoteInput = document.getElementById\('equipmentNote'\);\n\nconst FIXED_EQUIPMENT_LIST.*?function calculateEquipmentTotal\(\) \{.*?\n\}",
    r"""// New Equipment Variables
const equipmentSummary = document.getElementById('equipmentSummary');
const equipmentNotePreview = document.getElementById('equipmentNotePreview');
const modalEquipmentContent = document.getElementById('equipmentModalContent');
const modalEquipmentTotalQty = document.getElementById('modalEquipmentTotalQty');
const modalEquipmentNote = document.getElementById('modalEquipmentNote');
const confirmEquipmentBtn = document.getElementById('confirmEquipmentBtn');
const equipmentModalEl = document.getElementById('equipmentModal');
let equipmentModalInstance = null;

// Equipment State (In-Memory for Form)
let currentEquipmentList = [];
let currentEquipmentTotalQty = 0;
let currentEquipmentNote = '';

const EQUIPMENT_CATEGORIES = {
    '迫砲': ['60迫砲', 'T75式81迫砲', 'M29A1式81迫砲', '120迫砲', 'M42迫砲'],
    '榴砲': ['105榴砲', '155榴砲', '8吋榴砲', 'M240榴砲', '155加農砲'],
    '機砲': ['T82T式20機砲（牽引式）', 'T82F式20機砲（固定式）']
};

function initEquipmentUI() {
    if (!modalEquipmentContent) return;
    equipmentModalInstance = new bootstrap.Modal(equipmentModalEl);
    modalEquipmentContent.innerHTML = '';

    for (const [category, items] of Object.entries(EQUIPMENT_CATEGORIES)) {
        const catContainer = document.createElement('div');
        catContainer.className = 'mb-4';

        const catTitle = document.createElement('h6');
        catTitle.className = 'fw-bold text-primary mb-2 border-bottom pb-1';
        catTitle.style.borderColor = 'var(--border-color) !important';
        catTitle.textContent = category;
        catContainer.appendChild(catTitle);

        const listContainer = document.createElement('div');
        listContainer.className = 'd-flex flex-column gap-2';

        items.forEach(eqName => {
            const row = document.createElement('div');
            row.className = 'd-flex justify-content-between align-items-center bg-custom-light rounded-3 px-3 py-2';

            const label = document.createElement('span');
            label.className = 'fw-bold text-main-custom small';
            label.textContent = eqName;

            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'ios-input equipment-modal-qty-input border-0 bg-transparent text-end p-0 fw-bold w-25';
            input.value = '';
            input.min = '0';
            input.step = '1';
            input.placeholder = '0';
            input.dataset.name = eqName;

            input.addEventListener('input', calculateModalEquipmentTotal);

            row.appendChild(label);
            row.appendChild(input);
            listContainer.appendChild(row);
        });

        catContainer.appendChild(listContainer);
        modalEquipmentContent.appendChild(catContainer);
    }
}

function calculateModalEquipmentTotal() {
    if (!modalEquipmentContent) return;
    let total = 0;
    const inputs = modalEquipmentContent.querySelectorAll('.equipment-modal-qty-input');
    inputs.forEach(input => {
        const val = parseInt(input.value) || 0;
        if (val > 0) total += val;
    });
    modalEquipmentTotalQty.textContent = total;
}

function updateEquipmentSummaryUI() {
    if (currentEquipmentTotalQty === 0) {
        equipmentSummary.textContent = '未選擇';
        equipmentNotePreview.style.display = 'none';
    } else {
        const displayList = currentEquipmentList.slice(0, 3).map(eq => `${eq.name}×${eq.qty}`);
        let summaryText = displayList.join('、');
        if (currentEquipmentList.length > 3) {
            summaryText += '...';
        }
        summaryText += `（共 ${currentEquipmentTotalQty} 門）`;
        equipmentSummary.textContent = summaryText;

        if (currentEquipmentNote) {
            equipmentNotePreview.textContent = currentEquipmentNote;
            equipmentNotePreview.style.display = 'block';
        } else {
            equipmentNotePreview.style.display = 'none';
        }
    }
}

// When confirm button is clicked in modal
if (confirmEquipmentBtn) {
    confirmEquipmentBtn.addEventListener('click', () => {
        currentEquipmentList = [];
        currentEquipmentTotalQty = 0;

        const inputs = modalEquipmentContent.querySelectorAll('.equipment-modal-qty-input');
        inputs.forEach(input => {
            const qty = parseInt(input.value) || 0;
            if (qty > 0) {
                currentEquipmentList.push({ name: input.dataset.name, qty: qty });
                currentEquipmentTotalQty += qty;
            }
        });

        currentEquipmentNote = modalEquipmentNote.value.trim();
        updateEquipmentSummaryUI();
    });
}

// When modal is opened, restore values from current state
if (equipmentModalEl) {
    equipmentModalEl.addEventListener('show.bs.modal', () => {
        const inputs = modalEquipmentContent.querySelectorAll('.equipment-modal-qty-input');
        inputs.forEach(input => input.value = '');

        currentEquipmentList.forEach(eq => {
            const input = modalEquipmentContent.querySelector(`.equipment-modal-qty-input[data-name="${eq.name}"]`);
            if (input) input.value = eq.qty;
        });

        modalEquipmentNote.value = currentEquipmentNote;
        calculateModalEquipmentTotal();
    });
}
""",
    content,
    flags=re.DOTALL
)

# Call initEquipmentUI directly
content = re.sub(
    r"document\.addEventListener\('DOMContentLoaded', initEquipmentUI\);",
    r"initEquipmentUI();",
    content
)

# Update reset form equipment
content = re.sub(
    r"// Reset equipment\n            if \(equipmentContainer\) \{[^\}]+\}[^\}]+\}[^\}]+\}",
    r"// Reset equipment\n            currentEquipmentList = [];\n            currentEquipmentTotalQty = 0;\n            currentEquipmentNote = '';\n            updateEquipmentSummaryUI();",
    content
)

# Replace equipment data extraction during save
content = re.sub(
    r"let equipmentList = \[\];\n        let equipmentTotalQty = 0;\n        if \(equipmentContainer\) \{.*?\n        \}\n        const equipmentNote = equipmentNoteInput \? equipmentNoteInput.value.trim\(\) : '';",
    r"let equipmentList = currentEquipmentList;\n        let equipmentTotalQty = currentEquipmentTotalQty;\n        const equipmentNote = currentEquipmentNote;",
    content,
    flags=re.DOTALL
)

# Replace equipment data loading during edit
content = re.sub(
    r"// Reset and populate equipment\n    if \(equipmentContainer\) \{[^\}]+.*?\n    \}",
    r"// Reset and populate equipment\n    currentEquipmentList = Array.isArray(record.equipmentList) ? record.equipmentList : [];\n    currentEquipmentTotalQty = record.equipmentTotalQty || 0;\n    currentEquipmentNote = record.equipmentNote || '';\n    updateEquipmentSummaryUI();",
    content,
    flags=re.DOTALL
)

# Reset round trip button during edit load
content = re.sub(
    r"if \(record.mileage !== null\) mileageInput.value = record.mileage;",
    r"if (record.mileage !== null) mileageInput.value = record.mileage;\n    isRoundTripActive = false;\n    roundTripBtn.classList.remove('active', 'btn-secondary');\n    roundTripBtn.classList.add('btn-outline-secondary');",
    content
)

# Fix openEditModal calculateEquipmentTotal call
content = re.sub(
    r"updateEquipmentSummaryUI\(\);\n    calculateEquipmentTotal\(\);",
    r"updateEquipmentSummaryUI();",
    content
)

with open('app.js', 'w') as f:
    f.write(content)
