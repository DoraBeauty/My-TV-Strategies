import re

with open('app.js', 'r') as f:
    content = f.read()

# Replace the static EQUIPMENT_CATEGORIES rendering with dynamic currentEquipmentCatalog
dynamic_ui_logic = """
function initEquipmentUI() {
    if (!modalEquipmentContent) return;
    equipmentModalInstance = new bootstrap.Modal(equipmentModalEl);
    modalEquipmentContent.innerHTML = '';

    currentEquipmentCatalog.forEach(group => {
        const catContainer = document.createElement('div');
        catContainer.className = 'mb-4';

        const catTitle = document.createElement('h6');
        catTitle.className = 'fw-bold text-primary mb-2 border-bottom pb-1';
        catTitle.style.borderColor = 'var(--border-color) !important';
        catTitle.textContent = group.name;
        catContainer.appendChild(catTitle);

        const listContainer = document.createElement('div');
        listContainer.className = 'd-flex flex-column gap-2';

        group.items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'd-flex justify-content-between align-items-center bg-custom-light rounded-3 px-3 py-2';

            const label = document.createElement('span');
            label.className = 'fw-bold text-main-custom small';
            label.textContent = item.name;

            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'ios-input equipment-modal-qty-input border-0 bg-transparent text-end p-0 fw-bold w-25';
            input.value = '';
            input.min = '0';
            input.step = '1';
            input.placeholder = '0';
            input.dataset.name = item.name;

            input.addEventListener('input', calculateModalEquipmentTotal);

            row.appendChild(label);
            row.appendChild(input);
            listContainer.appendChild(row);
        });

        catContainer.appendChild(listContainer);
        modalEquipmentContent.appendChild(catContainer);
    });
}
"""

content = re.sub(
    r"function initEquipmentUI\(\) \{[\s\S]*?modalEquipmentContent\.appendChild\(catContainer\);\n    \}\n\}",
    dynamic_ui_logic,
    content
)

with open('app.js', 'w') as f:
    f.write(content)
