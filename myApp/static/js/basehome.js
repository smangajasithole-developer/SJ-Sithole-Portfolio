
/* ============================================================
   BASE HOME — THEME TOGGLE
   Light / Dark Mode
   ============================================================ */

(function () {
    'use strict';

    const root = document.documentElement;
    const themeToggle = document.getElementById('themeToggle');

    /* --------------------------------------------------------
       GET CURRENT THEME
       -------------------------------------------------------- */

    function currentTheme() {

        return root.getAttribute('data-theme') === 'dark'
            ? 'dark'
            : 'light';

    }


    /* --------------------------------------------------------
       APPLY THEME
       -------------------------------------------------------- */

    function applyTheme(theme) {

        if (theme === 'dark') {

            root.setAttribute('data-theme', 'dark');

        } else {

            root.removeAttribute('data-theme');

        }

        if (themeToggle) {

            themeToggle.setAttribute(
                'aria-pressed',
                theme === 'dark' ? 'true' : 'false'
            );

        }

    }


    /* --------------------------------------------------------
       INITIALIZE THEME
       -------------------------------------------------------- */

    function initializeTheme() {

        let savedTheme = null;

        try {

            savedTheme = localStorage.getItem('theme');

        } catch (error) {

            savedTheme = null;

        }

        if (savedTheme === 'dark') {

            applyTheme('dark');

        } else {

            // First-time visitors always start in light mode.
            applyTheme('light');

        }

    }


    /* --------------------------------------------------------
       TOGGLE LIGHT / DARK MODE
       -------------------------------------------------------- */

    if (themeToggle) {

        themeToggle.addEventListener('click', function () {

            const newTheme = currentTheme() === 'dark'
                ? 'light'
                : 'dark';

            applyTheme(newTheme);

            try {

                localStorage.setItem('theme', newTheme);

            } catch (error) {

                // Theme still works for the current page.

            }

        });

    }


    /* --------------------------------------------------------
       START
       -------------------------------------------------------- */

    initializeTheme();

})();
