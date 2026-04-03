// ================== STATE MANAGEMENT ==================
const state = {
    countries: []
};

// ================== INITIALIZATION ==================
document.addEventListener('DOMContentLoaded', () => {
    initializeCountries();
    populateCountryDropdown();
});

// ================== COUNTRIES LIST ==================
function initializeCountries() {
    state.countries = [
        "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
        "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
        "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
        "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
        "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt",
        "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon",
        "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
        "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel",
        "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos",
        "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi",
        "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova",
        "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands",
        "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau",
        "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania",
        "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal",
        "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea",
        "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan",
        "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
        "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela",
        "Vietnam", "Yemen", "Zambia", "Zimbabwe"
    ];
}

function populateCountryDropdown() {
    const select = document.getElementById('country');
    select.innerHTML = '';
    
    state.countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        select.appendChild(option);
    });
    
    // Set Kenya as default
    const kenyaIndex = state.countries.indexOf('Kenya');
    if (kenyaIndex >= 0) {
        select.selectedIndex = kenyaIndex;
    }
}

// ================== FORM VALIDATION ==================
function validateEmail(email) {
    if (!email.includes('@') || !email.includes('.')) {
        return false;
    }
    
    const atIndex = email.indexOf('@');
    const dotIndex = email.lastIndexOf('.');
    
    if (atIndex > 0 && dotIndex > atIndex + 1 && dotIndex < email.length - 1) {
        return true;
    }
    
    return false;
}

function handleSignUp() {
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const country = document.getElementById('country').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate fields
    if (!name) {
        showToast('Please enter your full name');
        return;
    }
    
    if (!phone) {
        showToast('Please enter your phone number');
        return;
    }
    
    if (!email) {
        showToast('Please enter your email address');
        return;
    }
    
    if (!validateEmail(email)) {
        showToast('Please enter a valid email address');
        return;
    }
    
    if (password.length < 4) {
        showToast('Password must be at least 4 characters long');
        return;
    }
    
    if (password !== confirmPassword) {
        showToast('Passwords do not match');
        return;
    }
    
    // Show loading
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        
        // Check for test data (tomo.dat)
        const tomoData = localStorage.getItem('tomo');
        if (tomoData) {
            const tillfetch = localStorage.getItem('tillfetch');
            if (tillfetch) {
                const data = JSON.parse(tillfetch);
                const liveornot = data[6];
                if (liveornot === 'tomo') {
                    localStorage.setItem('activated', JSON.stringify(['active']));
                    localStorage.setItem('tomo', JSON.stringify(['tomo']));
                }
            }
        }
        
        // Process registration and go straight to onboarding
        processRegistration();
        
        showToast('Account created successfully! Proceeding to onboarding...', true);
        
        setTimeout(() => {
            window.location.href = 'onboarding-quiz.html';
        }, 1000);
        
    }, 1500);
}

function processRegistration() {
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const country = document.getElementById('country').value;
    const password = document.getElementById('password').value;
    const referralCode = document.getElementById('referralCode').value.trim();
    
    // Save to localStorage
    const signupData = [name, phone, email, country, password];
    if (referralCode) {
        signupData.push(referralCode);
    }
    
    localStorage.setItem('signuplist', JSON.stringify(signupData));
    
    console.log('Registration Data:');
    console.log('Name:', name);
    console.log('Phone:', phone);
    console.log('Email:', email);
    console.log('Country:', country);
    console.log('Referral Code:', referralCode || 'None');
    
    // Clear form
    clearForm();
}

function clearForm() {
    document.getElementById('name').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    document.getElementById('confirmPassword').value = '';
    document.getElementById('referralCode').value = '';
    
    // Reset country to Kenya
    const kenyaIndex = state.countries.indexOf('Kenya');
    if (kenyaIndex >= 0) {
        document.getElementById('country').selectedIndex = kenyaIndex;
    }
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
function setTestData() {
    localStorage.setItem('tomo', JSON.stringify(['tomo']));
    console.log('Test data set');
}

function clearTestData() {
    localStorage.removeItem('tomo');
    localStorage.removeItem('activated');
    localStorage.removeItem('signuplist');
    console.log('Test data cleared');
}

function getSignupData() {
    const data = localStorage.getItem('signuplist');
    return data ? JSON.parse(data) : null;
}

// Expose utility functions globally for testing
window.signupUtils = {
    setTestData: setTestData,
    clearTestData: clearTestData,
    getSignupData: getSignupData
};
