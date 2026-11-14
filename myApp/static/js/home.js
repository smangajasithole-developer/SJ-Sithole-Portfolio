
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

   ============================================================ */

(function () {
    'use strict';

    function initHomeSlider() {

        const slider = document.querySelector('.home-slides');
        const container = document.querySelector('.home-container');

        if (!slider || !container) return;

        const originalPanels = Array.from(
            slider.querySelectorAll(':scope > .home-slide')
        );

        if (originalPanels.length !== 2) return;

        const controls = container.querySelector('.home-slider-controls');

        if (!controls) return;

        const previousButton = controls.querySelector('.prev');
        const nextButton = controls.querySelector('.next');

        const dots = Array.from(
            controls.querySelectorAll('.home-slider-dot')
        );

        if (!previousButton || !nextButton || dots.length !== 2) return;

        const mobileQuery = window.matchMedia('(max-width: 900px)');

        const transitionDuration = 450;
        const swipeThreshold = 45;

        let activeIndex = 0;
        let currentPosition = 1;
        let slideWidth = 0;

        let isEnabled = false;
        let isDragging = false;
        let isTransitioning = false;

        let startX = 0;
        let startY = 0;
        let startTranslate = 0;
        let currentTranslate = 0;

        let resizeFrame = null;

        let firstClone = null;
        let lastClone = null;


        /* ====================================================
           CLONE MANAGEMENT
           ==================================================== */

        function createClone(panel) {

            const clone = panel.cloneNode(true);

            // Avoid duplicate IDs in the document.
            clone.removeAttribute('id');

            clone.querySelectorAll('[id]').forEach(element => {
                element.removeAttribute('id');
            });

            // Clones should not be announced as separate content.
            clone.setAttribute('aria-hidden', 'true');
            clone.setAttribute('inert', '');

            return clone;
        }


        function createClones() {

            firstClone = createClone(originalPanels[0]);
            lastClone = createClone(originalPanels[1]);

            slider.insertBefore(lastClone, originalPanels[0]);
            slider.appendChild(firstClone);

        }


        function removeClones() {

            if (firstClone) {
                firstClone.remove();
                firstClone = null;
            }

            if (lastClone) {
                lastClone.remove();
                lastClone = null;
            }

        }


        /* ====================================================
           DOT NAVIGATION
           ==================================================== */

        function updateDots() {

            dots.forEach((dot, index) => {

                const isActive = index === activeIndex;

                dot.classList.toggle('active', isActive);

                if (isActive) {
                    dot.setAttribute('aria-current', 'true');
                } else {
                    dot.removeAttribute('aria-current');
                }

            });

        }


        /* ====================================================
           SLIDER POSITION
           ==================================================== */

        function setPosition(position, animate = true) {

            if (!slideWidth) return;

            slider.style.transition = animate
                ? `transform ${transitionDuration}ms ease-in-out`
                : 'none';

            currentTranslate = -(position * slideWidth);

            slider.style.transform =
                `translate3d(${currentTranslate}px, 0, 0)`;

        }


        function updatePositionAfterTransition() {

            if (currentPosition === 0) {

                // Reached the cloned last panel.
                currentPosition = originalPanels.length;

                setPosition(currentPosition, false);

            } else if (currentPosition === originalPanels.length + 1) {

                // Reached the cloned first panel.
                currentPosition = 1;

                setPosition(currentPosition, false);

            }

        }



        /* ====================================================
           MOVE TO A PANEL
           ==================================================== */

        function moveToPanel(index) {

            if (!isEnabled || isTransitioning || isDragging) return;

            const targetIndex =
                (index + originalPanels.length) % originalPanels.length;

            // Do nothing if the selected panel is already active.
            if (targetIndex === activeIndex) return;

            activeIndex = targetIndex;
            currentPosition = activeIndex + 1;

            updateDots();

            isTransitioning = true;

            setPosition(currentPosition, true);

        }


        function moveNext() {

            if (!isEnabled || isTransitioning || isDragging) return;

            // Always move one panel to the left.
            currentPosition++;

            activeIndex =
                (activeIndex + 1) % originalPanels.length;

            updateDots();

            isTransitioning = true;

            setPosition(currentPosition, true);

        }


        function movePrevious() {

            if (!isEnabled || isTransitioning || isDragging) return;

            // Always move one panel to the right.
            currentPosition--;

            activeIndex =
                (activeIndex - 1 + originalPanels.length) %
                originalPanels.length;

            updateDots();

            isTransitioning = true;

            setPosition(currentPosition, true);

        }


        /* ====================================================
           TRANSITION END
           ==================================================== */

        function handleTransitionEnd(event) {

            if (event.target !== slider) return;
            if (event.propertyName !== 'transform') return;

            updatePositionAfterTransition();

            // Update the logical index after reaching a clone.
            if (currentPosition === 1) {
                activeIndex = 0;
            } else if (currentPosition === originalPanels.length) {
                activeIndex = originalPanels.length - 1;
            }

            updateDots();

            isTransitioning = false;

        }


        /* ====================================================
           DOT CLICK EVENTS
           ==================================================== */

        function handleDotClick(event) {

            const index = dots.indexOf(event.currentTarget);

            if (index !== -1) {
                moveToPanel(index);
            }

        }


        /* ====================================================
           POINTER / TOUCH DRAGGING
           ==================================================== */

        function handlePointerDown(event) {

            if (!isEnabled || isTransitioning) return;

            if (event.pointerType === 'mouse' && event.button !== 0) {
                return;
            }

            isDragging = true;

            startX = event.clientX;
            startY = event.clientY;

            startTranslate = currentTranslate;

            slider.classList.add('dragging');

            slider.style.transition = 'none';

            if (slider.setPointerCapture) {
                slider.setPointerCapture(event.pointerId);
            }

        }


        function handlePointerMove(event) {

            if (!isDragging) return;

            const differenceX = event.clientX - startX;
            const differenceY = event.clientY - startY;

            // Allow normal vertical page scrolling.
            if (Math.abs(differenceY) > Math.abs(differenceX) &&
                Math.abs(differenceY) > 10) {
                return;
            }

            currentTranslate = startTranslate + differenceX;

            slider.style.transform =
                `translate3d(${currentTranslate}px, 0, 0)`;

        }


        function handlePointerUp(event) {

            if (!isDragging) return;

            isDragging = false;

            slider.classList.remove('dragging');

            const differenceX = event.clientX - startX;
            const differenceY = event.clientY - startY;

            if (
                Math.abs(differenceX) > swipeThreshold &&
                Math.abs(differenceX) > Math.abs(differenceY)
            ) {

                if (differenceX < 0) {
                    moveNext();
                } else {
                    movePrevious();
                }

            } else {

                // Return to the current panel.
                setPosition(currentPosition, true);
                isTransitioning = true;

            }

        }


        function handlePointerCancel() {

            if (!isDragging) return;

            isDragging = false;

            slider.classList.remove('dragging');

            isTransitioning = true;

            setPosition(currentPosition, true);

        }


        /* ====================================================
           RESIZE HANDLING
           ==================================================== */

        function updateSliderSize() {

            if (!isEnabled) return;

            slideWidth = slider.clientWidth;

            setPosition(currentPosition, false);

            isTransitioning = false;

        }


        function handleResize() {

            if (resizeFrame) {
                cancelAnimationFrame(resizeFrame);
            }

            resizeFrame = requestAnimationFrame(() => {

                if (mobileQuery.matches) {
                    updateSliderSize();
                } else {
                    disableSlider();
                }

            });

        }


        /* ====================================================
           ENABLE MOBILE SLIDER
           ==================================================== */

        function enableSlider() {

            if (isEnabled) return;

            isEnabled = true;

            activeIndex = 0;
            currentPosition = 1;

            createClones();

            slider.classList.add('home-slider-active');

            slider.style.display = 'flex';
            slider.style.flexWrap = 'nowrap';
            slider.style.flexDirection = 'row';
            slider.style.width = '100%';
            slider.style.gap = '0';
            slider.style.overflow = 'visible';
            slider.style.transition = 'none';
            slider.style.touchAction = 'pan-y';

            slider.querySelectorAll('.home-slide').forEach(panel => {

                panel.style.flex = '0 0 100%';
                panel.style.width = '100%';
                panel.style.minWidth = '100%';
                panel.style.maxWidth = '100%';
                panel.style.boxSizing = 'border-box';

            });

            slideWidth = slider.clientWidth;

            setPosition(currentPosition, false);

            updateDots();

            // Navigation.
            previousButton.addEventListener('click', movePrevious);
            nextButton.addEventListener('click', moveNext);

            dots.forEach(dot => {
                dot.addEventListener('click', handleDotClick);
            });

            // Dragging and swiping.
            slider.addEventListener('pointerdown', handlePointerDown);
            slider.addEventListener('pointermove', handlePointerMove);
            slider.addEventListener('pointerup', handlePointerUp);
            slider.addEventListener('pointercancel', handlePointerCancel);

            slider.addEventListener(
                'transitionend',
                handleTransitionEnd
            );

        }


        /* ====================================================
           DISABLE MOBILE SLIDER
           ==================================================== */

        function disableSlider() {

            if (!isEnabled) return;

            isEnabled = false;

            slider.classList.remove('home-slider-active');
            slider.classList.remove('dragging');

            // Remove navigation events.
            previousButton.removeEventListener('click', movePrevious);
            nextButton.removeEventListener('click', moveNext);

            dots.forEach(dot => {
                dot.removeEventListener('click', handleDotClick);
            });

            // Remove pointer events.
            slider.removeEventListener('pointerdown', handlePointerDown);
            slider.removeEventListener('pointermove', handlePointerMove);
            slider.removeEventListener('pointerup', handlePointerUp);
            slider.removeEventListener('pointercancel', handlePointerCancel);

            slider.removeEventListener(
                'transitionend',
                handleTransitionEnd
            );

            // Remove cloned panels.
            removeClones();

            // Restore original desktop layout.
            slider.style.display = '';
            slider.style.flexWrap = '';
            slider.style.flexDirection = '';
            slider.style.width = '';
            slider.style.gap = '';
            slider.style.overflow = '';
            slider.style.transition = '';
            slider.style.transform = '';
            slider.style.touchAction = '';

            originalPanels.forEach(panel => {

                panel.style.flex = '';
                panel.style.width = '';
                panel.style.minWidth = '';
                panel.style.maxWidth = '';
                panel.style.boxSizing = '';

            });

            activeIndex = 0;
            currentPosition = 1;

            slideWidth = 0;

            isDragging = false;
            isTransitioning = false;

            updateDots();

        }


        /* ====================================================
           RESPONSIVE INITIALISATION
           ==================================================== */

        function updateSlider() {

            if (mobileQuery.matches) {
                enableSlider();
            } else {
                disableSlider();
            }

        }


        // Initialise the correct layout.
        updateSlider();

        // Monitor screen-size changes.
        mobileQuery.addEventListener('change', updateSlider);

        window.addEventListener('resize', handleResize);

    }


    /* ========================================================
       DOCUMENT INITIALISATION
       ======================================================== */

    if (document.readyState === 'loading') {

        document.addEventListener(
            'DOMContentLoaded',
            initHomeSlider
        );

    } else {

        initHomeSlider();

    }

})();
