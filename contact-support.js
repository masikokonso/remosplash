// ================== STATE MANAGEMENT ==================
const state = {
    supportEmail: 'taskrewards.help@gmail.com'
};

// ================== INITIALIZATION ==================
document.addEventListener('DOMContentLoaded', () => {
    setupFormHandler();
    loadUserEmail();
});

// ================== FORM HANDLING ==================
function setupFormHandler() {
    const form = document.getElementById('contactForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSubmit();
    });
}

function loadUserEmail() {
    // Try to load user's email from signup data
    const signupData = localStorage.getItem('signuplist');
    if (signupData) {
        try {
            const userData = JSON.parse(signupData);
            if (userData.length >= 3) {
                const userEmail = userData[2]; // Email at index 2
                document.getElementById('email').value = userEmail;
            }
        } catch (error) {
            console.error('Error loading user email:', error);
        }
    }
}

function handleSubmit() {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const message = document.getElementById('message').value.trim();
    
    // Validate all fields
    if (!name) {
        showToast('Please enter your name');
        return;
    }
    
    if (!email) {
        showToast('Please enter your email');
        return;
    }
    
    if (!validateEmail(email)) {
        showToast('Please enter a valid email address');
        return;
    }
    
    if (!subject) {
        showToast('Please enter a subject');
        return;
    }
    
    if (!message) {
        showToast('Please enter your message');
        return;
    }
    
    // Send email
    sendSupportEmail(name, email, subject, message);
}

function sendSupportEmail(name, email, subject, message) {
    try {
        // Build email body
        const body = `Name: ${name}

Email: ${email}

Message:
${message}

---
Sent from Remo-Task Support`;
        
        // Create mailto link
        const mailtoLink = `mailto:${state.supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        // Open email client
        window.location.href = mailtoLink;
        
        showToast('Opening email app...');
        
        // Clear form after a delay
        setTimeout(() => {
            clearForm();
        }, 1000);
        
    } catch (error) {
        console.error('Error opening email app:', error);
        showToast('Error opening email app. Please try the direct email button.');
    }
}

function openEmailApp() {
    try {
        // Simple mailto link for direct email
        const subject = 'Support Request from Remo-Task';
        const mailtoLink = `mailto:${state.supportEmail}?subject=${encodeURIComponent(subject)}`;
        
        window.location.href = mailtoLink;
        showToast('Opening email app...');
        
    } catch (error) {
        console.error('Error opening email app:', error);
        showToast('Please use an email app to contact: ' + state.supportEmail);
    }
}

function copyEmailToClipboard() {
    // Create temporary input
    const tempInput = document.createElement('input');
    tempInput.value = state.supportEmail;
    document.body.appendChild(tempInput);
    
    // Select and copy
    tempInput.select();
    tempInput.setSelectionRange(0, 99999); // For mobile devices
    
    try {
        document.execCommand('copy');
        showToast('Email address copied to clipboard!');
    } catch (error) {
        showToast('Failed to copy email address');
    }
    
    // Remove temporary input
    document.body.removeChild(tempInput);
}

// ================== VALIDATION ==================
function validateEmail(email) {
    if (!email.includes('@') || !email.includes('.')) {
        return false;
    }
    
    const atIndex = email.indexOf('@');
    const dotIndex = email.lastIndexOf('.');
    
    if (atIndex > 0 && dotIndex > atIndex + 1 && dotIndex < email.length - 1) {
        return true;
    }
    
    return false;
}

// ================== FORM MANAGEMENT ==================
function clearForm() {
    document.getElementById('name').value = '';
    document.getElementById('subject').value = '';
    document.getElementById('message').value = '';
    
    // Keep the email field if it was loaded from user data
    const signupData = localStorage.getItem('signuplist');
    if (!signupData) {
        document.getElementById('email').value = '';
    }
}

// ================== NAVIGATION ==================
function goBack() {
    // Check if there's a history to go back to
    if (window.history.length > 1) {
        window.history.back();
    } else {
        // If no history, navigate to dashboard/home
        console.log('Navigating to home...');
         window.location.href = 'dashboard.html';
        showToast('Returning to home...');
    }
}

// ================== TOAST NOTIFICATION ==================
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// ================== UTILITY FUNCTIONS ==================
// Function to pre-fill form with test data
function fillTestData() {
    document.getElementById('name').value = 'John Doe';
    document.getElementById('email').value = 'john.doe@example.com';
    document.getElementById('subject').value = 'Question about withdrawals';
    document.getElementById('message').value = 'I have a question about the withdrawal process. How long does it typically take for payments to be processed?';
    console.log('Test data filled');
}

// Function to get form data
function getFormData() {
    return {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        subject: document.getElementById('subject').value.trim(),
        message: document.getElementById('message').value.trim()
    };
}

// Function to check if form is filled
function isFormFilled() {
    const data = getFormData();
    return data.name && data.email && data.subject && data.message;
}

// Expose utility functions globally for testing
window.contactUtils = {
    fillTestData: fillTestData,
    getFormData: getFormData,
    isFormFilled: isFormFilled,
    clearForm: clearForm,
    copyEmailToClipboard: copyEmailToClipboard,
    openEmailApp: openEmailApp
};
