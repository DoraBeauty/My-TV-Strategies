document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileMenuBtn.innerHTML = navLinks.classList.contains('active') ? '&times;' : '&#9776;'; // Change icon
        });
    }

    // 2. Active Link Highlighting
    // Simple logic to highlight the current page in the navigation
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const menuItems = document.querySelectorAll('.nav-links a');

    menuItems.forEach(link => {
        // Remove active class first
        link.classList.remove('active');
        // Get the href attribute
        const linkPath = link.getAttribute('href');
        // Check if it matches
        if (linkPath === currentPath) {
            link.classList.add('active');
        }
    });

    // 3. Product Mood Visualizer (for Services Page)
    const visualizerSection = document.getElementById('product-visualizer');

    if (visualizerSection) {
        const colorButtons = document.querySelectorAll('.color-btn');
        const productImage = document.getElementById('product-image');

        // Define color themes
        const themes = {
            'nude': { bg: '#FFEBCD', text: '#5D4037', name: '隱形百搭膚' },
            'black': { bg: '#333333', text: '#FFFFFF', name: '時尚神秘黑' },
            'pink': { bg: '#FFB6C1', text: '#8B0000', name: '柔美氣質粉' },
            'purple': { bg: '#E6E6FA', text: '#4B0082', name: '舒適薰衣草紫' }
        };

        colorButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                // Remove active class from all buttons
                colorButtons.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                this.classList.add('active');

                // Get theme
                const themeKey = this.dataset.theme;
                const theme = themes[themeKey];

                if (theme) {
                    // Apply styles with smooth transition
                    visualizerSection.style.backgroundColor = theme.bg;
                    visualizerSection.style.color = theme.text;

                    // Update text description if present
                    const moodText = document.getElementById('mood-text');
                    if (moodText) {
                        moodText.style.opacity = 0;
                        setTimeout(() => {
                            moodText.textContent = `當前氛圍: ${theme.name}`;
                            moodText.style.opacity = 1;
                        }, 200);
                    }
                }
            });
        });
    }

    // 4. Contact Form Handling
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Simulate form submission
            const btn = this.querySelector('button[type="submit"]');
            const originalText = btn.textContent;

            btn.textContent = '傳送中...';
            btn.disabled = true;

            // Simulate network delay
            setTimeout(() => {
                alert('感謝您的訊息！我們會盡快回覆您。');
                this.reset();
                btn.textContent = originalText;
                btn.disabled = false;
            }, 1500);
        });
    }
});
