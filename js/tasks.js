// ==========================================================================
// StudyHub - Task Management JavaScript (js/tasks.js)
// Simple, beginner-friendly JavaScript for Dashboard, Planner & Add Task
// ==========================================================================

// Global array to store tasks in memory once loaded
let allTasks = [];

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

// 1. Fetch all tasks from the backend API using async/await
async function fetchTasks() {
    try {
        const response = await fetch(API_BASE + '/api/tasks');
        const data = await getResponseData(response);

        if (!response.ok) {
            const errorMsg = (data && data.error) ? data.error : 'Server returned status ' + response.status;
            throw new Error(errorMsg);
        }

        allTasks = data || [];
        renderTasks();
        updateTaskCounts();
    } catch (error) {
        console.error('Error loading tasks:', error);
        showErrorMessage('Unable to load tasks from server. Please make sure server.js is running on http://localhost:3000.');
    }
}

// 2. Update task counts (Total, Completed, Pending) on Dashboard
function updateTaskCounts() {
    const totalCountElem = document.getElementById('total-tasks-count');
    const completedCountElem = document.getElementById('completed-tasks-count');
    const pendingCountElem = document.getElementById('pending-tasks-count');

    const total = allTasks.length;
    const completed = allTasks.filter(task => task.completed).length;
    const pending = total - completed;

    if (totalCountElem) {
        totalCountElem.textContent = total;
    }
    if (completedCountElem) {
        completedCountElem.textContent = completed;
    }
    if (pendingCountElem) {
        pendingCountElem.textContent = pending;
    }
}

// 3. Render tasks on Dashboard (latest 5) or Planner (all tasks)
function renderTasks() {
    const recentTasksContainer = document.getElementById('recent-tasks-list');
    const allTasksContainer = document.getElementById('tasks-list');
    const noTasksMessage = document.getElementById('no-tasks-message');

    // --- Dashboard: Show latest 5 tasks ---
    if (recentTasksContainer) {
        recentTasksContainer.innerHTML = '';

        if (allTasks.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-state';
            emptyDiv.textContent = 'No tasks yet. Click "Add New Task" to schedule your study work.';
            recentTasksContainer.appendChild(emptyDiv);
            return;
        }

        // Show latest 5 tasks (reverse order so newest is at the top)
        const latestTasks = allTasks.slice().reverse().slice(0, 5);
        latestTasks.forEach(task => {
            const item = createTaskRow(task, false);
            recentTasksContainer.appendChild(item);
        });
    }

    // --- Planner: Show all tasks ---
    if (allTasksContainer) {
        allTasksContainer.innerHTML = '';

        if (allTasks.length === 0) {
            if (noTasksMessage) {
                noTasksMessage.style.display = 'block';
            }
            return;
        }

        if (noTasksMessage) {
            noTasksMessage.style.display = 'none';
        }

        const sortedTasks = allTasks.slice().reverse();
        sortedTasks.forEach(task => {
            const item = createTaskRow(task, true);
            allTasksContainer.appendChild(item);
        });
    }
}

// Helper: Create a single task row DOM element
function createTaskRow(task, showCompleteButton) {
    const row = document.createElement('article');
    row.className = 'item-row';
    row.id = 'task-row-' + task.id;

    // Left details container
    const details = document.createElement('div');
    details.style.flex = '1';

    // Title line with subject badge
    const titleLine = document.createElement('div');
    titleLine.style.display = 'flex';
    titleLine.style.alignItems = 'center';
    titleLine.style.gap = '8px';
    titleLine.style.flexWrap = 'wrap';

    const titleStrong = document.createElement('strong');
    titleStrong.textContent = task.title;
    if (task.completed) {
        titleStrong.className = 'task-title-done';
    }
    titleLine.appendChild(titleStrong);

    if (task.subject) {
        const subjectBadge = document.createElement('span');
        subjectBadge.className = 'badge badge-purple';
        subjectBadge.textContent = task.subject;
        titleLine.appendChild(subjectBadge);
    }
    details.appendChild(titleLine);

    // Meta details (Due Date & Priority)
    const meta = document.createElement('p');
    meta.style.fontSize = '13px';
    meta.style.color = 'var(--muted)';
    meta.style.marginTop = '4px';

    const formattedDate = task.dueDate ? task.dueDate : 'No due date';
    meta.textContent = 'Due: ' + formattedDate + ' • Priority: ';

    const priorityBadge = document.createElement('span');
    const prio = (task.priority || 'Medium').toLowerCase();
    if (prio === 'high') {
        priorityBadge.className = 'badge badge-red';
    } else if (prio === 'low') {
        priorityBadge.className = 'badge badge-green';
    } else {
        priorityBadge.className = 'badge badge-amber';
    }
    priorityBadge.textContent = task.priority || 'Medium';
    meta.appendChild(priorityBadge);

    details.appendChild(meta);
    row.appendChild(details);

    // Right actions container (Status badge and Complete button)
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.alignItems = 'center';
    actions.style.gap = '10px';

    const statusBadge = document.createElement('span');
    if (task.completed) {
        statusBadge.className = 'badge badge-green';
        statusBadge.textContent = 'COMPLETED';
    } else {
        statusBadge.className = 'badge badge-amber';
        statusBadge.textContent = 'PENDING';
    }
    actions.appendChild(statusBadge);

    // If on planner page and task is pending, allow marking complete
    if (showCompleteButton && !task.completed) {
        const completeBtn = document.createElement('button');
        completeBtn.className = 'btn btn-sm btn-success';
        completeBtn.textContent = '✓ Complete';
        completeBtn.title = 'Mark task as completed';
        completeBtn.addEventListener('click', () => {
            markTaskComplete(task.id, completeBtn);
        });
        actions.appendChild(completeBtn);
    }

    row.appendChild(actions);
    return row;
}

// 4. Mark a task as completed via PATCH /api/tasks/:id using async/await
async function markTaskComplete(taskId, buttonElement) {
    if (buttonElement) {
        buttonElement.disabled = true;
        buttonElement.textContent = 'Updating...';
    }

    try {
        const response = await fetch(API_BASE + '/api/tasks/' + taskId, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ completed: true })
        });

        const data = await getResponseData(response);

        if (!response.ok) {
            const errorMsg = (data && data.error) ? data.error : 'Failed to update task';
            throw new Error(errorMsg);
        }

        // Refresh task list from server
        await fetchTasks();
    } catch (error) {
        console.error('Error marking task as complete:', error);
        alert('Could not update task. Please check that server.js is running.');
        if (buttonElement) {
            buttonElement.disabled = false;
            buttonElement.textContent = '✓ Complete';
        }
    }
}

// 5. Initialize the Add Task Form
function initAddTaskForm() {
    const taskForm = document.getElementById('add-task-form');
    if (!taskForm) return;

    const titleInput = document.getElementById('task-title');
    const subjectInput = document.getElementById('task-subject');
    const dueDateInput = document.getElementById('task-due-date');
    const prioritySelect = document.getElementById('task-priority');
    const submitBtn = document.getElementById('task-submit-btn');
    const messageContainer = document.getElementById('form-message');

    // Prevent selecting a past due date
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;
    if (dueDateInput) {
        dueDateInput.setAttribute('min', todayString);
    }

    taskForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        // Clear existing messages
        if (messageContainer) {
            messageContainer.style.display = 'none';
            messageContainer.className = 'alert';
            messageContainer.textContent = '';
        }

        const title = titleInput.value.trim();
        const subject = subjectInput.value.trim();
        const dueDate = dueDateInput.value;
        const priority = prioritySelect.value;

        // Validation 1: All fields required
        if (!title || !subject || !dueDate || !priority) {
            displayFormMessage('All fields are required. Please fill in every field.', 'error');
            return;
        }

        // Validation 2: Past due date check
        if (dueDate < todayString) {
            displayFormMessage('Due date cannot be in the past. Please select today or a future date.', 'error');
            return;
        }

        // Prevent duplicate clicks while submitting
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Saving Task...';
        }

        const payload = {
            title: title,
            subject: subject,
            dueDate: dueDate,
            priority: priority,
            completed: false
        };

        try {
            const response = await fetch(API_BASE + '/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await getResponseData(response);

            if (!response.ok) {
                const errorMsg = (data && data.error) ? data.error : 'Server returned status ' + response.status;
                throw new Error(errorMsg);
            }

            displayFormMessage('Task added successfully! Redirecting to Study Planner...', 'success');
            taskForm.reset();

            if (dueDateInput) {
                dueDateInput.setAttribute('min', todayString);
            }

            setTimeout(() => {
                window.location.href = 'planner.html';
            }, 1200);

        } catch (error) {
            console.error('Error adding task:', error);
            let displayMsg = error.message;
            if (displayMsg.includes('Failed to fetch') || displayMsg.includes('NetworkError') || displayMsg.includes('Unexpected token')) {
                displayMsg = 'Cannot connect to server. Please make sure server.js is running on http://localhost:3000';
            }
            displayFormMessage(displayMsg, 'error');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Add Task';
            }
        }
    });

    function displayFormMessage(text, type) {
        if (!messageContainer) return;
        messageContainer.style.display = 'block';
        messageContainer.className = type === 'success' ? 'alert alert-success' : 'alert alert-error';
        messageContainer.textContent = text;
    }
}

// 6. Helper to show error message on planner if fetch fails
function showErrorMessage(msg) {
    const errorBox = document.getElementById('task-error-message');
    if (errorBox) {
        errorBox.style.display = 'block';
        errorBox.textContent = msg;
    }
}

// 7. Page Load Initialization
document.addEventListener('DOMContentLoaded', () => {
    const recentTasksContainer = document.getElementById('recent-tasks-list');
    const allTasksContainer = document.getElementById('tasks-list');
    const totalCountElem = document.getElementById('total-tasks-count');

    if (recentTasksContainer || allTasksContainer || totalCountElem) {
        fetchTasks();
    }

    initAddTaskForm();
});
