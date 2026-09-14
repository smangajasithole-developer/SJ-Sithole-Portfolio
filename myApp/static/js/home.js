/* ============================================================
   HOME PAGE — SCROLL-TRIGGERED ANIMATIONS
   ============================================================
   Any element with the class `animate-on-scroll` will receive
   the class `is-visible` the first time it enters the viewport.
   The actual animation is defined in the CSS file.
   ============================================================ */

(function () {
    'use strict';

    const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    ).matches;

    const animatedElements = document.querySelectorAll('.animate-on-scroll');

    if (!animatedElements.length || prefersReducedMotion) {
        animatedElements.forEach((el) => el.classList.add('is-visible'));
    } else if (!('IntersectionObserver' in window)) {
        animatedElements.forEach((el) => el.classList.add('is-visible'));
    } else {
        const observer = new IntersectionObserver(
            (entries, obs) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        obs.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.15,
                rootMargin: '0px 0px -80px 0px'
            }
        );

        animatedElements.forEach((el) => observer.observe(el));
    }
})();


/* ============================================================
   PROJECT MODALS
   ============================================================
   Handles:
   - Opening project information modals
   - Closing project information modals
   - Closing by clicking the backdrop
   - Closing with Escape
   - Preventing background scrolling while a modal is open

   Important:
   Before opening, the modal is moved to <body>. This is done
   because the modal lives inside `.project-card`, which has a
   `transform` applied (from entrance animation + hover). A
   transformed ancestor becomes the containing block for any
   `position: fixed` descendant — which makes the modal anchor
   to the card instead of the viewport. Moving it to <body>
   restores viewport-centered positioning.
   ============================================================ */

(function () {
    'use strict';

    const projectInfoButtons = document.querySelectorAll(
        '[data-project-modal]'
    );

    const projectModals = document.querySelectorAll(
        '.project-modal'
    );

    let activeProjectModal = null;

    function openProjectModal(modal) {
        if (!modal) {
            return;
        }

        /* ----------------------------------------------------
           DETACH FROM TRANSFORMED ANCESTOR
           ----------------------------------------------------
           Move the modal to <body> so `position: fixed` is
           relative to the viewport, not the project card.
           ---------------------------------------------------- */
        if (modal.parentElement !== document.body) {
            document.body.appendChild(modal);
        }

        activeProjectModal = modal;

        modal.setAttribute('aria-hidden', 'false');
        modal.classList.add('is-open');

        document.body.classList.add('modal-open');

        const focusTarget = modal.querySelector(
            '[data-close-project-modal], button, a'
        );

        if (focusTarget) {
            setTimeout(() => {
                focusTarget.focus();
            }, 0);
        }
    }

    function closeProjectModal(modal) {
        if (!modal) {
            return;
        }

        modal.setAttribute('aria-hidden', 'true');
        modal.classList.remove('is-open');

        if (activeProjectModal === modal) {
            activeProjectModal = null;
        }

        const anotherModalIsOpen = document.querySelector(
            '.project-modal.is-open'
        );

        if (!anotherModalIsOpen) {
            document.body.classList.remove('modal-open');
        }
    }

    /* --------------------------------------------------------
       OPEN PROJECT MODAL
       -------------------------------------------------------- */

    projectInfoButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const modalId = button.dataset.projectModal;

            if (!modalId) {
                return;
            }

            const modal = document.getElementById(modalId);

            openProjectModal(modal);
        });
    });


    /* --------------------------------------------------------
       CLOSE PROJECT MODAL
       -------------------------------------------------------- */

    projectModals.forEach((modal) => {
        const closeButtons = modal.querySelectorAll(
            '[data-close-project-modal]'
        );

        closeButtons.forEach((button) => {
            button.addEventListener('click', () => {
                closeProjectModal(modal);
            });
        });


        /* ----------------------------------------------------
           CLOSE WHEN CLICKING THE BACKDROP
           ---------------------------------------------------- */

        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeProjectModal(modal);
            }
        });
    });


    /* --------------------------------------------------------
       CLOSE WITH ESCAPE KEY
       -------------------------------------------------------- */

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') {
            return;
        }

        if (activeProjectModal) {
            closeProjectModal(activeProjectModal);
        }
    });


    /* --------------------------------------------------------
       RESET MODALS WHEN USING BROWSER BACK/FORWARD CACHE
       -------------------------------------------------------- */

    window.addEventListener('pageshow', () => {
        projectModals.forEach((modal) => {
            modal.setAttribute('aria-hidden', 'true');
            modal.classList.remove('is-open');
        });

        activeProjectModal = null;
        document.body.classList.remove('modal-open');
    });
})();


/* ============================================================
   THEME TOGGLE — day / night mode
   The initial theme is set by the anti-flash script inline
   in basehome.html (before </body>).
   ============================================================ */

(function () {
    'use strict';

    const root = document.documentElement;

    function currentTheme() {
        return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }

    function applyTheme(theme) {
        if (theme === 'dark') {
            root.setAttribute('data-theme', 'dark');
        } else {
            root.removeAttribute('data-theme');
        }

        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
        }
    }

    function saveTheme(theme) {
        try {
            localStorage.setItem('theme', theme);
        } catch (e) {}
    }

    document.addEventListener('DOMContentLoaded', () => {
        const toggle = document.getElementById('themeToggle');
        if (!toggle) return;

        toggle.setAttribute(
            'aria-pressed',
            currentTheme() === 'dark' ? 'true' : 'false'
        );

        toggle.addEventListener('click', () => {
            const next = currentTheme() === 'dark' ? 'light' : 'dark';
            applyTheme(next);
            saveTheme(next);
        });
    });

    if (window.matchMedia) {
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        media.addEventListener('change', (e) => {
            let stored = null;
            try {
                stored = localStorage.getItem('theme');
            } catch (err) {}
            if (!stored) {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
})();