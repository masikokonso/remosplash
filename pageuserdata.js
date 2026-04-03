/**
 * Website Protection Script - Single Redirect Only
 * Protects against code inspection and theft
 * Redirect URL is loaded from app-config.js (APP_CONFIG.baseUrl)
 */

(function() {
    'use strict';

    // ==================== CONFIGURATION ====================
    const config = {
        // Uses APP_CONFIG.baseUrl from app-config.js if available, else falls back to hardcoded URL
        get redirectUrl() {
            return (window.APP_CONFIG && window.APP_CONFIG.baseUrl)
                ? window.APP_CONFIG.baseUrl
                : 'https://remotask-web.vercel.app';
        },
        useBlur: false,
        showWarning: false,
        blockPrintScreen: true,
        blockSelection: true,
        blockCopy: true
    };

    // ==================== DOMAIN ENFORCEMENT ====================
    // Uses enforceAppDomain() from app-config.js if available
    if (typeof enforceAppDomain === 'function') {
        enforceAppDomain();
    }

    // ==================== SINGLE REDIRECT FLAG ====================
    let hasRedirected = false;

    // ==================== DISABLE RIGHT CLICK ====================
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });

    // ==================== DISABLE KEYBOARD SHORTCUTS ====================
    document.addEventListener('keydown', function(e) {
        // F12 - Developer Tools
        if (e.keyCode === 123) {
            e.preventDefault();
            return false;
        }

        // Ctrl+Shift+I - Inspect Element
        if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
            e.preventDefault();
            return false;
        }

        // Ctrl+Shift+J - Console
        if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
            e.preventDefault();
            return false;
        }

        // Ctrl+Shift+C - Inspect Element (alternative)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
            e.preventDefault();
            return false;
        }

        // Ctrl+U - View Source
        if (e.ctrlKey && e.keyCode === 85) {
            e.preventDefault();
            return false;
        }

        // Ctrl+S - Save Page
        if (e.ctrlKey && e.keyCode === 83) {
            e.preventDefault();
            return false;
        }

        // Ctrl+P - Print
        if (e.ctrlKey && e.keyCode === 80) {
            e.preventDefault();
            return false;
        }

        // Cmd+Option+I (Mac)
        if (e.metaKey && e.altKey && e.keyCode === 73) {
            e.preventDefault();
            return false;
        }

        // Cmd+Option+J (Mac)
        if (e.metaKey && e.altKey && e.keyCode === 74) {
            e.preventDefault();
            return false;
        }

        // Cmd+Option+C (Mac)
        if (e.metaKey && e.altKey && e.keyCode === 67) {
            e.preventDefault();
            return false;
        }
    });

    // ==================== DISABLE TEXT SELECTION ====================
    if (config.blockSelection) {
        document.addEventListener('selectstart', function(e) {
            e.preventDefault();
            return false;
        });

        document.addEventListener('mousedown', function(e) {
            if (e.detail > 1) {
                e.preventDefault();
                return false;
            }
        });

        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
        document.body.style.mozUserSelect = 'none';
        document.body.style.msUserSelect = 'none';
    }

    // ==================== DISABLE COPY ====================
    if (config.blockCopy) {
        document.addEventListener('copy', function(e) {
            e.preventDefault();
            return false;
        });

        document.addEventListener('cut', function(e) {
            e.preventDefault();
            return false;
        });
    }

    // ==================== BLOCK PRINT SCREEN ====================
    if (config.blockPrintScreen) {
        document.addEventListener('keyup', function(e) {
            if (e.key === 'PrintScreen') {
                navigator.clipboard.writeText('');
            }
        });
    }

    // ==================== DEVTOOLS DETECTION (SINGLE REDIRECT) ====================

    // Simple debugger detection
    const detectDevTools = () => {
        if (hasRedirected) return false; // Already redirected, stop checking

        const threshold = 100;
        const start = performance.now();
        debugger;
        const end = performance.now();

        return (end - start > threshold);
    };

    // Handle DevTools Detection - REDIRECT ONCE ONLY
    function handleDevToolsOpen() {
        if (hasRedirected) return; // Prevent multiple redirects

        hasRedirected = true; // Mark as redirected

        // Stop all future detection
        clearInterval(detectionInterval);

        if (config.useBlur) {
            document.body.style.filter = 'blur(10px)';
            document.body.style.pointerEvents = 'none';
        } else {
            // Redirect ONCE and never again
            window.location.href = config.redirectUrl;
        }
    }

    // ==================== DISABLE DRAG AND DROP ====================
    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
        return false;
    });

    // ==================== ANTI-IFRAME PROTECTION ====================
    if (window.top !== window.self) {
        window.top.location = window.self.location;
    }

    // ==================== RUN DETECTION (WILL STOP AFTER FIRST REDIRECT) ====================
    let detectionInterval;

    // Wait 2 seconds before starting detection
    setTimeout(() => {
        detectionInterval = setInterval(() => {
            if (!hasRedirected && detectDevTools()) {
                handleDevToolsOpen();
            }
        }, 2000);
    }, 2000);

    // ==================== PROTECTION STATUS ====================
    console.log('%c🔒 Website Protection Active', 'color: #00ff00; font-size: 16px; font-weight: bold;');

})();
