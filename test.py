import re

with open('app.js', 'r') as f:
    content = f.read()

# Replace EQUIPMENT_CATEGORIES with dynamic catalog loading logic
new_catalog_logic = """
const DEFAULT_EQUIPMENT_CATALOG = [
    {
        id: 'group_mortar',
        name: '迫砲',
        items: [
            { id: 'eq_m1', name: '60迫砲' },
            { id: 'eq_m2', name: 'T75式81迫砲' },
            { id: 'eq_m3', name: 'M29A1式81迫砲' },
            { id: 'eq_m4', name: '120迫砲' },
            { id: 'eq_m5', name: 'M42迫砲' }
        ]
    },
    {
        id: 'group_howitzer',
        name: '榴砲',
        items: [
            { id: 'eq_h1', name: '105榴砲' },
            { id: 'eq_h2', name: '155榴砲' },
            { id: 'eq_h3', name: '8吋榴砲' },
            { id: 'eq_h4', name: 'M240榴砲' },
            { id: 'eq_h5', name: '155加農砲' }
        ]
    },
    {
        id: 'group_autocannon',
        name: '機砲',
        items: [
            { id: 'eq_a1', name: 'T82T式20機砲（牽引式）' },
            { id: 'eq_a2', name: 'T82F式20機砲（固定式）' }
        ]
    }
];

let currentEquipmentCatalog = [];

// Equipment Settings UI
const equipmentSettingsContent = document.getElementById('equipmentSettingsContent');
const addEquipmentGroupBtn = document.getElementById('addEquipmentGroupBtn');

function loadEquipmentCatalog() {
    if (currentUser && currentUser.isGuest) {
        const saved = localStorage.getItem('guest_equipment_catalog');
        if (saved) {
            try {
                currentEquipmentCatalog = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse guest equipment catalog', e);
                currentEquipmentCatalog = JSON.parse(JSON.stringify(DEFAULT_EQUIPMENT_CATALOG));
            }
        } else {
            currentEquipmentCatalog = JSON.parse(JSON.stringify(DEFAULT_EQUIPMENT_CATALOG));
            saveEquipmentCatalog();
        }
        initEquipmentUI();
        renderEquipmentSettings();
    } else if (currentUser) {
        // Will be loaded via fetchUserSettings
    }
}

async function saveEquipmentCatalog() {
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
}
"""

content = re.sub(
    r"const EQUIPMENT_CATEGORIES = \{[\s\S]*?\};\n",
    new_catalog_logic,
    content
)

with open('app.js', 'w') as f:
    f.write(content)
