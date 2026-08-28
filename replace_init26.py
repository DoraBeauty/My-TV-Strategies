import re

with open('index.html', 'r') as f:
    content = f.read()

# Add data-bs-dismiss="modal" back to confirmEquipmentBtn in index.html to let Bootstrap handle the hide!
content = content.replace(
    '<button type="button" class="btn btn-primary rounded-pill px-5 fw-bold shadow-sm" id="confirmEquipmentBtn">\n                        確定\n                    </button>',
    '<button type="button" class="btn btn-primary rounded-pill px-5 fw-bold shadow-sm" id="confirmEquipmentBtn" data-bs-dismiss="modal">\n                        確定\n                    </button>'
)

with open('index.html', 'w') as f:
    f.write(content)

with open('app.js', 'r') as f:
    content = f.read()

# Remove the programmatic hide since data-bs-dismiss is back
content = content.replace(
"""        currentEquipmentNote = modalEquipmentNote.value.trim();
        updateEquipmentSummaryUI();
        if (equipmentModalInstance) equipmentModalInstance.hide();
        else bootstrap.Modal.getInstance(equipmentModalEl)?.hide();
    });
}""",
"""        currentEquipmentNote = modalEquipmentNote.value.trim();
        updateEquipmentSummaryUI();
    });
}"""
)

with open('app.js', 'w') as f:
    f.write(content)
