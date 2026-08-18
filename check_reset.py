with open('app.js', 'r', encoding='utf-8') as f:
    print(f.read().find("transportTypeSelect.value = 'none';"))
