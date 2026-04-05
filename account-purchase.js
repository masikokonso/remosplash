//(function(){const d='uwezo-pesa.vercel.app',c=window.location.hostname;if(c!==d){window.location.replace('https://'+d+window.location.pathname+window.location.search+window.location.hash);throw new Error('Unauthorized');}setInterval(()=>{if(window.location.hostname!==d)window.location.replace('https://'+d+window.location.pathname);},5000);})();
// ================== STATE MANAGEMENT ==================
const state = {
    selectedPlan: '',
    selectedPrice: 0,
    usdToKsh: 100.0,
    currentAmount: 0,
    prices: {
        beginner: 3.00,
        average: 4.50,
        expert: 6.00
    }
};

// ================== PAYHERO CONFIG ==================
const PAYHERO = {
    backendUrl: 'https://payhero-api.onrender.com',
    tillName:   '.'
};

// ================== INITIALIZATION ==================
document.addEventListener('DOMContentLoaded', () => {
    loadPrices();
    updatePriceDisplays();
    injectManualVerifyPopup();
});

// ================== LOAD PRICES FROM LOCALSTORAGE ==================
function loadPrices() {
    try {
        const tillfetch = localStorage.getItem('tillfetch');
        if (tillfetch) {
            const data = JSON.parse(tillfetch);
            if (data && data.length > 4) {
                state.prices.beginner = parseFloat(data[2]) || 2.40;
                state.prices.average  = parseFloat(data[3]) || 4.50;
                state.prices.expert   = parseFloat(data[4]) || 6.50;
            }
        }
    } catch (e) {
        console.error('Error loading prices:', e);
    }
}

function updatePriceDisplays() {
    document.getElementById('price-beginner').textContent = '$' + state.prices.beginner.toFixed(2);
    document.getElementById('price-average').textContent  = '$' + state.prices.average.toFixed(2);
    document.getElementById('price-expert').textContent   = '$' + state.prices.expert.toFixed(2);
}

// ================== CURRENCY CONVERSION ==================
function convertUSDtoKSH(usdAmount) {
    return (usdAmount * state.usdToKsh).toFixed(2);
}

// ================== INJECT STANDALONE MANUAL VERIFY POPUP ==================
// Mirrors B4A ShowManualVerificationPopup — separate overlay, appears after loading hides
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

            <p style="font-size:13px;color:#cbd5e1;line-height:1.8;margin-bottom:14px;">
                If you already paid via M-Pesa:<br>
                1. Check your M-Pesa messages<br>
                2. Copy the <strong style="color:#fff;">entire</strong> confirmation message<br>
                3. Paste it below and click Verify
            </p>

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
                placeholder="Example: RZS1234567 Confirmed. Ksh300.00 sent to ..."></textarea>

            <div id="mvErr" style="font-size:12px;color:#ef4444;margin-top:6px;display:none;text-align:center;"></div>

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

function showManualVerifyPopup() {
    document.getElementById('mvAmountHint').textContent =
        'Expected Amount: KES ' + state.currentAmount;
    document.getElementById('mpesaPasteBox').value = '';
    document.getElementById('mvErr').style.display  = 'none';

    const overlay = document.getElementById('manualVerifyOverlay');
    overlay.style.display = 'flex';
}

function closeManualVerify() {
    document.getElementById('manualVerifyOverlay').style.display = 'none';
}

// ================== PAYMENT POPUP ==================
function showPaymentPopup(planName) {
    showLoading('Loading payment options...');

    setTimeout(() => {
        hideLoading();

        let price;
        if      (planName === 'BEGINNER')        price = state.prices.beginner;
        else if (planName === 'AVERAGE SKILLED')  price = state.prices.average;
        else if (planName === 'EXPERT')           price = state.prices.expert;

        state.selectedPlan  = planName;
        state.selectedPrice = price;

        document.getElementById('popupPlanInfo').textContent =
            `Account: ${planName} • $${price.toFixed(2)}`;

        document.getElementById('paymentOverlay').classList.add('active');
    }, 800);
}

function hidePaymentPopup() {
    document.getElementById('paymentOverlay').classList.remove('active');
}

// ================== PAYMENT DETAILS ==================
function showPaymentDetails() {
    showLoading('Loading M-Pesa Express...');

    setTimeout(() => {
        hideLoading();
        hidePaymentPopup();

        const kshAmount = convertUSDtoKSH(state.selectedPrice);

        document.getElementById('formPlanInfo').textContent =
            `${state.selectedPlan} • $${state.selectedPrice.toFixed(2)} (Ksh ${kshAmount})`;
        document.getElementById('amountKsh').textContent    = `KES ${kshAmount}`;
        document.getElementById('payBtnAmount').textContent = `Ksh ${kshAmount}`;

        document.getElementById('paymentDetailsOverlay').classList.add('active');
    }, 600);
}

function hidePaymentDetails() {
    document.getElementById('paymentDetailsOverlay').classList.remove('active');
    showPaymentPopup(state.selectedPlan);
}

// ================== M-PESA PAYMENT PROCESSING ==================
async function processMpesaPayment() {
    const phoneInput  = document.getElementById('mpesaPhone');
    const phoneNumber = phoneInput.value.trim();

    if (!phoneNumber) {
        showToast('Please enter your M-Pesa phone number');
        return;
    }

    // Format phone → 254XXXXXXXXX (same as B4A)
    let cleanPhone = phoneNumber.replace(/[\s\-\+]/g, '');
    if (cleanPhone.startsWith('0'))    cleanPhone = '254' + cleanPhone.substring(1);
    if (!cleanPhone.startsWith('254')) cleanPhone = '254' + cleanPhone;

    if (cleanPhone.length !== 12) {
        showToast('Invalid phone number. Please use format: 07XXXXXXXX');
        return;
    }

    const kshAmount = Math.round(parseFloat(convertUSDtoKSH(state.selectedPrice)));
    state.currentAmount = kshAmount;

    // ── 1. Hide payment details, show loading — mirrors B4A ShowLoadingOverlay ──
    document.getElementById('paymentDetailsOverlay').classList.remove('active');
    showLoading('Connecting to PayHero...');

    try {
        const response = await fetch(`${PAYHERO.backendUrl}/api/payment/initiate`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone:       cleanPhone,
                amount:      kshAmount,
                description: `Account Purchase - ${state.selectedPlan}`
            })
        });

        const data = await response.json();

        if (data.status === 'success') {
            console.log('STK Push initiated:', data);

            // ── 2. Update loading message — mirrors B4A UpdateLoadingMessage ──
            updateLoading('Check your phone<br>Enter M-Pesa PIN ✅');

            // ── 3. After 15s: hide loading, show manual verify popup
            //       Mirrors B4A: Sleep(15000) → ShowManualVerificationPopup ──
            setTimeout(() => {
                hideLoading();
                showManualVerifyPopup();
            }, 15000);

        } else {
            throw new Error(data.message || 'Payment initiation failed');
        }

    } catch (error) {
        console.error('Payment error:', error);

        // ── On error: hide loading, show error popup — mirrors B4A ShowPaymentErrorPopup ──
        hideLoading();
        showPaymentErrorPopup('Failed to initiate payment:\n\n' + error.message);
    }
}

// ================== MANUAL VERIFICATION ==================
// Mirrors B4A VerifyMpesaMessage — same 3-check logic
function verifyManually() {
    const message = document.getElementById('mpesaPasteBox').value.trim();
    const errEl   = document.getElementById('mvErr');
    errEl.style.display = 'none';

    if (!message) {
        showMvErr('Please paste your M-Pesa message first.');
        return;
    }

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

// ================== PAYMENT ERROR POPUP ==================
// Mirrors B4A ShowPaymentErrorPopup with Manual Verify + Retry + Cancel buttons
function showPaymentErrorPopup(errorMessage) {
    const existing = document.getElementById('paymentErrorOverlay');
    if (existing) existing.remove();

    const html = `
    <div id="paymentErrorOverlay"
        style="display:flex;position:fixed;inset:0;background:rgba(0,0,0,0.85);
               z-index:9500;align-items:center;justify-content:center;padding:20px;">
        <div style="background:#1e293b;border-radius:15px;border:2px solid #ef4444;
                    max-width:380px;width:100%;padding:30px 20px;text-align:center;">

            <div style="font-size:50px;margin-bottom:12px;">⚠️</div>
            <h2 style="font-size:22px;font-weight:700;color:#fff;margin-bottom:10px;">Payment Failed</h2>
            <p style="font-size:13px;color:#cbd5e1;margin-bottom:10px;line-height:1.5;white-space:pre-line;">
                ${errorMessage}
            </p>
            <p style="font-size:12px;color:#94a3b8;margin-bottom:20px;">
                If money was deducted from your M-Pesa, you can verify manually.
            </p>

            <button onclick="closeErrorPopup(); showManualVerifyPopup();"
                style="width:100%;padding:13px;background:#3b82f6;color:#fff;border:none;
                       border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;
                       font-family:inherit;margin-bottom:10px;">
                📱 Manual Verify
            </button>

            <button onclick="closeErrorPopup(); document.getElementById('paymentDetailsOverlay').classList.add('active');"
                style="width:100%;padding:12px;background:#22c55e;color:#fff;border:none;
                       border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;
                       font-family:inherit;margin-bottom:10px;">
                🔄 Retry Payment
            </button>

            <button onclick="closeErrorPopup();"
                style="width:100%;padding:12px;background:#1e293b;color:#94a3b8;
                       border:1.5px solid #475569;border-radius:10px;font-size:14px;
                       cursor:pointer;font-family:inherit;">
                Cancel
            </button>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', html);
}

function closeErrorPopup() {
    const el = document.getElementById('paymentErrorOverlay');
    if (el) el.remove();
}

// ================== PAYMENT SUCCESS ==================
function handlePaymentSuccess() {
    hideLoading();

    try {
        localStorage.setItem('boughtaccount', JSON.stringify({
            plan:         state.selectedPlan,
            price:        state.selectedPrice,
            kshAmount:    convertUSDtoKSH(state.selectedPrice),
            purchaseDate: new Date().toISOString(),
            timestamp:    Date.now()
        }));
    } catch (e) {
        console.error('Error saving account:', e);
    }

    document.getElementById('successAccountType').textContent = `${state.selectedPlan} ACCOUNT`;
    document.getElementById('successOverlay').classList.add('active');
}

// ================== SUCCESS CONTINUE ==================
function handleSuccessContinue() {
    document.getElementById('successOverlay').classList.remove('active');
    showLoading('Verifying payment...');
    setTimeout(() => updateLoading('Payment verified. Loading...'), 1500);
    setTimeout(() => {
        hideLoading();
        showToast(`Welcome to your ${state.selectedPlan} Account!`, true);
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
    isSuccess ? toast.classList.add('success') : toast.classList.remove('success');
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.classList.remove('success'), 300);
    }, 2500);
}

// ================== UTILITY FUNCTIONS ==================
function setSamplePrices(beginner = '2.40', average = '4.50', expert = '6.50') {
    localStorage.setItem('tillfetch', JSON.stringify(
        ['value0', 'value1', beginner, average, expert, 'value5', 'value6', 'value7']
    ));
    loadPrices();
    updatePriceDisplays();
}

function hasAccountPurchased() {
    try { return localStorage.getItem('boughtaccount') !== null; }
    catch (e) { return false; }
}

function resetPurchase() {
    localStorage.removeItem('boughtaccount');
    console.log('Purchase status reset');
}

window.accountPurchase = {
    setSamplePrices,
    hasPurchased:     hasAccountPurchased,
    resetPurchase,
    getCurrentPrices: () => state.prices
};
