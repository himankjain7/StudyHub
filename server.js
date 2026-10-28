// ==========================================================================
// StudyHub - Minimal Node.js & Express Server
// Beginner-friendly server for college evaluation (easy to explain in viva)
// ==========================================================================

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware 1: Enable CORS for local testing across ports
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Middleware 2: Parse incoming JSON request bodies
app.use(express.json());

// Middleware 3: Serve static frontend files (HTML, CSS, JS)
app.use(express.static(__dirname, { extensions: ['html'] }));

// Helper function to safely read data from data.json
function readData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            const initialData = { tasks: [], resources: [], users: [], contacts: [] };
            fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf8');
            return initialData;
        }
        const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error('Error reading data.json:', error);
        return { tasks: [], resources: [], users: [], contacts: [] };
    }
}

// Helper function to safely write data to data.json
function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing to data.json:', error);
        return false;
    }
}

// --------------------------------------------------------------------------
// 1. Task API Routes
// --------------------------------------------------------------------------

// GET /api/tasks - Retrieve all tasks
app.get('/api/tasks', (req, res) => {
    const data = readData();
    res.json(data.tasks || []);
});

// POST /api/tasks - Create and save a new task
app.post('/api/tasks', (req, res) => {
    const { title, subject, dueDate, priority } = req.body;

    // Validate required fields
    if (!title || !subject || !dueDate || !priority) {
        return res.status(400).json({ error: 'All fields (title, subject, dueDate, priority) are required.' });
    }

    const data = readData();
    if (!data.tasks) {
        data.tasks = [];
    }

    const newTask = {
        id: Date.now(),
        title: title.trim(),
        subject: subject.trim(),
        dueDate: dueDate,
        priority: priority,
        completed: false
    };

    data.tasks.push(newTask);

    if (writeData(data)) {
        res.status(201).json(newTask);
    } else {
        res.status(500).json({ error: 'Failed to save task to data.json' });
    }
});

// PATCH /api/tasks/:id - Mark task as completed
app.patch('/api/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    const data = readData();

    if (!data.tasks) {
        return res.status(404).json({ error: 'No tasks found.' });
    }

    const task = data.tasks.find(t => String(t.id) === String(taskId));

    if (!task) {
        return res.status(404).json({ error: 'Task not found.' });
    }

    if (req.body && req.body.completed !== undefined) {
        task.completed = Boolean(req.body.completed);
    } else {
        task.completed = true;
    }

    if (writeData(data)) {
        res.json(task);
    } else {
        res.status(500).json({ error: 'Failed to update task in data.json' });
    }
});

// --------------------------------------------------------------------------
// 2. Resources API Route
// --------------------------------------------------------------------------

// GET /api/resources - Retrieve resources
app.get('/api/resources', (req, res) => {
    const data = readData();
    res.json(data.resources || []);
});

// POST /api/resources - Add a new resource
app.post('/api/resources', (req, res) => {
    const { title, subject, type, url, description } = req.body;

    if (!title || !subject) {
        return res.status(400).json({ error: 'Title and subject are required.' });
    }

    const data = readData();
    if (!data.resources) {
        data.resources = [];
    }

    let formattedUrl = (url && url.trim()) ? url.trim() : '#';
    if (formattedUrl !== '#' && !formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl;
    }

    const newResource = {
        id: Date.now(),
        title: title.trim(),
        subject: subject.trim(),
        type: (type && type.trim()) ? type.trim() : 'Website',
        url: formattedUrl,
        description: description ? description.trim() : ''
    };

    data.resources.push(newResource);

    if (writeData(data)) {
        res.status(201).json(newResource);
    } else {
        res.status(500).json({ error: 'Failed to save resource to data.json' });
    }
});

// DELETE /api/resources/:id - Delete a resource by ID
app.delete('/api/resources/:id', (req, res) => {
    const resourceId = req.params.id;
    const data = readData();

    if (!data.resources) {
        return res.status(404).json({ error: 'Resource not found' });
    }

    const initialLength = data.resources.length;
    data.resources = data.resources.filter(r => String(r.id) !== String(resourceId));

    if (data.resources.length === initialLength) {
        return res.status(404).json({ error: 'Resource not found' });
    }

    if (writeData(data)) {
        res.json({ message: 'Resource deleted successfully', id: resourceId });
    } else {
        res.status(500).json({ error: 'Failed to delete resource from data.json' });
    }
});

// --------------------------------------------------------------------------
// 3. Registration API Route
// --------------------------------------------------------------------------

// POST /api/register - Save student registration (Name & Email only, NO password)
app.post('/api/register', (req, res) => {
    const { fullName, email } = req.body;

    if (!fullName || !email) {
        return res.status(400).json({ error: 'Full name and email are required.' });
    }

    const data = readData();
    if (!data.users) {
        data.users = [];
    }

    const newUser = {
        id: Date.now(),
        fullName: fullName.trim(),
        email: email.trim(),
        registeredAt: new Date().toISOString()
    };

    data.users.push(newUser);
    writeData(data);

    res.status(201).json({ message: 'Registration successful!', user: newUser });
});

// --------------------------------------------------------------------------
// 4. Contact API Route
// --------------------------------------------------------------------------

// POST /api/contact - Save contact form submission
app.post('/api/contact', (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    const data = readData();
    if (!data.contacts) {
        data.contacts = [];
    }

    const newContact = {
        id: Date.now(),
        name: name.trim(),
        email: email.trim(),
        subject: subject ? subject.trim() : 'General Inquiry',
        message: message.trim(),
        submittedAt: new Date().toISOString()
    };

    data.contacts.push(newContact);
    writeData(data);

    res.status(201).json({ message: 'Message sent successfully!', contact: newContact });
});

// --------------------------------------------------------------------------
// 5. Catch-All & Error Handlers (Always return JSON for /api/*, never HTML)
// --------------------------------------------------------------------------

// Serve index.html on root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Return JSON 404 for any unknown /api route instead of HTML error page
app.all(['/api', '/api/*'], (req, res) => {
    res.status(404).json({ error: `API route ${req.method} ${req.originalUrl} not found` });
});

// Global error handler ensuring JSON responses for unexpected errors
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`StudyHub server running on http://localhost:${PORT}`);
});
