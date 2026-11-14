/* ============================================================
   HOME INTRO — RESPONSIVE INFINITE SLIDER
   ============================================================

   Desktop:
   - Introduction and profile displayed side by side.
   - Slider functionality disabled.

   Mobile/tablet:
   - Introduction appears first.
   - Swipe or drag left to show the profile.
   - Swipe or drag right to return to the introduction.
   - Navigation arrows switch between panels.
   - Navigation dots show the active panel.
   - Infinite looping in both directions.
   - Horizontal mouse wheel and trackpad scrolling supported.

   ============================================================ */

(function () {

    'use strict';


    /* ========================================================
       INITIALIZE
       ======================================================== */

    function initHomeSlider() {

        /* ====================================================
           ELEMENT REFERENCES
           ==================================================== */

        const container = document.querySelector('.home-container');
        const slider    = container?.querySelector('.home-slides');

        if (!container || !slider) {
            return;
        }

        const originalPanels = Array.from(
            slider.querySelectorAll(':scope > .home-slide')
        );

        if (originalPanels.length !== 2) {
            return;
        }

        const controls = container.querySelector('.home-slider-controls');

        if (!controls) {
            return;
        }

        // These selectors match the existing HTML.
        const previousButton = controls.querySelector('.about-slider-prev');
        const nextButton     = controls.querySelector('.about-slider-next');

        const dots = Array.from(
            controls.querySelectorAll('.home-slider-dot')
        );

        if (!previousButton || !nextButton || dots.length !== 2) {
            return;
        }


        /* ====================================================
           SETTINGS
           ==================================================== */

        const mobileBreakpoint = window.matchMedia('(max-width: 900px)');

        const transitionDuration  = 450;
        const swipeThreshold      = 45;
        const dragStartThreshold  = 8;
        const wheelResetDelay     = 180;


        /* ====================================================
           STATE
           ==================================================== */

        let currentIndex = 1;

        let isMobile    = false;
        let isAnimating = false;
        let isDragging  = false;
        let hasDragged  = false;

        let pointerId   = null;
        let pointerAxis = null;

        let startX       = 0;
        let startY       = 0;
        let dragDistance = 0;

        let wheelDistance = 0;

        let transitionFallback = null;
        let wheelResetTimer    = null;
        let clickResetTimer    = null;

        let suppressClick = false;


        /* ====================================================
           CLONE MANAGEMENT
           ==================================================== */

        function createClone(panel) {

            const clone = panel.cloneNode(true);

            clone.removeAttribute('id');

            clone.querySelectorAll('[id]').forEach(element => {
                element.removeAttribute('id');
            });

            clone.setAttribute('aria-hidden', 'true');
            clone.setAttribute('inert', '');

            return clone;
        }


        function removeClones() {

            slider.querySelectorAll('[data-home-clone="true"]').forEach(clone => {
                clone.remove();
            });

        }


        /* ====================================================
           SLIDER POSITION
           ==================================================== */

        function setSliderPosition(animate = true) {

            slider.style.transition = animate
                ? `transform ${transitionDuration}ms ease-in-out`
                : 'none';

            slider.style.transform =
                `translate3d(-${currentIndex * 100}%, 0, 0)`;

        }


        /* ====================================================
           UPDATE NAVIGATION DOTS
           ==================================================== */

        function updateDots() {

            const activeIndex = currentIndex === 2 ? 1 : 0;

            dots.forEach((dot, index) => {

                const active = index === activeIndex;

                dot.classList.toggle('active', active);

                if (active) {
                    dot.setAttribute('aria-current', 'true');
                } else {
                    dot.removeAttribute('aria-current');
                }

            });

        }


        /* ====================================================
           TRANSITION CLEANUP
           ==================================================== */

        function finishTransition() {

            if (!isMobile || !isAnimating) {
                return;
            }

            clearTimeout(transitionFallback);

            // Reset from the cloned last panel to the real first panel.
            if (currentIndex === 3) {

                currentIndex = 1;

                setSliderPosition(false);

                // Apply the reset before another transition begins.
                slider.getBoundingClientRect();

            }

            // Reset from the cloned first panel to the real last panel.
            else if (currentIndex === 0) {

                currentIndex = 2;

                setSliderPosition(false);

                slider.getBoundingClientRect();

            }

            isAnimating   = false;
            wheelDistance = 0;

            updateDots();

        }


        slider.addEventListener('transitionend', event => {

            if (
                event.target === slider &&
                event.propertyName === 'transform'
            ) {
                finishTransition();
            }

        });


        /* ====================================================
           NAVIGATION
           ==================================================== */

        function moveTo(index) {

            if (
                !isMobile ||
                isAnimating ||
                isDragging ||
                index < 0 ||
                index > 3
            ) {
                return;
            }

            currentIndex = index;

            isAnimating = true;

            setSliderPosition(true);

            updateDots();

            clearTimeout(transitionFallback);

            // Recovery in case transitionend does not fire.
            transitionFallback = setTimeout(
                finishTransition,
                transitionDuration + 200
            );

        }


        function moveNext() {

            if (!isMobile || isAnimating || isDragging) {
                return;
            }

            moveTo(currentIndex + 1);

        }


        function movePrevious() {

            if (!isMobile || isAnimating || isDragging) {
                return;
            }

            moveTo(currentIndex - 1);

        }


        /* ====================================================
           ARROW CONTROLS
           ==================================================== */

        previousButton.addEventListener('click', movePrevious);
        nextButton.addEventListener('click', moveNext);


        /* ====================================================
           DOT CONTROLS
           ==================================================== */

        dots.forEach((dot, index) => {

            dot.addEventListener('click', () => {

                if (!isMobile || isAnimating || isDragging) {
                    return;
                }

                moveTo(index + 1);

            });

        });


        /* ====================================================
           POINTER DOWN — MOUSE AND TOUCH
           ==================================================== */

        container.addEventListener('pointerdown', event => {

            if (!isMobile || isAnimating || isDragging) {
                return;
            }

            if (
                event.pointerType === 'mouse' &&
                event.button !== 0
            ) {
                return;
            }

            // Do not interfere with interactive elements.
            if (
                event.target.closest?.(
                    'button, a, input, select, textarea'
                )
            ) {
                return;
            }

            isDragging = true;
            hasDragged = false;

            pointerId   = event.pointerId;
            pointerAxis = null;

            startX = event.clientX;
            startY = event.clientY;

            dragDistance = 0;

            slider.style.transition = 'none';

            if (container.setPointerCapture) {
                container.setPointerCapture(event.pointerId);
            }

        });


        /* ====================================================
           POINTER MOVE
           ==================================================== */

        container.addEventListener('pointermove', event => {

            if (
                !isDragging ||
                !isMobile ||
                event.pointerId !== pointerId
            ) {
                return;
            }

            const deltaX = event.clientX - startX;
            const deltaY = event.clientY - startY;

            // Determine the intended gesture direction.
            if (!pointerAxis) {

                if (
                    Math.abs(deltaX) < dragStartThreshold &&
                    Math.abs(deltaY) < dragStartThreshold
                ) {
                    return;
                }

                if (Math.abs(deltaY) > Math.abs(deltaX)) {

                    // Let the browser handle vertical scrolling.
                    isDragging = false;

                    pointerId   = null;
                    pointerAxis = null;

                    dragDistance = 0;

                    return;

                }

                pointerAxis = 'horizontal';

            }

            if (pointerAxis !== 'horizontal') {
                return;
            }

            if (Math.abs(deltaX) > 5) {
                hasDragged = true;
            }

            if (!hasDragged) {
                return;
            }

            if (event.cancelable) {
                event.preventDefault();
            }

            dragDistance = deltaX;

            slider.style.transform =
                `translate3d(calc(-${currentIndex * 100}% + ${dragDistance}px), 0, 0)`;

        });


        /* ====================================================
           CLICK SUPPRESSION AFTER DRAGGING
           ==================================================== */

        function suppressNextClick() {

            suppressClick = true;

            clearTimeout(clickResetTimer);

            clickResetTimer = setTimeout(() => {
                suppressClick = false;
            }, 500);

        }


        container.addEventListener('click', event => {

            if (!suppressClick) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            suppressClick = false;

            clearTimeout(clickResetTimer);

        }, true);


        /* ====================================================
           FINISH DRAGGING
           ==================================================== */

        function finishDragging(allowSwipe = true) {

            if (!isDragging) {
                return;
            }

            const wasHorizontalDrag = hasDragged;
            const finalDistance     = dragDistance;

            isDragging = false;

            pointerId   = null;
            pointerAxis = null;

            hasDragged   = false;
            dragDistance = 0;

            if (!isMobile) {
                return;
            }

            if (wasHorizontalDrag) {
                suppressNextClick();
            }

            if (
                allowSwipe &&
                wasHorizontalDrag &&
                Math.abs(finalDistance) >= swipeThreshold
            ) {

                if (finalDistance < 0) {
                    moveNext();
                } else {
                    movePrevious();
                }

            } else {

                // Return smoothly to the current panel.
                setSliderPosition(true);

            }

        }


        container.addEventListener('pointerup', event => {

            if (event.pointerId === pointerId) {
                finishDragging(true);
            }

        });


        container.addEventListener('pointercancel', event => {

            if (event.pointerId === pointerId) {
                finishDragging(false);
            }

        });


        container.addEventListener('lostpointercapture', event => {

            if (event.pointerId === pointerId) {
                finishDragging(false);
            }

        });


        /* ====================================================
           HORIZONTAL TOUCHPAD / MOUSE WHEEL
           ==================================================== */

        container.addEventListener('wheel', event => {

            if (!isMobile || isAnimating || isDragging) {
                return;
            }

            // Ignore vertical page scrolling.
            if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) {
                return;
            }

            if (event.cancelable) {
                event.preventDefault();
            }

            wheelDistance += event.deltaX;

            // Clear accumulated movement after each gesture.
            clearTimeout(wheelResetTimer);

            wheelResetTimer = setTimeout(() => {
                wheelDistance = 0;
            }, wheelResetDelay);

            if (wheelDistance >= swipeThreshold) {

                wheelDistance = 0;

                clearTimeout(wheelResetTimer);

                moveNext();

            } else if (wheelDistance <= -swipeThreshold) {

                wheelDistance = 0;

                clearTimeout(wheelResetTimer);

                movePrevious();

            }

        }, { passive: false });


        /* ====================================================
           INITIALIZE MOBILE SLIDER
           ==================================================== */

        function initializeMobileSlider() {

            removeClones();

            const panels = Array.from(
                slider.querySelectorAll(':scope > .home-slide')
            );

            if (panels.length !== 2) {
                return;
            }

            const firstPanel = panels[0];
            const lastPanel  = panels[1];

            // Clone the last panel before the first.
            const lastClone = createClone(lastPanel);

            lastClone.dataset.homeClone = 'true';

            // Clone the first panel after the last.
            const firstClone = createClone(firstPanel);

            firstClone.dataset.homeClone = 'true';

            slider.insertBefore(lastClone, firstPanel);
            slider.appendChild(firstClone);

            // Configure the mobile slider.
            slider.classList.add('home-slider-active');

            slider.style.display       = 'flex';
            slider.style.flexWrap      = 'nowrap';
            slider.style.flexDirection = 'row';
            slider.style.width         = '100%';
            slider.style.gap           = '0';
            slider.style.overflow      = 'visible';

            // Apply touch handling to the pointer event container.
            container.style.touchAction = 'pan-y';

            slider.querySelectorAll('.home-slide').forEach(panel => {

                panel.style.flex      = '0 0 100%';
                panel.style.width     = '100%';
                panel.style.minWidth  = '100%';
                panel.style.maxWidth  = '100%';
                panel.style.boxSizing = 'border-box';

            });

            // Start on the real introduction panel.
            currentIndex = 1;

            isAnimating = false;
            isDragging  = false;

            pointerId   = null;
            pointerAxis = null;

            wheelDistance = 0;
            dragDistance  = 0;

            setSliderPosition(false);

            slider.getBoundingClientRect();

            updateDots();

        }


        /* ====================================================
           DISABLE MOBILE SLIDER ON DESKTOP
           ==================================================== */

        function disableMobileSlider() {

            clearTimeout(transitionFallback);
            clearTimeout(wheelResetTimer);
            clearTimeout(clickResetTimer);

            removeClones();

            isMobile    = false;
            isAnimating = false;
            isDragging  = false;

            hasDragged    = false;
            suppressClick = false;

            pointerId   = null;
            pointerAxis = null;

            currentIndex = 1;

            slider.classList.remove('home-slider-active');

            slider.style.display       = '';
            slider.style.flexWrap      = '';
            slider.style.flexDirection = '';
            slider.style.width         = '';
            slider.style.gap           = '';
            slider.style.overflow      = '';
            slider.style.transition    = '';
            slider.style.transform     = '';

            container.style.touchAction = '';
            container.style.cursor      = '';

            originalPanels.forEach(panel => {

                panel.style.flex      = '';
                panel.style.width     = '';
                panel.style.minWidth  = '';
                panel.style.maxWidth  = '';
                panel.style.boxSizing = '';

            });

            wheelDistance = 0;
            dragDistance  = 0;

            updateDots();

        }


        /* ====================================================
           RESPONSIVE INITIALIZATION
           ==================================================== */

        function handleResponsiveChange() {

            if (mobileBreakpoint.matches) {

                if (!isMobile) {

                    isMobile = true;

                    initializeMobileSlider();

                }

            } else if (isMobile) {

                disableMobileSlider();

            }

        }


        mobileBreakpoint.addEventListener('change', handleResponsiveChange);


        /* ====================================================
           INITIALIZE
           ==================================================== */

        handleResponsiveChange();

    }


    /* ========================================================
       DOCUMENT INITIALIZATION
       ======================================================== */

    if (document.readyState === 'loading') {

        document.addEventListener('DOMContentLoaded', initHomeSlider);

    } else {

        initHomeSlider();

    }

})();


/* ============================================================
   HOME — SCROLL ENTRANCE OBSERVER
   ============================================================ */

(function () {

    'use strict';


    /* ========================================================
       ELEMENT REFERENCES
       ======================================================== */

    const homeSection = document.querySelector('#home');

    if (!homeSection) {
        return;
    }


    /* ========================================================
       REVEAL HOME
       ======================================================== */

    function revealHome() {
        homeSection.classList.add('is-visible');
    }


    /* ========================================================
       REDUCED MOTION / FALLBACK
       ======================================================== */

    if (
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        !('IntersectionObserver' in window)
    ) {

        revealHome();

        return;
    }


    /* ========================================================
       OBSERVER
       ======================================================== */

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

})();