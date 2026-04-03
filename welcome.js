// ================== STATE MANAGEMENT ==================
const state = {
    termsAccepted: false
};

// ================== INITIALIZATION ==================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize button state
    updateSignUpButton();
});

// ================== TERMS & CONDITIONS ==================
function handleTermsChange() {
    const checkbox = document.getElementById('termsCheckbox');
    state.termsAccepted = checkbox.checked;
    
    updateSignUpButton();
    
    if (checkbox.checked) {
        // Show brief confirmation
        showToast('✓ Terms accepted');
    }
}

function updateSignUpButton() {
    const signUpBtn = document.getElementById('signUpBtn');
    
    if (state.termsAccepted) {
        signUpBtn.disabled = false;
        signUpBtn.style.opacity = '1';
    } else {
        signUpBtn.disabled = true;
        signUpBtn.style.opacity = '0.4';
    }
}

// ================== NAVIGATION HANDLERS ==================
function handleSignUp() {
    if (!state.termsAccepted) {
       // alert('Please accept Terms & Conditions first');
        return;
    }
    
    // Show loading
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        
        // Check test data
        checkTestData();
        
        // Navigate to sign up page
        console.log('Navigating to sign-up page...');
        // In real app: window.location.href = 'signup.html';
        
        // For demo, show message
        showToast('Redirecting to Sign Up...');
        setTimeout(() => {
            // Uncomment in real app:
            window.location.href = 'signup.html';
        }, 1000);
    }, 1000);
}

function handleSignIn() {
    // Show loading
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        
        // Check test data
        checkTestData();
        
        // Navigate to login page
        console.log('Navigating to login page...');
        // In real app: window.location.href = 'login.html';
        
        // For demo, show message
        showToast('Redirecting to Sign In...');
        setTimeout(() => {
            // Uncomment in real app:
            // window.location.href = 'login.html';
        }, 1000);
    }, 1000);
}

function showPrivacyInfo() {
    //alert('Privacy Policy & Terms coming soon');
}

// ================== TEST DATA HANDLING ==================
function checkTestData() {
    try {
        const tillfetch = localStorage.getItem('tillfetch');
        if (tillfetch) {
            const data = JSON.parse(tillfetch);
            const liveornot = data[6]; // Index 6 contains live/test mode flag
            
            if (liveornot === 'tomo') {
                // Test mode - set activation flags
                localStorage.setItem('activated', JSON.stringify(['active']));
                localStorage.setItem('tomo', JSON.stringify(['tomo']));
                
                console.log('Test mode activated');
            }
        }
    } catch (error) {
        console.error('Error checking test data:', error);
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
    // Create toast element
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(30, 41, 59, 0.95);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 10000;
        animation: slideUp 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    toast.textContent = message;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateX(-50%) translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(toast);
    
    // Remove after 2 seconds
    setTimeout(() => {
        toast.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => {
            toast.remove();
            style.remove();
        }, 300);
    }, 2000);
}

// ================== UTILITY FUNCTIONS ==================
// Function to set test mode (for testing)
function setTestMode() {
    const sampleData = [
        'value0', 'value1', '2.40', '4.50', '6.50',
        'value5',
        'tomo', // Index 6 - test mode flag
        '5.00'  // Index 7 - minimum withdraw
    ];
    localStorage.setItem('tillfetch', JSON.stringify(sampleData));
    console.log('Test mode enabled');
}

// Function to clear test mode
function clearTestMode() {
    localStorage.removeItem('tillfetch');
    localStorage.removeItem('activated');
    localStorage.removeItem('tomo');
    console.log('Test mode cleared');
}

// Function to check if user has accepted terms
function hasAcceptedTerms() {
    return state.termsAccepted;
}

// Expose utility functions globally for testing
window.welcomeUtils = {
    setTestMode: setTestMode,
    clearTestMode: clearTestMode,
    hasAcceptedTerms: hasAcceptedTerms,
    showToast: showToast
};
