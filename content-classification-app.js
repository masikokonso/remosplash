// Content Classification Training App - JavaScript

// State Management
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

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadAllPacks();
    loadEarningsProgress();
    loadPackProgress();
    showHome();
});

// ========== EARNINGS AND PROGRESS MANAGEMENT ==========

function loadEarningsProgress() {
    const saved = localStorage.getItem('earnings');
    state.totalEarnings = saved ? parseFloat(saved) : 0;
}

function saveEarningsProgress() {
    localStorage.setItem('earnings', state.totalEarnings.toString());
}

function loadPackProgress() {
    const saved = localStorage.getItem('content_classification_pack_progress');
    if (saved) {
        const progress = JSON.parse(saved);
        progress.forEach(item => {
            const pack = state.packs.find(p => p.id === item.id);
            if (pack) {
                pack.completed = item.completed;
                pack.earnings = item.earnings;
            }
        });
    }
}

function savePackProgress() {
    const progress = state.packs
        .filter(p => p.completed)
        .map(p => ({ id: p.id, completed: p.completed, earnings: p.earnings }));
    localStorage.setItem('content_classification_pack_progress', JSON.stringify(progress));
}

function generatePackEarnings() {
    return (Math.floor(Math.random() * 51) + 170) / 100; // $1.70 - $2.20
}

function formatEarnings(amount) {
    return amount.toFixed(2);
}

// ========== SCREEN NAVIGATION ==========

function showLoading(callback) {
    document.getElementById('loadingOverlay').classList.remove('hidden');
    setTimeout(() => {
        document.getElementById('loadingOverlay').classList.add('hidden');
        callback();
    }, 2000);
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    state.currentScreen = screenId.replace('Screen', '');
}

function showHome() {
    if (state.countdownInterval) {
        clearInterval(state.countdownInterval);
        state.countdownInterval = null;
    }
    
    updateHomeScreen();
    showScreen('homeScreen');
}

function showPackIntro() {
    const pack = state.packs[state.currentPack];
    document.getElementById('introIcon').textContent = pack.icon;
    document.getElementById('introTitle').textContent = pack.name;
    document.getElementById('introInfo').textContent = 
        `${pack.description}\n\n📊 Classification Items: ${pack.totalQuestions}\n⏱️ Estimated Duration: ${pack.totalQuestions * 1} min\n💰 Earnings on Completion: $1.70-$2.20\n\nComplete all questions to earn!`;
    
    showScreen('packIntroScreen');
}

function showStats() {
    showLoading(() => {
        updateStatsScreen();
        showScreen('statsScreen');
    });
}

function startQuestions() {
    showLoading(() => {
        showQuestion();
    });
}

function continueNext() {
    if (state.currentPack < state.packs.length - 1) {
        state.currentPack++;
        state.currentQuestion = 0;
        state.packScore = 0;
        resetUserAnswers();
        showLoading(() => showPackIntro());
    } else {
        showLoading(() => showHome());
    }
}

function retakePack() {
    state.currentQuestion = 0;
    state.packScore = 0;
    resetUserAnswers();
    showLoading(() => showPackIntro());
}

function resetUserAnswers() {
    const pack = state.packs[state.currentPack];
    pack.questions.forEach(q => q.userAnswer = '');
}

// ========== HOME SCREEN ==========

function updateHomeScreen() {
    const completed = state.packs.filter(p => p.completed).length;
    document.getElementById('homeProgress').textContent = `${completed} / ${state.packs.length} Categories Mastered`;
    document.getElementById('homeEarnings').textContent = `Total Earned: $${formatEarnings(state.totalEarnings)}`;
    
    const packList = document.getElementById('packList');
    packList.innerHTML = '';
    
    state.packs.forEach((pack, index) => {
        const card = document.createElement('div');
        card.className = `card pack-card ${pack.completed ? 'completed' : ''}`;
        card.onclick = () => selectPack(index);
        
        card.innerHTML = `
            <div class="pack-icon">${pack.icon}</div>
            ${pack.completed ? '<div class="pack-check">✓</div>' : ''}
            <div class="pack-info">
                <div class="pack-name">${pack.name}</div>
                <div class="pack-description">${pack.description}</div>
                <div class="pack-status ${pack.completed ? 'completed' : ''}">
                    ${pack.completed 
                        ? `✓ Mastered • Earned: $${formatEarnings(pack.earnings)}`
                        : `${pack.totalQuestions} Items • Earn: $1.70-$2.20`}
                </div>
            </div>
            <button class="pack-button ${pack.completed ? 'review' : 'start'}" 
                    onclick="event.stopPropagation(); selectPack(${index})">
                ${pack.completed ? 'Review →' : 'Begin →'}
            </button>
        `;
        
        packList.appendChild(card);
    });
}

function selectPack(index) {
    state.currentPack = index;
    state.currentQuestion = 0;
    state.packScore = 0;
    resetUserAnswers();
    showLoading(() => showPackIntro());
}

// ========== QUESTION SCREEN ==========

function showQuestion() {
    const pack = state.packs[state.currentPack];
    
    if (state.currentQuestion >= pack.questions.length) {
        completePack();
        return;
    }
    
    showScreen('questionScreen');
    
    const question = pack.questions[state.currentQuestion];
    
    // Update progress bar
    const progress = (state.currentQuestion / pack.totalQuestions) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;
    document.getElementById('progressText').textContent = `Item ${state.currentQuestion + 1} of ${pack.totalQuestions}`;
    
    // Reset and start countdown
    state.countdownSeconds = 5;
    updateCountdown();
    if (state.countdownInterval) clearInterval(state.countdownInterval);
    state.countdownInterval = setInterval(updateCountdown, 1000);
    
    // Update question content
    document.getElementById('questionBadge').textContent = state.currentQuestion + 1;
    document.getElementById('questionTitle').textContent = question.title;
    document.getElementById('questionText').textContent = question.text;
    
    // Create option buttons
    const container = document.getElementById('optionsContainer');
    container.innerHTML = '';
    
    question.options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'option-button';
        if (question.userAnswer === option) {
            btn.classList.add('selected');
        }
        btn.textContent = option;
        btn.onclick = () => selectOption(option);
        container.appendChild(btn);
    });
    
    // Update next button
    const nextBtn = document.getElementById('nextButton');
    nextBtn.disabled = true;
    nextBtn.style.backgroundColor = '#4b5563';
    
    if (state.currentQuestion >= pack.questions.length - 1) {
        nextBtn.textContent = 'Complete →';
    } else {
        nextBtn.textContent = 'Next Item →';
    }
}

function selectOption(option) {
    const pack = state.packs[state.currentPack];
    const question = pack.questions[state.currentQuestion];
    question.userAnswer = option;
    
    // Update button states
    const buttons = document.querySelectorAll('.option-button');
    buttons.forEach(btn => {
        if (btn.textContent === option) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
}

function updateCountdown() {
    state.countdownSeconds--;
    
    const panel = document.getElementById('countdownPanel');
    const text = document.getElementById('countdownText');
    const nextBtn = document.getElementById('nextButton');
    
    if (state.countdownSeconds <= 0) {
        state.countdownSeconds = 0;
        clearInterval(state.countdownInterval);
        state.countdownInterval = null;
        
        text.textContent = 'Ready to proceed!';
        text.className = 'countdown-text ready';
        panel.className = 'countdown-panel ready';
        
        nextBtn.disabled = false;
        nextBtn.style.backgroundColor = '#10b981';
    } else {
        text.textContent = `Next item ready in: ${state.countdownSeconds}s`;
        
        if (state.countdownSeconds <= 2) {
            text.className = 'countdown-text danger';
            panel.className = 'countdown-panel danger';
        } else if (state.countdownSeconds <= 3) {
            text.className = 'countdown-text warning';
            panel.className = 'countdown-panel warning';
        } else {
            text.className = 'countdown-text';
            panel.className = 'countdown-panel';
        }
    }
}

function nextQuestion() {
    if (state.countdownInterval) {
        clearInterval(state.countdownInterval);
        state.countdownInterval = null;
    }
    
    const pack = state.packs[state.currentPack];
    const question = pack.questions[state.currentQuestion];
    
    if (question.userAnswer === question.correctAnswer) {
        state.packScore++;
    }
    
    state.currentQuestion++;
    
    if (state.currentQuestion >= pack.questions.length) {
        completePack();
    } else {
        showQuestion();
    }
}

function completePack() {
    const pack = state.packs[state.currentPack];
    
    if (!pack.completed) {
        const earnings = generatePackEarnings();
        pack.earnings = earnings;
        state.totalEarnings += earnings;
        pack.completed = true;
        pack.score = state.packScore;
        
        saveEarningsProgress();
        savePackProgress();
    }
    
    showLoading(() => showResults());
}

// ========== RESULTS SCREEN ==========

function showResults() {
    const pack = state.packs[state.currentPack];
    const percentage = Math.round((state.packScore / pack.totalQuestions) * 100);
    
    document.getElementById('resultPackName').textContent = pack.name;
    document.getElementById('resultDetails').textContent = 
        `Accuracy: ${state.packScore}/${pack.totalQuestions} (${percentage}%)\n💰 Earned: $${formatEarnings(pack.earnings)}\n💎 Total Earnings: $${formatEarnings(state.totalEarnings)}`;
    
    showScreen('resultsScreen');
}

// ========== STATS SCREEN ==========

function updateStatsScreen() {
    const completed = state.packs.filter(p => p.completed).length;
    
    document.getElementById('statsEarnings').textContent = `$${formatEarnings(state.totalEarnings)}`;
    document.getElementById('statsText').textContent = `Total Earned\n${completed} of ${state.packs.length} Categories`;
    
    const packList = document.getElementById('statsPackList');
    packList.innerHTML = '';
    
    state.packs.forEach(pack => {
        const card = document.createElement('div');
        card.className = 'card pack-stat-card';
        
        card.innerHTML = `
            <div class="pack-stat-icon">${pack.icon}</div>
            <div class="pack-stat-info">
                <div class="pack-stat-name">${pack.name}</div>
                <div class="pack-stat-status ${pack.completed ? 'completed' : 'incomplete'}">
                    ${pack.completed ? `✓ Earned: $${formatEarnings(pack.earnings)}` : 'Not completed'}
                </div>
            </div>
            ${pack.completed ? '<div class="pack-stat-badge"><div class="pack-stat-badge-text">DONE</div></div>' : ''}
        `;
        
        packList.appendChild(card);
    });
}

// ========== PACK LOADING FUNCTIONS ==========

function loadAllPacks() {
    state.packs = [];
    
    loadPack1_DataQuality();
    loadPack2_ContentSafety();
    loadPack3_TaskClassification();
    loadPack4_DataBiasDetection();
    loadPack5_ToxicityLevels();
    loadPack6_IntentClassification();
    loadPack7_DomainClassification();
    loadPack8_ResponseQuality();
    loadPack9_ContextualAppropriate();
    loadPack10_FactualVerification();
    loadPack11_SensitivityClassification();
    loadPack12_LabelQuality();
    loadPack13_MultimodalClassification();
    loadPack14_InstructionQuality();
    loadPack15_ConversationalQuality();
    loadPack16_ReasoningChainQuality();
    loadPack17_CodeQualityAssessment();
    loadPack18_MathematicalContent();
    loadPack19_LanguageVariety();
    loadPack20_PromptInjectionDetection();
    loadPack21_OutputFormatClassification();
    loadPack22_ExplanationQuality();
    loadPack23_SourceCredibility();
    loadPack24_PersonalizationData();
    loadPack25_EthicalContent();
    loadPack26_TemporalRelevance();
    loadPack27_NuanceComplexity();
    loadPack28_CrossLingualQuality();
    loadPack29_RedTeamingContent();
    loadPack30_DomainAdaptation();
    loadPack31_GroundingVerification();
    loadPack32_DialogueCoherence();
    loadPack33_ControversialTopics();
    loadPack34_CreativeContent();
    loadPack35_SpecializedKnowledge();
    loadPack36_UserIntentAlignment();
    loadPack37_DiversityInclusion();
    loadPack38_ErrorCorrection();
    loadPack39_EdgeCaseHandling();
    loadPack40_MetaCognition();
    loadPack41_ComparativeAnalysis();
    loadPack42_ProblemSolving();
    loadPack43_CausalReasoning();
    loadPack44_QuantitativeReasoning();
    loadPack45_ArgumentStructure();
    loadPack46_InformationDensity();
    loadPack47_SyntaxCorrectness();
    loadPack48_ChainOfThought();
    loadPack49_ContextUtilization();
    loadPack50_OutputConsistency();
}

// Helper function for simplified packs
function generateSimpleQuestions(packId, packName) {
    const questions = [];
    const questionCount = 6;
    
    for (let i = 1; i <= questionCount; i++) {
        questions.push({
            packId: packId,
            questionId: i,
            type: 'multiple_choice',
            title: `${packName} - Item ${i}`,
            text: `Classify this example related to ${packName.toLowerCase()}.`,
            options: ['High Quality', 'Acceptable', 'Poor Quality', 'Needs Review'],
            correctAnswer: 'High Quality',
            userAnswer: ''
        });
    }
    
    return questions;
}

// Pack 1: Data Quality Assessment
function loadPack1_DataQuality() {
    const pack = {
        id: 1,
        name: 'Data Quality Assessment',
        description: 'Evaluate quality and suitability of training data',
        icon: '✓',
        totalQuestions: 6,
        questions: [],
        completed: false,
        score: 0,
        earnings: 0
    };
    
    pack.questions = [
        {
            packId: 1,
            questionId: 1,
            type: 'multiple_choice',
            title: 'Data Completeness',
            text: 'Training sample: \'The cat sat on the\' [text cuts off mid-sentence]',
            options: ['Incomplete/Low Quality', 'Complete/High Quality', 'Acceptable', 'Needs Review'],
            correctAnswer: 'Incomplete/Low Quality',
            userAnswer: ''
        },
        {
            packId: 1,
            questionId: 2,
            type: 'multiple_choice',
            title: 'Annotation Quality',
            text: 'Sample: Text labeled as \'positive sentiment\' but contains: \'This is terrible and I hate it.\'',
            options: ['Mislabeled/Poor Quality', 'Correctly Labeled', 'Acceptable', 'High Quality'],
            correctAnswer: 'Mislabeled/Poor Quality',
            userAnswer: ''
        },
        {
            packId: 1,
            questionId: 3,
            type: 'multiple_choice',
            title: 'Data Diversity',
            text: 'Dataset: 1000 samples, all from the same news source, same writing style, same topic.',
            options: ['Low Diversity/Biased', 'High Diversity', 'Well-Balanced', 'Representative'],
            correctAnswer: 'Low Diversity/Biased',
            userAnswer: ''
        },
        {
            packId: 1,
            questionId: 4,
            type: 'multiple_choice',
            title: 'Noise Detection',
            text: 'Sample: \'Click here!!! BUY NOW!!! $$$ FREE $$$\' mixed with normal conversational text.',
            options: ['Noisy/Low Quality', 'Clean Data', 'High Quality', 'Acceptable'],
            correctAnswer: 'Noisy/Low Quality',
            userAnswer: ''
        },
        {
            packId: 1,
            questionId: 5,
            type: 'multiple_choice',
            title: 'Text Coherence',
            text: 'Sample: \'The quantum mechanics of photosynthesis in medieval architecture using blockchain technology.\'',
            options: ['Incoherent/Poor Quality', 'Coherent', 'High Quality', 'Acceptable'],
            correctAnswer: 'Incoherent/Poor Quality',
            userAnswer: ''
        },
        {
            packId: 1,
            questionId: 6,
            type: 'multiple_choice',
            title: 'Duplicate Detection',
            text: 'Dataset contains the same example repeated 50 times with identical labels.',
            options: ['Duplicate/Poor Quality', 'Unique Data', 'High Quality', 'Acceptable'],
            correctAnswer: 'Duplicate/Poor Quality',
            userAnswer: ''
        }
    ];
    
    state.packs.push(pack);
}

// Pack 2: Content Safety Classification
function loadPack2_ContentSafety() {
    const pack = {
        id: 2,
        name: 'Content Safety Classification',
        description: 'Identify unsafe or harmful content',
        icon: '🛡️',
        totalQuestions: 7,
        questions: [],
        completed: false,
        score: 0,
        earnings: 0
    };
    
    pack.questions = [
        {
            packId: 2,
            questionId: 1,
            type: 'multiple_choice',
            title: 'Violence Detection',
            text: 'Text: \'Detailed instructions on how to build explosive devices using household materials.\'',
            options: ['Unsafe/Harmful', 'Safe', 'Educational', 'Neutral'],
            correctAnswer: 'Unsafe/Harmful',
            userAnswer: ''
        },
        {
            packId: 2,
            questionId: 2,
            type: 'multiple_choice',
            title: 'Hate Speech',
            text: 'Text: Contains derogatory slurs targeting a protected group.',
            options: ['Unsafe/Hate Speech', 'Safe', 'Opinion', 'Neutral'],
            correctAnswer: 'Unsafe/Hate Speech',
            userAnswer: ''
        },
        {
            packId: 2,
            questionId: 3,
            type: 'multiple_choice',
            title: 'Medical Misinformation',
            text: 'Text: \'Drinking bleach cures all diseases and is completely safe.\'',
            options: ['Unsafe/Misinformation', 'Safe', 'Medical Advice', 'Educational'],
            correctAnswer: 'Unsafe/Misinformation',
            userAnswer: ''
        },
        {
            packId: 2,
            questionId: 4,
            type: 'multiple_choice',
            title: 'Privacy Violation',
            text: 'Text: Contains full name, address, social security number, and bank account details of a real person.',
            options: ['Unsafe/PII Violation', 'Safe', 'Public Information', 'Acceptable'],
            correctAnswer: 'Unsafe/PII Violation',
            userAnswer: ''
        },
        {
            packId: 2,
            questionId: 5,
            type: 'multiple_choice',
            title: 'Child Safety',
            text: 'Text: Contains explicit content involving minors.',
            options: ['Unsafe/CSAM', 'Safe', 'Educational', 'Neutral'],
            correctAnswer: 'Unsafe/CSAM',
            userAnswer: ''
        },
        {
            packId: 2,
            questionId: 6,
            type: 'multiple_choice',
            title: 'Self-Harm Content',
            text: 'Text: \'Here are 10 detailed methods for self-harm that work best.\'',
            options: ['Unsafe/Self-Harm', 'Safe', 'Mental Health', 'Educational'],
            correctAnswer: 'Unsafe/Self-Harm',
            userAnswer: ''
        },
        {
            packId: 2,
            questionId: 7,
            type: 'multiple_choice',
            title: 'Safe Educational Content',
            text: 'Text: \'Photosynthesis is the process by which plants convert sunlight into energy using chlorophyll.\'',
            options: ['Safe/Educational', 'Unsafe', 'Harmful', 'Questionable'],
            correctAnswer: 'Safe/Educational',
            userAnswer: ''
        }
    ];
    
    state.packs.push(pack);
}

// Pack 3: Task Type Classification
function loadPack3_TaskClassification() {
    const pack = {
        id: 3,
        name: 'Task Type Classification',
        description: 'Categorize training examples by task type',
        icon: '📋',
        totalQuestions: 8,
        questions: [],
        completed: false,
        score: 0,
        earnings: 0
    };
    
    pack.questions = [
        {
            packId: 3,
            questionId: 1,
            type: 'multiple_choice',
            title: 'Question Answering',
            text: 'Input: \'What is the capital of France?\' | Output: \'The capital of France is Paris.\'',
            options: ['Question Answering', 'Summarization', 'Translation', 'Classification'],
            correctAnswer: 'Question Answering',
            userAnswer: ''
        },
        {
            packId: 3,
            questionId: 2,
            type: 'multiple_choice',
            title: 'Summarization Task',
            text: 'Input: Long article about climate change | Output: \'3-sentence summary of key points\'',
            options: ['Summarization', 'Question Answering', 'Translation', 'Generation'],
            correctAnswer: 'Summarization',
            userAnswer: ''
        },
        {
            packId: 3,
            questionId: 3,
            type: 'multiple_choice',
            title: 'Code Generation',
            text: 'Input: \'Write a Python function to sort a list\' | Output: \'def sort_list(lst): return sorted(lst)\'',
            options: ['Code Generation', 'Text Generation', 'Translation', 'Classification'],
            correctAnswer: 'Code Generation',
            userAnswer: ''
        },
        {
            packId: 3,
            questionId: 4,
            type: 'multiple_choice',
            title: 'Sentiment Classification',
            text: 'Input: \'This movie was absolutely terrible!\' | Label: \'negative\'',
            options: ['Classification', 'Generation', 'Summarization', 'Translation'],
            correctAnswer: 'Classification',
            userAnswer: ''
        },
        {
            packId: 3,
            questionId: 5,
            type: 'multiple_choice',
            title: 'Translation Task',
            text: 'Input: \'Hello, how are you?\' | Output: \'Hola, ¿cómo estás?\'',
            options: ['Translation', 'Generation', 'Classification', 'Summarization'],
            correctAnswer: 'Translation',
            userAnswer: ''
        },
        {
            packId: 3,
            questionId: 6,
            type: 'multiple_choice',
            title: 'Named Entity Recognition',
            text: 'Input: \'Apple Inc. announced new products in California.\' | Output: Tags for organization and location entities',
            options: ['Named Entity Recognition', 'Classification', 'Generation', 'Summarization'],
            correctAnswer: 'Named Entity Recognition',
            userAnswer: ''
        },
        {
            packId: 3,
            questionId: 7,
            type: 'multiple_choice',
            title: 'Reasoning Task',
            text: 'Input: \'If all birds can fly, and penguins are birds, can penguins fly?\' | Output: Logical analysis of the premise',
            options: ['Reasoning/Logic', 'Classification', 'Generation', 'QA'],
            correctAnswer: 'Reasoning/Logic',
            userAnswer: ''
        },
        {
            packId: 3,
            questionId: 8,
            type: 'multiple_choice',
            title: 'Creative Writing',
            text: 'Input: \'Write a short story about a robot learning to paint\' | Output: Creative narrative',
            options: ['Creative Generation', 'Classification', 'Summarization', 'Translation'],
            correctAnswer: 'Creative Generation',
            userAnswer: ''
        }
    ];
    
    state.packs.push(pack);
}

// Packs 4-50: Simplified versions
function loadPack4_DataBiasDetection() {
    const pack = {
        id: 4,
        name: 'Bias Detection in Training Data',
        description: 'Identify biases that could affect model fairness',
        icon: '⚖️',
        totalQuestions: 6,
        questions: generateSimpleQuestions(4, 'Bias Detection'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack5_ToxicityLevels() {
    const pack = {
        id: 5,
        name: 'Toxicity Level Classification',
        description: 'Classify content by toxicity severity',
        icon: '⚠️',
        totalQuestions: 6,
        questions: generateSimpleQuestions(5, 'Toxicity Classification'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack6_IntentClassification() {
    const pack = {
        id: 6,
        name: 'User Intent Classification',
        description: 'Classify the underlying intent of queries',
        icon: '🎯',
        totalQuestions: 6,
        questions: generateSimpleQuestions(6, 'Intent Classification'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack7_DomainClassification() {
    const pack = {
        id: 7,
        name: 'Domain Classification',
        description: 'Classify content by subject domain',
        icon: '📚',
        totalQuestions: 6,
        questions: generateSimpleQuestions(7, 'Domain Classification'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack8_ResponseQuality() {
    const pack = {
        id: 8,
        name: 'Response Quality Assessment',
        description: 'Evaluate quality of model responses',
        icon: '⭐',
        totalQuestions: 6,
        questions: generateSimpleQuestions(8, 'Response Quality'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack9_ContextualAppropriate() {
    const pack = {
        id: 9,
        name: 'Contextual Appropriateness',
        description: 'Classify content appropriateness by context',
        icon: '🎭',
        totalQuestions: 6,
        questions: generateSimpleQuestions(9, 'Contextual Appropriateness'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack10_FactualVerification() {
    const pack = {
        id: 10,
        name: 'Factual Verification',
        description: 'Classify claims by factual accuracy',
        icon: '✓',
        totalQuestions: 6,
        questions: generateSimpleQuestions(10, 'Factual Verification'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack11_SensitivityClassification() {
    const pack = {
        id: 11,
        name: 'Content Sensitivity Levels',
        description: 'Classify content by sensitivity requirements',
        icon: '🔒',
        totalQuestions: 6,
        questions: generateSimpleQuestions(11, 'Sensitivity Classification'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack12_LabelQuality() {
    const pack = {
        id: 12,
        name: 'Label Quality Assessment',
        description: 'Evaluate quality of data annotations',
        icon: '🏷️',
        totalQuestions: 6,
        questions: generateSimpleQuestions(12, 'Label Quality'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack13_MultimodalClassification() {
    const pack = {
        id: 13,
        name: 'Multimodal Content Classification',
        description: 'Classify content across different modalities',
        icon: '🎨',
        totalQuestions: 6,
        questions: generateSimpleQuestions(13, 'Multimodal Classification'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack14_InstructionQuality() {
    const pack = {
        id: 14,
        name: 'Instruction-Response Quality',
        description: 'Evaluate instruction-following datasets',
        icon: '📝',
        totalQuestions: 6,
        questions: generateSimpleQuestions(14, 'Instruction Quality'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack15_ConversationalQuality() {
    const pack = {
        id: 15,
        name: 'Conversational Data Quality',
        description: 'Evaluate multi-turn conversation quality',
        icon: '💬',
        totalQuestions: 6,
        questions: generateSimpleQuestions(15, 'Conversational Quality'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack16_ReasoningChainQuality() {
    const pack = {
        id: 16,
        name: 'Reasoning Chain Quality',
        description: 'Evaluate step-by-step reasoning quality',
        icon: '🧠',
        totalQuestions: 6,
        questions: generateSimpleQuestions(16, 'Reasoning Quality'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack17_CodeQualityAssessment() {
    const pack = {
        id: 17,
        name: 'Code Quality Assessment',
        description: 'Evaluate code examples in training data',
        icon: '💻',
        totalQuestions: 6,
        questions: generateSimpleQuestions(17, 'Code Quality'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack18_MathematicalContent() {
    const pack = {
        id: 18,
        name: 'Mathematical Content Classification',
        description: 'Classify mathematical problem quality',
        icon: '🔢',
        totalQuestions: 6,
        questions: generateSimpleQuestions(18, 'Mathematical Content'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack19_LanguageVariety() {
    const pack = {
        id: 19,
        name: 'Language Variety Classification',
        description: 'Classify linguistic diversity in data',
        icon: '🌐',
        totalQuestions: 6,
        questions: generateSimpleQuestions(19, 'Language Variety'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack20_PromptInjectionDetection() {
    const pack = {
        id: 20,
        name: 'Prompt Injection Detection',
        description: 'Identify adversarial prompt patterns',
        icon: '🛡️',
        totalQuestions: 6,
        questions: generateSimpleQuestions(20, 'Prompt Injection'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack21_OutputFormatClassification() {
    const pack = {
        id: 21,
        name: 'Output Format Classification',
        description: 'Classify structured output requirements',
        icon: '📋',
        totalQuestions: 6,
        questions: generateSimpleQuestions(21, 'Output Format'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack22_ExplanationQuality() {
    const pack = {
        id: 22,
        name: 'Explanation Quality',
        description: 'Evaluate clarity of explanations',
        icon: '💡',
        totalQuestions: 6,
        questions: generateSimpleQuestions(22, 'Explanation Quality'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack23_SourceCredibility() {
    const pack = {
        id: 23,
        name: 'Source Credibility',
        description: 'Assess reliability of data sources',
        icon: '📰',
        totalQuestions: 6,
        questions: generateSimpleQuestions(23, 'Source Credibility'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack24_PersonalizationData() {
    const pack = {
        id: 24,
        name: 'Personalization Classification',
        description: 'Classify user preference and context data',
        icon: '👤',
        totalQuestions: 6,
        questions: generateSimpleQuestions(24, 'Personalization'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack25_EthicalContent() {
    const pack = {
        id: 25,
        name: 'Ethical Content Classification',
        description: 'Identify ethical concerns in training data',
        icon: '⚖️',
        totalQuestions: 6,
        questions: generateSimpleQuestions(25, 'Ethical Content'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack26_TemporalRelevance() {
    const pack = {
        id: 26,
        name: 'Temporal Relevance',
        description: 'Classify content by time-sensitivity',
        icon: '⏰',
        totalQuestions: 6,
        questions: generateSimpleQuestions(26, 'Temporal Relevance'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack27_NuanceComplexity() {
    const pack = {
        id: 27,
        name: 'Nuance and Complexity',
        description: 'Assess handling of complex, nuanced topics',
        icon: '🎭',
        totalQuestions: 6,
        questions: generateSimpleQuestions(27, 'Nuance Complexity'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack28_CrossLingualQuality() {
    const pack = {
        id: 28,
        name: 'Cross-Lingual Quality',
        description: 'Evaluate multilingual and translation quality',
        icon: '🌍',
        totalQuestions: 6,
        questions: generateSimpleQuestions(28, 'Cross-Lingual Quality'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack29_RedTeamingContent() {
    const pack = {
        id: 29,
        name: 'Red Teaming Examples',
        description: 'Classify adversarial testing scenarios',
        icon: '🔴',
        totalQuestions: 6,
        questions: generateSimpleQuestions(29, 'Red Teaming'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack30_DomainAdaptation() {
    const pack = {
        id: 30,
        name: 'Domain Adaptation Data',
        description: 'Classify domain-specific training needs',
        icon: '🎯',
        totalQuestions: 6,
        questions: generateSimpleQuestions(30, 'Domain Adaptation'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack31_GroundingVerification() {
    const pack = {
        id: 31,
        name: 'Grounding Verification',
        description: 'Verify claims are grounded in evidence',
        icon: '🔗',
        totalQuestions: 6,
        questions: generateSimpleQuestions(31, 'Grounding Verification'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack32_DialogueCoherence() {
    const pack = {
        id: 32,
        name: 'Dialogue Coherence',
        description: 'Assess multi-turn conversation quality',
        icon: '💬',
        totalQuestions: 6,
        questions: generateSimpleQuestions(32, 'Dialogue Coherence'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack33_ControversialTopics() {
    const pack = {
        id: 33,
        name: 'Controversial Topic Handling',
        description: 'Classify handling of sensitive subjects',
        icon: '⚠️',
        totalQuestions: 6,
        questions: generateSimpleQuestions(33, 'Controversial Topics'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack34_CreativeContent() {
    const pack = {
        id: 34,
        name: 'Creative Content Quality',
        description: 'Evaluate creative writing and generation',
        icon: '🎨',
        totalQuestions: 6,
        questions: generateSimpleQuestions(34, 'Creative Content'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack35_SpecializedKnowledge() {
    const pack = {
        id: 35,
        name: 'Specialized Knowledge',
        description: 'Assess domain expertise depth',
        icon: '🔬',
        totalQuestions: 6,
        questions: generateSimpleQuestions(35, 'Specialized Knowledge'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack36_UserIntentAlignment() {
    const pack = {
        id: 36,
        name: 'User Intent Alignment',
        description: 'Assess how well responses match user needs',
        icon: '🎯',
        totalQuestions: 6,
        questions: generateSimpleQuestions(36, 'Intent Alignment'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack37_DiversityInclusion() {
    const pack = {
        id: 37,
        name: 'Diversity and Inclusion',
        description: 'Evaluate representation and inclusivity',
        icon: '🌈',
        totalQuestions: 6,
        questions: generateSimpleQuestions(37, 'Diversity & Inclusion'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack38_ErrorCorrection() {
    const pack = {
        id: 38,
        name: 'Error Correction Examples',
        description: 'Classify error correction quality',
        icon: '🔧',
        totalQuestions: 6,
        questions: generateSimpleQuestions(38, 'Error Correction'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack39_EdgeCaseHandling() {
    const pack = {
        id: 39,
        name: 'Edge Case Handling',
        description: 'Evaluate handling of unusual cases',
        icon: '🎪',
        totalQuestions: 6,
        questions: generateSimpleQuestions(39, 'Edge Case Handling'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack40_MetaCognition() {
    const pack = {
        id: 40,
        name: 'Meta-Cognitive Awareness',
        description: 'Assess self-awareness in responses',
        icon: '🤔',
        totalQuestions: 6,
        questions: generateSimpleQuestions(40, 'Meta-Cognition'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack41_ComparativeAnalysis() {
    const pack = {
        id: 41,
        name: 'Comparative Analysis',
        description: 'Evaluate comparison and contrast quality',
        icon: '⚖️',
        totalQuestions: 6,
        questions: generateSimpleQuestions(41, 'Comparative Analysis'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack42_ProblemSolving() {
    const pack = {
        id: 42,
        name: 'Problem-Solving Quality',
        description: 'Assess problem-solving approach quality',
        icon: '🧩',
        totalQuestions: 6,
        questions: generateSimpleQuestions(42, 'Problem-Solving'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack43_CausalReasoning() {
    const pack = {
        id: 43,
        name: 'Causal Reasoning',
        description: 'Evaluate cause-and-effect reasoning',
        icon: '🔗',
        totalQuestions: 6,
        questions: generateSimpleQuestions(43, 'Causal Reasoning'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack44_QuantitativeReasoning() {
    const pack = {
        id: 44,
        name: 'Quantitative Reasoning',
        description: 'Assess numerical and statistical reasoning',
        icon: '📊',
        totalQuestions: 6,
        questions: generateSimpleQuestions(44, 'Quantitative Reasoning'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack45_ArgumentStructure() {
    const pack = {
        id: 45,
        name: 'Argument Structure',
        description: 'Evaluate logical argument construction',
        icon: '🏗️',
        totalQuestions: 6,
        questions: generateSimpleQuestions(45, 'Argument Structure'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack46_InformationDensity() {
    const pack = {
        id: 46,
        name: 'Information Density',
        description: 'Assess information content efficiency',
        icon: '📦',
        totalQuestions: 6,
        questions: generateSimpleQuestions(46, 'Information Density'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack47_SyntaxCorrectness() {
    const pack = {
        id: 47,
        name: 'Syntax Correctness',
        description: 'Evaluate grammatical and syntactic quality',
        icon: '✏️',
        totalQuestions: 6,
        questions: generateSimpleQuestions(47, 'Syntax Correctness'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack48_ChainOfThought() {
    const pack = {
        id: 48,
        name: 'Chain-of-Thought Quality',
        description: 'Evaluate reasoning transparency',
        icon: '🔗',
        totalQuestions: 6,
        questions: generateSimpleQuestions(48, 'Chain-of-Thought'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack49_ContextUtilization() {
    const pack = {
        id: 49,
        name: 'Context Utilization',
        description: 'Assess how well context is used',
        icon: '📖',
        totalQuestions: 6,
        questions: generateSimpleQuestions(49, 'Context Utilization'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}

function loadPack50_OutputConsistency() {
    const pack = {
        id: 50,
        name: 'Output Consistency',
        description: 'Evaluate consistency across outputs',
        icon: '🔄',
        totalQuestions: 6,
        questions: generateSimpleQuestions(50, 'Output Consistency'),
        completed: false,
        score: 0,
        earnings: 0
    };
    state.packs.push(pack);
}
