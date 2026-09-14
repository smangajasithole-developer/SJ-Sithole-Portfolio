document.addEventListener("DOMContentLoaded", () => {

    // ==============================
    // PROJECT TYPE SWITCHING
    // ==============================

    const projectType = document.getElementById("project_type");
    const commonFields = document.getElementById("common-project-fields");
    const linkFields = document.getElementById("link-project-fields");
    const fileFields = document.getElementById("file-project-fields");

    function updateProjectType() {

        const type = projectType.value;

        // Hide all project fields first
        commonFields.hidden = true;
        linkFields.hidden = true;
        fileFields.hidden = true;

        // Show the correct fields
        if (type === "link") {
            commonFields.hidden = false;
            linkFields.hidden = false;
        }

        if (type === "file") {
            commonFields.hidden = false;
            fileFields.hidden = false;
        }
    }

    if (projectType) {
        projectType.addEventListener("change", updateProjectType);

        // Handle edit mode
        updateProjectType();
    }


    // ==============================
    // CASE STUDY TOGGLE
    // ==============================

    const caseStudyButton = document.getElementById("toggle-case-study");
    const caseStudyFields = document.getElementById("case-study-fields");

    if (caseStudyButton && caseStudyFields) {

        caseStudyButton.addEventListener("click", () => {

            caseStudyFields.hidden = !caseStudyFields.hidden;

            if (caseStudyFields.hidden) {
                caseStudyButton.textContent = "📊 Add Case Study";
            } else {
                caseStudyButton.textContent = "📊 Hide Case Study";
            }

        });
    }


    // ==============================
    // PAGE SHOW / BACK-FORWARD CACHE
    // ==============================

    window.addEventListener("pageshow", function (event) {
        if (event.persisted) {
            window.location.reload();
        }
    });

});