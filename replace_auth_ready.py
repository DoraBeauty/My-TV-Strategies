import re

with open('app.js', 'r') as f:
    content = f.read()

# Make sure we don't accidentally call it twice if it's already there
# But where does fetchUserSettings get called?
