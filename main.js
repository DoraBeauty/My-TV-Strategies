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
            'lavender': { bg: '#E6E6FA', text: '#4B0082', name: 'Relaxing Lavender' },
            'mint': { bg: '#F0FFF0', text: '#2E8B57', name: 'Energizing Mint' },
            'rose': { bg: '#FFE4E1', text: '#800000', name: 'Classic Rose' },
            'ocean': { bg: '#F0F8FF', text: '#000080', name: 'Calm Ocean' }
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
                            moodText.textContent = `Current Mood: ${theme.name}`;
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

            btn.textContent = 'Sending...';
            btn.disabled = true;

            // Simulate network delay
            setTimeout(() => {
                alert('Thank you for your message! We will get back to you shortly.');
                this.reset();
                btn.textContent = originalText;
                btn.disabled = false;
            }, 1500);
        });
    }
});
