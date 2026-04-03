// ================== STATE MANAGEMENT ==================
const state = {
    email: '',
    newPassword: '',
    confirmPassword: ''
};

// ================== INITIALIZATION ==================
document.addEventListener('DOMContentLoaded', () => {
    setupFormHandler();
});

// ================== FORM HANDLING ==================
function setupFormHandler() {
    const form = document.getElementById('resetForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        handlePasswordReset();
    });
}

function handlePasswordReset() {
    const emailInput = document.getElementById('email');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    const email = emailInput.value.trim();
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    // Clear previous error states
    clearErrorStates();
    
    // Validate email
    if (!email) {
        showToast('Please enter your email address');
        emailInput.classList.add('error');
        return;
    }
    
    if (!validateEmail(email)) {
        showToast('Please enter a valid email address');
        emailInput.classList.add('error');
        return;
    }
    
    // Validate new password
    if (newPassword.length < 4) {
        showToast('Password must be at least 4 characters long');
        newPasswordInput.classList.add('error');
        return;
    }
    
    // Validate password match
    if (newPassword !== confirmPassword) {
        showToast('Passwords do not match');
        newPasswordInput.classList.add('error');
        confirmPasswordInput.classList.add('error');
        return;
    }
    
    // Process password reset
    processPasswordReset(email, newPassword);
}

function processPasswordReset(email, newPassword) {
    showLoading();
    
    setTimeout(() => {
        // Update local data if user exists
        const updated = updateLocalPassword(email, newPassword);
        
        hideLoading();
        
        // Show success message
        showToast('✓ Password reset successful!', true);
        
        // Clear form
        clearForm();
        
        // Wait a moment then navigate back
        setTimeout(() => {
            goBackToLogin();
        }, 1000);
        
    }, 1500);
}

function updateLocalPassword(email, newPassword) {
    const signupData = localStorage.getItem('signuplist');
    
    if (signupData) {
        try {
            const userData = JSON.parse(signupData);
            
            // Check if email matches (index 2 in signuplist)
            if (userData.length >= 5 && userData[2] === email) {
                // Update password (index 4 in signuplist)
                userData[4] = newPassword;
                
                // Save updated data
                localStorage.setItem('signuplist', JSON.stringify(userData));
                
                console.log(`Local password updated for: ${email}`);
                return true;
            } else {
                console.log('Email not found in local data');
                return false;
            }
        } catch (error) {
            console.error('Error updating password:', error);
            return false;
        }
    }
    
    console.log('No local signup data found');
    return false;
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

function clearErrorStates() {
    const inputs = document.querySelectorAll('.form-input');
    inputs.forEach(input => {
        input.classList.remove('error');
    });
}

// ================== FORM MANAGEMENT ==================
function clearForm() {
    document.getElementById('email').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    clearErrorStates();
}

// ================== NAVIGATION ==================
function goBackToLogin() {
    // Check if there's a history to go back to
    if (window.history.length > 1) {
        window.history.back();
    } else {
        // If no history, navigate to login page
        console.log('Navigating to login...');
        // In real app: window.location.href = 'login.html';
        showToast('Returning to login...');
    }
}

// ================== UI HELPERS ==================
function showLoading() {
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

function showToast(message, isSuccess = false) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    
    if (isSuccess) {
        toast.classList.add('success');
    } else {
        toast.classList.remove('success');
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.classList.remove('success');
        }, 300);
    }, 2500);
}

// ================== UTILITY FUNCTIONS ==================
// Function to check if user exists
function userExists(email) {
    const signupData = localStorage.getItem('signuplist');
    
    if (signupData) {
        try {
            const userData = JSON.parse(signupData);
            return userData.length >= 3 && userData[2] === email;
        } catch (error) {
            return false;
        }
    }
    
    return false;
}

// Function to get user data
function getUserData() {
    const signupData = localStorage.getItem('signuplist');
    
    if (signupData) {
        try {
            const userData = JSON.parse(signupData);
            if (userData.length >= 5) {
                return {
                    name: userData[0],
                    phone: userData[1],
                    email: userData[2],
                    country: userData[3],
                    password: userData[4]
                };
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }
    
    return null;
}

// Function to simulate password reset for testing
function simulatePasswordReset(email, password) {
    document.getElementById('email').value = email;
    document.getElementById('newPassword').value = password;
    document.getElementById('confirmPassword').value = password;
    console.log('Test data filled');
}

// Expose utility functions globally for testing
window.resetPasswordUtils = {
    userExists: userExists,
    getUserData: getUserData,
    simulatePasswordReset: simulatePasswordReset,
    clearForm: clearForm,
    validateEmail: validateEmail
};
