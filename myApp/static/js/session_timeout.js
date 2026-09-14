let inactivityTime = 0;
let warningShown = false;
let countdownInterval;
let countdown = 30;

const WARNING_TIME = 60;   // 1 min
const LOGOUT_TIME = 90;    // 1 min 30 sec

// reset activity
function resetTimer() {
    inactivityTime = 0;
    warningShown = false;

    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    document.getElementById("sessionWarning")?.classList.remove("show");
}

// track activity
function activityDetected() {
    resetTimer();
}

document.addEventListener("mousemove", activityDetected);
document.addEventListener("keypress", activityDetected);
document.addEventListener("click", activityDetected);
document.addEventListener("scroll", activityDetected);

// main timer
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

// WARNING POPUP
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

// FORCE LOGOUT
function forceLogout() {
    window.location.href = "/logout/";
}