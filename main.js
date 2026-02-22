document.addEventListener('DOMContentLoaded', () => {
    // 1. 定義優雅的配色方案 (背景色 + 按鈕色 + 文字重點色)
    const palettes = [
        { bg: '#fdf2e9', btn: '#d4a5a5', text: '#d4a5a5' }, // 柔膚色 / 玫瑰粉 (預設)
        { bg: '#e0f7fa', btn: '#006064', text: '#006064' }, // 淡青色 / 深青綠
        { bg: '#f3e5f5', btn: '#8e24aa', text: '#8e24aa' }, // 淡紫色 / 紫羅蘭
        { bg: '#e8f5e9', btn: '#2e7d32', text: '#2e7d32' }, // 淡綠色 / 森林綠
        { bg: '#fff3e0', btn: '#ef6c00', text: '#ef6c00' }, // 淡橘色 / 焦糖橘
        { bg: '#eceff1', btn: '#455a64', text: '#455a64' }, // 淡灰色 / 藍灰色
        { bg: '#fce4ec', btn: '#c2185b', text: '#c2185b' }, // 櫻花粉 / 桃紅色
        { bg: '#fffde7', btn: '#fbc02d', text: '#fbc02d' }, // 淡黃色 / 金黃色
        { bg: '#e3f2fd', btn: '#1565c0', text: '#1565c0' }, // 天藍色 / 皇家藍
        { bg: '#efebe9', btn: '#5d4037', text: '#5d4037' }  // 淺棕色 / 深咖啡
    ];

    // 2. 獲取 DOM 元素
    const body = document.body;
    const btn = document.getElementById('colorBtn');

    // 獲取需要跟著變色的文字元素 (例如 logo, 標題強調色等)
    const logo = document.querySelector('.logo');
    const navLinks = document.querySelectorAll('.nav-links a');

    // 記錄當前的索引
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

        // 4. 應用新顏色
        const newPalette = palettes[newIndex];

        // 背景變色
        body.style.backgroundColor = newPalette.bg;

        // 按鈕變色
        btn.style.backgroundColor = newPalette.btn;

        // Logo 變色
        if(logo) logo.style.color = newPalette.text;

        // 導航連結 hover 顏色 (這裡只能變更 style 屬性，hover 需 CSS 變數或 class 處理，這裡簡單處理 active 狀態)
        // 為了更細緻的效果，我們可以設定 CSS 變數
        document.documentElement.style.setProperty('--primary-color', newPalette.text);
    });
});

// 額外功能：平滑滾動 (Smooth Scroll)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});