# Steam 限免遊戲追蹤網頁 (Steam Free Games Dashboard)

這是一個輕量級的 Web 應用程式，使用 Python (Flask) 與 Tailwind CSS 打造，能即時抓取並展示目前 Steam 平台上的限時免費遊戲。

## 功能特色
- **即時資料**：串接 CheapShark API 獲取最新 Steam 免費/限免遊戲。
- **深色模式 (Dark Mode)**：採用 Steam 原生色系的深藍/黑風格設計。
- **響應式卡片設計**：支援手機、平板與電腦完美呈現。
- **自訂過濾器**：可透過右上角的開關自由切換是否顯示「永久免費」遊戲，專注於「限時免費 (100% OFF)」的資訊。
- **錯誤防護**：API 失敗或無資料時提供友善的繁體中文提示。

## 系統需求
- Python 3.7+
- pip (Python 套件管理工具)

## 安裝與執行

1. **安裝依賴套件**
   請在專案根目錄下執行以下指令，安裝所需的 Python 套件：
   ```bash
   pip install -r requirements.txt
   ```

2. **啟動伺服器**
   執行 Flask 主程式：
   ```bash
   python app.py
   ```

3. **瀏覽網頁**
   開啟瀏覽器並前往：
   [http://127.0.0.1:5000](http://127.0.0.1:5000) 或 [http://localhost:5000](http://localhost:5000)

## 檔案結構
- `app.py`: Flask 後端主程式與 API 串接邏輯。
- `requirements.txt`: 專案所需的 Python 依賴套件清單。
- `templates/index.html`: 前端 HTML 樣板，包含 Tailwind CSS 樣式與過濾邏輯。
- `README.md`: 本說明文件。

## 資料來源
本專案使用 [CheapShark API](https://apidocs.cheapshark.com/) 取得遊戲價格與限免資訊。非 Steam 官方網站，僅供資訊參考使用。
