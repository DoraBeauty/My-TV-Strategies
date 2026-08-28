import re

with open('app.js', 'r') as f:
    content = f.read()

# Make sure startGuestMode and auth callback call loadEquipmentCatalog
content = re.sub(
    r"window\.dispatchEvent\(new Event\('authReady'\)\);\n\};",
    r"loadEquipmentCatalog();\n    window.dispatchEvent(new Event('authReady'));\n};",
    content
)

with open('app.js', 'w') as f:
    f.write(content)
