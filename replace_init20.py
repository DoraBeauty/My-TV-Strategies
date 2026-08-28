# The inputs are not there again? Wait!
# Did I reset app.js too? Let's check initEquipmentUI
import os
os.system('cat app.js | grep initEquipmentUI -C 10')
