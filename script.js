document.addEventListener('DOMContentLoaded', () => {
    const darkModeToggle = document.getElementById('darkModeToggle');

    // Check both possible keys for backwards compatibility
    const savedTheme = localStorage.getItem('theme') || localStorage.getItem('darkMode');

    if (savedTheme === 'dark' || savedTheme === 'enabled') {
        document.body.classList.add('dark-mode');
    }

    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            localStorage.removeItem('darkMode'); // Clean up old key
        });
    }
});