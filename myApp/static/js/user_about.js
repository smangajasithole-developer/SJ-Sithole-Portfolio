/* ============================================================
   ABOUT SECTION — SLIDER AND SCROLL ANIMATION
   ============================================================ */

(function () {

    'use strict';


    /* ========================================================
       ELEMENT REFERENCES
       ======================================================== */

    const aboutSection = document.querySelector('#about');

    if (!aboutSection) {
        return;
    }

    const sliderContainer = aboutSection.querySelector('.about-slider-container');
    const slider          = aboutSection.querySelector('.about-slider');

    const dots = Array.from(
        aboutSection.querySelectorAll('.about-slider-dot')
    );

    if (!sliderContainer || !slider || dots.length !== 2) {
        return;
    }


    /* ========================================================
       SCROLL ENTRANCE ANIMATION
       ======================================================== */

    function showAbout() {
        aboutSection.classList.add('is-visible');
    }


    /* ========================================================
       RETURN TO ABOUT SECTION POSITION
       ======================================================== */

    function returnToAboutPosition() {

        aboutSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

    }


    const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    ).matches;


    if (prefersReducedMotion || !('IntersectionObserver' in window)) {

        showAbout();

    } else {

        const observer = new IntersectionObserver(
            (entries, obs) => {

                entries.forEach((entry) => {

                    if (entry.isIntersecting) {

                        showAbout();

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
       SLIDER SETTINGS
       ======================================================== */

    const mobileBreakpoint = window.matchMedia('(max-width: 900px)');

    const transitionDuration = 450;
    const swipeThreshold     = 45;


    /* ========================================================
       SLIDER STATE
       ======================================================== */

    let currentIndex = 1;

    let isMobile    = false;
    let isAnimating = false;
    let isDragging  = false;
    let hasDragged  = false;

    let startX       = 0;
    let startY       = 0;
    let dragDistance = 0;

    let wheelDistance      = 0;
    let transitionFallback = null;


    /* ========================================================
       SLIDER POSITION
       ======================================================== */

    function setSliderPosition(animate = true) {

        slider.style.transition = animate
            ? `transform ${transitionDuration}ms ease-in-out`
            : 'none';

        slider.style.transform =
            `translate3d(-${currentIndex * 100}%, 0, 0)`;

    }


    /* ========================================================
       UPDATE ACTIVE PANEL HEIGHT
       ======================================================== */

    function updateActivePanelHeight() {

        if (!isMobile) {
            return;
        }

        const activePanel = slider.children[currentIndex];

        if (!activePanel) {
            return;
        }

        const panelHeight = activePanel.getBoundingClientRect().height;

        if (panelHeight > 0) {
            sliderContainer.style.height = `${panelHeight}px`;
        }

    }


    /* ========================================================
       UPDATE NAVIGATION DOTS
       ======================================================== */

    function updateDots() {

        // Index 0 and 2 represent the About Me panel.
        // Index 1 and 3 represent the Statistics panel.

        const activeIndex =
            currentIndex === 0 || currentIndex === 2 ? 1 : 0;

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


    /* ========================================================
       UPDATE VISIBLE PANEL ARROWS
       ======================================================== */

    function updateArrowVisibility() {

        const panels = Array.from(slider.children);

        panels.forEach((panel, index) => {

            const isActiveOriginalPanel =
                (currentIndex === 1 && index === 1) ||
                (currentIndex === 2 && index === 2);

            panel.querySelectorAll('.about-slider-arrow').forEach((button) => {

                button.classList.toggle(
                    'is-visible',
                    isActiveOriginalPanel
                );

            });

        });

    }


    /* ========================================================
       COMPLETE SLIDER TRANSITION
       ======================================================== */

    function finishTransition() {

        if (!isMobile || !isAnimating) {
            return;
        }

        clearTimeout(transitionFallback);

        // Normalize the cloned last panel.
        if (currentIndex === 3) {

            currentIndex = 1;

            setSliderPosition(false);

        }

        // Normalize the cloned first panel.
        else if (currentIndex === 0) {

            currentIndex = 2;

            setSliderPosition(false);

        }

        isAnimating   = false;
        wheelDistance = 0;

        updateDots();
        updateArrowVisibility();

        // Keep the About section in its correct scroll position.
        returnToAboutPosition();

    }


    slider.addEventListener('transitionend', (event) => {

        if (
            event.target === slider &&
            event.propertyName === 'transform'
        ) {
            finishTransition();
        }

    });


    /* ========================================================
       NAVIGATE TO A PANEL
       ======================================================== */

    function moveTo(index) {

        if (!isMobile || isAnimating || isDragging) {
            return;
        }

        if (index < 0 || index > 3) {
            return;
        }

        currentIndex = index;

        isAnimating = true;

        // Update the incoming panel's height.
        updateActivePanelHeight();

        // Update the visible panel arrows.
        updateArrowVisibility();

        setSliderPosition(true);

        updateDots();

        clearTimeout(transitionFallback);

        transitionFallback = setTimeout(
            finishTransition,
            transitionDuration + 150
        );

    }


    /* ========================================================
       NEXT AND PREVIOUS
       ======================================================== */

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


    /* ========================================================
       ARROW CONTROLS — BOTH PANELS
       ======================================================== */

    const prevButtons = aboutSection.querySelectorAll('.about-slider-prev');
    const nextButtons = aboutSection.querySelectorAll('.about-slider-next');

    prevButtons.forEach((button) => {
        button.addEventListener('click', movePrevious);
    });

    nextButtons.forEach((button) => {
        button.addEventListener('click', moveNext);
    });


    /* ========================================================
       DOT CONTROLS
       ======================================================== */

    dots.forEach((dot, index) => {

        dot.addEventListener('click', () => {

            if (!isMobile || isAnimating || isDragging) {
                return;
            }

            moveTo(index + 1);

        });

    });


    /* ========================================================
       POINTER DOWN — MOUSE AND TOUCH
       ======================================================== */

    sliderContainer.addEventListener('pointerdown', (event) => {

        if (!isMobile || isAnimating || isDragging) {
            return;
        }

        if (event.pointerType === 'mouse' && event.button !== 0) {
            return;
        }

        if (event.target.closest('button, a')) {
            return;
        }

        isDragging = true;
        hasDragged = false;

        startX = event.clientX;
        startY = event.clientY;

        dragDistance = 0;

        slider.style.transition = 'none';

        sliderContainer.setPointerCapture(event.pointerId);

    });


    /* ========================================================
       POINTER MOVE
       ======================================================== */

    sliderContainer.addEventListener('pointermove', (event) => {

        if (!isDragging || !isMobile) {
            return;
        }

        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;

        // Allow normal vertical page scrolling.
        if (
            !hasDragged &&
            Math.abs(deltaY) > Math.abs(deltaX)
        ) {
            return;
        }

        if (Math.abs(deltaX) > 5) {
            hasDragged = true;
        }

        if (!hasDragged) {
            return;
        }

        event.preventDefault();

        dragDistance = deltaX;

        slider.style.transform =
            `translate3d(calc(-${currentIndex * 100}% + ${dragDistance}px), 0, 0)`;

    });


    /* ========================================================
       POINTER UP — FINISH DRAG
       ======================================================== */

    function finishDragging() {

        if (!isDragging) {
            return;
        }

        isDragging = false;

        if (!isMobile) {
            return;
        }

        if (Math.abs(dragDistance) >= swipeThreshold) {

            if (dragDistance < 0) {

                moveNext();

            } else {

                movePrevious();

            }

        } else {

            setSliderPosition(true);

        }

        dragDistance = 0;

    }


    sliderContainer.addEventListener('pointerup', finishDragging);
    sliderContainer.addEventListener('pointercancel', finishDragging);
    sliderContainer.addEventListener('lostpointercapture', finishDragging);


    /* ========================================================
       PREVENT CLICK AFTER MOUSE DRAG
       ======================================================== */

    sliderContainer.addEventListener('click', (event) => {

        if (hasDragged) {

            event.preventDefault();
            event.stopPropagation();

            hasDragged = false;

        }

    }, true);


    /* ========================================================
       TOUCHPAD HORIZONTAL SCROLL
       ======================================================== */

    sliderContainer.addEventListener('wheel', (event) => {

        if (!isMobile || isAnimating || isDragging) {
            return;
        }

        if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) {
            return;
        }

        event.preventDefault();

        wheelDistance += event.deltaX;

        if (wheelDistance >= swipeThreshold) {

            moveNext();

        } else if (wheelDistance <= -swipeThreshold) {

            movePrevious();

        }

    }, { passive: false });


    /* ========================================================
       REMOVE EXISTING CLONES
       ======================================================== */

    function removeClones() {

        slider.querySelectorAll('[data-about-clone="true"]').forEach((clone) => {
            clone.remove();
        });

    }


    /* ========================================================
       INITIALIZE MOBILE SLIDER
       ======================================================== */

    function initializeMobileSlider() {

        removeClones();

        const panels = Array.from(
            slider.querySelectorAll('.about-panel')
        );

        if (panels.length !== 2) {
            return;
        }

        const firstPanel = panels[0];
        const lastPanel  = panels[1];

        // Clone the last panel for backward looping.
        const lastClone = lastPanel.cloneNode(true);

        lastClone.dataset.aboutClone = 'true';
        lastClone.setAttribute('aria-hidden', 'true');
        lastClone.inert = true;

        // Clone the first panel for forward looping.
        const firstClone = firstPanel.cloneNode(true);

        firstClone.dataset.aboutClone = 'true';
        firstClone.setAttribute('aria-hidden', 'true');
        firstClone.inert = true;

        slider.insertBefore(lastClone, firstPanel);
        slider.appendChild(firstClone);

        currentIndex = 1;

        isAnimating = false;
        isDragging  = false;

        setSliderPosition(false);

        updateDots();
        updateArrowVisibility();

        // Measure the initial panel after browser layout.
        requestAnimationFrame(() => {
            updateActivePanelHeight();
        });

    }


    /* ========================================================
       DISABLE MOBILE SLIDER ON DESKTOP
       ======================================================== */

    function disableMobileSlider() {

        clearTimeout(transitionFallback);

        removeClones();

        isMobile    = false;
        isAnimating = false;
        isDragging  = false;

        currentIndex = 1;

        slider.style.transition = '';
        slider.style.transform  = '';

        // Restore natural desktop height.
        sliderContainer.style.height = '';

        sliderContainer.style.cursor = '';

        // Remove mobile-only arrow visibility classes.
        aboutSection.querySelectorAll('.about-slider-arrow').forEach((button) => {
            button.classList.remove('is-visible');
        });

        updateDots();

    }


    /* ========================================================
       RESPONSIVE INITIALIZATION
       ======================================================== */

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


    /* ========================================================
       UPDATE PANEL HEIGHT ON WINDOW RESIZE
       ======================================================== */

    window.addEventListener('resize', () => {

        if (isMobile) {
            updateActivePanelHeight();
        }

    });


    /* ========================================================
       INITIALIZE SLIDER
       ======================================================== */

    handleResponsiveChange();

})();