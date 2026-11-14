/* ============================================================
   PROJECT SLIDERS — LIVE PROJECTS & OTHER SHOWCASE
   ============================================================

   Handles:
   - Independent Live Projects and Other Showcase sliders
   - Independent category filters
   - Infinite left/right navigation
   - Maximum 3 visible cards on desktop
   - 2 visible cards on tablet
   - 1 visible card on mobile
   - Centre card emphasis
   - Dynamically generated navigation dots
   - Mouse dragging and touch swiping
   - Touchpad horizontal scrolling
   - Keyboard navigation
   - Reduced-motion accessibility
   - Empty category messages

   Existing project cards are rearranged instead of cloned.
   This preserves their modal buttons and video functionality.

   ============================================================ */

(function () {

    'use strict';


    /* ========================================================
       PROJECTS SCROLL ENTRANCE ANIMATION
       ======================================================== */

    const projectsSection = document.querySelector('#projects');

    if (projectsSection) {

        function showProjects() {
            projectsSection.classList.add('is-visible');
        }


        const prefersReducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        ).matches;


        if (prefersReducedMotion || !('IntersectionObserver' in window)) {

            showProjects();

        } else {

            const observer = new IntersectionObserver(
                (entries, obs) => {

                    entries.forEach((entry) => {

                        if (entry.isIntersecting) {

                            showProjects();

                            obs.unobserve(entry.target);

                        }

                    });

                },
                {
                    threshold: 0,
                    rootMargin: '0px'
                }
            );

            observer.observe(projectsSection);

        }

    }


    /* ========================================================
       PROJECT SLIDERS INITIALISATION
       ======================================================== */

    function initProjectSliders() {

        /* ====================================================
           SLIDER ELEMENTS
           ==================================================== */

        const sliders = document.querySelectorAll(
            '#featured-projects-slider, #showcase-projects-slider'
        );

        if (!sliders.length) {
            return;
        }


        /* ====================================================
           CONSTANTS
           ==================================================== */

        const reducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        );

        const ANIMATION_DURATION = 420;
        const SWIPE_THRESHOLD    = 45;


        /* ====================================================
           INIT EACH SLIDER
           ==================================================== */

        sliders.forEach((slider) => {

            /* ================================================
               SLIDER REFERENCES
               ================================================ */

            const viewport = slider.querySelector('.project-slider-viewport');
            const track    = slider.querySelector('.project-slider-track');

            const previousButton = slider.querySelector('.project-slider-prev');
            const nextButton     = slider.querySelector('.project-slider-next');

            const dotsContainer = slider.parentElement.querySelector('.project-slider-dots');
            const filterGroup   = slider.parentElement.querySelector('[data-project-filter-group]');

            if (!viewport || !track) {
                return;
            }


            /* ================================================
               SLIDER STATE
               ================================================ */

            let currentIndex = 0;
            let visibleCount = 3;

            let animating = false;
            let queuedMoves = [];

            let pointerStartX   = 0;
            let pointerStartY   = 0;
            let pointerCurrentX = 0;

            let pointerActive        = false;
            let dragDirectionLocked  = false;
            let suppressClick        = false;

            let wheelDistance = 0;

            let resizeFrame = null;

            let pendingFilter = null;


            /* ================================================
               PROJECT CARD HELPERS
               ================================================ */

            const cards = () => Array.from(track.children).filter((element) =>
                element.matches('.project-card, .showcase-card') &&
                !element.hidden
            );


            const allCards = () => Array.from(track.children).filter((element) =>
                element.matches('.project-card, .showcase-card')
            );


            /* ================================================
               RESPONSIVE VISIBLE CARD COUNT
               ================================================ */

            function getVisibleCount() {

                if (window.innerWidth <= 600) {
                    return 1;
                }

                if (window.innerWidth <= 900) {
                    return 2;
                }

                return 3;

            }


            /* ================================================
               SLIDER DIMENSIONS
               ================================================ */

            function getGap() {

                const styles = window.getComputedStyle(track);

                return (
                    parseFloat(styles.columnGap) ||
                    parseFloat(styles.gap) ||
                    0
                );

            }


            function getStepSize() {

                const firstCard = cards()[0];

                if (!firstCard) {
                    return 0;
                }

                return (
                    firstCard.getBoundingClientRect().width +
                    getGap()
                );

            }


            /* ================================================
               ACTIVE CARD INDEX
               ================================================ */

            function getActiveCardIndex() {

                const count = cards().length;

                if (!count) {
                    return 0;
                }

                return (
                    currentIndex +
                    Math.floor(visibleCount / 2)
                ) % count;

            }


            /* ================================================
               EMPTY FILTER MESSAGE
               ================================================ */

            const emptyMessage = document.createElement('div');

            emptyMessage.className   = 'project-filter-empty';
            emptyMessage.textContent = 'There are no projects in this category yet.';
            emptyMessage.hidden      = true;

            slider.insertAdjacentElement('afterend', emptyMessage);


            function updateEmptyMessage() {
                emptyMessage.hidden = cards().length !== 0;
            }


            /* ================================================
               UPDATE CARD STATES
               ================================================ */

            function updateCardStates() {

                const allVisibleCards = cards();

                allVisibleCards.forEach((card, index) => {

                    const isVisible = index < visibleCount;

                    const isActive = index === Math.floor(visibleCount / 2);

                    card.classList.toggle('is-active', isActive);

                    card.setAttribute('aria-hidden', String(!isVisible));

                    if (isVisible) {

                        card.removeAttribute('inert');

                    } else {

                        card.setAttribute('inert', '');

                    }

                });

            }


            /* ================================================
               UPDATE NAVIGATION DOTS
               ================================================ */

            function updateDots() {

                if (!dotsContainer) {
                    return;
                }

                const activeIndex = getActiveCardIndex();

                const dots = dotsContainer.querySelectorAll('.project-slider-dot');

                dots.forEach((dot, index) => {

                    const isActive = index === activeIndex;

                    dot.classList.toggle('active', isActive);

                    dot.setAttribute('aria-current', isActive ? 'true' : 'false');

                });

            }


            /* ================================================
               UPDATE SLIDER CONTROLS
               ================================================ */

            function updateControls() {

                const count = cards().length;
                const canSlide = count > visibleCount;

                if (previousButton) {
                    previousButton.hidden = !canSlide;
                }

                if (nextButton) {
                    nextButton.hidden = !canSlide;
                }

                if (dotsContainer) {
                    dotsContainer.hidden = !canSlide;
                }

                updateCardStates();
                updateDots();
                updateEmptyMessage();

            }


            /* ================================================
               CREATE NAVIGATION DOTS
               ================================================ */

            function createDots() {

                if (!dotsContainer) {
                    return;
                }

                dotsContainer.innerHTML = '';

                cards().forEach((card, index) => {

                    const dot = document.createElement('button');

                    dot.type      = 'button';
                    dot.className = 'project-slider-dot';

                    dot.setAttribute('aria-label', `Show project ${index + 1}`);

                    dot.addEventListener('click', () => {
                        goToProject(index);
                    });

                    dotsContainer.appendChild(dot);

                });

                updateDots();

            }


            /* ================================================
               RESET TRACK POSITION
               ================================================ */

            function resetTrack() {

                track.style.transition = 'none';

                track.style.transform  = 'translate3d(0, 0, 0)';

                track.offsetHeight;

            }


            /* ================================================
               APPLY PROJECT CATEGORY FILTER
               ================================================ */

            function applyProjectFilter(category) {

                if (animating) {

                    pendingFilter = category;

                    queuedMoves = [];

                    return;

                }

                const projectCards = allCards();

                projectCards.forEach((card) => {

                    const categories = (card.dataset.categories || '')
                        .split(',')
                        .map(value => value.trim())
                        .filter(Boolean);

                    const shouldShow = (
                        category === 'all' ||
                        categories.includes(category)
                    );

                    card.hidden = !shouldShow;

                });


                // Reset slider state.
                currentIndex  = 0;
                queuedMoves   = [];
                wheelDistance = 0;

                resetTrack();

                createDots();

                updateControls();

            }


            /* ================================================
               FILTER BUTTON EVENTS
               ================================================ */

            if (filterGroup) {

                const filterButtons = filterGroup.querySelectorAll('[data-project-filter]');

                filterButtons.forEach((button) => {

                    button.addEventListener('click', () => {

                        const category = button.dataset.projectFilter;

                        filterButtons.forEach((filterButton) => {

                            const isActive = filterButton === button;

                            filterButton.classList.toggle('active', isActive);

                            filterButton.setAttribute('aria-pressed', String(isActive));

                        });

                        applyProjectFilter(category);

                    });

                });

            }


            /* ================================================
               FINISH SLIDER MOVEMENT
               ================================================ */

            function finishMove(direction) {

                const count = cards().length;

                if (!count) {

                    animating = false;

                    return;

                }

                if (direction === 1) {

                    const firstCard = cards()[0];

                    if (firstCard) {
                        track.appendChild(firstCard);
                    }

                }

                currentIndex = (currentIndex + direction + count) % count;

                resetTrack();

                updateControls();

                animating = false;


                // Apply a category selection made during animation.
                if (pendingFilter !== null) {

                    const category = pendingFilter;

                    pendingFilter = null;

                    applyProjectFilter(category);

                    return;

                }


                if (queuedMoves.length) {

                    const nextDirection = queuedMoves.shift();

                    move(nextDirection);

                }

            }


            /* ================================================
               MOVE SLIDER
               ================================================ */

            function move(direction) {

                const visibleCards = cards();
                const count        = visibleCards.length;

                if (count <= visibleCount || !count) {
                    return;
                }

                if (animating) {

                    queuedMoves.push(direction);

                    return;

                }

                const stepSize = getStepSize();

                if (!stepSize) {
                    return;
                }


                // Reduced-motion navigation.
                if (reducedMotion.matches) {

                    if (direction === 1) {

                        track.appendChild(visibleCards[0]);

                    } else {

                        track.prepend(visibleCards[count - 1]);

                    }

                    currentIndex = (currentIndex + direction + count) % count;

                    updateControls();

                    return;

                }

                animating = true;

                if (direction === 1) {

                    track.style.transition = `transform ${ANIMATION_DURATION}ms ease`;
                    track.style.transform  = `translate3d(-${stepSize}px, 0, 0)`;

                } else {

                    track.style.transition = 'none';

                    track.prepend(visibleCards[count - 1]);

                    track.style.transform = `translate3d(-${stepSize}px, 0, 0)`;

                    track.offsetHeight;

                    track.style.transition = `transform ${ANIMATION_DURATION}ms ease`;
                    track.style.transform  = 'translate3d(0, 0, 0)';

                }


                const handleTransitionEnd = (event) => {

                    if (
                        event.target !== track ||
                        event.propertyName !== 'transform'
                    ) {
                        return;
                    }

                    track.removeEventListener(
                        'transitionend',
                        handleTransitionEnd
                    );

                    finishMove(direction);

                };

                track.addEventListener(
                    'transitionend',
                    handleTransitionEnd
                );


                // Fallback if transitionend does not fire.
                window.setTimeout(() => {

                    if (!animating) {
                        return;
                    }

                    track.removeEventListener(
                        'transitionend',
                        handleTransitionEnd
                    );

                    finishMove(direction);

                }, ANIMATION_DURATION + 100);

            }


            /* ================================================
               NEXT AND PREVIOUS
               ================================================ */

            function nextProject() {
                move(1);
            }


            function previousProject() {
                move(-1);
            }


            /* ================================================
               GO TO PROJECT
               ================================================ */

            function goToProject(targetIndex) {

                const count = cards().length;

                if (count <= visibleCount) {
                    return;
                }

                const centreOffset = Math.floor(visibleCount / 2);

                const targetStartIndex = (targetIndex - centreOffset + count) % count;

                const forwardDistance = (targetStartIndex - currentIndex + count) % count;
                const backwardDistance = (currentIndex - targetStartIndex + count) % count;

                if (forwardDistance === 0) {
                    return;
                }

                const direction = forwardDistance <= backwardDistance ? 1 : -1;

                const steps = Math.min(forwardDistance, backwardDistance);

                for (let i = 0; i < steps; i++) {

                    queuedMoves.push(direction);

                }

                if (!animating && queuedMoves.length) {

                    move(queuedMoves.shift());

                }

            }


            /* ================================================
               ARROW CONTROLS
               ================================================ */

            previousButton?.addEventListener('click', previousProject);
            nextButton?.addEventListener('click', nextProject);


            /* ================================================
               MOUSE DRAGGING AND TOUCH SWIPING
               ================================================ */

            viewport.style.touchAction = 'pan-y';


            /* ================================================
               POINTER DOWN
               ================================================ */

            viewport.addEventListener(
                'pointerdown',
                (event) => {

                    if (!event.isPrimary || event.button !== 0) {
                        return;
                    }

                    if (animating) {
                        return;
                    }

                    if (
                        event.target instanceof Element &&
                        event.target.closest('button, video, input, select, textarea')
                    ) {
                        return;
                    }

                    pointerStartX   = event.clientX;
                    pointerStartY   = event.clientY;
                    pointerCurrentX = event.clientX;

                    pointerActive       = true;
                    dragDirectionLocked = false;

                    viewport.setPointerCapture(event.pointerId);

                    track.style.transition = 'none';
                    track.style.cursor     = 'grabbing';

                    slider.classList.add('is-dragging');

                }
            );


            /* ================================================
               POINTER MOVE
               ================================================ */

            viewport.addEventListener(
                'pointermove',
                (event) => {

                    if (!pointerActive) {
                        return;
                    }

                    const differenceX = event.clientX - pointerStartX;
                    const differenceY = event.clientY - pointerStartY;

                    pointerCurrentX = event.clientX;


                    if (
                        !dragDirectionLocked &&
                        (
                            Math.abs(differenceX) > 5 ||
                            Math.abs(differenceY) > 5
                        )
                    ) {

                        if (Math.abs(differenceY) > Math.abs(differenceX)) {

                            pointerActive = false;

                            track.style.cursor = '';

                            slider.classList.remove('is-dragging');

                            return;

                        }

                        dragDirectionLocked = true;

                    }

                    if (!dragDirectionLocked) {
                        return;
                    }

                    track.style.transform = `translate3d(${differenceX}px, 0, 0)`;

                }
            );


            /* ================================================
               POINTER UP — FINISH DRAGGING
               ================================================ */

            function finishDragging() {

                if (!pointerActive) {
                    return;
                }

                const differenceX = pointerCurrentX - pointerStartX;

                pointerActive = false;

                track.style.cursor = '';

                slider.classList.remove('is-dragging');

                if (
                    dragDirectionLocked &&
                    Math.abs(differenceX) >= SWIPE_THRESHOLD
                ) {

                    suppressClick = true;

                    track.style.transition = 'none';
                    track.style.transform  = 'translate3d(0, 0, 0)';

                    track.offsetHeight;

                    if (differenceX < 0) {

                        nextProject();

                    } else {

                        previousProject();

                    }

                    window.setTimeout(() => {

                        suppressClick = false;

                    }, 250);

                } else {

                    track.style.transition = reducedMotion.matches
                        ? 'none'
                        : 'transform 0.25s ease';

                    track.style.transform = 'translate3d(0, 0, 0)';

                }

                dragDirectionLocked = false;

            }


            viewport.addEventListener('pointerup', finishDragging);
            viewport.addEventListener('pointercancel', finishDragging);
            viewport.addEventListener('lostpointercapture', finishDragging);


            /* ================================================
               PREVENT CLICK AFTER MOUSE DRAG
               ================================================ */

            viewport.addEventListener(
                'click',
                (event) => {

                    if (!suppressClick) {
                        return;
                    }

                    event.preventDefault();
                    event.stopPropagation();

                    suppressClick = false;

                },
                true
            );


            /* ================================================
               TOUCHPAD HORIZONTAL SCROLL
               ================================================ */

            viewport.addEventListener(
                'wheel',
                (event) => {

                    if (
                        animating ||
                        pointerActive ||
                        cards().length <= visibleCount
                    ) {
                        return;
                    }

                    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) {
                        return;
                    }

                    event.preventDefault();

                    wheelDistance += event.deltaX;

                    if (wheelDistance >= SWIPE_THRESHOLD) {

                        wheelDistance = 0;

                        nextProject();

                    } else if (wheelDistance <= -SWIPE_THRESHOLD) {

                        wheelDistance = 0;

                        previousProject();

                    }

                },
                { passive: false }
            );


            /* ================================================
               KEYBOARD NAVIGATION
               ================================================ */

            slider.addEventListener(
                'keydown',
                (event) => {

                    if (
                        event.target instanceof Element &&
                        event.target.closest(
                            'input, textarea, select, button, a, video, [contenteditable="true"]'
                        )
                    ) {
                        return;
                    }

                    if (event.key === 'ArrowLeft') {

                        event.preventDefault();

                        previousProject();

                    }

                    if (event.key === 'ArrowRight') {

                        event.preventDefault();

                        nextProject();

                    }

                }
            );


            /* ================================================
               RESPONSIVE LAYOUT
               ================================================ */

            function handleResize() {

                const newVisibleCount = getVisibleCount();

                if (newVisibleCount === visibleCount) {

                    updateControls();

                    return;

                }

                visibleCount  = newVisibleCount;
                currentIndex  = 0;
                queuedMoves   = [];
                animating     = false;
                pendingFilter = null;

                resetTrack();

                createDots();

                updateControls();

            }


            window.addEventListener(
                'resize',
                () => {

                    if (resizeFrame !== null) {

                        cancelAnimationFrame(resizeFrame);

                    }

                    resizeFrame = requestAnimationFrame(() => {

                        resizeFrame = null;

                        handleResize();

                    });

                }
            );


            /* ================================================
               REDUCED MOTION
               ================================================ */

            reducedMotion.addEventListener(
                'change',
                () => {

                    if (reducedMotion.matches) {

                        track.style.transition = 'none';

                    }

                }
            );


            /* ================================================
               INITIALISE SLIDER
               ================================================ */

            visibleCount = getVisibleCount();

            track.style.transform = 'translate3d(0, 0, 0)';

            createDots();

            updateControls();

        });

    }


    /* ========================================================
       DOCUMENT INITIALISATION
       ======================================================== */

    if (document.readyState === 'loading') {

        document.addEventListener('DOMContentLoaded', initProjectSliders);

    } else {

        initProjectSliders();

    }

})();


/* ============================================================
   PROJECT INFORMATION MODALS
   ============================================================

   Handles:
   - Opening project information modals
   - Closing modals using the close button
   - Closing modals by clicking the overlay
   - Closing modals using the Escape key
   - Preventing background scrolling
   - Restoring focus after closing

   ============================================================ */

(function () {

    'use strict';


    /* ========================================================
       MODAL STATE
       ======================================================== */

    let activeModal   = null;
    let previousFocus = null;


    /* ========================================================
       OPEN PROJECT MODAL
       ======================================================== */

    function openProjectModal(modalId, trigger) {

        const modal = document.getElementById(modalId);

        if (!modal) {
            console.warn('Project modal not found:', modalId);
            return;
        }

        if (activeModal && activeModal !== modal) {
            closeProjectModal();
        }

        previousFocus = trigger;
        activeModal   = modal;

        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');

        document.body.classList.add('modal-open');

        const closeButton = modal.querySelector('.project-modal-close');

        if (closeButton) {
            closeButton.focus();
        }

    }


    /* ========================================================
       CLOSE PROJECT MODAL
       ======================================================== */

    function closeProjectModal() {

        if (!activeModal) {
            return;
        }

        const modalToClose = activeModal;

        modalToClose.classList.remove('is-open');
        modalToClose.setAttribute('aria-hidden', 'true');

        activeModal = null;

        document.body.classList.remove('modal-open');

        if (previousFocus && document.contains(previousFocus)) {
            previousFocus.focus();
        }

        previousFocus = null;

    }


    /* ========================================================
       OPEN AND CLOSE MODALS — EVENT DELEGATION
       ======================================================== */

    document.addEventListener('click', function (event) {

        if (!(event.target instanceof Element)) {
            return;
        }

        const openButton = event.target.closest('[data-project-modal]');

        if (openButton) {

            const modalId = openButton.getAttribute('data-project-modal');

            openProjectModal(modalId, openButton);

            return;
        }


        const closeButton = event.target.closest('[data-close-project-modal]');

        if (closeButton && activeModal) {

            if (activeModal.contains(closeButton)) {
                closeProjectModal();
            }

        }

    });


    /* ========================================================
       CLOSE MODAL — ESCAPE KEY
       ======================================================== */

    document.addEventListener('keydown', function (event) {

        if (event.key === 'Escape' && activeModal) {

            closeProjectModal();

        }

    });

})();