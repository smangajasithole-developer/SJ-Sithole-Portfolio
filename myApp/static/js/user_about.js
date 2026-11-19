
/* ============================================================
   ABOUT — SCROLL ENTRANCE OBSERVER
   ============================================================ */

(function () {

    'use strict';


    /* ========================================================
       INITIALIZE ABOUT ENTRANCE
       ======================================================== */

    function initializeAboutEntrance() {

        /* ====================================================
           ELEMENT REFERENCES
           ==================================================== */

        const aboutSection = document.querySelector('#about');

        if (!aboutSection) {
            return;
        }


        /* ====================================================
           REVEAL ABOUT SECTION
           ==================================================== */

        function revealAbout() {

            aboutSection.classList.add('is-visible');

        }


        /* ====================================================
           REDUCED MOTION / FALLBACK
           ==================================================== */

        if (
            window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
            !('IntersectionObserver' in window)
        ) {

            revealAbout();

            return;

        }


        /* ====================================================
           OBSERVER
           ==================================================== */

        const observer = new IntersectionObserver(
            (entries, obs) => {

                entries.forEach(entry => {

                    if (entry.isIntersecting) {

                        revealAbout();

                        obs.unobserve(entry.target);

                    }

                });

            },
            {
                threshold: 0,
                rootMargin: '0px'
            }
        );

        observer.observe(aboutSection);

    }


    /* ========================================================
       DOCUMENT INITIALIZATION
       ======================================================== */

    if (document.readyState === 'loading') {

        document.addEventListener(
            'DOMContentLoaded',
            initializeAboutEntrance,
            { once: true }
        );

    } else {

        initializeAboutEntrance();

    }

})();
