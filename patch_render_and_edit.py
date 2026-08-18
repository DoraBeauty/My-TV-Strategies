import sys

def patch_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update List View Rendering (detailsHtml & receiptsHtml)
    # Search for detailsHtml += `<div class="text-muted small">駕駛：${escapeHtml(record.driver === 'self' ? '自己' : record.driver)} (里程: ${record.mileage || 0}km)</div>`;
    render_old = '''    let detailsHtml = '';
    if (record.leader) {
        detailsHtml += `<div class="text-muted small">帶隊官：${escapeHtml(record.leader)}</div>`;
    }
    if (record.transportType === 'car' || record.transportType === 'motorcycle') {
        detailsHtml += `<div class="text-muted small">駕駛：${escapeHtml(record.driver === 'self' ? '自己' : record.driver)} (里程: ${record.mileage || 0}km)</div>`;
    }'''

    render_new = '''    let detailsHtml = '';
    if (record.leader) {
        detailsHtml += `<div class="text-muted small">帶隊官：${escapeHtml(record.leader)}</div>`;
    }
    if (record.transportType === 'car' || record.transportType === 'motorcycle') {
        detailsHtml += `<div class="text-muted small">駕駛：${escapeHtml(record.driver === 'self' ? '自己' : record.driver)} (里程: ${record.mileage || 0}km)</div>`;
    }
    if (record.note && record.note !== "無自動路程費") {
        const notes = record.note.split('\\n');
        notes.forEach(n => {
            detailsHtml += `<div class="text-muted small">${escapeHtml(n)}</div>`;
        });
    }

    // Aggregate public transport types for display label
    let publicTransportStr = [];
    if (record.transportTypes) {
        if (record.transportTypes.includes('hsr')) publicTransportStr.push('高鐵');
        if (record.transportTypes.includes('bus')) publicTransportStr.push('客運');
    } else if (record.transportType === 'public') {
        publicTransportStr.push('大眾/其他'); // Legacy fallback
    }
    const ptLabel = publicTransportStr.length > 0 ? publicTransportStr.join('/') : '';
    const mainTypeLabel = typeMap[record.transportType] || '';

    // Combine labels
    let comboLabel = [mainTypeLabel, ptLabel].filter(Boolean).join(' + ');
    if (!comboLabel) comboLabel = '無';
    '''
    content = content.replace(render_old, render_new)

    # And replace the transportCost label
    content = content.replace("<span>交通費 (${typeMap[record.transportType] || '無'})</span><span>$${record.transportCost}</span>",
                              "<span>交通費 (${comboLabel})</span><span>$${record.transportCost}</span>")

    # Update receipt rendering to include tickets if available
    receipt_render_old = '''    if (record.receipts && record.receipts.length > 0) {
        receiptsHtml += `<div class="mt-2 pt-2 border-top" style="border-color: var(--border-color) !important;">`;
        record.receipts.forEach(r => {
            receiptsHtml += `<div class="d-flex justify-content-between text-muted small">
                <span><a href="${r.url}" target="_blank" class="text-decoration-none"><i class="bi bi-file-earmark-image me-1"></i>${escapeHtml(r.name)}</a></span>
                <span>$${r.price}</span>
            </div>`;
        });
        receiptsHtml += `</div>`;
    }'''

    receipt_render_new = '''    let allReceipts = [];
    if (record.receipts && record.receipts.length > 0) {
        allReceipts = [...record.receipts];
    }

    if (record.tickets) {
        if (record.tickets.hsr) {
            if (record.tickets.hsr.go.amount > 0 || record.tickets.hsr.go.url) allReceipts.push({ name: '高鐵去程', price: record.tickets.hsr.go.amount, url: record.tickets.hsr.go.imageUrl });
            if (record.tickets.hsr.return.amount > 0 || record.tickets.hsr.return.url) allReceipts.push({ name: '高鐵回程', price: record.tickets.hsr.return.amount, url: record.tickets.hsr.return.imageUrl });
        }
        if (record.tickets.bus) {
            if (record.tickets.bus.go.amount > 0 || record.tickets.bus.go.url) allReceipts.push({ name: '客運去程', price: record.tickets.bus.go.amount, url: record.tickets.bus.go.imageUrl });
            if (record.tickets.bus.return.amount > 0 || record.tickets.bus.return.url) allReceipts.push({ name: '客運回程', price: record.tickets.bus.return.amount, url: record.tickets.bus.return.imageUrl });
        }
    }

    if (allReceipts.length > 0) {
        receiptsHtml += `<div class="mt-2 pt-2 border-top" style="border-color: var(--border-color) !important;">`;
        allReceipts.forEach(r => {
            if (r.url) {
                receiptsHtml += `<div class="d-flex justify-content-between text-muted small">
                    <span><a href="${r.url}" target="_blank" class="text-decoration-none"><i class="bi bi-file-earmark-image me-1"></i>${escapeHtml(r.name)}</a></span>
                    <span>$${r.price}</span>
                </div>`;
            } else {
                receiptsHtml += `<div class="d-flex justify-content-between text-muted small">
                    <span>${escapeHtml(r.name)}</span>
                    <span>$${r.price}</span>
                </div>`;
            }
        });
        receiptsHtml += `</div>`;
    }'''
    content = content.replace(receipt_render_old, receipt_render_new)

    # 2. Update Edit Modal Logic
    edit_modal_old = '''    transportTypeSelect.value = record.transportType || '';

    updateDriverOptions();
    if (record.driver) driverSelect.value = record.driver;
    handleDriverChange();'''

    edit_modal_new = '''    // Handle Legacy 'public' type
    let mappedType = record.transportType || '';
    if (mappedType === 'public') mappedType = 'none';
    transportTypeSelect.value = mappedType;

    updateDriverOptions();
    if (record.driver) driverSelect.value = record.driver;
    handleDriverChange();

    // Handle HSR/Bus
    hsrCheckbox.checked = record.transportTypes && record.transportTypes.includes('hsr');
    busCheckbox.checked = record.transportTypes && record.transportTypes.includes('bus');

    // Clear thumbs & files
    ['hsrGoThumb', 'hsrReturnThumb', 'busGoThumb', 'busReturnThumb'].forEach(id => {
        const el = document.getElementById(id);
        el.innerHTML = '';
        el.dataset.url = '';
        el.dataset.path = '';
    });
    document.querySelectorAll('.hsr-go-file, .hsr-return-file, .bus-go-file, .bus-return-file').forEach(el => el.value = '');

    if (record.tickets) {
        if (record.tickets.hsr) {
            hsrGoPrice.value = record.tickets.hsr.go.amount || '';
            if (record.tickets.hsr.go.imageUrl) {
                document.getElementById('hsrGoThumb').innerHTML = `<img src="${record.tickets.hsr.go.imageUrl}" class="receipt-thumbnail mt-2">`;
                document.getElementById('hsrGoThumb').dataset.url = record.tickets.hsr.go.imageUrl;
                document.getElementById('hsrGoThumb').dataset.path = record.tickets.hsr.go.imagePath;
            }
            hsrReturnPrice.value = record.tickets.hsr.return.amount || '';
            if (record.tickets.hsr.return.imageUrl) {
                document.getElementById('hsrReturnThumb').innerHTML = `<img src="${record.tickets.hsr.return.imageUrl}" class="receipt-thumbnail mt-2">`;
                document.getElementById('hsrReturnThumb').dataset.url = record.tickets.hsr.return.imageUrl;
                document.getElementById('hsrReturnThumb').dataset.path = record.tickets.hsr.return.imagePath;
            }
        }
        if (record.tickets.bus) {
            busGoPrice.value = record.tickets.bus.go.amount || '';
            if (record.tickets.bus.go.imageUrl) {
                document.getElementById('busGoThumb').innerHTML = `<img src="${record.tickets.bus.go.imageUrl}" class="receipt-thumbnail mt-2">`;
                document.getElementById('busGoThumb').dataset.url = record.tickets.bus.go.imageUrl;
                document.getElementById('busGoThumb').dataset.path = record.tickets.bus.go.imagePath;
            }
            busReturnPrice.value = record.tickets.bus.return.amount || '';
            if (record.tickets.bus.return.imageUrl) {
                document.getElementById('busReturnThumb').innerHTML = `<img src="${record.tickets.bus.return.imageUrl}" class="receipt-thumbnail mt-2">`;
                document.getElementById('busReturnThumb').dataset.url = record.tickets.bus.return.imageUrl;
                document.getElementById('busReturnThumb').dataset.path = record.tickets.bus.return.imagePath;
            }
        }
    } else {
        hsrGoPrice.value = ''; hsrReturnPrice.value = '';
        busGoPrice.value = ''; busReturnPrice.value = '';
    }

    // Manually trigger events to show/hide sections
    hsrCheckbox.dispatchEvent(new Event('change'));
    busCheckbox.dispatchEvent(new Event('change'));
    '''
    content = content.replace(edit_modal_old, edit_modal_new)


    # 3. Handle modal open without editing (reset checkboxes)
    reset_modal_old = '''    recordIdInput.value = '';
    form.reset();
    timeCalcHint.innerHTML = "請輸入起訖時間計算雜費";
    delete allowanceInput.dataset.manualOverride;

    companionsContainer.innerHTML = '';
    for(let i=1; i<=3; i++) {
        companionsContainer.appendChild(createCompanionInput('', i));
    }

    receiptsContainer.innerHTML = '';'''

    reset_modal_new = '''    recordIdInput.value = '';
    form.reset();
    timeCalcHint.innerHTML = "請輸入起訖時間計算雜費";
    delete allowanceInput.dataset.manualOverride;

    companionsContainer.innerHTML = '';
    for(let i=1; i<=3; i++) {
        companionsContainer.appendChild(createCompanionInput('', i));
    }

    receiptsContainer.innerHTML = '';

    hsrCheckbox.checked = false;
    busCheckbox.checked = false;
    hsrCheckbox.dispatchEvent(new Event('change'));
    busCheckbox.dispatchEvent(new Event('change'));
    ['hsrGoThumb', 'hsrReturnThumb', 'busGoThumb', 'busReturnThumb'].forEach(id => {
        const el = document.getElementById(id);
        el.innerHTML = '';
        el.dataset.url = '';
        el.dataset.path = '';
    });
    recordNote.value = '';'''
    content = content.replace(reset_modal_old, reset_modal_new)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

patch_file('app.js')
