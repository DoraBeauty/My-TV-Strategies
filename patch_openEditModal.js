const fs = require('fs');

let content = fs.readFileSync('app.js', 'utf8');

const openEditModalOld = `    // Handle public transit selections & tickets without triggering event listeners that clear them
    let transportTypes = record.transportTypes || [];

    // Legacy fallback inference if transportTypes is empty but tickets exist
    if (transportTypes.length === 0 && record.tickets) {
        if (record.tickets.hsr && ((record.tickets.hsr.go && (record.tickets.hsr.go.amount !== undefined && record.tickets.hsr.go.amount !== null || record.tickets.hsr.go.imageUrl)) || (record.tickets.hsr.return && (record.tickets.hsr.return.amount !== undefined && record.tickets.hsr.return.amount !== null || record.tickets.hsr.return.imageUrl)))) {
            transportTypes.push('hsr');
        }
        if (record.tickets.bus && ((record.tickets.bus.go && (record.tickets.bus.go.amount !== undefined && record.tickets.bus.go.amount !== null || record.tickets.bus.go.imageUrl)) || (record.tickets.bus.return && (record.tickets.bus.return.amount !== undefined && record.tickets.bus.return.amount !== null || record.tickets.bus.return.imageUrl)))) {
            transportTypes.push('bus');
        }
    }

    // Set checkboxes and show sections manually
    hsrRadio.checked = transportTypes.includes('hsr');
    busRadio.checked = transportTypes.includes('bus');

    if (hsrRadio.checked) hsrSection.classList.add('show');
    else hsrSection.classList.remove('show');

    if (busRadio.checked) busSection.classList.add('show');
    else busSection.classList.remove('show');

    clearPublicTransitBtn.style.display = (hsrRadio.checked || busRadio.checked) ? 'inline-block' : 'none';`;

const openEditModalNew = `    // Handle public transit selections & tickets without triggering event listeners that clear them
    let transportTypes = [];
    if (record.transportType === 'public') {
        transportTypes = record.transportTypes || [];

        // Legacy fallback inference if transportTypes is empty but tickets exist
        if (transportTypes.length === 0 && record.tickets) {
            if (record.tickets.hsr && ((record.tickets.hsr.go && (record.tickets.hsr.go.amount !== undefined && record.tickets.hsr.go.amount !== null || record.tickets.hsr.go.imageUrl)) || (record.tickets.hsr.return && (record.tickets.hsr.return.amount !== undefined && record.tickets.hsr.return.amount !== null || record.tickets.hsr.return.imageUrl)))) {
                transportTypes.push('hsr');
            }
            if (record.tickets.bus && ((record.tickets.bus.go && (record.tickets.bus.go.amount !== undefined && record.tickets.bus.go.amount !== null || record.tickets.bus.go.imageUrl)) || (record.tickets.bus.return && (record.tickets.bus.return.amount !== undefined && record.tickets.bus.return.amount !== null || record.tickets.bus.return.imageUrl)))) {
                transportTypes.push('bus');
            }
        }
    }

    // Set checkboxes and show sections manually
    hsrRadio.checked = transportTypes.includes('hsr');
    busRadio.checked = transportTypes.includes('bus');

    if (hsrRadio.checked) hsrSection.classList.add('show');
    else hsrSection.classList.remove('show');

    if (busRadio.checked) busSection.classList.add('show');
    else busSection.classList.remove('show');

    clearPublicTransitBtn.style.display = (hsrRadio.checked || busRadio.checked) ? 'inline-block' : 'none';`;

if (content.includes(openEditModalOld)) {
    content = content.replace(openEditModalOld, openEditModalNew);
    fs.writeFileSync('app.js', content);
    console.log("Successfully patched openEditModal() part 1");
} else {
    console.log("Could not find Old content in openEditModal part 1");
}

let content2 = fs.readFileSync('app.js', 'utf8');
const openEditModalOld2 = `    if (record.tickets) {
        if (record.tickets.hsr) {
            setupTicketUI(record.tickets.hsr.go, 'hsrGoPrice', 'hsrGoThumb');
            setupTicketUI(record.tickets.hsr.return, 'hsrReturnPrice', 'hsrReturnThumb');
        } else {
            setupTicketUI(null, 'hsrGoPrice', 'hsrGoThumb');
            setupTicketUI(null, 'hsrReturnPrice', 'hsrReturnThumb');
        }
        if (record.tickets.bus) {
            setupTicketUI(record.tickets.bus.go, 'busGoPrice', 'busGoThumb');
            setupTicketUI(record.tickets.bus.return, 'busReturnPrice', 'busReturnThumb');
        } else {
            setupTicketUI(null, 'busGoPrice', 'busGoThumb');
            setupTicketUI(null, 'busReturnPrice', 'busReturnThumb');
        }
    } else {
        setupTicketUI(null, 'hsrGoPrice', 'hsrGoThumb');
        setupTicketUI(null, 'hsrReturnPrice', 'hsrReturnThumb');
        setupTicketUI(null, 'busGoPrice', 'busGoThumb');
        setupTicketUI(null, 'busReturnPrice', 'busReturnThumb');
    }`;

const openEditModalNew2 = `    if (record.transportType === 'public' && record.tickets) {
        if (record.tickets.hsr) {
            setupTicketUI(record.tickets.hsr.go, 'hsrGoPrice', 'hsrGoThumb');
            setupTicketUI(record.tickets.hsr.return, 'hsrReturnPrice', 'hsrReturnThumb');
        } else {
            setupTicketUI(null, 'hsrGoPrice', 'hsrGoThumb');
            setupTicketUI(null, 'hsrReturnPrice', 'hsrReturnThumb');
        }
        if (record.tickets.bus) {
            setupTicketUI(record.tickets.bus.go, 'busGoPrice', 'busGoThumb');
            setupTicketUI(record.tickets.bus.return, 'busReturnPrice', 'busReturnThumb');
        } else {
            setupTicketUI(null, 'busGoPrice', 'busGoThumb');
            setupTicketUI(null, 'busReturnPrice', 'busReturnThumb');
        }
    } else {
        setupTicketUI(null, 'hsrGoPrice', 'hsrGoThumb');
        setupTicketUI(null, 'hsrReturnPrice', 'hsrReturnThumb');
        setupTicketUI(null, 'busGoPrice', 'busGoThumb');
        setupTicketUI(null, 'busReturnPrice', 'busReturnThumb');
    }`;

if (content2.includes(openEditModalOld2)) {
    content2 = content2.replace(openEditModalOld2, openEditModalNew2);
    fs.writeFileSync('app.js', content2);
    console.log("Successfully patched openEditModal() part 2");
} else {
    console.log("Could not find Old content in openEditModal part 2");
}
