// Pattern Recognition AI Training App - Complete JavaScript

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

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadAllPacks();
    loadProgress();
    renderHome();
});

// Load Progress from localStorage
function loadProgress() {
    // Load total earnings
    const earnings = localStorage.getItem('earnings');
    if (earnings) {
        state.totalEarnings = parseFloat(earnings);
    }

    // Load pack progress
    const progress = localStorage.getItem('pattern_recognition_pack_progress');
    if (progress) {
        const progressData = JSON.parse(progress);
        progressData.forEach(item => {
            const pack = state.packs.find(p => p.id === item.id);
            if (pack) {
                pack.completed = item.completed;
                pack.earnings = item.earnings;
            }
        });
    }
}

// Save Progress to localStorage
function saveProgress() {
    // Save total earnings
    localStorage.setItem('earnings', state.totalEarnings.toString());

    // Save pack progress
    const progressData = state.packs
        .filter(p => p.completed)
        .map(p => ({
            id: p.id,
            completed: p.completed,
            earnings: p.earnings
        }));
    localStorage.setItem('pattern_recognition_pack_progress', JSON.stringify(progressData));
}

// Generate Random Earnings
function generatePackEarnings() {
    // Generate between $2.70 and $3.60
    return (Math.random() * (360 - 270) + 270) / 100;
}

// Format Earnings
function formatEarnings(amount) {
    return amount.toFixed(2);
}

// Screen Management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    state.currentScreen = screenId;
}

function showLoading(callback) {
    document.getElementById('loadingOverlay').classList.add('active');
    setTimeout(() => {
        document.getElementById('loadingOverlay').classList.remove('active');
        callback();
    }, 2000);
}

// Navigation Functions
function showHome() {
    stopCountdown();
    showLoading(() => {
        renderHome();
        showScreen('homeScreen');
    });
}

function showPackIntro(packIndex) {
    state.currentPack = packIndex;
    state.currentQuestion = 0;
    state.packScore = 0;
    
    const pack = state.packs[packIndex];
    // Reset user answers
    pack.questions.forEach(q => q.userAnswer = '');
    
    showLoading(() => {
        renderPackIntro();
        showScreen('packIntroScreen');
    });
}

function startQuestions() {
    showLoading(() => {
        renderQuestion();
        showScreen('questionScreen');
        startCountdown();
    });
}

function showStats() {
    showLoading(() => {
        renderStats();
        showScreen('statsScreen');
    });
}

// Countdown Timer
function startCountdown() {
    state.countdownSeconds = 5;
    updateCountdownDisplay();
    
    state.countdownInterval = setInterval(() => {
        state.countdownSeconds--;
        updateCountdownDisplay();
        
        if (state.countdownSeconds <= 0) {
            stopCountdown();
            enableNextButton();
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
    const countdown = document.getElementById('countdown');
    const text = countdown.querySelector('.countdown-text');
    
    countdown.className = 'countdown';
    
    if (state.countdownSeconds <= 0) {
        text.textContent = '✓ Ready to identify!';
        countdown.classList.add('ready');
    } else {
        text.textContent = `⏱️ Next pattern in: ${state.countdownSeconds}s`;
        if (state.countdownSeconds <= 2) {
            countdown.classList.add('danger');
        } else if (state.countdownSeconds <= 3) {
            countdown.classList.add('warning');
        }
    }
}

function enableNextButton() {
    const nextBtn = document.getElementById('nextBtn');
    nextBtn.disabled = false;
    nextBtn.style.backgroundColor = 'var(--color-success)';
}

// Question Navigation
function selectOption(optionText) {
    const pack = state.packs[state.currentPack];
    const question = pack.questions[state.currentQuestion];
    question.userAnswer = optionText;
    
    // Update UI
    document.querySelectorAll('.option-btn').forEach(btn => {
        if (btn.textContent === optionText) {
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
    
    // Check answer
    if (question.userAnswer === question.correctAnswer) {
        state.packScore++;
    }
    
    state.currentQuestion++;
    
    if (state.currentQuestion >= pack.questions.length) {
        // Pack completed
        if (!pack.completed) {
            const earnings = generatePackEarnings();
            pack.earnings = earnings;
            state.totalEarnings += earnings;
            pack.completed = true;
            pack.score = state.packScore;
            
            saveProgress();
        }
        
        showLoading(() => {
            renderResults();
            showScreen('resultsScreen');
        });
    } else {
        renderQuestion();
        startCountdown();
    }
}

function continueNext() {
    if (state.currentPack < state.packs.length - 1) {
        showPackIntro(state.currentPack + 1);
    } else {
        showHome();
    }
}

function retakePack() {
    state.currentQuestion = 0;
    state.packScore = 0;
    const pack = state.packs[state.currentPack];
    pack.questions.forEach(q => q.userAnswer = '');
    
    showLoading(() => {
        renderPackIntro();
        showScreen('packIntroScreen');
    });
}

// Render Functions
function renderHome() {
    const completedCount = state.packs.filter(p => p.completed).length;
    
    document.getElementById('homeCompletedCount').textContent = `${completedCount} / ${state.packs.length} Pattern Types Completed`;
    document.getElementById('homeTotalEarnings').textContent = formatEarnings(state.totalEarnings);
    
    const packList = document.getElementById('packList');
    packList.innerHTML = state.packs.map(pack => `
        <div class="pack-card ${pack.completed ? 'completed' : ''}" onclick="showPackIntro(${pack.id - 1})">
            <div class="pack-icon">
                ${pack.icon}
                ${pack.completed ? '<span class="checkmark">✓</span>' : ''}
            </div>
            <div class="pack-info">
                <div class="pack-name">${pack.name}</div>
                <div class="pack-desc">${pack.description}</div>
                <div class="pack-status ${pack.completed ? 'text-success' : 'text-secondary'}">
                    ${pack.completed 
                        ? `✓ Completed • Earned: $${formatEarnings(pack.earnings)}`
                        : `${pack.totalQuestions} Patterns • Earn: $2.70-$3.60`
                    }
                </div>
            </div>
            <button class="pack-start-btn ${pack.completed ? 'completed' : ''}" onclick="event.stopPropagation(); showPackIntro(${pack.id - 1})">
                ${pack.completed ? 'Review →' : 'Start →'}
            </button>
        </div>
    `).join('');
}

function renderPackIntro() {
    const pack = state.packs[state.currentPack];
    
    document.getElementById('introIcon').textContent = pack.icon;
    document.getElementById('introTitle').textContent = pack.name;
    document.getElementById('introDescription').textContent = pack.description;
    document.getElementById('introDetails').innerHTML = `
        🧩 Pattern Samples: ${pack.totalQuestions}<br>
        ⏱️ Estimated Duration: ${pack.totalQuestions} min<br>
        💰 Earnings on Completion: $2.70-$3.60<br><br>
        Complete all questions to earn!
    `;
}

function renderQuestion() {
    const pack = state.packs[state.currentPack];
    const question = pack.questions[state.currentQuestion];
    const progress = ((state.currentQuestion / pack.totalQuestions) * 100).toFixed(0);
    
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('progressText').textContent = `Pattern ${state.currentQuestion + 1} of ${pack.totalQuestions}`;
    
    document.getElementById('questionBadge').textContent = state.currentQuestion + 1;
    document.getElementById('questionTitle').textContent = question.title;
    document.getElementById('questionText').textContent = question.text;
    
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = question.options.map(option => `
        <button class="option-btn ${question.userAnswer === option ? 'selected' : ''}" 
                onclick="selectOption('${option.replace(/'/g, "\\'")}')">
            ${option}
        </button>
    `).join('');
    
    const nextBtn = document.getElementById('nextBtn');
    nextBtn.disabled = true;
    nextBtn.style.backgroundColor = '#475569';
    nextBtn.textContent = state.currentQuestion >= pack.totalQuestions - 1 ? 'Complete Training →' : 'Next Pattern →';
}

function renderResults() {
    const pack = state.packs[state.currentPack];
    const percentage = Math.round((state.packScore / pack.totalQuestions) * 100);
    
    document.getElementById('resultsPackName').textContent = pack.name;
    document.getElementById('resultsDetails').innerHTML = `
        Accuracy: ${state.packScore}/${pack.totalQuestions} (${percentage}%)<br>
        💰 Earned: $${formatEarnings(pack.earnings)}<br>
        💎 Total Earnings: $${formatEarnings(state.totalEarnings)}
    `;
}

function renderStats() {
    const completedCount = state.packs.filter(p => p.completed).length;
    
    document.getElementById('statsTotalEarnings').textContent = formatEarnings(state.totalEarnings);
    document.getElementById('statsCompletedText').textContent = `${completedCount} of ${state.packs.length} Modules`;
    
    const statsPackList = document.getElementById('statsPackList');
    statsPackList.innerHTML = state.packs.map(pack => `
        <div class="card">
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="font-size: 36px; min-width: 50px; text-align: center;">${pack.icon}</div>
                <div style="flex: 1;">
                    <div class="font-bold mb-10">${pack.name}</div>
                    <div class="${pack.completed ? 'text-success' : 'text-secondary'} font-bold">
                        ${pack.completed ? `✓ Earned: $${formatEarnings(pack.earnings)}` : 'Not completed'}
                    </div>
                </div>
                ${pack.completed ? `
                    <div style="background-color: var(--color-success); color: white; padding: 10px 20px; border-radius: 10px; font-size: 12px; font-weight: bold;">
                        DONE
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Load All Packs
function loadAllPacks() {
    state.packs = [
        loadPack1_VisualPatterns(),
        loadPack2_NumericalPatterns(),
        loadPack3_LogicalPatterns(),
        loadPack4_SpatialPatterns(),
        loadPack5_TemporalPatterns(),
        loadPack6_TextPatterns(),
        loadPack7_AnomalyPatterns(),
        loadPack8_FeaturePatterns(),
        loadPack9_ClassificationPatterns(),
        loadPack10_SequentialPatterns(),
        loadPack11_AssociationPatterns(),
        loadPack12_ClusterPatterns(),
        loadPack13_ImagePatterns(),
        loadPack14_AudioPatterns(),
        loadPack15_GraphPatterns(),
        loadPack16_BehavioralPatterns(),
        loadPack17_TransformationPatterns(),
        loadPack18_SimilarityPatterns(),
        loadPack19_TrendPatterns(),
        loadPack20_CyclicalPatterns(),
        loadPack21_DimensionalityPatterns(),
        loadPack22_RecurrencePatterns(),
        loadPack23_ContextualPatterns(),
        loadPack24_EmbeddingPatterns(),
        loadPack25_HierarchicalPatterns(),
        loadPack26_CompositionalPatterns(),
        loadPack27_AttentionPatterns(),
        loadPack28_ActivationPatterns(),
        loadPack29_RegularizationPatterns(),
        loadPack30_OptimizationPatterns(),
        loadPack31_DataAugmentationPatterns(),
        loadPack32_TransferPatterns(),
        loadPack33_EnsemblePatterns(),
        loadPack34_GenerativePatterns(),
        loadPack35_ArchitecturePatterns(),
        loadPack36_LossPatterns(),
        loadPack37_BatchPatterns(),
        loadPack38_ValidationPatterns(),
        loadPack39_MetricPatterns(),
        loadPack40_DebuggingPatterns(),
        loadPack41_ScalingPatterns(),
        loadPack42_FewShotPatterns(),
        loadPack43_ActiveLearningPatterns(),
        loadPack44_ContinualLearningPatterns(),
        loadPack45_InterpretabilityPatterns(),
        loadPack46_FairnessPatterns(),
        loadPack47_RobustnessPatterns(),
        loadPack48_PromptPatterns(),
        loadPack49_DistillationPatterns(),
        loadPack50_ReinforcementPatterns()
    ];
}

// Pack 1: Visual Pattern Recognition
function loadPack1_VisualPatterns() {
    return {
        id: 1,
        name: "Visual Pattern Recognition",
        description: "Identify visual patterns and sequences",
        icon: "👁️",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: [
            {
                title: "Shape Sequence Pattern",
                text: "Pattern: Circle, Square, Triangle, Circle, Square, ? - What comes next?",
                options: ["Triangle", "Circle", "Square", "Pentagon"],
                correctAnswer: "Triangle",
                userAnswer: ""
            },
            {
                title: "Color Progression Pattern",
                text: "Pattern: Red, Orange, Yellow, Green, Blue, ? - What's the pattern type?",
                options: ["Color Spectrum Sequence", "Random Colors", "Alternating Pattern", "No Pattern"],
                correctAnswer: "Color Spectrum Sequence",
                userAnswer: ""
            },
            {
                title: "Size Progression Pattern",
                text: "Pattern: Small circle, Medium circle, Large circle, Small circle... - Identify the pattern",
                options: ["Repeating Growth Cycle", "Random Sizes", "Continuous Growth", "Continuous Shrink"],
                correctAnswer: "Repeating Growth Cycle",
                userAnswer: ""
            },
            {
                title: "Rotation Pattern",
                text: "Arrow pointing: North, East, South, West, North, ? - Next direction?",
                options: ["East", "West", "South", "North"],
                correctAnswer: "East",
                userAnswer: ""
            },
            {
                title: "Symmetry Recognition",
                text: "Which pattern shows perfect vertical symmetry?",
                options: ["Butterfly wings", "Spiral", "Wave", "Branch"],
                correctAnswer: "Butterfly wings",
                userAnswer: ""
            },
            {
                title: "Pattern Complexity",
                text: "Pattern: AB, AABB, AAABBB, AAAABBBB - What's next?",
                options: ["AAAAABBBBB", "ABABABAB", "AAAA", "BBBBB"],
                correctAnswer: "AAAAABBBBB",
                userAnswer: ""
            }
        ]
    };
}

// Pack 2: Numerical Pattern Recognition
function loadPack2_NumericalPatterns() {
    return {
        id: 2,
        name: "Numerical Pattern Recognition",
        description: "Identify number sequences and progressions",
        icon: "🔢",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 7,
        questions: [
            {
                title: "Arithmetic Sequence",
                text: "Sequence: 3, 7, 11, 15, 19, ? - What comes next?",
                options: ["23", "21", "25", "20"],
                correctAnswer: "23",
                userAnswer: ""
            },
            {
                title: "Geometric Sequence",
                text: "Sequence: 2, 6, 18, 54, ? - Identify pattern type",
                options: ["Geometric (×3)", "Arithmetic (+4)", "Fibonacci", "Random"],
                correctAnswer: "Geometric (×3)",
                userAnswer: ""
            },
            {
                title: "Fibonacci Pattern",
                text: "Sequence: 1, 1, 2, 3, 5, 8, ? - What's next?",
                options: ["13", "12", "10", "16"],
                correctAnswer: "13",
                userAnswer: ""
            },
            {
                title: "Square Number Pattern",
                text: "Sequence: 1, 4, 9, 16, 25, ? - Pattern recognition",
                options: ["36", "30", "35", "32"],
                correctAnswer: "36",
                userAnswer: ""
            },
            {
                title: "Prime Number Pattern",
                text: "Sequence: 2, 3, 5, 7, 11, ? - Next number?",
                options: ["13", "12", "14", "15"],
                correctAnswer: "13",
                userAnswer: ""
            },
            {
                title: "Alternating Pattern",
                text: "Sequence: 1, -1, 2, -2, 3, -3, ? - What's next?",
                options: ["4", "-4", "0", "6"],
                correctAnswer: "4",
                userAnswer: ""
            },
            {
                title: "Exponential Growth",
                text: "Sequence: 1, 2, 4, 8, 16, ? - Pattern type?",
                options: ["Powers of 2", "Fibonacci", "Arithmetic", "Random"],
                correctAnswer: "Powers of 2",
                userAnswer: ""
            }
        ]
    };
}

// Pack 3: Logical Pattern Recognition
function loadPack3_LogicalPatterns() {
    return {
        id: 3,
        name: "Logical Pattern Recognition",
        description: "Identify logical sequences and rules",
        icon: "🧠",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 8,
        questions: [
            {
                title: "If-Then Logic Pattern",
                text: "Rule: 'If shape is red, then it's a circle' - Which follows the rule?",
                options: ["Red circle", "Blue circle", "Red square", "All shapes"],
                correctAnswer: "Red circle",
                userAnswer: ""
            },
            {
                title: "Boolean Logic Pattern",
                text: "Pattern: T, T, F, T, T, F, T, T, ? - What's next?",
                options: ["F", "T", "Random", "Both"],
                correctAnswer: "F",
                userAnswer: ""
            },
            {
                title: "Conditional Branching",
                text: "Rule: 'Even → Square, Odd → Circle' - What shape is 7?",
                options: ["Circle", "Square", "Triangle", "Both"],
                correctAnswer: "Circle",
                userAnswer: ""
            },
            {
                title: "Set Membership Pattern",
                text: "Pattern: {Cat, Dog, Fish} → Pets, {Rose, Lily, Tulip} → ?",
                options: ["Flowers", "Animals", "Colors", "Foods"],
                correctAnswer: "Flowers",
                userAnswer: ""
            },
            {
                title: "Exclusion Pattern",
                text: "Set: {2, 4, 6, 8, 10, 11} - Which doesn't belong?",
                options: ["11", "2", "6", "10"],
                correctAnswer: "11",
                userAnswer: ""
            },
            {
                title: "Transitive Relationship",
                text: "If A>B and B>C, then what's the relationship between A and C?",
                options: ["A>C", "A<C", "A=C", "Unknown"],
                correctAnswer: "A>C",
                userAnswer: ""
            },
            {
                title: "Negation Pattern",
                text: "Pattern: Day, Night, Day, Night - What logical operation alternates them?",
                options: ["NOT operation", "AND operation", "OR operation", "XOR operation"],
                correctAnswer: "NOT operation",
                userAnswer: ""
            },
            {
                title: "Rule Composition",
                text: "Rule 1: X→Y, Rule 2: Y→Z - What's the composite rule?",
                options: ["X→Z", "Z→X", "X→Y→X", "No relation"],
                correctAnswer: "X→Z",
                userAnswer: ""
            }
        ]
    };
}

// Pack 4: Spatial Pattern Recognition
function loadPack4_SpatialPatterns() {
    return {
        id: 4,
        name: "Spatial Pattern Recognition",
        description: "Recognize spatial relationships and arrangements",
        icon: "📐",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: [
            {
                title: "Position Sequence",
                text: "Dot moves: Top-Left → Top-Right → Bottom-Right → ?",
                options: ["Bottom-Left", "Center", "Top-Left", "Top-Center"],
                correctAnswer: "Bottom-Left",
                userAnswer: ""
            },
            {
                title: "Grid Pattern",
                text: "3×3 grid: X marks diagonal top-left to bottom-right. Pattern type?",
                options: ["Diagonal Line", "Horizontal Line", "Random", "Vertical Line"],
                correctAnswer: "Diagonal Line",
                userAnswer: ""
            },
            {
                title: "Distance Pattern",
                text: "Objects at: 1m, 2m, 4m, 8m - What's the pattern?",
                options: ["Exponential spacing", "Linear spacing", "Random placement", "Fibonacci spacing"],
                correctAnswer: "Exponential spacing",
                userAnswer: ""
            },
            {
                title: "Mirror Pattern",
                text: "Left side: ○●○, Right side shows: ○●○ - What pattern?",
                options: ["Horizontal symmetry", "Vertical symmetry", "Rotational", "No symmetry"],
                correctAnswer: "Vertical symmetry",
                userAnswer: ""
            },
            {
                title: "Concentric Pattern",
                text: "Circles within circles, each 2 units smaller. Pattern type?",
                options: ["Concentric with linear decrease", "Random sizes", "Increasing sizes", "Same sizes"],
                correctAnswer: "Concentric with linear decrease",
                userAnswer: ""
            },
            {
                title: "Tessellation Pattern",
                text: "Hexagons fit together with no gaps. Pattern name?",
                options: ["Tessellation", "Fragmentation", "Dispersion", "Clustering"],
                correctAnswer: "Tessellation",
                userAnswer: ""
            }
        ]
    };
}

// Pack 5: Temporal Pattern Recognition
function loadPack5_TemporalPatterns() {
    return {
        id: 5,
        name: "Temporal Pattern Recognition",
        description: "Identify time-based patterns and sequences",
        icon: "⏰",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: [
            {
                title: "Time Series Trend",
                text: "Values over time: 10, 12, 14, 16, 18 - Pattern type?",
                options: ["Linear upward trend", "Exponential growth", "Random fluctuation", "Cyclical pattern"],
                correctAnswer: "Linear upward trend",
                userAnswer: ""
            },
            {
                title: "Seasonality Detection",
                text: "Monthly sales: High-Low-High-Low repeating yearly - Pattern?",
                options: ["Seasonal pattern", "Random variation", "Steady decline", "One-time spike"],
                correctAnswer: "Seasonal pattern",
                userAnswer: ""
            },
            {
                title: "Decay Pattern",
                text: "Signal strength: 100, 50, 25, 12.5 - What pattern?",
                options: ["Exponential decay", "Linear decay", "No pattern", "Growth pattern"],
                correctAnswer: "Exponential decay",
                userAnswer: ""
            },
            {
                title: "Periodic Oscillation",
                text: "Pattern: 0, 5, 0, -5, 0, 5, 0, -5 - Type?",
                options: ["Periodic wave", "Random noise", "Trend", "Decay"],
                correctAnswer: "Periodic wave",
                userAnswer: ""
            },
            {
                title: "Lag Correlation",
                text: "Series A peaks, then 2 steps later Series B peaks - Pattern?",
                options: ["Lagged correlation", "No correlation", "Inverse correlation", "Random"],
                correctAnswer: "Lagged correlation",
                userAnswer: ""
            },
            {
                title: "Frequency Pattern",
                text: "Event occurs: 2 times/hour consistently - Pattern type?",
                options: ["Fixed frequency", "Increasing frequency", "Random timing", "Decreasing frequency"],
                correctAnswer: "Fixed frequency",
                userAnswer: ""
            }
        ]
    };
}

// Packs 6-50: Simplified versions (can be expanded with full questions later)
function generateSimpleQuestions(packId, count) {
    const questions = [];
    for (let i = 1; i <= count; i++) {
        questions.push({
            title: `Pattern Question ${i}`,
            text: `Identify the pattern in this scenario related to the pack topic.`,
            options: ["Pattern A", "Pattern B", "Pattern C", "Pattern D"],
            correctAnswer: ["Pattern A", "Pattern B", "Pattern C", "Pattern D"][Math.floor(Math.random() * 4)],
            userAnswer: ""
        });
    }
    return questions;
}

function loadPack6_TextPatterns() {
    return {
        id: 6,
        name: "Text Pattern Recognition",
        description: "Identify linguistic and textual patterns",
        icon: "📝",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 7,
        questions: generateSimpleQuestions(6, 7)
    };
}

function loadPack7_AnomalyPatterns() {
    return {
        id: 7,
        name: "Anomaly Detection Patterns",
        description: "Identify outliers and unusual patterns",
        icon: "⚠️",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(7, 6)
    };
}

function loadPack8_FeaturePatterns() {
    return {
        id: 8,
        name: "Feature Extraction Patterns",
        description: "Identify distinctive features and attributes",
        icon: "🔍",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(8, 6)
    };
}

function loadPack9_ClassificationPatterns() {
    return {
        id: 9,
        name: "Classification Patterns",
        description: "Recognize categorization and grouping patterns",
        icon: "📊",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(9, 6)
    };
}

function loadPack10_SequentialPatterns() {
    return {
        id: 10,
        name: "Sequential Pattern Mining",
        description: "Identify ordered sequences and chains",
        icon: "🔗",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(10, 6)
    };
}

function loadPack11_AssociationPatterns() {
    return {
        id: 11,
        name: "Association Rule Patterns",
        description: "Identify co-occurrence and correlation patterns",
        icon: "🔗",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(11, 6)
    };
}

function loadPack12_ClusterPatterns() {
    return {
        id: 12,
        name: "Clustering Patterns",
        description: "Identify groupings and clusters in data",
        icon: "🎯",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(12, 6)
    };
}

function loadPack13_ImagePatterns() {
    return {
        id: 13,
        name: "Image Pattern Recognition",
        description: "Identify visual patterns in images",
        icon: "🖼️",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(13, 6)
    };
}

function loadPack14_AudioPatterns() {
    return {
        id: 14,
        name: "Audio Pattern Recognition",
        description: "Identify sound and acoustic patterns",
        icon: "🔊",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(14, 6)
    };
}

function loadPack15_GraphPatterns() {
    return {
        id: 15,
        name: "Graph Pattern Recognition",
        description: "Identify network and graph structures",
        icon: "🕸️",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(15, 6)
    };
}

function loadPack16_BehavioralPatterns() {
    return {
        id: 16,
        name: "Behavioral Pattern Recognition",
        description: "Identify user behavior and action patterns",
        icon: "👤",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(16, 6)
    };
}

function loadPack17_TransformationPatterns() {
    return {
        id: 17,
        name: "Transformation Pattern Recognition",
        description: "Identify data transformations and mappings",
        icon: "🔄",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(17, 6)
    };
}

function loadPack18_SimilarityPatterns() {
    return {
        id: 18,
        name: "Similarity Pattern Recognition",
        description: "Identify similarity and distance patterns",
        icon: "📏",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(18, 6)
    };
}

function loadPack19_TrendPatterns() {
    return {
        id: 19,
        name: "Trend Pattern Recognition",
        description: "Identify trends and directional patterns",
        icon: "📈",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(19, 6)
    };
}

function loadPack20_CyclicalPatterns() {
    return {
        id: 20,
        name: "Cyclical Pattern Recognition",
        description: "Identify repeating cycles and periodicities",
        icon: "🔁",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(20, 6)
    };
}

function loadPack21_DimensionalityPatterns() {
    return {
        id: 21,
        name: "Dimensionality Pattern Recognition",
        description: "Identify high-dimensional data patterns",
        icon: "📐",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(21, 6)
    };
}

function loadPack22_RecurrencePatterns() {
    return {
        id: 22,
        name: "Recurrence Pattern Recognition",
        description: "Identify recurring subsequences and motifs",
        icon: "🔄",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(22, 6)
    };
}

function loadPack23_ContextualPatterns() {
    return {
        id: 23,
        name: "Contextual Pattern Recognition",
        description: "Identify context-dependent patterns",
        icon: "🎯",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(23, 6)
    };
}

function loadPack24_EmbeddingPatterns() {
    return {
        id: 24,
        name: "Embedding Pattern Recognition",
        description: "Identify vector space embedding patterns",
        icon: "🎨",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(24, 6)
    };
}

function loadPack25_HierarchicalPatterns() {
    return {
        id: 25,
        name: "Hierarchical Structure Patterns",
        description: "Identify hierarchical and tree structures",
        icon: "🌳",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(25, 6)
    };
}

function loadPack26_CompositionalPatterns() {
    return {
        id: 26,
        name: "Compositional Pattern Recognition",
        description: "Identify how parts combine into wholes",
        icon: "🧩",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(26, 6)
    };
}

function loadPack27_AttentionPatterns() {
    return {
        id: 27,
        name: "Attention Mechanism Patterns",
        description: "Identify attention and focus patterns",
        icon: "🎯",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(27, 6)
    };
}

function loadPack28_ActivationPatterns() {
    return {
        id: 28,
        name: "Neural Activation Patterns",
        description: "Identify neural network activation patterns",
        icon: "⚡",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(28, 6)
    };
}

function loadPack29_RegularizationPatterns() {
    return {
        id: 29,
        name: "Regularization Pattern Recognition",
        description: "Identify regularization and constraint patterns",
        icon: "🎚️",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(29, 6)
    };
}

function loadPack30_OptimizationPatterns() {
    return {
        id: 30,
        name: "Optimization Pattern Recognition",
        description: "Identify training optimization patterns",
        icon: "📉",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(30, 6)
    };
}

function loadPack31_DataAugmentationPatterns() {
    return {
        id: 31,
        name: "Data Augmentation Patterns",
        description: "Identify data augmentation transformations",
        icon: "🔄",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(31, 6)
    };
}

function loadPack32_TransferPatterns() {
    return {
        id: 32,
        name: "Transfer Learning Patterns",
        description: "Identify knowledge transfer patterns",
        icon: "🔄",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(32, 6)
    };
}

function loadPack33_EnsemblePatterns() {
    return {
        id: 33,
        name: "Ensemble Pattern Recognition",
        description: "Identify ensemble and combination patterns",
        icon: "🎭",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(33, 6)
    };
}

function loadPack34_GenerativePatterns() {
    return {
        id: 34,
        name: "Generative Model Patterns",
        description: "Identify generative modeling patterns",
        icon: "🎨",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(34, 6)
    };
}

function loadPack35_ArchitecturePatterns() {
    return {
        id: 35,
        name: "Neural Architecture Patterns",
        description: "Identify network architecture patterns",
        icon: "🏗️",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(35, 6)
    };
}

function loadPack36_LossPatterns() {
    return {
        id: 36,
        name: "Loss Function Patterns",
        description: "Identify loss function behaviors",
        icon: "📉",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(36, 6)
    };
}

function loadPack37_BatchPatterns() {
    return {
        id: 37,
        name: "Batch Processing Patterns",
        description: "Identify batch and mini-batch patterns",
        icon: "📦",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(37, 6)
    };
}

function loadPack38_ValidationPatterns() {
    return {
        id: 38,
        name: "Validation Strategy Patterns",
        description: "Identify validation and testing patterns",
        icon: "✅",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(38, 6)
    };
}

function loadPack39_MetricPatterns() {
    return {
        id: 39,
        name: "Evaluation Metric Patterns",
        description: "Identify performance metric patterns",
        icon: "📊",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(39, 6)
    };
}

function loadPack40_DebuggingPatterns() {
    return {
        id: 40,
        name: "Model Debugging Patterns",
        description: "Identify common training issues",
        icon: "🐛",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(40, 6)
    };
}

function loadPack41_ScalingPatterns() {
    return {
        id: 41,
        name: "Model Scaling Patterns",
        description: "Identify scaling laws and patterns",
        icon: "📈",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(41, 6)
    };
}

function loadPack42_FewShotPatterns() {
    return {
        id: 42,
        name: "Few-Shot Learning Patterns",
        description: "Identify few-shot and meta-learning patterns",
        icon: "🎯",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(42, 6)
    };
}

function loadPack43_ActiveLearningPatterns() {
    return {
        id: 43,
        name: "Active Learning Patterns",
        description: "Identify data selection strategies",
        icon: "🎯",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(43, 6)
    };
}

function loadPack44_ContinualLearningPatterns() {
    return {
        id: 44,
        name: "Continual Learning Patterns",
        description: "Identify lifelong learning patterns",
        icon: "🔄",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(44, 6)
    };
}

function loadPack45_InterpretabilityPatterns() {
    return {
        id: 45,
        name: "Model Interpretability Patterns",
        description: "Identify explainability patterns",
        icon: "🔍",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(45, 6)
    };
}

function loadPack46_FairnessPatterns() {
    return {
        id: 46,
        name: "Fairness Pattern Recognition",
        description: "Identify bias and fairness issues",
        icon: "⚖️",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(46, 6)
    };
}

function loadPack47_RobustnessPatterns() {
    return {
        id: 47,
        name: "Model Robustness Patterns",
        description: "Identify robustness and adversarial patterns",
        icon: "🛡️",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(47, 6)
    };
}

function loadPack48_PromptPatterns() {
    return {
        id: 48,
        name: "Prompt Engineering Patterns",
        description: "Identify effective prompting strategies",
        icon: "💬",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(48, 6)
    };
}

function loadPack49_DistillationPatterns() {
    return {
        id: 49,
        name: "Knowledge Distillation Patterns",
        description: "Identify model compression patterns",
        icon: "🎓",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(49, 6)
    };
}

function loadPack50_ReinforcementPatterns() {
    return {
        id: 50,
        name: "Reinforcement Learning Patterns",
        description: "Identify RL and reward patterns",
        icon: "🎮",
        completed: false,
        score: 0,
        earnings: 0,
        totalQuestions: 6,
        questions: generateSimpleQuestions(50, 6)
    };
}
