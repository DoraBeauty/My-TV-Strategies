import re

with open('app.js', 'r') as f:
    content = f.read()

# When the modal opens, we need to handle "Removed/Other" equipment.
# Option A logic: If a record has equipment not in currentEquipmentCatalog, inject them into a new group dynamically.
# Let's modify the show.bs.modal listener.

show_modal_replacement = """
    equipmentModalEl.addEventListener('show.bs.modal', () => {
        // 1. Re-render the base UI to clear any previously injected 'removed' groups
        initEquipmentUI();

        // 2. Identify removed items
        const currentCatalogNames = new Set();
        currentEquipmentCatalog.forEach(g => g.items.forEach(i => currentCatalogNames.add(i.name)));

        const removedItems = currentEquipmentList.filter(eq => !currentCatalogNames.has(eq.name));

        // 3. Inject removed items UI if necessary
        if (removedItems.length > 0) {
            const catContainer = document.createElement('div');
            catContainer.className = 'mb-4';

            const catTitle = document.createElement('h6');
            catTitle.className = 'fw-bold text-danger mb-2 border-bottom pb-1';
            catTitle.style.borderColor = 'var(--border-color) !important';
            catTitle.textContent = '其他／已移除裝備';
            catContainer.appendChild(catTitle);

            const listContainer = document.createElement('div');
            listContainer.className = 'd-flex flex-column gap-2';

            removedItems.forEach(item => {
                const row = document.createElement('div');
                row.className = 'd-flex justify-content-between align-items-center bg-custom-light rounded-3 px-3 py-2 border border-danger border-opacity-25';

                const label = document.createElement('span');
                label.className = 'fw-bold text-danger small';
                label.textContent = item.name;

                const input = document.createElement('input');
                input.type = 'number';
                input.className = 'ios-input equipment-modal-qty-input border-0 bg-transparent text-end p-0 fw-bold w-25 text-danger';
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
        }

        // 4. Populate values
        const inputs = modalEquipmentContent.querySelectorAll('.equipment-modal-qty-input');
        inputs.forEach(input => input.value = '');

        currentEquipmentList.forEach(eq => {
            const input = modalEquipmentContent.querySelector(`.equipment-modal-qty-input[data-name="${eq.name}"]`);
            if (input) input.value = eq.qty;
        });

        modalEquipmentNote.value = currentEquipmentNote;
        calculateModalEquipmentTotal();
    });
"""

content = re.sub(
    r"equipmentModalEl\.addEventListener\('show\.bs\.modal', \(\) => \{[\s\S]*?calculateModalEquipmentTotal\(\);\n    \}\);",
    show_modal_replacement,
    content
)

with open('app.js', 'w') as f:
    f.write(content)
