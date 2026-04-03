// ================== STATE MANAGEMENT ==================
const state = {
    balance: 0,
    minWithdrawal: 150,
    selectedPaymentMethod: '',
    selectedPaymentIcon: '',
    isActivated: false,
    hasFailedTransactions: false
};

// ================== INITIALIZATION ==================
document.addEventListener('DOMContentLoaded', () => {
    loadMinimumWithdrawal();
    processPaymentDay();
    loadBalance();
    updatePaymentSchedule();
    updateNotificationBell();
});

// ================== MINIMUM WITHDRAWAL ==================
function loadMinimumWithdrawal() {
    const tillfetch = localStorage.getItem('tillfetch');
    if (tillfetch) {
        try {
            const data = JSON.parse(tillfetch);
            if (data.length >= 8) {
                state.minWithdrawal = parseFloat(data[7]) || 150;
                
                // Update UI
                document.getElementById('minWithdrawalInfo').textContent = 
                    `💵 Minimum withdrawal: $ ${state.minWithdrawal}`;
                document.getElementById('amount').placeholder = 
                    `Enter amount (Min: $ ${state.minWithdrawal})`;
            }
        } catch (error) {
            console.error('Error loading minimum withdrawal:', error);
        }
    }
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
    
    const transIDs = getTransactionIDs();
    if (transIDs.length === 0) {
        return;
    }
    
    const statuses = getTransactionStatuses();
    const amounts = getTransactionAmounts();
    
    // Ensure arrays are same length
    while (statuses.length < transIDs.length) {
        statuses.push('Pending');
    }
    while (amounts.length < transIDs.length) {
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
    
    state.balance += amount;
    
    // Update localStorage
    localStorage.setItem('earnings', JSON.stringify([state.balance]));
    
    // Update UI
    updateBalanceDisplay();
    
    console.log(`Refunded $${amount.toFixed(2)} to balance. New balance: $${state.balance.toFixed(2)}`);
}

function hasFailedTransactions() {
    const statuses = getTransactionStatuses();
    return statuses.includes('Failed');
}

// ================== BALANCE MANAGEMENT ==================
function loadBalance() {
    const earningsData = localStorage.getItem('earnings');
    if (earningsData) {
        try {
            const earnings = JSON.parse(earningsData);
            state.balance = parseFloat(earnings[0]) || 0;
        } catch (error) {
            console.error('Error loading balance:', error);
            state.balance = 0;
        }
    }
    
    updateBalanceDisplay();
}

function updateBalanceDisplay() {
    const balanceEl = document.getElementById('balanceAmount');
    const infoEl = document.getElementById('balanceInfo');
    
    balanceEl.textContent = `$ ${state.balance.toFixed(2)}`;
    
    if (state.balance >= state.minWithdrawal) {
        infoEl.textContent = '💵 Ready for withdrawal';
    } else {
        infoEl.textContent = `⚠️ Minimum $ ${state.minWithdrawal} required`;
    }
}

// ================== PAYMENT SCHEDULE ==================
function updatePaymentSchedule() {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    
    // Update current day
    document.getElementById('currentDay').textContent = 
        `Today is: ${day}/${month}/${year}`;
    
    // Update next payment
    document.getElementById('nextPayment').textContent = 
        `Next Payment Day: ${getNextPaymentDay()}`;
    
    // Update schedule details
    const detailsEl = document.getElementById('scheduleDetails');
    if (isPaymentDay()) {
        detailsEl.textContent = '✅ Today is a payment day! Withdrawals will be processed instantly if activated.';
        detailsEl.className = 'schedule-details green';
    } else {
        detailsEl.textContent = '⏳ Withdrawals are processed on the 1st & 15th of each month';
        detailsEl.className = 'schedule-details yellow';
    }
}

function getNextPaymentDay() {
    const now = new Date();
    const day = now.getDate();
    
    if (day < 1) {
        const daysUntil = 1 - day;
        return `1st (in ${daysUntil} days)`;
    } else if (day < 15) {
        const daysUntil = 15 - day;
        return `15th (in ${daysUntil} days)`;
    } else {
        // Calculate days until 1st of next month
        const month = now.getMonth();
        const year = now.getFullYear();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysUntil = (daysInMonth - day) + 1;
        return `1st (in ${daysUntil} days)`;
    }
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
        badge.classList.add('green');
    } else if (state.hasFailedTransactions) {
        // RED bell - Failed transactions + not activated
        bell.classList.add('visible');
        bell.classList.remove('green');
        badge.classList.remove('green');
    } else {
        // No bell
        bell.classList.remove('visible');
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
        `;
        actionBtn.className = 'btn btn-primary';
        actionBtn.style.backgroundColor = 'var(--color-green)';
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
        actionBtn.className = 'btn btn-primary';
        actionBtn.style.backgroundColor = 'var(--color-red)';
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
        //alert('Opening account activation...');
        console.log('Navigating to account activation page...');
         window.location.href = 'activate-account.html';
    }, 1500);
}

// ================== PAYMENT METHOD SELECTION ==================
function showPaymentMethodPopup() {
    document.getElementById('paymentPopup').classList.add('active');
}

function closePaymentPopup() {
    document.getElementById('paymentPopup').classList.remove('active');
}

function selectPaymentMethod(method, icon) {
    state.selectedPaymentMethod = method;
    state.selectedPaymentIcon = icon;
    
    // Update selector display
    const selector = document.getElementById('paymentMethodSelector');
    selector.textContent = `${icon} ${method}`;
    selector.classList.remove('placeholder');
    selector.classList.add('selected');
    
    // Show account details
    const detailsContainer = document.getElementById('accountDetails');
    detailsContainer.innerHTML = '';
    
    // Build appropriate form based on method
    switch (method) {
        case 'PayPal':
            buildPayPalForm(detailsContainer);
            break;
        case 'Bank Transfer':
            buildBankTransferForm(detailsContainer);
            break;
        case 'M-Pesa':
            buildMPesaForm(detailsContainer);
            break;
        case 'Skrill':
            buildSkrillForm(detailsContainer);
            break;
    }
    
    detailsContainer.classList.add('visible');
    closePaymentPopup();
    
    showToast(`${method} selected. Please enter your details below.`);
}

// ================== PAYMENT FORM BUILDERS ==================
function buildPayPalForm(container) {
    container.innerHTML = `
        <div class="form-group">
            <label class="form-label">PayPal Account Details</label>
            <input type="email" class="form-input" id="paypalEmail" 
                   placeholder="Enter your PayPal email address">
            <div class="form-info">ℹ️ Make sure this email is linked to your PayPal account</div>
        </div>
    `;
}

function buildBankTransferForm(container) {
    container.innerHTML = `
        <div class="form-group">
            <label class="form-label">Bank Account Details</label>
            <input type="text" class="form-input" id="bankName" 
                   placeholder="Enter your bank name" style="margin-bottom: 12px;">
            <input type="text" class="form-input" id="bankAccount" 
                   placeholder="Enter your account number">
            <div class="form-info">ℹ️ Double-check your account details to avoid delays</div>
        </div>
    `;
}

function buildMPesaForm(container) {
    container.innerHTML = `
        <div class="form-group">
            <label class="form-label">M-Pesa Account Details</label>
            <input type="tel" class="form-input" id="mpesaPhone" 
                   placeholder="Enter M-Pesa number (e.g., +254712345678)">
            <div class="form-info">ℹ️ Ensure this is your registered M-Pesa number</div>
        </div>
    `;
}

function buildSkrillForm(container) {
    container.innerHTML = `
        <div class="form-group">
            <label class="form-label">Skrill Account Details</label>
            <input type="email" class="form-input" id="skrillEmail" 
                   placeholder="Enter your Skrill email address">
            <div class="form-info">ℹ️ Use the email registered with your Skrill account</div>
        </div>
    `;
}

// ================== WITHDRAWAL PROCESSING ==================
function handleWithdraw() {
    // Validate amount
    const amountInput = document.getElementById('amount');
    const amount = parseFloat(amountInput.value);
    
    if (!amountInput.value.trim() || isNaN(amount)) {
        showToast('Please enter withdrawal amount');
        return;
    }
    
    if (amount < state.minWithdrawal) {
        showToast(`Minimum withdrawal is $ ${state.minWithdrawal}`);
        return;
    }
    
    if (amount > state.balance) {
        showToast(`Insufficient balance. Available: $ ${state.balance.toFixed(2)}`);
        return;
    }
    
    if (!state.selectedPaymentMethod) {
        showToast('Please select a payment method');
        return;
    }
    
    // Validate account details
    const accountDetails = validateAccountDetails();
    if (!accountDetails) {
        return; // Error message already shown in validateAccountDetails
    }
    
    // Process withdrawal
    processWithdrawal(amount, accountDetails);
}

function validateAccountDetails() {
    switch (state.selectedPaymentMethod) {
        case 'PayPal':
            const paypalEmail = document.getElementById('paypalEmail');
            if (!paypalEmail || !paypalEmail.value.trim()) {
                showToast('Please enter your PayPal email');
                return null;
            }
            if (!validateEmail(paypalEmail.value.trim())) {
                showToast('Please enter a valid email address');
                return null;
            }
            return paypalEmail.value.trim();
            
        case 'Bank Transfer':
            const bankName = document.getElementById('bankName');
            const bankAccount = document.getElementById('bankAccount');
            if (!bankName || !bankName.value.trim() || !bankAccount || !bankAccount.value.trim()) {
                showToast('Please enter your bank name and account number');
                return null;
            }
            return `${bankName.value.trim()} | Acc: ${bankAccount.value.trim()}`;
            
        case 'M-Pesa':
            const mpesaPhone = document.getElementById('mpesaPhone');
            if (!mpesaPhone || !mpesaPhone.value.trim()) {
                showToast('Please enter your M-Pesa phone number');
                return null;
            }
            return mpesaPhone.value.trim();
            
        case 'Skrill':
            const skrillEmail = document.getElementById('skrillEmail');
            if (!skrillEmail || !skrillEmail.value.trim()) {
                showToast('Please enter your Skrill email');
                return null;
            }
            if (!validateEmail(skrillEmail.value.trim())) {
                showToast('Please enter a valid email address');
                return null;
            }
            return skrillEmail.value.trim();
            
        default:
            return null;
    }
}

function validateEmail(email) {
    return email.includes('@') && email.includes('.') && 
           email.indexOf('@') < email.lastIndexOf('.');
}

function processWithdrawal(amount, accountDetails) {
    try {
        showLoading();
        
        setTimeout(() => {
            hideLoading();
            
            // Generate transaction details
            const transactionID = generateTransactionID();
            const withdrawalDate = formatWithdrawalDate();
            
            // Get existing data
            const transIDs = getTransactionIDs();
            const dates = getTransactionDates();
            const amounts = getTransactionAmounts();
            const statuses = getTransactionStatuses();
            
            // Add new transaction
            transIDs.push(transactionID);
            dates.push(withdrawalDate);
            amounts.push(amount);
            
            // Determine status
            let status;
            if (isPaymentDay()) {
                statuses.push('Completed');
                status = 'Completed - Payment processed instantly!';
            } else {
                statuses.push('Pending');
                status = 'Pending - Will be processed on 1st or 15th';
            }
            
            // Save to localStorage
            localStorage.setItem('transactionid', JSON.stringify(transIDs));
            localStorage.setItem('datelist', JSON.stringify(dates));
            localStorage.setItem('haswithdrawn', JSON.stringify(amounts));
            localStorage.setItem('hascleared', JSON.stringify(statuses));
            
            // Deduct from balance
            state.balance -= amount;
            localStorage.setItem('earnings', JSON.stringify([state.balance]));
            updateBalanceDisplay();
            
            // Show success popup
            showSuccessPopup(accountDetails, amount, status);
            
            // Clear form
            clearForm();
            
        }, 2000);
        
    } catch (error) {
        hideLoading();
        showToast('Error processing withdrawal. Please try again.');
        console.error('Withdrawal error:', error);
    }
}

function getTransactionDates() {
    const data = localStorage.getItem('datelist');
    return data ? JSON.parse(data) : [];
}

function generateTransactionID() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `TXN${timestamp}${random}`;
}

function formatWithdrawalDate() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
}

// ================== SUCCESS POPUP ==================
function showSuccessPopup(accountDetails, amount, status) {
    const messageEl = document.getElementById('successMessage');
    const accountEl = document.getElementById('successAccount');
    
    messageEl.innerHTML = `
        Your withdrawal request of $ ${amount.toFixed(2)} via ${state.selectedPaymentMethod} has been submitted.
        <br><br>
        Status: ${status}
    `;
    
    accountEl.textContent = `To: ${accountDetails}`;
    
    document.getElementById('successOverlay').classList.add('active');
}

function closeSuccessPopup() {
    document.getElementById('successOverlay').classList.remove('active');
}

function proceedToDashboard() {
    closeSuccessPopup();
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        console.log('Navigating to dashboard...');
         window.location.href = 'dashboard.html';
    }, 2000);
}

// ================== FORM MANAGEMENT ==================
function clearForm() {
    document.getElementById('amount').value = '';
    
    state.selectedPaymentMethod = '';
    state.selectedPaymentIcon = '';
    
    const selector = document.getElementById('paymentMethodSelector');
    selector.textContent = 'Select payment method';
    selector.classList.remove('selected');
    selector.classList.add('placeholder');
    
    const detailsContainer = document.getElementById('accountDetails');
    detailsContainer.innerHTML = '';
    detailsContainer.classList.remove('visible');
}

// ================== NAVIGATION ==================
function navigateHome() {
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        console.log('Navigating to dashboard...');
         window.location.href = 'dashboard.html';
    }, 1000);
}

function navigateTransactions() {
    showLoading();
    
    setTimeout(() => {
        hideLoading();
       // alert('Opening transactions history...');
        console.log('Navigating to transactions...');
         window.location.href = 'transactions.html';
    }, 1000);
}

function navigateProfile() {
    showLoading();
    
    setTimeout(() => {
        hideLoading();
       // alert('Opening profile...');
        console.log('Navigating to profile...');
         window.location.href = 'profile.html';
    }, 1000);
}

function goBack() {
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        console.log('Returning to dashboard...');
         window.location.href = 'dashboard.html';
    }, 1500);
}

// ================== UI HELPERS ==================
function showLoading() {
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// ================== UTILITY FUNCTIONS ==================
// Function to set balance for testing
function setBalance(amount) {
    state.balance = amount;
    localStorage.setItem('earnings', JSON.stringify([amount]));
    updateBalanceDisplay();
    console.log(`Balance set to $${amount}`);
}

// Function to add sample transaction
function addSampleWithdrawal(amount = 100, method = 'PayPal', account = 'test@example.com') {
    const transIDs = getTransactionIDs();
    const dates = getTransactionDates();
    const amounts = getTransactionAmounts();
    const statuses = getTransactionStatuses();
    
    transIDs.push(generateTransactionID());
    dates.push(formatWithdrawalDate());
    amounts.push(amount);
    statuses.push('Pending');
    
    localStorage.setItem('transactionid', JSON.stringify(transIDs));
    localStorage.setItem('datelist', JSON.stringify(dates));
    localStorage.setItem('haswithdrawn', JSON.stringify(amounts));
    localStorage.setItem('hascleared', JSON.stringify(statuses));
    
    console.log(`Added sample withdrawal: $${amount} via ${method}`);
}

// Function to activate account for testing
function activateAccountForTest() {
    localStorage.setItem('activated', JSON.stringify(['active']));
    console.log('Account activated');
    updateNotificationBell();
}

// Function to get withdrawal data
function getWithdrawalData() {
    return {
        balance: state.balance,
        minWithdrawal: state.minWithdrawal,
        selectedMethod: state.selectedPaymentMethod,
        transactions: {
            ids: getTransactionIDs(),
            dates: getTransactionDates(),
            amounts: getTransactionAmounts(),
            statuses: getTransactionStatuses()
        },
        isActivated: state.isActivated,
        hasFailedTransactions: state.hasFailedTransactions
    };
}

// Expose utility functions globally for testing
window.withdrawUtils = {
    setBalance: setBalance,
    addSampleWithdrawal: addSampleWithdrawal,
    activateAccountForTest: activateAccountForTest,
    getWithdrawalData: getWithdrawalData,
    processPaymentDay: processPaymentDay,
    clearForm: clearForm
};
