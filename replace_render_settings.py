import re

with open('app.js', 'r') as f:
    content = f.read()

# Add the renderEquipmentSettings function and event listeners
render_settings_logic = """
function renderEquipmentSettings() {
    if (!equipmentSettingsContent) return;
    equipmentSettingsContent.innerHTML = '';

    currentEquipmentCatalog.forEach((group, groupIndex) => {
        const groupEl = document.createElement('div');
        groupEl.className = 'bg-custom-card border rounded-4 p-3 mb-3 shadow-sm';

        // Group Header
        const headerEl = document.createElement('div');
        headerEl.className = 'd-flex justify-content-between align-items-center mb-3 border-bottom pb-2';
        headerEl.style.borderColor = 'var(--border-color) !important';

        const titleEl = document.createElement('h6');
        titleEl.className = 'fw-bold text-primary m-0';
        titleEl.textContent = group.name;

        const headerBtns = document.createElement('div');
        headerBtns.innerHTML = `
            <button class="btn btn-sm btn-link text-muted p-0 me-2" onclick="editEquipmentGroup(${groupIndex})"><i class="bi bi-pencil-square"></i></button>
            <button class="btn btn-sm btn-link text-danger p-0" onclick="deleteEquipmentGroup(${groupIndex})"><i class="bi bi-trash3"></i></button>
        `;

        headerEl.appendChild(titleEl);
        headerEl.appendChild(headerBtns);
        groupEl.appendChild(headerEl);

        // Group Items
        const itemsList = document.createElement('div');
        itemsList.className = 'd-flex flex-column gap-2 mb-3';

        group.items.forEach((item, itemIndex) => {
            const itemEl = document.createElement('div');
            itemEl.className = 'd-flex justify-content-between align-items-center bg-custom-light rounded-3 px-3 py-2';

            const itemNameEl = document.createElement('span');
            itemNameEl.className = 'fw-bold text-main-custom small';
            itemNameEl.textContent = item.name;

            const itemBtns = document.createElement('div');
            itemBtns.innerHTML = `
                <button class="btn btn-sm btn-link text-muted p-0 me-2" onclick="editEquipmentItem(${groupIndex}, ${itemIndex})"><i class="bi bi-pencil-square"></i></button>
                <button class="btn btn-sm btn-link text-danger p-0" onclick="deleteEquipmentItem(${groupIndex}, ${itemIndex})"><i class="bi bi-trash3"></i></button>
            `;

            itemEl.appendChild(itemNameEl);
            itemEl.appendChild(itemBtns);
            itemsList.appendChild(itemEl);
        });
        groupEl.appendChild(itemsList);

        // Add Item Button
        const addItemBtn = document.createElement('button');
        addItemBtn.className = 'btn btn-sm btn-custom-light w-100 rounded-pill text-primary fw-bold';
        addItemBtn.innerHTML = '<i class="bi bi-plus-lg me-1"></i>新增裝備種類';
        addItemBtn.onclick = () => addEquipmentItem(groupIndex);
        groupEl.appendChild(addItemBtn);

        equipmentSettingsContent.appendChild(groupEl);
    });
}

// Global functions for inline onclick handlers
window.editEquipmentGroup = (groupIndex) => {
    const group = currentEquipmentCatalog[groupIndex];
    const newName = prompt('請輸入群組新名稱', group.name);
    if (newName && newName.trim() !== '') {
        group.name = newName.trim();
        saveEquipmentCatalog();
    }
};

window.deleteEquipmentGroup = (groupIndex) => {
    if (confirm('確定要刪除此群組及其下所有裝備種類嗎？')) {
        currentEquipmentCatalog.splice(groupIndex, 1);
        saveEquipmentCatalog();
    }
};

window.editEquipmentItem = (groupIndex, itemIndex) => {
    const item = currentEquipmentCatalog[groupIndex].items[itemIndex];
    const newName = prompt('請輸入裝備新名稱', item.name);
    if (newName && newName.trim() !== '') {
        item.name = newName.trim();
        saveEquipmentCatalog();
    }
};

window.deleteEquipmentItem = (groupIndex, itemIndex) => {
    if (confirm('確定要刪除此裝備嗎？')) {
        currentEquipmentCatalog[groupIndex].items.splice(itemIndex, 1);
        saveEquipmentCatalog();
    }
};

window.addEquipmentItem = (groupIndex) => {
    const newName = prompt('請輸入新裝備名稱');
    if (newName && newName.trim() !== '') {
        currentEquipmentCatalog[groupIndex].items.push({
            id: 'eq_' + Date.now(),
            name: newName.trim()
        });
        saveEquipmentCatalog();
    }
};

if (addEquipmentGroupBtn) {
    addEquipmentGroupBtn.addEventListener('click', () => {
        const newName = prompt('請輸入新群組名稱');
        if (newName && newName.trim() !== '') {
            currentEquipmentCatalog.push({
                id: 'group_' + Date.now(),
                name: newName.trim(),
                items: []
            });
            saveEquipmentCatalog();
        }
    });
}

function initEquipmentUI() {
"""

content = content.replace(
    "function initEquipmentUI() {",
    render_settings_logic
)

with open('app.js', 'w') as f:
    f.write(content)
