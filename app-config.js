// ================== APP CONFIG ==================
// Central configuration file for REMO-TASK
// Update the APP_DOMAIN here to change the redirect across all pages

const APP_CONFIG = {
    domain: 'remotask-web.vercel.app',
    protocol: 'https',

    // Full base URL (auto-built from above)
    get baseUrl() {
        return `${this.protocol}://${this.domain}`;
    },

    // Build a full URL with optional path
    url(path = '') {
        return `${this.baseUrl}${path}`;
    }
};

// ================== DOMAIN PROTECTION ==================
// Call this on any page to enforce domain redirect
function enforceAppDomain() {
    const currentHost = window.location.hostname;

    if (currentHost !== APP_CONFIG.domain) {
        const redirectUrl = APP_CONFIG.baseUrl
            + window.location.pathname
            + window.location.search
            + window.location.hash;

        window.location.replace(redirectUrl);
        throw new Error('Unauthorized domain. Redirecting...');
    }

    // Ongoing check every 5 seconds
    setInterval(() => {
        if (window.location.hostname !== APP_CONFIG.domain) {
            window.location.replace(
                APP_CONFIG.baseUrl + window.location.pathname
            );
        }
    }, 5000);
}

// ================== PAGE NAVIGATION HELPERS ==================
// Use these functions to navigate between pages from anywhere
const AppNav = {
    goTo(page) {
        window.location.href = APP_CONFIG.url('/' + page);
    },
    welcome()          { this.goTo('welcome.html'); },
    signup()           { this.goTo('signup.html'); },
    login()            { this.goTo('login.html'); },
    onboarding()       { this.goTo('onboarding-quiz.html'); },
    accountPurchase()  { this.goTo('account-purchase.html'); },
    importantInfo()    { this.goTo('important-info.html'); },
    dashboard()        { this.goTo('dashboard.html'); },
};

// Expose globally
window.APP_CONFIG = APP_CONFIG;
window.AppNav = AppNav;
window.enforceAppDomain = enforceAppDomain;
