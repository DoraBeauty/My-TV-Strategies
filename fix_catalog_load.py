import re

with open('app.js', 'r') as f:
    content = f.read()

# I see it's called `loadSettings`!
# Let's add equipmentCatalog loading there.
load_settings_replacement = """const loadSettings = async () => {
    // 1. Load from localStorage
    const localStr = localStorage.getItem('userSettings');
    if (localStr) {
        try {
            userSettings = { ...userSettings, ...JSON.parse(localStr) };
        } catch (e) { console.error('Failed to parse local settings'); }
    }
    const localCatalog = localStorage.getItem('guest_equipment_catalog');
    if (localCatalog) {
        try { currentEquipmentCatalog = JSON.parse(localCatalog); } catch(e) { }
    }

    // 2. Overwrite with Cloud Sync if logged in
    if (window.firebaseData && window.firebaseData.currentUser && !(currentUser && currentUser.isGuest)) {
        try {
            const { db, doc, getDoc } = window.firebaseData;
            const docSnap = await getDoc(doc(db, "userSettings", window.firebaseData.currentUser.uid));
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.hsrKm !== undefined) userSettings.hsrKm = data.hsrKm;
                if (data.busKm !== undefined) userSettings.busKm = data.busKm;
                localStorage.setItem('userSettings', JSON.stringify(userSettings)); // sync to local

                if (data.equipmentCatalog) {
                    currentEquipmentCatalog = data.equipmentCatalog;
                    localStorage.setItem('guest_equipment_catalog', JSON.stringify(currentEquipmentCatalog));
                }
            }
        } catch(error) {
            console.error("Error loading settings from Firestore:", error);
        }
    }

    if (!currentEquipmentCatalog || currentEquipmentCatalog.length === 0) {
        currentEquipmentCatalog = JSON.parse(JSON.stringify(DEFAULT_EQUIPMENT_CATALOG));
        saveEquipmentCatalog();
    }

    if (settingHsrKm) settingHsrKm.value = userSettings.hsrKm;
    if (settingBusKm) settingBusKm.value = userSettings.busKm;
    updateSettingsUI();

    initEquipmentUI();
    renderEquipmentSettings();
};"""

content = re.sub(
    r"const loadSettings = async \(\) => \{[\s\S]*?updateSettingsUI\(\);\n\};",
    load_settings_replacement,
    content
)

with open('app.js', 'w') as f:
    f.write(content)
