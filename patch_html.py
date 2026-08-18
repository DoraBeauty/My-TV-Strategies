import sys

def patch_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update the transportType select
    old_select = '''<select class="ios-input fw-bold" id="transportType" required>
                                <option value="" disabled selected>選擇交通工具...</option>
                                <option value="car">自行開車</option>
                                <option value="motorcycle">自行騎機車</option>
                                <option value="public">大眾運輸 / 其他</option>
                            </select>'''

    new_select_and_checkboxes = '''<select class="ios-input fw-bold mb-2" id="transportType" required>
                                <option value="" disabled selected>選擇自用交通工具...</option>
                                <option value="car">自行開車</option>
                                <option value="motorcycle">自行騎機車</option>
                                <option value="none">無</option>
                            </select>

                            <div class="bg-custom-card border rounded-4 p-3 mb-2 shadow-sm">
                                <div class="fw-bold small mb-2 text-muted">大眾運輸 (可複選)</div>
                                <div class="form-check mb-2">
                                    <input class="form-check-input" type="checkbox" id="hsrCheckbox" value="hsr">
                                    <label class="form-check-label fw-bold" for="hsrCheckbox">
                                        高鐵
                                    </label>
                                </div>

                                <div id="hsrSection" class="slide-section bg-custom-light border rounded-4 p-3 mb-3">
                                    <label class="fw-bold small text-primary mb-2"><i class="bi bi-train-front me-1"></i>高鐵去程</label>
                                    <input type="number" class="ios-input mb-2 ticket-price" id="hsrGoPrice" placeholder="去程金額" min="0">
                                    <input type="file" class="ios-input mb-3 hsr-go-file" accept="image/*" style="font-size: 0.8rem;">
                                    <div id="hsrGoThumb"></div>

                                    <label class="fw-bold small text-primary mb-2"><i class="bi bi-train-front me-1"></i>高鐵回程</label>
                                    <input type="number" class="ios-input mb-2 ticket-price" id="hsrReturnPrice" placeholder="回程金額" min="0">
                                    <input type="file" class="ios-input hsr-return-file" accept="image/*" style="font-size: 0.8rem;">
                                    <div id="hsrReturnThumb"></div>
                                </div>

                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="busCheckbox" value="bus">
                                    <label class="form-check-label fw-bold" for="busCheckbox">
                                        客運
                                    </label>
                                </div>

                                <div id="busSection" class="slide-section bg-custom-light border rounded-4 p-3 mt-2">
                                    <label class="fw-bold small text-primary mb-2"><i class="bi bi-bus-front me-1"></i>客運去程</label>
                                    <input type="number" class="ios-input mb-2 ticket-price" id="busGoPrice" placeholder="去程金額" min="0">
                                    <input type="file" class="ios-input mb-3 bus-go-file" accept="image/*" style="font-size: 0.8rem;">
                                    <div id="busGoThumb"></div>

                                    <label class="fw-bold small text-primary mb-2"><i class="bi bi-bus-front me-1"></i>客運回程</label>
                                    <input type="number" class="ios-input mb-2 ticket-price" id="busReturnPrice" placeholder="回程金額" min="0">
                                    <input type="file" class="ios-input bus-return-file" accept="image/*" style="font-size: 0.8rem;">
                                    <div id="busReturnThumb"></div>
                                </div>
                            </div>'''
    content = content.replace(old_select, new_select_and_checkboxes)

    # 2. Add readonly Note field
    old_total_section = '''                        <!-- Total -->
                        <div class="card border-0 bg-primary text-white mt-4 rounded-4 shadow-sm" style="transform: none !important;">'''

    new_note_and_total = '''                        <!-- Note -->
                        <div class="ios-input-label mt-2">備註</div>
                        <div class="ios-input-group">
                            <textarea class="ios-input text-muted" id="recordNote" rows="2" readonly disabled placeholder="系統自動產生備註..."></textarea>
                        </div>

                        <!-- Total -->
                        <div class="card border-0 bg-primary text-white mt-4 rounded-4 shadow-sm" style="transform: none !important;">'''
    content = content.replace(old_total_section, new_note_and_total)

    # 3. Add Settings button to dropdown
    old_dropdown = '''                        <li>
                            <button class="dropdown-item d-flex align-items-center py-2" data-bs-toggle="modal" data-bs-target="#rulesModal" style="color: var(--text-main);">
                                <i class="bi bi-journal-text me-2 text-muted"></i> 規定
                            </button>
                        </li>'''
    new_dropdown = '''                        <li>
                            <button class="dropdown-item d-flex align-items-center py-2" data-bs-toggle="modal" data-bs-target="#rulesModal" style="color: var(--text-main);">
                                <i class="bi bi-journal-text me-2 text-muted"></i> 規定
                            </button>
                        </li>
                        <li>
                            <button class="dropdown-item d-flex align-items-center py-2" data-bs-toggle="modal" data-bs-target="#routeSettingsModal" style="color: var(--text-main);">
                                <i class="bi bi-gear me-2 text-muted"></i> 路程設定
                            </button>
                        </li>'''
    content = content.replace(old_dropdown, new_dropdown)

    # 4. Add Settings Modal
    old_location_modal_end = '''    <!-- Delete Location Confirmation Modal -->'''

    settings_modal = '''    <!-- Route Settings Modal -->
    <div class="modal fade" id="routeSettingsModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header border-0 pb-0">
                    <h5 class="modal-title fw-bold">路程設定</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body pt-3 pb-4">
                    <form id="routeSettingsForm">
                        <div class="ios-input-label">高鐵</div>
                        <div class="ios-input-group bg-custom-card border rounded-4 p-3 mb-3 shadow-sm">
                            <label class="fw-bold small text-muted mb-2">單趟距離 (公里)</label>
                            <input type="number" class="ios-input mb-2" id="settingHsrKm" min="0" step="0.1" value="20" required>
                            <div class="text-muted small">來回距離: <span id="settingHsrRoundTrip" class="fw-bold text-main-custom">40</span> km</div>
                            <div class="text-muted small">補貼金額: $<span id="settingHsrFee" class="fw-bold text-main-custom">120</span> (每公里 $3)</div>
                        </div>

                        <div class="ios-input-label">客運</div>
                        <div class="ios-input-group bg-custom-card border rounded-4 p-3 shadow-sm">
                            <label class="fw-bold small text-muted mb-2">單趟距離 (公里)</label>
                            <input type="number" class="ios-input mb-2" id="settingBusKm" min="0" step="0.1" value="10" required>
                            <div class="text-muted small">來回距離: <span id="settingBusRoundTrip" class="fw-bold text-main-custom">20</span> km</div>
                            <div class="text-muted small">補貼金額: $<span id="settingBusFee" class="fw-bold text-main-custom">60</span> (每公里 $3)</div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer border-0 pt-0 pb-3">
                    <button type="button" class="btn btn-custom-light text-main-custom rounded-pill px-4 fw-bold" data-bs-dismiss="modal">取消</button>
                    <button type="button" class="btn btn-primary rounded-pill px-5 fw-bold shadow-sm" id="saveRouteSettingsBtn">
                        儲存
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Delete Location Confirmation Modal -->'''

    content = content.replace(old_location_modal_end, settings_modal)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

patch_file('index.html')
