import re

with open('app.js', 'r') as f:
    content = f.read()

# Fix the syntax error: -${dd}T07:00`;
content = re.sub(
    r"updateEquipmentSummaryUI\(\);-\$\{dd\}T07:00`;",
    r"updateEquipmentSummaryUI();\n\n            // Set default start/end times\n            const now = new Date();\n            const yyyy = now.getFullYear();\n            const mm = String(now.getMonth() + 1).padStart(2, '0');\n            const dd = String(now.getDate()).padStart(2, '0');\n\n            // Construct strings for today at 07:00 and 18:00\n            const defaultStart = `${yyyy}-${mm}-${dd}T07:00`;",
    content
)

# And remove calculateEquipmentTotal() at end of openEditModal
content = re.sub(
    r"updateEquipmentSummaryUI\(\);\n    calculateEquipmentTotal\(\);",
    r"updateEquipmentSummaryUI();",
    content
)

with open('app.js', 'w') as f:
    f.write(content)
