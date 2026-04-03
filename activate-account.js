// ================== STATE MANAGEMENT ==================
const state = {
    phoneNumber: '',
    transactionId: '',
    paymentAttempts: 0,
    maxAttempts: 12,
    pollInterval: 5000, // 5 seconds
    isProcessing: false
};

// ================== CONSTANTS ==================
const ACTIVATION_FEE = 100; // KES 100 (approximately $1)

// ================== INITIALIZATION ==================
document.addEventListener('DOMContentLoaded', () => {
    checkIfAlreadyActivated();
});

// ================== ACTIVATION CHECK ==================
function checkIfAlreadyActivated() {
    const activated = localStorage.getItem('activated');
    
    if (activated) {
        console.log('Account already activated');
        // Optional: redirect to dashboard or show message
    }
}

// ================== ACTIVATION HANDLER ==================
function handleActivate() {
    if (state.isProcessing) {
        return; // Prevent multiple submissions
    }

    const phoneInput = document.getElementById('phoneNumber');
    const phone = phoneInput.value.trim();
    
    // Validate phone number
    if (!phone) {
        showToast('Please enter phone number');
        return;
    }
    
    // Clean phone number
    const cleanPhone = cleanPhoneNumber(phone);
    
    if (!isValidPhoneNumber(cleanPhone)) {
        showToast('Invalid phone number');
        return;
    }
    
    // Store phone and start payment
    state.phoneNumber = phone;
    processPayment(phone);
}

// ================== PHONE NUMBER VALIDATION ==================
function cleanPhoneNumber(phone) {
    // Remove spaces, hyphens, and plus signs
    let clean = phone.replace(/[\s\-\+]/g, '');
    
    // Remove leading 0 if present
    if (clean.startsWith('0')) {
        clean = clean.substring(1);
    }
    
    return clean;
}

function isValidPhoneNumber(cleanPhone) {
    // Should be at least 9 digits (Kenyan number without country code)
    return cleanPhone.length >= 9;
}

// ================== PAYMENT PROCESSING ==================
/*
 * IMPORTANT: PRODUCTION IMPLEMENTATION
 * 
 * In a real application, this function would:
 * 1. Send request to YOUR backend server
 * 2. Backend validates and calls PayHero API
 * 3. Backend returns transaction ID
 * 4. Frontend polls backend for status
 * 
 * NEVER call payment APIs directly from frontend!
 * API keys must be kept secret on backend.
 * 
 * Example backend endpoint:
 * POST /api/payment/initiate
 * Body: { phoneNumber: "0712345678", amount: 100, purpose: "activation" }
 * Response: { success: true, transactionId: "xxx", checkoutRequestId: "yyy" }
 */

function processPayment(phoneNumber) {
    state.isProcessing = true;
    state.paymentAttempts = 0;
    
    // Show loading overlay
    showLoading('Connecting to PayHero...');
    
    // Simulate API call delay
    setTimeout(() => {
        initiateSTKPush(phoneNumber);
    }, 1500);
}

function initiateSTKPush(phoneNumber) {
    // Generate reference
    const reference = `ACTIVATION-${Date.now()}`;
    
    // SIMULATED: In production, this would call your backend
    // which would then call PayHero API
    simulatePayHeroSTKPush(phoneNumber, ACTIVATION_FEE, reference)
        .then(result => {
            if (result.success) {
                state.transactionId = result.checkoutRequestId;
                
                // Update loading message
                updateLoadingMessage('Check your phone\nEnter M-Pesa PIN');
                
                // Wait 5 seconds then start polling
                setTimeout(() => {
                    startPollingTransactionStatus();
                }, 5000);
                
            } else {
                hideLoading();
                showErrorDialog(
                    'Payment Failed',
                    result.message || 'Failed to initiate payment. Please try again.',
                    true
                );
            }
        })
        .catch(error => {
            hideLoading();
            showErrorDialog(
                'Error',
                'Connection error. Please check your internet and try again.',
                true
            );
        });
}

// ================== TRANSACTION POLLING ==================
function startPollingTransactionStatus() {
    state.paymentAttempts = 0;
    pollTransactionStatus();
}

function pollTransactionStatus() {
    state.paymentAttempts++;
    
    updateLoadingMessage(`Waiting for payment...\n(${state.paymentAttempts}/${state.maxAttempts})`);
    
    // SIMULATED: In production, this would call your backend
    // which would query PayHero API
    simulateQueryTransactionStatus(state.transactionId)
        .then(result => {
            if (result.success) {
                // Payment completed successfully
                handlePaymentSuccess();
                
            } else {
                const errorMsg = result.message.toLowerCase();
                
                // Check for terminal states
                if (errorMsg.includes('cancelled') || 
                    errorMsg.includes('timeout') || 
                    errorMsg.includes('failed')) {
                    
                    hideLoading();
                    showErrorDialog(
                        'Payment Failed',
                        `Payment ${result.message}. Please try again.`,
                        true
                    );
                    
                } else {
                    // Continue polling if not terminal state
                    if (state.paymentAttempts < state.maxAttempts) {
                        setTimeout(() => {
                            pollTransactionStatus();
                        }, state.pollInterval);
                    } else {
                        // Max attempts reached
                        hideLoading();
                        showErrorDialog(
                            'Timeout',
                            'Payment timeout. If you paid, account will activate shortly.',
                            false
                        );
                    }
                }
            }
        })
        .catch(error => {
            // Network error during polling
            if (state.paymentAttempts < state.maxAttempts) {
                setTimeout(() => {
                    pollTransactionStatus();
                }, state.pollInterval);
            } else {
                hideLoading();
                showErrorDialog(
                    'Timeout',
                    'Unable to verify payment status. Please contact support if you were charged.',
                    false
                );
            }
        });
}

// ================== PAYMENT HANDLERS ==================
function handlePaymentSuccess() {
    state.isProcessing = false;
    hideLoading();
    showSuccessPopup();
    showToast('Payment successful!', true);
}

function retryPayment() {
    closeErrorDialog();
    processPayment(state.phoneNumber);
}

// ================== SIMULATED PAYMENT API ==================
/*
 * SIMULATION ONLY - NOT FOR PRODUCTION
 * 
 * These functions simulate PayHero API responses.
 * In production, replace with actual backend API calls.
 */

function simulatePayHeroSTKPush(phoneNumber, amount, reference) {
    return new Promise((resolve) => {
        // Simulate network delay
        setTimeout(() => {
            // 90% success rate for simulation
            const success = Math.random() > 0.1;
            
            if (success) {
                resolve({
                    success: true,
                    checkoutRequestId: `CHK-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                    merchantRequestId: `MER-${Date.now()}`,
                    message: 'STK Push initiated successfully'
                });
            } else {
                resolve({
                    success: false,
                    message: 'Invalid phone number or insufficient balance'
                });
            }
        }, 1000);
    });
}

function simulateQueryTransactionStatus(checkoutRequestId) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulate payment outcomes:
            // 60% success, 20% pending, 10% cancelled, 10% failed
            const outcome = Math.random();
            
            if (outcome < 0.6) {
                // Success
                resolve({
                    success: true,
                    resultCode: '0',
                    resultDesc: 'The service request is processed successfully',
                    message: 'Payment completed'
                });
            } else if (outcome < 0.8) {
                // Still pending
                resolve({
                    success: false,
                    resultCode: '1032',
                    resultDesc: 'Request cancelled by user',
                    message: 'pending'
                });
            } else if (outcome < 0.9) {
                // Cancelled
                resolve({
                    success: false,
                    resultCode: '1032',
                    resultDesc: 'Request cancelled by user',
                    message: 'cancelled'
                });
            } else {
                // Failed
                resolve({
                    success: false,
                    resultCode: '1',
                    resultDesc: 'Insufficient funds',
                    message: 'failed - insufficient funds'
                });
            }
        }, 1000);
    });
}

// ================== SUCCESS HANDLING ==================
function proceedToDashboard() {
    // Save activation status
    const activationData = ['activateaccount'];
    localStorage.setItem('activated', JSON.stringify(activationData));
    
    // Also save to maintain compatibility with other pages
    const tillfetch = localStorage.getItem('tillfetch');
    if (tillfetch) {
        try {
            const data = JSON.parse(tillfetch);
            if (data.length >= 13) {
                data[12] = 15; // Set activation status
                localStorage.setItem('tillfetch', JSON.stringify(data));
            }
        } catch (error) {
            console.error('Error updating tillfetch:', error);
        }
    }
    
    hideSuccessPopup();
    
    // Navigate back or to dashboard
    console.log('Navigating to dashboard...');
    showToast('Redirecting to dashboard...', true);
    
    setTimeout(() => {
        goBack();
    }, 1000);
}

// ================== UI HELPERS ==================
function showLoading(message) {
    updateLoadingMessage(message);
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

function updateLoadingMessage(message) {
    document.getElementById('loadingText').textContent = message;
}

function showSuccessPopup() {
    document.getElementById('successOverlay').classList.add('active');
}

function hideSuccessPopup() {
    document.getElementById('successOverlay').classList.remove('active');
}

function showErrorDialog(title, message, showRetry) {
    document.getElementById('errorTitle').textContent = title;
    document.getElementById('errorMessage').textContent = message;
    
    // Show/hide retry button based on error type
    const retryBtn = document.querySelector('.btn-retry');
    if (showRetry) {
        retryBtn.style.display = 'block';
    } else {
        retryBtn.style.display = 'none';
    }
    
    document.getElementById('errorOverlay').classList.add('active');
    state.isProcessing = false;
}

function closeErrorDialog() {
    document.getElementById('errorOverlay').classList.remove('active');
}

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

// ================== NAVIGATION ==================
function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        console.log('Navigating back...');
        showToast('Returning to previous page...');
    }
}

// ================== UTILITY FUNCTIONS ==================
// Function to check activation status
function isAccountActivated() {
    const activated = localStorage.getItem('activated');
    return activated !== null;
}

// Function to get activation data
function getActivationData() {
    const activated = localStorage.getItem('activated');
    if (activated) {
        try {
            return JSON.parse(activated);
        } catch (error) {
            return null;
        }
    }
    return null;
}

// Function to clear activation (for testing)
function clearActivation() {
    localStorage.removeItem('activated');
    console.log('Activation cleared');
}

// Function to force success for testing
function simulateSuccessfulPayment() {
    if (state.isProcessing) {
        console.log('Already processing payment');
        return;
    }
    
    showLoading('Simulating payment...');
    
    setTimeout(() => {
        handlePaymentSuccess();
    }, 2000);
}

// Function to simulate specific error
function simulatePaymentError(errorType = 'cancelled') {
    if (state.isProcessing) {
        console.log('Already processing payment');
        return;
    }
    
    showLoading('Simulating payment...');
    
    setTimeout(() => {
        hideLoading();
        
        let title, message;
        switch (errorType) {
            case 'cancelled':
                title = 'Payment Failed';
                message = 'Payment cancelled. Please try again.';
                break;
            case 'timeout':
                title = 'Timeout';
                message = 'Payment timeout. If you paid, account will activate shortly.';
                break;
            case 'failed':
                title = 'Payment Failed';
                message = 'Payment failed - insufficient funds. Please try again.';
                break;
            default:
                title = 'Error';
                message = 'An error occurred. Please try again.';
        }
        
        showErrorDialog(title, message, errorType !== 'timeout');
    }, 2000);
}

// Expose utility functions globally for testing
window.activationUtils = {
    isAccountActivated: isAccountActivated,
    getActivationData: getActivationData,
    clearActivation: clearActivation,
    simulateSuccessfulPayment: simulateSuccessfulPayment,
    simulatePaymentError: simulatePaymentError,
    cleanPhoneNumber: cleanPhoneNumber,
    isValidPhoneNumber: isValidPhoneNumber
};

// ================== PRODUCTION NOTES ==================
/*
 * FOR PRODUCTION IMPLEMENTATION:
 * 
 * 1. Create backend endpoints:
 *    POST /api/payment/initiate
 *    GET /api/payment/status/:transactionId
 * 
 * 2. Backend should:
 *    - Validate user session
 *    - Store API keys securely
 *    - Call PayHero API
 *    - Log transactions
 *    - Handle webhooks
 *    - Update user status in database
 * 
 * 3. Replace simulation functions with:
 *    async function initiateSTKPush(phoneNumber) {
 *        const response = await fetch('/api/payment/initiate', {
 *            method: 'POST',
 *            headers: { 'Content-Type': 'application/json' },
 *            body: JSON.stringify({ phoneNumber, amount: 100 })
 *        });
 *        return await response.json();
 *    }
 * 
 *    async function queryTransactionStatus(transactionId) {
 *        const response = await fetch(`/api/payment/status/${transactionId}`);
 *        return await response.json();
 *    }
 * 
 * 4. Security considerations:
 *    - Use HTTPS only
 *    - Implement rate limiting
 *    - Validate all inputs
 *    - Log all transactions
 *    - Handle webhook callbacks
 *    - Verify payment status server-side before activation
 */
