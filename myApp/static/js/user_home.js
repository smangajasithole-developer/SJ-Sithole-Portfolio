
/* ============================================================
   HOME — SCROLL ENTRANCE OBSERVER
   ============================================================ */

(function () {

    'use strict';


    /* ========================================================
       INITIALIZE HOME ENTRANCE
       ======================================================== */

    function initializeHomeEntrance() {

        /* ====================================================
           ELEMENT REFERENCES
           ==================================================== */

        const homeSection = document.querySelector('#home');

        if (!homeSection) {
            return;
        }


        /* ====================================================
           REVEAL HOME
           ==================================================== */

        function revealHome() {

            homeSection.classList.add('is-visible');

        }


        /* ====================================================
           REDUCED MOTION / FALLBACK
           ==================================================== */

        if (
            window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
            !('IntersectionObserver' in window)
        ) {

            revealHome();

            return;

        }


        /* ====================================================
           OBSERVER
           ==================================================== */

        const observer = new IntersectionObserver(
            (entries, obs) => {

                entries.forEach(entry => {

                    if (entry.isIntersecting) {

                        revealHome();

                        obs.unobserve(entry.target);

                    }

                });

            },
            {
                threshold: 0.1
            }
        );

        observer.observe(homeSection);

    }


    /* ========================================================
       DOCUMENT INITIALIZATION
       ======================================================== */

    if (document.readyState === 'loading') {

        document.addEventListener(
            'DOMContentLoaded',
            initializeHomeEntrance,
            { once: true }
        );

    } else {

        initializeHomeEntrance();

    }

})();
