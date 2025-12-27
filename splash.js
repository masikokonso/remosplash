// ================== STATE MANAGEMENT ==================
const state = {
    appNamePosition: 0,
    sloganPosition: 0,
    appNameTimer: null,
    sloganTimer: null,
    animationComplete: false
};

// ================== CONSTANTS ==================
const APP_NAME = "REMO-TASK";
const SLOGAN = "Get Paid to Work Anywhere, Anytime!";
const ANIMATION_DURATION = 15000; // 15 seconds

// ================== INITIALIZATION ==================
document.addEventListener('DOMContentLoaded', () => {
    checkNotificationClick();
    startAnimationSequence();
});

// ================== ANIMATION SEQUENCE ==================
async function startAnimationSequence() {
    // Phase 1: Flash effect (0-300ms)
    await flashEffect();
    await sleep(200);
    
    // Phase 2: Icon glow appears (300-900ms)
    await showIconGlow();
    await sleep(300);
    
    // Phase 3: Icon container appears (600-1500ms)
    await showIconOuter();
    await sleep(900);
    
    // Phase 4: Inner icon fills container smoothly (1500-2700ms)
    await fillIconAnimation();
    await sleep(1200);
    
    // Phase 5: Icon bounce (2700-3300ms)
    await bounceIcon();
    await sleep(600);
    
    // Phase 6: Type REMO-TASK at top (3300-4800ms)
    await typeAppName();
    await sleep(2000);
    
    // Phase 7: Tagline slides up (4800-5400ms)
    await showTagline();
    await sleep(2000);
    
    // Phase 8: Show slogan and type (5400-7900ms)
    await typeSlogan();
    await sleep(2500);
    
    // Phase 9: Show loading and version (7900-8000ms)
    await sleep(1500);
    await showLoadingAndVersion();
    
    // Wait for remaining time then navigate (8000-15000ms)
    await sleep(7000);
    
    state.animationComplete = true;
    navigateToNextScreen();
}

// ================== PHASE 1: FLASH EFFECT ==================
function flashEffect() {
    return new Promise(resolve => {
        const flash = document.getElementById('flash');
        flash.style.opacity = '1';
        
        setTimeout(() => {
            flash.style.transition = 'opacity 200ms ease';
            flash.style.opacity = '0';
        }, 100);
        
        setTimeout(resolve, 300);
    });
}

// ================== PHASE 2: ICON GLOW ==================
function showIconGlow() {
    return new Promise(resolve => {
        const glow = document.getElementById('iconGlow');
        glow.style.transition = 'all 600ms ease-out';
        glow.style.transform = 'translate(-50%, -50%) scale(1)';
        glow.style.opacity = '1';
        
        setTimeout(resolve, 600);
    });
}

// ================== PHASE 3: ICON OUTER ==================
function showIconOuter() {
    return new Promise(resolve => {
        const outer = document.getElementById('iconOuter');
        outer.style.transition = 'all 900ms cubic-bezier(0.34, 1.56, 0.64, 1)';
        outer.style.transform = 'scale(1)';
        outer.style.opacity = '1';
        
        setTimeout(resolve, 900);
    });
}

// ================== PHASE 4: FILL ICON ANIMATION ==================
function fillIconAnimation() {
    return new Promise(resolve => {
        const inner = document.getElementById('iconInner');
        const emoji = document.getElementById('iconEmoji');
        
        const startSize = 30; // 30px
        const endSize = 80; // 80px
        const steps = 20;
        const delay = 1200 / steps; // 60ms per step
        
        let currentStep = 0;
        
        const interval = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;
            
            // Calculate current size
            const currentSize = startSize + ((endSize - startSize) * progress);
            
            // Update inner icon size
            inner.style.width = `${currentSize}px`;
            inner.style.height = `${currentSize}px`;
            
            // Update emoji size
            const emojiSize = 18 + (32 * progress); // 18px to 50px
            emoji.style.fontSize = `${emojiSize}px`;
            
            if (currentStep >= steps) {
                clearInterval(interval);
                
                // Ensure final size
                inner.style.width = '80px';
                inner.style.height = '80px';
                emoji.style.fontSize = '50px';
                
                resolve();
            }
        }, delay);
    });
}

// ================== PHASE 5: BOUNCE ANIMATION ==================
function bounceIcon() {
    return new Promise(resolve => {
        const outer = document.getElementById('iconOuter');
        
        // Scale up
        outer.style.transition = 'all 300ms ease-out';
        outer.style.transform = 'scale(1.08)';
        
        setTimeout(() => {
            // Scale back
            outer.style.transition = 'all 300ms ease-in-out';
            outer.style.transform = 'scale(1)';
            
            setTimeout(resolve, 300);
        }, 300);
    });
}

// ================== PHASE 6: TYPE APP NAME ==================
function typeAppName() {
    return new Promise(resolve => {
        const appNameEl = document.getElementById('appName');
        appNameEl.style.opacity = '1';
        
        state.appNamePosition = 0;
        
        state.appNameTimer = setInterval(() => {
            if (state.appNamePosition <= APP_NAME.length) {
                appNameEl.textContent = APP_NAME.substring(0, state.appNamePosition);
                state.appNamePosition++;
            } else {
                clearInterval(state.appNameTimer);
                resolve();
            }
        }, 200); // 200ms per character
    });
}

// ================== PHASE 7: SHOW TAGLINE ==================
function showTagline() {
    return new Promise(resolve => {
        const tagline = document.getElementById('tagline');
        tagline.style.transition = 'all 600ms ease-out';
        tagline.style.opacity = '1';
        tagline.style.transform = 'translateY(0)';
        
        setTimeout(resolve, 600);
    });
}

// ================== PHASE 8: TYPE SLOGAN ==================
function typeSlogan() {
    return new Promise(resolve => {
        const sloganEl = document.getElementById('slogan');
        sloganEl.style.opacity = '1';
        
        state.sloganPosition = 0;
        
        state.sloganTimer = setInterval(() => {
            if (state.sloganPosition <= SLOGAN.length) {
                sloganEl.textContent = SLOGAN.substring(0, state.sloganPosition);
                state.sloganPosition++;
            } else {
                clearInterval(state.sloganTimer);
                resolve();
            }
        }, 100); // 100ms per character
    });
}

// ================== PHASE 9: SHOW LOADING AND VERSION ==================
function showLoadingAndVersion() {
    return new Promise(resolve => {
        const loading = document.getElementById('loading');
        const version = document.getElementById('version');
        
        loading.style.transition = 'opacity 400ms ease';
        loading.style.opacity = '1';
        
        version.style.transition = 'all 400ms ease-out';
        version.style.opacity = '1';
        version.style.transform = 'translateX(-50%) translateY(-10px)';
        
        setTimeout(() => {
            version.style.transform = 'translateX(-50%) translateY(0)';
            setTimeout(resolve, 400);
        }, 100);
    });
}

// ================== NAVIGATION LOGIC ==================
function navigateToNextScreen() {
    // Check registration and onboarding status
    const hasSignup = localStorage.getItem('signuplist');
    const hasBonusClaimed = localStorage.getItem('bonus_claimed');
    const hasBoughtAccount = localStorage.getItem('boughtaccount');
    
    if (hasSignup && hasBonusClaimed && hasBoughtAccount) {
        // User is registered and completed onboarding - go to Dashboard
        console.log('Navigating to Dashboard...');
         window.location.href = 'dashboard.html';
        showNavigationMessage('Opening Dashboard...');
    } else if (hasSignup && hasBonusClaimed && !hasBoughtAccount) {
        // User is registered, completed onboarding, but hasn't bought account
        console.log('Navigating to Buy Account Page...');
         window.location.href = 'account-purchase.html';
        showNavigationMessage('Opening Account Purchase...');
    } else if (hasSignup && !hasBonusClaimed) {
        // User is registered but hasn't completed onboarding
        console.log('Navigating to AI Onboarding...');
         window.location.href = 'onboarding-quiz.html';
        showNavigationMessage('Opening Onboarding...');
    } else {
        // New user - go to HomePage
        console.log('Navigating to Home...');
        window.location.href = 'welcome.html';
        showNavigationMessage('Opening Welcome Page...');
    }
}

function showNavigationMessage(message) {
    const slogan = document.getElementById('slogan');
    slogan.style.transition = 'all 300ms ease';
    slogan.style.color = '#4ade80';
    slogan.textContent = message;
}

// ================== NOTIFICATION HANDLING ==================
function checkNotificationClick() {
    // Check URL parameters for notification tag
    const urlParams = new URLSearchParams(window.location.search);
    const notificationTag = urlParams.get('notification');
    
    if (notificationTag) {
        if (notificationTag === 'buy') {
            // Show buy account popup after animations
            setTimeout(() => {
                showBuyAccountPopup();
            }, 8000);
        } else if (notificationTag === 'activate') {
            // Navigate to activation page
            const hasBoughtAccount = localStorage.getItem('boughtaccount');
            
            setTimeout(() => {
                if (hasBoughtAccount) {
                    console.log('Navigating to Activate Account...');
                     window.location.href = 'activate-account.html';
                    showNavigationMessage('Opening Activation...');
                } else {
                    showBuyAccountPopup();
                }
            }, 8000);
        }
    }
}

// ================== BUY ACCOUNT POPUP ==================
function showBuyAccountPopup() {
    const overlay = document.getElementById('popupOverlay');
    overlay.classList.add('active');
}

function closeBuyAccountPopup() {
    const overlay = document.getElementById('popupOverlay');
    overlay.classList.remove('active');
}

function handleBuyNow() {
    console.log('Opening payment page...');
    //alert('Opening payment page...');
    
    // Navigate to buy account page
     window.location.href = 'account-purchase.html';
    
    closeBuyAccountPopup();
}

function handleLater() {
    //alert('You can activate anytime from Profile');
    closeBuyAccountPopup();
}

// ================== UTILITY FUNCTIONS ==================
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ================== TESTING UTILITIES ==================
// Function to skip animations
function skipAnimations() {
    // Clear any running timers
    if (state.appNameTimer) clearInterval(state.appNameTimer);
    if (state.sloganTimer) clearInterval(state.sloganTimer);
    
    // Set everything to final state
    document.getElementById('iconGlow').style.opacity = '1';
    document.getElementById('iconGlow').style.transform = 'translate(-50%, -50%) scale(1)';
    
    document.getElementById('iconOuter').style.opacity = '1';
    document.getElementById('iconOuter').style.transform = 'scale(1)';
    
    const inner = document.getElementById('iconInner');
    inner.style.width = '80px';
    inner.style.height = '80px';
    
    const emoji = document.getElementById('iconEmoji');
    emoji.style.fontSize = '50px';
    
    document.getElementById('appName').textContent = APP_NAME;
    document.getElementById('appName').style.opacity = '1';
    
    document.getElementById('tagline').style.opacity = '1';
    document.getElementById('tagline').style.transform = 'translateY(0)';
    
    document.getElementById('slogan').textContent = SLOGAN;
    document.getElementById('slogan').style.opacity = '1';
    
    document.getElementById('loading').style.opacity = '1';
    document.getElementById('version').style.opacity = '1';
    
    state.animationComplete = true;
    
    // Navigate immediately
    setTimeout(navigateToNextScreen, 1000);
}

// Function to show popup manually
function testPopup() {
    showBuyAccountPopup();
}

// Function to simulate notification click
function simulateNotification(tag) {
    const url = new URL(window.location);
    url.searchParams.set('notification', tag);
    window.location.href = url.toString();
}

// Function to reset user data
function resetUserData() {
    localStorage.removeItem('signuplist');
    localStorage.removeItem('bonus_claimed');
    localStorage.removeItem('boughtaccount');
    localStorage.removeItem('earnings');
    console.log('User data reset');
    window.location.reload();
}

// Function to set user status
function setUserStatus(status) {
    switch (status) {
        case 'new':
            localStorage.removeItem('signuplist');
            localStorage.removeItem('bonus_claimed');
            localStorage.removeItem('boughtaccount');
            break;
        case 'registered':
            localStorage.setItem('signuplist', JSON.stringify(['John Doe', '+254712345678', 'john@example.com', 'Kenya', 'pass123']));
            localStorage.removeItem('bonus_claimed');
            localStorage.removeItem('boughtaccount');
            break;
        case 'onboarded':
            localStorage.setItem('signuplist', JSON.stringify(['John Doe', '+254712345678', 'john@example.com', 'Kenya', 'pass123']));
            localStorage.setItem('bonus_claimed', JSON.stringify(['claimed']));
            localStorage.removeItem('boughtaccount');
            break;
        case 'complete':
            localStorage.setItem('signuplist', JSON.stringify(['John Doe', '+254712345678', 'john@example.com', 'Kenya', 'pass123']));
            localStorage.setItem('bonus_claimed', JSON.stringify(['claimed']));
            localStorage.setItem('boughtaccount', JSON.stringify(['bought']));
            break;
    }
    console.log(`User status set to: ${status}`);
    window.location.reload();
}

// Expose utilities globally for testing
window.splashUtils = {
    skipAnimations: skipAnimations,
    testPopup: testPopup,
    simulateNotification: simulateNotification,
    resetUserData: resetUserData,
    setUserStatus: setUserStatus,
    showBuyAccountPopup: showBuyAccountPopup,
    closeBuyAccountPopup: closeBuyAccountPopup
};

// Allow clicking anywhere to skip animations (for testing)
// Uncomment if needed:
// document.addEventListener('click', skipAnimations);
