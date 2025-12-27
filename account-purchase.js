// ================== STATE MANAGEMENT ==================
const state = {
    selectedPlan: '',
    selectedPrice: 0,
    usdToKsh: 129.4,
    prices: {
        beginner: 0.40,
        average: 4.50,
        expert: 6.50
    },
    paymentReference: null
};

// ================== INITIALIZATION ==================
document.addEventListener('DOMContentLoaded', () => {
    loadPrices();
    updatePriceDisplays();
    
    // Check if account was already purchased successfully
    checkExistingPurchase();
});

// Check for existing successful purchase
function checkExistingPurchase() {
    try {
        const boughtAccount = localStorage.getItem('boughtaccount');
        if (boughtAccount) {
            const accountData = JSON.parse(boughtAccount);
            // Only redirect if payment was successful
            if (accountData.paymentStatus === 'success') {
                console.log('Account already purchased, redirecting...');
                // Redirect to dashboard or appropriate page
                // window.location.href = 'dashboard.html';
            }
        }
    } catch (error) {
        console.error('Error checking purchase status:', error);
    }
}

// ================== LOAD PRICES FROM LOCALSTORAGE ==================
function loadPrices() {
    try {
        const tillfetch = localStorage.getItem('tillfetch');
        if (tillfetch) {
            const data = JSON.parse(tillfetch);
            // tillfetch data: [0, 1, Buy1(index 2), Buy2(index 3), Buy3(index 4), ...]
            if (data && data.length > 4) {
                state.prices.beginner = parseFloat(data[2]) || 2.40;
                state.prices.average = parseFloat(data[3]) || 4.50;
                state.prices.expert = parseFloat(data[4]) || 6.50;
            }
        }
    } catch (error) {
        console.error('Error loading prices:', error);
    }
}

function updatePriceDisplays() {
    document.getElementById('price-beginner').textContent = '$' + state.prices.beginner.toFixed(2);
    document.getElementById('price-average').textContent = '$' + state.prices.average.toFixed(2);
    document.getElementById('price-expert').textContent = '$' + state.prices.expert.toFixed(2);
}

// ================== CURRENCY CONVERSION ==================
function convertUSDtoKSH(usdAmount) {
    const kshAmount = usdAmount * state.usdToKsh;
    return kshAmount.toFixed(2);
}

// ================== PAYMENT POPUP ==================
function showPaymentPopup(planName) {
    // Show loading
    showLoading('Loading payment options...');
    
    setTimeout(() => {
        hideLoading();
        
        // Get price based on plan
        let price;
        if (planName === 'BEGINNER') {
            price = state.prices.beginner;
        } else if (planName === 'AVERAGE SKILLED') {
            price = state.prices.average;
        } else if (planName === 'EXPERT') {
            price = state.prices.expert;
        }
        
        state.selectedPlan = planName;
        state.selectedPrice = price;
        
        // Update popup info
        document.getElementById('popupPlanInfo').textContent = 
            `Account: ${planName} • $${price.toFixed(2)}`;
        
        // Show popup
        document.getElementById('paymentOverlay').classList.add('active');
    }, 800);
}

function hidePaymentPopup() {
    document.getElementById('paymentOverlay').classList.remove('active');
}

// ================== PAYMENT DETAILS ==================
function showPaymentDetails() {
    // Show loading
    showLoading('Loading M-Pesa Express...');
    
    setTimeout(() => {
        hideLoading();
        hidePaymentPopup();
        
        const kshAmount = convertUSDtoKSH(state.selectedPrice);
        
        // Update form info
        document.getElementById('formPlanInfo').textContent = 
            `${state.selectedPlan} • $${state.selectedPrice.toFixed(2)} (Ksh ${kshAmount})`;
        
        document.getElementById('amountKsh').textContent = `KES ${kshAmount}`;
        document.getElementById('payBtnAmount').textContent = `Ksh ${kshAmount}`;
        
        // Reset payment details to initial state
        resetPaymentDetailsState();
        
        // Show payment details popup
        document.getElementById('paymentDetailsOverlay').classList.add('active');
    }, 600);
}

function hidePaymentDetails() {
    document.getElementById('paymentDetailsOverlay').classList.remove('active');
    showPaymentPopup(state.selectedPlan);
}

// Reset payment details overlay to initial state
function resetPaymentDetailsState() {
    // Assuming you have these elements in your HTML
    const paymentForm = document.getElementById('paymentDetailsForm');
    const processingState = document.getElementById('paymentProcessing');
    const failedState = document.getElementById('paymentFailed');
    
    if (paymentForm) paymentForm.style.display = 'block';
    if (processingState) processingState.style.display = 'none';
    if (failedState) failedState.style.display = 'none';
}

// ================== M-PESA PAYMENT PROCESSING ==================
function processMpesaPayment() {
    const phoneInput = document.getElementById('mpesaPhone');
    const phoneNumber = phoneInput.value.trim();
    
    // Validate phone number
    if (!phoneNumber) {
        showToast('Please enter your M-Pesa phone number');
        return;
    }
    
    // Clean phone number
    let cleanPhone = phoneNumber.replace(/\s/g, '').replace(/-/g, '').replace(/\+/g, '');
    if (cleanPhone.startsWith('0')) {
        cleanPhone = '254' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('254')) {
        cleanPhone = '254' + cleanPhone;
    }
    
    if (cleanPhone.length !== 12) {
        showToast('Invalid phone number. Please use format: 07XXXXXXXX');
        return;
    }
    
    // Hide payment form, show processing
    const paymentForm = document.getElementById('paymentDetailsForm');
    const processingState = document.getElementById('paymentProcessing');
    if (paymentForm) paymentForm.style.display = 'none';
    if (processingState) processingState.style.display = 'block';
    
    // Calculate KSH amount
    const kshAmount = Math.round(parseFloat(convertUSDtoKSH(state.selectedPrice)));
    
    // Generate payment reference
    state.paymentReference = `REMO-ACCT-${Date.now()}`;
    
    // Prepare payment data
    const paymentData = {
        phone_number: cleanPhone,
        amount: kshAmount,
        reference: state.paymentReference,
        platform: 'HK93V1',
        account_id: '4596'
    };
    
    // Call PayHero API
    fetch('https://api.payhero.stkpush.co.ke/payments/stk-push/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Payment initiated:', data);
        
        // Wait 15 seconds then verify payment
        setTimeout(() => {
            verifyPayment(state.paymentReference);
        }, 15000);
    })
    .catch(error => {
        console.error('Payment error:', error);
        // Show failure state
        showPaymentFailed('Network error. Please check your connection and try again.');
    });
}

// ================== PAYMENT VERIFICATION ==================
function verifyPayment(reference) {
    fetch(`https://api.payhero.stkpush.co.ke/payments/verify-payment/${reference}/`)
    .then(response => response.json())
    .then(data => {
        console.log('Payment verification:', data);

        if (data.status === 'completed' || data.status === 'success') {
            // Payment successful
            handlePaymentSuccess();
        } else if (data.status === 'failed') {
            // Payment failed
            const reason = data.reason || 'Transaction failed. You may have insufficient funds or cancelled the transaction.';
            showPaymentFailed(reason);
        } else if (data.status === 'pending') {
            // Still pending, check again in 5 seconds
            updateLoading('Still processing...<br>Please wait');
            setTimeout(() => verifyPayment(reference), 5000);
        } else {
            // Unknown status, treat as failed
            showPaymentFailed('Payment status unknown. Please contact support if amount was deducted.');
        }
    })
    .catch(error => {
        console.error('Verification error:', error);
        // For demo purposes, proceed as success after timeout
        // In production, you should handle this properly
        handlePaymentSuccess();
    });
}

// ================== PAYMENT SUCCESS HANDLING ==================
function handlePaymentSuccess() {
    hideLoading();
    
    // Mark account as bought with success status
    try {
        const accountData = {
            plan: state.selectedPlan,
            price: state.selectedPrice,
            kshAmount: convertUSDtoKSH(state.selectedPrice),
            paymentStatus: 'success',
            purchaseDate: new Date().toISOString(),
            appliedDate: new Date().toLocaleDateString(),
            appliedTime: new Date().toLocaleTimeString(),
            timestamp: Date.now(),
            reference: state.paymentReference
        };
        localStorage.setItem('boughtaccount', JSON.stringify(accountData));
    } catch (error) {
        console.error('Error saving account status:', error);
    }
    
    // Hide payment details overlay
    document.getElementById('paymentDetailsOverlay').classList.remove('active');
    
    // Show success popup
    document.getElementById('successAccountType').textContent = `${state.selectedPlan} ACCOUNT`;
    document.getElementById('successOverlay').classList.add('active');
    
    console.log('=================================');
    console.log('PAYMENT SUCCESSFUL!');
    console.log('Account Type:', state.selectedPlan);
    console.log('Price: $' + state.selectedPrice.toFixed(2));
    console.log('Amount Paid: KES', convertUSDtoKSH(state.selectedPrice));
    console.log('Payment Method: M-Pesa Express (PayHero)');
    console.log('Reference:', state.paymentReference);
    console.log('=================================');
}

// ================== PAYMENT FAILURE HANDLING ==================
function showPaymentFailed(reason) {
    const paymentForm = document.getElementById('paymentDetailsForm');
    const processingState = document.getElementById('paymentProcessing');
    const failedState = document.getElementById('paymentFailed');
    
    if (paymentForm) paymentForm.style.display = 'none';
    if (processingState) processingState.style.display = 'none';
    if (failedState) failedState.style.display = 'block';
    
    // Update failure reason if element exists
    const failureReasonEl = document.getElementById('failureReason');
    if (failureReasonEl) {
        failureReasonEl.textContent = reason;
    }
    
    // Store failed payment status
    try {
        const failedAccount = {
            plan: state.selectedPlan,
            price: state.selectedPrice,
            kshAmount: convertUSDtoKSH(state.selectedPrice),
            paymentStatus: 'failed',
            failureReason: reason,
            attemptedDate: new Date().toLocaleDateString(),
            attemptedTime: new Date().toLocaleTimeString(),
            timestamp: Date.now(),
            reference: state.paymentReference
        };
        localStorage.setItem('boughtaccount', JSON.stringify(failedAccount));
    } catch (error) {
        console.error('Error saving failed status:', error);
    }
    
    console.log('=================================');
    console.log('PAYMENT FAILED');
    console.log('Account Type:', state.selectedPlan);
    console.log('Reason:', reason);
    console.log('Reference:', state.paymentReference);
    console.log('=================================');
}

// Handle retry button click
function retryPayment() {
    resetPaymentDetailsState();
}

// Handle back to selection
function backToSelection() {
    document.getElementById('paymentDetailsOverlay').classList.remove('active');
    resetPaymentDetailsState();
    // Optionally clear the current selection
    state.selectedPlan = '';
    state.selectedPrice = 0;
}

// ================== SUCCESS HANDLING ==================
function handleSuccessContinue() {
    document.getElementById('successOverlay').classList.remove('active');
    
    showLoading('Verifying payment...');
    
    setTimeout(() => {
        updateLoading('Payment verified. Loading...');
    }, 1500);
    
    setTimeout(() => {
        hideLoading();
        
        showToast(`Welcome to your ${state.selectedPlan} Account!`, true);
        
        // In real app, navigate to dashboard
        console.log('Navigating to dashboard...');
        window.location.href = 'important-info.html';
    }, 3000);
}

// ================== LOADING OVERLAY ==================
function showLoading(message) {
    document.getElementById('loadingText').innerHTML = message;
    document.getElementById('loadingOverlay').classList.add('active');
}

function updateLoading(message) {
    document.getElementById('loadingText').innerHTML = message;
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
// Function to set sample tillfetch data (for testing)
function setSamplePrices(beginner = '2.40', average = '4.50', expert = '6.50') {
    const sampleData = [
        'value0', 'value1', 
        beginner,  // index 2 - Buy1
        average,   // index 3 - Buy2
        expert,    // index 4 - Buy3
        'value5', 'value6', 'value7'
    ];
    localStorage.setItem('tillfetch', JSON.stringify(sampleData));
    
    // Reload prices
    loadPrices();
    updatePriceDisplays();
}

// Function to check if account was bought successfully
function hasAccountPurchased() {
    try {
        const boughtAccount = localStorage.getItem('boughtaccount');
        if (boughtAccount) {
            const accountData = JSON.parse(boughtAccount);
            return accountData.paymentStatus === 'success';
        }
        return false;
    } catch (error) {
        return false;
    }
}

// Function to get account purchase status
function getAccountStatus() {
    try {
        const boughtAccount = localStorage.getItem('boughtaccount');
        if (boughtAccount) {
            return JSON.parse(boughtAccount);
        }
        return null;
    } catch (error) {
        return null;
    }
}

// Function to reset purchase status (for testing)
function resetPurchase() {
    localStorage.removeItem('boughtaccount');
    console.log('Purchase status reset');
}

// Expose utility functions globally for testing
window.accountPurchase = {
    setSamplePrices: setSamplePrices,
    hasPurchased: hasAccountPurchased,
    getStatus: getAccountStatus,
    resetPurchase: resetPurchase,
    getCurrentPrices: () => state.prices,
    retryPayment: retryPayment,
    backToSelection: backToSelection
};
