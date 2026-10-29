// StudyHub - Task Management

let allTasks = [];

// API URL
const API_BASE = window.location.port === '3000'
    ? ''
    : 'http://localhost:3000';


// 1. Fetch all tasks from the server
async function fetchTasks() {
    try {
        const response = await fetch(API_BASE + '/api/tasks');

        if (!response.ok) {
            throw new Error('Failed to load tasks');
        }

        allTasks = await response.json();

        renderTasks();
        updateTaskCounts();

    } catch (error) {
        console.error(error);
        showErrorMessage('Unable to load tasks. Please check the server.');
    }
}


// 2. Update task counts on Dashboard
function updateTaskCounts() {
    const total = allTasks.length;
    const completed = allTasks.filter(task => task.completed).length;
    const pending = total - completed;

    const totalElement = document.getElementById('total-tasks-count');
    const completedElement = document.getElementById('completed-tasks-count');
    const pendingElement = document.getElementById('pending-tasks-count');

    if (totalElement) totalElement.textContent = total;
    if (completedElement) completedElement.textContent = completed;
    if (pendingElement) pendingElement.textContent = pending;
}


// 3. Display tasks on Dashboard and Planner
function renderTasks() {
    const recentList = document.getElementById('recent-tasks-list');
    const tasksList = document.getElementById('tasks-list');
    const noTasksMessage = document.getElementById('no-tasks-message');

    // Dashboard: Display the latest five tasks
    if (recentList) {
        recentList.innerHTML = '';

        const recentTasks = allTasks.slice().reverse().slice(0, 5);

        if (recentTasks.length === 0) {
            recentList.textContent = 'No tasks yet. Add your first task!';
        } else {
            recentTasks.forEach(task => {
                recentList.appendChild(createTaskRow(task, false));
            });
        }
    }

    // Planner: Display all tasks
    if (tasksList) {
        tasksList.innerHTML = '';

        if (allTasks.length === 0) {
            if (noTasksMessage) noTasksMessage.style.display = 'block';
        } else {
            if (noTasksMessage) noTasksMessage.style.display = 'none';

            allTasks.slice().reverse().forEach(task => {
                tasksList.appendChild(createTaskRow(task, true));
            });
        }
    }
}


// 4. Create a task row
function createTaskRow(task, showButton) {
    const row = document.createElement('article');
    row.className = 'item-row';
    row.id = 'task-row-' + task.id;

    const details = document.createElement('div');

    const title = document.createElement('strong');
    title.textContent = task.title;

    if (task.completed) {
        title.className = 'task-title-done';
    }

    details.appendChild(title);

    const subject = document.createElement('span');
    subject.className = 'badge badge-purple';
    subject.textContent = ' ' + (task.subject || 'General');
    details.appendChild(subject);

    const info = document.createElement('p');
    info.textContent = 'Due: ' + (task.dueDate || 'No due date')
        + ' | Priority: ' + (task.priority || 'Medium');
    details.appendChild(info);

    row.appendChild(details);

    const status = document.createElement('span');
    status.className = task.completed
        ? 'badge badge-green'
        : 'badge badge-amber';
    status.textContent = task.completed ? 'COMPLETED' : 'PENDING';

    row.appendChild(status);

    // Show Complete button only for pending tasks on Planner
    if (showButton && !task.completed) {
        const button = document.createElement('button');
        button.className = 'btn btn-sm btn-success';
        button.textContent = 'Complete';

        button.addEventListener('click', function () {
            markTaskComplete(task.id, button);
        });

        row.appendChild(button);
    }

    return row;
}


// 5. Mark a task as completed
async function markTaskComplete(taskId, button) {
    button.disabled = true;
    button.textContent = 'Updating...';

    try {
        const response = await fetch(
            API_BASE + '/api/tasks/' + taskId,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ completed: true })
            }
        );

        if (!response.ok) {
            throw new Error('Failed to update task');
        }

        await fetchTasks();

    } catch (error) {
        alert('Unable to update task. Please check the server.');
        button.disabled = false;
        button.textContent = 'Complete';
    }
}


// 6. Handle the Add Task form
function initAddTaskForm() {
    const form = document.getElementById('add-task-form');

    if (!form) return;

    const titleInput = document.getElementById('task-title');
    const subjectInput = document.getElementById('task-subject');
    const dateInput = document.getElementById('task-due-date');
    const priorityInput = document.getElementById('task-priority');
    const submitButton = document.getElementById('task-submit-btn');
    const message = document.getElementById('form-message');

    // Prevent selecting a past date
    const today = new Date().toISOString().split('T')[0];

    if (dateInput) {
        dateInput.min = today;
    }

    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        const title = titleInput.value.trim();
        const subject = subjectInput.value.trim();
        const dueDate = dateInput.value;
        const priority = priorityInput.value;

        if (!title || !subject || !dueDate || !priority) {
            displayMessage('Please fill in all fields.', 'error');
            return;
        }

        if (dueDate < today) {
            displayMessage('Due date cannot be in the past.', 'error');
            return;
        }

        const task = {
            title: title,
            subject: subject,
            dueDate: dueDate,
            priority: priority,
            completed: false
        };

        try {
            submitButton.disabled = true;
            submitButton.textContent = 'Saving...';

            const response = await fetch(API_BASE + '/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(task)
            });

            if (!response.ok) {
                throw new Error('Failed to add task');
            }

            displayMessage('Task added successfully!', 'success');
            form.reset();

            setTimeout(function () {
                window.location.href = 'planner.html';
            }, 1000);

        } catch (error) {
            displayMessage('Unable to add task. Please check the server.', 'error');
            submitButton.disabled = false;
            submitButton.textContent = 'Add Task';
        }
    });

    // Display success or error message
    function displayMessage(text, type) {
        if (!message) return;

        message.style.display = 'block';
        message.className = type === 'success'
            ? 'alert alert-success'
            : 'alert alert-error';
        message.textContent = text;
    }
}


// 7. Display an error message
function showErrorMessage(text) {
    const errorBox = document.getElementById('task-error-message');

    if (errorBox) {
        errorBox.style.display = 'block';
        errorBox.textContent = text;
    }
}


// 8. Run code when the page loads
document.addEventListener('DOMContentLoaded', function () {
    if (
        document.getElementById('recent-tasks-list') ||
        document.getElementById('tasks-list') ||
        document.getElementById('total-tasks-count')
    ) {
        fetchTasks();
    }

    initAddTaskForm();
});
