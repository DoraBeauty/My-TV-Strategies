import re

with open('app.js', 'r') as f:
    content = f.read()

# Add catalog fetching to fetchUserSettings
fetch_user_settings_replacement = """
const fetchUserSettings = async () => {
    if (!currentUser || currentUser.isGuest) return;
    try {
        const userRef = doc(db, 'userSettings', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.routeSettings) {
                currentRouteSettings = data.routeSettings;
            }
            if (data.equipmentCatalog) {
                currentEquipmentCatalog = data.equipmentCatalog;
            } else {
                currentEquipmentCatalog = JSON.parse(JSON.stringify(DEFAULT_EQUIPMENT_CATALOG));
                saveEquipmentCatalog();
            }
        } else {
            currentEquipmentCatalog = JSON.parse(JSON.stringify(DEFAULT_EQUIPMENT_CATALOG));
            saveEquipmentCatalog();
        }
        initEquipmentUI();
        renderEquipmentSettings();
    } catch (e) {
        console.error("Error fetching user settings", e);
    }
};"""

# Wait, fetchUserSettings might NOT be in the file anymore?
# Oh, in the user's previous code, they had routeSettings! Let's check for routeSettings
