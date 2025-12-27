// ================== STATE MANAGEMENT ==================
const state = {
    user: {
        name: 'Profile',
        email: 'loading@email.com',
        phone: '+254 700 000 000',
        country: 'Kenya',
        password: ''
    },
    balance: 0,
    isEditMode: false,
    isActivated: false,
    hasFailedTransactions: false,
    countries: []
};

// ================== INITIALIZATION ==================
document.addEventListener('DOMContentLoaded', () => {
    initializeCountries();
    processPaymentDay();
    loadUserData();
    updateUI();
    updateNotificationBell();
    loadSettings();
});

// ================== COUNTRIES LIST ==================
function initializeCountries() {
    state.countries = [
        "Afghanistan", "Albania", "Algeria", "Argentina", "Australia", "Austria",
        "Bangladesh", "Belgium", "Brazil", "Canada", "China", "Colombia",
        "Denmark", "Egypt", "Ethiopia", "Finland", "France", "Germany",
        "Ghana", "Greece", "India", "Indonesia", "Iran", "Iraq",
        "Ireland", "Israel", "Italy", "Japan", "Kenya", "Malaysia",
        "Mexico", "Netherlands", "New Zealand", "Nigeria", "Norway", "Pakistan",
        "Philippines", "Poland", "Portugal", "Russia", "Saudi Arabia", "Singapore",
        "South Africa", "South Korea", "Spain", "Sweden", "Switzerland", "Tanzania",
        "Thailand", "Turkey", "Uganda", "Ukraine", "United Arab Emirates",
        "United Kingdom", "United States", "Vietnam", "Zimbabwe"
    ];
    
    // Populate country dropdown
    const select = document.getElementById('editCountry');
    select.innerHTML = '';
    state.countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        select.appendChild(option);
    });
}

// ================== PAYMENT DAY PROCESSING ==================
function isPaymentDay() {
    const now = new Date();
    const day = now.getDate();
    return (day === 1 || day === 15);
}

function isAccountActivated() {
    const activated = localStorage.getItem('activated');
    return activated !== null;
}

function processPaymentDay() {
    if (!isPaymentDay()) {
        return;
    }
    
    const transactionIDs = getTransactionIDs();
    if (transactionIDs.length === 0) {
        return;
    }
    
    const statuses = getTransactionStatuses();
    const amounts = getTransactionAmounts();
    
    // Ensure arrays are same length
    while (statuses.length < transactionIDs.length) {
        statuses.push('Pending');
    }
    while (amounts.length < transactionIDs.length) {
        amounts.push(0);
    }
    
    let statusChanged = false;
    const activated = isAccountActivated();
    
    // Process each transaction
    for (let i = 0; i < statuses.length; i++) {
        if (statuses[i] === 'Pending') {
            if (activated) {
                statuses[i] = 'Completed';
                statusChanged = true;
            } else {
                statuses[i] = 'Failed';
                statusChanged = true;
                
                // Refund the amount
                const refundAmount = parseFloat(amounts[i]) || 0;
                refundBalance(refundAmount);
            }
        }
    }
    
    if (statusChanged) {
        localStorage.setItem('hascleared', JSON.stringify(statuses));
        
        // Clear activation flag after processing
        if (activated) {
            localStorage.removeItem('activated');
        }
    }
}

function getTransactionIDs() {
    const data = localStorage.getItem('transactionid');
    return data ? JSON.parse(data) : [];
}

function getTransactionStatuses() {
    const data = localStorage.getItem('hascleared');
    return data ? JSON.parse(data) : [];
}

function getTransactionAmounts() {
    const data = localStorage.getItem('haswithdrawn');
    return data ? JSON.parse(data) : [];
}

function refundBalance(amount) {
    if (amount <= 0) return;
    
    let currentBalance = 0;
    const earningsData = localStorage.getItem('earnings');
    if (earningsData) {
        const earnings = JSON.parse(earningsData);
        currentBalance = parseFloat(earnings[0]) || 0;
    }
    
    currentBalance += amount;
    localStorage.setItem('earnings', JSON.stringify([currentBalance]));
    
    state.balance = currentBalance;
    updateBalanceDisplay();
    
    console.log(`Refunded $${amount.toFixed(2)} to balance. New balance: $${currentBalance.toFixed(2)}`);
}

function hasFailedTransactions() {
    const statuses = getTransactionStatuses();
    return statuses.includes('Failed');
}

// ================== NOTIFICATION BELL SYSTEM ==================
function updateNotificationBell() {
    const bell = document.getElementById('notificationBell');
    const badge = document.getElementById('notificationBadge');
    
    state.isActivated = isAccountActivated();
    state.hasFailedTransactions = hasFailedTransactions();
    
    if (state.isActivated) {
        // GREEN bell - Account is active
        bell.classList.add('visible', 'green');
        bell.classList.remove('hidden');
        badge.classList.add('green');
        badge.style.display = 'flex';
    } else if (state.hasFailedTransactions) {
        // RED bell - Failed transactions + not activated
        bell.classList.add('visible');
        bell.classList.remove('green', 'hidden');
        badge.classList.remove('green');
        badge.style.display = 'flex';
    } else {
        // No bell
        bell.classList.remove('visible');
        bell.classList.add('hidden');
        badge.style.display = 'none';
    }
}

function showNotificationPopup() {
    const overlay = document.getElementById('notificationOverlay');
    const popup = document.getElementById('notificationPopup');
    const icon = document.getElementById('notifIcon');
    const title = document.getElementById('notifTitle');
    const message = document.getElementById('notifMessage');
    const actionBtn = document.getElementById('notifActionBtn');
    
    if (state.isActivated) {
        // GREEN popup
        popup.classList.add('green');
        title.classList.add('green');
        icon.textContent = '✅';
        title.textContent = 'Account is Active';
        message.innerHTML = `
            Your account is currently activated!
            <br><br>
            Your withdrawals will be processed on the next payment day (1st or 15th).
            <br><br>
        `;
        actionBtn.classList.remove('btn-danger');
        actionBtn.classList.add('btn-success');
        actionBtn.textContent = 'OK, Got it!';
        actionBtn.onclick = closeNotificationPopup;
    } else {
        // RED popup
        popup.classList.remove('green');
        title.classList.remove('green');
        icon.textContent = '⚠️';
        title.textContent = 'Account Not Activated';
        message.innerHTML = `
            Your withdrawal failed because your account is not activated.
            <br><br>
            The withdrawn amount has been refunded to your balance.
            <br><br>
            Please activate your account to enable withdrawals.
        `;
        actionBtn.classList.remove('btn-success');
        actionBtn.classList.add('btn-danger');
        actionBtn.textContent = 'Activate Account Now';
        actionBtn.onclick = activateAccount;
    }
    
    overlay.classList.add('active');
}

function closeNotificationPopup() {
    document.getElementById('notificationOverlay').classList.remove('active');
}

function activateAccount() {
    closeNotificationPopup();
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        showToast('Opening account activation...', true);
        console.log('Navigating to account activation page...');
        // In real app: window.location.href = 'activate-account.html';
    }, 1500);
}

// ================== USER DATA MANAGEMENT ==================
function loadUserData() {
    // Load signup data
    const signupData = localStorage.getItem('signuplist');
    if (signupData) {
        const userData = JSON.parse(signupData);
        if (userData.length >= 5) {
            state.user = {
                name: userData[0],
                phone: userData[1],
                email: userData[2],
                country: userData[3],
                password: userData[4]
            };
        }
    }
    
    // Load earnings
    const earningsData = localStorage.getItem('earnings');
    if (earningsData) {
        const earnings = JSON.parse(earningsData);
        state.balance = parseFloat(earnings[0]) || 0;
    }
    
    // Load completed tasks count
    loadCompletedTasksCount();
}

function loadCompletedTasksCount() {
    const taskFiles = [
        'completedttaskcounts',
        'completedtaskcount',
        'completedtaskscount',
        'completedtasks_count',
        'completed_tasks_count'
    ];
    
    let totalTasks = 0;
    
    taskFiles.forEach(file => {
        const data = localStorage.getItem(file);
        if (data) {
            const taskList = JSON.parse(data);
            if (taskList.length > 0) {
                totalTasks += parseInt(taskList[0]) || 0;
            }
        }
    });
    
    if (totalTasks > 0) {
        console.log(`Completed tasks: ${totalTasks}`);
    }
}

function updateUI() {
    // Update display mode
    document.getElementById('displayName').textContent = state.user.name;
    document.getElementById('displayEmail').textContent = state.user.email;
    document.getElementById('displayPhone').textContent = state.user.phone;
    document.getElementById('displayCountry').textContent = state.user.country;
    
    // Update header
    document.getElementById('headerName').textContent = state.user.name;
    
    // Update balance
    updateBalanceDisplay();
}

function updateBalanceDisplay() {
    document.getElementById('balanceAmount').textContent = `$ ${state.balance.toFixed(2)}`;
}

// ================== EDIT MODE ==================
function enterEditMode() {
    state.isEditMode = true;
    
    // Hide display mode, show edit mode
    document.getElementById('displayMode').classList.add('hidden');
    document.getElementById('editMode').classList.remove('hidden');
    
    // Hide edit button, show save/cancel buttons
    document.getElementById('btnEdit').classList.add('hidden');
    document.getElementById('editButtons').classList.remove('hidden');
    document.getElementById('otherActions').classList.add('hidden');
    
    // Populate edit fields
    document.getElementById('editName').value = state.user.name;
    document.getElementById('editEmail').value = state.user.email;
    document.getElementById('editPhone').value = state.user.phone;
    
    // Set country
    const select = document.getElementById('editCountry');
    const index = state.countries.indexOf(state.user.country);
    if (index >= 0) {
        select.selectedIndex = index;
    }
    
    showToast('Edit mode enabled', true);
}

function saveProfile() {
    const name = document.getElementById('editName').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const phone = document.getElementById('editPhone').value.trim();
    const country = document.getElementById('editCountry').value;
    
    // Validate
    if (!name) {
        showToast('Please enter your name');
        return;
    }
    
    if (!email) {
        showToast('Please enter your email');
        return;
    }
    
    if (!phone) {
        showToast('Please enter your phone number');
        return;
    }
    
    // Show loading
    showLoading();
    
    setTimeout(() => {
        // Update state
        state.user.name = name;
        state.user.email = email;
        state.user.phone = phone;
        state.user.country = country;
        
        // Save to localStorage
        const userData = [name, phone, email, country, state.user.password];
        localStorage.setItem('signuplist', JSON.stringify(userData));
        
        hideLoading();
        exitEditMode();
        updateUI();
        
        showToast('Profile updated successfully!', true);
    }, 1000);
}

function cancelEdit() {
    exitEditMode();
    showToast('Edit cancelled');
}

function exitEditMode() {
    state.isEditMode = false;
    
    // Show display mode, hide edit mode
    document.getElementById('displayMode').classList.remove('hidden');
    document.getElementById('editMode').classList.add('hidden');
    
    // Show edit button, hide save/cancel buttons
    document.getElementById('btnEdit').classList.remove('hidden');
    document.getElementById('editButtons').classList.add('hidden');
    document.getElementById('otherActions').classList.remove('hidden');
}

// ================== SETTINGS ==================
function loadSettings() {
    const settings = localStorage.getItem('settings');
    if (settings) {
        const settingsObj = JSON.parse(settings);
        document.getElementById('chkNotifications').checked = settingsObj.notifications !== false;
        document.getElementById('chkSound').checked = settingsObj.sound_effects !== false;
    } else {
        document.getElementById('chkNotifications').checked = true;
        document.getElementById('chkSound').checked = true;
    }
}

function saveNotificationsSetting() {
    const checked = document.getElementById('chkNotifications').checked;
    saveSetting('notifications', checked);
    showToast(checked ? 'Notifications enabled' : 'Notifications disabled', true);
}

function saveSoundSetting() {
    const checked = document.getElementById('chkSound').checked;
    saveSetting('sound_effects', checked);
    showToast(checked ? 'Sound effects enabled' : 'Sound effects disabled', true);
}

function saveSetting(key, value) {
    let settings = {};
    const settingsData = localStorage.getItem('settings');
    if (settingsData) {
        settings = JSON.parse(settingsData);
    }
    settings[key] = value;
    localStorage.setItem('settings', JSON.stringify(settings));
}

function openSettings() {
    document.getElementById('settingsOverlay').classList.add('active');
}

function closeSettings() {
    document.getElementById('settingsOverlay').classList.remove('active');
}

function clearCache() {
    if (confirm('Are you sure you want to clear cache? This will remove temporary data.')) {
        showLoading();
        
        setTimeout(() => {
            // Clear cache (add specific cache keys as needed)
            // Example: localStorage.removeItem('cache');
            
            hideLoading();
            showToast('Cache cleared successfully!', true);
        }, 1500);
    }
}

function showAbout() {
    showToast('REMO-TASK v1.0.0 - AI Training & Task Platform', true);
}

// ================== ACTIONS ==================
function openWithdrawHistory() {
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        showToast('Opening transaction history...', true);
        console.log('Navigating to transactions page...');
        // In real app: window.location.href = 'transactions.html';
    }, 1500);
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        showLoading();
        
        setTimeout(() => {
            hideLoading();
            showToast('Logged out successfully', true);
            console.log('Navigating to login...');
            // In real app: window.location.href = 'login.html';
        }, 1000);
    }
}

// ================== BOTTOM NAVIGATION ==================
function navigateHome() {
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        console.log('Navigating to dashboard...');
        // In real app: window.location.href = 'dashboard.html';
    }, 1000);
}

function navigateTransactions() {
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        showToast('Opening transactions history...', true);
        console.log('Navigating to transactions...');
        // In real app: window.location.href = 'transactions.html';
    }, 1000);
}

function navigateWithdraw() {
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        showToast('Opening withdraw page...', true);
        console.log('Navigating to withdraw...');
        // In real app: window.location.href = 'withdraw.html';
    }, 1000);
}

// ================== LOADING OVERLAY ==================
function showLoading() {
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

// ================== TOAST NOTIFICATIONS ==================
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
// Function to simulate user data
function simulateUserData() {
    const userData = ['John Doe', '0712345678', 'john@example.com', 'Kenya', 'password123'];
    localStorage.setItem('signuplist', JSON.stringify(userData));
    localStorage.setItem('earnings', JSON.stringify([125.50]));
    console.log('User data simulated');
    location.reload();
}

// Function to simulate activated account
function simulateActivatedAccount() {
    localStorage.setItem('activated', JSON.stringify(['active']));
    console.log('Account activated');
    location.reload();
}

// Function to simulate failed transaction
function simulateFailedTransaction() {
    // Add a pending transaction
    localStorage.setItem('transactionid', JSON.stringify(['TXN001']));
    localStorage.setItem('hascleared', JSON.stringify(['Failed']));
    localStorage.setItem('haswithdrawn', JSON.stringify([25.00]));
    console.log('Failed transaction simulated');
    location.reload();
}

// Function to clear activation
function clearActivation() {
    localStorage.removeItem('activated');
    console.log('Activation cleared');
    location.reload();
}

// Function to trigger payment day processing
function triggerPaymentDay() {
    console.log('Processing payment day...');
    processPaymentDay();
    updateNotificationBell();
    updateUI();
    showToast('Payment day processed. Check console for details.', true);
}

// Function to get profile data
function getProfileData() {
    return {
        user: state.user,
        balance: state.balance,
        isActivated: state.isActivated,
        hasFailedTransactions: state.hasFailedTransactions
    };
}

// Expose utility functions globally for testing
window.profileUtils = {
    simulateUserData: simulateUserData,
    simulateActivatedAccount: simulateActivatedAccount,
    simulateFailedTransaction: simulateFailedTransaction,
    clearActivation: clearActivation,
    triggerPaymentDay: triggerPaymentDay,
    getProfileData: getProfileData,
    refundBalance: refundBalance
};
