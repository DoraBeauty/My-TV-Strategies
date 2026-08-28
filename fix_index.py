import re

with open('index.html', 'r') as f:
    content = f.read()

# Apply the original index.html patch again! It seems I might have accidentally git restored or modified it incorrectly.
content = re.sub(
    r"<div class=\"d-flex flex-column gap-2 mb-3\" id=\"equipmentContainer\">\n                                <!-- Injected by JS -->\n                            </div>\n                            <div class=\"d-flex justify-content-between align-items-center mt-2 pt-2 border-top\" style=\"border-color: var\(--border-color\) !important;\">\n                                <span class=\"fw-bold text-main-custom\">總數量</span>\n                                <span class=\"fw-bold text-primary fs-5\"><span id=\"equipmentTotalQty\">0</span> 門</span>\n                            </div>\n                            <div class=\"mt-3\">\n                                <textarea class=\"ios-input text-main-custom bg-custom-light border-0\" id=\"equipmentNote\" rows=\"2\" placeholder=\"裝備備註 \(選填\)\"></textarea>\n                            </div>",
    r'<button type="button" class="btn btn-outline-primary w-100 rounded-pill py-2 fw-bold shadow-sm mb-2" id="openEquipmentModalBtn" data-bs-toggle="modal" data-bs-target="#equipmentModal">\n                                <i class="bi bi-box-seam me-1"></i>驗證裝備\n                            </button>\n                            <div id="equipmentSummary" class="text-main-custom fw-bold small text-center">未選擇</div>\n                            <div id="equipmentNotePreview" class="text-muted small text-center mt-1" style="display: none;"></div>',
    content,
    flags=re.DOTALL
)

content = re.sub(
    r"<div id=\"mileageSection\" class=\"slide-section bg-custom-light border rounded-4 p-3 text-center\">\n                                <label class=\"fw-bold small text-muted mb-2\">里程數 \(公里\)</label>\n                                <div class=\"d-flex align-items-center justify-content-center\">\n                                    <input type=\"number\" class=\"ios-input text-center w-50 fw-bold fs-5 me-2\" id=\"mileage\" min=\"0\" step=\"0.1\" placeholder=\"0\">\n                                </div>\n                                <div id=\"mileageRateHint\" class=\"text-muted small mt-2\"></div>\n                            </div>",
    r'<div id="mileageSection" class="slide-section bg-custom-light border rounded-4 p-3 text-center">\n                                <label class="fw-bold small text-muted mb-2">里程數 (公里)</label>\n                                <div class="d-flex align-items-center justify-content-center">\n                                    <input type="number" class="ios-input text-center w-50 fw-bold fs-5 me-2" id="mileage" min="0" step="0.1" placeholder="0">\n                                    <button type="button" class="btn btn-outline-secondary btn-sm fw-bold rounded-pill" id="roundTripBtn" style="white-space: nowrap;">來回</button>\n                                </div>\n                                <div id="mileageRateHint" class="text-muted small mt-2"></div>\n                            </div>',
    content
)

equipment_modal_html = """
    <!-- Equipment Modal -->
    <div class="modal fade" id="equipmentModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header border-0 pb-0">
                    <h5 class="modal-title fw-bold">驗證裝備</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body pt-3 pb-4">
                    <div id="equipmentModalContent">
                        <!-- Injected by JS -->
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-4 pt-3 border-top" style="border-color: var(--border-color) !important;">
                        <span class="fw-bold text-main-custom">總數量</span>
                        <span class="fw-bold text-primary fs-5"><span id="modalEquipmentTotalQty">0</span> 門</span>
                    </div>
                    <div class="mt-3">
                        <textarea class="ios-input text-main-custom bg-custom-light border-0" id="modalEquipmentNote" rows="2" placeholder="裝備備註 (選填)"></textarea>
                    </div>
                </div>
                <div class="modal-footer border-0 pt-0 pb-3">
                    <button type="button" class="btn btn-custom-light text-main-custom rounded-pill px-4 fw-bold" data-bs-dismiss="modal">取消</button>
                    <button type="button" class="btn btn-primary rounded-pill px-5 fw-bold shadow-sm" id="confirmEquipmentBtn">
                        確定
                    </button>
                </div>
            </div>
        </div>
    </div>
"""

content = re.sub(
    r"<!-- Delete Location Confirmation Modal -->",
    equipment_modal_html + "\n    <!-- Delete Location Confirmation Modal -->",
    content
)

with open('index.html', 'w') as f:
    f.write(content)
