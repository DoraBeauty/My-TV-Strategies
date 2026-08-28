import re

with open('app.js', 'r') as f:
    content = f.read()

# Make confirmEquipmentBtn hide programmatically because we removed data-bs-dismiss!
content = re.sub(
    r"updateEquipmentSummaryUI\(\);\n    \}\);",
    r"updateEquipmentSummaryUI();\n        if (equipmentModalInstance) equipmentModalInstance.hide();\n        else bootstrap.Modal.getInstance(equipmentModalEl)?.hide();\n    });",
    content
)

with open('app.js', 'w') as f:
    f.write(content)
