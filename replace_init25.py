import re

with open('app.js', 'r') as f:
    content = f.read()

# I messed up the substitution. I'll just use explicit replace!
content = content.replace(
"""        currentEquipmentNote = modalEquipmentNote.value.trim();
        updateEquipmentSummaryUI();
    });
}""",
"""        currentEquipmentNote = modalEquipmentNote.value.trim();
        updateEquipmentSummaryUI();
        if (equipmentModalInstance) equipmentModalInstance.hide();
        else bootstrap.Modal.getInstance(equipmentModalEl)?.hide();
    });
}"""
)

with open('app.js', 'w') as f:
    f.write(content)
