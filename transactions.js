// ================== STATE MANAGEMENT ==================
const state = {
    currentFilter: 'all',
    transactions: [],
    isActivated: false,
    hasFailedTransactions: false
};

// ================== INITIALIZATION ==================
document.addEventListener('DOMContentLoaded', () => {
    processPaymentDay();
    loadTransactions();
    displayTransactions('all');
    updateNotificationBell();
});

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

function getTransactionDates() {
    const data = localStorage.getItem('datelist');
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
        badge.classList.add('green');
        badge.style.display = 'flex';
    } else if (state.hasFailedTransactions) {
        // RED bell - Failed transactions + not activated
        bell.classList.add('visible');
        bell.classList.remove('green');
        badge.classList.remove('green');
        badge.style.display = 'flex';
    } else {
        // No bell
        bell.classList.remove('visible');
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
        //alert('Opening account activation...');
        console.log('Navigating to account activation page...');
        window.location.href = 'activate-account.html';
    }, 1500);
}

// ================== TRANSACTION LOADING ==================
function loadTransactions() {
    const ids = getTransactionIDs();
    const dates = getTransactionDates();
    const amounts = getTransactionAmounts();
    const statuses = getTransactionStatuses();
    
    // Ensure arrays are same length
    while (dates.length < ids.length) {
        dates.push('--/--/----');
    }
    while (amounts.length < ids.length) {
        amounts.push(0);
    }
    while (statuses.length < ids.length) {
        statuses.push('Pending');
    }
    
    // Build transactions array
    state.transactions = [];
    for (let i = 0; i < ids.length; i++) {
        state.transactions.push({
            id: ids[i],
            date: dates[i],
            amount: parseFloat(amounts[i]) || 0,
            status: statuses[i]
        });
    }
}

// ================== TRANSACTION DISPLAY ==================
function displayTransactions(filter) {
    state.currentFilter = filter;
    updateFilterButtons();
    
    const listEl = document.getElementById('transactionsList');
    listEl.innerHTML = '';
    
    if (state.transactions.length === 0) {
        showEmptyState(filter);
        updateSummaryCards();
        return;
    }
    
    // Filter and reverse (show newest first)
    const filtered = state.transactions.filter(trans => {
        switch (filter) {
            case 'all':
                return true;
            case 'pending':
                return trans.status === 'Pending';
            case 'completed':
                return trans.status === 'Completed';
            case 'failed':
                return trans.status === 'Failed';
            default:
                return true;
        }
    }).reverse();
    
    if (filtered.length === 0) {
        showEmptyState(filter);
    } else {
        filtered.forEach(trans => {
            const card = createTransactionCard(trans);
            listEl.appendChild(card);
        });
    }
    
    updateSummaryCards();
}

function createTransactionCard(transaction) {
    const card = document.createElement('div');
    card.className = 'transaction-card';
    
    // Status styling
    let statusClass = 'status-pending';
    let statusText = '⏳ Pending';
    
    switch (transaction.status) {
        case 'Completed':
            statusClass = 'status-completed';
            statusText = '✓ Completed';
            break;
        case 'Failed':
            statusClass = 'status-failed';
            statusText = '✗ Failed';
            break;
    }
    
    card.innerHTML = `
        <div class="transaction-id">ID: ${transaction.id}</div>
        <div class="transaction-amount">$ ${transaction.amount.toFixed(2)}</div>
        <div class="transaction-footer">
            <span class="status-badge ${statusClass}">${statusText}</span>
            <span class="transaction-date">📅 ${transaction.date}</span>
        </div>
    `;
    
    return card;
}

function showEmptyState(filter) {
    const listEl = document.getElementById('transactionsList');
    listEl.innerHTML = '';
    
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    
    let emptyText = 'No transactions yet';
    switch (filter) {
        case 'pending':
            emptyText = 'No pending transactions';
            break;
        case 'completed':
            emptyText = 'No completed transactions';
            break;
        case 'failed':
            emptyText = 'No failed transactions';
            break;
    }
    
    emptyState.innerHTML = `
        <div class="empty-icon">📭</div>
        <div class="empty-text">${emptyText}</div>
        <div class="empty-hint">Make a withdrawal to see it here</div>
    `;
    
    listEl.appendChild(emptyState);
}

// ================== SUMMARY CARDS ==================
function updateSummaryCards() {
    let totalWithdrawn = 0;
    let pendingAmount = 0;
    let completedCount = 0;
    
    state.transactions.forEach(trans => {
        // Don't count failed transactions in total
        if (trans.status !== 'Failed') {
            totalWithdrawn += trans.amount;
        }
        
        if (trans.status === 'Pending') {
            pendingAmount += trans.amount;
        } else if (trans.status === 'Completed') {
            completedCount++;
        }
    });
    
    document.getElementById('totalWithdrawn').textContent = `$ ${totalWithdrawn.toFixed(2)}`;
    document.getElementById('pendingAmount').textContent = `$ ${pendingAmount.toFixed(2)}`;
    document.getElementById('completedCount').textContent = completedCount;
}

// ================== FILTER BUTTONS ==================
function filterTransactions(filter) {
    displayTransactions(filter);
}

function updateFilterButtons() {
    // Remove active class from all buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to current filter
    switch (state.currentFilter) {
        case 'all':
            document.getElementById('btnAll').classList.add('active');
            break;
        case 'pending':
            document.getElementById('btnPending').classList.add('active');
            break;
        case 'completed':
            document.getElementById('btnCompleted').classList.add('active');
            break;
        case 'failed':
            document.getElementById('btnFailed').classList.add('active');
            break;
    }
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

function navigateWithdraw() {
    showLoading();
    
    setTimeout(() => {
        hideLoading();
      //  alert('Opening withdraw page...');
        console.log('Navigating to withdraw...');
        window.location.href = 'withdraw.html';
    }, 1000);
}

function navigateProfile() {
    showLoading();
    
    setTimeout(() => {
        hideLoading();
      //  alert('Opening profile...');
        console.log('Navigating to profile...');
         window.location.href = 'profile.html';
    }, 1000);
}

// ================== LOADING OVERLAY ==================
function showLoading() {
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

// ================== UTILITY FUNCTIONS ==================
// Function to add sample transactions
function addSampleTransactions() {
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    
    const sampleIDs = ['TXN001', 'TXN002', 'TXN003', 'TXN004', 'TXN005'];
    const sampleDates = [dateStr, dateStr, dateStr, dateStr, dateStr];
    const sampleAmounts = [25.00, 50.00, 75.00, 100.00, 150.00];
    const sampleStatuses = ['Completed', 'Completed', 'Pending', 'Pending', 'Failed'];
    
    localStorage.setItem('transactionid', JSON.stringify(sampleIDs));
    localStorage.setItem('datelist', JSON.stringify(sampleDates));
    localStorage.setItem('haswithdrawn', JSON.stringify(sampleAmounts));
    localStorage.setItem('hascleared', JSON.stringify(sampleStatuses));
    
    console.log('Sample transactions added');
    location.reload();
}

// Function to add a pending transaction
function addPendingTransaction(amount) {
    const ids = getTransactionIDs();
    const dates = getTransactionDates();
    const amounts = getTransactionAmounts();
    const statuses = getTransactionStatuses();
    
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const newID = `TXN${String(ids.length + 1).padStart(3, '0')}`;
    
    ids.push(newID);
    dates.push(dateStr);
    amounts.push(amount);
    statuses.push('Pending');
    
    localStorage.setItem('transactionid', JSON.stringify(ids));
    localStorage.setItem('datelist', JSON.stringify(dates));
    localStorage.setItem('haswithdrawn', JSON.stringify(amounts));
    localStorage.setItem('hascleared', JSON.stringify(statuses));
    
    console.log(`Added pending transaction: ${newID} - $${amount}`);
    location.reload();
}

// Function to clear all transactions
function clearTransactions() {
    localStorage.removeItem('transactionid');
    localStorage.removeItem('datelist');
    localStorage.removeItem('haswithdrawn');
    localStorage.removeItem('hascleared');
    console.log('All transactions cleared');
    location.reload();
}

// Function to simulate payment day processing
function simulatePaymentDay() {
    console.log('Simulating payment day processing...');
    processPaymentDay();
    loadTransactions();
    displayTransactions(state.currentFilter);
    updateNotificationBell();
    //alert('Payment day processed. Check console for details.');
}

// Function to activate account for testing
function activateAccountForTest() {
    localStorage.setItem('activated', JSON.stringify(['active']));
    console.log('Account activated');
    location.reload();
}

// Function to get transaction statistics
function getStats() {
    const stats = {
        total: state.transactions.length,
        completed: state.transactions.filter(t => t.status === 'Completed').length,
        pending: state.transactions.filter(t => t.status === 'Pending').length,
        failed: state.transactions.filter(t => t.status === 'Failed').length,
        totalAmount: state.transactions.reduce((sum, t) => t.status !== 'Failed' ? sum + t.amount : sum, 0),
        pendingAmount: state.transactions.filter(t => t.status === 'Pending').reduce((sum, t) => sum + t.amount, 0)
    };
    
    console.log('Transaction Statistics:', stats);
    return stats;
}

// Expose utility functions globally for testing
window.transactionsUtils = {
    addSampleTransactions: addSampleTransactions,
    addPendingTransaction: addPendingTransaction,
    clearTransactions: clearTransactions,
    simulatePaymentDay: simulatePaymentDay,
    activateAccountForTest: activateAccountForTest,
    getStats: getStats,
    refundBalance: refundBalance
};
