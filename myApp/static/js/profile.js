document.addEventListener("DOMContentLoaded", function () {

    // ============================================
    // PROFILE PHOTO PREVIEW
    // ============================================
    const profilePhotoInput = document.getElementById("profilePhotoInput");
    const profilePreview    = document.getElementById("profilePreview");

    if (profilePhotoInput && profilePreview) {
        profilePhotoInput.addEventListener("change", function () {
            const file = this.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function (e) {
                profilePreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // ============================================
    // RESUME EDIT OPTIONS TOGGLE
    // ============================================
    const editResumeBtn      = document.getElementById("editResumeBtn");
    const resumeEditOptions  = document.getElementById("resumeEditOptions");

    if (editResumeBtn && resumeEditOptions) {
        editResumeBtn.addEventListener("click", function () {
            resumeEditOptions.classList.toggle("show");
        });
    }

    // ============================================
    // RESUME REPLACE (open file picker)
    // ============================================
    const resumeInput      = document.getElementById("resumeInput");
    const replaceResumeBtn = document.querySelector(".resume-btn.replace");

    if (resumeInput && replaceResumeBtn) {
        replaceResumeBtn.addEventListener("click", function (e) {
            e.preventDefault();
            resumeInput.click();
        });
    }

    // ============================================
    // RESUME DELETE
    // ============================================
    const deleteResumeBtn    = document.getElementById("deleteResumeBtn");
    const resumeActionInput  = document.getElementById("resumeActionInput");
    const profileForm        = document.getElementById("profileForm");

    if (deleteResumeBtn && resumeActionInput && profileForm) {
        deleteResumeBtn.addEventListener("click", function () {
            const confirmed = confirm("Are you sure you want to delete your resume?");
            if (!confirmed) return;

            resumeActionInput.value = "delete";
            profileForm.submit();
        });
    }

    // ============================================
    // PAGE RESTORATION (back-forward cache)
    // ============================================
    window.addEventListener("pageshow", function (event) {
        if (event.persisted) {
            window.location.reload();
        }
    });

});