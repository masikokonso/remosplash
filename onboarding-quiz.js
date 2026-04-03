// ================== STATE MANAGEMENT ==================
const state = {
    currentQuestion: 0,
    totalQuestions: 5,
    score: 0,
    questions: [],
    arrangedWords: [],
    totalEarnings: 0,
    bonusClaimed: false,
    bonusAmount: 0
};

// ================== QUESTION DATA STRUCTURE ==================
class Question {
    constructor(id, type, title, description, options, correctAnswer) {
        this.id = id;
        this.type = type; // 'arrange' or 'multiple_choice'
        this.title = title;
        this.description = description;
        this.options = options;
        this.correctAnswer = correctAnswer;
        this.userAnswer = '';
    }
}

// ================== INITIALIZATION ==================
document.addEventListener('DOMContentLoaded', () => {
    loadQuestions();
    loadEarnings();
    checkBonusClaimStatus();
});

// ================== LOAD QUESTIONS ==================
function loadQuestions() {
    state.questions = [
        // Question 1: Sentence Arrangement
        new Question(
            1,
            'arrange',
            'Arrange the Sentence',
            'Put these words in the correct order to form a meaningful sentence:',
            ['cats', 'love', 'fish', 'eating'],
            'cats love eating fish'
        ),

        // Question 2: Multiple Choice
        new Question(
            2,
            'multiple_choice',
            'Pick the Odd One Out',
            'Which one does NOT belong in this group?',
            ['Apple', 'Banana', 'Mango', 'Carrot'],
            'Carrot'
        ),

        // Question 3: Sentiment Analysis
        new Question(
            3,
            'multiple_choice',
            'Sentiment Classification',
            'How does this message feel? "I am so happy today, everything is going great!"',
            ['Happy', 'Sad', 'Angry', 'Confused'],
            'Happy'
        ),

        // Question 4: Simple Categorization
        new Question(
            4,
            'multiple_choice',
            'Group It Correctly',
            'Which category does "Lion" belong to?',
            ['Animal', 'Food', 'Vehicle', 'Clothing'],
            'Animal'
        ),

        // Question 5: Relationship Identification
        new Question(
            5,
            'multiple_choice',
            'Spot the Connection',
            'What is the relationship between "Teacher" and "School"?',
            ['Works there', 'Lives there', 'Shops there', 'Plays there'],
            'Works there'
        )
    ];

    state.totalQuestions = state.questions.length;
}

// ================== EARNINGS AND BONUS MANAGEMENT ==================
function loadEarnings() {
    try {
        const earnings = localStorage.getItem('earnings');
        if (earnings) {
            const earningsData = JSON.parse(earnings);
            state.totalEarnings = earningsData[0] || 0;
        } else {
            state.totalEarnings = 0;
        }
    } catch (error) {
        console.error('Error loading earnings:', error);
        state.totalEarnings = 0;
    }
}

function saveEarnings() {
    try {
        localStorage.setItem('earnings', JSON.stringify([state.totalEarnings]));
    } catch (error) {
        console.error('Error saving earnings:', error);
    }
}

function checkBonusClaimStatus() {
    try {
        const bonusClaimed = localStorage.getItem('bonus_claimed');
        if (bonusClaimed) {
            state.bonusClaimed = true;
            console.log('Bonus already claimed');
        } else {
            state.bonusClaimed = false;
            console.log('Bonus not yet claimed');
        }
    } catch (error) {
        console.error('Error checking bonus status:', error);
        state.bonusClaimed = false;
    }
}

function markBonusAsClaimed() {
    try {
        const bonusData = {
            timestamp: Date.now(),
            amount: state.bonusAmount
        };
        localStorage.setItem('bonus_claimed', JSON.stringify(bonusData));
        state.bonusClaimed = true;
        console.log('Bonus marked as claimed');
    } catch (error) {
        console.error('Error marking bonus as claimed:', error);
    }
}

// ================== SCREEN NAVIGATION ==================
function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // Show target screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }

    // Scroll to top
    window.scrollTo(0, 0);
}

// ================== LOADING OVERLAY ==================
function showLoading(duration, callback) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.add('active');

    setTimeout(() => {
        overlay.classList.remove('active');
        if (callback) callback();
    }, duration);
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

// ================== START ASSESSMENT ==================
function startAssessment() {
    showLoading(1500, () => {
        state.currentQuestion = 0;
        state.score = 0;
        state.arrangedWords = [];

        // Reset all user answers
        state.questions.forEach(q => q.userAnswer = '');

        showQuestion();
    });
}

// ================== SHOW QUESTION ==================
function showQuestion() {
    if (state.currentQuestion >= state.totalQuestions) {
        showResults();
        return;
    }

    const question = state.questions[state.currentQuestion];
    state.arrangedWords = [];

    // Update progress
    updateProgress();

    // Update question content
    document.getElementById('questionNumber').textContent = state.currentQuestion + 1;
    document.getElementById('questionTitle').textContent = question.title;
    document.getElementById('questionDescription').textContent = question.description;

    // Show appropriate question type
    const multipleChoiceContainer = document.getElementById('multipleChoiceContainer');
    const arrangeContainer = document.getElementById('arrangeContainer');

    if (question.type === 'arrange') {
        multipleChoiceContainer.style.display = 'none';
        arrangeContainer.style.display = 'block';
        renderArrangeQuestion(question);
    } else {
        multipleChoiceContainer.style.display = 'block';
        arrangeContainer.style.display = 'none';
        renderMultipleChoice(question);
    }

    showScreen('questionScreen');
}

function updateProgress() {
    const percentage = (state.currentQuestion / state.totalQuestions) * 100;
    document.getElementById('progressFill').style.width = percentage + '%';
    document.getElementById('progressText').textContent =
        `Question ${state.currentQuestion + 1} of ${state.totalQuestions}`;
}

// ================== RENDER ARRANGE QUESTION ==================
function renderArrangeQuestion(question) {
    const wordGrid = document.getElementById('wordGrid');
    const selectedWords = document.getElementById('selectedWords');

    wordGrid.innerHTML = '';
    selectedWords.textContent = 'Your answer: (tap words above)';

    question.options.forEach(word => {
        const button = document.createElement('button');
        button.className = 'word-btn';
        button.textContent = word;
        button.onclick = () => selectWord(word, button);
        wordGrid.appendChild(button);
    });
}

function selectWord(word, button) {
    // Add word to arranged list
    state.arrangedWords.push(word);

    // Build sentence
    const sentence = state.arrangedWords.join(' ');

    // Update display
    document.getElementById('selectedWords').textContent = 'Your answer: ' + sentence;

    // Update question's user answer
    const question = state.questions[state.currentQuestion];
    question.userAnswer = sentence;

    // Disable button
    button.disabled = true;
}

// ================== RENDER MULTIPLE CHOICE ==================
function renderMultipleChoice(question) {
    const container = document.getElementById('multipleChoiceContainer');
    container.innerHTML = '';

    question.options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.textContent = option;
        button.onclick = () => selectOption(option, button);
        container.appendChild(button);
    });
}

function selectOption(option, button) {
    // Update question's user answer
    const question = state.questions[state.currentQuestion];
    question.userAnswer = option;

    // Update button styles
    const container = document.getElementById('multipleChoiceContainer');
    container.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    button.classList.add('selected');
}

// ================== NEXT QUESTION ==================
function nextQuestion() {
    const question = state.questions[state.currentQuestion];

    // Validate answer
    if (!question.userAnswer || question.userAnswer === '') {
        showToast('Please select an answer before continuing');
        return;
    }

    showLoading(1000, () => {
        // Check if answer is correct
        if (question.userAnswer === question.correctAnswer) {
            state.score++;
        }

        state.currentQuestion++;
        showQuestion();
    });
}

// ================== SHOW RESULTS ==================
function showResults() {
    const percentage = Math.round((state.score / state.totalQuestions) * 100);
    const passed = percentage >= 60;

    // Update result icon
    const resultIcon = document.getElementById('resultIcon');
    resultIcon.textContent = passed ? '✓' : '✗';
    resultIcon.className = 'result-icon ' + (passed ? 'pass' : 'fail');

    // Update result title
    const resultTitle = document.getElementById('resultTitle');
    if (passed) {
        resultTitle.innerHTML = 'Congratulations!<br>Screening Passed!';
    } else {
        resultTitle.textContent = 'Assessment Complete';
    }

    // Update score card
    const scoreCard = document.getElementById('scoreCard');
    scoreCard.className = 'score-card ' + (passed ? 'pass' : 'fail');

    const scorePercentage = document.getElementById('scorePercentage');
    scorePercentage.textContent = percentage + '%';
    scorePercentage.className = 'score-percentage ' + (passed ? 'pass' : 'fail');

    const scoreDetails = document.getElementById('scoreDetails');
    scoreDetails.textContent = `${state.score} out of ${state.totalQuestions} questions correct`;

    // Update qualified badge
    const qualifiedBadge = document.getElementById('qualifiedBadge');
    if (passed) {
        qualifiedBadge.textContent = '✓ Qualified for AI Training Tasks';
        qualifiedBadge.style.display = 'block';
    } else {
        qualifiedBadge.style.display = 'none';
    }

    // Update action button
    const actionButton = document.getElementById('actionButton');
    if (passed) {
        actionButton.textContent = 'Continue to Dashboard →';
        actionButton.className = 'btn btn-success';
    } else {
        actionButton.textContent = 'Retake Assessment';
        actionButton.className = 'btn btn-danger';
    }

    showScreen('resultsScreen');
}

// ================== HANDLE ACTION ==================
function handleAction() {
    const actionButton = document.getElementById('actionButton');

    if (actionButton.textContent.includes('Retake')) {
        // Retake assessment
        showLoading(1500, () => {
            showScreen('welcomeScreen');
        });
    } else {
        // Continue to dashboard
        showLoading(2000, () => {
            if (state.bonusClaimed) {
                // Skip bonus panel, go to dashboard
                showToast("Welcome back! Proceeding to dashboard...", true);
                //window.location.href = 'account-purchase.html';
                window.location.href = 'dashboard.html';
                console.log('Navigating to dashboard...');
            } else {
                // Show bonus panel for first-time passers
                showBonusPanel();
            }
        });
    }
}

// ================== BONUS PANEL ==================
function showBonusPanel() {
    // Generate random bonus between 14 and 19
    state.bonusAmount = Math.floor(Math.random() * 6) + 14; // 14-19 inclusive

    // Update bonus display
    document.getElementById('bonusAmount').textContent = `$${state.bonusAmount}.00`;

    // Show bonus overlay
    document.getElementById('bonusOverlay').classList.add('active');
}

function claimBonus() {
    if (state.bonusClaimed) {
        showToast('Bonus already claimed!');
        window.location.href = 'account-purchase.html';
        return;
    }

    showLoading(2000, () => {
        state.totalEarnings += state.bonusAmount;
        saveEarnings();
        markBonusAsClaimed();

        document.getElementById('bonusOverlay').classList.remove('active');
        showToast(`$${state.bonusAmount} bonus credited! Total: $${state.totalEarnings.toFixed(2)}`, true);

        setTimeout(() => {
            window.location.href = 'account-purchase.html'; // ← was missing
        }, 1000);
    });
}

// ================== UTILITY FUNCTIONS ==================
function resetBonusStatus() {
    localStorage.removeItem('bonus_claimed');
    state.bonusClaimed = false;
    console.log('Bonus status reset');
}

function resetAllData() {
    localStorage.removeItem('earnings');
    localStorage.removeItem('bonus_claimed');
    state.totalEarnings = 0;
    state.bonusClaimed = false;
    state.score = 0;
    state.currentQuestion = 0;
    state.arrangedWords = [];
    state.questions.forEach(q => q.userAnswer = '');
    console.log('All data reset');
    showScreen('welcomeScreen');
}

// Expose utility functions globally for testing
window.quizUtils = {
    resetBonus: resetBonusStatus,
    resetAll: resetAllData,
    getEarnings: () => state.totalEarnings,
    getBonusStatus: () => state.bonusClaimed,
    setEarnings: (amount) => {
        state.totalEarnings = amount;
        saveEarnings();
    }
};
