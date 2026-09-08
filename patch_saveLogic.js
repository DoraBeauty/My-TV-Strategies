const fs = require('fs');

let content = fs.readFileSync('app.js', 'utf8');

const saveLogicOld = `        // Process HSR/Bus Tickets
        let transportTypes = [];
        if (hsrRadio.checked) transportTypes.push('hsr');
        if (busRadio.checked) transportTypes.push('bus');

        const currentRouteFees = getRouteFees();

        let tickets = {
            hsr: null,
            bus: null
        };

        if (hsrRadio.checked || hsrGoPrice.value !== '' || hsrReturnPrice.value !== '' || document.getElementById('hsrGoThumb').dataset.url || document.getElementById('hsrReturnThumb').dataset.url) {
            tickets.hsr = {
                go: { amount: hsrGoPrice.value !== '' ? parseFloat(hsrGoPrice.value) : null, imageUrl: document.getElementById('hsrGoThumb').dataset.url || null, imagePath: document.getElementById('hsrGoThumb').dataset.path || null },
                return: { amount: hsrReturnPrice.value !== '' ? parseFloat(hsrReturnPrice.value) : null, imageUrl: document.getElementById('hsrReturnThumb').dataset.url || null, imagePath: document.getElementById('hsrReturnThumb').dataset.path || null },
                routeFee: currentRouteFees.hsr.fee,
                routeKmRoundTrip: currentRouteFees.hsr.roundTripKm
            };
        }

        if (busRadio.checked || busGoPrice.value !== '' || busReturnPrice.value !== '' || document.getElementById('busGoThumb').dataset.url || document.getElementById('busReturnThumb').dataset.url) {
            tickets.bus = {
                go: { amount: busGoPrice.value !== '' ? parseFloat(busGoPrice.value) : null, imageUrl: document.getElementById('busGoThumb').dataset.url || null, imagePath: document.getElementById('busGoThumb').dataset.path || null },
                return: { amount: busReturnPrice.value !== '' ? parseFloat(busReturnPrice.value) : null, imageUrl: document.getElementById('busReturnThumb').dataset.url || null, imagePath: document.getElementById('busReturnThumb').dataset.path || null },
                routeFee: currentRouteFees.bus.fee,
                routeKmRoundTrip: currentRouteFees.bus.roundTripKm
            };
        }`;

const saveLogicNew = `        // Process HSR/Bus Tickets
        let transportTypes = [];
        let tickets = {
            hsr: null,
            bus: null
        };

        if (transportTypeVal === 'public') {
            if (hsrRadio.checked) transportTypes.push('hsr');
            if (busRadio.checked) transportTypes.push('bus');

            const currentRouteFees = getRouteFees();

            if (hsrRadio.checked || hsrGoPrice.value !== '' || hsrReturnPrice.value !== '' || document.getElementById('hsrGoThumb').dataset.url || document.getElementById('hsrReturnThumb').dataset.url) {
                tickets.hsr = {
                    go: { amount: hsrGoPrice.value !== '' ? parseFloat(hsrGoPrice.value) : null, imageUrl: document.getElementById('hsrGoThumb').dataset.url || null, imagePath: document.getElementById('hsrGoThumb').dataset.path || null },
                    return: { amount: hsrReturnPrice.value !== '' ? parseFloat(hsrReturnPrice.value) : null, imageUrl: document.getElementById('hsrReturnThumb').dataset.url || null, imagePath: document.getElementById('hsrReturnThumb').dataset.path || null },
                    routeFee: currentRouteFees.hsr.fee,
                    routeKmRoundTrip: currentRouteFees.hsr.roundTripKm
                };
            }

            if (busRadio.checked || busGoPrice.value !== '' || busReturnPrice.value !== '' || document.getElementById('busGoThumb').dataset.url || document.getElementById('busReturnThumb').dataset.url) {
                tickets.bus = {
                    go: { amount: busGoPrice.value !== '' ? parseFloat(busGoPrice.value) : null, imageUrl: document.getElementById('busGoThumb').dataset.url || null, imagePath: document.getElementById('busGoThumb').dataset.path || null },
                    return: { amount: busReturnPrice.value !== '' ? parseFloat(busReturnPrice.value) : null, imageUrl: document.getElementById('busReturnThumb').dataset.url || null, imagePath: document.getElementById('busReturnThumb').dataset.path || null },
                    routeFee: currentRouteFees.bus.fee,
                    routeKmRoundTrip: currentRouteFees.bus.roundTripKm
                };
            }
        }`;

if (content.includes(saveLogicOld)) {
    content = content.replace(saveLogicOld, saveLogicNew);
    fs.writeFileSync('app.js', content);
    console.log("Successfully patched save logic part 1");
} else {
    console.log("Could not find Old content in save logic part 1");
}
