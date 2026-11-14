/* ============================================================
   SESSION TIMEOUT
   ============================================================

   Tracks user inactivity and enforces a two-stage timeout:

   - At WARNING_TIME (60s) → show the session warning modal.
   - At LOGOUT_TIME  (90s) → force logout.

   Any user activity resets the timer and hides the warning.

   ============================================================ */


/* ============================================================
   STATE
   ============================================================ */

let inactivityTime = 0;
let warningShown   = false;
let countdownInterval;
let countdown = 30;


/* ============================================================
   TIMING CONSTANTS
   ============================================================ */

const WARNING_TIME = 60;   // 1 min
const LOGOUT_TIME  = 90;   // 1 min 30 sec


/* ============================================================
   RESET TIMER
   ============================================================ */

function resetTimer() {

    inactivityTime = 0;
    warningShown   = false;

    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    document.getElementById("sessionWarning")?.classList.remove("show");
}


/* ============================================================
   ACTIVITY DETECTION
   ============================================================ */

function activityDetected() {
    resetTimer();
}

document.addEventListener("mousemove", activityDetected);
document.addEventListener("keypress", activityDetected);
document.addEventListener("click", activityDetected);
document.addEventListener("scroll", activityDetected);


/* ============================================================
   MAIN TIMER
   ============================================================ */

setInterval(() => {

    inactivityTime++;

    // SHOW WARNING at 60 seconds
    if (inactivityTime === WARNING_TIME && !warningShown) {

        warningShown = true;

        showWarning();
    }

    // FORCE LOGOUT at 90 seconds
    if (inactivityTime >= LOGOUT_TIME) {
        forceLogout();
    }

}, 1000);


/* ============================================================
   WARNING POPUP
   ============================================================ */

function showWarning() {

    const modal = document.getElementById("sessionWarning");

    modal.classList.add("show");

    countdown = 30;

    document.getElementById("countdown").innerText = countdown;

    countdownInterval = setInterval(() => {

        countdown--;

        document.getElementById("countdown").innerText = countdown;

        if (countdown <= 0) {

            clearInterval(countdownInterval);

            forceLogout();
        }

    }, 1000);
}


/* ============================================================
   FORCE LOGOUT
   ============================================================ */

function forceLogout() {
    window.location.href = "/logout/";
}