import sys

def patch_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Fix typo in render logic (url -> imageUrl)
    render_old = '''    if (record.tickets) {
        if (record.tickets.hsr) {
            if (record.tickets.hsr.go.amount > 0 || record.tickets.hsr.go.url) allReceipts.push({ name: '高鐵去程', price: record.tickets.hsr.go.amount, url: record.tickets.hsr.go.imageUrl });
            if (record.tickets.hsr.return.amount > 0 || record.tickets.hsr.return.url) allReceipts.push({ name: '高鐵回程', price: record.tickets.hsr.return.amount, url: record.tickets.hsr.return.imageUrl });
        }
        if (record.tickets.bus) {
            if (record.tickets.bus.go.amount > 0 || record.tickets.bus.go.url) allReceipts.push({ name: '客運去程', price: record.tickets.bus.go.amount, url: record.tickets.bus.go.imageUrl });
            if (record.tickets.bus.return.amount > 0 || record.tickets.bus.return.url) allReceipts.push({ name: '客運回程', price: record.tickets.bus.return.amount, url: record.tickets.bus.return.imageUrl });
        }
    }'''

    render_new = '''    if (record.tickets) {
        if (record.tickets.hsr) {
            if (record.tickets.hsr.go.amount > 0 || record.tickets.hsr.go.imageUrl) allReceipts.push({ name: '高鐵去程', price: record.tickets.hsr.go.amount, url: record.tickets.hsr.go.imageUrl });
            if (record.tickets.hsr.return.amount > 0 || record.tickets.hsr.return.imageUrl) allReceipts.push({ name: '高鐵回程', price: record.tickets.hsr.return.amount, url: record.tickets.hsr.return.imageUrl });
        }
        if (record.tickets.bus) {
            if (record.tickets.bus.go.amount > 0 || record.tickets.bus.go.imageUrl) allReceipts.push({ name: '客運去程', price: record.tickets.bus.go.amount, url: record.tickets.bus.go.imageUrl });
            if (record.tickets.bus.return.amount > 0 || record.tickets.bus.return.imageUrl) allReceipts.push({ name: '客運回程', price: record.tickets.bus.return.amount, url: record.tickets.bus.return.imageUrl });
        }
    }'''
    content = content.replace(render_old, render_new)

    # 2. Fix state clearing on uncheck
    uncheck_old = '''hsrCheckbox.addEventListener('change', () => {
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
});'''

    uncheck_new = '''hsrCheckbox.addEventListener('change', () => {
    if (hsrCheckbox.checked) {
        hsrSection.classList.add('show');
    } else {
        hsrSection.classList.remove('show');
        hsrGoPrice.value = '';
        hsrReturnPrice.value = '';
        ['hsrGoThumb', 'hsrReturnThumb'].forEach(id => {
            const el = document.getElementById(id);
            el.innerHTML = '';
            el.dataset.url = '';
            el.dataset.path = '';
        });
        document.querySelectorAll('.hsr-go-file, .hsr-return-file').forEach(el => el.value = '');
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
        ['busGoThumb', 'busReturnThumb'].forEach(id => {
            const el = document.getElementById(id);
            el.innerHTML = '';
            el.dataset.url = '';
            el.dataset.path = '';
        });
        document.querySelectorAll('.bus-go-file, .bus-return-file').forEach(el => el.value = '');
    }
    calculateTotal();
});'''
    content = content.replace(uncheck_old, uncheck_new)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

patch_file('app.js')
