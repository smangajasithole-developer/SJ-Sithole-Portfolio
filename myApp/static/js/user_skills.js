/* ============================================================
   SKILLS SECTION — RESPONSIVE INFINITE SLIDER
   ============================================================

   Desktop:
   - Both skill categories remain visible.
   - Slider functionality is disabled.

   Mobile / Tablet:
   - Technical Skills appears first.
   - Other Skills appears second.
   - Previous / Next arrows navigate between categories.
   - Navigation dots select a category directly.
   - Mouse dragging works.
   - Touch swiping works.
   - Touchpad horizontal scrolling works.
   - Infinite navigation in both directions.
   - Panel position recalculates after every resize.

   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    /* ========================================================
       ELEMENT REFERENCES
       ======================================================== */

    const container = document.querySelector(".public-skills-slider-container");

    if (!container) return;

    const viewport      = container.querySelector(".public-skills-slider");
    const track         = container.querySelector(".public-skills-track");
    const dotsContainer = container.querySelector(".skills-slider-dots");

    const dots = dotsContainer
        ? Array.from(dotsContainer.querySelectorAll(".skills-slider-dot"))
        : [];

    if (!viewport || !track) {
        console.warn("Skills slider: Required elements not found.");
        return;
    }

    const originalPanels = Array.from(
        track.querySelectorAll(":scope > .skills-category")
    );

    if (originalPanels.length !== 2) {
        console.warn("Skills slider: Expected exactly two categories.");
        return;
    }


    /* ========================================================
       CONSTANTS
       ======================================================== */

    const mobileBreakpoint = 900;
    const swipeThreshold   = 45;
    const wheelThreshold   = 50;


    /* ========================================================
       STATE
       ======================================================== */

    let currentIndex = 1;
    let isEnabled    = false;
    let isMoving     = false;

    let startX       = 0;
    let startY       = 0;
    let dragDistance = 0;
    let isDragging   = false;

    let wheelDistance = 0;

    let firstClone = null;
    let lastClone  = null;

    let resizeFrame = null;


    /* ========================================================
       HELPERS
       ======================================================== */

    function closePanelDropdowns(panel) {

        if (!panel) return;

        panel.querySelectorAll(
            ".public-skill-node.is-open, .public-skill-node.is-hover-open"
        ).forEach((node) => {

            node.classList.remove("is-open", "is-hover-open");

            const parent = node.querySelector(
                ":scope > .public-node-content.skill-parent"
            );

            if (parent) {
                parent.setAttribute("aria-expanded", "false");
            }

        });
    }


    /* ========================================================
       GET CURRENT PANEL
       ======================================================== */

    function getCurrentPanel() {

        if (currentIndex === 1) {
            return originalPanels[0];
        }

        if (currentIndex === 2) {
            return originalPanels[1];
        }

        if (currentIndex === 0) {
            return firstClone;
        }

        if (currentIndex === 3) {
            return lastClone;
        }

        return originalPanels[0];
    }


    /* ========================================================
       UPDATE NAVIGATION DOTS
       ======================================================== */

    function updateDots() {

        const activeIndex = currentIndex === 1 ? 0 : 1;

        dots.forEach((dot, index) => {

            const isActive = index === activeIndex;

            dot.classList.toggle("is-active", isActive);

            if (isActive) {
                dot.setAttribute("aria-current", "true");
            } else {
                dot.removeAttribute("aria-current");
            }

        });
    }


    /* ========================================================
       CLONE PANELS
       ======================================================== */

    function createClones() {

        if (firstClone || lastClone) return;

        firstClone = originalPanels[1].cloneNode(true);
        lastClone  = originalPanels[0].cloneNode(true);

        firstClone.setAttribute("aria-hidden", "true");
        lastClone.setAttribute("aria-hidden", "true");

        firstClone.classList.add("skills-slider-clone");
        lastClone.classList.add("skills-slider-clone");

        // Clones should not receive keyboard focus.
        firstClone.inert = true;
        lastClone.inert  = true;

        track.insertBefore(firstClone, originalPanels[0]);
        track.appendChild(lastClone);
    }


    /* ========================================================
       REMOVE CLONES
       ======================================================== */

    function removeClones() {

        if (firstClone) firstClone.remove();
        if (lastClone) lastClone.remove();

        firstClone = null;
        lastClone  = null;
    }


    /* ========================================================
       GET ACTUAL PANEL POSITION
       ======================================================== */

    function getPanelOffset(index) {

        const panel = track.children[index];

        if (!panel) return 0;

        return panel.offsetLeft;
    }


    /* ========================================================
       UPDATE TRACK POSITION
       ======================================================== */

    function updatePosition(animate = true) {

        if (!isEnabled) return;

        const targetOffset = getPanelOffset(currentIndex);

        track.style.transition = animate
            ? ""
            : "none";

        track.style.transform =
            `translate3d(-${targetOffset}px, 0, 0)`;

        if (!animate) {

            // Force the browser to apply the non-animated position.
            track.offsetHeight;

            // Restore the CSS transition for the next navigation.
            track.style.removeProperty("transition");
        }
    }


    /* ========================================================
       MOVE TO PANEL
       ======================================================== */

    function moveSlider(direction) {

        if (!isEnabled || isMoving || isDragging || direction === 0) {
            return;
        }

        const currentPanel = getCurrentPanel();

        closePanelDropdowns(currentPanel);

        isMoving = true;

        currentIndex += direction;

        updatePosition(true);
    }


    /* ========================================================
       NEXT / PREVIOUS
       ======================================================== */

    function nextSlide() {
        moveSlider(1);
    }

    function previousSlide() {
        moveSlider(-1);
    }


    /* ========================================================
       DELEGATED ARROW CLICK HANDLING
       ======================================================== */

    container.addEventListener("click", (event) => {

        const arrow = event.target.closest(".skills-slider-arrow");

        if (!arrow || !container.contains(arrow)) return;

        event.preventDefault();

        if (arrow.classList.contains("skills-slider-next")) {

            nextSlide();

        } else if (arrow.classList.contains("skills-slider-prev")) {

            previousSlide();

        }

    });


    /* ========================================================
       NAVIGATION DOT CLICK HANDLING
       ======================================================== */

    dots.forEach((dot) => {

        dot.addEventListener("click", (event) => {

            event.preventDefault();

            if (!isEnabled || isMoving || isDragging) return;

            const slideIndex = Number(dot.dataset.slide);

            if (
                !Number.isInteger(slideIndex) ||
                slideIndex < 0 ||
                slideIndex >= originalPanels.length
            ) {
                return;
            }

            const targetIndex = slideIndex + 1;
            const direction   = targetIndex - currentIndex;

            if (direction === 0) return;

            moveSlider(direction);
        });

    });


    /* ========================================================
       TRANSITION END — INFINITE LOOP
       ======================================================== */

    track.addEventListener("transitionend", (event) => {

        if (event.target !== track) return;
        if (event.propertyName !== "transform") return;
        if (!isEnabled) return;

        if (currentIndex === 3) {

            currentIndex = 1;
            updatePosition(false);

        } else if (currentIndex === 0) {

            currentIndex = 2;
            updatePosition(false);
        }

        updateDots();

        isMoving = false;
    });


    /* ========================================================
       ENABLE MOBILE SLIDER
       ======================================================== */

    function enableSlider() {

        if (isEnabled) return;

        isEnabled = true;

        createClones();

        currentIndex = 1;
        isMoving     = false;

        track.style.display = "flex";
        track.style.width   = "400%";
        track.style.gap     = "0";

        Array.from(track.children).forEach((panel) => {

            panel.style.flex     = "0 0 25%";
            panel.style.width    = "25%";
            panel.style.maxWidth = "25%";
            panel.style.minWidth = "25%";
        });

        updateDots();

        requestAnimationFrame(() => {

            if (!isEnabled) return;

            updatePosition(false);
        });
    }


    /* ========================================================
       DISABLE MOBILE SLIDER
       ======================================================== */

    function disableSlider() {

        if (!isEnabled) return;

        isEnabled  = false;
        isMoving   = false;
        isDragging = false;

        wheelDistance = 0;
        dragDistance  = 0;

        currentIndex = 1;

        removeClones();

        track.style.removeProperty("display");
        track.style.removeProperty("width");
        track.style.removeProperty("gap");
        track.style.removeProperty("transform");
        track.style.removeProperty("transition");

        originalPanels.forEach((panel) => {

            panel.style.removeProperty("flex");
            panel.style.removeProperty("width");
            panel.style.removeProperty("max-width");
            panel.style.removeProperty("min-width");
        });

        viewport.classList.remove("is-dragging");
        track.classList.remove("is-dragging");

        updateDots();
    }


    /* ========================================================
       RESPONSIVE INITIALISATION
       ======================================================== */

    function checkScreenSize() {

        const shouldEnable = window.innerWidth <= mobileBreakpoint;

        if (shouldEnable && !isEnabled) {

            enableSlider();

        } else if (!shouldEnable && isEnabled) {

            disableSlider();
        }
    }


    /* ========================================================
       RECALCULATE POSITION AFTER RESIZING
       ======================================================== */

    function refreshSliderLayout() {

        if (!isEnabled) return;

        // Cancel any unfinished movement during a resize.
        isMoving = false;

        // Reset drag state so an old pointer position cannot
        // affect the newly calculated panel position.
        isDragging    = false;
        dragDistance  = 0;
        wheelDistance = 0;

        viewport.classList.remove("is-dragging");
        track.classList.remove("is-dragging");

        updatePosition(false);
        updateDots();
    }


    function handleResize() {

        checkScreenSize();

        if (!isEnabled) return;

        if (resizeFrame !== null) {
            cancelAnimationFrame(resizeFrame);
        }

        resizeFrame = requestAnimationFrame(() => {

            resizeFrame = null;

            if (isEnabled) {
                refreshSliderLayout();
            }
        });
    }


    window.addEventListener("resize", handleResize);


    /* ========================================================
       OBSERVE VIEWPORT SIZE CHANGES
       ======================================================== */

    if ("ResizeObserver" in window) {

        const sliderResizeObserver = new ResizeObserver(() => {

            if (!isEnabled) return;

            if (resizeFrame !== null) {
                cancelAnimationFrame(resizeFrame);
            }

            resizeFrame = requestAnimationFrame(() => {

                resizeFrame = null;

                if (isEnabled) {
                    refreshSliderLayout();
                }
            });

        });

        sliderResizeObserver.observe(viewport);
    }


    /* ========================================================
       INITIALISE RESPONSIVE MODE
       ======================================================== */

    checkScreenSize();


    /* ========================================================
       MOUSE / TOUCH DRAGGING
       ======================================================== */

    viewport.addEventListener("pointerdown", (event) => {

        if (!isEnabled || isMoving) return;

        // Do not capture pointer interactions on dropdown parents
        // or navigation buttons.
        if (event.target.closest("button, .public-node-content.skill-parent")) {
            return;
        }

        if (event.pointerType === "mouse" && event.button !== 0) {
            return;
        }

        startX = event.clientX;
        startY = event.clientY;

        dragDistance = 0;
        isDragging   = true;

        viewport.classList.add("is-dragging");
        track.classList.add("is-dragging");

        viewport.setPointerCapture(event.pointerId);
    });


    viewport.addEventListener("pointermove", (event) => {

        if (!isEnabled || !isDragging) return;

        const differenceX = event.clientX - startX;
        const differenceY = event.clientY - startY;

        if (Math.abs(differenceY) > Math.abs(differenceX)) {
            return;
        }

        dragDistance = differenceX;

        const currentOffset = getPanelOffset(currentIndex);

        track.style.transform =
            `translate3d(${-(currentOffset - differenceX)}px, 0, 0)`;
    });


    function finishDragging() {

        if (!isDragging) return;

        isDragging = false;

        viewport.classList.remove("is-dragging");
        track.classList.remove("is-dragging");

        if (Math.abs(dragDistance) >= swipeThreshold) {

            if (dragDistance < 0) {
                nextSlide();
            } else {
                previousSlide();
            }

        } else {

            updatePosition(true);
        }

        dragDistance = 0;
    }


    viewport.addEventListener("pointerup", finishDragging);
    viewport.addEventListener("pointercancel", finishDragging);
    viewport.addEventListener("lostpointercapture", finishDragging);


    /* ========================================================
       TOUCHPAD HORIZONTAL SCROLLING
       ======================================================== */

    viewport.addEventListener("wheel", (event) => {

        if (!isEnabled || isMoving || isDragging) return;

        const differenceX = event.deltaX;
        const differenceY = event.deltaY;

        // Only respond to horizontal scrolling.
        // Normal vertical page scrolling remains unaffected.
        if (Math.abs(differenceX) <= Math.abs(differenceY)) {

            wheelDistance = 0;
            return;
        }

        event.preventDefault();

        wheelDistance += differenceX;

        if (Math.abs(wheelDistance) >= wheelThreshold) {

            if (wheelDistance > 0) {
                nextSlide();
            } else {
                previousSlide();
            }

            wheelDistance = 0;
        }

    }, { passive: false });


    /* ========================================================
       INITIAL POSITION AFTER PAGE LOAD
       ======================================================== */

    window.addEventListener("load", () => {

        if (isEnabled) {
            refreshSliderLayout();
        }
    });

});


/* ============================================================
   SKILLS DROPDOWNS
   ============================================================

   Handles:
   - Hover preview on desktop
   - Click / tap to lock a dropdown open
   - Clicking the same parent closes it
   - Hover dropdowns close when the pointer leaves
   - Nested dropdowns work independently
   - Keyboard support with Enter / Space

   ============================================================ */

(function () {
    'use strict';

    function initSkillDropdowns() {

        /* ====================================================
           ELEMENT REFERENCES
           ==================================================== */

        const container = document.querySelector(".public-skills-slider-container");

        if (!container) return;

        const suppressedHover = new WeakSet();


        /* ====================================================
           FIND SKILL NODE AND ITS PARENT CONTROL
           ==================================================== */

        function getSkillNode(element) {

            if (!(element instanceof Element)) return null;

            return element.closest(".public-skill-node");
        }


        function getParentControl(skillNode) {

            if (!skillNode) return null;

            return skillNode.querySelector(
                ":scope > .public-node-content.skill-parent"
            );
        }


        /* ====================================================
           UPDATE ACCESSIBILITY STATE
           ==================================================== */

        function updateExpandedState(skillNode) {

            const parent = getParentControl(skillNode);

            if (!parent) return;

            const expanded =
                skillNode.classList.contains("is-open") ||
                skillNode.classList.contains("is-hover-open");

            parent.setAttribute("aria-expanded", String(expanded));
        }


        /* ====================================================
           GET NESTED PARENT SKILL NODES
           ==================================================== */

        function getAncestorSkillNodes(skillNode) {

            const nodes = [];

            let current = skillNode;

            while (current && current !== container) {

                if (current.classList.contains("public-skill-node")) {
                    nodes.push(current);
                }

                current = current.parentElement;
            }

            return nodes;
        }


        /* ====================================================
           HOVER — TEMPORARY OPEN
           ==================================================== */

        container.addEventListener("pointerover", (event) => {

            if (
                event.pointerType !== "mouse" &&
                event.pointerType !== "pen"
            ) {
                return;
            }

            const skillNode = getSkillNode(event.target);

            if (!skillNode || !container.contains(skillNode)) {
                return;
            }

            getAncestorSkillNodes(skillNode).forEach((node) => {

                if (
                    getParentControl(node) &&
                    !suppressedHover.has(node)
                ) {

                    node.classList.add("is-hover-open");

                    updateExpandedState(node);
                }

            });

        });


        /* ====================================================
           POINTER LEAVES — CLOSE TEMPORARY DROPDOWNS
           ==================================================== */

        container.addEventListener("pointerout", (event) => {

            if (
                event.pointerType !== "mouse" &&
                event.pointerType !== "pen"
            ) {
                return;
            }

            const skillNode = getSkillNode(event.target);

            if (!skillNode || !container.contains(skillNode)) {
                return;
            }

            getAncestorSkillNodes(skillNode).forEach((node) => {

                // Keep the dropdown open when moving into its children.
                if (
                    event.relatedTarget instanceof Node &&
                    node.contains(event.relatedTarget)
                ) {
                    return;
                }

                suppressedHover.delete(node);

                if (!node.classList.contains("is-open")) {
                    node.classList.remove("is-hover-open");
                }

                updateExpandedState(node);
            });

        });


        /* ====================================================
           CLICK / TAP — LOCK OR CLOSE DROPDOWN
           ==================================================== */

        container.addEventListener("click", (event) => {

            if (!(event.target instanceof Element)) return;

            const parent = event.target.closest(
                ".public-node-content.skill-parent"
            );

            if (!parent || !container.contains(parent)) return;

            const skillNode = parent.closest(".public-skill-node");

            if (!skillNode) return;

            const isOpen = skillNode.classList.contains("is-open");

            if (isOpen) {

                skillNode.classList.remove("is-open");
                skillNode.classList.remove("is-hover-open");

                suppressedHover.add(skillNode);

            } else {

                skillNode.classList.add("is-open");
                skillNode.classList.remove("is-hover-open");

                suppressedHover.delete(skillNode);
            }

            updateExpandedState(skillNode);
        });


        /* ====================================================
           KEYBOARD — ENTER / SPACE
           ==================================================== */

        container.addEventListener("keydown", (event) => {

            if (
                event.key !== "Enter" &&
                event.key !== " "
            ) {
                return;
            }

            if (!(event.target instanceof Element)) return;

            const parent = event.target.closest(
                ".public-node-content.skill-parent"
            );

            if (!parent || !container.contains(parent)) return;

            event.preventDefault();

            parent.click();
        });


        /* ====================================================
           INITIALISE ACCESSIBILITY STATE
           ==================================================== */

        container.querySelectorAll(
            ".public-node-content.skill-parent"
        ).forEach((parent) => {

            const skillNode = parent.closest(".public-skill-node");

            if (skillNode) {
                updateExpandedState(skillNode);
            }
        });
    }


    /* ========================================================
       DOCUMENT INITIALISATION
       ======================================================== */

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            initSkillDropdowns
        );

    } else {

        initSkillDropdowns();
    }

})();


/* ============================================================
   SKILLS SECTION — SCROLL ENTRANCE OBSERVER
   ============================================================ */

(function () {
    'use strict';

    /* ========================================================
       ELEMENT REFERENCES
       ======================================================== */

    const skillsSection = document.querySelector("#skills");

    if (!skillsSection) return;


    /* ========================================================
       SHOW SKILLS
       ======================================================== */

    function showSkills() {
        skillsSection.classList.add("is-visible");
    }


    /* ========================================================
       REDUCED MOTION / FALLBACK
       ======================================================== */

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {

        showSkills();
        return;
    }


    /* ========================================================
       OBSERVER
       ======================================================== */

    const observer = new IntersectionObserver(
        (entries, obs) => {

            entries.forEach((entry) => {

                if (entry.isIntersecting) {

                    showSkills();

                    obs.unobserve(entry.target);
                }
            });

        },
        {
            threshold: 0,
            rootMargin: "0px"
        }
    );

    observer.observe(skillsSection);

})();