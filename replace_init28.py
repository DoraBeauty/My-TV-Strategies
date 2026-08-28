# Use the correct way to hide a Bootstrap modal when there are multiple modals.
# In Bootstrap 5, we can do `bootstrap.Modal.getOrCreateInstance(document.getElementById('equipmentModal')).hide()`
import re

with open('app.js', 'r') as f:
    content = f.read()

content = content.replace(
"""        currentEquipmentNote = modalEquipmentNote.value.trim();
        updateEquipmentSummaryUI();
    });
}""",
"""        currentEquipmentNote = modalEquipmentNote.value.trim();
        updateEquipmentSummaryUI();
        const equipmentModal = bootstrap.Modal.getInstance(document.getElementById('equipmentModal'));
        if (equipmentModal) {
            equipmentModal.hide();
        } else {
            console.warn("Could not find equipmentModal instance to hide");
        }
    });
}"""
)

with open('app.js', 'w') as f:
    f.write(content)

with open('index.html', 'r') as f:
    content = f.read()

content = content.replace(
    '<button type="button" class="btn btn-primary rounded-pill px-5 fw-bold shadow-sm" id="confirmEquipmentBtn" data-bs-dismiss="modal">\n                        確定\n                    </button>',
    '<button type="button" class="btn btn-primary rounded-pill px-5 fw-bold shadow-sm" id="confirmEquipmentBtn">\n                        確定\n                    </button>'
)

with open('index.html', 'w') as f:
    f.write(content)
