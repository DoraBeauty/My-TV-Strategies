import re

with open('app.js', 'r') as f:
    content = f.read()

# We need to make sure `loadSettings` is called when auth is ready (which it is, or maybe I should check)
