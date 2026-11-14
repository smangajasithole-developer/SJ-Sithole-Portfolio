/* ============================================================
   PAGE RESTORATION — BACK-FORWARD CACHE
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