// ================== STATE MANAGEMENT ==================
const state = {
    currentPage: 0,
    totalPages: 6,
    minimumWithdraw: '5.00' // Default value
};

// ================== INITIALIZATION ==================
document.addEventListener('DOMContentLoaded', () => {
    loadMinimumWithdraw();
    updateMinimumWithdrawDisplay();
    initializeDots();
    showPage(0);
});

// ================== LOAD DATA ==================
function loadMinimumWithdraw() {
    // Try to load from localStorage (simulating tillfetch.dat file)
    // The tillfetch.dat file stores various settings, with index 7 being minimum withdraw
    try {
        const tillfetchData = localStorage.getItem('tillfetch');
        if (tillfetchData) {
            const data = JSON.parse(tillfetchData);
            // Assuming the data is an array with minimum withdraw at index 7
            if (data && data.length > 7 && data[7]) {
                state.minimumWithdraw = data[7];
            }
        }
    } catch (error) {
        console.log('Using default minimum withdraw amount');
    }
}

function updateMinimumWithdrawDisplay() {
    // Update all places where minimum withdraw is displayed
    const minimumAmount = document.getElementById('minimumAmount');
    const minThreshold1 = document.getElementById('minThreshold1');
    const minThreshold2 = document.getElementById('minThreshold2');
    
    if (minimumAmount) {
        minimumAmount.textContent = `$${state.minimumWithdraw}`;
    }
    if (minThreshold1) {
        minThreshold1.textContent = `$${state.minimumWithdraw}`;
    }
    if (minThreshold2) {
        minThreshold2.textContent = `$${state.minimumWithdraw}`;
    }
}

// ================== DOTS INITIALIZATION ==================
function initializeDots() {
    const dotsContainer = document.getElementById('dotsContainer');
    dotsContainer.innerHTML = '';
    
    for (let i = 0; i < state.totalPages; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        if (i === state.currentPage) {
            dot.classList.add('active');
        }
        dotsContainer.appendChild(dot);
    }
}

function updateDots() {
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
        if (index === state.currentPage) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

// ================== LOADING OVERLAY ==================
function showLoading(callback) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.add('active');
    
    setTimeout(() => {
        overlay.classList.remove('active');
        if (callback) callback();
    }, 800);
}

// ================== PAGE NAVIGATION ==================
function showPage(pageNumber) {
    // Validate page number
    if (pageNumber < 0 || pageNumber >= state.totalPages) {
        return;
    }
    
    state.currentPage = pageNumber;
    
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    // Show current page
    const currentPageElement = document.getElementById(`page${pageNumber}`);
    if (currentPageElement) {
        currentPageElement.classList.add('active');
    }
    
    // Update navigation buttons
    updateNavigation();
    
    // Update progress text
    updateProgressText();
    
    // Update dots
    updateDots();
    
    // Scroll to top
    window.scrollTo(0, 0);
}

function updateNavigation() {
    const btnPrevious = document.getElementById('btnPrevious');
    const btnNext = document.getElementById('btnNext');
    const btnStart = document.getElementById('btnStart');
    
    // Show/hide previous button
    if (state.currentPage === 0) {
        btnPrevious.style.display = 'none';
    } else {
        btnPrevious.style.display = 'block';
    }
    
    // Show/hide next/start buttons
    if (state.currentPage === state.totalPages - 1) {
        btnNext.style.display = 'none';
        btnStart.style.display = 'block';
    } else {
        btnNext.style.display = 'block';
        btnStart.style.display = 'none';
    }
}

function updateProgressText() {
    const progressText = document.getElementById('progressText');
    progressText.textContent = `${state.currentPage + 1} / ${state.totalPages}`;
}

// ================== NAVIGATION FUNCTIONS ==================
function goToNext() {
    if (state.currentPage < state.totalPages - 1) {
        showLoading(() => {
            showPage(state.currentPage + 1);
        });
    }
}

function goToPrevious() {
    if (state.currentPage > 0) {
        showLoading(() => {
            showPage(state.currentPage - 1);
        });
    }
}

function getStarted() {
    // Mark that user has completed the guide
    localStorage.setItem('important_info_completed', 'true');
    
    showLoading(() => {
        // Show success message
       // alert("You're all set! Let's get started.");
        
        // In a real app, this would navigate to the dashboard
        // For now, we'll just reload or redirect
        window.location.href = 'dashboard.html';
        
        // For demo purposes, just show a message
        console.log('Navigating to dashboard...');
    });
}

// ================== KEYBOARD NAVIGATION ==================
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        goToNext();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        goToPrevious();
    }
});

// ================== TOUCH/SWIPE SUPPORT ==================
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', (event) => {
    touchStartX = event.changedTouches[0].screenX;
});

document.addEventListener('touchend', (event) => {
    touchEndX = event.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Swiped left - go to next page
            goToNext();
        } else {
            // Swiped right - go to previous page
            goToPrevious();
        }
    }
}

// ================== UTILITY FUNCTIONS ==================
function hasCompletedGuide() {
    return localStorage.getItem('important_info_completed') === 'true';
}

function resetGuide() {
    localStorage.removeItem('important_info_completed');
    showPage(0);
}

// ================== SAMPLE DATA SETTER ==================
// This function can be used to set sample tillfetch data for testing
function setSampleTillfetchData(minimumWithdraw = '5.00') {
    const sampleData = [
        'value0', 'value1', 'value2', 'value3', 
        'value4', 'value5', 'value6', 
        minimumWithdraw, // Index 7 - minimum withdraw
        'value8', 'value9'
    ];
    localStorage.setItem('tillfetch', JSON.stringify(sampleData));
    
    // Reload the minimum withdraw value
    loadMinimumWithdraw();
    updateMinimumWithdrawDisplay();
}

// For testing purposes - expose some functions globally
window.importantInfoGuide = {
    setSampleData: setSampleTillfetchData,
    resetGuide: resetGuide,
    hasCompleted: hasCompletedGuide,
    goToPage: showPage
};
