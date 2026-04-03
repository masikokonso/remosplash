//(function(){const d='remotask-web.vercel.app',c=window.location.hostname;if(c!==d){window.location.replace('https://'+d+window.location.pathname+window.location.search+window.location.hash);throw new Error('Unauthorized');}setInterval(()=>{if(window.location.hostname!==d)window.location.replace('https://'+d+window.location.pathname);},5000);})();
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
const ANIMATION_DURATION = 3750; // 15000 → 3750ms (1/4)

// ================== INITIALIZATION ==================
document.addEventListener('DOMContentLoaded', () => {
    checkNotificationClick();
    startAnimationSequence();
});

// ================== ANIMATION SEQUENCE ==================
async function startAnimationSequence() {
    // Phase 1: Flash effect
    await flashEffect();
    await sleep(50);           // 200 → 50

    // Phase 2: Icon glow appears
    await showIconGlow();
    await sleep(75);           // 300 → 75

    // Phase 3: Icon container appears
    await showIconOuter();
    await sleep(225);          // 900 → 225

    // Phase 4: Inner icon fills container smoothly
    await fillIconAnimation();
    await sleep(300);          // 1200 → 300

    // Phase 5: Icon bounce
    await bounceIcon();
    await sleep(150);          // 600 → 150

    // Phase 6: Type REMO-TASK at top
    await typeAppName();
    await sleep(500);          // 2000 → 500

    // Phase 7: Tagline slides up
    await showTagline();
    await sleep(500);          // 2000 → 500

    // Phase 8: Show slogan and type
    await typeSlogan();
    await sleep(625);          // 2500 → 625

    // Phase 9: Show loading and version
    await sleep(375);          // 1500 → 375
    await showLoadingAndVersion();

    // Wait for remaining time then navigate
    await sleep(1750);         // 7000 → 1750

    state.animationComplete = true;
    navigateToNextScreen();
}

// ================== PHASE 1: FLASH EFFECT ==================
function flashEffect() {
    return new Promise(resolve => {
        const flash = document.getElementById('flash');
        flash.style.opacity = '1';

        setTimeout(() => {
            flash.style.transition = 'opacity 50ms ease'; // 200 → 50
            flash.style.opacity = '0';
        }, 25);                                           // 100 → 25

        setTimeout(resolve, 75);                          // 300 → 75
    });
}

// ================== PHASE 2: ICON GLOW ==================
function showIconGlow() {
    return new Promise(resolve => {
        const glow = document.getElementById('iconGlow');
        glow.style.transition = 'all 150ms ease-out'; // 600 → 150
        glow.style.transform = 'translate(-50%, -50%) scale(1)';
        glow.style.opacity = '1';

        setTimeout(resolve, 150);                      // 600 → 150
    });
}

// ================== PHASE 3: ICON OUTER ==================
function showIconOuter() {
    return new Promise(resolve => {
        const outer = document.getElementById('iconOuter');
        outer.style.transition = 'all 225ms cubic-bezier(0.34, 1.56, 0.64, 1)'; // 900 → 225
        outer.style.transform = 'scale(1)';
        outer.style.opacity = '1';

        setTimeout(resolve, 225);                       // 900 → 225
    });
}

// ================== PHASE 4: FILL ICON ANIMATION ==================
function fillIconAnimation() {
    return new Promise(resolve => {
        const inner = document.getElementById('iconInner');
        const emoji = document.getElementById('iconEmoji');

        const startSize = 30;
        const endSize = 80;
        const steps = 20;
        const delay = 300 / steps; // 1200 → 300; 15ms per step

        let currentStep = 0;

        const interval = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;

            const currentSize = startSize + ((endSize - startSize) * progress);
            inner.style.width = `${currentSize}px`;
            inner.style.height = `${currentSize}px`;

            const emojiSize = 18 + (32 * progress);
            emoji.style.fontSize = `${emojiSize}px`;

            if (currentStep >= steps) {
                clearInterval(interval);
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

        outer.style.transition = 'all 75ms ease-out'; // 300 → 75
        outer.style.transform = 'scale(1.08)';

        setTimeout(() => {
            outer.style.transition = 'all 75ms ease-in-out'; // 300 → 75
            outer.style.transform = 'scale(1)';
            setTimeout(resolve, 75);                          // 300 → 75
        }, 75);                                               // 300 → 75
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
        }, 50); // 200 → 50ms per character
    });
}

// ================== PHASE 7: SHOW TAGLINE ==================
function showTagline() {
    return new Promise(resolve => {
        const tagline = document.getElementById('tagline');
        tagline.style.transition = 'all 150ms ease-out'; // 600 → 150
        tagline.style.opacity = '1';
        tagline.style.transform = 'translateY(0)';

        setTimeout(resolve, 150);                         // 600 → 150
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
        }, 25); // 100 → 25ms per character
    });
}

// ================== PHASE 9: SHOW LOADING AND VERSION ==================
function showLoadingAndVersion() {
    return new Promise(resolve => {
        const loading = document.getElementById('loading');
        const version = document.getElementById('version');

        loading.style.transition = 'opacity 100ms ease'; // 400 → 100
        loading.style.opacity = '1';

        version.style.transition = 'all 100ms ease-out'; // 400 → 100
        version.style.opacity = '1';
        version.style.transform = 'translateX(-50%) translateY(-10px)';

        setTimeout(() => {
            version.style.transform = 'translateX(-50%) translateY(0)';
            setTimeout(resolve, 100);                     // 400 → 100
        }, 25);                                           // 100 → 25
    });
}

// ================== NAVIGATION LOGIC ==================
function navigateToNextScreen() {
    const hasSignup = localStorage.getItem('signuplist');
    const hasBonusClaimed = localStorage.getItem('bonus_claimed');
    const hasBoughtAccount = localStorage.getItem('boughtaccount');

    if (hasSignup && hasBonusClaimed && hasBoughtAccount) {
        console.log('Navigating to Dashboard...');
        window.location.href = 'dashboard.html';
        showNavigationMessage('Opening Dashboard...');
    } else if (hasSignup && hasBonusClaimed && !hasBoughtAccount) {
        console.log('Navigating to Buy Account Page...');
        window.location.href = 'account-purchase.html';
        showNavigationMessage('Opening Account Purchase...');
    } else if (hasSignup && !hasBonusClaimed) {
        console.log('Navigating to AI Onboarding...');
        window.location.href = 'onboarding-quiz.html';
        showNavigationMessage('Opening Onboarding...');
    } else {
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
    const urlParams = new URLSearchParams(window.location.search);
    const notificationTag = urlParams.get('notification');

    if (notificationTag) {
        if (notificationTag === 'buy') {
            setTimeout(() => {
                showBuyAccountPopup();
            }, 2000);                // 8000 → 2000
        } else if (notificationTag === 'activate') {
            const hasBoughtAccount = localStorage.getItem('boughtaccount');

            setTimeout(() => {
                if (hasBoughtAccount) {
                    console.log('Navigating to Activate Account...');
                    window.location.href = 'activate-account.html';
                    showNavigationMessage('Opening Activation...');
                } else {
                    showBuyAccountPopup();
                }
            }, 2000);                // 8000 → 2000
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
    window.location.href = 'account-purchase.html';
    closeBuyAccountPopup();
}

function handleLater() {
    closeBuyAccountPopup();
}

// ================== UTILITY FUNCTIONS ==================
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ================== TESTING UTILITIES ==================
function skipAnimations() {
    if (state.appNameTimer) clearInterval(state.appNameTimer);
    if (state.sloganTimer) clearInterval(state.sloganTimer);

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

    setTimeout(navigateToNextScreen, 1000);
}

function testPopup() {
    showBuyAccountPopup();
}

function simulateNotification(tag) {
    const url = new URL(window.location);
    url.searchParams.set('notification', tag);
    window.location.href = url.toString();
}

//function resetUserData() {
//    localStorage.removeItem('signuplist');
//    localStorage.removeItem('bonus_claimed');
//    localStorage.removeItem('boughtaccount');
//    localStorage.removeItem('earnings');
//    console.log('User data reset');
//    window.location.reload();
//}

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

window.splashUtils = {
    skipAnimations: skipAnimations,
    testPopup: testPopup,
    simulateNotification: simulateNotification,
    //resetUserData: resetUserData,
    setUserStatus: setUserStatus,
    showBuyAccountPopup: showBuyAccountPopup,
    closeBuyAccountPopup: closeBuyAccountPopup
};