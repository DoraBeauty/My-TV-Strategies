document.addEventListener('DOMContentLoaded', () => {
    // 1. 定義優雅的配色方案 (背景色 + 按鈕色)
    const palettes = [
        { bg: '#fdf2e9', btn: '#d4a5a5' }, // 柔膚色 / 玫瑰粉 (預設)
        { bg: '#e0f7fa', btn: '#006064' }, // 淡青色 / 深青綠
        { bg: '#f3e5f5', btn: '#8e24aa' }, // 淡紫色 / 紫羅蘭
        { bg: '#e8f5e9', btn: '#2e7d32' }, // 淡綠色 / 森林綠
        { bg: '#fff3e0', btn: '#ef6c00' }, // 淡橘色 / 焦糖橘
        { bg: '#eceff1', btn: '#455a64' }, // 淡灰色 / 藍灰色
        { bg: '#fce4ec', btn: '#c2185b' }, // 櫻花粉 / 桃紅色
        { bg: '#fffde7', btn: '#fbc02d' }, // 淡黃色 / 金黃色
        { bg: '#e3f2fd', btn: '#1565c0' }, // 天藍色 / 皇家藍
        { bg: '#efebe9', btn: '#5d4037' }  // 淺棕色 / 深咖啡
    ];

    // 2. 獲取 DOM 元素
    const body = document.body;
    const btn = document.getElementById('colorBtn');

    // 記錄當前的索引，避免重複隨機到同一個顏色
    let currentIndex = 0;

    // 3. 點擊事件處理
    btn.addEventListener('click', () => {
        let newIndex;

        // 確保隨機到的新顏色不是當前的顏色
        do {
            newIndex = Math.floor(Math.random() * palettes.length);
        } while (newIndex === currentIndex);

        // 更新索引
        currentIndex = newIndex;

        // 4. 應用新顏色 (CSS transition 會處理平滑過渡)
        const newPalette = palettes[newIndex];

        body.style.backgroundColor = newPalette.bg;
        btn.style.backgroundColor = newPalette.btn;
    });
});