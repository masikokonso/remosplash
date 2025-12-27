// Data Categorization AI Training App - JavaScript

// Application State
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

// Initialize app on page load
document.addEventListener('DOMContentLoaded', () => {
    loadAllPacks();
    loadEarningsProgress();
    loadPackProgress();
    renderHome();
});

// ================ EARNINGS AND PROGRESS MANAGEMENT ================

function loadEarningsProgress() {
    const saved = localStorage.getItem('earnings');
    if (saved) {
        state.totalEarnings = parseFloat(saved);
    }
}

function saveEarningsProgress() {
    localStorage.setItem('earnings', state.totalEarnings.toString());
}

function loadPackProgress() {
    const saved = localStorage.getItem('data_categorization_pack_progress');
    if (saved) {
        const progress = JSON.parse(saved);
        progress.forEach(item => {
            updatePackStatus(item.packID, item.completed, item.earnings);
        });
    }
}

function savePackProgress() {
    const progress = [];
    state.packs.forEach(pack => {
        if (pack.completed) {
            progress.push({
                packID: pack.id,
                completed: pack.completed,
                earnings: pack.earnings
            });
        }
    });
    localStorage.setItem('data_categorization_pack_progress', JSON.stringify(progress));
}

function updatePackStatus(packID, completed, earnings) {
    const pack = state.packs.find(p => p.id === packID);
    if (pack) {
        pack.completed = completed;
        pack.earnings = earnings;
    }
}

function generatePackEarnings() {
    // Random between $1.85 and $2.75 (185-275 cents)
    return (Math.floor(Math.random() * (275 - 185 + 1)) + 185) / 100;
}

function formatEarnings(amount) {
    return amount.toFixed(2);
}

// ================ LOADING AND UI FUNCTIONS ================

function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    state.currentScreen = screenId.replace('Screen', '');
}

function showScreenWithLoading(screenId, callback) {
    showLoading();
    setTimeout(() => {
        hideLoading();
        showScreen(screenId);
        if (callback) callback();
    }, 2000);
}

// ================ NAVIGATION FUNCTIONS ================

function showHome() {
    if (state.countdownInterval) {
        clearInterval(state.countdownInterval);
        state.countdownInterval = null;
    }
    showScreenWithLoading('homeScreen', renderHome);
}

function showPackIntro() {
    renderPackIntro();
    showScreen('packIntroScreen');
}

function startQuestions() {
    state.currentQuestion = 0;
    state.packScore = 0;
    const pack = state.packs[state.currentPack];
    pack.questions.forEach(q => q.userAnswer = '');
    showScreenWithLoading('questionScreen', renderQuestion);
}

function showPackResults() {
    renderResults();
    showScreen('resultsScreen');
}

function showOverallStats() {
    renderStats();
    showScreenWithLoading('statsScreen');
}

function continueNext() {
    if (state.currentPack < state.packs.length - 1) {
        state.currentPack++;
        showScreenWithLoading('packIntroScreen', showPackIntro);
    } else {
        showHome();
    }
}

function retakePack() {
    showScreenWithLoading('packIntroScreen', showPackIntro);
}

// ================ RENDER FUNCTIONS ================

function renderHome() {
    const completedCount = state.packs.filter(p => p.completed).length;
    document.getElementById('homeProgress').textContent = 
        `${completedCount} / ${state.packs.length} Data Categories Completed`;
    document.getElementById('homeEarnings').textContent = 
        `Total Earned: $${formatEarnings(state.totalEarnings)}`;
    
    const packList = document.getElementById('packList');
    packList.innerHTML = '';
    
    state.packs.forEach((pack, index) => {
        const card = document.createElement('div');
        card.className = 'pack-card' + (pack.completed ? ' completed' : '');
        card.onclick = () => selectPack(index);
        
        card.innerHTML = `
            <div class="pack-icon">${pack.icon}</div>
            ${pack.completed ? '<div class="pack-check">✓</div>' : ''}
            <div class="pack-info">
                <div class="pack-name">${pack.name}</div>
                <div class="pack-desc">${pack.description}</div>
                <div class="pack-status ${pack.completed ? 'completed' : 'incomplete'}">
                    ${pack.completed 
                        ? `✓ Completed • Earned: $${formatEarnings(pack.earnings)}`
                        : `${pack.totalQuestions} Data Sets • Earn: $1.85-$2.75`}
                </div>
            </div>
            <button class="pack-button ${pack.completed ? 'completed' : ''}" onclick="event.stopPropagation(); selectPack(${index})">
                ${pack.completed ? 'Review →' : 'Start →'}
            </button>
        `;
        
        packList.appendChild(card);
    });
}

function selectPack(index) {
    state.currentPack = index;
    showScreenWithLoading('packIntroScreen', showPackIntro);
}

function renderPackIntro() {
    const pack = state.packs[state.currentPack];
    document.getElementById('introIcon').textContent = pack.icon;
    document.getElementById('introTitle').textContent = pack.name;
    document.getElementById('introInfo').innerHTML = `
        ${pack.description}<br><br>
        📊 Data Samples: ${pack.totalQuestions}<br>
        ⏱️ Estimated Duration: ${pack.totalQuestions * 1} min<br>
        💰 Earnings on Completion: $1.85-$2.75<br><br>
        Complete all questions to earn!
    `;
}

function renderQuestion() {
    const pack = state.packs[state.currentPack];
    const question = pack.questions[state.currentQuestion];
    
    // Update progress bar
    const progress = (state.currentQuestion / pack.totalQuestions) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('progressText').textContent = 
        `Data Set ${state.currentQuestion + 1} of ${pack.totalQuestions}`;
    
    // Reset and start countdown
    state.countdownSeconds = 5;
    updateCountdown();
    if (state.countdownInterval) clearInterval(state.countdownInterval);
    state.countdownInterval = setInterval(updateCountdown, 1000);
    
    // Render question
    const card = document.getElementById('questionCard');
    card.innerHTML = `
        <div class="question-badge">${state.currentQuestion + 1}</div>
        <div class="question-title">${question.title}</div>
        <div class="question-text">${question.text}</div>
        ${question.options.map(opt => `
            <button class="option-btn ${question.userAnswer === opt ? 'selected' : ''}" 
                    onclick="selectOption('${opt.replace(/'/g, "\\'")}')">${opt}</button>
        `).join('')}
    `;
    
    // Update next button
    const nextBtn = document.getElementById('nextBtn');
    nextBtn.disabled = true;
    nextBtn.style.backgroundColor = 'var(--color-border)';
    nextBtn.textContent = state.currentQuestion >= pack.totalQuestions - 1 
        ? 'Complete Training →' 
        : 'Next Data Set →';
}

function selectOption(option) {
    const pack = state.packs[state.currentPack];
    const question = pack.questions[state.currentQuestion];
    question.userAnswer = option;
    
    // Update UI
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.textContent === option) {
            btn.classList.add('selected');
        }
    });
}

function updateCountdown() {
    const countdownCard = document.getElementById('countdownCard');
    
    if (state.countdownSeconds <= 0) {
        clearInterval(state.countdownInterval);
        state.countdownInterval = null;
        countdownCard.textContent = '✓ Ready to categorize!';
        countdownCard.className = 'countdown-card ready';
        
        const nextBtn = document.getElementById('nextBtn');
        nextBtn.disabled = false;
        nextBtn.style.backgroundColor = 'var(--color-success)';
    } else {
        countdownCard.textContent = `⏱️ Next data set in: ${state.countdownSeconds}s`;
        
        if (state.countdownSeconds <= 2) {
            countdownCard.className = 'countdown-card danger';
        } else if (state.countdownSeconds <= 3) {
            countdownCard.className = 'countdown-card warning';
        } else {
            countdownCard.className = 'countdown-card';
        }
        
        state.countdownSeconds--;
    }
}

function nextQuestion() {
    if (state.countdownInterval) {
        clearInterval(state.countdownInterval);
        state.countdownInterval = null;
    }
    
    const pack = state.packs[state.currentPack];
    const question = pack.questions[state.currentQuestion];
    
    // Check answer
    if (question.userAnswer === question.correctAnswer) {
        state.packScore++;
    }
    
    state.currentQuestion++;
    
    // Check if pack completed
    if (state.currentQuestion >= pack.totalQuestions) {
        // Award earnings if not completed before
        if (!pack.completed) {
            const earnings = generatePackEarnings();
            pack.earnings = earnings;
            state.totalEarnings += earnings;
            pack.completed = true;
            pack.score = state.packScore;
            state.packs[state.currentPack] = pack;
            
            saveEarningsProgress();
            savePackProgress();
        }
        
        showScreenWithLoading('resultsScreen', showPackResults);
    } else {
        renderQuestion();
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
    document.getElementById('statsText').textContent = 
        `Total Earned\n${completedCount} of ${state.packs.length} Modules`;
    
    const list = document.getElementById('packStatsList');
    list.innerHTML = '';
    
    state.packs.forEach(pack => {
        const card = document.createElement('div');
        card.className = 'pack-stat-card';
        
        card.innerHTML = `
            <div class="pack-stat-icon">${pack.icon}</div>
            <div class="pack-stat-info">
                <div class="pack-stat-name">${pack.name}</div>
                <div class="pack-stat-status" style="color: ${pack.completed ? 'var(--color-success)' : 'var(--color-text-secondary)'}">
                    ${pack.completed 
                        ? `✓ Earned: $${formatEarnings(pack.earnings)}`
                        : 'Not completed'}
                </div>
            </div>
            ${pack.completed ? '<div class="pack-stat-badge">DONE</div>' : ''}
        `;
        
        list.appendChild(card);
    });
}

// ================ PACK LOADING ================

function loadAllPacks() {
    state.packs = [
        loadPack1_DataQuality(),
        loadPack2_ContentSafety(),
        loadPack3_TaskClassification(),
        loadPack4_DataBiasDetection(),
        loadPack5_ToxicityLevels(),
        loadPack6_IntentClassification(),
        loadPack7_DomainClassification(),
        loadPack8_ResponseQuality(),
        loadPack9_ContextualAppropriate(),
        loadPack10_FactualVerification(),
        loadPack11_SensitivityClassification(),
        loadPack12_LabelQuality(),
        loadPack13_MultimodalClassification(),
        loadPack14_InstructionQuality(),
        loadPack15_ConversationalQuality(),
        loadPack16_ReasoningChainQuality(),
        loadPack17_CodeQualityAssessment(),
        loadPack18_MathematicalContent(),
        loadPack19_LanguageVariety(),
        loadPack20_PromptInjectionDetection(),
        loadPack21_OutputFormatClassification(),
        loadPack22_ExplanationQuality(),
        loadPack23_SourceCredibility(),
        loadPack24_PersonalizationData(),
        loadPack25_EthicalContent(),
        loadPack26_TemporalRelevance(),
        loadPack27_NuanceComplexity(),
        loadPack28_CrossLingualQuality(),
        loadPack29_RedTeamingContent(),
        loadPack30_DomainAdaptation(),
        loadPack31_GroundingVerification(),
        loadPack32_DialogueCoherence(),
        loadPack33_ControversialTopics(),
        loadPack34_CreativeContent(),
        loadPack35_SpecializedKnowledge(),
        loadPack36_UserIntentAlignment(),
        loadPack37_DiversityInclusion(),
        loadPack38_ErrorCorrection(),
        loadPack39_EdgeCaseHandling(),
        loadPack40_MetaCognition(),
        loadPack41_ComparativeAnalysis(),
        loadPack42_ProblemSolving(),
        loadPack43_CausalReasoning(),
        loadPack44_QuantitativeReasoning(),
        loadPack45_ArgumentStructure(),
        loadPack46_InformationDensity(),
        loadPack47_SyntaxCorrectness(),
        loadPack48_ChainOfThought(),
        loadPack49_ContextUtilization(),
        loadPack50_OutputConsistency()
    ];
}

// Pack 1: Data Quality Categorization
function loadPack1_DataQuality() {
    return {
        id: 1,
        name: "Data Quality Categorization",
        description: "Categorize data by quality metrics",
        icon: "✓",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: [
            {
                title: "Completeness Category",
                text: "Categorize this sample: 'The cat sat on the' [text cuts off mid-sentence]",
                options: ["Incomplete Data", "Complete Data", "Partial Data", "Fragment"],
                correctAnswer: "Incomplete Data"
            },
            {
                title: "Annotation Accuracy Category",
                text: "Categorize: Text 'This is terrible!' labeled as 'positive sentiment'",
                options: ["Mislabeled", "Correctly Labeled", "Ambiguous Label", "Unlabeled"],
                correctAnswer: "Mislabeled"
            },
            {
                title: "Diversity Category",
                text: "Categorize: 1000 samples from one news source, same topic",
                options: ["Low Diversity", "High Diversity", "Balanced Dataset", "Multi-Source"],
                correctAnswer: "Low Diversity"
            },
            {
                title: "Noise Level Category",
                text: "Categorize: 'Click here!!! BUY NOW!!! $$$ FREE $$$'",
                options: ["High Noise", "Low Noise", "Clean Data", "Formatted Text"],
                correctAnswer: "High Noise"
            },
            {
                title: "Coherence Category",
                text: "Categorize: 'Quantum mechanics of photosynthesis in medieval blockchain'",
                options: ["Incoherent", "Coherent", "Technical", "Scientific"],
                correctAnswer: "Incoherent"
            },
            {
                title: "Duplication Category",
                text: "Categorize: Same example repeated 50 times in dataset",
                options: ["Duplicate", "Unique", "Variant", "Original"],
                correctAnswer: "Duplicate"
            }
        ]
    };
}

// Pack 2: Safety Category Classification
function loadPack2_ContentSafety() {
    return {
        id: 2,
        name: "Safety Category Classification",
        description: "Categorize content by safety level",
        icon: "🛡️",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 7,
        questions: [
            {
                title: "Violence Category",
                text: "Categorize: 'Instructions for building explosive devices'",
                options: ["Unsafe - Violence", "Safe Content", "Educational", "Informational"],
                correctAnswer: "Unsafe - Violence"
            },
            {
                title: "Hate Speech Category",
                text: "Categorize: Text with derogatory slurs targeting protected groups",
                options: ["Hate Speech", "Safe Speech", "Opinion", "Discussion"],
                correctAnswer: "Hate Speech"
            },
            {
                title: "Misinformation Category",
                text: "Categorize: 'Drinking bleach cures all diseases'",
                options: ["Medical Misinformation", "Health Advice", "Educational", "Informational"],
                correctAnswer: "Medical Misinformation"
            },
            {
                title: "Privacy Violation Category",
                text: "Categorize: Full name, SSN, and bank details of real person",
                options: ["PII Violation", "Public Information", "Personal Data", "User Content"],
                correctAnswer: "PII Violation"
            },
            {
                title: "Child Safety Category",
                text: "Categorize: Explicit content involving minors",
                options: ["CSAM - Critical", "Age-Restricted", "Adult Content", "Mature"],
                correctAnswer: "CSAM - Critical"
            },
            {
                title: "Self-Harm Category",
                text: "Categorize: 'Detailed methods for self-harm'",
                options: ["Self-Harm Content", "Mental Health", "Support Content", "Discussion"],
                correctAnswer: "Self-Harm Content"
            },
            {
                title: "Safe Educational Category",
                text: "Categorize: 'Photosynthesis converts sunlight to energy using chlorophyll'",
                options: ["Safe - Educational", "Unsafe", "Restricted", "Sensitive"],
                correctAnswer: "Safe - Educational"
            }
        ]
    };
}

// Pack 3: Task Type Categorization
function loadPack3_TaskClassification() {
    return {
        id: 3,
        name: "Task Type Categorization",
        description: "Categorize data by task type",
        icon: "📋",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 8,
        questions: [
            {
                title: "QA Task Category",
                text: "Categorize: Input: 'Capital of France?' Output: 'Paris'",
                options: ["Question Answering", "Summarization", "Translation", "Generation"],
                correctAnswer: "Question Answering"
            },
            {
                title: "Summarization Task Category",
                text: "Categorize: Long article → 3-sentence summary",
                options: ["Summarization", "Question Answering", "Translation", "Extraction"],
                correctAnswer: "Summarization"
            },
            {
                title: "Code Generation Category",
                text: "Categorize: 'Sort a list' → 'def sort_list(lst): return sorted(lst)'",
                options: ["Code Generation", "Text Generation", "Translation", "Transformation"],
                correctAnswer: "Code Generation"
            },
            {
                title: "Classification Task Category",
                text: "Categorize: 'Terrible movie!' → 'negative'",
                options: ["Classification", "Generation", "Summarization", "Extraction"],
                correctAnswer: "Classification"
            },
            {
                title: "Translation Task Category",
                text: "Categorize: 'Hello' → 'Hola'",
                options: ["Translation", "Generation", "Transformation", "Conversion"],
                correctAnswer: "Translation"
            },
            {
                title: "NER Task Category",
                text: "Categorize: 'Apple Inc. in California' → Entity tags",
                options: ["Named Entity Recognition", "Classification", "Extraction", "Parsing"],
                correctAnswer: "Named Entity Recognition"
            },
            {
                title: "Reasoning Task Category",
                text: "Categorize: 'If all birds fly and penguins are birds...' → Logical analysis",
                options: ["Reasoning", "Classification", "Generation", "QA"],
                correctAnswer: "Reasoning"
            },
            {
                title: "Creative Generation Category",
                text: "Categorize: 'Write story about robot painter' → Creative narrative",
                options: ["Creative Generation", "Summarization", "Translation", "Extraction"],
                correctAnswer: "Creative Generation"
            }
        ]
    };
}

// Packs 4-50: Using simplified questions
function generateSimpleQuestions(packId, theme, count = 6) {
    const questions = [];
    for (let i = 1; i <= count; i++) {
        questions.push({
            title: `${theme} Example ${i}`,
            text: `Sample categorization question ${i} for ${theme}`,
            options: [`Category A`, `Category B`, `Category C`, `Category D`],
            correctAnswer: `Category A`
        });
    }
    return questions;
}

function loadPack4_DataBiasDetection() {
    return {
        id: 4,
        name: "Bias Type Categorization",
        description: "Categorize data by bias type",
        icon: "⚖️",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(4, "Bias Detection", 6)
    };
}

function loadPack5_ToxicityLevels() {
    return {
        id: 5,
        name: "Toxicity Level Categorization",
        description: "Categorize content by toxicity severity",
        icon: "⚠️",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(5, "Toxicity Levels", 6)
    };
}

function loadPack6_IntentClassification() {
    return {
        id: 6,
        name: "User Intent Categorization",
        description: "Categorize queries by user intent",
        icon: "🎯",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 7,
        questions: generateSimpleQuestions(6, "Intent Classification", 7)
    };
}

function loadPack7_DomainClassification() {
    return {
        id: 7,
        name: "Domain Categorization",
        description: "Categorize content by subject domain",
        icon: "📚",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(7, "Domain Classification", 6)
    };
}

function loadPack8_ResponseQuality() {
    return {
        id: 8,
        name: "Response Quality Categorization",
        description: "Categorize responses by quality level",
        icon: "⭐",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(8, "Response Quality", 6)
    };
}

function loadPack9_ContextualAppropriate() {
    return {
        id: 9,
        name: "Contextual Appropriateness",
        description: "Categorize content by context suitability",
        icon: "🎭",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(9, "Contextual Appropriateness", 6)
    };
}

function loadPack10_FactualVerification() {
    return {
        id: 10,
        name: "Factual Accuracy Categorization",
        description: "Categorize claims by factual accuracy",
        icon: "✓",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(10, "Factual Verification", 6)
    };
}

function loadPack11_SensitivityClassification() {
    return {
        id: 11,
        name: "Sensitivity Level Categorization",
        description: "Categorize content by sensitivity",
        icon: "🔒",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(11, "Sensitivity Classification", 6)
    };
}

function loadPack12_LabelQuality() {
    return {
        id: 12,
        name: "Label Quality Categorization",
        description: "Categorize annotations by quality",
        icon: "🏷️",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(12, "Label Quality", 6)
    };
}

function loadPack13_MultimodalClassification() {
    return {
        id: 13,
        name: "Multimodal Content Categorization",
        description: "Categorize multimodal data types",
        icon: "🎨",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(13, "Multimodal Classification", 6)
    };
}

function loadPack14_InstructionQuality() {
    return {
        id: 14,
        name: "Instruction Type Categorization",
        description: "Categorize instruction-response pairs",
        icon: "📝",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(14, "Instruction Quality", 6)
    };
}

function loadPack15_ConversationalQuality() {
    return {
        id: 15,
        name: "Conversation Pattern Categorization",
        description: "Categorize dialogue patterns",
        icon: "💬",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(15, "Conversational Quality", 6)
    };
}

function loadPack16_ReasoningChainQuality() {
    return {
        id: 16,
        name: "Reasoning Type Categorization",
        description: "Categorize reasoning patterns",
        icon: "🧠",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(16, "Reasoning Chain Quality", 6)
    };
}

function loadPack17_CodeQualityAssessment() {
    return {
        id: 17,
        name: "Code Quality Categorization",
        description: "Categorize code examples by quality",
        icon: "💻",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(17, "Code Quality", 6)
    };
}

function loadPack18_MathematicalContent() {
    return {
        id: 18,
        name: "Mathematical Content Categorization",
        description: "Categorize math problems by quality",
        icon: "🔢",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(18, "Mathematical Content", 6)
    };
}

function loadPack19_LanguageVariety() {
    return {
        id: 19,
        name: "Language Variety Categorization",
        description: "Categorize linguistic diversity",
        icon: "🌐",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(19, "Language Variety", 6)
    };
}

function loadPack20_PromptInjectionDetection() {
    return {
        id: 20,
        name: "Adversarial Pattern Categorization",
        description: "Categorize adversarial attempts",
        icon: "🛡️",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(20, "Adversarial Patterns", 6)
    };
}

function loadPack21_OutputFormatClassification() {
    return {
        id: 21,
        name: "Output Format Categorization",
        description: "Categorize by structured format type",
        icon: "📋",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(21, "Output Format", 6)
    };
}

function loadPack22_ExplanationQuality() {
    return {
        id: 22,
        name: "Explanation Type Categorization",
        description: "Categorize explanations by clarity",
        icon: "💡",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(22, "Explanation Quality", 6)
    };
}

function loadPack23_SourceCredibility() {
    return {
        id: 23,
        name: "Source Type Categorization",
        description: "Categorize sources by credibility",
        icon: "📰",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(23, "Source Credibility", 6)
    };
}

function loadPack24_PersonalizationData() {
    return {
        id: 24,
        name: "Personalization Type Categorization",
        description: "Categorize user preference data",
        icon: "👤",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(24, "Personalization Data", 6)
    };
}

function loadPack25_EthicalContent() {
    return {
        id: 25,
        name: "Ethical Issue Categorization",
        description: "Categorize ethical concerns in data",
        icon: "⚖️",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(25, "Ethical Content", 6)
    };
}

function loadPack26_TemporalRelevance() {
    return {
        id: 26,
        name: "Temporal Relevance Categorization",
        description: "Categorize content by time-sensitivity",
        icon: "⏰",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(26, "Temporal Relevance", 6)
    };
}

function loadPack27_NuanceComplexity() {
    return {
        id: 27,
        name: "Nuance Level Categorization",
        description: "Categorize by complexity handling",
        icon: "🎭",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(27, "Nuance Complexity", 6)
    };
}

function loadPack28_CrossLingualQuality() {
    return {
        id: 28,
        name: "Translation Quality Categorization",
        description: "Categorize translation quality",
        icon: "🌍",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(28, "Cross-Lingual Quality", 6)
    };
}

function loadPack29_RedTeamingContent() {
    return {
        id: 29,
        name: "Testing Scenario Categorization",
        description: "Categorize adversarial testing types",
        icon: "🔴",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(29, "Red Teaming Content", 6)
    };
}

function loadPack30_DomainAdaptation() {
    return {
        id: 30,
        name: "Domain Specialization Categorization",
        description: "Categorize domain-specific data needs",
        icon: "🎯",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(30, "Domain Adaptation", 6)
    };
}

function loadPack31_GroundingVerification() {
    return {
        id: 31,
        name: "Evidence Grounding Categorization",
        description: "Categorize claims by grounding",
        icon: "🔗",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(31, "Grounding Verification", 6)
    };
}

function loadPack32_DialogueCoherence() {
    return {
        id: 32,
        name: "Dialogue Coherence Categorization",
        description: "Categorize conversation coherence",
        icon: "💬",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(32, "Dialogue Coherence", 6)
    };
}

function loadPack33_ControversialTopics() {
    return {
        id: 33,
        name: "Controversial Content Categorization",
        description: "Categorize sensitive topic handling",
        icon: "⚠️",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(33, "Controversial Topics", 6)
    };
}

function loadPack34_CreativeContent() {
    return {
        id: 34,
        name: "Creative Content Categorization",
        description: "Categorize creative writing quality",
        icon: "🎨",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(34, "Creative Content", 6)
    };
}

function loadPack35_SpecializedKnowledge() {
    return {
        id: 35,
        name: "Expertise Depth Categorization",
        description: "Categorize domain expertise level",
        icon: "🔬",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(35, "Specialized Knowledge", 6)
    };
}

function loadPack36_UserIntentAlignment() {
    return {
        id: 36,
        name: "Intent Matching Categorization",
        description: "Categorize response-intent alignment",
        icon: "🎯",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(36, "Intent Alignment", 6)
    };
}

function loadPack37_DiversityInclusion() {
    return {
        id: 37,
        name: "Representation Categorization",
        description: "Categorize diversity and inclusion",
        icon: "🌈",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(37, "Diversity Inclusion", 6)
    };
}

function loadPack38_ErrorCorrection() {
    return {
        id: 38,
        name: "Correction Type Categorization",
        description: "Categorize error correction patterns",
        icon: "🔧",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(38, "Error Correction", 6)
    };
}

function loadPack39_EdgeCaseHandling() {
    return {
        id: 39,
        name: "Edge Case Type Categorization",
        description: "Categorize unusual case handling",
        icon: "🎪",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(39, "Edge Case Handling", 6)
    };
}

function loadPack40_MetaCognition() {
    return {
        id: 40,
        name: "Self-Awareness Categorization",
        description: "Categorize metacognitive patterns",
        icon: "🤔",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(40, "Meta-Cognition", 6)
    };
}

function loadPack41_ComparativeAnalysis() {
    return {
        id: 41,
        name: "Comparison Type Categorization",
        description: "Categorize comparison quality",
        icon: "⚖️",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(41, "Comparative Analysis", 6)
    };
}

function loadPack42_ProblemSolving() {
    return {
        id: 42,
        name: "Solution Type Categorization",
        description: "Categorize problem-solving approaches",
        icon: "🧩",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(42, "Problem Solving", 6)
    };
}

function loadPack43_CausalReasoning() {
    return {
        id: 43,
        name: "Causal Relationship Categorization",
        description: "Categorize cause-effect reasoning",
        icon: "🔗",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(43, "Causal Reasoning", 6)
    };
}

function loadPack44_QuantitativeReasoning() {
    return {
        id: 44,
        name: "Numerical Reasoning Categorization",
        description: "Categorize quantitative reasoning",
        icon: "📊",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(44, "Quantitative Reasoning", 6)
    };
}

function loadPack45_ArgumentStructure() {
    return {
        id: 45,
        name: "Argument Structure Categorization",
        description: "Categorize logical argument quality",
        icon: "🏗️",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(45, "Argument Structure", 6)
    };
}

function loadPack46_InformationDensity() {
    return {
        id: 46,
        name: "Information Density Categorization",
        description: "Categorize content efficiency",
        icon: "📦",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(46, "Information Density", 6)
    };
}

function loadPack47_SyntaxCorrectness() {
    return {
        id: 47,
        name: "Grammar Correctness Categorization",
        description: "Categorize syntactic quality",
        icon: "✏️",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(47, "Syntax Correctness", 6)
    };
}

function loadPack48_ChainOfThought() {
    return {
        id: 48,
        name: "Reasoning Chain Categorization",
        description: "Categorize reasoning transparency",
        icon: "🔗",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(48, "Chain of Thought", 6)
    };
}

function loadPack49_ContextUtilization() {
    return {
        id: 49,
        name: "Context Usage Categorization",
        description: "Categorize context utilization",
        icon: "📖",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(49, "Context Utilization", 6)
    };
}

function loadPack50_OutputConsistency() {
    return {
        id: 50,
        name: "Consistency Categorization",
        description: "Categorize output consistency",
        icon: "🔄",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(50, "Output Consistency", 6)
    };
}
