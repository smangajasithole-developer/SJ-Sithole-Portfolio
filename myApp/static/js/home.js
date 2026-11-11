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
   - Opening and closing project information modals
   - Closing by clicking the backdrop or pressing Escape
   - Preventing background scrolling while a modal is open
   - Stopping thumbnail videos when a modal opens
   - Stopping and resetting videos when a modal closes
   - Ensuring only one showcase/modal video plays at a time
   - Synchronising volume between each thumbnail and its modal
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

    // Remember the volume and mute state for each project.
    const projectVolumeSettings = new Map();


    /* --------------------------------------------------------
       GET PROJECT ID
       -------------------------------------------------------- */

    function getProjectId(video) {
        const modal = video.closest('.project-modal');

        if (modal && modal.id) {
            return modal.id.replace('project-modal-', '');
        }

        const card = video.closest('.showcase-card');

        if (card) {
            const button = card.querySelector('[data-project-modal]');

            if (button) {
                return button.dataset.projectModal.replace(
                    'project-modal-',
                    ''
                );
            }
        }

        return null;
    }


    /* --------------------------------------------------------
       SAVE AND APPLY PROJECT VOLUME SETTINGS
       -------------------------------------------------------- */

    function saveProjectVolume(video) {
        const projectId = getProjectId(video);

        if (!projectId) {
            return;
        }

        projectVolumeSettings.set(projectId, {
            volume: video.volume,
            muted: video.muted
        });
    }

    function applyProjectVolume(video) {
        const projectId = getProjectId(video);

        if (!projectId) {
            return;
        }

        const settings = projectVolumeSettings.get(projectId);

        if (settings) {
            video.volume = settings.volume;
            video.muted = settings.muted;
        }
    }


    /* --------------------------------------------------------
       INITIALISE VIDEO VOLUME SYNCHRONISATION
       -------------------------------------------------------- */

    function setupVideoVolumeSync() {
        document.querySelectorAll(
            '.other-showcase video, .project-modal video'
        ).forEach((video) => {
            // Give each project video a shared starting volume.
            applyProjectVolume(video);

            // Synchronise whenever the user changes the volume.
            video.addEventListener('volumechange', () => {
                saveProjectVolume(video);

                const projectId = getProjectId(video);

                if (!projectId) {
                    return;
                }

                const settings = projectVolumeSettings.get(projectId);

                document.querySelectorAll(
                    '.other-showcase video, .project-modal video'
                ).forEach((otherVideo) => {
                    if (
                        otherVideo !== video &&
                        getProjectId(otherVideo) === projectId
                    ) {
                        if (otherVideo.volume !== settings.volume) {
                            otherVideo.volume = settings.volume;
                        }

                        if (otherVideo.muted !== settings.muted) {
                            otherVideo.muted = settings.muted;
                        }
                    }
                });
            });
        });
    }


    /* --------------------------------------------------------
       STOP AND RESET ONE VIDEO
       -------------------------------------------------------- */

    function stopVideo(video) {
        if (!video) {
            return;
        }

        video.pause();

        try {
            video.currentTime = 0;
        } catch (error) {
            // Ignore videos that are not ready to seek.
        }
    }


    /* --------------------------------------------------------
       STOP ALL SHOWCASE AND MODAL VIDEOS
       -------------------------------------------------------- */

    function stopAllProjectVideos() {
        document.querySelectorAll(
            '.other-showcase video, .project-modal video'
        ).forEach((video) => {
            stopVideo(video);
        });
    }


    /* --------------------------------------------------------
       STOP VIDEOS INSIDE A SPECIFIC MODAL
       -------------------------------------------------------- */

    function stopModalVideos(modal) {
        if (!modal) {
            return;
        }

        modal.querySelectorAll('video').forEach((video) => {
            stopVideo(video);
        });
    }


    /* --------------------------------------------------------
       ENSURE ONLY ONE PROJECT VIDEO PLAYS AT A TIME
       -------------------------------------------------------- */

    document.addEventListener('play', (event) => {
        const playingVideo = event.target;

        if (!(playingVideo instanceof HTMLVideoElement)) {
            return;
        }

        if (!playingVideo.closest('.other-showcase, .project-modal')) {
            return;
        }

        document.querySelectorAll(
            '.other-showcase video, .project-modal video'
        ).forEach((video) => {
            if (video !== playingVideo && !video.paused) {
                stopVideo(video);
            }
        });
    }, true);


    /* --------------------------------------------------------
       OPEN PROJECT MODAL
       -------------------------------------------------------- */

    function openProjectModal(modal) {
        if (!modal) {
            return;
        }

        // Stop thumbnail playback without losing saved volume.
        stopAllProjectVideos();

        // Apply the project's saved volume to its modal video.
        modal.querySelectorAll('video').forEach((video) => {
            applyProjectVolume(video);
        });

        // Move the modal out of its transformed project card.
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


    /* --------------------------------------------------------
       CLOSE PROJECT MODAL
       -------------------------------------------------------- */

    function closeProjectModal(modal) {
        if (!modal) {
            return;
        }

        stopModalVideos(modal);

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
       OPEN MODAL FROM "VIEW MORE INFO"
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
       CLOSE BUTTONS AND BACKDROP
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

        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeProjectModal(modal);
            }
        });
    });


    /* --------------------------------------------------------
       CLOSE WITH ESCAPE
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
       RESET MODALS AND VIDEOS AFTER BROWSER NAVIGATION
       -------------------------------------------------------- */

    window.addEventListener('pageshow', () => {
        stopAllProjectVideos();

        projectModals.forEach((modal) => {
            modal.setAttribute('aria-hidden', 'true');
            modal.classList.remove('is-open');
        });

        activeProjectModal = null;
        document.body.classList.remove('modal-open');
    });


    /* --------------------------------------------------------
       START VOLUME SYNCHRONISATION
       -------------------------------------------------------- */

    setupVideoVolumeSync();
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



/* ============================================================
   SKILLS DROPDOWNS
   ============================================================
   Handles:
   - Hover preview on desktop
   - Click/tap to lock a parent open
   - Click/tap again to close it
   - Locked dropdowns stay open when the pointer leaves
   - Keyboard support with Enter / Space
   ============================================================ */

(function () {
    'use strict';

    function setupSkillDropdowns() {
        const skillParents = document.querySelectorAll(
            '.public-node-content.skill-parent'
        );

        if (!skillParents.length) {
            return;
        }

        skillParents.forEach((parent) => {
            const skillNode = parent.closest('.public-skill-node');

            if (!skillNode) {
                return;
            }


            /* ------------------------------------------------
               HOVER — TEMPORARY OPEN
               ------------------------------------------------ */

            parent.addEventListener('mouseenter', () => {
                skillNode.classList.add('is-hover-open');
            });

            parent.addEventListener('mouseleave', () => {
                if (!skillNode.classList.contains('is-open')) {
                    skillNode.classList.remove('is-hover-open');
                }
            });


            /* ------------------------------------------------
               CLICK / TAP — LOCK OPEN
               ------------------------------------------------ */

            parent.addEventListener('click', () => {
                const isOpen = skillNode.classList.contains('is-open');

                if (isOpen) {
                    skillNode.classList.remove('is-open');
                    parent.setAttribute('aria-expanded', 'false');

                    skillNode.classList.remove('is-hover-open');
                } else {
                    skillNode.classList.add('is-open');
                    parent.setAttribute('aria-expanded', 'true');
                }
            });


            /* ------------------------------------------------
               KEYBOARD SUPPORT
               ------------------------------------------------ */

            parent.addEventListener('keydown', (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') {
                    return;
                }

                event.preventDefault();
                parent.click();
            });


            /* ------------------------------------------------
               KEEP HOVER PREVIEW OPEN WHEN MOVING FROM
               PARENT INTO ITS CHILDREN
               ------------------------------------------------ */

            skillNode.addEventListener('mouseenter', () => {
                if (!skillNode.classList.contains('is-open')) {
                    skillNode.classList.add('is-hover-open');
                }
            });

            skillNode.addEventListener('mouseleave', () => {
                if (!skillNode.classList.contains('is-open')) {
                    skillNode.classList.remove('is-hover-open');
                }
            });
        });
    }


    if (document.readyState === 'loading') {
        document.addEventListener(
            'DOMContentLoaded',
            setupSkillDropdowns
        );
    } else {
        setupSkillDropdowns();
    }
})();



/* ============================================================
   HOME SLIDER — TWO-PANEL INFINITE LOOP
   ============================================================
   - Only two original panels; no cloned elements.
   - Introduction is always the initial panel.
   - Swipe left/right to alternate indefinitely.
   - Arrow controls use the same navigation.
   - Active only at 900px and below.
   ============================================================ */

(function () {
    'use strict';

    function initHomeSlider() {
        const slider = document.querySelector('.home-slides');

        if (!slider) return;

        const panels = Array.from(slider.children).filter(
            element => element.classList.contains('home-slide')
        );

        if (panels.length !== 2) return;

        const [intro, photo] = panels;

        const mobileQuery = window.matchMedia('(max-width: 900px)');
        const reducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        );

        let activeIndex = 0;
        let controls = null;
        let enabled = false;

        let touchStartX = 0;
        let touchStartY = 0;
        let isDragging = false;

        const SWIPE_THRESHOLD = 45;

        function updateControls() {
            if (!controls) return;

            const indicator = controls.querySelector(
                '.home-slider-indicator'
            );

            indicator.textContent = activeIndex === 0
                ? '01 / 02'
                : '02 / 02';

            intro.setAttribute(
                'aria-hidden',
                activeIndex === 0 ? 'false' : 'true'
            );

            photo.setAttribute(
                'aria-hidden',
                activeIndex === 1 ? 'false' : 'true'
            );

            if (activeIndex === 0) {
                photo.setAttribute('inert', '');
                intro.removeAttribute('inert');
            } else {
                intro.setAttribute('inert', '');
                photo.removeAttribute('inert');
            }
        }

        function showPanel(index) {
            activeIndex = (index + 2) % 2;

            slider.style.transform =
                `translateX(-${activeIndex * 100}%)`;

            updateControls();
        }

        function nextPanel() {
            showPanel(activeIndex + 1);
        }

        function previousPanel() {
            showPanel(activeIndex - 1);
        }

        function createControls() {
            controls = document.createElement('div');
            controls.className = 'home-slider-controls';

            const previous = document.createElement('button');
            previous.type = 'button';
            previous.className = 'home-slider-arrow';
            previous.setAttribute('aria-label', 'Previous panel');
            previous.innerHTML = '&larr;';

            const indicator = document.createElement('span');
            indicator.className = 'home-slider-indicator';
            indicator.setAttribute('aria-live', 'polite');

            const next = document.createElement('button');
            next.type = 'button';
            next.className = 'home-slider-arrow';
            next.setAttribute('aria-label', 'Next panel');
            next.innerHTML = '&rarr;';

            controls.append(previous, indicator, next);

            slider.insertAdjacentElement('afterend', controls);

            previous.addEventListener('click', previousPanel);
            next.addEventListener('click', nextPanel);
        }

        function handleTouchStart(event) {
            if (event.touches.length !== 1) return;

            touchStartX = event.touches[0].clientX;
            touchStartY = event.touches[0].clientY;
            isDragging = true;
        }

        function handleTouchEnd(event) {
            if (!isDragging || !event.changedTouches.length) return;

            isDragging = false;

            const touchEndX = event.changedTouches[0].clientX;
            const touchEndY = event.changedTouches[0].clientY;

            const differenceX = touchEndX - touchStartX;
            const differenceY = touchEndY - touchStartY;

            // Ignore vertical scrolling gestures.
            if (Math.abs(differenceX) < SWIPE_THRESHOLD) return;
            if (Math.abs(differenceX) < Math.abs(differenceY)) return;

            if (differenceX < 0) {
                nextPanel();
            } else {
                previousPanel();
            }
        }

        function handleKeydown(event) {
            if (event.key === 'ArrowLeft') {
                previousPanel();
            } else if (event.key === 'ArrowRight') {
                nextPanel();
            }
        }

        function enableSlider() {
            if (enabled) return;

            enabled = true;
            activeIndex = 0;

            slider.classList.add('home-slider-active');

            slider.style.transform = 'translateX(0)';
            slider.style.transition = reducedMotion.matches
                ? 'none'
                : 'transform 0.45s ease';

            panels.forEach(panel => {
                panel.style.flex = '0 0 100%';
                panel.style.width = '100%';
                panel.style.minWidth = '100%';
                panel.style.boxSizing = 'border-box';
            });

            createControls();

            slider.addEventListener('touchstart', handleTouchStart, {
                passive: true
            });

            slider.addEventListener('touchend', handleTouchEnd, {
                passive: true
            });

            slider.addEventListener('keydown', handleKeydown);

            slider.setAttribute('tabindex', '0');

            updateControls();
        }

        function disableSlider() {
            if (!enabled) return;

            enabled = false;
            activeIndex = 0;

            slider.classList.remove('home-slider-active');

            slider.style.transform = '';
            slider.style.transition = '';

            panels.forEach(panel => {
                panel.style.flex = '';
                panel.style.width = '';
                panel.style.minWidth = '';
                panel.style.boxSizing = '';
                panel.removeAttribute('aria-hidden');
                panel.removeAttribute('inert');
            });

            slider.removeEventListener('touchstart', handleTouchStart);
            slider.removeEventListener('touchend', handleTouchEnd);
            slider.removeEventListener('keydown', handleKeydown);

            slider.removeAttribute('tabindex');

            if (controls) {
                controls.remove();
                controls = null;
            }
        }

        function handleResponsiveChange() {
            if (mobileQuery.matches) {
                enableSlider();
            } else {
                disableSlider();
            }
        }

        mobileQuery.addEventListener('change', handleResponsiveChange);
        reducedMotion.addEventListener('change', () => {
            if (enabled) {
                slider.style.transition = reducedMotion.matches
                    ? 'none'
                    : 'transform 0.45s ease';
            }
        });

        handleResponsiveChange();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHomeSlider);
    } else {
        initHomeSlider();
    }
})();