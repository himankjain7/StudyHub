// ==========================================================================
// StudyHub - Minimal Node.js & Express Server
// Beginner-friendly server for college evaluation (easy to explain in viva)
// ==========================================================================

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Task = require('./models/Task');

// Enable virtual 'id' in JSON responses for frontend compatibility
Task.schema.set('toJSON', { virtuals: true });

const app = express();
const PORT = process.env.PORT || 3000;
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
// 1. Task API Routes (MongoDB CRUD)
// --------------------------------------------------------------------------

// GET /api/tasks - Fetch all tasks from MongoDB
app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await Task.find();
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks from database' });
    }
});

// POST /api/tasks - Validate and save a new task in MongoDB
app.post('/api/tasks', async (req, res) => {
    try {
        const { title, subject, dueDate, priority } = req.body;

        // Validate required fields
        if (!title || !subject || !dueDate || !priority) {
            return res.status(400).json({ error: 'All fields (title, subject, dueDate, priority) are required.' });
        }

        const newTask = new Task({
            title: title.trim(),
            subject: subject.trim(),
            dueDate: dueDate,
            priority: priority,
            completed: false
        });

        await newTask.save();
        res.status(201).json(newTask);
    } catch (error) {
        console.error('Error saving task:', error);
        res.status(500).json({ error: 'Failed to save task to database' });
    }
});

// PATCH /api/tasks/:id - Update the completed field of a task
app.patch('/api/tasks/:id', async (req, res) => {
    try {
        const taskId = req.params.id;

        // Validate MongoDB ObjectId format
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const completedStatus = (req.body && req.body.completed !== undefined)
            ? Boolean(req.body.completed)
            : true;

        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            { completed: completedStatus },
            { new: true }
        );

        if (!updatedTask) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json(updatedTask);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task in database' });
    }
});

// DELETE /api/tasks/:id - Delete a task from MongoDB
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const taskId = req.params.id;

        // Validate MongoDB ObjectId format
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const deletedTask = await Task.findByIdAndDelete(taskId);

        if (!deletedTask) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({ message: 'Task deleted successfully', id: taskId });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Failed to delete task from database' });
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

// Connect to MongoDB Atlas and start the Express server
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB connected successfully!');
        app.listen(PORT, () => {
            console.log(`StudyHub server running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Failed to connect to MongoDB:', err.message);
    });
