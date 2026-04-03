// ================== STATE MANAGEMENT ==================
const state = {
    referralCode: '',
    shareCount: 0,
    totalReferrals: 0,
    activatedReferrals: 0,
    totalEarnings: 0,
    referralEarnings: 0,
    popupType: 'activation', // 'activation' or 'upgrade'
    checkInterval: null
};

const REFERRAL_EARNINGS_PER_ACTIVATION = 5; // $5 per activated referral
const DELAY_HOURS = 2; // 2 hour delay for display
const CHECK_INTERVAL = 5000; // Check every 5 seconds

// ================== INITIALIZATION ==================
document.addEventListener('DOMContentLoaded', () => {
    initializeReferralCode();
    loadAccountStatus();
    checkAndProcessPendingEarnings();
    checkAndProcessPendingReferrals();
    updateDisplay();
    
    // Start timer for checking pending data
    state.checkInterval = setInterval(() => {
        checkAndProcessPendingEarnings();
        checkAndProcessPendingReferrals();
    }, CHECK_INTERVAL);
});

// ================== REFERRAL CODE MANAGEMENT ==================
function initializeReferralCode() {
    // Try to load existing code
    let code = localStorage.getItem('referral_code');
    
    if (!code) {
        // Generate new 8-character code
        code = generateReferralCode();
        localStorage.setItem('referral_code', code);
    }
    
    state.referralCode = code;
    document.getElementById('referralCode').textContent = code;
}

function generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    
    for (let i = 0; i < 8; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        code += chars[randomIndex];
    }
    
    return code;
}

function copyReferralCode() {
    // Create temporary input
    const tempInput = document.createElement('input');
    tempInput.value = state.referralCode;
    document.body.appendChild(tempInput);
    
    // Select and copy
    tempInput.select();
    tempInput.setSelectionRange(0, 99999);
    
    try {
        document.execCommand('copy');
        showToast(`Referral code copied: ${state.referralCode}`);
    } catch (error) {
        showToast('Failed to copy referral code');
    }
    
    // Remove temporary input
    document.body.removeChild(tempInput);
}

// ================== ACCOUNT STATUS ==================
function loadAccountStatus() {
    // Load activation status from tillfetch
    const tillfetch = localStorage.getItem('tillfetch');
    if (tillfetch) {
        try {
            const data = JSON.parse(tillfetch);
            if (data.length >= 13) {
                state.activateacc = parseFloat(data[12]) || 5;
            }
        } catch (error) {
            console.error('Error loading account status:', error);
        }
    }
}

function isAccountActivated() {
    return localStorage.getItem('activate') !== null;
}

function isAccountUpgraded() {
    return localStorage.getItem('upgrade') !== null;
}

function hasReferralEarnings() {
    return localStorage.getItem('refearnings') !== null;
}

// ================== SHARE FUNCTIONALITY ==================
function handleShare() {
    const shareCount = getShareCount();
    const activateacc = state.activateacc || 5;
    
    // Check if can share based on activation/upgrade status
    if (activateacc > 10) {
        if (isAccountActivated() || shareCount < 10) {
            if (isAccountUpgraded()) {
                processShare();
            } else if (shareCount <= 14) {
                processShare();
            } else {
                if (hasReferralEarnings()) {
                    showUpgradePopup();
                } else {
                    shareApp();
                }
            }
        } else {
            showActivationPopup();
        }
    } else {
        if (isAccountUpgraded()) {
            processShare();
        } else if (shareCount <= 14) {
            processShare();
        } else {
            if (hasReferralEarnings()) {
                showUpgradePopup();
            } else {
                shareApp();
            }
        }
    }
}

function processShare() {
    incrementShareCount();
    updateDisplay();
    shareApp();
}

function shareApp() {
    const appName = 'REMO-TASK';
    const packageName = 'com.example.remotask'; // Adjust as needed
    const marketLink = `https://play.google.com/store/apps/details?id=${packageName}`;
    const referralMessage = `Join ${appName} using my referral code: ${state.referralCode}\n\nEarn money by training AI!\n\n${marketLink}`;
    
    // Check if Web Share API is available
    if (navigator.share) {
        navigator.share({
            title: `Join ${appName}`,
            text: referralMessage
        }).then(() => {
            console.log('Share successful');
        }).catch((error) => {
            console.log('Share failed or cancelled:', error);
            fallbackShare(referralMessage);
        });
    } else {
        fallbackShare(referralMessage);
    }
}

function fallbackShare(message) {
    // Fallback: copy to clipboard
    const tempInput = document.createElement('textarea');
    tempInput.value = message;
    document.body.appendChild(tempInput);
    tempInput.select();
    
    try {
        document.execCommand('copy');
        showToast('Share message copied to clipboard!');
    } catch (error) {
        showToast('Unable to share. Please copy manually.');
        console.log('Message to share:', message);
    }
    
    document.body.removeChild(tempInput);
}

// ================== SHARE COUNT MANAGEMENT ==================
function getShareCount() {
    const count = localStorage.getItem('share_count');
    return count ? parseInt(count) : 0;
}

function incrementShareCount() {
    let shareCount = getShareCount();
    shareCount++;
    
    localStorage.setItem('share_count', shareCount.toString());
    state.shareCount = shareCount;
    
    // Add pending referrals if within limit
    if (shareCount <= 10000) {
        const newReferrals = Math.floor(Math.random() * 2) + 1; // 1-2 referrals
        const clickTimestamp = Date.now();
        addToPendingReferralsWithTimestamp(newReferrals, clickTimestamp);
    }
}

// ================== PENDING REFERRALS SYSTEM ==================
function addToPendingReferralsWithTimestamp(newReferrals, clickTimestamp) {
    const displayTimestamp = clickTimestamp + (DELAY_HOURS * 60 * 60 * 1000); // 2 hours in ms
    
    let existingPending = 0;
    let existingTimestamp = 0;
    
    // Load existing pending data
    const pendingData = localStorage.getItem('pending_referrals_timestamp');
    if (pendingData) {
        try {
            const data = JSON.parse(pendingData);
            existingPending = data.referrals || 0;
            existingTimestamp = data.timestamp || 0;
        } catch (error) {
            console.error('Error loading pending referrals:', error);
        }
    }
    
    // Accumulate pending referrals
    const totalPending = existingPending + newReferrals;
    const finalTimestamp = existingTimestamp > 0 ? existingTimestamp : displayTimestamp;
    
    // Save pending data
    localStorage.setItem('pending_referrals_timestamp', JSON.stringify({
        referrals: totalPending,
        timestamp: finalTimestamp
    }));
    
    console.log(`Added ${newReferrals} pending referrals. Total pending: ${totalPending}. Will display at: ${new Date(finalTimestamp)}`);
}

function checkAndProcessPendingReferrals() {
    const currentTime = Date.now();
    const pendingData = localStorage.getItem('pending_referrals_timestamp');
    
    if (!pendingData) return;
    
    try {
        const data = JSON.parse(pendingData);
        const pendingReferrals = data.referrals || 0;
        const displayTimestamp = data.timestamp || 0;
        
        if (currentTime >= displayTimestamp && pendingReferrals > 0) {
            console.log(`Processing ${pendingReferrals} pending referrals...`);
            
            // Get current total
            let currentTotal = getTotalReferrals();
            currentTotal += pendingReferrals;
            
            // Save updated total
            localStorage.setItem('total_referrals', currentTotal.toString());
            state.totalReferrals = currentTotal;
            
            // Update earnings from activated referrals
            updateEarningsFromActivatedReferrals(currentTotal);
            
            // Clear pending data
            localStorage.removeItem('pending_referrals_timestamp');
            
            // Update display
            updateDisplay();
            
            console.log(`Processed ${pendingReferrals} referrals. New total: ${currentTotal}`);
        }
    } catch (error) {
        console.error('Error processing pending referrals:', error);
    }
}

function getTotalReferrals() {
    const total = localStorage.getItem('total_referrals');
    return total ? parseInt(total) : 0;
}

// ================== EARNINGS CALCULATIONS ==================
function updateEarningsFromActivatedReferrals(totalReferrals) {
    // Apply the complex calculation formula
    const adjustedTotalReferrals = Math.floor(totalReferrals * 0.4);
    const baseActivatedReferrals = Math.floor(adjustedTotalReferrals * 2 / 3);
    const intermediateActivatedReferrals = Math.floor(baseActivatedReferrals * 2 / 3);
    const finalActivatedReferrals = Math.floor(intermediateActivatedReferrals * 0.95);
    
    // Calculate earnings ($5 per activated referral)
    const newReferralEarnings = finalActivatedReferrals * REFERRAL_EARNINGS_PER_ACTIVATION;
    
    // Save referral earnings
    localStorage.setItem('referral_earnings', newReferralEarnings.toString());
    
    // Save activated referrals count
    localStorage.setItem('hasreferred', JSON.stringify([finalActivatedReferrals]));
    
    // Save to refearnings
    localStorage.setItem('refearnings', JSON.stringify([newReferralEarnings]));
    
    // Save to referralsdata
    localStorage.setItem('referralsdata', JSON.stringify([newReferralEarnings]));
    
    // Update total earnings
    let currentTotalEarnings = 0;
    const earningsData = localStorage.getItem('earnings');
    if (earningsData) {
        try {
            const earnings = JSON.parse(earningsData);
            currentTotalEarnings = parseFloat(earnings[0]) || 0;
        } catch (error) {
            console.error('Error loading earnings:', error);
        }
    }
    
    const updatedTotalEarnings = currentTotalEarnings + newReferralEarnings;
    
    // Save updated total earnings
    localStorage.setItem('earnings', JSON.stringify([updatedTotalEarnings]));
    saveDelayedDisplayEarnings(updatedTotalEarnings);
    
    console.log(`Earnings updated: ${finalActivatedReferrals} activated referrals × $${REFERRAL_EARNINGS_PER_ACTIVATION} = $${newReferralEarnings}`);
}

// ================== PENDING EARNINGS SYSTEM ==================
function saveDelayedDisplayEarnings(earnings) {
    localStorage.setItem('display_earnings', JSON.stringify([earnings]));
}

function getDelayedDisplayEarnings() {
    const data = localStorage.getItem('display_earnings');
    if (data) {
        try {
            const earnings = JSON.parse(data);
            return parseFloat(earnings[0]) || 0;
        } catch (error) {
            return 0;
        }
    }
    return 0;
}

function addToPendingEarningsWithTimestamp(earnings, clickTimestamp) {
    const displayTimestamp = clickTimestamp + (DELAY_HOURS * 60 * 60 * 1000);
    
    let existingPending = 0;
    let existingTimestamp = 0;
    
    const pendingData = localStorage.getItem('pending_earnings_timestamp');
    if (pendingData) {
        try {
            const data = JSON.parse(pendingData);
            existingPending = data.earnings || 0;
            existingTimestamp = data.timestamp || 0;
        } catch (error) {
            console.error('Error loading pending earnings:', error);
        }
    }
    
    const totalPending = existingPending + earnings;
    const finalTimestamp = existingTimestamp > 0 ? existingTimestamp : displayTimestamp;
    
    localStorage.setItem('pending_earnings_timestamp', JSON.stringify({
        earnings: totalPending,
        timestamp: finalTimestamp
    }));
}

function checkAndProcessPendingEarnings() {
    const currentTime = Date.now();
    const pendingData = localStorage.getItem('pending_earnings_timestamp');
    
    if (!pendingData) return;
    
    try {
        const data = JSON.parse(pendingData);
        const pendingEarnings = data.earnings || 0;
        const displayTimestamp = data.timestamp || 0;
        
        if (currentTime >= displayTimestamp && pendingEarnings > 0) {
            console.log(`Processing $${pendingEarnings} pending earnings...`);
            
            saveDelayedDisplayEarnings(pendingEarnings);
            localStorage.removeItem('pending_earnings_timestamp');
            
            updateDisplay();
            
            console.log(`Processed $${pendingEarnings} earnings`);
        }
    } catch (error) {
        console.error('Error processing pending earnings:', error);
    }
}

// ================== DISPLAY UPDATE ==================
function updateDisplay() {
    // Load all data
    const shareCount = getShareCount();
    const totalReferrals = getTotalReferrals();
    
    // Calculate displayed values
    const adjustedTotalReferrals = Math.floor(totalReferrals * 0.4);
    const baseActivatedReferrals = Math.floor(adjustedTotalReferrals * 2 / 3);
    const intermediateActivatedReferrals = Math.floor(baseActivatedReferrals * 2 / 3);
    const finalActivatedReferrals = Math.floor(intermediateActivatedReferrals * 0.95);
    
    // Get referral earnings
    let referralEarnings = 0;
    const refEarningsData = localStorage.getItem('refearnings');
    if (refEarningsData) {
        try {
            const data = JSON.parse(refEarningsData);
            referralEarnings = parseFloat(data[0]) || 0;
        } catch (error) {
            referralEarnings = 0;
        }
    }
    
    // Get total earnings
    const totalEarnings = getDelayedDisplayEarnings();
    
    // Update display
    document.getElementById('totalBalance').textContent = `$${totalEarnings.toFixed(2)}`;
    
    if (hasReferralEarnings()) {
        document.getElementById('totalReferrals').textContent = adjustedTotalReferrals;
        document.getElementById('activatedReferrals').textContent = finalActivatedReferrals;
        document.getElementById('totalEarned').textContent = Math.floor(referralEarnings);
    } else {
        document.getElementById('totalReferrals').textContent = '0';
        document.getElementById('activatedReferrals').textContent = '0';
        document.getElementById('totalEarned').textContent = '0';
    }
    
    // Update state
    state.shareCount = shareCount;
    state.totalReferrals = adjustedTotalReferrals;
    state.activatedReferrals = finalActivatedReferrals;
    state.totalEarnings = totalEarnings;
    state.referralEarnings = referralEarnings;
}

// ================== POPUP HANDLING ==================
function showActivationPopup() {
    state.popupType = 'activation';
    document.getElementById('popupMessage').innerHTML = 
        'Activate Account<br><br>Your account needs to be activated to continue earning from referrals.';
    document.getElementById('popupActionBtn').textContent = 'Activate Now';
    showPopup();
}

function showUpgradePopup() {
    state.popupType = 'upgrade';
    document.getElementById('popupMessage').innerHTML = 
        'Upgrade Account<br><br>Upgrade your account to unlock unlimited referral earnings!';
    document.getElementById('popupActionBtn').textContent = 'Upgrade Now';
    showPopup();
}

function showPopup() {
    document.getElementById('activationPopup').classList.add('active');
}

function closePopup() {
    document.getElementById('activationPopup').classList.remove('active');
}

function handlePopupAction() {
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        closePopup();
        
        if (state.popupType === 'activation') {
          //  alert('Opening account activation...');
            console.log('Navigate to activation page');
             window.location.href = 'activate-account.html';
        } else if (state.popupType === 'upgrade') {
            //alert('Opening account upgrade...');
            console.log('Navigate to upgrade page');
             window.location.href = 'activate-account.html';
        }
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

// ================== CLEANUP ==================
window.addEventListener('beforeunload', () => {
    if (state.checkInterval) {
        clearInterval(state.checkInterval);
    }
});

// ================== UTILITY FUNCTIONS ==================
// Function to simulate shares for testing
function simulateShares(count) {
    for (let i = 0; i < count; i++) {
        incrementShareCount();
    }
    updateDisplay();
    console.log(`Simulated ${count} shares`);
}

// Function to reset referral data
function resetReferralData() {
    localStorage.removeItem('share_count');
    localStorage.removeItem('total_referrals');
    localStorage.removeItem('referral_earnings');
    localStorage.removeItem('hasreferred');
    localStorage.removeItem('refearnings');
    localStorage.removeItem('referralsdata');
    localStorage.removeItem('display_earnings');
    localStorage.removeItem('pending_referrals_timestamp');
    localStorage.removeItem('pending_earnings_timestamp');
    
    state.shareCount = 0;
    state.totalReferrals = 0;
    state.activatedReferrals = 0;
    state.totalEarnings = 0;
    state.referralEarnings = 0;
    
    updateDisplay();
    console.log('Referral data reset');
}

// Function to force process pending data
function forceProcessPending() {
    checkAndProcessPendingEarnings();
    checkAndProcessPendingReferrals();
    updateDisplay();
    console.log('Forced processing of pending data');
}

// Function to get all referral data
function getReferralData() {
    return {
        referralCode: state.referralCode,
        shareCount: state.shareCount,
        totalReferrals: state.totalReferrals,
        activatedReferrals: state.activatedReferrals,
        totalEarnings: state.totalEarnings,
        referralEarnings: state.referralEarnings,
        pending: {
            referrals: localStorage.getItem('pending_referrals_timestamp'),
            earnings: localStorage.getItem('pending_earnings_timestamp')
        }
    };
}

// Function to activate account for testing
function activateAccountForTest() {
    localStorage.setItem('activate', JSON.stringify(['active']));
    console.log('Account activated');
}

// Function to upgrade account for testing
function upgradeAccountForTest() {
    localStorage.setItem('upgrade', JSON.stringify(['upgraded']));
    console.log('Account upgraded');
}

// Expose utility functions globally for testing
window.referralUtils = {
    simulateShares: simulateShares,
    resetReferralData: resetReferralData,
    forceProcessPending: forceProcessPending,
    getReferralData: getReferralData,
    activateAccountForTest: activateAccountForTest,
    upgradeAccountForTest: upgradeAccountForTest,
    copyCode: copyReferralCode,
    updateDisplay: updateDisplay
};
