import re

with open('app.js', 'r') as f:
    content = f.read()

# 1. Remove the problematic equipmentModalInstance = new bootstrap.Modal(equipmentModalEl) from initEquipmentUI
# The instance is created correctly in the 'click' event listener anyway, and we already removed it from confirm modal logic
content = re.sub(
    r"function initEquipmentUI\(\) \{\n    if \(\!modalEquipmentContent\) return;\n    equipmentModalInstance = new bootstrap\.Modal\(equipmentModalEl\);\n    modalEquipmentContent\.innerHTML = '';",
    r"function initEquipmentUI() {\n    if (!modalEquipmentContent) return;\n    modalEquipmentContent.innerHTML = '';",
    content
)

# 2. Oh, wait, the mileage multiplier! Let me check calculateTotal and getCompleteTransportCost
