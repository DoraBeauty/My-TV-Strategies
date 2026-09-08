const fs = require('fs');

let content = fs.readFileSync('app.js', 'utf8');

const updateDriverOptionsOld = `    if (type === 'none') {
        // Clear public transport selection
        radioLastChecked = null;
        hsrRadio.checked = false;
        busRadio.checked = false;
        hsrRadio.dispatchEvent(new Event('change'));
        busRadio.dispatchEvent(new Event('change'));
        clearPublicTransitBtn.style.display = 'none';

        // Clear driver/mileage
        driverSelect.value = 'self';
        mileageInput.value = '';

        return;
    } else if (type === 'public') {
        publicTransportSection.classList.add('show');

        // Clear driver/mileage
        driverSelect.value = 'self';
        mileageInput.value = '';
        return;
    } else if (type === 'car' || type === 'motorcycle') {
        // Clear public transport selection
        radioLastChecked = null;
        hsrRadio.checked = false;
        busRadio.checked = false;
        hsrRadio.dispatchEvent(new Event('change'));
        busRadio.dispatchEvent(new Event('change'));
        clearPublicTransitBtn.style.display = 'none';`;

const updateDriverOptionsNew = `    if (type === 'none') {
        // Clear public transport selection
        radioLastChecked = null;
        hsrRadio.checked = false;
        busRadio.checked = false;
        handlePublicTransitChange();
        clearPublicTransitBtn.style.display = 'none';

        // Clear driver/mileage
        driverSelect.value = 'self';
        mileageInput.value = '';

        return;
    } else if (type === 'public') {
        publicTransportSection.classList.add('show');

        // Clear driver/mileage
        driverSelect.value = 'self';
        mileageInput.value = '';
        return;
    } else if (type === 'car' || type === 'motorcycle') {
        // Clear public transport selection
        radioLastChecked = null;
        hsrRadio.checked = false;
        busRadio.checked = false;
        handlePublicTransitChange();
        clearPublicTransitBtn.style.display = 'none';`;

if (content.includes(updateDriverOptionsOld)) {
    content = content.replace(updateDriverOptionsOld, updateDriverOptionsNew);
    fs.writeFileSync('app.js', content);
    console.log("Successfully patched updateDriverOptions()");
} else {
    console.log("Could not find Old content in updateDriverOptions");
}
