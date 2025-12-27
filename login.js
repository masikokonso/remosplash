// ================== STATE MANAGEMENT ==================
const state = {
    rememberMe: false
};

// ================== INITIALIZATION ==================
document.addEventListener('DOMContentLoaded', () => {
    // Check if user should be remembered
    checkRememberedUser();
    
    // Add enter key listener for password field
    document.getElementById('password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSignIn();
        }
    });
});

// ================== AUTHENTICATION ==================
async function handleSignIn() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const rememberCheckbox = document.getElementById('rememberMe');
    
    // Validate email
    if (!email || !email.includes('@')) {
        showToast('Please enter a valid email address');
        return;
    }
    
    // Validate password
    if (!password) {
        showToast('Please enter your password');
        return;
    }
    
    // Show loading
    showLoading();
    
    // Simulate authentication delay (3 seconds like B4A)
    await sleep(3000);
    
    // Hide loading
    hideLoading();
    
    // Store remember me preference
    state.rememberMe = rememberCheckbox.checked;
    if (state.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('rememberedEmail', email);
    } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('rememberedEmail');
    }
    
    // Check test credentials or tomo mode
    const tomoData = localStorage.getItem('tomo');
    const isTestCredentials = email === 'remotest@gmail.com' && password === '123456';
    
    if (tomoData || isTestCredentials) {
        // Test mode authentication
        handleTestModeAuth();
        return;
    }
    
    // Check for registered user
    const signupData = localStorage.getItem('signuplist');
    if (signupData) {
        const userData = JSON.parse(signupData);
        const registeredEmail = userData[2]; // Index 2 is email
        const registeredPassword = userData[4]; // Index 4 is password
        
        if (email === registeredEmail && password === registeredPassword) {
            // Correct credentials - route based on user status
            routeUserBasedOnStatus();
        } else {
            showToast('Please enter correct login details');
        }
    } else {
        showToast('No account found. Please sign up first.');
    }
}

function handleTestModeAuth() {
    // Check for tillfetch data
    const tillfetch = localStorage.getItem('tillfetch');
    if (tillfetch) {
        const data = JSON.parse(tillfetch);
        const liveornot = data[6];
        
        if (liveornot === 'tomo') {
            localStorage.setItem('activated', JSON.stringify(['active']));
            localStorage.setItem('tomo', JSON.stringify(['tomo']));
        }
    }
    
    // Navigate to PointsToNote (important info)
    console.log('Test mode: Navigating to Important Information...');
    showToast('Logging in (Test Mode)...');
    
    setTimeout(() => {
         window.location.href = 'important-info.html';
        console.log('Redirect to: important-info.html');
    }, 1000);
}

function routeUserBasedOnStatus() {
    const hasSignup = localStorage.getItem('signuplist');
    const hasBonusClaimed = localStorage.getItem('bonus_claimed');
    const hasBoughtAccount = localStorage.getItem('boughtaccount');
    
    console.log('User Status:', {
        hasSignup: !!hasSignup,
        hasBonusClaimed: !!hasBonusClaimed,
        hasBoughtAccount: !!hasBoughtAccount
    });
    
    if (hasSignup && hasBonusClaimed && hasBoughtAccount) {
        // Fully onboarded user - go to Dashboard
        console.log('Navigating to Dashboard...');
        showToast('Welcome back! Loading dashboard...');
        setTimeout(() => {
             window.location.href = 'dashboard.html';
            console.log('Redirect to: dashboard.html');
        }, 1000);
        
    } else if (hasSignup && hasBonusClaimed && !hasBoughtAccount) {
        // Completed quiz but hasn't bought account
        console.log('Navigating to Account Purchase Page...');
        showToast('Please complete account purchase...');
        setTimeout(() => {
             window.location.href = 'account-purchase.html';
            console.log('Redirect to: account-purchase.html');
        }, 1000);
        
    } else if (hasSignup && !hasBonusClaimed) {
        // Registered but hasn't completed quiz
        console.log('Navigating to AI Onboarding (Quiz)...');
        showToast('Please complete onboarding quiz...');
        setTimeout(() => {
             window.location.href = 'onboarding-quiz.html';
            console.log('Redirect to: onboarding-quiz.html');
        }, 1000);
        
    } else {
        // Shouldn't reach here, but redirect to signup
        console.log('Invalid state - redirecting to signup...');
        showToast('Please complete registration');
        setTimeout(() => {
            handleSignUp();
        }, 1000);
    }
}

// ================== FORGOT PASSWORD ==================
function handleForgotPassword() {
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        console.log('Navigating to password reset...');
        showToast('Redirecting to password reset...');
        
         window.location.href = 'reset-password.html';
        setTimeout(() => {
            console.log('Redirect to: password-reset.html');
        }, 1000);
    }, 1500);
}

// ================== SIGN UP NAVIGATION ==================
function handleSignUp() {
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        console.log('Navigating to signup...');
        showToast('Redirecting to signup page...');
        
         window.location.href = 'signup.html';
        setTimeout(() => {
            console.log('Redirect to: signup.html');
        }, 1000);
    }, 1500);
}

// ================== REMEMBER ME ==================
function checkRememberedUser() {
    const rememberMe = localStorage.getItem('rememberMe');
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    
    if (rememberMe === 'true' && rememberedEmail) {
        document.getElementById('email').value = rememberedEmail;
        document.getElementById('rememberMe').checked = true;
        state.rememberMe = true;
    }
}

// ================== LOADING OVERLAY ==================
function showLoading() {
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
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
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to set test credentials
function setTestCredentials() {
    document.getElementById('email').value = 'remotest@gmail.com';
    document.getElementById('password').value = '123456';
    console.log('Test credentials set');
}

// Function to set user credentials from signup
function setUserCredentials() {
    const signupData = localStorage.getItem('signuplist');
    if (signupData) {
        const userData = JSON.parse(signupData);
        document.getElementById('email').value = userData[2]; // Email at index 2
        console.log('User email set from signup data');
    } else {
        console.log('No signup data found');
    }
}

// Function to simulate full user progression
function simulateFullUser() {
    // Simulate a user who has completed everything
    const sampleData = ['John Doe', '0712345678', 'user@example.com', 'Kenya', 'password123'];
    localStorage.setItem('signuplist', JSON.stringify(sampleData));
    localStorage.setItem('bonus_claimed', 'true');
    localStorage.setItem('boughtaccount', JSON.stringify(['boughtaccount']));
    console.log('Full user simulation created - should go to dashboard');
}

// Function to simulate quiz-only user
function simulateQuizUser() {
    // Simulate a user who completed quiz but not account purchase
    const sampleData = ['Jane Doe', '0723456789', 'jane@example.com', 'Kenya', 'pass456'];
    localStorage.setItem('signuplist', JSON.stringify(sampleData));
    localStorage.setItem('bonus_claimed', 'true');
    localStorage.removeItem('boughtaccount');
    console.log('Quiz-only user simulation created - should go to account purchase');
}

// Function to simulate new signup user
function simulateNewUser() {
    // Simulate a user who just signed up
    const sampleData = ['Bob Smith', '0734567890', 'bob@example.com', 'Kenya', 'pass789'];
    localStorage.setItem('signuplist', JSON.stringify(sampleData));
    localStorage.removeItem('bonus_claimed');
    localStorage.removeItem('boughtaccount');
    console.log('New user simulation created - should go to quiz');
}

// Function to clear all user data
function clearUserData() {
    localStorage.removeItem('signuplist');
    localStorage.removeItem('bonus_claimed');
    localStorage.removeItem('boughtaccount');
    localStorage.removeItem('tomo');
    localStorage.removeItem('activated');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('rememberedEmail');
    console.log('All user data cleared');
}

// Function to enable test mode
function enableTestMode() {
    const sampleData = [
        'value0', 'value1', '2.40', '4.50', '6.50',
        'value5',
        'tomo', // Index 6 - test mode flag
        '5.00'  // Index 7 - minimum withdraw
    ];
    localStorage.setItem('tillfetch', JSON.stringify(sampleData));
    localStorage.setItem('tomo', JSON.stringify(['tomo']));
    console.log('Test mode enabled - use remotest@gmail.com / 123456');
}

// Function to check user status
function checkUserStatus() {
    const status = {
        hasSignup: !!localStorage.getItem('signuplist'),
        hasBonusClaimed: !!localStorage.getItem('bonus_claimed'),
        hasBoughtAccount: !!localStorage.getItem('boughtaccount'),
        isTestMode: !!localStorage.getItem('tomo')
    };
    
    console.log('Current User Status:', status);
    
    if (status.hasSignup) {
        const userData = JSON.parse(localStorage.getItem('signuplist'));
        console.log('User Email:', userData[2]);
        console.log('User Password:', userData[4]);
    }
    
    return status;
}

// Expose utility functions globally for testing
window.loginUtils = {
    setTestCredentials: setTestCredentials,
    setUserCredentials: setUserCredentials,
    simulateFullUser: simulateFullUser,
    simulateQuizUser: simulateQuizUser,
    simulateNewUser: simulateNewUser,
    clearUserData: clearUserData,
    enableTestMode: enableTestMode,
    checkUserStatus: checkUserStatus
};
