import re

with open('app.js', 'r') as f:
    content = f.read()

# I also need to remove loadEquipmentCatalog logic from earlier since loadRouteSettings is doing it now.
content = re.sub(
    r"function loadEquipmentCatalog\(\) \{[\s\S]*?async function saveEquipmentCatalog\(\) \{",
    r"async function saveEquipmentCatalog() {",
    content
)

content = re.sub(
    r"loadEquipmentCatalog\(\);\n    window\.dispatchEvent",
    r"window.dispatchEvent",
    content
)

with open('app.js', 'w') as f:
    f.write(content)
