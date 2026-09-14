// ============================================
// DOCUMENTS MANAGEMENT - JAVASCRIPT
// Edit Modal Functionality
// ============================================

// Global variables
let currentEditModal = null;

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function() {
    currentEditModal = document.getElementById("editModal");
    
    // Close modal when clicking outside
    window.addEventListener("click", function(event) {
        if (currentEditModal && event.target === currentEditModal) {
            closeEditModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener("keydown", function(event) {
        if (event.key === "Escape" && currentEditModal && currentEditModal.classList.contains("show")) {
            closeEditModal();
        }
    });
});

// ============================================
// OPEN EDIT MODAL
// ============================================
function openEditModal(docId, title, placeObtained, description) {
    // Get form elements
    const docIdInput = document.getElementById("edit_doc_id");
    const titleInput = document.getElementById("edit_title");
    const placeInput = document.getElementById("edit_place");
    const descriptionInput = document.getElementById("edit_description");
    
    // Set values
    if (docIdInput) docIdInput.value = docId;
    if (titleInput) titleInput.value = title || "";
    if (placeInput) placeInput.value = placeObtained || "";
    if (descriptionInput) descriptionInput.value = description || "";
    
    // Show modal
    if (currentEditModal) {
        currentEditModal.classList.add("show");
        currentEditModal.style.display = "flex";
        
        // Focus on title input
        setTimeout(function() {
            if (titleInput) titleInput.focus();
        }, 100);
    }
}

// ============================================
// CLOSE EDIT MODAL
// ============================================
function closeEditModal() {
    if (currentEditModal) {
        currentEditModal.classList.remove("show");
        currentEditModal.style.display = "none";
        
        // Reset form
        const form = document.getElementById("editDocumentForm");
        if (form) form.reset();
    }
}

// ============================================
// FORM VALIDATION
// ============================================
document.addEventListener("DOMContentLoaded", function() {
    // Validate upload forms
    const uploadForms = document.querySelectorAll(".upload-form, .inline-form");
    uploadForms.forEach(function(form) {
        form.addEventListener("submit", function(e) {
            const fileInput = form.querySelector('input[type="file"]');
            if (fileInput && !fileInput.files.length) {
                e.preventDefault();
                alert("Please select a file to upload.");
                fileInput.focus();
            }
        });
    });
});

// ============================================
// DELETE CONFIRMATION (Enhanced)
// ============================================
document.addEventListener("DOMContentLoaded", function() {
    const deleteButtons = document.querySelectorAll(".delete-btn");
    deleteButtons.forEach(function(btn) {
        // Remove existing click handlers and add new one
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener("click", function(e) {
            const confirmMsg = "⚠️ WARNING: This will permanently delete this document!\n\nAre you sure you want to continue?";
            if (!confirm(confirmMsg)) {
                e.preventDefault();
            }
        });
    });
});

// ============================================
// FILE INPUT STYLING - Show filename
// ============================================
document.addEventListener("DOMContentLoaded", function() {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(function(input) {
        input.addEventListener("change", function(e) {
            const fileName = e.target.files[0]?.name;
            if (fileName) {
                // Optional: Display filename next to input
                const wrapper = input.closest(".file-input-wrapper");
                if (wrapper) {
                    let fileNameSpan = wrapper.querySelector(".file-name");
                    if (!fileNameSpan) {
                        fileNameSpan = document.createElement("span");
                        fileNameSpan.className = "file-name";
                        wrapper.appendChild(fileNameSpan);
                    }
                    fileNameSpan.textContent = `📄 ${fileName}`;
                }
            }
        });
    });
});




function openReplaceModal(docId) {
    document.getElementById("replace_doc_id").value = docId;
    document.getElementById("replaceModal").style.display = "flex";
}

function closeReplaceModal() {
    document.getElementById("replaceModal").style.display = "none";
}




window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
        window.location.reload();
    }
});


