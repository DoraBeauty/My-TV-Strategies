# Steam 限免遊戲追蹤網頁 (Steam Free Games Dashboard)

這是一個輕量級的純前端 Web 應用程式，使用 HTML、Vanilla JavaScript 與 Tailwind CSS 打造，能即時抓取並展示目前 Steam 平台上的限時免費遊戲。

## 功能特色
- **即時資料**：直接透過瀏覽器前端串接 CheapShark API 獲取最新 Steam 免費/限免遊戲。
- **純靜態架構**：無需後端伺服器，完美支援 **GitHub Pages** 等靜態網頁代管服務部署。
- **深色模式 (Dark Mode)**：採用 Steam 原生色系的深藍/黑風格設計。
- **響應式卡片設計**：支援手機、平板與電腦完美呈現。
- **自訂過濾器**：可透過右上角的開關自由切換是否顯示「永久免費」遊戲，專注於「限時免費 (100% OFF)」的資訊。
- **錯誤防護**：API 失敗或無資料時提供友善的繁體中文提示與 Loading 動畫。

## 安裝與執行
由於這是純前端專案，您不需要安裝任何套件即可運行：

1. **本機預覽**
   直接在瀏覽器中雙擊打開 `index.html`，或者透過 VSCode 的 Live Server 套件開啟。

   *(若使用 Python，也可在目錄下執行 `python -m http.server 8000` 然後訪問 `http://localhost:8000`)*

2. **部署至 GitHub Pages**
   將這個儲存庫推送到 GitHub 上，並在 Settings -> Pages 中選擇從 `main` 分支部署，即可公開訪問。

## 檔案結構
- `index.html`: 核心 HTML 樣板，包含 Tailwind CSS 樣式、前端 Fetch API 邏輯與介面互動腳本。
- `README.md`: 本說明文件。

## 資料來源
本專案使用 [CheapShark API](https://apidocs.cheapshark.com/) 取得遊戲價格與限免資訊。非 Steam 官方網站，僅供資訊參考使用。