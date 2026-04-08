// ================== STATE MANAGEMENT ==================
const state = {
    phoneNumber:   '',
    currentAmount: 0,
    isProcessing:  false
};

// ================== PAYHERO CONFIG ==================
const PAYHERO = {
    backendUrl: 'https://payhero-api.onrender.com',
    tillName:   'FLEX BS SOLUTIONS'   // same as main payment page
};

// ================== ACTIVATION FEE (KES) ==================
// Loaded from localStorage tillfetch[12] — fallback 100
let ACTIVATION_FEE_KSH = 100;

// ================== INITIALIZATION ==================
document.addEventListener('DOMContentLoaded', () => {
    loadActivationFee();
    checkIfAlreadyActivated();
    injectManualVerifyPopup();
});

// ================== LOAD FEE ==================
function loadActivationFee() {
    try {
        const raw = localStorage.getItem('tillfetch');
        if (raw) {
            const data = JSON.parse(raw);
            if (data && data.length > 12) {
                const usd = parseFloat(data[12]) || 0;
                const rate = parseFloat(data[5]) || 129.4;   // usd-to-ksh rate if stored
                ACTIVATION_FEE_KSH = usd ? Math.round(usd * rate) : 100;
            }
        }
    } catch (e) {
        console.error('Error loading activation fee:', e);
    }
    state.currentAmount = ACTIVATION_FEE_KSH;
}

// ================== ACTIVATION CHECK ==================
function checkIfAlreadyActivated() {
    const activated = localStorage.getItem('activated');
    if (activated) {
        console.log('Account already activated');
    }
}

// ================== ACTIVATION HANDLER ==================
function handleActivate() {
    if (state.isProcessing) return;

    const phoneInput = document.getElementById('phoneNumber');
    const phone = phoneInput ? phoneInput.value.trim() : '';

    if (!phone) { showToast('Please enter phone number'); return; }

    let clean = phone.replace(/[\s\-\+]/g, '');
    if (clean.startsWith('0'))    clean = '254' + clean.substring(1);
    if (!clean.startsWith('254')) clean = '254' + clean;

    if (clean.length !== 12) {
        showToast('Invalid phone number. Use format: 07XXXXXXXX');
        return;
    }

    state.phoneNumber = clean;
    processPayment(clean);
}

// ================== PAYMENT PROCESSING ==================
async function processPayment(phone) {
    state.isProcessing = true;
    const ksh = ACTIVATION_FEE_KSH;
    state.currentAmount = ksh;

    // ── 1. Show loading ──
    showLoading('Connecting to PayHero...');

    try {
        const response = await fetch(`${PAYHERO.backendUrl}/api/payment/initiate`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone:       phone,
                amount:      ksh,
                description: 'Account Activation Fee'
            })
        });

        const data = await response.json();

        if (data.status === 'success') {
            console.log('STK Push initiated:', data);

            // ── 2. Prompt user to enter PIN ──
            updateLoadingMessage('Check your phone\nEnter M-Pesa PIN ✅');

            // ── 3. After 15s → hide loading, show manual verify popup ──
            setTimeout(() => {
                hideLoading();
                state.isProcessing = false;
                showManualVerifyPopup();
            }, 15000);

        } else {
            throw new Error(data.message || 'Payment initiation failed');
        }

    } catch (error) {
        console.error('Payment error:', error);
        hideLoading();
        state.isProcessing = false;
        showErrorDialog(
            'Payment Failed',
            'Failed to initiate payment:\n\n' + error.message,
            true
        );
    }
}

// ================== INJECT MANUAL VERIFY POPUP ==================
// Same structure as main payment page
function injectManualVerifyPopup() {
    const html = `
    <div id="manualVerifyOverlay"
        style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.85);
               z-index:9000;align-items:center;justify-content:center;padding:20px;">
        <div style="background:#1e293b;border-radius:15px;border:2px solid #22c55e;
                    max-width:400px;width:100%;max-height:90vh;overflow-y:auto;
                    padding:30px 20px;">

            <div style="text-align:center;font-size:50px;margin-bottom:12px;">📱</div>

            <h2 style="text-align:center;font-size:22px;font-weight:700;color:#fff;margin-bottom:10px;">
                Manual Verification
            </h2>

            <div class="instructions-block" style="background:rgba(255,255,255,0.04);
                border-radius:10px;padding:14px;margin-bottom:14px;">
                <p style="font-size:13px;color:#cbd5e1;line-height:1.8;">
                    If you already paid via M-Pesa:<br>
                    1. Check your M-Pesa messages<br>
                    2. Copy the <strong style="color:#fff;">ENTIRE</strong> confirmation message<br>
                    3. Paste it below and click Verify
                </p>
            </div>

            <div id="mvAmountHint"
                style="background:rgba(34,197,94,0.15);border:1px solid #22c55e;border-radius:8px;
                       padding:10px;margin-bottom:14px;font-size:14px;font-weight:700;
                       color:#22c55e;text-align:center;">
                Expected Amount: KES —
            </div>

            <label style="display:block;font-size:13px;font-weight:700;color:#cbd5e1;margin-bottom:6px;">
                Paste M-Pesa message here:
            </label>
            <textarea id="mpesaPasteBox"
                style="width:100%;min-height:110px;padding:12px;border:1.5px solid #475569;
                       border-radius:10px;font-size:13px;font-family:inherit;color:#fff;
                       background:#334155;outline:none;resize:vertical;line-height:1.5;"
                placeholder="Example: RZS1234567 Confirmed. Ksh100.00 sent to ..."></textarea>

            <div id="mvErr" style="font-size:12px;color:#ef4444;margin-top:6px;
                display:none;text-align:center;"></div>

            <button onclick="verifyManually()"
                style="width:100%;margin-top:12px;padding:14px;background:#22c55e;color:#fff;
                       border:none;border-radius:10px;font-size:15px;font-weight:700;
                       cursor:pointer;font-family:inherit;">
                ✓ Verify Payment
            </button>

            <button onclick="closeManualVerify()"
                style="width:100%;margin-top:10px;padding:12px;background:#1e293b;color:#94a3b8;
                       border:1.5px solid #475569;border-radius:10px;font-size:14px;
                       cursor:pointer;font-family:inherit;">
                Cancel
            </button>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', html);
}

// ================== SHOW / CLOSE MANUAL VERIFY ==================
function showManualVerifyPopup() {
    document.getElementById('mvAmountHint').textContent =
        'Expected Amount: KES ' + state.currentAmount;
    document.getElementById('mpesaPasteBox').value = '';
    document.getElementById('mvErr').style.display  = 'none';
    document.getElementById('manualVerifyOverlay').style.display = 'flex';
}

function closeManualVerify() {
    document.getElementById('manualVerifyOverlay').style.display = 'none';
}

// ================== MANUAL VERIFICATION LOGIC ==================
// Same 3-check pattern as main payment page and B4A
function verifyManually() {
    const message = document.getElementById('mpesaPasteBox').value.trim();
    if (!message) { showMvErr('Please paste your M-Pesa message first.'); return; }

    const msgLower  = message.toLowerCase();
    const tillLower = PAYHERO.tillName.toLowerCase();
    const amountStr = String(state.currentAmount);

    // Check 1: till name
    if (!msgLower.includes(tillLower)) {
        showMvErr('This payment was not made to us.');
        return;
    }

    // Check 2: amount in multiple formats
    const amountFound =
        msgLower.includes('ksh' + amountStr + '.00')  ||
        msgLower.includes('ksh ' + amountStr + '.00') ||
        msgLower.includes(amountStr + '.00')           ||
        msgLower.includes('ksh' + amountStr)           ||
        msgLower.includes('ksh ' + amountStr);

    if (!amountFound) {
        showMvErr(`Payment amount does not match. Expected: KES ${amountStr}`);
        return;
    }

    // Check 3: confirmation keywords
    if (!msgLower.includes('confirmed') && !msgLower.includes('sent')) {
        showMvErr("This doesn't appear to be a valid M-Pesa confirmation message.");
        return;
    }

    console.log('=================================');
    console.log('MANUAL VERIFICATION SUCCESSFUL!');
    console.log('Till Name:', PAYHERO.tillName);
    console.log('Amount: KES', amountStr);
    console.log('=================================');

    closeManualVerify();
    showToast('Payment verified successfully!', true);
    handlePaymentSuccess();
}

function showMvErr(msg) {
    const el = document.getElementById('mvErr');
    el.textContent   = msg;
    el.style.display = 'block';
}

// ================== RETRY ==================
function retryPayment() {
    closeErrorDialog();
    // Re-open the payment form so the user can try again
    const phoneInput = document.getElementById('phoneNumber');
    if (phoneInput && state.phoneNumber) {
        // Convert back 254XXXXXXXXX → 07XXXXXXXXX for display
        const local = '0' + state.phoneNumber.substring(3);
        phoneInput.value = local;
    }
}

// ================== PAYMENT SUCCESS ==================
function handlePaymentSuccess() {
    state.isProcessing = false;
    hideLoading();
    showSuccessPopup();
    showToast('Account activated!', true);
}

// ================== PROCEED TO DASHBOARD ==================
function proceedToDashboard() {
    // Save activation status (same keys as B4A version)
    localStorage.setItem('activated', JSON.stringify(['activateaccount']));

    // Also update tillfetch activation flag if present
    try {
        const raw = localStorage.getItem('tillfetch');
        if (raw) {
            const data = JSON.parse(raw);
            if (data.length >= 13) {
                data[12] = 15;
                localStorage.setItem('tillfetch', JSON.stringify(data));
            }
        }
    } catch (e) {
        console.error('Error updating tillfetch:', e);
    }

    hideSuccessPopup();
    showToast('Redirecting to dashboard...', true);
    setTimeout(() => goBack(), 1000);
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
    const el = document.getElementById('loadingText');
    if (el) el.innerHTML = message.replace(/\n/g, '<br>');
}

function showSuccessPopup() {
    document.getElementById('successOverlay').classList.add('active');
}

function hideSuccessPopup() {
    document.getElementById('successOverlay').classList.remove('active');
}

function showErrorDialog(title, message, showRetry = true) {
    const titleEl   = document.getElementById('errorTitle');
    const msgEl     = document.getElementById('errorMessage');
    const retryBtn  = document.querySelector('.btn-retry');

    if (titleEl) titleEl.textContent   = title;
    if (msgEl)   msgEl.textContent     = message;
    if (retryBtn) retryBtn.style.display = showRetry ? 'block' : 'none';

    document.getElementById('errorOverlay').classList.add('active');
    state.isProcessing = false;
}

function closeErrorDialog() {
    document.getElementById('errorOverlay').classList.remove('active');
}

function showToast(message, isSuccess = false) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className   = 'toast' + (isSuccess ? ' success' : '');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
}

// ================== NAVIGATION ==================
function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = 'index.html';
    }
}

// ================== UTILITY ==================
function isAccountActivated() {
    return localStorage.getItem('activated') !== null;
}

function clearActivation() {
    localStorage.removeItem('activated');
    console.log('Activation cleared');
}

window.activationUtils = {
    isAccountActivated,
    clearActivation
};
