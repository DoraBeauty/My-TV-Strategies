import sys

def patch_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add form elements
    form_elements = '''const mileageRateHint = document.getElementById('mileageRateHint');

// HSR / Bus Form Elements
const hsrCheckbox = document.getElementById('hsrCheckbox');
const hsrSection = document.getElementById('hsrSection');
const hsrGoPrice = document.getElementById('hsrGoPrice');
const hsrReturnPrice = document.getElementById('hsrReturnPrice');

const busCheckbox = document.getElementById('busCheckbox');
const busSection = document.getElementById('busSection');
const busGoPrice = document.getElementById('busGoPrice');
const busReturnPrice = document.getElementById('busReturnPrice');

const recordNote = document.getElementById('recordNote');
'''
    content = content.replace("const mileageRateHint = document.getElementById('mileageRateHint');", form_elements)


    # 2. Checkbox event listeners
    checkbox_listeners = '''
hsrCheckbox.addEventListener('change', () => {
    if (hsrCheckbox.checked) {
        hsrSection.classList.add('show');
    } else {
        hsrSection.classList.remove('show');
        hsrGoPrice.value = '';
        hsrReturnPrice.value = '';
    }
    calculateTotal();
});

busCheckbox.addEventListener('change', () => {
    if (busCheckbox.checked) {
        busSection.classList.add('show');
    } else {
        busSection.classList.remove('show');
        busGoPrice.value = '';
        busReturnPrice.value = '';
    }
    calculateTotal();
});

[hsrGoPrice, hsrReturnPrice, busGoPrice, busReturnPrice].forEach(input => {
    if (input) input.addEventListener('input', calculateTotal);
});
'''

    insert_point = "transportTypeSelect.addEventListener('change', updateDriverOptions);"
    content = content.replace(insert_point, insert_point + '\n' + checkbox_listeners)

    # 3. Update calculateTotal()
    calc_total_old = '''function calculateTotal() {
    const allowance = parseFloat(allowanceInput.value) || 0;

    let transportCost = 0;
    const type = transportTypeSelect.value;
    if ((type === 'car' || type === 'motorcycle') && driverSelect.value === 'self') {
        const mileage = parseFloat(mileageInput.value) || 0;
        const rate = parseFloat(mileageInput.dataset.rate) || 0;
        transportCost = mileage * rate;
    }

    let receiptTotal = 0;
    document.querySelectorAll('.receipt-price').forEach(input => {
        receiptTotal += parseFloat(input.value) || 0;
    });

    const total = allowance + transportCost + receiptTotal;
    totalAmountInput.value = Math.round(total);
    totalAmountDisplay.textContent = Math.round(total);
}'''

    calc_total_new = '''function calculateTotal() {
    const allowance = parseFloat(allowanceInput.value) || 0;

    let transportCost = 0;
    const type = transportTypeSelect.value;
    if ((type === 'car' || type === 'motorcycle') && driverSelect.value === 'self') {
        const mileage = parseFloat(mileageInput.value) || 0;
        const rate = parseFloat(mileageInput.dataset.rate) || 0;
        transportCost += mileage * rate;
    }

    let publicTransportTickets = 0;
    let notesArr = [];

    if (hsrCheckbox.checked) {
        publicTransportTickets += parseFloat(hsrGoPrice.value) || 0;
        publicTransportTickets += parseFloat(hsrReturnPrice.value) || 0;
        transportCost += routeSettings.hsr.fee;
        notesArr.push(`已含高鐵路程費 $${routeSettings.hsr.fee}（來回${routeSettings.hsr.roundTripKm}km）`);
    }

    if (busCheckbox.checked) {
        publicTransportTickets += parseFloat(busGoPrice.value) || 0;
        publicTransportTickets += parseFloat(busReturnPrice.value) || 0;
        transportCost += routeSettings.bus.fee;
        notesArr.push(`已含客運路程費 $${routeSettings.bus.fee}（來回${routeSettings.bus.roundTripKm}km）`);
    }

    if (notesArr.length > 0) {
        recordNote.value = notesArr.join('\\n');
    } else {
        recordNote.value = "無自動路程費";
    }

    let receiptTotal = 0;
    document.querySelectorAll('.receipt-price').forEach(input => {
        receiptTotal += parseFloat(input.value) || 0;
    });

    const total = allowance + transportCost + publicTransportTickets + receiptTotal;
    totalAmountInput.value = Math.round(total);
    totalAmountDisplay.textContent = Math.round(total);
}'''

    content = content.replace(calc_total_old, calc_total_new)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

patch_file('app.js')
