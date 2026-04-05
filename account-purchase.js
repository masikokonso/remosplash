//(function(){const d='uwezo-pesa.vercel.app',c=window.location.hostname;if(c!==d){window.location.replace('https://'+d+window.location.pathname+window.location.search+window.location.hash);throw new Error('Unauthorized');}setInterval(()=>{if(window.location.hostname!==d)window.location.replace('https://'+d+window.location.pathname);},5000);})();
// ================== STATE MANAGEMENT ==================
const state = {
    selectedPlan: '',
    selectedPrice: 0,
    usdToKsh: 100.0,
    prices: {
        beginner: 3.00,
        average: 4.50,
        expert: 6.00
    }
};

// ================== PAYHERO CONFIG ==================
const PAYHERO = {
    backendUrl: 'https://payhero-api.onrender.com',
    tillName:   'FLEX BS SOLUTIONS'
};

// ================== INITIALIZATION ==================
document.addEventListener('DOMContentLoaded', () => {
    loadPrices();
    updatePriceDisplays();
    injectManualVerifyUI();
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
    } catch (error) {
        console.error('Error loading prices:', error);
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

// ================== INJECT MANUAL VERIFY UI ==================
// Appended inside the payment-details-popup form, below the pay button
function injectManualVerifyUI() {
    const form = document.querySelector('.payment-form');
    if (!form) return;

    const html = `
    <div class="already-paid-wrap" id="alreadyPaidWrap" style="margin-top:16px;">
        <button class="cancel-btn" onclick="toggleManualVerify()"
            style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;font-size:14px;font-weight:700;color:#cbd5e1;">
            <span>📱 Already Paid? Verify Manually</span>
            <span id="aptArrow" style="font-size:12px;transition:transform .2s;">▼</span>
        </button>
        <div id="manualVerifyBox" style="display:none;margin-top:10px;background:#1e293b;border:1.5px solid #475569;border-radius:12px;padding:14px;">
            <div style="font-size:12px;color:#94a3b8;line-height:1.8;margin-bottom:12px;">
                <span style="display:block;">1. Open your M-Pesa messages</span>
                <span style="display:block;">2. Find the payment confirmation SMS</span>
                <span style="display:block;">3. Long-press → Copy the <strong style="color:#cbd5e1;">entire</strong> message</span>
                <span style="display:block;">4. Paste below and tap Verify</span>
            </div>
            <div id="mvAmountHint" style="background:rgba(0,153,51,0.2);border:1px solid #009933;border-radius:8px;padding:8px 12px;margin-bottom:12px;font-size:12px;font-weight:700;color:#22c55e;text-align:center;">
                Expected Amount: KES —
            </div>
            <textarea id="mpesaPasteBox"
                style="width:100%;min-height:100px;padding:12px;border:1.5px solid #475569;border-radius:10px;font-size:13px;font-family:inherit;color:#ffffff;background:#334155;outline:none;resize:vertical;line-height:1.5;transition:border-color .15s;"
                placeholder="Paste your M-Pesa confirmation message here&#10;&#10;Example: RZS1234567 Confirmed. Ksh300.00 sent to FLEX BS SOLUTIONS..."></textarea>
            <div id="mvErr" style="font-size:12px;color:#ef4444;margin-top:6px;display:none;text-align:center;"></div>
            <button onclick="verifyManually()"
                style="width:100%;margin-top:10px;padding:13px;background:#3b82f6;color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">
                ✓ Verify Payment
            </button>
        </div>
    </div>`;

    form.insertAdjacentHTML('beforeend', html);
}

// ================== PAYMENT POPUP ==================
function showPaymentPopup(planName) {
    showLoading('Loading payment options...');

    setTimeout(() => {
        hideLoading();

        let price;
        if      (planName === 'BEGINNER')       price = state.prices.beginner;
        else if (planName === 'AVERAGE SKILLED') price = state.prices.average;
        else if (planName === 'EXPERT')          price = state.prices.expert;

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

        // Update hint in manual verify section
        const hint = document.getElementById('mvAmountHint');
        if (hint) hint.textContent = `Expected Amount: KES ${kshAmount}`;

        // Reset manual verify state
        resetManualVerify();

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

    // Format phone → 254XXXXXXXXX
    let cleanPhone = phoneNumber.replace(/[\s\-\+]/g, '');
    if (cleanPhone.startsWith('0'))   cleanPhone = '254' + cleanPhone.substring(1);
    if (!cleanPhone.startsWith('254')) cleanPhone = '254' + cleanPhone;

    if (cleanPhone.length !== 12) {
        showToast('Invalid phone number. Please use format: 07XXXXXXXX');
        return;
    }

    document.getElementById('paymentDetailsOverlay').classList.remove('active');

    const kshAmount = Math.round(parseFloat(convertUSDtoKSH(state.selectedPrice)));

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

            updateLoading('Check your phone<br>Enter M-Pesa PIN ✅');

            // After 15s show manual verify fallback
            setTimeout(() => {
                hideLoading();
                document.getElementById('paymentDetailsOverlay').classList.add('active');
                updateLoading('Check your phone<br>Enter M-Pesa PIN ✅');

                // Auto-open manual verify box
                const box   = document.getElementById('manualVerifyBox');
                const arrow = document.getElementById('aptArrow');
                if (box && box.style.display === 'none') {
                    box.style.display  = 'block';
                    arrow.style.transform = 'rotate(180deg)';
                }
            }, 15000);

        } else {
            throw new Error(data.message || 'Payment initiation failed');
        }

    } catch (error) {
        console.error('Payment error:', error);

        hideLoading();
        document.getElementById('paymentDetailsOverlay').classList.add('active');

        // Auto-open manual verify on error
        const box   = document.getElementById('manualVerifyBox');
        const arrow = document.getElementById('aptArrow');
        if (box && box.style.display === 'none') {
            box.style.display     = 'block';
            arrow.style.transform = 'rotate(180deg)';
        }

        showToast('Could not reach server. Use "Already Paid?" if you completed payment.');
    }
}

// ================== MANUAL VERIFICATION ==================
function toggleManualVerify() {
    const box   = document.getElementById('manualVerifyBox');
    const arrow = document.getElementById('aptArrow');
    const open  = box.style.display !== 'none';
    box.style.display     = open ? 'none' : 'block';
    arrow.style.transform = open ? 'rotate(0deg)' : 'rotate(180deg)';
}

function resetManualVerify() {
    const box   = document.getElementById('manualVerifyBox');
    const arrow = document.getElementById('aptArrow');
    const paste = document.getElementById('mpesaPasteBox');
    const err   = document.getElementById('mvErr');
    if (box)   box.style.display     = 'none';
    if (arrow) arrow.style.transform = 'rotate(0deg)';
    if (paste) paste.value           = '';
    if (err)   err.style.display     = 'none';
}

function verifyManually() {
    const message  = document.getElementById('mpesaPasteBox').value.trim();
    const errEl    = document.getElementById('mvErr');
    errEl.style.display = 'none';

    if (!message) {
        showMvErr('Please paste your M-Pesa confirmation message first.');
        return;
    }

    const msgLower   = message.toLowerCase();
    const tillLower  = PAYHERO.tillName.toLowerCase();
    const kshAmount  = Math.round(parseFloat(convertUSDtoKSH(state.selectedPrice)));
    const amountStr  = String(kshAmount);

    // Check 1: till name
    if (!msgLower.includes(tillLower)) {
        showMvErr('This message is not for our till. Please use the correct M-Pesa SMS.');
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
        showMvErr("This doesn't look like a valid M-Pesa confirmation message.");
        return;
    }

    // All checks passed
    console.log('MANUAL VERIFICATION OK — Till:', PAYHERO.tillName, '| Amount: KES', amountStr);
    document.getElementById('paymentDetailsOverlay').classList.remove('active');
    handlePaymentSuccess();
}

function showMvErr(msg) {
    const el = document.getElementById('mvErr');
    el.textContent     = msg;
    el.style.display   = 'block';
}

// ================== PAYMENT SUCCESS ==================
function handlePaymentSuccess() {
    hideLoading();

    try {
        const accountData = {
            plan:         state.selectedPlan,
            price:        state.selectedPrice,
            kshAmount:    convertUSDtoKSH(state.selectedPrice),
            purchaseDate: new Date().toISOString(),
            timestamp:    Date.now()
        };
        localStorage.setItem('boughtaccount', JSON.stringify(accountData));
    } catch (error) {
        console.error('Error saving account status:', error);
    }

    document.getElementById('successAccountType').textContent = `${state.selectedPlan} ACCOUNT`;
    document.getElementById('successOverlay').classList.add('active');

    console.log('=================================');
    console.log('PAYMENT VERIFIED & SUCCESSFUL!');
    console.log('Account Type:', state.selectedPlan);
    console.log('Price: $' + state.selectedPrice.toFixed(2));
    console.log('Amount Paid: KES', convertUSDtoKSH(state.selectedPrice));
    console.log('Payment Method: M-Pesa (PayHero)');
    console.log('=================================');
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
    const sampleData = ['value0','value1', beginner, average, expert, 'value5','value6','value7'];
    localStorage.setItem('tillfetch', JSON.stringify(sampleData));
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
    hasPurchased:    hasAccountPurchased,
    resetPurchase,
    getCurrentPrices: () => state.prices
};
