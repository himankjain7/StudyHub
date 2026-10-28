// ==========================================================================
// StudyHub - Resources Module JavaScript (js/resources.js)
// Simple, beginner-friendly script for Subject Filter, Show/Hide, and
// interactive Add & Delete Resource features connected to Node/Express backend.
// ==========================================================================

// Global array to hold resources loaded from the server
let allResources = [];

// Helper function to safely read JSON from a response without throwing "<!DOCTYPE" error
async function getResponseData(response) {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        try {
            return await response.json();
        } catch (e) {
            return null;
        }
    }
    return null;
}

// Base API URL:
// Uses relative '/api/...' when served directly by Node/Express on port 3000.
// Connects to 'http://localhost:3000' if opened via Live Server (port 5500, etc.)
const API_BASE = (window.location.protocol === 'http:' || window.location.protocol === 'https:') && window.location.port === '3000'
    ? ''
    : 'http://localhost:3000';

// --------------------------------------------------------------------------
// 1. Fetch all resources from the backend API
// --------------------------------------------------------------------------
async function fetchResources() {
    try {
        const response = await fetch(API_BASE + '/api/resources');
        const data = await getResponseData(response);

        if (!response.ok) {
            const errorMsg = (data && data.error) ? data.error : 'Server returned status ' + response.status;
            throw new Error(errorMsg);
        }

        allResources = data || [];
        renderResources();
    } catch (error) {
        console.error('Error loading resources:', error);
    }
}

// --------------------------------------------------------------------------
// 2. Render user-added resources into each subject card
// --------------------------------------------------------------------------
function renderResources() {
    const containers = document.querySelectorAll('.user-resources');

    containers.forEach(container => {
        const subject = container.getAttribute('data-subject');
        container.innerHTML = '';

        // Filter resources belonging to this specific subject
        const subjectResources = allResources.filter(r => r.subject === subject);

        subjectResources.forEach(res => {
            const item = createResourceElement(res);
            container.appendChild(item);
        });
    });
}

// Helper: Determine icon based on resource type
function getResourceIcon(type) {
    const t = (type || '').toLowerCase();
    if (t === 'pdf') return '📄';
    if (t === 'video') return '🎥';
    if (t === 'notes') return '📝';
    return '🌐'; // Website / default
}

// Helper: Determine badge class based on resource type
function getResourceBadgeClass(type) {
    const t = (type || '').toLowerCase();
    if (t === 'notes') return 'badge-purple';
    if (t === 'pdf') return 'badge-red';
    if (t === 'video') return 'badge-amber';
    return 'badge-blue';
}

// Helper: Create a single resource DOM element
function createResourceElement(resource) {
    const item = document.createElement('div');
    item.className = 'user-resource-item';
    item.id = 'resource-' + resource.id;

    // Top row: Resource link and delete button
    const row = document.createElement('div');
    row.className = 'user-resource-row';

    const link = document.createElement('a');
    link.href = resource.url || '#';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'user-resource-link';

    const iconSpan = document.createElement('span');
    iconSpan.textContent = getResourceIcon(resource.type);

    const titleSpan = document.createElement('span');
    titleSpan.textContent = resource.title;

    const arrowSpan = document.createElement('span');
    arrowSpan.textContent = '↗';

    link.appendChild(iconSpan);
    link.appendChild(titleSpan);
    link.appendChild(arrowSpan);
    row.appendChild(link);

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn-delete-resource';
    deleteBtn.title = 'Delete resource';
    deleteBtn.textContent = '🗑️ Delete';
    deleteBtn.addEventListener('click', async () => {
        const confirmed = confirm(`Are you sure you want to delete "${resource.title}"?`);
        if (confirmed) {
            await deleteResource(resource.id, deleteBtn);
        }
    });
    row.appendChild(deleteBtn);
    item.appendChild(row);

    // Bottom meta row: Type badge & optional description
    const meta = document.createElement('div');
    meta.className = 'user-resource-meta';

    const badge = document.createElement('span');
    badge.className = 'badge ' + getResourceBadgeClass(resource.type);
    badge.textContent = resource.type || 'Website';
    meta.appendChild(badge);

    if (resource.description) {
        const desc = document.createElement('span');
        desc.className = 'user-resource-desc';
        desc.textContent = resource.description;
        meta.appendChild(desc);
    }

    item.appendChild(meta);
    return item;
}

// --------------------------------------------------------------------------
// 3. Delete a resource via DELETE /api/resources/:id
// --------------------------------------------------------------------------
async function deleteResource(resourceId, buttonElement) {
    if (buttonElement) {
        buttonElement.disabled = true;
        buttonElement.textContent = 'Deleting...';
    }

    try {
        const response = await fetch(API_BASE + '/api/resources/' + resourceId, {
            method: 'DELETE'
        });

        const data = await getResponseData(response);

        if (!response.ok) {
            const errorMsg = (data && data.error) ? data.error : 'Failed to delete resource';
            throw new Error(errorMsg);
        }

        // Refresh resource list from server
        await fetchResources();
    } catch (error) {
        console.error('Error deleting resource:', error);
        alert('Could not delete resource. Please check that server.js is running.');
        if (buttonElement) {
            buttonElement.disabled = false;
            buttonElement.textContent = '🗑️ Delete';
        }
    }
}

// --------------------------------------------------------------------------
// 4. Initialize Add Resource Form
// --------------------------------------------------------------------------
function initAddResourceForm() {
    const openBtn = document.getElementById('open-add-resource-btn');
    const cancelBtn = document.getElementById('cancel-resource-btn');
    const formSection = document.getElementById('add-resource-section');
    const form = document.getElementById('add-resource-form');
    const messageBox = document.getElementById('resource-message');
    const saveBtn = document.getElementById('save-resource-btn');

    const titleInput = document.getElementById('resource-title');
    const subjectSelect = document.getElementById('resource-subject');
    const typeSelect = document.getElementById('resource-type');
    const urlInput = document.getElementById('resource-url');
    const descInput = document.getElementById('resource-desc');

    if (!formSection || !form) return;

    // Helper: Show feedback message
    function showMessage(text, type) {
        if (!messageBox) return;
        messageBox.style.display = 'block';
        messageBox.className = type === 'success' ? 'alert alert-success' : 'alert alert-error';
        messageBox.textContent = text;
    }

    // Toggle open/close form section
    if (openBtn) {
        openBtn.addEventListener('click', () => {
            if (formSection.style.display === 'none' || formSection.style.display === '') {
                formSection.style.display = 'block';
                openBtn.textContent = '✕ Close Form';
                if (titleInput) titleInput.focus();
            } else {
                formSection.style.display = 'none';
                openBtn.textContent = '➕ Add Resource';
                if (messageBox) messageBox.style.display = 'none';
            }
        });
    }

    // Cancel button hides form and resets inputs
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            formSection.style.display = 'none';
            if (openBtn) openBtn.textContent = '➕ Add Resource';
            form.reset();
            if (messageBox) messageBox.style.display = 'none';
        });
    }

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (messageBox) {
            messageBox.style.display = 'none';
            messageBox.className = 'alert';
            messageBox.textContent = '';
        }

        const title = titleInput.value.trim();
        const subject = subjectSelect.value;
        const type = typeSelect.value;
        let url = urlInput.value.trim();
        const description = descInput.value.trim();

        // Validation: title and subject required
        if (!title || !subject) {
            showMessage('Resource title and subject are required.', 'error');
            return;
        }

        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
        }

        const payload = {
            title: title,
            subject: subject,
            type: type,
            url: url || '#',
            description: description
        };

        try {
            const response = await fetch(API_BASE + '/api/resources', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await getResponseData(response);

            if (!response.ok) {
                const errorMsg = (data && data.error) ? data.error : 'Failed to save resource';
                throw new Error(errorMsg);
            }

            showMessage('Resource added successfully!', 'success');
            form.reset();

            // Refresh list from server to display the new resource immediately
            await fetchResources();

            // Close form after a short delay
            setTimeout(() => {
                formSection.style.display = 'none';
                if (openBtn) openBtn.textContent = '➕ Add Resource';
                if (messageBox) messageBox.style.display = 'none';
            }, 1200);

        } catch (error) {
            console.error('Error adding resource:', error);
            let displayMsg = error.message;
            if (displayMsg.includes('Failed to fetch') || displayMsg.includes('NetworkError') || displayMsg.includes('Unexpected token')) {
                displayMsg = 'Cannot connect to server. Please make sure server.js is running on http://localhost:3000';
            }
            showMessage(displayMsg, 'error');
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Resource';
            }
        }
    });
}

// --------------------------------------------------------------------------
// 5. Subject Filter & Show/Hide Toggles
// --------------------------------------------------------------------------
function initSubjectFilter() {
    const filterSelect = document.getElementById('subject-filter');
    const filterStatus = document.getElementById('filter-status-text');
    const subjectCards = document.querySelectorAll('.subject-card');

    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            const selectedSubject = filterSelect.value;

            for (let i = 0; i < subjectCards.length; i++) {
                const card = subjectCards[i];
                const cardSubject = card.getAttribute('data-subject');

                if (selectedSubject === 'all' || cardSubject === selectedSubject) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            }

            if (filterStatus) {
                if (selectedSubject === 'all') {
                    filterStatus.textContent = 'Showing all 4 subjects';
                } else {
                    filterStatus.textContent = 'Showing ' + selectedSubject + ' (1 subject)';
                }
            }
        });
    }
}

function initToggleButtons() {
    const toggleButtons = document.querySelectorAll('.toggle-resources-btn');

    for (let i = 0; i < toggleButtons.length; i++) {
        const button = toggleButtons[i];

        button.addEventListener('click', () => {
            const card = button.closest('.subject-card');
            const linksContainer = card.querySelector('.subject-links');

            if (linksContainer.style.display === 'none') {
                linksContainer.style.display = 'flex';
                button.textContent = 'Hide Resources';
            } else {
                linksContainer.style.display = 'none';
                button.textContent = 'Show Resources';
            }
        });
    }
}

// --------------------------------------------------------------------------
// 6. Page Load Initialization
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    initSubjectFilter();
    initToggleButtons();
    initAddResourceForm();
    fetchResources();
});
