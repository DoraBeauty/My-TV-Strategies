import sys

def patch_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update saveRecordBtn logic
    save_logic_old = '''        // Process Receipts
        const receipts = [];
        const receiptEls = document.querySelectorAll('#receiptsContainer .receipt-item');
        for (const el of receiptEls) {
            const name = el.querySelector('.receipt-name').value;
            const price = parseFloat(el.querySelector('.receipt-price').value) || 0;
            const fileInput = el.querySelector('.receipt-file');

            let path = el.querySelector('.receipt-old-path') ? el.querySelector('.receipt-old-path').value : null;
            let url = el.querySelector('.receipt-old-url') ? el.querySelector('.receipt-old-url').value : null;

            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                const filename = `receipts/${currentUser.uid}/${Date.now()}_${file.name}`;
                const storageRef = ref(storage, filename);
                await withTimeout(uploadBytes(storageRef, file), 15000, '圖片上傳逾時，請檢查網路狀態或 Firebase Storage 規則');
                url = await getDownloadURL(storageRef);
                path = filename;
            }

            receipts.push({ name, price, path, url });
        }

        const totalVal = parseInt(totalAmountInput.value);

        const recordData = {
            userId: currentUser.uid,
            tripName,
            location,
            visitingUnit,
            startTime: startVal,
            endTime: endVal,
            allowance: allowanceVal,
            leader: leaderVal,
            companions,
            transportType: transportTypeVal,
            driver,
            mileage: mileageVal,
            transportCost: transportCostVal,
            receipts,
            totalAmount: totalVal,
        };'''

    save_logic_new = '''        // Helper for file upload
        const uploadFileIfPresent = async (fileInput, oldPath, oldUrl) => {
            if (fileInput && fileInput.files.length > 0) {
                const file = fileInput.files[0];
                const filename = `receipts/${currentUser.uid}/${Date.now()}_${file.name}`;
                const storageRef = ref(storage, filename);
                await withTimeout(uploadBytes(storageRef, file), 15000, '圖片上傳逾時，請檢查網路狀態或 Firebase Storage 規則');
                const url = await getDownloadURL(storageRef);
                return { path: filename, url: url };
            }
            return { path: oldPath || null, url: oldUrl || null };
        };

        // Process Receipts
        const receipts = [];
        const receiptEls = document.querySelectorAll('#receiptsContainer .receipt-item');
        for (const el of receiptEls) {
            const name = el.querySelector('.receipt-name').value;
            const price = parseFloat(el.querySelector('.receipt-price').value) || 0;
            const fileInput = el.querySelector('.receipt-file');
            let oldPath = el.querySelector('.receipt-old-path') ? el.querySelector('.receipt-old-path').value : null;
            let oldUrl = el.querySelector('.receipt-old-url') ? el.querySelector('.receipt-old-url').value : null;

            const uploaded = await uploadFileIfPresent(fileInput, oldPath, oldUrl);
            receipts.push({ name, price, path: uploaded.path, url: uploaded.url });
        }

        // Process HSR/Bus Tickets
        let transportTypes = [];
        if (hsrCheckbox.checked) transportTypes.push('hsr');
        if (busCheckbox.checked) transportTypes.push('bus');

        let tickets = {
            hsr: {
                go: { amount: parseFloat(hsrGoPrice.value) || 0, imageUrl: document.getElementById('hsrGoThumb').dataset.url || null, imagePath: document.getElementById('hsrGoThumb').dataset.path || null },
                return: { amount: parseFloat(hsrReturnPrice.value) || 0, imageUrl: document.getElementById('hsrReturnThumb').dataset.url || null, imagePath: document.getElementById('hsrReturnThumb').dataset.path || null },
                routeFee: routeSettings.hsr.fee,
                routeKmRoundTrip: routeSettings.hsr.roundTripKm
            },
            bus: {
                go: { amount: parseFloat(busGoPrice.value) || 0, imageUrl: document.getElementById('busGoThumb').dataset.url || null, imagePath: document.getElementById('busGoThumb').dataset.path || null },
                return: { amount: parseFloat(busReturnPrice.value) || 0, imageUrl: document.getElementById('busReturnThumb').dataset.url || null, imagePath: document.getElementById('busReturnThumb').dataset.path || null },
                routeFee: routeSettings.bus.fee,
                routeKmRoundTrip: routeSettings.bus.roundTripKm
            }
        };

        if (hsrCheckbox.checked) {
            const hsrGoUploaded = await uploadFileIfPresent(document.querySelector('.hsr-go-file'), tickets.hsr.go.imagePath, tickets.hsr.go.imageUrl);
            tickets.hsr.go.imageUrl = hsrGoUploaded.url; tickets.hsr.go.imagePath = hsrGoUploaded.path;

            const hsrReturnUploaded = await uploadFileIfPresent(document.querySelector('.hsr-return-file'), tickets.hsr.return.imagePath, tickets.hsr.return.imageUrl);
            tickets.hsr.return.imageUrl = hsrReturnUploaded.url; tickets.hsr.return.imagePath = hsrReturnUploaded.path;

            transportCostVal += tickets.hsr.routeFee;
        }

        if (busCheckbox.checked) {
            const busGoUploaded = await uploadFileIfPresent(document.querySelector('.bus-go-file'), tickets.bus.go.imagePath, tickets.bus.go.imageUrl);
            tickets.bus.go.imageUrl = busGoUploaded.url; tickets.bus.go.imagePath = busGoUploaded.path;

            const busReturnUploaded = await uploadFileIfPresent(document.querySelector('.bus-return-file'), tickets.bus.return.imagePath, tickets.bus.return.imageUrl);
            tickets.bus.return.imageUrl = busReturnUploaded.url; tickets.bus.return.imagePath = busReturnUploaded.path;

            transportCostVal += tickets.bus.routeFee;
        }

        const totalVal = parseInt(totalAmountInput.value);

        const recordData = {
            userId: currentUser.uid,
            tripName,
            location,
            visitingUnit,
            startTime: startVal,
            endTime: endVal,
            allowance: allowanceVal,
            leader: leaderVal,
            companions,
            transportType: transportTypeVal,
            driver,
            mileage: mileageVal,
            transportCost: transportCostVal,
            receipts,
            totalAmount: totalVal,
            transportTypes,
            tickets,
            note: recordNote.value
        };'''

    content = content.replace(save_logic_old, save_logic_new)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

patch_file('app.js')
