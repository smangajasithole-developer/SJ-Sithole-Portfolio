// skills.js - Skills Management JavaScript
// Includes preview, editing, validation, visibility, and drag-and-drop ordering

document.addEventListener("DOMContentLoaded", function() {

    // ============================================
    // PREVIEW
    // ============================================

    const nameInput = document.querySelector('input[name="name"]');
    const heading = document.querySelector('select[name="heading"]');
    const display = document.querySelector('select[name="display_type"]');
    const preview = document.getElementById("previewSkillText");

    function renderPreview() {

        const text = nameInput
            ? (nameInput.value || "Back-End")
            : "Back-End";

        const tag = heading
            ? heading.value
            : "h3";

        const style = display
            ? display.value
            : "title";

        let html = `<${tag}>${text}</${tag}>`;

        if (style === "bullet") {
            html = `• ${html}`;
        }

        if (style === "plain") {
            html = `<${tag} style="font-weight:400;">${text}</${tag}>`;
        }

        if (preview) {
            preview.innerHTML = html;
        }
    }

    if (nameInput && heading && display) {

        nameInput.addEventListener("keyup", renderPreview);
        heading.addEventListener("change", renderPreview);
        display.addEventListener("change", renderPreview);

        renderPreview();
    }


    // ============================================
    // EDIT MODE
    // ============================================

    function toggleEditMode(id, show) {

        const view = document.getElementById("view-" + id);
        const edit = document.getElementById("edit-" + id);

        if (!view || !edit) {
            return;
        }

        edit.style.display = show ? "block" : "none";
        view.style.display = show ? "none" : "block";

        if (show) {

            const input = edit.querySelector(
                'input[name="name"]'
            );

            if (input) {
                input.focus();
                input.select();
            }
        }
    }


    document.addEventListener("click", function(e) {

        const editButton = e.target.closest(".edit-toggle");
        const cancelButton = e.target.closest(".cancel-edit, .cancel-edit-node");

        if (editButton) {

            const id = editButton.dataset.id;

            if (id) {
                toggleEditMode(id, true);
            }
        }

        if (cancelButton) {

            const id = cancelButton.dataset.id;

            if (id) {
                toggleEditMode(id, false);
            }
        }

    });


    // ============================================
    // FORM VALIDATION
    // ============================================

    document.querySelectorAll(
        'form[action*="skills"]'
    ).forEach(function(form) {

        form.addEventListener("submit", function(e) {

            const nameField = form.querySelector(
                'input[name="name"]'
            );

            if (
                nameField &&
                !nameField.value.trim()
            ) {

                e.preventDefault();

                alert("Please enter a skill name.");

                nameField.focus();
            }

        });

    });


    // ============================================
    // DELETE CONFIRMATION
    // ============================================

    document.querySelectorAll(
        ".delete-form button"
    ).forEach(function(button) {

        button.addEventListener("click", function(e) {

            const message =
                "⚠️ WARNING: This will permanently delete this skill and all its child skills!\n\n" +
                "Are you absolutely sure?";

            if (!confirm(message)) {
                e.preventDefault();
            }

        });

    });


    // ============================================
    // PARENT SKILL AUTO-SUGGEST
    // ============================================

    const parentInput =
        document.querySelector(
            'input[name="parent_name"]'
        );

    if (parentInput) {

        const skills = [];

        document.querySelectorAll(
            ".skill-title h1, " +
            ".skill-title h2, " +
            ".skill-title h3, " +
            ".skill-title h4, " +
            ".skill-title h5, " +
            ".skill-title h6, " +
            ".node-name"
        ).forEach(function(element) {

            const name =
                element.textContent.trim();

            if (
                name &&
                !skills.includes(name)
            ) {

                skills.push(name);
            }

        });

        parentInput.setAttribute(
            "list",
            "skill-suggestions"
        );

        if (!document.getElementById("skill-suggestions")) {

            const datalist =
                document.createElement("datalist");

            datalist.id =
                "skill-suggestions";

            skills.forEach(function(skill) {

                const option =
                    document.createElement("option");

                option.value =
                    skill;

                datalist.appendChild(
                    option
                );

            });

            parentInput.parentNode.appendChild(
                datalist
            );
        }
    }


    // ============================================
    // ESCAPE TO CANCEL EDIT
    // ============================================

    document.addEventListener("keydown", function(e) {

        if (e.key !== "Escape") {
            return;
        }

        document.querySelectorAll(
            '.inline-edit-form[style*="display: block"], ' +
            '.inline-edit-form[style*="display:block"]'
        ).forEach(function(form) {

            const id =
                form.id.replace("edit-", "");

            if (id) {
                toggleEditMode(id, false);
            }

        });

    });


    // ============================================
    // DRAG & DROP
    // ============================================

    let draggedNode = null;
    let sourceContainer = null;
    let moved = false;

    // ============================================
    // AUTO SCROLL SETTINGS
    // ============================================

    let autoScrollAnimation = null;

    const scrollEdgeSize = 100;
    const maxScrollSpeed = 18;


    function getSkillNodes(container) {

        if (!container) {
            return [];
        }

        return Array.from(
            container.children
        ).filter(function(element) {

            return element.classList.contains(
                "skill-node"
            );

        });

    }


    function saveOrder(container) {

        const nodes =
            getSkillNodes(container);

        if (!nodes.length) {
            return;
        }

        const form =
            document.createElement("form");

        form.method = "POST";
        form.action = window.location.href;
        form.style.display = "none";


        const csrf =
            document.querySelector(
                'input[name="csrfmiddlewaretoken"]'
            );

        if (!csrf) {
            console.error("CSRF token not found.");
            return;
        }


        function addField(name, value) {

            const field =
                document.createElement("input");

            field.type = "hidden";
            field.name = name;
            field.value = value;

            form.appendChild(field);
        }


        addField(
            "csrfmiddlewaretoken",
            csrf.value
        );

        addField(
            "reorder",
            "1"
        );


        nodes.forEach(function(node) {

            addField(
                "order_ids",
                node.dataset.nodeId
            );

        });


        console.log(
            "Saving skill order:",
            nodes.map(function(node) {
                return node.dataset.nodeId;
            })
        );


        document.body.appendChild(form);

        form.submit();
    }


    // ============================================
    // AUTO SCROLL
    // ============================================

    function stopAutoScroll() {

        if (autoScrollAnimation) {

            cancelAnimationFrame(
                autoScrollAnimation
            );

            autoScrollAnimation = null;
        }
    }


    function startAutoScroll(mouseY) {

        if (!draggedNode) {
            return;
        }


        const viewportHeight =
            window.innerHeight;


        let scrollAmount = 0;


        // ----------------------------------------
        // SCROLL UP
        // ----------------------------------------

        if (mouseY < scrollEdgeSize) {

            const distance =
                scrollEdgeSize - mouseY;

            const intensity =
                Math.min(
                    distance / scrollEdgeSize,
                    1
                );

            scrollAmount =
                -Math.max(
                    2,
                    maxScrollSpeed * intensity
                );
        }


        // ----------------------------------------
        // SCROLL DOWN
        // ----------------------------------------

        else if (
            mouseY >
            viewportHeight - scrollEdgeSize
        ) {

            const distance =
                mouseY -
                (viewportHeight - scrollEdgeSize);

            const intensity =
                Math.min(
                    distance / scrollEdgeSize,
                    1
                );

            scrollAmount =
                Math.max(
                    2,
                    maxScrollSpeed * intensity
                );
        }


        if (scrollAmount !== 0) {

            window.scrollBy(
                0,
                scrollAmount
            );


            autoScrollAnimation =
                requestAnimationFrame(function() {

                    startAutoScroll(mouseY);

                });

        } else {

            stopAutoScroll();
        }
    }


    // --------------------------------------------
    // DRAG START
    // --------------------------------------------

    document.addEventListener("dragstart", function(e) {

        const node =
            e.target.closest(".skill-node");

        if (!node) {
            return;
        }


        if (
            e.target.closest(
                "button, form, input, select, textarea, label, a"
            )
        ) {

            e.preventDefault();
            return;
        }


        const container =
            node.parentElement;


        if (!container) {
            e.preventDefault();
            return;
        }


        // The node can only be dragged if its
        // direct parent contains skill nodes.
        if (!getSkillNodes(container).length) {
            e.preventDefault();
            return;
        }


        draggedNode = node;
        sourceContainer = container;
        moved = false;


        e.dataTransfer.effectAllowed = "move";

        e.dataTransfer.setData(
            "text/plain",
            node.dataset.nodeId
        );


        node.classList.add("dragging");

    });


    // --------------------------------------------
    // DRAG OVER
    // --------------------------------------------

    document.addEventListener("dragover", function(e) {

        if (!draggedNode || !sourceContainer) {
            return;
        }


        // ----------------------------------------
        // AUTO SCROLL
        // ----------------------------------------

        startAutoScroll(e.clientY);


        const target =
            e.target.closest(".skill-node");

        if (!target || target === draggedNode) {
            return;
        }


        // Only reorder within the same sibling
        // container. This prevents re-parenting.
        if (
            target.parentElement !==
            sourceContainer
        ) {
            return;
        }


        e.preventDefault();

        e.dataTransfer.dropEffect = "move";


        document.querySelectorAll(
            ".drag-over"
        ).forEach(function(node) {

            node.classList.remove("drag-over");

        });


        target.classList.add("drag-over");


        const rect =
            target.getBoundingClientRect();

        const before =
            e.clientY <
            rect.top + rect.height / 2;


        if (before) {

            if (
                draggedNode.nextElementSibling !==
                target
            ) {

                sourceContainer.insertBefore(
                    draggedNode,
                    target
                );

                moved = true;
            }

        } else {

            const next =
                target.nextElementSibling;

            if (next !== draggedNode) {

                sourceContainer.insertBefore(
                    draggedNode,
                    next
                );

                moved = true;
            }

        }

    });


    // --------------------------------------------
    // DROP
    // --------------------------------------------

    document.addEventListener("drop", function(e) {

        if (!draggedNode || !sourceContainer) {
            return;
        }

        const target =
            e.target.closest(".skill-node");

        if (
            target &&
            target.parentElement === sourceContainer
        ) {

            e.preventDefault();
        }

    });


    // --------------------------------------------
    // DRAG END
    // --------------------------------------------

    document.addEventListener("dragend", function() {

        // Stop automatic scrolling immediately.
        stopAutoScroll();


        if (
            draggedNode &&
            sourceContainer &&
            moved
        ) {

            saveOrder(sourceContainer);
        }


        document.querySelectorAll(
            ".dragging, .drag-over"
        ).forEach(function(node) {

            node.classList.remove(
                "dragging",
                "drag-over"
            );

        });


        draggedNode = null;
        sourceContainer = null;
        moved = false;

    });


    // ============================================
    // BROWSER BACK/FORWARD CACHE
    // ============================================

    window.addEventListener(
        "pageshow",
        function(event) {

            if (event.persisted) {
                window.location.reload();
            }

        }
    );

});


// ============================================
// EDIT HELPERS
// ============================================

window.handleCancelEdit = function(skillId) {

    const view =
        document.getElementById(
            "view-" + skillId
        );

    const edit =
        document.getElementById(
            "edit-" + skillId
        );

    if (view && edit) {

        edit.style.display = "none";
        view.style.display = "block";

    }

};


window.handleEditToggle = function(skillId) {

    const view =
        document.getElementById(
            "view-" + skillId
        );

    const edit =
        document.getElementById(
            "edit-" + skillId
        );

    if (view && edit) {

        edit.style.display = "block";
        view.style.display = "none";

        const input =
            edit.querySelector(
                'input[name="name"]'
            );

        if (input) {

            input.focus();
            input.select();

        }

    }

};