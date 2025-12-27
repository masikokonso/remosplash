// ================== STATE MANAGEMENT ==================
const state = {
    totalEarnings: 0,
    transactionTimer: null,
    statsTimer: null,
    countryCodes: ['+254', '+1', '+44', '+91', '+234', '+27', '+61', '+86', '+81', '+33', '+49', '+39', '+34', '+55', '+52', '+20', '+92', '+880', '+62', '+63'],
    countryFlags: ['🇰🇪', '🇺🇸', '🇬🇧', '🇮🇳', '🇳🇬', '🇿🇦', '🇦🇺', '🇨🇳', '🇯🇵', '🇫🇷', '🇩🇪', '🇮🇹', '🇪🇸', '🇧🇷', '🇲🇽', '🇪🇬', '🇵🇰', '🇧🇩', '🇮🇩', '🇵🇭']
};

// ================== INITIALIZATION ==================
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    processPaymentDay();
    updateNotificationBell();
    updateDateTime();
    initializeTimers();
    generateRandomTransaction();
});

// ================== USER DATA ==================
function loadUserData() {
    // Load user name
    const signupData = localStorage.getItem('signuplist');
    if (signupData) {
        const userData = JSON.parse(signupData);
        const fullName = userData[0];
        const firstName = fullName.includes(' ') ? fullName.split(' ')[0] : fullName;
        document.getElementById('userName').textContent = firstName;
    }
    
    // Load earnings
    const earningsData = localStorage.getItem('earnings');
    if (earningsData) {
        const earnings = JSON.parse(earningsData);
        if (earnings && earnings.length > 0) {
            state.totalEarnings = parseFloat(earnings[0]);
            updateBalanceDisplay();
        }
    }
}

function updateBalanceDisplay() {
    document.getElementById('balanceAmount').textContent = '$' + state.totalEarnings.toFixed(2);
}

function updateDateTime() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const now = new Date();
    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const dayNum = now.getDate();
    
    document.getElementById('dateTime').textContent = `${dayName}, ${monthName} ${dayNum}`;
}

// ================== PAYMENT DAY PROCESSING ==================
function isPaymentDay() {
    const currentDay = new Date().getDate();
    return (currentDay === 1 || currentDay === 15);
}

function isAccountActivated() {
    return localStorage.getItem('activated') !== null;
}

function processPaymentDay() {
    if (!isPaymentDay()) return;
    
    const transactionIDs = localStorage.getItem('transactionid');
    if (!transactionIDs) return;
    
    const ids = JSON.parse(transactionIDs);
    const statuses = localStorage.getItem('hascleared') ? JSON.parse(localStorage.getItem('hascleared')) : [];
    const amounts = localStorage.getItem('haswithdrawn') ? JSON.parse(localStorage.getItem('haswithdrawn')) : [];
    
    // Ensure arrays are same length
    while (statuses.length < ids.length) statuses.push('Pending');
    while (amounts.length < ids.length) amounts.push(0);
    
    let statusChanged = false;
    const isActivated = isAccountActivated();
    
    for (let i = 0; i < statuses.length; i++) {
        if (statuses[i] === 'Pending') {
            if (isActivated) {
                statuses[i] = 'Completed';
                statusChanged = true;
            } else {
                statuses[i] = 'Failed';
                statusChanged = true;
                // Refund amount
                refundBalance(parseFloat(amounts[i]));
            }
        }
    }
    
    if (statusChanged) {
        localStorage.setItem('hascleared', JSON.stringify(statuses));
        // Clear activation flag after processing
        localStorage.removeItem('activated');
    }
}

function refundBalance(amount) {
    state.totalEarnings += amount;
    const earnings = [state.totalEarnings];
    localStorage.setItem('earnings', JSON.stringify(earnings));
    updateBalanceDisplay();
}

function hasFailedTransactions() {
    const statuses = localStorage.getItem('hascleared');
    if (!statuses) return false;
    
    const statusArray = JSON.parse(statuses);
    return statusArray.some(status => status === 'Failed');
}

// ================== NOTIFICATION SYSTEM ==================
function updateNotificationBell() {
    const bell = document.getElementById('notificationBell');
    const badge = document.getElementById('notificationBadge');
    const isActivated = isAccountActivated();
    const hasFailed = hasFailedTransactions();
    
    if (isActivated) {
        // Green notification - account activated
        bell.style.display = 'flex';
        bell.style.backgroundColor = '#4ade80';
        badge.style.display = 'flex';
        badge.style.backgroundColor = '#22c55e';
        badge.parentElement.style.backgroundColor = '#22c55e';
    } else if (hasFailed) {
        // Red notification - failed transaction
        bell.style.display = 'flex';
        bell.style.backgroundColor = '#ef4444';
        badge.style.display = 'flex';
        badge.style.backgroundColor = '#dc2626';
        badge.parentElement.style.backgroundColor = '#dc2626';
    } else {
        // No notification
        bell.style.display = 'none';
        badge.style.display = 'none';
    }
}

function showNotificationPopup() {
    const overlay = document.getElementById('notificationOverlay');
    const popup = document.getElementById('notificationPopup');
    const isActivated = isAccountActivated();
    
    if (isActivated) {
        popup.className = 'notification-popup success';
        popup.innerHTML = `
            <div class="notification-icon">✅</div>
            <div class="notification-title success">Account is Active</div>
            <div class="notification-message">
                Your account is currently activated!<br><br>
                Your withdrawals will be processed on the next payment day (1st or 15th).<br><br>
            </div>
            <button class="notification-btn primary" onclick="closeNotification()">OK, Got it!</button>
        `;
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
            <button class="notification-btn secondary" onclick="closeNotification()">Close</button>
        `;
    }
    
    overlay.classList.add('active');
}

function closeNotification() {
    document.getElementById('notificationOverlay').classList.remove('active');
}

function activateAccount() {
    closeNotification();
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        console.log('Navigating to account activation...');
            window.location.href = 'activate-account.html';
    }, 1500);
}

// ================== LIVE TRANSACTIONS ==================
function generateRandomTransaction() {
    const countryIndex = Math.floor(Math.random() * state.countryCodes.length);
    const countryCode = state.countryCodes[countryIndex];
    const flag = state.countryFlags[countryIndex];
    
    const firstDigits = Math.floor(Math.random() * 90) + 10;
    const lastDigits = Math.floor(Math.random() * 900) + 100;
    const phone = `${countryCode} ${firstDigits}***${lastDigits}`;
    
    const amount = (Math.random() * 450 + 50).toFixed(2);
    
    const timeValue = Math.floor(Math.random() * 60) + 1;
    let time;
    if (timeValue < 30) {
        time = `🕐 ${timeValue} mins ago`;
    } else {
        const hours = Math.floor(Math.random() * 2) + 1;
        time = hours === 1 ? '🕐 1 hour ago' : `🕐 ${hours} hours ago`;
    }
    
    return { flag, phone, amount: `$${amount}`, time };
}

function updateTransactionDisplay() {
    const transaction = generateRandomTransaction();
    
    // Fade out
    const item = document.getElementById('transaction1');
    item.style.opacity = '0';
    
    setTimeout(() => {
        document.getElementById('transFlag').textContent = transaction.flag;
        document.getElementById('transPhone').textContent = transaction.phone;
        document.getElementById('transAmount').textContent = transaction.amount;
        document.getElementById('transTime').textContent = transaction.time;
        
        // Fade in
        item.style.opacity = '1';
    }, 300);
}

// ================== TIMERS ==================
function initializeTimers() {
    // Transaction updates every 6-10 seconds
    const transactionInterval = Math.floor(Math.random() * 4000) + 6000;
    state.transactionTimer = setInterval(() => {
        updateTransactionDisplay();
    }, transactionInterval);
    
    // Stats updates every 3 seconds
    state.statsTimer = setInterval(() => {
        updateStats();
    }, 3000);
}

function updateStats() {
    const activeUsers = Math.floor(Math.random() * 100) + 1200;
    document.getElementById('statActiveUsers').textContent = activeUsers.toLocaleString();
}

// ================== NAVIGATION ==================
function navigateTo(page) {
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        console.log(`Navigating to ${page}...`);
        
        // In real app, uncomment:
         switch(page) {
             case 'transactions': window.location.href = 'transactions.html'; break;
             case 'help': window.location.href = 'contact-support.html'; break;
             case 'profile': window.location.href = 'profile.html'; break;
         }
    }, 1000);
}

function navigateToWithdraw() {
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        console.log('Navigating to withdraw page...');
         window.location.href = 'withdraw.html';
    }, 1500);
}

function startTask(taskType) {
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        console.log(`Starting task: ${taskType}`);
        
        // In real app, uncomment:
         switch(taskType) {
             case 'annotation': window.location.href = 'text-annotation-app.html'; break;
             case 'classification': window.location.href = 'content-classification-app.html'; break;
             case 'categorization': window.location.href = 'data-categorization-app.html'; break;
             case 'pattern': window.location.href = 'pattern-recognition-app.html'; break;
             case 'sentence': window.location.href = 'sentence-arrangement-app.html'; break;
             case 'referral': window.location.href = 'refer-earn.html'; break;
         }
    }, 1500);
}

// ================== LOADING ==================
function showLoading() {
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

// ================== UTILITY FUNCTIONS ==================
// Function to simulate account activation
function simulateActivation() {
    localStorage.setItem('activated', JSON.stringify(['active']));
    updateNotificationBell();
    console.log('Account activated');
}

// Function to simulate failed withdrawal
function simulateFailedWithdrawal(amount) {
    const transactionIDs = localStorage.getItem('transactionid') ? JSON.parse(localStorage.getItem('transactionid')) : [];
    const statuses = localStorage.getItem('hascleared') ? JSON.parse(localStorage.getItem('hascleared')) : [];
    const amounts = localStorage.getItem('haswithdrawn') ? JSON.parse(localStorage.getItem('haswithdrawn')) : [];
    
    transactionIDs.push('TXN' + Date.now());
    statuses.push('Failed');
    amounts.push(amount);
    
    localStorage.setItem('transactionid', JSON.stringify(transactionIDs));
    localStorage.setItem('hascleared', JSON.stringify(statuses));
    localStorage.setItem('haswithdrawn', JSON.stringify(amounts));
    
    refundBalance(amount);
    updateNotificationBell();
    console.log(`Failed withdrawal of $${amount} simulated and refunded`);
}

// Function to add test earnings
function addEarnings(amount) {
    state.totalEarnings += amount;
    localStorage.setItem('earnings', JSON.stringify([state.totalEarnings]));
    updateBalanceDisplay();
    console.log(`Added $${amount} to balance`);
}

// Function to clear all data
function clearDashboardData() {
    localStorage.removeItem('earnings');
    localStorage.removeItem('activated');
    localStorage.removeItem('transactionid');
    localStorage.removeItem('hascleared');
    localStorage.removeItem('haswithdrawn');
    state.totalEarnings = 0;
    updateBalanceDisplay();
    updateNotificationBell();
    console.log('Dashboard data cleared');
}

// Function to check dashboard status
function checkDashboardStatus() {
    const status = {
        earnings: state.totalEarnings,
        isActivated: isAccountActivated(),
        isPaymentDay: isPaymentDay(),
        hasFailed: hasFailedTransactions(),
        transactions: localStorage.getItem('transactionid') ? JSON.parse(localStorage.getItem('transactionid')).length : 0
    };
    console.log('Dashboard Status:', status);
    return status;
}

// Expose utility functions globally
window.dashboardUtils = {
    simulateActivation: simulateActivation,
    simulateFailedWithdrawal: simulateFailedWithdrawal,
    addEarnings: addEarnings,
    clearDashboardData: clearDashboardData,
    checkDashboardStatus: checkDashboardStatus
};
