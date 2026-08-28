import re

with open('app.js', 'r') as f:
    content = f.read()

# I wrote `function renderEquipmentSettings() {` earlier but it seems it's not being called on load or it's failing!
# Let's see if it's there.
