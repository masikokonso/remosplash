// ================== STATE MANAGEMENT ==================
const state = {
    currentScreen: 'home',
    currentPack: 0,
    currentQuestion: 0,
    packScore: 0,
    totalEarnings: 0,
    packs: [],
    countdownSeconds: 5,
    countdownInterval: null
};

// ================== INITIALIZATION ==================
document.addEventListener('DOMContentLoaded', () => {
    loadAllPacks();
    loadEarningsProgress();
    loadPackProgress();
    renderHome();
});

// ================== EARNINGS AND PROGRESS ==================
function loadEarningsProgress() {
    const saved = localStorage.getItem('earnings');
    if (saved) {
        const data = JSON.parse(saved);
        state.totalEarnings = data.total || 0;
    }
}

function saveEarningsProgress() {
    localStorage.setItem('earnings', JSON.stringify({
        total: state.totalEarnings
    }));
}

function loadPackProgress() {
    const saved = localStorage.getItem('text_annotation_pack_progress');
    if (saved) {
        const progress = JSON.parse(saved);
        progress.forEach(item => {
            const pack = state.packs.find(p => p.id === item.id);
            if (pack) {
                pack.completed = item.completed;
                pack.earnings = item.earnings;
                pack.score = item.score || 0;
            }
        });
    }
}

function savePackProgress() {
    const progress = state.packs
        .filter(p => p.completed)
        .map(p => ({
            id: p.id,
            completed: p.completed,
            earnings: p.earnings,
            score: p.score
        }));
    localStorage.setItem('text_annotation_pack_progress', JSON.stringify(progress));
}

function generatePackEarnings() {
    // $1.50 to $2.00 (150 to 201 cents, divided by 100)
    return (Math.floor(Math.random() * (201 - 150) + 150)) / 100;
}

function formatEarnings(amount) {
    return amount.toFixed(2);
}

// ================== LOADING OVERLAY ==================
function showLoading(callback) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.add('active');
    setTimeout(() => {
        overlay.classList.remove('active');
        if (callback) callback();
    }, 2000);
}

// ================== SCREEN NAVIGATION ==================
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenName + 'Screen').classList.add('active');
    state.currentScreen = screenName;
    
    // Scroll to top
    window.scrollTo(0, 0);
}

function showHome() {
    stopCountdown();
    showLoading(() => {
        renderHome();
        showScreen('home');
    });
}

function showPackIntro() {
    showLoading(() => {
        renderPackIntro();
        showScreen('packIntro');
    });
}

function startQuestions() {
    showLoading(() => {
        showQuestion();
        showScreen('question');
    });
}

function showPackResults() {
    stopCountdown();
    showLoading(() => {
        renderResults();
        showScreen('results');
    });
}

function showStats() {
    showLoading(() => {
        renderStats();
        showScreen('stats');
    });
}

// ================== COUNTDOWN TIMER ==================
function startCountdown() {
    state.countdownSeconds = 5;
    updateCountdownDisplay();
    
    state.countdownInterval = setInterval(() => {
        state.countdownSeconds--;
        
        if (state.countdownSeconds <= 0) {
            stopCountdown();
            state.countdownSeconds = 0;
            updateCountdownDisplay();
            enableNextButton();
        } else {
            updateCountdownDisplay();
        }
    }, 1000);
}

function stopCountdown() {
    if (state.countdownInterval) {
        clearInterval(state.countdownInterval);
        state.countdownInterval = null;
    }
}

function updateCountdownDisplay() {
    const countdownText = document.getElementById('countdownText');
    if (!countdownText) return;
    
    if (state.countdownSeconds <= 0) {
        countdownText.textContent = 'Ready to proceed!';
        countdownText.className = 'countdown-text ready';
    } else {
        countdownText.textContent = `Next item ready in: ${state.countdownSeconds}s`;
        
        if (state.countdownSeconds <= 2) {
            countdownText.className = 'countdown-text danger';
        } else if (state.countdownSeconds <= 3) {
            countdownText.className = 'countdown-text warning';
        } else {
            countdownText.className = 'countdown-text';
        }
    }
}

function enableNextButton() {
    const nextButton = document.getElementById('nextButton');
    if (nextButton) {
        nextButton.disabled = false;
        nextButton.classList.remove('btn-disabled');
    }
}

// ================== RENDER FUNCTIONS ==================
function renderHome() {
    const completedCount = state.packs.filter(p => p.completed).length;
    
    document.getElementById('homeProgressText').textContent = 
        `${completedCount} / ${state.packs.length} Categories Mastered`;
    document.getElementById('homeTotalEarnings').textContent = 
        `Total Earned: $${formatEarnings(state.totalEarnings)}`;
    
    const packsList = document.getElementById('packsList');
    packsList.innerHTML = state.packs.map(pack => `
        <div class="pack-card ${pack.completed ? 'completed' : ''}" onclick="selectPack(${pack.id})">
            <div class="pack-icon">
                ${pack.icon}
                ${pack.completed ? '<div class="pack-check">✓</div>' : ''}
            </div>
            <div class="pack-info">
                <div class="pack-name">${pack.name}</div>
                <div class="pack-description">${pack.description}</div>
                <div class="pack-status ${pack.completed ? 'completed' : 'pending'}">
                    ${pack.completed 
                        ? `✓ Mastered • Earned: $${formatEarnings(pack.earnings)}`
                        : `${pack.totalQuestions} Items • Earn: $1.50-$2.00`
                    }
                </div>
            </div>
            <button class="pack-button ${pack.completed ? 'completed' : ''}" onclick="event.stopPropagation(); selectPack(${pack.id})">
                ${pack.completed ? 'Review →' : 'Begin →'}
            </button>
        </div>
    `).join('');
}

function renderPackIntro() {
    const pack = state.packs[state.currentPack];
    
    document.getElementById('introIcon').textContent = pack.icon;
    document.getElementById('introTitle').textContent = pack.name;
    document.getElementById('introText').innerHTML = `
        ${pack.description}<br><br>
        📊 Annotation Items: ${pack.totalQuestions}<br>
        ⏱️ Estimated Duration: ${pack.totalQuestions * 1} min<br>
        💰 Earnings on Completion: $1.50-$2.00<br><br>
        Complete all questions to earn!
    `;
}

function showQuestion() {
    const pack = state.packs[state.currentPack];
    
    if (state.currentQuestion >= pack.questions.length) {
        // Pack completed
        if (!pack.completed) {
            const earnings = generatePackEarnings();
            pack.earnings = earnings;
            state.totalEarnings += earnings;
            pack.completed = true;
            pack.score = state.packScore;
            
            saveEarningsProgress();
            savePackProgress();
        }
        showPackResults();
        return;
    }
    
    const question = pack.questions[state.currentQuestion];
    const progress = (state.currentQuestion / pack.totalQuestions) * 100;
    
    // Update progress bar
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('progressText').textContent = 
        `Item ${state.currentQuestion + 1} of ${pack.totalQuestions}`;
    
    // Update question
    document.getElementById('questionBadge').textContent = state.currentQuestion + 1;
    document.getElementById('questionTitle').textContent = question.title;
    document.getElementById('questionText').textContent = question.text;
    
    // Render options
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = question.options.map((option, index) => `
        <button class="option-button ${question.userAnswer === option ? 'selected' : ''}" 
                onclick="selectOption('${option.replace(/'/g, "\\'")}')">
            ${option}
        </button>
    `).join('');
    
    // Update next button
    const nextButton = document.getElementById('nextButton');
    if (state.currentQuestion >= pack.totalQuestions - 1) {
        nextButton.textContent = 'Complete →';
    } else {
        nextButton.textContent = 'Next Item →';
    }
    nextButton.disabled = true;
    
    // Start countdown
    startCountdown();
}

function selectOption(option) {
    const pack = state.packs[state.currentPack];
    const question = pack.questions[state.currentQuestion];
    question.userAnswer = option;
    
    // Update UI
    const buttons = document.querySelectorAll('.option-button');
    buttons.forEach(btn => {
        if (btn.textContent.trim() === option) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
}

function nextQuestion() {
    stopCountdown();
    
    const pack = state.packs[state.currentPack];
    const question = pack.questions[state.currentQuestion];
    
    // Check if answer was correct
    if (question.userAnswer === question.correctAnswer) {
        state.packScore++;
    }
    
    state.currentQuestion++;
    
    if (state.currentQuestion >= pack.totalQuestions) {
        // Pack completed
        if (!pack.completed) {
            const earnings = generatePackEarnings();
            pack.earnings = earnings;
            state.totalEarnings += earnings;
            pack.completed = true;
            pack.score = state.packScore;
            
            saveEarningsProgress();
            savePackProgress();
        }
        showPackResults();
    } else {
        showQuestion();
    }
}

function renderResults() {
    const pack = state.packs[state.currentPack];
    const percentage = Math.round((state.packScore / pack.totalQuestions) * 100);
    
    document.getElementById('resultPackName').textContent = pack.name;
    document.getElementById('resultDetails').innerHTML = `
        Accuracy: ${state.packScore}/${pack.totalQuestions} (${percentage}%)<br>
        💰 Earned: $${formatEarnings(pack.earnings)}<br>
        💎 Total Earnings: $${formatEarnings(state.totalEarnings)}
    `;
}

function renderStats() {
    const completedCount = state.packs.filter(p => p.completed).length;
    
    document.getElementById('statsEarnings').textContent = `$${formatEarnings(state.totalEarnings)}`;
    document.getElementById('statsText').innerHTML = 
        `Total Earned<br>${completedCount} of ${state.packs.length} Categories`;
    
    const statsPacksList = document.getElementById('statsPacksList');
    statsPacksList.innerHTML = state.packs.map(pack => `
        <div class="pack-stat-card">
            <div class="pack-stat-icon">${pack.icon}</div>
            <div class="pack-stat-info">
                <div class="pack-stat-name">${pack.name}</div>
                <div class="pack-stat-status ${pack.completed ? 'completed' : 'pending'}">
                    ${pack.completed 
                        ? `✓ Earned: $${formatEarnings(pack.earnings)}`
                        : 'Not completed'
                    }
                </div>
            </div>
            ${pack.completed ? '<div class="pack-stat-badge">DONE</div>' : ''}
        </div>
    `).join('');
}

// ================== PACK SELECTION ==================
function selectPack(packId) {
    state.currentPack = packId - 1;
    state.currentQuestion = 0;
    state.packScore = 0;
    
    const pack = state.packs[state.currentPack];
    pack.questions.forEach(q => q.userAnswer = '');
    
    showPackIntro();
}

function continueNext() {
    if (state.currentPack < state.packs.length - 1) {
        selectPack(state.currentPack + 2);
    } else {
        showHome();
    }
}

function retakePack() {
    state.currentQuestion = 0;
    state.packScore = 0;
    
    const pack = state.packs[state.currentPack];
    pack.questions.forEach(q => q.userAnswer = '');
    
    showPackIntro();
}

// ================== PACK LOADERS ==================
function loadAllPacks() {
    state.packs = [];
    
    loadPack1_SentimentAnalysis();
    loadPack2_NamedEntityRecognition();
    loadPack3_TextClassification();
    loadPack4_IntentRecognition();
    loadPack5_EmotionDetection();
    loadPack6_KeywordExtraction();
    loadPack7_LanguageDetection();
    loadPack8_TextSummarization();
    loadPack9_SpamDetection();
    loadPack10_TopicIdentification();
    loadPack11_SentimentIntensity();
    loadPack12_QuestionClassification();
    loadPack13_TextRelevance();
    loadPack14_ToneAnalysis();
    loadPack15_ContentModeration();
    loadPack16_GrammarChecking();
    loadPack17_TextCoherence();
    loadPack18_FormalityLevel();
    loadPack19_SarcasmDetection();
    loadPack20_UrgencyDetection();
    loadPack21_ProductReviews();
    loadPack22_NewsCategorization();
    loadPack23_ComplaintAnalysis();
    loadPack24_JobDescriptionAnalysis();
    loadPack25_EmailPriority();
    loadPack26_BrandSentiment();
    loadPack27_PoliticalBias();
    loadPack28_HateSpeechDetection();
    loadPack29_FactVsOpinion();
    loadPack30_ClickbaitDetection();
    loadPack31_WritingQuality();
    loadPack32_ArgumentStrength();
    loadPack33_ReadabilityLevel();
    loadPack34_CustomerSatisfaction();
    loadPack35_MedicalTextAnalysis();
    loadPack36_LegalDocumentType();
    loadPack37_AcademicWriting();
    loadPack38_SocialMediaEngagement();
    loadPack39_ProductFeatureExtraction();
    loadPack40_CrisisDetection();
    loadPack41_MisinformationDetection();
    loadPack42_AuthorAttribution();
    loadPack43_TimeSensitivity();
    loadPack44_CulturalContext();
    loadPack45_TechnicalDifficulty();
    loadPack46_PersuasionTechniques();
    loadPack47_EmotionalAppeal();
    loadPack48_InformationCompleteness();
    loadPack49_BiasDetection();
    loadPack50_TextAuthenticity();
}

function loadPack1_SentimentAnalysis() {
    const pack = {
        id: 1,
        name: 'Sentiment Analysis',
        description: 'Identify positive, negative, or neutral sentiments',
        icon: '😊',
        completed: false,
        score: 0,
        earnings: 0,
        questions: [
            {
                title: 'Product Review Sentiment',
                text: 'Review: \'This laptop is amazing! Super fast and the battery lasts all day. Best purchase I\'ve made this year!\'',
                options: ['Positive', 'Negative', 'Neutral', 'Mixed'],
                correctAnswer: 'Positive',
                userAnswer: ''
            },
            {
                title: 'Customer Service Experience',
                text: 'Feedback: \'I waited 2 hours on hold and nobody helped me. Completely disappointed with the service.\'',
                options: ['Positive', 'Negative', 'Neutral', 'Mixed'],
                correctAnswer: 'Negative',
                userAnswer: ''
            },
            {
                title: 'News Article Tone',
                text: 'Article excerpt: \'The company reported its quarterly earnings today. Revenue was $5.2 billion, matching analyst expectations.\'',
                options: ['Positive', 'Negative', 'Neutral', 'Mixed'],
                correctAnswer: 'Neutral',
                userAnswer: ''
            },
            {
                title: 'Social Media Post',
                text: 'Post: \'The food was delicious but the service was terrible. Not sure if I\'ll go back.\'',
                options: ['Positive', 'Negative', 'Neutral', 'Mixed'],
                correctAnswer: 'Mixed',
                userAnswer: ''
            },
            {
                title: 'App Review Analysis',
                text: 'Review: \'This app keeps crashing and draining my battery. Total waste of money. Don\'t download!\'',
                options: ['Positive', 'Negative', 'Neutral', 'Mixed'],
                correctAnswer: 'Negative',
                userAnswer: ''
            },
            {
                title: 'Book Review Sentiment',
                text: 'Review: \'An absolutely captivating story! I couldn\'t put it down. The author\'s writing style is brilliant.\'',
                options: ['Positive', 'Negative', 'Neutral', 'Mixed'],
                correctAnswer: 'Positive',
                userAnswer: ''
            }
        ]
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack2_NamedEntityRecognition() {
    const pack = {
        id: 2,
        name: 'Named Entity Recognition',
        description: 'Identify people, places, organizations, and dates',
        icon: '🏷️',
        completed: false,
        score: 0,
        earnings: 0,
        questions: [
            {
                title: 'Identify the Person',
                text: 'Text: \'Dr. Sarah Johnson published her research at MIT yesterday.\'\n\nWhat is \'Dr. Sarah Johnson\'?',
                options: ['Person', 'Organization', 'Location', 'Date'],
                correctAnswer: 'Person',
                userAnswer: ''
            },
            {
                title: 'Identify the Organization',
                text: 'Text: \'Apple Inc. announced new products at their headquarters in California.\'\n\nWhat is \'Apple Inc.\'?',
                options: ['Person', 'Organization', 'Location', 'Product'],
                correctAnswer: 'Organization',
                userAnswer: ''
            },
            {
                title: 'Identify the Location',
                text: 'Text: \'The conference will be held in Paris next month.\'\n\nWhat is \'Paris\'?',
                options: ['Person', 'Organization', 'Location', 'Event'],
                correctAnswer: 'Location',
                userAnswer: ''
            },
            {
                title: 'Identify the Date',
                text: 'Text: \'The meeting is scheduled for December 15, 2024.\'\n\nWhat is \'December 15, 2024\'?',
                options: ['Person', 'Date', 'Location', 'Time'],
                correctAnswer: 'Date',
                userAnswer: ''
            },
            {
                title: 'Complex Entity Recognition',
                text: 'Text: \'President Biden visited the United Nations in New York last Tuesday.\'\n\nWhat is \'United Nations\'?',
                options: ['Person', 'Organization', 'Location', 'Event'],
                correctAnswer: 'Organization',
                userAnswer: ''
            },
            {
                title: 'Multiple Entities',
                text: 'Text: \'Amazon opened a new warehouse in Seattle on Monday.\'\n\nWhat is \'Seattle\'?',
                options: ['Person', 'Organization', 'Location', 'Date'],
                correctAnswer: 'Location',
                userAnswer: ''
            },
            {
                title: 'Entity Type Classification',
                text: 'Text: \'Tesla CEO Elon Musk tweeted about the company\'s latest model.\'\n\nWhat is \'Tesla\'?',
                options: ['Person', 'Organization', 'Product', 'Location'],
                correctAnswer: 'Organization',
                userAnswer: ''
            }
        ]
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack3_TextClassification() {
    const pack = {
        id: 3,
        name: 'Text Classification',
        description: 'Categorize text into appropriate topics',
        icon: '📁',
        completed: false,
        score: 0,
        earnings: 0,
        questions: [
            {
                title: 'Article Category',
                text: 'Article: \'Scientists discover a new exoplanet that may have conditions suitable for life. The planet orbits a distant star.\'',
                options: ['Science', 'Sports', 'Politics', 'Entertainment'],
                correctAnswer: 'Science',
                userAnswer: ''
            },
            {
                title: 'Email Classification',
                text: 'Email: \'Hi! Check out our amazing 50% off sale this weekend! Limited time offer on all electronics.\'',
                options: ['Personal', 'Promotional', 'Work', 'Spam'],
                correctAnswer: 'Promotional',
                userAnswer: ''
            },
            {
                title: 'News Topic',
                text: 'Headline: \'Local team wins championship after dramatic overtime victory in finals.\'',
                options: ['Business', 'Sports', 'Technology', 'Health'],
                correctAnswer: 'Sports',
                userAnswer: ''
            },
            {
                title: 'Blog Post Type',
                text: 'Post: \'Here\'s my recipe for the perfect chocolate chip cookies. Ingredients: flour, sugar, butter, chocolate chips...\'',
                options: ['Food & Cooking', 'Travel', 'Fashion', 'Finance'],
                correctAnswer: 'Food & Cooking',
                userAnswer: ''
            },
            {
                title: 'Support Ticket Category',
                text: 'Ticket: \'I\'m unable to log into my account. I\'ve tried resetting my password but didn\'t receive the email.\'',
                options: ['Technical Support', 'Billing', 'Feature Request', 'Feedback'],
                correctAnswer: 'Technical Support',
                userAnswer: ''
            },
            {
                title: 'Document Type',
                text: 'Text: \'Quarterly revenue increased by 15% compared to last year. Operating expenses were reduced by 8%.\'',
                options: ['Financial Report', 'Marketing Material', 'Legal Document', 'Research Paper'],
                correctAnswer: 'Financial Report',
                userAnswer: ''
            },
            {
                title: 'Social Media Category',
                text: 'Post: \'Just finished an amazing workout! Feeling energized and ready for the day. #fitness #motivation\'',
                options: ['Health & Fitness', 'Technology', 'News', 'Business'],
                correctAnswer: 'Health & Fitness',
                userAnswer: ''
            },
            {
                title: 'Content Classification',
                text: 'Article: \'New smartphone features AI-powered camera and 5G connectivity. Available in stores next month.\'',
                options: ['Technology', 'Fashion', 'Food', 'Travel'],
                correctAnswer: 'Technology',
                userAnswer: ''
            }
        ]
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

// Helper function to generate simple questions for packs 4-50
function generateSimpleQuestions(packId, packName) {
    const questions = [];
    for (let i = 1; i <= 6; i++) {
        questions.push({
            title: `${packName} - Question ${i}`,
            text: `This is a sample annotation task for ${packName}. Identify the correct category or label.`,
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 'Option A',
            userAnswer: ''
        });
    }
    return questions;
}

function loadPack4_IntentRecognition() {
    const pack = {
        id: 4,
        name: 'Intent Recognition',
        description: 'Identify the user\'s intention or purpose',
        icon: '🎯',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(4, 'Intent Recognition')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack5_EmotionDetection() {
    const pack = {
        id: 5,
        name: 'Emotion Detection',
        description: 'Identify emotional tone in text',
        icon: '💭',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(5, 'Emotion Detection')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack6_KeywordExtraction() {
    const pack = {
        id: 6,
        name: 'Keyword Extraction',
        description: 'Identify main keywords and key phrases',
        icon: '🔑',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(6, 'Keyword Extraction')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack7_LanguageDetection() {
    const pack = {
        id: 7,
        name: 'Language Detection',
        description: 'Identify the language of text samples',
        icon: '🌍',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(7, 'Language Detection')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack8_TextSummarization() {
    const pack = {
        id: 8,
        name: 'Text Summarization',
        description: 'Identify main ideas and summarize content',
        icon: '📄',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(8, 'Text Summarization')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack9_SpamDetection() {
    const pack = {
        id: 9,
        name: 'Spam Detection',
        description: 'Identify spam versus legitimate messages',
        icon: '🚫',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(9, 'Spam Detection')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack10_TopicIdentification() {
    const pack = {
        id: 10,
        name: 'Topic Identification',
        description: 'Determine the topic or subject matter',
        icon: '📚',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(10, 'Topic Identification')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack11_SentimentIntensity() {
    const pack = {
        id: 11,
        name: 'Sentiment Intensity',
        description: 'Determine strength of sentiment expressed',
        icon: '💪',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(11, 'Sentiment Intensity')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack12_QuestionClassification() {
    const pack = {
        id: 12,
        name: 'Question Classification',
        description: 'Categorize questions by type or purpose',
        icon: '❓',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(12, 'Question Classification')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack13_TextRelevance() {
    const pack = {
        id: 13,
        name: 'Text Relevance',
        description: 'Determine if text is relevant to topic',
        icon: '🎯',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(13, 'Text Relevance')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack14_ToneAnalysis() {
    const pack = {
        id: 14,
        name: 'Tone Analysis',
        description: 'Identify the tone and style of writing',
        icon: '🎭',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(14, 'Tone Analysis')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack15_ContentModeration() {
    const pack = {
        id: 15,
        name: 'Content Moderation',
        description: 'Identify appropriate vs inappropriate content',
        icon: '🛡️',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(15, 'Content Moderation')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack16_GrammarChecking() {
    const pack = {
        id: 16,
        name: 'Grammar Checking',
        description: 'Identify grammatical errors in text',
        icon: '✏️',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(16, 'Grammar Checking')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack17_TextCoherence() {
    const pack = {
        id: 17,
        name: 'Text Coherence',
        description: 'Evaluate logical flow and coherence',
        icon: '🔗',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(17, 'Text Coherence')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack18_FormalityLevel() {
    const pack = {
        id: 18,
        name: 'Formality Level',
        description: 'Determine formality of language',
        icon: '🎩',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(18, 'Formality Level')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack19_SarcasmDetection() {
    const pack = {
        id: 19,
        name: 'Sarcasm Detection',
        description: 'Identify sarcastic or ironic statements',
        icon: '😏',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(19, 'Sarcasm Detection')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack20_UrgencyDetection() {
    const pack = {
        id: 20,
        name: 'Urgency Detection',
        description: 'Identify urgency level in messages',
        icon: '⚡',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(20, 'Urgency Detection')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack21_ProductReviews() {
    const pack = {
        id: 21,
        name: 'Product Reviews',
        description: 'Analyze product review sentiment',
        icon: '⭐',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(21, 'Product Reviews')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack22_NewsCategorization() {
    const pack = {
        id: 22,
        name: 'News Categorization',
        description: 'Categorize news articles by type',
        icon: '📰',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(22, 'News Categorization')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack23_ComplaintAnalysis() {
    const pack = {
        id: 23,
        name: 'Complaint Analysis',
        description: 'Analyze customer complaints',
        icon: '😠',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(23, 'Complaint Analysis')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack24_JobDescriptionAnalysis() {
    const pack = {
        id: 24,
        name: 'Job Description Analysis',
        description: 'Analyze job posting content',
        icon: '💼',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(24, 'Job Description Analysis')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack25_EmailPriority() {
    const pack = {
        id: 25,
        name: 'Email Priority',
        description: 'Classify email importance level',
        icon: '📧',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(25, 'Email Priority')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack26_BrandSentiment() {
    const pack = {
        id: 26,
        name: 'Brand Sentiment',
        description: 'Analyze sentiment toward brands',
        icon: '🏢',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(26, 'Brand Sentiment')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack27_PoliticalBias() {
    const pack = {
        id: 27,
        name: 'Political Bias',
        description: 'Detect political bias in content',
        icon: '🗳️',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(27, 'Political Bias')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack28_HateSpeechDetection() {
    const pack = {
        id: 28,
        name: 'Hate Speech Detection',
        description: 'Identify hate speech and harassment',
        icon: '🚨',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(28, 'Hate Speech Detection')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack29_FactVsOpinion() {
    const pack = {
        id: 29,
        name: 'Fact vs Opinion',
        description: 'Distinguish facts from opinions',
        icon: '🔍',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(29, 'Fact vs Opinion')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack30_ClickbaitDetection() {
    const pack = {
        id: 30,
        name: 'Clickbait Detection',
        description: 'Identify clickbait headlines',
        icon: '🎣',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(30, 'Clickbait Detection')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack31_WritingQuality() {
    const pack = {
        id: 31,
        name: 'Writing Quality',
        description: 'Assess overall writing quality',
        icon: '✍️',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(31, 'Writing Quality')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack32_ArgumentStrength() {
    const pack = {
        id: 32,
        name: 'Argument Strength',
        description: 'Evaluate strength of arguments',
        icon: '💪',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(32, 'Argument Strength')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack33_ReadabilityLevel() {
    const pack = {
        id: 33,
        name: 'Readability Level',
        description: 'Assess text readability and complexity',
        icon: '📖',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(33, 'Readability Level')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack34_CustomerSatisfaction() {
    const pack = {
        id: 34,
        name: 'Customer Satisfaction',
        description: 'Measure customer satisfaction levels',
        icon: '😊',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(34, 'Customer Satisfaction')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack35_MedicalTextAnalysis() {
    const pack = {
        id: 35,
        name: 'Medical Text Analysis',
        description: 'Analyze medical and health-related text',
        icon: '⚕️',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(35, 'Medical Text Analysis')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack36_LegalDocumentType() {
    const pack = {
        id: 36,
        name: 'Legal Document Type',
        description: 'Classify legal documents by type',
        icon: '⚖️',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(36, 'Legal Document Type')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack37_AcademicWriting() {
    const pack = {
        id: 37,
        name: 'Academic Writing',
        description: 'Evaluate academic writing quality',
        icon: '🎓',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(37, 'Academic Writing')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack38_SocialMediaEngagement() {
    const pack = {
        id: 38,
        name: 'Social Media Engagement',
        description: 'Predict social media engagement potential',
        icon: '📱',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(38, 'Social Media Engagement')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack39_ProductFeatureExtraction() {
    const pack = {
        id: 39,
        name: 'Product Feature Extraction',
        description: 'Identify product features in text',
        icon: '🏷️',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(39, 'Product Feature Extraction')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack40_CrisisDetection() {
    const pack = {
        id: 40,
        name: 'Crisis Detection',
        description: 'Identify crisis situations in text',
        icon: '🚨',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(40, 'Crisis Detection')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack41_MisinformationDetection() {
    const pack = {
        id: 41,
        name: 'Misinformation Detection',
        description: 'Identify potentially false information',
        icon: '🔍',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(41, 'Misinformation Detection')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack42_AuthorAttribution() {
    const pack = {
        id: 42,
        name: 'Author Attribution',
        description: 'Identify writing style and authorship',
        icon: '✍️',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(42, 'Author Attribution')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack43_TimeSensitivity() {
    const pack = {
        id: 43,
        name: 'Time Sensitivity',
        description: 'Assess time-sensitive nature of content',
        icon: '⏰',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(43, 'Time Sensitivity')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack44_CulturalContext() {
    const pack = {
        id: 44,
        name: 'Cultural Context',
        description: 'Identify cultural references and context',
        icon: '🌍',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(44, 'Cultural Context')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack45_TechnicalDifficulty() {
    const pack = {
        id: 45,
        name: 'Technical Difficulty',
        description: 'Assess technical complexity level',
        icon: '⚙️',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(45, 'Technical Difficulty')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack46_PersuasionTechniques() {
    const pack = {
        id: 46,
        name: 'Persuasion Techniques',
        description: 'Identify persuasion and rhetoric techniques',
        icon: '🎯',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(46, 'Persuasion Techniques')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack47_EmotionalAppeal() {
    const pack = {
        id: 47,
        name: 'Emotional Appeal',
        description: 'Identify emotional appeal in messages',
        icon: '❤️',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(47, 'Emotional Appeal')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack48_InformationCompleteness() {
    const pack = {
        id: 48,
        name: 'Information Completeness',
        description: 'Assess if information is complete',
        icon: '📋',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(48, 'Information Completeness')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack49_BiasDetection() {
    const pack = {
        id: 49,
        name: 'Bias Detection',
        description: 'Identify bias in text content',
        icon: '⚖️',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(49, 'Bias Detection')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}

function loadPack50_TextAuthenticity() {
    const pack = {
        id: 50,
        name: 'Text Authenticity',
        description: 'Determine if text is authentic or generated',
        icon: '🔐',
        completed: false,
        score: 0,
        earnings: 0,
        questions: generateSimpleQuestions(50, 'Text Authenticity')
    };
    pack.totalQuestions = pack.questions.length;
    state.packs.push(pack);
}
