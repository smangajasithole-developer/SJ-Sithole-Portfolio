// dashboard.js

document.addEventListener("DOMContentLoaded", function() {
    const modal = document.getElementById("loginModal");

    // If Django says user is logged in → hide modal
    const isAuthenticated = document.body.dataset.authenticated;

    if (isAuthenticated === "true") {
        modal.style.display = "none";
    } else {
        modal.style.display = "flex";
    }
});



window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
        window.location.reload();
    }
});

