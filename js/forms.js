// ==========================================================================
// StudyHub - Forms Validation & Submission JavaScript (js/forms.js)
// Simple, beginner-friendly JavaScript for Registration and Contact forms
// ==========================================================================

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

document.addEventListener('DOMContentLoaded', () => {

    // ----------------------------------------------------------------------
    // 1. Registration Form Handling (registration.html)
    // ----------------------------------------------------------------------
    const regForm = document.getElementById('registration-form');
    if (regForm) {
        const nameInput = document.getElementById('reg-name');
        const emailInput = document.getElementById('reg-email');
        const passwordInput = document.getElementById('reg-password');
        const confirmPasswordInput = document.getElementById('reg-confirm-password');
        const regMessage = document.getElementById('register-message');
        const regBtn = document.getElementById('register-btn');

        regForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            // Clear previous message
            if (regMessage) {
                regMessage.style.display = 'none';
                regMessage.className = 'alert';
                regMessage.textContent = '';
            }

            const fullName = nameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            // 1. Check required fields
            if (!fullName || !email || !password || !confirmPassword) {
                showFormMessage(regMessage, 'All fields are required.', 'error');
                return;
            }

            // 2. Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showFormMessage(regMessage, 'Please enter a valid college email address.', 'error');
                return;
            }

            // 3. Validate password length (minimum 6 characters)
            if (password.length < 6) {
                showFormMessage(regMessage, 'Password must be at least 6 characters long.', 'error');
                return;
            }

            // 4. Validate matching passwords
            if (password !== confirmPassword) {
                showFormMessage(regMessage, 'Passwords do not match. Please re-enter.', 'error');
                return;
            }

            // Prevent duplicate clicks
            if (regBtn) {
                regBtn.disabled = true;
                regBtn.textContent = 'Registering...';
            }

            try {
                // Send only name and email to backend (NEVER sending or storing plain password)
                const response = await fetch(API_BASE + '/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        fullName: fullName,
                        email: email
                    })
                });

                const data = await getResponseData(response);

                if (!response.ok) {
                    const errorMsg = (data && data.error) ? data.error : 'Registration failed with status ' + response.status;
                    throw new Error(errorMsg);
                }

                showFormMessage(regMessage, 'Registration successful! Welcome to StudyHub.', 'success');
                regForm.reset();

            } catch (error) {
                console.error('Registration error:', error);
                let displayMsg = error.message;
                if (displayMsg.includes('Failed to fetch') || displayMsg.includes('NetworkError') || displayMsg.includes('Unexpected token')) {
                    displayMsg = 'Cannot connect to server. Please make sure server.js is running on http://localhost:3000';
                }
                showFormMessage(regMessage, displayMsg, 'error');
            } finally {
                if (regBtn) {
                    regBtn.disabled = false;
                    regBtn.textContent = 'Register Student';
                }
            }
        });
    }

    // ----------------------------------------------------------------------
    // 2. Contact Form Handling (contact.html)
    // ----------------------------------------------------------------------
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const subjectInput = document.getElementById('subject');
        const messageInput = document.getElementById('message');
        const contactMessage = document.getElementById('contact-message');
        const submitBtn = document.getElementById('contact-submit-btn');

        contactForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            // Clear previous message
            if (contactMessage) {
                contactMessage.style.display = 'none';
                contactMessage.className = 'alert';
                contactMessage.textContent = '';
            }

            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const subject = subjectInput ? subjectInput.value.trim() : 'General Inquiry';
            const message = messageInput.value.trim();

            // Validation
            if (!name || !email || !message) {
                showFormMessage(contactMessage, 'Please fill in your name, email, and message.', 'error');
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showFormMessage(contactMessage, 'Please enter a valid college email address.', 'error');
                return;
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Sending Message...';
            }

            try {
                const response = await fetch(API_BASE + '/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: name,
                        email: email,
                        subject: subject,
                        message: message
                    })
                });

                const data = await getResponseData(response);

                if (!response.ok) {
                    const errorMsg = (data && data.error) ? data.error : 'Failed to send message with status ' + response.status;
                    throw new Error(errorMsg);
                }

                showFormMessage(contactMessage, 'Thank you! Your message has been sent successfully.', 'success');
                contactForm.reset();

            } catch (error) {
                console.error('Contact error:', error);
                let displayMsg = error.message;
                if (displayMsg.includes('Failed to fetch') || displayMsg.includes('NetworkError') || displayMsg.includes('Unexpected token')) {
                    displayMsg = 'Cannot connect to server. Please make sure server.js is running on http://localhost:3000';
                }
                showFormMessage(contactMessage, displayMsg, 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Send Message';
                }
            }
        });
    }

    // Helper: Show alert feedback box
    function showFormMessage(element, text, type) {
        if (!element) return;
        element.style.display = 'block';
        element.className = type === 'success' ? 'alert alert-success' : 'alert alert-error';
        element.textContent = text;
    }
});
