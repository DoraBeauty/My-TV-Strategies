import sys

def patch_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Route settings logic
    settings_code = '''
// --- Route Settings ---
const defaultSettings = {
    hsr: { km: 20, roundTripKm: 40, fee: 120 },
    bus: { km: 10, roundTripKm: 20, fee: 60 }
};

let routeSettings = JSON.parse(localStorage.getItem('routeSettings')) || defaultSettings;

const settingHsrKm = document.getElementById('settingHsrKm');
const settingHsrRoundTrip = document.getElementById('settingHsrRoundTrip');
const settingHsrFee = document.getElementById('settingHsrFee');

const settingBusKm = document.getElementById('settingBusKm');
const settingBusRoundTrip = document.getElementById('settingBusRoundTrip');
const settingBusFee = document.getElementById('settingBusFee');

const saveRouteSettingsBtn = document.getElementById('saveRouteSettingsBtn');

function updateSettingsDisplay() {
    const hsrKm = parseFloat(settingHsrKm.value) || 0;
    const hsrRt = hsrKm * 2;
    settingHsrRoundTrip.textContent = hsrRt;
    settingHsrFee.textContent = hsrRt * 3;

    const busKm = parseFloat(settingBusKm.value) || 0;
    const busRt = busKm * 2;
    settingBusRoundTrip.textContent = busRt;
    settingBusFee.textContent = busRt * 3;
}

if(settingHsrKm) settingHsrKm.addEventListener('input', updateSettingsDisplay);
if(settingBusKm) settingBusKm.addEventListener('input', updateSettingsDisplay);

if (saveRouteSettingsBtn) {
    saveRouteSettingsBtn.addEventListener('click', () => {
        const hsrKm = parseFloat(settingHsrKm.value) || 0;
        const busKm = parseFloat(settingBusKm.value) || 0;

        if (hsrKm < 0 || busKm < 0) {
            alert('距離不可為負數');
            return;
        }

        routeSettings = {
            hsr: { km: hsrKm, roundTripKm: hsrKm * 2, fee: hsrKm * 2 * 3 },
            bus: { km: busKm, roundTripKm: busKm * 2, fee: busKm * 2 * 3 }
        };

        try {
            localStorage.setItem('routeSettings', JSON.stringify(routeSettings));

            // Close modal
            const modalEl = document.getElementById('routeSettingsModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();

            calculateTotal(); // Trigger recalculation in case modal was opened from record form
        } catch (e) {
            alert('儲存設定失敗：' + e.message);
        }
    });
}

// Initialize Settings UI when modal opens
document.getElementById('routeSettingsModal')?.addEventListener('show.bs.modal', () => {
    settingHsrKm.value = routeSettings.hsr.km;
    settingBusKm.value = routeSettings.bus.km;
    updateSettingsDisplay();
});
'''

    # Find a good place to insert the settings code (e.g., right before form elements logic)
    insert_point = "// Form Elements"
    content = content.replace(insert_point, settings_code + '\n' + insert_point)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

patch_file('app.js')
