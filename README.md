# 差旅費追蹤 (Military Travel Expense Tracker)

這是一個專為軍人執行任務所設計的「個人差旅費追蹤」系統，協助使用者輕鬆紀錄出差任務、交通費與發票明細，並能即時掌握差旅報帳進度。

## 💡 主要功能

*   **差旅紀錄管理**：快速新增、編輯與刪除任務紀錄。
*   **雜費自動計算**：輸入任務起訖時間後，系統會自動根據時間長短計算應核發之雜費。
*   **里程與交通費補助**：選擇自行開車或騎車，並設定駕駛人為「自己」時，系統可自動換算里程補助費。
*   **發票與明細上傳**：支援多筆發票明細建檔與圖片上傳（住宿、車票等）。
*   **多維度檢視**：
    *   **任務紀錄**：條列式卡片清單，支援關鍵字與入帳狀態搜尋篩選。
    *   **日曆檢視**：直覺的跨日連續行程膠囊標示，快速點選查看當日任務。
    *   **編輯紀錄**：全局操作日誌，清楚掌握所有新增、修改與刪除動態。
*   **統計圖表**：自訂日期區間，自動分析出差天數、雜費、住宿、車票等各項開銷，並產生精美總覽。
*   **深色模式 (Dark Mode)**：提供舒適的日夜間主題切換。
*   **訪客模式 (Guest Mode)**：無需註冊登入即可透過本機端 Storage 完整試用所有功能。
*   **CSV 匯出**：一鍵匯出包含 UTF-8 BOM 的試算表檔案，方便後續報帳作業。

## 📜 法規依據

本系統之雜費與交通費計算邏輯，係依據「**國軍人員國內出差旅費報支規定**」建置。
詳情可參考：[國軍人員國內出差旅費報支規定](https://law.mnd.gov.tw/Fn/ShowNews.aspx?id=12364&flag=r)

## 🛠 技術架構

*   **Frontend**: HTML5, Vanilla JavaScript, CSS Variables (Custom Theming)
*   **UI Framework**: Bootstrap 5, Bootstrap Icons
*   **Backend / Database**: Firebase (Firestore, Storage, Authentication)
*   **Architecture**: Serverless SPA (Single Page Application) with Local Storage mock fallback.
