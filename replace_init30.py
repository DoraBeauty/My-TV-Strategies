# Bootstrap Modal Instance is bound differently when opened with data-bs-target vs programmatically.
# Let's completely remove data-bs-toggle and open it programmatically, then hide it programmatically.

import re

with open('index.html', 'r') as f:
    content = f.read()

content = content.replace(
    'id="openEquipmentModalBtn" data-bs-toggle="modal" data-bs-target="#equipmentModal"',
    'id="openEquipmentModalBtn"'
)

with open('index.html', 'w') as f:
    f.write(content)

with open('app.js', 'r') as f:
    content = f.read()

content = content.replace(
"""if (equipmentModalEl) {
    equipmentModalEl.addEventListener('show.bs.modal', () => {""",
"""if (equipmentModalEl) {
    document.getElementById('openEquipmentModalBtn').addEventListener('click', () => {
        const equipmentModal = bootstrap.Modal.getInstance(equipmentModalEl) || new bootstrap.Modal(equipmentModalEl);
        equipmentModal.show();
    });

    equipmentModalEl.addEventListener('show.bs.modal', () => {"""
)

with open('app.js', 'w') as f:
    f.write(content)
