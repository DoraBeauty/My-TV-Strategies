import re

with open('app.js', 'r') as f:
    content = f.read()

# Make sure saveEquipmentCatalog gets the right db from firebaseData
content = content.replace(
"""async function saveEquipmentCatalog() {
    if (currentUser && currentUser.isGuest) {
        localStorage.setItem('guest_equipment_catalog', JSON.stringify(currentEquipmentCatalog));
    } else if (currentUser) {
        try {
            const userRef = doc(db, 'userSettings', currentUser.uid);
            await setDoc(userRef, { equipmentCatalog: currentEquipmentCatalog }, { merge: true });
        } catch (error) {
            console.error('Error saving equipment catalog:', error);
            alert('儲存裝備設定失敗，請稍後再試。');
        }
    }
    initEquipmentUI();
    renderEquipmentSettings();
}""",
"""async function saveEquipmentCatalog() {
    if (currentUser && currentUser.isGuest) {
        localStorage.setItem('guest_equipment_catalog', JSON.stringify(currentEquipmentCatalog));
    } else if (currentUser) {
        try {
            const { db, doc, setDoc } = window.firebaseData;
            const userRef = doc(db, 'userSettings', currentUser.uid);
            await setDoc(userRef, { equipmentCatalog: currentEquipmentCatalog }, { merge: true });
        } catch (error) {
            console.error('Error saving equipment catalog:', error);
            alert('儲存裝備設定失敗，請稍後再試。');
        }
    }
    initEquipmentUI();
    renderEquipmentSettings();
}"""
)

with open('app.js', 'w') as f:
    f.write(content)
