import re

with open('app.js', 'r') as f:
    content = f.read()

# Fix the memory leak in initEquipmentUI by removing the assignment
content = re.sub(
    r"function initEquipmentUI\(\) \{\n    if \(\!modalEquipmentContent\) return;\n    equipmentModalInstance = new bootstrap\.Modal\(equipmentModalEl\);\n    modalEquipmentContent\.innerHTML = '';",
    r"function initEquipmentUI() {\n    if (!modalEquipmentContent) return;\n    modalEquipmentContent.innerHTML = '';",
    content
)

with open('app.js', 'w') as f:
    f.write(content)
