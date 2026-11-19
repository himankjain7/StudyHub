const mongoose = require('mongoose');

// Define the Schema for Tasks
const TaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    dueDate: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        required: true
    },
    completed: {
        type: Boolean,
        default: false
    }
});

// Export the Task model
module.exports = mongoose.model('Task', TaskSchema);
