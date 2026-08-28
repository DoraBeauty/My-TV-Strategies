# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: test_ui.spec.ts >> verify JS logic changes
- Location: test_ui.spec.ts:3:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForSelector: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('#equipmentModal') to be hidden
    59 × locator resolved to visible <div tabindex="-1" role="dialog" aria-modal="true" id="equipmentModal" class="modal fade show">…</div>

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - alert [ref=e2]:
    - generic [ref=e3]: 
    - text: 訪客模式資料僅存在本機，清除瀏覽器資料可能遺失，建議定期匯出備份。
    - button "Close" [ref=e4] [cursor=pointer]
  - navigation [ref=e5]:
    - generic [ref=e6]:
      - link " 差旅費追蹤" [ref=e7] [cursor=pointer]:
        - /url: "#"
        - generic [ref=e8]: 
        - text: 差旅費追蹤
      - generic [ref=e9]:
        - button "未入帳 $0" [ref=e10] [cursor=pointer]
        - generic [ref=e11]:
          - button "" [ref=e12] [cursor=pointer]
          - text:       
  - text:   
  - generic [ref=e14]:
    - generic [ref=e15]:
      - radio " 任務紀錄" [checked]
      - generic [ref=e17] [cursor=pointer]:
        - generic [ref=e18]: 
        - text: 任務紀錄
      - radio " 日曆"
      - generic [ref=e19] [cursor=pointer]:
        - generic [ref=e20]: 
        - text: 日曆
      - radio " 陣地圖資"
      - generic [ref=e21] [cursor=pointer]:
        - generic [ref=e22]: 
        - text: 陣地圖資
    - generic [ref=e24]:
      - generic [ref=e26]:
        - generic [ref=e27]: 
        - textbox "搜尋出差名稱、地點、拜訪單位..." [ref=e29]
      - generic [ref=e30]:
        - combobox [ref=e31]:
          - option "全部狀態" [selected]
          - option "未入帳"
          - option "已入帳"
        - button " 匯出" [ref=e32] [cursor=pointer]:
          - generic [ref=e33]: 
          - text: 匯出
        - button " 統計" [ref=e34] [cursor=pointer]:
          - generic [ref=e35]: 
          - text: 統計
    - generic [ref=e37]:
      - generic [ref=e38]: 
      - heading "目前尚無差旅紀錄" [level=5] [ref=e39]
      - paragraph [ref=e40]: 點擊右下角的 ＋ 按鈕，新增您的第一筆任務紀錄吧！
    - text:               
    - button "" [ref=e41] [cursor=pointer]
  - text:      
  - dialog [ref=e43]:
    - generic [ref=e44]:
      - generic [ref=e45]:
        - heading "新增紀錄" [level=5] [ref=e46]
        - button "Close" [active] [ref=e47] [cursor=pointer]
      - generic [ref=e49]:
        - generic [ref=e50]: 基本資訊
        - generic [ref=e51]:
          - textbox "出差名稱 (例如：五戰區重砲射擊)" [ref=e52]
          - textbox "出差地點 (例如：台中市)" [ref=e53]
          - textbox "拜訪單位 (選填)" [ref=e54]
        - generic [ref=e55]: 驗證裝備 (選填)
        - generic [ref=e56]:
          - button " 驗證裝備" [ref=e57] [cursor=pointer]:
            - generic [ref=e58]: 
            - text: 驗證裝備
          - generic [ref=e59]: 60迫砲×1、105榴砲×2（共 3 門）
          - generic [ref=e60]: Test note
        - generic [ref=e61]: 時間與雜費
        - generic [ref=e62]:
          - generic [ref=e63]:
            - generic [ref=e64]: 開始
            - textbox [ref=e65]: 2026-08-28T07:00
          - generic [ref=e66]:
            - generic [ref=e67]: 結束
            - textbox [ref=e68]: 2026-08-28T18:00
          - generic [ref=e69]:
            - generic [ref=e70]:
              - generic [ref=e71]: 雜費小計
              - generic [ref=e72]:
                - generic [ref=e73]: $
                - spinbutton [ref=e74]: "0"
            - generic [ref=e75]: 請輸入起訖時間計算雜費
            - generic [ref=e76]: 雜費依《國軍國內出差旅費報支規定》以每日計算（每日上限400元，未滿4小時為200元）。系統為自動估算，實際報支請依規定及單位審核為準。
        - generic [ref=e77]: 同行與交通
        - generic [ref=e78]:
          - textbox "帶隊官 (選填)" [ref=e79]
          - generic [ref=e80]:
            - generic [ref=e81]: 同行人員 (選填)
            - generic [ref=e82]:
              - generic [ref=e83]:
                - textbox "人員" [ref=e84]
                - button "" [ref=e85] [cursor=pointer]
              - generic [ref=e87]:
                - textbox "人員" [ref=e88]
                - button "" [ref=e89] [cursor=pointer]
              - generic [ref=e91]:
                - textbox "人員" [ref=e92]
                - button "" [ref=e93] [cursor=pointer]
            - button " 新增同行人員" [ref=e95] [cursor=pointer]:
              - generic [ref=e96]: 
              - text: 新增同行人員
          - combobox [ref=e97]:
            - option "無" [selected]
            - option "大眾交通工具"
            - option "自行開車"
            - option "自行騎機車"
          - generic [ref=e98]:
            - generic [ref=e99]: 大眾運輸 (擇一)
            - generic [ref=e101]:
              - generic [ref=e102]:
                - checkbox "高鐵" [ref=e103]
                - generic [ref=e104]: 高鐵
              - generic [ref=e105]:
                - checkbox "客運" [ref=e106]
                - generic [ref=e107]: 客運
            - generic [ref=e108]:
              - generic [ref=e109]:
                - generic [ref=e110]: 
                - text: 高鐵去程
              - spinbutton "去程金額" [ref=e111]
              - button "Choose File" [ref=e112]
              - generic [ref=e113]:
                - generic [ref=e114]: 
                - text: 高鐵回程
              - spinbutton "回程金額" [ref=e115]
              - button "Choose File" [ref=e116]
            - generic [ref=e117]:
              - generic [ref=e118]:
                - generic [ref=e119]: 
                - text: 客運去程
              - spinbutton "去程金額" [ref=e120]
              - button "Choose File" [ref=e121]
              - generic [ref=e122]:
                - generic [ref=e123]: 
                - text: 客運回程
              - spinbutton "回程金額" [ref=e124]
              - button "Choose File" [ref=e125]
          - generic [ref=e126]:
            - generic [ref=e127]: 駕駛人
            - combobox [ref=e128]:
              - option "自己 (計算里程費)" [selected]
          - generic [ref=e129]:
            - generic [ref=e130]: 里程數 (公里)
            - generic [ref=e131]:
              - spinbutton "0" [ref=e132]
              - button "來回" [ref=e133] [cursor=pointer]
        - generic [ref=e134]: 發票與額外花費
        - button " 新增一筆發票" [ref=e136] [cursor=pointer]:
          - generic [ref=e137]: 
          - text: 新增一筆發票
        - generic [ref=e138]: 備註
        - textbox "系統自動產生備註..." [disabled] [ref=e140]: 無自動路程費
        - generic [ref=e142]:
          - heading "總金額" [level=5] [ref=e143]
          - heading "$ 0" [level=2] [ref=e144]
      - generic [ref=e145]:
        - button "取消" [ref=e146] [cursor=pointer]
        - button "儲存紀錄" [ref=e147] [cursor=pointer]
  - text: 
  - dialog [ref=e148]:
    - generic [ref=e149]:
      - generic [ref=e150]:
        - heading "驗證裝備" [level=5] [ref=e151]
        - button "Close" [ref=e152] [cursor=pointer]
      - generic [ref=e153]:
        - generic [ref=e154]:
          - generic [ref=e155]:
            - heading "迫砲" [level=6] [ref=e156]
            - generic [ref=e157]:
              - generic [ref=e158]:
                - generic [ref=e159]: 60迫砲
                - spinbutton "0" [ref=e160]: "1"
              - generic [ref=e161]:
                - generic [ref=e162]: T75式81迫砲
                - spinbutton "0" [ref=e163]
              - generic [ref=e164]:
                - generic [ref=e165]: M29A1式81迫砲
                - spinbutton "0" [ref=e166]
              - generic [ref=e167]:
                - generic [ref=e168]: 120迫砲
                - spinbutton "0" [ref=e169]
              - generic [ref=e170]:
                - generic [ref=e171]: M42迫砲
                - spinbutton "0" [ref=e172]
          - generic [ref=e173]:
            - heading "榴砲" [level=6] [ref=e174]
            - generic [ref=e175]:
              - generic [ref=e176]:
                - generic [ref=e177]: 105榴砲
                - spinbutton "0" [ref=e178]: "2"
              - generic [ref=e179]:
                - generic [ref=e180]: 155榴砲
                - spinbutton "0" [ref=e181]
              - generic [ref=e182]:
                - generic [ref=e183]: 8吋榴砲
                - spinbutton "0" [ref=e184]
              - generic [ref=e185]:
                - generic [ref=e186]: M240榴砲
                - spinbutton "0" [ref=e187]
              - generic [ref=e188]:
                - generic [ref=e189]: 155加農砲
                - spinbutton "0" [ref=e190]
          - generic [ref=e191]:
            - heading "機砲" [level=6] [ref=e192]
            - generic [ref=e193]:
              - generic [ref=e194]:
                - generic [ref=e195]: T82T式20機砲（牽引式）
                - spinbutton "0" [ref=e196]
              - generic [ref=e197]:
                - generic [ref=e198]: T82F式20機砲（固定式）
                - spinbutton "0" [ref=e199]
        - generic [ref=e200]:
          - generic [ref=e201]: 總數量
          - generic [ref=e202]: 3 門
        - textbox "裝備備註 (選填)" [ref=e204]: Test note
      - generic [ref=e205]:
        - button "取消" [ref=e206] [cursor=pointer]
        - button "確定" [ref=e207] [cursor=pointer]
  - text: 
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  |
  3  | test('verify JS logic changes', async ({ page }) => {
  4  |   const logs = [];
  5  |   page.on('console', msg => logs.push(msg.text()));
  6  |   await page.goto('http://localhost:8000');
  7  |
  8  |   await page.waitForTimeout(1000);
  9  |
  10 |   const loginVisible = await page.locator('#guestLoginBtn').isVisible();
  11 |   if (loginVisible) {
  12 |       await page.click('#guestLoginBtn');
  13 |   }
  14 |
  15 |   await page.evaluate(() => {
  16 |      document.getElementById('loginView').style.display = 'none';
  17 |      document.getElementById('dashboardView').style.display = 'block';
  18 |   });
  19 |
  20 |   await page.click('#fabBtn', { force: true });
  21 |   await page.waitForSelector('#recordModal', { state: 'visible' });
  22 |
  23 |   await page.click('#openEquipmentModalBtn');
  24 |   await page.waitForSelector('#equipmentModal', { state: 'visible' });
  25 |
  26 |   await page.fill('input[data-name="105榴砲"]', '2');
  27 |   await page.fill('input[data-name="60迫砲"]', '1');
  28 |   await page.fill('#modalEquipmentNote', 'Test note');
  29 |
  30 |   await expect(page.locator('#modalEquipmentTotalQty')).toHaveText('3');
  31 |
  32 |   // Try evaluating the actual close
  33 |   await page.evaluate(() => {
  34 |     const el = document.getElementById('equipmentModal');
  35 |     const modal = bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el);
  36 |     modal.hide();
  37 |   });
  38 |
  39 |   await page.evaluate(() => document.getElementById('confirmEquipmentBtn').click());
  40 |
> 41 |   await page.waitForSelector('#equipmentModal', { state: 'hidden' });
     |              ^ Error: page.waitForSelector: Test timeout of 30000ms exceeded.
  42 |
  43 |   await expect(page.locator('#equipmentSummary')).toContainText('60迫砲×1、105榴砲×2（共 3 門）');
  44 |   await expect(page.locator('#equipmentNotePreview')).toContainText('Test note');
  45 |
  46 |   // Test Mileage logic
  47 |   // Force select Option
  48 |   await page.evaluate(() => {
  49 |      const select = document.getElementById('transportType') as HTMLSelectElement;
  50 |      select.value = 'car';
  51 |      select.dispatchEvent(new Event('change'));
  52 |   });
  53 |   await page.waitForSelector('#mileageSection', { state: 'visible' });
  54 |
  55 |   await page.fill('#mileage', '10');
  56 |   await page.waitForTimeout(100);
  57 |
  58 |   await page.evaluate(() => document.getElementById('roundTripBtn').click());
  59 |   await expect(page.locator('#mileage')).toHaveValue('20');
  60 |
  61 |   await expect(page.locator('#roundTripBtn')).toHaveClass(/active/);
  62 |
  63 |   await page.evaluate(() => document.getElementById('roundTripBtn').click());
  64 |   await expect(page.locator('#mileage')).toHaveValue('10');
  65 |
  66 |   await expect(page.locator('#roundTripBtn')).not.toHaveClass(/active/);
  67 |
  68 |   await page.evaluate(() => document.getElementById('roundTripBtn').click());
  69 |   await expect(page.locator('#mileage')).toHaveValue('20');
  70 |   await page.fill('#mileage', '30');
  71 |
  72 |   await expect(page.locator('#roundTripBtn')).not.toHaveClass(/active/);
  73 |
  74 |   console.log("Logs:", logs);
  75 | });
  76 |
```