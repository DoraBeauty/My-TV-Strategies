const fs = require('fs');

let content = fs.readFileSync('app.js', 'utf8');

const calculateTotalOld = `    if (type === 'public') {
        if (hsrRadio.checked) {
            transportCost += parseFloat(hsrGoPrice.value) || 0;
            transportCost += parseFloat(hsrReturnPrice.value) || 0;
            transportCost += (routeFees.hsr.fee || 0);
            notesArr.push(\`已含高鐵路程費 \${routeFees.hsr.fee}（來回\${routeFees.hsr.roundTripKm}km）\`);
        }
        if (busRadio.checked) {
            transportCost += parseFloat(busGoPrice.value) || 0;
            transportCost += parseFloat(busReturnPrice.value) || 0;
            transportCost += (routeFees.bus.fee || 0);
            notesArr.push(\`已含客運路程費 \${routeFees.bus.fee}（來回\${routeFees.bus.roundTripKm}km）\`);
        }
    }`;

const calculateTotalNew = `    if (type === 'public') {
        if (hsrRadio.checked) {
            transportCost += parseFloat(hsrGoPrice.value) || 0;
            transportCost += parseFloat(hsrReturnPrice.value) || 0;
            transportCost += (routeFees.hsr.fee || 0);
            notesArr.push(\`已含高鐵路程費 $\${routeFees.hsr.fee}（來回\${routeFees.hsr.roundTripKm}km）\`);
        }
        if (busRadio.checked) {
            transportCost += parseFloat(busGoPrice.value) || 0;
            transportCost += parseFloat(busReturnPrice.value) || 0;
            transportCost += (routeFees.bus.fee || 0);
            notesArr.push(\`已含客運路程費 $\${routeFees.bus.fee}（來回\${routeFees.bus.roundTripKm}km）\`);
        }
    }`;

if (content.includes(calculateTotalOld)) {
    content = content.replace(calculateTotalOld, calculateTotalNew);
    fs.writeFileSync('app.js', content);
    console.log("Successfully patched calculateTotal() fix");
} else {
    console.log("Could not find Old content in calculateTotal fix");
}
