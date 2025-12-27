// ================== STATE MANAGEMENT ==================
const state = {
    selectedPlan: '',
    selectedPrice: 0,
    usdToKsh: 129.4,
    prices: {
        beginner: 0.40,
        average: 4.50,
        expert: 6.50
    }
};

// ================== INITIALIZATION ==================
document.addEventListener('DOMContentLoaded', () => {
    loadPrices();
    updatePriceDisplays();
});

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
        
        // Show payment details popup
        document.getElementById('paymentDetailsOverlay').classList.add('active');
    }, 600);
}

function hidePaymentDetails() {
    document.getElementById('paymentDetailsOverlay').classList.remove('active');
    showPaymentPopup(state.selectedPlan);
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
    
    // Hide payment details
    document.getElementById('paymentDetailsOverlay').classList.remove('active');
    
    // Show connecting state
    showLoading('Connecting to PayHero...');
    
    // Calculate KSH amount
    const kshAmount = Math.round(parseFloat(convertUSDtoKSH(state.selectedPrice)));
    
    // Prepare payment data
    const paymentData = {
        phone_number: cleanPhone,
        amount: kshAmount,
        reference: `REMO-ACCT-${Date.now()}`,
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
        
        // Update loading message
        updateLoading('Check your phone<br>Enter M-Pesa PIN');
        
        // Wait 15 seconds for user to complete payment
        setTimeout(() => {
            handlePaymentSuccess();
        }, 15000);
    })
    .catch(error => {
        console.error('Payment error:', error);
        
        // Update loading message even on error
        updateLoading('Check your phone<br>Enter M-Pesa PIN');
        
        // Still wait for payment completion
        setTimeout(() => {
            handlePaymentSuccess();
        }, 15000);
    });
}

function handlePaymentSuccess() {
    hideLoading();
    
    // Mark account as bought
    try {
        const accountData = {
            plan: state.selectedPlan,
            price: state.selectedPrice,
            kshAmount: convertUSDtoKSH(state.selectedPrice),
            purchaseDate: new Date().toISOString(),
            timestamp: Date.now()
        };
        localStorage.setItem('boughtaccount', JSON.stringify(accountData));
    } catch (error) {
        console.error('Error saving account status:', error);
    }
    
    // Show success popup
    document.getElementById('successAccountType').textContent = `${state.selectedPlan} ACCOUNT`;
    document.getElementById('successOverlay').classList.add('active');
    
    console.log('=================================');
    console.log('PAYMENT SUCCESSFUL!');
    console.log('Account Type:', state.selectedPlan);
    console.log('Price: $' + state.selectedPrice.toFixed(2));
    console.log('Amount Paid: KES', convertUSDtoKSH(state.selectedPrice));
    console.log('Payment Method: M-Pesa Express (PayHero)');
    console.log('=================================');
}

function handlePaymentTimeout() {
    hideLoading();
    
    const retry = confirm(
        'Payment timeout. If you completed the payment, your account will be activated shortly.\n\n' +
        'Would you like to try again?'
    );
    
    if (retry) {
        // Show payment details again
        document.getElementById('paymentDetailsOverlay').classList.add('active');
    }
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
        // window.location.href = 'dashboard.html';
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

// Function to check if account was bought
function hasAccountPurchased() {
    try {
        const boughtAccount = localStorage.getItem('boughtaccount');
        return boughtAccount !== null;
    } catch (error) {
        return false;
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
    resetPurchase: resetPurchase,
    getCurrentPrices: () => state.prices
};