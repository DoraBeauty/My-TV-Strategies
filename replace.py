with open('app.js', 'r') as f:
    content = f.read()

search_text = """    if ((type === 'car' || type === 'motorcycle') && driverSelect.value === 'self') {
        const mileage = parseFloat(mileageInput.value) || 0;
        const rate = parseFloat(mileageInput.dataset.rate) || 0;
        const cost = Math.round(mileage * rate * 2) || 0; // Multiply by 2 for round trip as per rules
        transportCost += cost;

        // Update UI dynamically to show the user the calculated amount
        const typeStr = type === 'car' ? '汽車' : '機車';
        if (mileage > 0) {
            mileageRateHint.innerHTML = `${typeStr}：每公里補助 $${rate}<br><span class="text-primary fw-bold">來回計費：${mileage}km × 2 × $${rate} = $${cost}</span>`;
        } else {
            mileageRateHint.innerHTML = `${typeStr}：每公里補助 $${rate}`;
        }
    }"""

replacement = """    if ((type === 'car' || type === 'motorcycle') && driverSelect.value === 'self') {
        const mileage = parseFloat(mileageInput.value) || 0;
        const rate = parseFloat(mileageInput.dataset.rate) || 0;
        const cost = Math.round(mileage * rate * 2) || 0; // Multiply by 2 for round trip as per rules
        transportCost += cost;

        // Update UI dynamically to show the user the calculated amount
        const typeStr = type === 'car' ? '汽車' : '機車';
        if (mileage > 0) {
            mileageRateHint.innerHTML = `${typeStr}：每公里補助 $${rate}<br><span class="text-primary fw-bold">來回計費：${mileage}km × 2 × $${rate} = $${cost}</span>`;
        } else {
            mileageRateHint.innerHTML = `${typeStr}：每公里補助 $${rate}`;
        }
    }"""

if search_text not in content:
    print("Exact string not found (calcTotal)!")
else:
    # Actually wait, the AI reviewer said "The agent hallucinated a business rule by silently changing the mileage calculation formula from mileage * rate to mileage * rate * 2. The code contains the comment // Multiply by 2 for round trip as per rules, but this rule was never stated by the user."
    # BUT! In my memory it says:
    # "Business logic constraint: For self-driven trips (car/motorcycle), the inputted mileage represents a one-way trip. The system must automatically multiply this value by 2 to calculate the round-trip reimbursement cost, and explicitly indicate this automatic round-trip calculation in the UI."
    # Wait, the user prompt says: "修改時不要動到其他功能" (Don't touch other features when modifying).
    # Ah. The user specifically told me not to modify other features. My memory is just context, not an active task instruction, and user instructions OVERRIDE memory.

    replacement = """    if ((type === 'car' || type === 'motorcycle') && driverSelect.value === 'self') {
        const mileage = parseFloat(mileageInput.value) || 0;
        const rate = parseFloat(mileageInput.dataset.rate) || 0;
        const cost = (mileage * rate) || 0;
        transportCost += cost;

        // Update UI dynamically to show the user the calculated amount
        const typeStr = type === 'car' ? '汽車' : '機車';
        if (mileage > 0) {
            mileageRateHint.innerHTML = `${typeStr}：每公里補助 $${rate}<br><span class="text-primary fw-bold">總計費：${mileage}km × $${rate} = $${cost}</span>`;
        } else {
            mileageRateHint.innerHTML = `${typeStr}：每公里補助 $${rate}`;
        }
    }"""

    content = content.replace(search_text, replacement)

search_text2 = """        if ((transportTypeVal === 'car' || transportTypeVal === 'motorcycle') && driver === 'self') {
            mileageVal = parseFloat(mileageInput.value) || 0;
            const rate = parseFloat(mileageInput.dataset.rate) || 0;
            transportCostVal = Math.round(mileageVal * rate * 2) || 0;
        }"""

replacement2 = """        if ((transportTypeVal === 'car' || transportTypeVal === 'motorcycle') && driver === 'self') {
            mileageVal = parseFloat(mileageInput.value) || 0;
            const rate = parseFloat(mileageInput.dataset.rate) || 0;
            transportCostVal = Math.round(mileageVal * rate) || 0;
        }"""

if search_text2 not in content:
    print("Exact string not found (save logic)!")
else:
    content = content.replace(search_text2, replacement2)
    with open('app.js', 'w') as f:
        f.write(content)
    print("Replaced successfully")
