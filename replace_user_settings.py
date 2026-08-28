import re

with open('app.js', 'r') as f:
    content = f.read()

# Ah! It's called loadRouteSettings, not fetchUserSettings!
content = content.replace(
"""const loadRouteSettings = async () => {
    const { doc, getDoc, currentUser, setDoc, db } = window.firebaseData;
    if (!currentUser) return;

    if (currentUser.isGuest) {
        const saved = localStorage.getItem('guest_route_settings');
        if (saved) {
            userSettings = JSON.parse(saved);
        }
    } else {
        const userRef = doc(db, 'userSettings', currentUser.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists() && docSnap.data().routeSettings) {
            userSettings = docSnap.data().routeSettings;
        }
    }

    if (settingHsrKm) settingHsrKm.value = userSettings.hsrKm;
    if (settingBusKm) settingBusKm.value = userSettings.busKm;
    updateSettingsUI();
};""",
"""const loadRouteSettings = async () => {
    const { doc, getDoc, currentUser, setDoc, db } = window.firebaseData;
    if (!currentUser) return;

    if (currentUser.isGuest) {
        const saved = localStorage.getItem('guest_route_settings');
        if (saved) {
            userSettings = JSON.parse(saved);
        }
        const savedCatalog = localStorage.getItem('guest_equipment_catalog');
        if (savedCatalog) {
            try { currentEquipmentCatalog = JSON.parse(savedCatalog); }
            catch(e) { currentEquipmentCatalog = JSON.parse(JSON.stringify(DEFAULT_EQUIPMENT_CATALOG)); }
        } else {
            currentEquipmentCatalog = JSON.parse(JSON.stringify(DEFAULT_EQUIPMENT_CATALOG));
        }
    } else {
        const userRef = doc(db, 'userSettings', currentUser.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.routeSettings) userSettings = data.routeSettings;
            if (data.equipmentCatalog) {
                currentEquipmentCatalog = data.equipmentCatalog;
            } else {
                currentEquipmentCatalog = JSON.parse(JSON.stringify(DEFAULT_EQUIPMENT_CATALOG));
            }
        } else {
            currentEquipmentCatalog = JSON.parse(JSON.stringify(DEFAULT_EQUIPMENT_CATALOG));
        }
    }

    if (settingHsrKm) settingHsrKm.value = userSettings.hsrKm;
    if (settingBusKm) settingBusKm.value = userSettings.busKm;
    updateSettingsUI();
    initEquipmentUI();
    renderEquipmentSettings();
};"""
)

with open('app.js', 'w') as f:
    f.write(content)
