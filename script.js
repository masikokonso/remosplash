// ==========================================
// REMO-TASK - Combined JavaScript
// Works for all pages: splash, home, login, signup, onboarding
// ==========================================

// ===== GLOBAL VARIABLES =====
let mathNum1 = 0;
let mathNum2 = 0;
let correctAnswer = 0;
let isAnswerCorrect = false;

// Quiz variables
let currentQuestion = 0;
let quizScore = 0;
let userAnswers = [];
let arrangedWords = [];
let bonusClaimed = false;
let totalEarnings = 0;
let bonusAmount = 0;

// Countries list
const countries = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", 
    "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", 
    "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", 
    "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", 
    "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", 
    "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", 
    "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", 
    "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", 
    "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", 
    "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", 
    "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", 
    "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", 
    "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", 
    "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", 
    "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", 
    "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", 
    "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", 
    "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", 
    "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", 
    "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", 
    "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", 
    "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", 
    "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", 
    "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", 
    "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

// Quiz questions
const quizQuestions = [
    {
        id: 1,
        type: 'arrange',
        title: 'Arrange the Sentence',
        description: 'Put these words in the correct order to form a meaningful sentence:',
        options: ['learning', 'machine', 'improves', 'accuracy'],
        correctAnswer: 'machine learning improves accuracy'
    },
    {
        id: 2,
        type: 'multiple_choice',
        title: 'Image Content Identification',
        description: 'What is the PRIMARY object in this scenario: A photo shows a person holding a smartphone in front of a laptop on a desk.',
        options: ['Person', 'Smartphone', 'Laptop', 'Desk'],
        correctAnswer: 'Person'
    },
    {
        id: 3,
        type: 'multiple_choice',
        title: 'Sentiment Classification',
        description: 'Classify the sentiment of this text: "This product exceeded my expectations! Amazing quality and fast delivery."',
        options: ['Positive', 'Negative', 'Neutral', 'Mixed'],
        correctAnswer: 'Positive'
    },
    {
        id: 4,
        type: 'multiple_choice',
        title: 'Text Categorization',
        description: 'Which category best fits this text: "The patient reported severe headache and dizziness for 3 days."',
        options: ['Medical/Health', 'Sports', 'Technology', 'Entertainment'],
        correctAnswer: 'Medical/Health'
    },
    {
        id: 5,
        type: 'multiple_choice',
        title: 'Relationship Identification',
        description: 'What is the relationship between these words: "Doctor" and "Hospital"',
        options: ['Workplace relationship', 'Family relationship', 'Opposite meanings', 'Same meaning'],
        correctAnswer: 'Workplace relationship'
    }
];

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = getCurrentPage();
    
    switch(currentPage) {
        case 'splash':
            initializeSplash();
            break;
        case 'home':
            initializeHome();
            break;
        case 'login':
            initializeLogin();
            break;
        case 'signup':
            initializeSignup();
            break;
        case 'onboarding':
            initializeOnboarding();
            break;
    }
});

function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop().replace('.html', '');
    return page || 'index';
}

// ==========================================
// ONBOARDING QUIZ
// ==========================================

function initializeOnboarding() {
    loadEarningsProgress();
    checkBonusClaimStatus();
    
    const btnStart = document.getElementById('btnStartAssessment');
    const btnNext = document.getElementById('btnNextQuestion');
    const btnResult = document.getElementById('btnResultAction');
    const btnClaim = document.getElementById('btnClaimBonus');
    
    if (btnStart) btnStart.addEventListener('click', startQuiz);
    if (btnNext) btnNext.addEventListener('click', nextQuestion);
    if (btnResult) btnResult.addEventListener('click', handleResultAction);
    if (btnClaim) btnClaim.addEventListener('click', claimBonus);
}

function loadEarningsProgress() {
    const earnings = localStorage.getItem('totalEarnings');
    totalEarnings = earnings ? parseFloat(earnings) : 0;
}

function saveEarningsProgress() {
    localStorage.setItem('totalEarnings', totalEarnings.toString());
}

function checkBonusClaimStatus() {
    bonusClaimed = localStorage.getItem('bonusClaimed') === 'true';
}

function markBonusAsClaimed() {
    localStorage.setItem('bonusClaimed', 'true');
    localStorage.setItem('bonusClaimedDate', new Date().toISOString());
    localStorage.setItem('bonusClaimedAmount', bonusAmount.toString());
    bonusClaimed = true;
}

function startQuiz() {
    showLoading();
    setTimeout(() => {
        hideLoading();
        currentQuestion = 0;
        quizScore = 0;
        userAnswers = [];
        showQuestion();
    }, 1500);
}

function showQuestion() {
    if (currentQuestion >= quizQuestions.length) {
        showResults();
        return;
    }

    const question = quizQuestions[currentQuestion];
    arrangedWords = [];

    // Hide welcome, show question
    document.getElementById('welcomeScreen').classList.remove('active');
    document.getElementById('questionScreen').classList.add('active');
    document.getElementById('resultsScreen').classList.remove('active');

    // Scroll to top
    window.scrollTo(0, 0);

    // Update progress
    const progress = ((currentQuestion + 1) / quizQuestions.length) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('progressText').textContent = `Question ${currentQuestion + 1} of ${quizQuestions.length}`;

    // Update question details
    document.getElementById('questionNumber').textContent = currentQuestion + 1;
    document.getElementById('questionTitle').textContent = question.title;
    document.getElementById('questionDescription').textContent = question.description;

    // Render options
    const optionsContainer = document.getElementById('questionOptions');
    optionsContainer.innerHTML = '';

    if (question.type === 'arrange') {
        renderArrangeQuestion(question, optionsContainer);
    } else {
        renderMultipleChoice(question, optionsContainer);
    }
}

function renderArrangeQuestion(question, container) {
    // Instruction
    const instruction = document.createElement('p');
    instruction.style.cssText = 'font-size: 13px; color: rgb(148, 163, 184); margin-bottom: 15px;';
    instruction.textContent = 'Tap the words in the correct order:';
    container.appendChild(instruction);

    // Word buttons grid
    const grid = document.createElement('div');
    grid.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;';
    
    question.options.forEach(word => {
        const btn = document.createElement('button');
        btn.textContent = word;
        btn.className = 'word-button';
        btn.style.cssText = 'padding: 15px; background: rgb(71, 85, 105); border: 1px solid rgb(100, 116, 139); border-radius: 12px; color: white; font-size: 15px; cursor: pointer; transition: all 0.3s;';
        btn.onclick = () => selectWord(word, btn);
        grid.appendChild(btn);
    });
    container.appendChild(grid);

    // Selected words display
    const selectedContainer = document.createElement('div');
    selectedContainer.style.cssText = 'background: rgba(168, 85, 247, 0.1); border: 1px solid rgb(168, 85, 247); border-radius: 12px; padding: 20px; min-height: 70px; display: flex; align-items: center; justify-content: center;';
    
    const selectedText = document.createElement('p');
    selectedText.id = 'selectedWords';
    selectedText.style.cssText = 'font-size: 14px; color: rgb(203, 213, 225); text-align: center; margin: 0;';
    selectedText.textContent = 'Your answer: (tap words above)';
    selectedContainer.appendChild(selectedText);
    container.appendChild(selectedContainer);
}

function selectWord(word, btn) {
    arrangedWords.push(word);
    const sentence = arrangedWords.join(' ');
    document.getElementById('selectedWords').textContent = 'Your answer: ' + sentence;
    
    btn.disabled = true;
    btn.style.background = 'rgba(71, 85, 105, 0.4)';
    btn.style.cursor = 'not-allowed';
}

function renderMultipleChoice(question, container) {
    question.options.forEach(option => {
        const btn = document.createElement('button');
        btn.textContent = option;
        btn.className = 'option-button';
        btn.style.cssText = 'width: 100%; padding: 15px; margin-bottom: 12px; background: rgb(71, 85, 105); border: 1px solid rgb(100, 116, 139); border-radius: 12px; color: white; font-size: 15px; text-align: left; cursor: pointer; transition: all 0.3s;';
        btn.onclick = () => selectOption(option, container);
        container.appendChild(btn);
    });
}

function selectOption(option, container) {
    userAnswers[currentQuestion] = option;
    
    // Update button styles
    const buttons = container.querySelectorAll('.option-button');
    buttons.forEach(btn => {
        if (btn.textContent === option) {
            btn.style.background = 'rgb(168, 85, 247)';
            btn.style.borderColor = 'rgb(236, 72, 153)';
        } else {
            btn.style.background = 'rgb(71, 85, 105)';
            btn.style.borderColor = 'rgb(100, 116, 139)';
        }
    });
}

function nextQuestion() {
    const question = quizQuestions[currentQuestion];
    let answer;
    
    if (question.type === 'arrange') {
        answer = arrangedWords.join(' ');
    } else {
        answer = userAnswers[currentQuestion];
    }
    
    // Validate answer
    if (!answer) {
        showToast('Please select an answer before continuing');
        return;
    }
    
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        
        // Check answer
        if (answer === question.correctAnswer) {
            quizScore++;
        }
        
        currentQuestion++;
        showQuestion();
    }, 1000);
}

function showResults() {
    const percentage = Math.round((quizScore / quizQuestions.length) * 100);
    const passed = percentage >= 60;
    
    // Hide question, show results
    document.getElementById('questionScreen').classList.remove('active');
    document.getElementById('resultsScreen').classList.add('active');
    
    // Scroll to top
    window.scrollTo(0, 0);
    
    // Update result icon and colors
    const resultIcon = document.getElementById('resultIcon');
    const resultIconContainer = document.getElementById('resultIconContainer');
    const scoreCard = document.getElementById('scoreCard');
    const resultBtn = document.getElementById('btnResultAction');
    
    if (passed) {
        resultIconContainer.style.background = 'rgb(34, 197, 94)';
        resultIcon.textContent = '✓';
        scoreCard.style.borderColor = 'rgb(34, 197, 94)';
        resultBtn.className = 'btn btn-success';
        resultBtn.style.borderRadius = '30px';
        resultBtn.textContent = 'Continue to Dashboard →';
        
        document.getElementById('resultTitle').textContent = 'Congratulations!\nScreening Passed!';
        document.getElementById('qualificationStatus').innerHTML = '✓ Qualified for AI Training Tasks';
        document.getElementById('qualificationStatus').style.color = 'rgb(34, 197, 94)';
    } else {
        resultIconContainer.style.background = 'rgb(239, 68, 68)';
        resultIcon.textContent = '✗';
        scoreCard.style.borderColor = 'rgb(239, 68, 68)';
        resultBtn.className = 'btn';
        resultBtn.style.background = 'rgb(239, 68, 68)';
        resultBtn.style.borderRadius = '30px';
        resultBtn.textContent = 'Retake Assessment';
        
        document.getElementById('resultTitle').textContent = 'Assessment Complete';
        document.getElementById('qualificationStatus').textContent = '';
    }
    
    // Update score display
    document.getElementById('scorePercentage').textContent = percentage + '%';
    document.getElementById('scorePercentage').style.color = passed ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
    document.getElementById('scoreDetails').textContent = `${quizScore} out of ${quizQuestions.length} questions correct`;
}

function handleResultAction() {
    const percentage = Math.round((quizScore / quizQuestions.length) * 100);
    const passed = percentage >= 60;
    
    if (!passed) {
        // Retake quiz
        showLoading();
        setTimeout(() => {
            hideLoading();
            document.getElementById('resultsScreen').classList.remove('active');
            document.getElementById('welcomeScreen').classList.add('active');
            window.scrollTo(0, 0);
        }, 1500);
    } else {
        // Continue to dashboard
        showLoading();
        setTimeout(() => {
            hideLoading();
            
            if (bonusClaimed) {
                // Skip bonus, go to dashboard
                showToast('Welcome back! Proceeding to dashboard...');
                setTimeout(() => {
                    window.location.href = 'buyaccount.html';
                }, 1000);
            } else {
                // Show bonus panel
                showBonusPanel();
            }
        }, 2000);
    }
}

function showBonusPanel() {
    // Generate random bonus between 14 and 19
    bonusAmount = Math.floor(Math.random() * 6) + 14;
    
    document.getElementById('bonusAmount').textContent = '$' + bonusAmount + '.00';
    document.getElementById('bonusOverlay').classList.add('active');
}

function claimBonus() {
    if (bonusClaimed) {
        showToast('Bonus already claimed!');
        window.location.href = 'buyaccount.html';
        return;
    }
    
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        
        // Add bonus to earnings
        totalEarnings += bonusAmount;
        saveEarningsProgress();
        markBonusAsClaimed();
        
        showToast('$' + bonusAmount + ' bonus credited! Total: $' + totalEarnings.toFixed(0));
        
        setTimeout(() => {
            window.location.href = 'buyaccount.html';
        }, 1500);
    }, 2000);
}

// ==========================================
// SPLASH SCREEN
// ==========================================

function initializeSplash() {
    setupBuyPopupListeners();
    checkNotificationClick();
    startSplashScreen();
}

function checkNotificationClick() {
    const urlParams = new URLSearchParams(window.location.search);
    const notificationTag = urlParams.get('notification');
    
    if (notificationTag === 'buy') {
        setTimeout(() => {
            showBuyPopup();
        }, 8000);
    } else if (notificationTag === 'activate') {
        const boughtAccount = localStorage.getItem('boughtAccount');
        if (boughtAccount === 'true') {
            setTimeout(() => {
                window.location.href = 'activate.html';
            }, 12000);
        } else {
            setTimeout(() => {
                showBuyPopup();
            }, 8000);
        }
    }
}

function startSplashScreen() {
    const flashOverlay = document.getElementById('flashOverlay');
    const iconGlow = document.getElementById('iconGlow');
    const iconOuter = document.getElementById('iconOuter');
    const iconInner = document.getElementById('iconInner');
    const iconEmoji = document.getElementById('iconEmoji');
    const appName = document.getElementById('appName');
    const tagline = document.getElementById('tagline');
    const slogan = document.getElementById('slogan');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const versionInfo = document.getElementById('versionInfo');

    if (!flashOverlay) return; // Not on splash page

    // Phase 1: Flash effect (0-300ms)
    flashOverlay.style.opacity = '1';
    setTimeout(() => {
        flashOverlay.style.transition = 'opacity 200ms';
        flashOverlay.style.opacity = '0';
    }, 100);

    // Phase 2: Icon glow appears (300ms)
    setTimeout(() => {
        iconGlow.style.transition = 'opacity 600ms, transform 600ms';
        iconGlow.style.opacity = '1';
        iconGlow.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 300);

    // Phase 3: Icon container appears (600ms)
    setTimeout(() => {
        iconOuter.style.transition = 'opacity 900ms, transform 900ms';
        iconOuter.style.opacity = '1';
        iconOuter.style.transform = 'scale(1)';
        iconOuter.style.transformOrigin = 'center';
    }, 600);

    // Phase 4: Inner icon fills container (1500ms)
    setTimeout(() => {
        animateFillIcon(iconInner, iconEmoji);
    }, 1500);

    // Phase 5: Icon bounce (2700ms)
    setTimeout(() => {
        iconOuter.style.transition = 'transform 300ms';
        iconOuter.style.transform = 'scale(1.08)';
        setTimeout(() => {
            iconOuter.style.transform = 'scale(1)';
        }, 300);
    }, 2700);

    // Phase 6: Type REMO-TASK (3300ms)
    setTimeout(() => {
        appName.style.opacity = '1';
        typeText(appName, 'REMO-TASK', 200);
    }, 3300);

    // Phase 7: Tagline slides up (4800ms)
    setTimeout(() => {
        tagline.style.transition = 'opacity 600ms, transform 600ms';
        tagline.style.opacity = '1';
        tagline.style.transform = 'translateY(-30px)';
    }, 4800);

    // Phase 8: Type slogan (5400ms)
    setTimeout(() => {
        slogan.style.opacity = '1';
        typeText(slogan, 'Get Paid to Work Anywhere, Anytime!', 100);
    }, 5400);

    // Phase 9: Show loading and version (7900ms)
    setTimeout(() => {
        loadingSpinner.style.opacity = '1';
        versionInfo.style.transition = 'opacity 400ms, transform 400ms';
        versionInfo.style.opacity = '1';
        versionInfo.style.transform = 'translateY(-30px)';
    }, 7900);

    // Navigate to next screen after 15 seconds
    setTimeout(() => {
        navigateToNextScreen();
    }, 15000);
}

function animateFillIcon(innerIcon, emoji) {
    if (!innerIcon || !emoji) return;
    
    let size = 30;
    const targetSize = 80;
    const steps = 20;
    const increment = (targetSize - size) / steps;
    const duration = 1200 / steps;

    const interval = setInterval(() => {
        size += increment;
        if (size >= targetSize) {
            size = targetSize;
            clearInterval(interval);
        }
        innerIcon.style.width = size + 'px';
        innerIcon.style.height = size + 'px';
        emoji.style.fontSize = (18 + ((50 - 18) * (size - 30) / (targetSize - 30))) + 'px';
    }, duration);
}

function typeText(element, text, speed) {
    if (!element) return;
    
    let i = 0;
    const interval = setInterval(() => {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
        } else {
            clearInterval(interval);
        }
    }, speed);
}

function navigateToNextScreen() {
    const isRegistered = localStorage.getItem('signupComplete');
    const bonusClaimed = localStorage.getItem('bonusClaimed');
    const boughtAccount = localStorage.getItem('boughtAccount');

    if (isRegistered === 'true' && bonusClaimed === 'true' && boughtAccount === 'true') {
        window.location.href = 'dashboard.html';
    } else if (isRegistered === 'true' && bonusClaimed === 'true' && boughtAccount !== 'true') {
        window.location.href = 'buyaccount.html';
    } else if (isRegistered === 'true' && bonusClaimed !== 'true') {
        window.location.href = 'onboarding.html';
    } else {
        window.location.href = 'home.html';
    }
}

// Buy Account Popup (used in splash)
function setupBuyPopupListeners() {
    const buyNowBtn = document.getElementById('buyNowBtn');
    const laterBtn = document.getElementById('laterBtn');
    
    if (buyNowBtn) buyNowBtn.addEventListener('click', handleBuyNow);
    if (laterBtn) laterBtn.addEventListener('click', hideBuyPopup);
}

function showBuyPopup() {
    const overlay = document.getElementById('buyAccountOverlay');
    if (overlay) overlay.classList.add('active');
}

function hideBuyPopup() {
    const overlay = document.getElementById('buyAccountOverlay');
    if (overlay) overlay.classList.remove('active');
    showToast('You can activate anytime from Profile');
}

function handleBuyNow() {
    showToast('Opening payment page...');
    hideBuyPopup();
    
    setTimeout(() => {
        window.location.href = 'buyaccount.html';
    }, 1000);
}

// ==========================================
// HOME PAGE
// ==========================================

function initializeHome() {
    const termsCheckbox = document.getElementById('termsCheckbox');
    const signUpBtn = document.getElementById('signUpBtn');
    const signInBtn = document.getElementById('signInBtn');
    
    if (termsCheckbox) termsCheckbox.addEventListener('change', handleTermsChange);
    if (signUpBtn) signUpBtn.addEventListener('click', navigateToSignup);
    if (signInBtn) signInBtn.addEventListener('click', navigateToLogin);
}

function handleTermsChange(e) {
    const signUpBtn = document.getElementById('signUpBtn');
    if (signUpBtn) {
        signUpBtn.disabled = !e.target.checked;
        if (e.target.checked) {
            showToast('✓ Terms accepted');
        }
    }
}

function navigateToSignup() {
    const termsChecked = document.getElementById('termsCheckbox');
    
    if (termsChecked && !termsChecked.checked) {
        showToast('Please accept Terms & Conditions first');
        return;
    }
    
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        window.location.href = 'signup.html';
    }, 1000);
}

function navigateToLogin() {
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        window.location.href = 'login.html';
    }, 1000);
}

// ==========================================
// LOGIN PAGE
// ==========================================

function initializeLogin() {
    const loginBtn = document.getElementById('loginBtn');
    const forgotBtn = document.getElementById('forgotBtn');
    const createAccountBtn = document.getElementById('createAccountBtn');
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    if (forgotBtn) forgotBtn.addEventListener('click', handleForgotPassword);
    if (createAccountBtn) createAccountBtn.addEventListener('click', navigateToSignup);
    
    if (loginEmail) loginEmail.addEventListener('keypress', handleEnterKey);
    if (loginPassword) loginPassword.addEventListener('keypress', handleEnterKey);
    
    checkRememberedUser();
}

function handleEnterKey(e) {
    if (e.key === 'Enter') {
        handleLogin();
    }
}

function checkRememberedUser() {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    const emailInput = document.getElementById('loginEmail');
    const rememberCheck = document.getElementById('rememberMe');
    
    if (rememberedEmail && emailInput) {
        emailInput.value = rememberedEmail;
        if (rememberCheck) rememberCheck.checked = true;
    }
}

function handleLogin() {
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const rememberCheck = document.getElementById('rememberMe');
    
    if (!emailInput || !passwordInput) return;
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const rememberMe = rememberCheck ? rememberCheck.checked : false;

    // Validation
    if (!email || !email.includes('@')) {
        showToast('Please enter a valid email address');
        return;
    }

    if (!password) {
        showToast('Please enter your password');
        return;
    }

    showLoading();

    setTimeout(() => {
        hideLoading();
        
        const savedEmail = localStorage.getItem('userEmail');
        const savedPassword = localStorage.getItem('userPassword');

        if (email === savedEmail && password === savedPassword) {
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }
            
            showToast('Login successful!');
            
            setTimeout(() => {
                navigateAfterLogin();
            }, 1000);
        } else if (email === 'remotest@gmail.com' && password === '123456') {
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            }
            
            showToast('Login successful! (Demo Mode)');
            
            setTimeout(() => {
                window.location.href = 'pointstonote.html';
            }, 1000);
        } else {
            showToast('Invalid email or password');
        }
    }, 2000);
}

function navigateAfterLogin() {
    const bonusClaimed = localStorage.getItem('bonusClaimed');
    const boughtAccount = localStorage.getItem('boughtAccount');

    if (bonusClaimed === 'true' && boughtAccount === 'true') {
        window.location.href = 'dashboard.html';
    } else if (bonusClaimed === 'true' && boughtAccount !== 'true') {
        window.location.href = 'buyaccount.html';
    } else if (bonusClaimed !== 'true') {
        window.location.href = 'onboarding.html';
    } else {
        window.location.href = 'home.html';
    }
}

function handleForgotPassword() {
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        showToast('Password reset feature coming soon!');
    }, 1500);
}

// ==========================================
// SIGNUP PAGE
// ==========================================

function initializeSignup() {
    populateCountries();
    
    const signupBtn = document.getElementById('signupBtn');
    const backToLoginBtn = document.getElementById('backToLoginBtn');
    const notRobotCheck = document.getElementById('notRobotCheck');
    const mathAnswer = document.getElementById('mathAnswer');
    const refreshMath = document.getElementById('refreshMath');
    const confirmRobotBtn = document.getElementById('confirmRobotBtn');
    const cancelRobotBtn = document.getElementById('cancelRobotBtn');
    
    if (signupBtn) signupBtn.addEventListener('click', handleSignup);
    if (backToLoginBtn) backToLoginBtn.addEventListener('click', navigateToLogin);
    if (notRobotCheck) notRobotCheck.addEventListener('change', handleRobotCheckChange);
    if (mathAnswer) mathAnswer.addEventListener('input', handleMathAnswerChange);
    if (refreshMath) refreshMath.addEventListener('click', generateMathChallenge);
    if (confirmRobotBtn) confirmRobotBtn.addEventListener('click', handleRobotConfirm);
    if (cancelRobotBtn) cancelRobotBtn.addEventListener('click', hideRobotVerification);
}

function populateCountries() {
    const select = document.getElementById('signupCountry');
    if (!select) return;
    
    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        if (country === 'Kenya') {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

function handleSignup() {
    const name = getInputValue('signupName');
    const phone = getInputValue('signupPhone');
    const email = getInputValue('signupEmail');
    const country = getSelectValue('signupCountry');
    const password = getInputValue('signupPassword');
    const confirmPassword = getInputValue('signupConfirmPassword');

    // Validation
    if (!name) {
        showToast('Please enter your full name');
        return;
    }

    if (!phone) {
        showToast('Please enter your phone number');
        return;
    }

    if (!email || !validateEmail(email)) {
        showToast('Please enter a valid email address');
        return;
    }

    if (!country) {
        showToast('Please select your country');
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

    showLoading();
    
    setTimeout(() => {
        hideLoading();
        showRobotVerification();
    }, 1500);
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Robot Verification
function showRobotVerification() {
    const overlay = document.getElementById('robotVerifyOverlay');
    if (overlay) {
        overlay.classList.add('active');
        generateMathChallenge();
    }
}

function hideRobotVerification() {
    const overlay = document.getElementById('robotVerifyOverlay');
    if (overlay) overlay.classList.remove('active');
    
    const notRobotCheck = document.getElementById('notRobotCheck');
    const mathChallenge = document.getElementById('mathChallenge');
    const mathAnswer = document.getElementById('mathAnswer');
    const confirmBtn = document.getElementById('confirmRobotBtn');
    
    if (notRobotCheck) notRobotCheck.checked = false;
    if (mathChallenge) mathChallenge.classList.remove('active');
    if (mathAnswer) mathAnswer.value = '';
    if (confirmBtn) confirmBtn.disabled = true;
    
    isAnswerCorrect = false;
}

function handleRobotCheckChange(e) {
    const mathChallenge = document.getElementById('mathChallenge');
    if (!mathChallenge) return;
    
    if (e.target.checked) {
        mathChallenge.classList.add('active');
        generateMathChallenge();
        
        setTimeout(() => {
            shakeMathQuestion();
        }, 250);
        
        setTimeout(() => {
            const mathAnswer = document.getElementById('mathAnswer');
            if (mathAnswer) mathAnswer.focus();
        }, 300);
    } else {
        mathChallenge.classList.remove('active');
        isAnswerCorrect = false;
        
        const mathAnswer = document.getElementById('mathAnswer');
        const confirmBtn = document.getElementById('confirmRobotBtn');
        
        if (mathAnswer) mathAnswer.value = '';
        if (confirmBtn) confirmBtn.disabled = true;
    }
}

function generateMathChallenge() {
    mathNum1 = Math.floor(Math.random() * 20) + 1;
    mathNum2 = Math.floor(Math.random() * 20) + 1;
    correctAnswer = mathNum1 + mathNum2;
    
    const mathQuestion = document.getElementById('mathQuestion');
    const mathAnswer = document.getElementById('mathAnswer');
    const confirmBtn = document.getElementById('confirmRobotBtn');
    
    if (mathQuestion) mathQuestion.textContent = `${mathNum1} + ${mathNum2} = ?`;
    if (mathAnswer) mathAnswer.value = '';
    if (confirmBtn) confirmBtn.disabled = true;
    
    isAnswerCorrect = false;
}

function shakeMathQuestion() {
    const question = document.getElementById('mathQuestion');
    if (!question) return;
    
    const shakeSequence = [
        { transform: 'translateX(-8px)', duration: 50 },
        { transform: 'translateX(8px)', duration: 50 },
        { transform: 'translateX(-8px)', duration: 50 },
        { transform: 'translateX(8px)', duration: 50 },
        { transform: 'translateX(-8px)', duration: 50 },
        { transform: 'translateX(8px)', duration: 50 },
        { transform: 'translateX(0)', duration: 50 }
    ];
    
    let delay = 0;
    shakeSequence.forEach(step => {
        setTimeout(() => {
            question.style.transform = step.transform;
        }, delay);
        delay += step.duration;
    });
}

function handleMathAnswerChange(e) {
    const userAnswer = parseInt(e.target.value);
    const confirmBtn = document.getElementById('confirmRobotBtn');
    
    if (userAnswer === correctAnswer) {
        isAnswerCorrect = true;
        if (confirmBtn) confirmBtn.disabled = false;
        showToast('✓ Correct!');
    } else {
        isAnswerCorrect = false;
        if (confirmBtn) confirmBtn.disabled = true;
    }
}

function handleRobotConfirm() {
    const robotChecked = document.getElementById('notRobotCheck');
    
    if (isAnswerCorrect && robotChecked && robotChecked.checked) {
        showToast('✓ Verification successful!');
        hideRobotVerification();
        
        showLoading();
        
        setTimeout(() => {
            hideLoading();
            processRegistration();
        }, 2000);
    } else {
        showToast('Please solve the math challenge first');
    }
}

function processRegistration() {
    const name = getInputValue('signupName');
    const phone = getInputValue('signupPhone');
    const email = getInputValue('signupEmail');
    const country = getSelectValue('signupCountry');
    const password = getInputValue('signupPassword');
    const referralCode = getInputValue('signupReferral');
    
    localStorage.setItem('userName', name);
    localStorage.setItem('userPhone', phone);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userCountry', country);
    localStorage.setItem('userPassword', password);
    localStorage.setItem('signupComplete', 'true');
    
    if (referralCode) {
        localStorage.setItem('userReferralCode', referralCode);
    }
    
    showToast('Account created successfully!');
    
    clearSignupForm();
    
    setTimeout(() => {
        window.location.href = 'onboarding.html';
    }, 1500);
}

function clearSignupForm() {
    setInputValue('signupName', '');
    setInputValue('signupPhone', '');
    setInputValue('signupEmail', '');
    setInputValue('signupPassword', '');
    setInputValue('signupConfirmPassword', '');
    setInputValue('signupReferral', '');
    
    const countrySelect = document.getElementById('signupCountry');
    if (countrySelect) countrySelect.value = 'Kenya';
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('active');
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('active');
}

function showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgb(30, 41, 59);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            border: 1px solid rgb(71, 85, 105);
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.opacity = '1';

    setTimeout(() => {
        toast.style.opacity = '0';
    }, 3000);
}

function getInputValue(id) {
    const input = document.getElementById(id);
    return input ? input.value.trim() : '';
}

function setInputValue(id, value) {
    const input = document.getElementById(id);
    if (input) input.value = value;
}

function getSelectValue(id) {
    const select = document.getElementById(id);
    return select ? select.value : '';
}