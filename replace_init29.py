# Bootstrap Modal Instance is bound differently when opened with data-bs-target vs programmatically.
# Since the openEquipmentModalBtn uses data-bs-toggle="modal" data-bs-target="#equipmentModal",
# it handles its own instance. Let's just use data-bs-dismiss="modal" ON the button, but remove data-bs-dismiss="modal" from recordModal if there is any overlapping issue. No, we want equipmentModal to close.
# Let's check what my python script actually replaced.

import re

with open('app.js', 'r') as f:
    content = f.read()

content = content.replace(
"""        const equipmentModal = bootstrap.Modal.getInstance(document.getElementById('equipmentModal'));
        if (equipmentModal) {
            equipmentModal.hide();
        } else {
            console.warn("Could not find equipmentModal instance to hide");
        }""",
"""        const equipmentModalEl = document.getElementById('equipmentModal');
        const equipmentModal = bootstrap.Modal.getInstance(equipmentModalEl) || new bootstrap.Modal(equipmentModalEl);
        equipmentModal.hide();"""
)

with open('app.js', 'w') as f:
    f.write(content)
