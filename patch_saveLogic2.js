const fs = require('fs');

let content = fs.readFileSync('app.js', 'utf8');

const saveLogicOld = `        if (tickets.hsr) {
            const hsrGoUploaded = await uploadFileIfPresent(document.querySelector('.hsr-go-file'), tickets.hsr.go.imagePath, tickets.hsr.go.imageUrl);
            tickets.hsr.go.imageUrl = hsrGoUploaded.url; tickets.hsr.go.imagePath = hsrGoUploaded.path;

            const hsrReturnUploaded = await uploadFileIfPresent(document.querySelector('.hsr-return-file'), tickets.hsr.return.imagePath, tickets.hsr.return.imageUrl);
            tickets.hsr.return.imageUrl = hsrReturnUploaded.url; tickets.hsr.return.imagePath = hsrReturnUploaded.path;

            if (hsrRadio.checked) {
                transportCostVal += (tickets.hsr.routeFee || 0);
                transportCostVal += parseFloat(tickets.hsr.go.amount) || 0;
                transportCostVal += parseFloat(tickets.hsr.return.amount) || 0;
            }
        }

        if (tickets.bus) {
            const busGoUploaded = await uploadFileIfPresent(document.querySelector('.bus-go-file'), tickets.bus.go.imagePath, tickets.bus.go.imageUrl);
            tickets.bus.go.imageUrl = busGoUploaded.url; tickets.bus.go.imagePath = busGoUploaded.path;

            const busReturnUploaded = await uploadFileIfPresent(document.querySelector('.bus-return-file'), tickets.bus.return.imagePath, tickets.bus.return.imageUrl);
            tickets.bus.return.imageUrl = busReturnUploaded.url; tickets.bus.return.imagePath = busReturnUploaded.path;

            if (busRadio.checked) {
                transportCostVal += (tickets.bus.routeFee || 0);
                transportCostVal += parseFloat(tickets.bus.go.amount) || 0;
                transportCostVal += parseFloat(tickets.bus.return.amount) || 0;
            }
        }`;

const saveLogicNew = `        if (transportTypeVal === 'public') {
            if (tickets.hsr) {
                const hsrGoUploaded = await uploadFileIfPresent(document.querySelector('.hsr-go-file'), tickets.hsr.go.imagePath, tickets.hsr.go.imageUrl);
                tickets.hsr.go.imageUrl = hsrGoUploaded.url; tickets.hsr.go.imagePath = hsrGoUploaded.path;

                const hsrReturnUploaded = await uploadFileIfPresent(document.querySelector('.hsr-return-file'), tickets.hsr.return.imagePath, tickets.hsr.return.imageUrl);
                tickets.hsr.return.imageUrl = hsrReturnUploaded.url; tickets.hsr.return.imagePath = hsrReturnUploaded.path;

                if (hsrRadio.checked) {
                    transportCostVal += (tickets.hsr.routeFee || 0);
                    transportCostVal += parseFloat(tickets.hsr.go.amount) || 0;
                    transportCostVal += parseFloat(tickets.hsr.return.amount) || 0;
                }
            }

            if (tickets.bus) {
                const busGoUploaded = await uploadFileIfPresent(document.querySelector('.bus-go-file'), tickets.bus.go.imagePath, tickets.bus.go.imageUrl);
                tickets.bus.go.imageUrl = busGoUploaded.url; tickets.bus.go.imagePath = busGoUploaded.path;

                const busReturnUploaded = await uploadFileIfPresent(document.querySelector('.bus-return-file'), tickets.bus.return.imagePath, tickets.bus.return.imageUrl);
                tickets.bus.return.imageUrl = busReturnUploaded.url; tickets.bus.return.imagePath = busReturnUploaded.path;

                if (busRadio.checked) {
                    transportCostVal += (tickets.bus.routeFee || 0);
                    transportCostVal += parseFloat(tickets.bus.go.amount) || 0;
                    transportCostVal += parseFloat(tickets.bus.return.amount) || 0;
                }
            }
        }`;

if (content.includes(saveLogicOld)) {
    content = content.replace(saveLogicOld, saveLogicNew);
    fs.writeFileSync('app.js', content);
    console.log("Successfully patched save logic part 2");
} else {
    console.log("Could not find Old content in save logic part 2");
}
