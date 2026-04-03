// ================== STATE MANAGEMENT ==================
const state = {
    totalEarnings: 0,
    badgeLimitAmount: 60,
    transactionTimer: null,
    statsTimer: null,
    countryCodes: ['+254','+1','+44','+91','+234','+27','+61','+86','+81','+33','+49','+39','+34','+55','+52','+20','+92','+880','+62','+63'],
    countryFlags: ['🇰🇪','🇺🇸','🇬🇧','🇮🇳','🇳🇬','🇿🇦','🇦🇺','🇨🇳','🇯🇵','🇫🇷','🇩🇪','🇮🇹','🇪🇸','🇧🇷','🇲🇽','🇪🇬','🇵🇰','🇧🇩','🇮🇩','🇵🇭']
};

// ================== INITIALIZATION ==================
document.addEventListener('DOMContentLoaded', () => {
    loadBadgeLimitFromConfig();
    loadUserData();
    checkBadgeStatus();
    processPaymentDay();
    updateNotificationBell();
    updateDateTime();
    initializeTimers();
    updateTransactionDisplay();
    checkAndShowRatingPopup();
});

// ================== BADGE LIMIT FROM TILLFETCH ==================
function loadBadgeLimitFromConfig() {
    try {
        const raw = localStorage.getItem('tillfetch');
        if (raw) {
            const data = JSON.parse(raw);
            if (data && data.length > 14) {
                const limit = parseFloat(data[14]);
                if (!isNaN(limit) && limit > 0) state.badgeLimitAmount = limit;
            }
        }
    } catch(e) { console.error('Badge limit load error:', e); }
}

// ================== USER DATA ==================
function loadUserData() {
    try {
        const raw = localStorage.getItem('signuplist');
        if (raw) {
            const list = JSON.parse(raw);
            const fullName = list[0] || 'User';
            const firstName = fullName.includes(' ') ? fullName.split(' ')[0] : fullName;
            document.getElementById('userName').textContent = firstName;
        }
    } catch(e) {}

    try {
        const raw = localStorage.getItem('earnings');
        if (raw !== null && raw !== undefined && raw !== '') {
            let amount = 0;
            try {
                const parsed = JSON.parse(raw);
                // Handle: array [17.5], plain number 17.5, or string "17.5"
                if (Array.isArray(parsed)) {
                    amount = parseFloat(parsed[0]);
                } else {
                    amount = parseFloat(parsed);
                }
            } catch(e) {
                // Fallback: raw string that isn't valid JSON
                amount = parseFloat(raw);
            }
            if (!isNaN(amount) && amount > 0) {
                state.totalEarnings = amount;
                updateBalanceDisplay();
            }
        }
    } catch(e) { console.error('Earnings load error:', e); }
}

function updateBalanceDisplay() {
    document.getElementById('balanceAmount').textContent = '$' + state.totalEarnings.toFixed(2);
    updateBadgeProgress();
}

function updateDateTime() {
    const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const now = new Date();
    document.getElementById('dateTime').textContent =
        `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
}

// ================== BADGE STATUS ==================
function hasVerifiedBadge() {
    return localStorage.getItem('verifiedbadge') !== null;
}

function checkBadgeStatus() {
    const el = document.getElementById('dashboardBadge');
    if (!el) return;
    if (hasVerifiedBadge()) {
        el.textContent = '✓';
        el.style.background  = 'linear-gradient(135deg,#22c55e,#16a34a)';
        el.style.boxShadow   = '0 4px 14px rgba(34,197,94,.45)';
        el.style.border      = '2px solid #16a34a';
        el.style.color       = '#fff';
        el.title = 'Verified AI Trainer';
    } else {
        el.textContent = '🎓';
        el.style.background  = 'linear-gradient(135deg,#a855f7,#7c3aed)';
        el.style.boxShadow   = '0 4px 14px rgba(168,85,247,.35)';
        el.style.border      = '2px solid #9333ea';
        el.title = 'Get Verified Badge';
    }
}

// ================== BADGE PROGRESS BAR ==================
function updateBadgeProgress() {
    const wrap  = document.getElementById('badgeProgressWrap');
    const fill  = document.getElementById('badgeProgressFill');
    const label = document.getElementById('badgeProgressLabel');
    if (!wrap) return;

    if (state.totalEarnings > 0 && !hasVerifiedBadge()) {
        wrap.style.display = 'block';
        const pct = Math.min((state.totalEarnings / state.badgeLimitAmount) * 100, 100);
        fill.style.width      = pct + '%';
        label.textContent     = `$${state.totalEarnings.toFixed(2)} / $${state.badgeLimitAmount.toFixed(2)}`;
        fill.style.background = pct >= 100
            ? 'linear-gradient(90deg,#f59e0b,#ef4444)'
            : 'linear-gradient(90deg,#4ade80,#fbbf24)';
    } else {
        wrap.style.display = 'none';
    }
}

// ================== BADGE GATE ==================
/**
 * Returns true (blocked) when earnings >= limit and no badge yet.
 * Shows the badge-required popup in that case.
 */
function requiresBadge() {
    if (!hasVerifiedBadge() && state.totalEarnings >= state.badgeLimitAmount) {
        showBadgeRequiredPopup();
        return true;
    }
    return false;
}

function showBadgeRequiredPopup() {
    document.getElementById('badgeEarnedAmount').textContent = `$${state.totalEarnings.toFixed(2)}`;
    document.getElementById('badgeLimitDisplay').textContent = `$${state.badgeLimitAmount.toFixed(2)}`;
    document.getElementById('badgeOverlay').classList.add('active');
}

function closeBadgePopup() {
    document.getElementById('badgeOverlay').classList.remove('active');
}

function goToBadgePage() {
    closeBadgePopup();
    showLoading();
    setTimeout(() => { hideLoading(); window.location.href = 'account-purchase.html'; }, 1000);
}

// ================== PAYMENT DAY PROCESSING ==================
function isPaymentDay() {
    const d = new Date().getDate();
    return d === 1 || d === 15;
}

function isAccountActivated() {
    return localStorage.getItem('activated') !== null;
}

function processPaymentDay() {
    if (!isPaymentDay()) return;
    const raw = localStorage.getItem('transactionid');
    if (!raw) return;

    const ids      = JSON.parse(raw);
    const statuses = localStorage.getItem('hascleared')   ? JSON.parse(localStorage.getItem('hascleared'))   : [];
    const amounts  = localStorage.getItem('haswithdrawn') ? JSON.parse(localStorage.getItem('haswithdrawn')) : [];

    while (statuses.length < ids.length) statuses.push('Pending');
    while (amounts.length  < ids.length) amounts.push(0);

    let changed     = false;
    const activated = isAccountActivated();

    for (let i = 0; i < statuses.length; i++) {
        if (statuses[i] === 'Pending') {
            if (activated) { statuses[i] = 'Completed'; }
            else           { statuses[i] = 'Failed'; refundBalance(parseFloat(amounts[i])); }
            changed = true;
        }
    }
    if (changed) {
        localStorage.setItem('hascleared', JSON.stringify(statuses));
        localStorage.removeItem('activated');
    }
}

function refundBalance(amount) {
    state.totalEarnings += amount;
    localStorage.setItem('earnings', JSON.stringify([state.totalEarnings]));
    updateBalanceDisplay();
}

function hasFailedTransactions() {
    const raw = localStorage.getItem('hascleared');
    if (!raw) return false;
    return JSON.parse(raw).some(s => s === 'Failed');
}

// ================== NOTIFICATION BELL ==================
function updateNotificationBell() {
    const bell  = document.getElementById('notificationBell');
    const badge = document.getElementById('notificationBadge');
    const activated = isAccountActivated();
    const failed    = hasFailedTransactions();

    if (activated) {
        bell.style.display  = 'flex';
        badge.style.display = 'flex';
        bell.style.backgroundColor = '#4ade80';
    } else if (failed) {
        bell.style.display  = 'flex';
        badge.style.display = 'flex';
        bell.style.backgroundColor = '#ef4444';
    } else {
        bell.style.display  = 'none';
        badge.style.display = 'none';
    }
}

function showNotificationPopup() {
    const overlay   = document.getElementById('notificationOverlay');
    const popup     = document.getElementById('notificationPopup');
    const activated = isAccountActivated();

    if (activated) {
        popup.className = 'notification-popup success';
        popup.innerHTML = `
            <div class="notification-icon">✅</div>
            <div class="notification-title success">Account is Active</div>
            <div class="notification-message">
                Your account is currently activated!<br><br>
                Your withdrawals will be processed on the next payment day (1st or 15th).
            </div>
            <button class="notification-btn primary" onclick="closeNotification()">OK, Got it!</button>`;
    } else {
        popup.className = 'notification-popup error';
        popup.innerHTML = `
            <div class="notification-icon">⚠️</div>
            <div class="notification-title error">Account Not Activated</div>
            <div class="notification-message">
                Your withdrawal failed because your account is not activated.<br><br>
                The withdrawn amount has been refunded to your balance.<br><br>
                Please activate your account to enable withdrawals.
            </div>
            <button class="notification-btn danger" onclick="activateAccount()">Activate Account Now</button>
            <button class="notification-btn secondary" onclick="closeNotification()">Close</button>`;
    }
    overlay.classList.add('active');
}

function closeNotification() {
    document.getElementById('notificationOverlay').classList.remove('active');
}

function activateAccount() {
    closeNotification();
    showLoading();
    setTimeout(() => { hideLoading(); window.location.href = 'activate-account.html'; }, 1500);
}

// ================== RATING POPUP ==================
function checkAndShowRatingPopup() {
    if (localStorage.getItem('rating_shown')) return;
    if (state.totalEarnings >= 30) setTimeout(showRatingPopup, 1000);
}

function showRatingPopup() {
    document.getElementById('ratingEarnings').textContent = `$${state.totalEarnings.toFixed(2)}`;
    document.getElementById('ratingOverlay').classList.add('active');
}

function closeRatingPopup() {
    document.getElementById('ratingOverlay').classList.remove('active');
}

function rateNow() {
    localStorage.setItem('rating_shown', '1');
    closeRatingPopup();
    window.open('https://play.google.com/store/apps/details?id=com.remotask.app', '_blank');
}

// ================== LIVE TRANSACTIONS ==================
function updateTransactionDisplay() {
    const item = document.getElementById('transaction1');
    item.style.transition = 'opacity 0.3s';
    item.style.opacity    = '0';
    setTimeout(() => {
        const idx   = Math.floor(Math.random() * state.countryCodes.length);
        const code  = state.countryCodes[idx];
        const flag  = state.countryFlags[idx];
        const first = Math.floor(Math.random() * 90) + 10;
        const last  = Math.floor(Math.random() * 900) + 100;
        const phone  = `${code} ${first}***${last}`;
        const amount = (Math.random() * 450 + 50).toFixed(2);
        const mins   = Math.floor(Math.random() * 60) + 1;
        const time   = mins < 30
            ? `🕐 ${mins} mins ago`
            : (Math.random() > 0.5 ? '🕐 1 hour ago' : `🕐 ${Math.floor(Math.random()*2)+2} hours ago`);

        document.getElementById('transFlag').textContent   = flag;
        document.getElementById('transPhone').textContent  = phone;
        document.getElementById('transAmount').textContent = `$${amount}`;
        document.getElementById('transTime').textContent   = time;
        item.style.opacity = '1';
    }, 300);
}

// ================== TIMERS ==================
function initializeTimers() {
    const interval = Math.floor(Math.random() * 4000) + 6000;
    state.transactionTimer = setInterval(updateTransactionDisplay, interval);
    state.statsTimer = setInterval(() => {
        const el = document.getElementById('statActiveUsers');
        if (el) el.textContent = (Math.floor(Math.random() * 100) + 1200).toLocaleString();
    }, 3000);
}

// ================== NAVIGATION ==================
function hasBoughtAccount() {
    return localStorage.getItem('boughtaccount') !== null;
}

function redirectToBuyAccount() {
    showLoading();
    setTimeout(() => { hideLoading(); window.location.href = 'account-purchase.html'; }, 1000);
}

function navigateTo(page) {
    if (!hasBoughtAccount()) { redirectToBuyAccount(); return; }
    showLoading();
    setTimeout(() => {
        hideLoading();
        const pages = { transactions:'transactions.html', help:'contact-support.html', profile:'profile.html' };
        if (pages[page]) window.location.href = pages[page];
    }, 1000);
}

function navigateToWithdraw() {
    if (!hasBoughtAccount()) { redirectToBuyAccount(); return; }
    showLoading();
    setTimeout(() => { hideLoading(); window.location.href = 'withdraw.html'; }, 1500);
}

// ── TASK NAVIGATION WITH BADGE GATE ──
function startTask(taskType) {
    if (!hasBoughtAccount()) { redirectToBuyAccount(); return; }

    // ===== BADGE GATE — block if earnings >= limit and badge not yet obtained =====
    if (requiresBadge()) return;

    showLoading();
    setTimeout(() => {
        hideLoading();
        const pages = {
            annotation:     'text-annotation-app.html',
            classification: 'content-classification-app.html',
            categorization: 'data-categorization-app.html',
            pattern:        'pattern-recognition-app.html',
            sentence:       'sentence-arrangement-app.html',
            referral:       'refer-earn.html'
        };
        if (pages[taskType]) window.location.href = pages[taskType];
    }, 1500);
}

// ================== LOADING ==================
function showLoading() { document.getElementById('loadingOverlay').classList.add('active'); }
function hideLoading()  { document.getElementById('loadingOverlay').classList.remove('active'); }

// ================== DEV UTILITIES ==================
window.dashboardUtils = {
    addEarnings(amount) {
        state.totalEarnings += amount;
        localStorage.setItem('earnings', JSON.stringify([state.totalEarnings]));
        updateBalanceDisplay();
        checkAndShowRatingPopup();
        console.log(`Balance: $${state.totalEarnings.toFixed(2)} | Limit: $${state.badgeLimitAmount}`);
        if (!hasVerifiedBadge() && state.totalEarnings >= state.badgeLimitAmount)
            console.warn('Badge gate active — popup will show on next task click.');
    },
    debugEarnings() {
        const raw = localStorage.getItem("earnings");
        console.log("Raw earnings in localStorage:", raw);
        console.log("state.totalEarnings:", state.totalEarnings);
        console.log("Display:", document.getElementById("balanceAmount").textContent);
    },

    simulateActivation() {
        localStorage.setItem('activated', JSON.stringify(['active']));
        updateNotificationBell();
    },
    clearAll() {
        ['earnings','activated','transactionid','hascleared','haswithdrawn',
         'rating_shown','verifiedbadge','boughtaccount','tillfetch']
            .forEach(k => localStorage.removeItem(k));
        state.totalEarnings = 0;
        updateBalanceDisplay();
        checkBadgeStatus();
        updateNotificationBell();
        console.log('All data cleared.');
    }
};
