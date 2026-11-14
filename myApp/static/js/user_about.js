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

    const prevButton = aboutSection.querySelector('.about-slider-prev');
    const nextButton = aboutSection.querySelector('.about-slider-next');

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
       UPDATE NAVIGATION DOTS
       ======================================================== */

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


    /* ========================================================
       COMPLETE SLIDER TRANSITION
       ======================================================== */

    function finishTransition() {

        if (!isMobile || !isAnimating) {
            return;
        }

        clearTimeout(transitionFallback);

        if (currentIndex === 3) {

            currentIndex = 1;

            setSliderPosition(false);

        } else if (currentIndex === 0) {

            currentIndex = 2;

            setSliderPosition(false);

        }

        isAnimating   = false;
        wheelDistance = 0;

        updateDots();

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
       ARROW CONTROLS
       ======================================================== */

    if (prevButton) {
        prevButton.addEventListener('click', movePrevious);
    }

    if (nextButton) {
        nextButton.addEventListener('click', moveNext);
    }


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

        const lastClone = lastPanel.cloneNode(true);

        lastClone.dataset.aboutClone = 'true';
        lastClone.setAttribute('aria-hidden', 'true');
        lastClone.inert = true;

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

        sliderContainer.style.cursor = '';

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
       INITIALIZE SLIDER
       ======================================================== */

    handleResponsiveChange();

})();