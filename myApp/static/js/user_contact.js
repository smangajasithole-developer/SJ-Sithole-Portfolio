/* ============================================================
   CONTACT SECTION — SCROLL ENTRANCE ANIMATION
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

    /* ========================================================
       ELEMENT REFERENCES
       ======================================================== */

    const contact = document.querySelector('#contact');

    if (!contact) {
        console.error('Contact section was not found.');
        return;
    }

    console.log('Contact animation script loaded.');


    /* ========================================================
       FALLBACK — NO INTERSECTION OBSERVER
       ======================================================== */

    if (!('IntersectionObserver' in window)) {

        contact.classList.add('is-visible');

        return;
    }


    /* ========================================================
       OBSERVER
       ======================================================== */

    const observer = new IntersectionObserver(function (entries) {

        entries.forEach(function (entry) {

            if (entry.isIntersecting) {

                console.log('Contact section entered viewport.');

                contact.classList.add('is-visible');

                observer.unobserve(contact);
            }

        });

    }, {
        threshold: 0.05
    });

    observer.observe(contact);

});