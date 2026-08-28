import re

with open('app.js', 'r') as f:
    content = f.read()

# I missed this one thing in replace.py when parsing DOMContentLoaded
content = re.sub(
    r"updateEquipmentSummaryUI\(\);\n\n            // Set default start/end times",
    r"updateEquipmentSummaryUI();", # wait, it didn't find this exact string? Let's fix the reset form logic properly.
    content
)
