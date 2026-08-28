import re

with open('app.js', 'r') as f:
    content = f.read()

# I also need to make sure equipmentModalInstance is set properly just once globally or when it opens
content = re.sub(
    r"document\.getElementById\('openEquipmentModalBtn'\)\.addEventListener\('click', \(\) => \{\n        const equipmentModal = bootstrap\.Modal\.getInstance\(equipmentModalEl\) \|\| new bootstrap\.Modal\(equipmentModalEl\);\n        equipmentModal\.show\(\);\n    \}\);",
    r"document.getElementById('openEquipmentModalBtn').addEventListener('click', () => {\n        if (!equipmentModalInstance) equipmentModalInstance = new bootstrap.Modal(equipmentModalEl);\n        equipmentModalInstance.show();\n    });",
    content
)

with open('app.js', 'w') as f:
    f.write(content)
