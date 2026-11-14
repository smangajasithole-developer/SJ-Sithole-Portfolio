/* ============================================================
   DASHBOARD — LOGIN MODAL VISIBILITY
   ============================================================

   Shows or hides the admin login modal based on the
   authentication state provided by Django via a data attribute.

   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {

    const modal = document.getElementById("loginModal");

    // If Django says user is logged in → hide modal
    const isAuthenticated = document.body.dataset.authenticated;

    if (isAuthenticated === "true") {
        modal.style.display = "none";
    } else {
        modal.style.display = "flex";
    }

});


/* ============================================================
   DASHBOARD — PAGE RESTORE HANDLING
   ============================================================

   Forces a reload when the page is restored from the
   browser's back-forward cache (bfcache), ensuring the
   authentication state stays in sync.

   ============================================================ */

window.addEventListener("pageshow", function (event) {

    if (event.persisted) {
        window.location.reload();
    }

});