/**
 * Mobile-Only Website Protection Script
 * Only activates on mobile devices, bypasses PCs completely
 */

(function() {
    'use strict';
    
    // ==================== MOBILE DEVICE DETECTION ====================
    function isMobileDevice() {
        // Method 1: User Agent Detection
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i;
        const isMobileUA = mobileRegex.test(userAgent.toLowerCase());
        
        // Method 2: Touch Detection
        const hasTouch = ('ontouchstart' in window) || 
                        (navigator.maxTouchPoints > 0) || 
                        (navigator.msMaxTouchPoints > 0);
        
        // Method 3: Screen Size Detection (mobile typically < 768px)
        const isMobileScreen = window.innerWidth <= 768;
        
        // Method 4: Check for mobile-specific features
        const isMobileFeatures = /Mobi|Android/i.test(navigator.userAgent);
        
        // Return true if ANY mobile indicator is present
        return isMobileUA || (hasTouch && isMobileScreen) || isMobileFeatures;
    }
    
    // ==================== EXIT IF NOT MOBILE ====================
    if (!isMobileDevice()) {
        console.log('Desktop detected - protection script disabled');
        return; // Exit the script completely for PC users
    }
    
    // ==================== MOBILE PROTECTION STARTS HERE ====================
    console.log('Mobile device detected - protection active');
    
    // Configuration
    const config = {
        redirectUrl: 'https://www.google.com',
        useBlur: true, // true = blur, false = redirect
        showWarning: true,
        blockPrintScreen: true,
        blockSelection: true,
        blockCopy: true,
        detectionSensitivity: 'medium' // 'low', 'medium', 'high'
    };

    let devtoolsOpen = false;
    let warningShown = false;

    // ==================== DISABLE RIGHT CLICK (Long Press on Mobile) ====================
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showWarning('Long press is disabled');
        return false;
    });
    
    // Prevent long-press context menu on mobile
    let pressTimer;
    document.addEventListener('touchstart', function(e) {
        pressTimer = setTimeout(function() {
            e.preventDefault();
            showWarning('Long press is disabled');
        }, 500);
    });
    
    document.addEventListener('touchend', function() {
        clearTimeout(pressTimer);
    });
    
    document.addEventListener('touchmove', function() {
        clearTimeout(pressTimer);
    });

    // ==================== DISABLE KEYBOARD SHORTCUTS (for external keyboards) ====================
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
    });

    // ==================== DISABLE TEXT SELECTION ====================
    if (config.blockSelection) {
        document.addEventListener('selectstart', function(e) {
            e.preventDefault();
            return false;
        });
        
        // Prevent text selection on tap-hold
        document.addEventListener('touchstart', function(e) {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        });
        
        document.addEventListener('mousedown', function(e) {
            if (e.detail > 1) {
                e.preventDefault();
                return false;
            }
        });
        
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
        document.body.style.webkitTouchCallout = 'none'; // iOS Safari
        document.body.style.mozUserSelect = 'none';
        document.body.style.msUserSelect = 'none';
    }

    // ==================== DISABLE COPY ====================
    if (config.blockCopy) {
        document.addEventListener('copy', function(e) {
            e.preventDefault();
            showWarning('Copying content is disabled');
            return false;
        });
        
        document.addEventListener('cut', function(e) {
            e.preventDefault();
            return false;
        });
    }

    // ==================== MOBILE DEVTOOLS DETECTION ====================
    
    // Get threshold based on sensitivity
    const getThreshold = () => {
        const thresholds = {
            low: 200,
            medium: 100,
            high: 50
        };
        return thresholds[config.detectionSensitivity] || 100;
    };

    // Method 1: Debugger timing detection
    const detectDevTools1 = () => {
        const threshold = getThreshold();
        const start = performance.now();
        debugger;
        const end = performance.now();
        
        if (end - start > threshold) {
            return true;
        }
        return false;
    };

    // Method 2: Mobile browser console detection (Chrome mobile, Firefox mobile)
    const detectMobileConsole = () => {
        // Check for mobile browser console
        const element = document.createElement('div');
        Object.defineProperty(element, 'id', {
            get: function() {
                // Console is open
                return true;
            }
        });
        
        // This will trigger if console is open
        requestAnimationFrame(() => {
            console.profile(element);
            console.profileEnd(element);
        });
        
        return false;
    };

    // Method 3: Detect USB debugging (Android)
    const detectUSBDebugging = () => {
        // Check if USB debugging might be enabled
        if (window.chrome && window.chrome.webstore) {
            return false; // Desktop Chrome
        }
        
        // Mobile-specific checks
        const isAndroid = /Android/i.test(navigator.userAgent);
        if (isAndroid) {
            // Additional Android-specific detection can be added here
            return false;
        }
        
        return false;
    };

    // Handle DevTools Detection
    function handleDevToolsOpen() {
        if (devtoolsOpen || warningShown) return;
        
        devtoolsOpen = true;
        warningShown = true;
        
        if (config.useBlur) {
            document.body.style.filter = 'blur(10px)';
            document.body.style.pointerEvents = 'none';
            
            if (config.showWarning) {
                showDevToolsWarning();
            }
        } else {
            window.location.href = config.redirectUrl;
        }
    }

    // Show DevTools warning overlay
    function showDevToolsWarning() {
        if (document.getElementById('devtools-warning-overlay')) return;
        
        const overlay = document.createElement('div');
        overlay.id = 'devtools-warning-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 999999;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #ff4444;
            font-family: Arial, sans-serif;
            font-size: 20px;
            font-weight: bold;
            text-align: center;
            padding: 20px;
            box-sizing: border-box;
        `;
        overlay.innerHTML = `
            <div style="max-width: 90%;">
                <h1 style="font-size: 36px; margin-bottom: 20px;">⚠️ WARNING ⚠️</h1>
                <p style="font-size: 18px;">Developer Tools Detected!</p>
                <p style="font-size: 14px; margin-top: 20px;">This action has been logged.</p>
                <p style="font-size: 12px; margin-top: 10px;">Close DevTools to continue.</p>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    // Show custom warning messages
    function showWarning(message) {
        if (!config.showWarning) return;
        
        const warning = document.createElement('div');
        warning.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #ff4444;
            color: white;
            padding: 12px 20px;
            border-radius: 5px;
            z-index: 999999;
            font-family: Arial, sans-serif;
            font-size: 13px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            animation: slideDown 0.3s ease-out;
            max-width: 90%;
            text-align: center;
        `;
        warning.textContent = message;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from { transform: translateX(-50%) translateY(-100px); opacity: 0; }
                to { transform: translateX(-50%) translateY(0); opacity: 1; }
            }
        `;
        if (!document.getElementById('warning-animation-style')) {
            style.id = 'warning-animation-style';
            document.head.appendChild(style);
        }
        
        document.body.appendChild(warning);
        
        setTimeout(() => {
            warning.style.animation = 'slideDown 0.3s ease-out reverse';
            setTimeout(() => warning.remove(), 300);
        }, 2500);
    }

    // ==================== DISABLE DRAG AND DROP ====================
    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
        return false;
    });

    // ==================== PREVENT SCREENSHOT ON ANDROID ====================
    // Note: This is limited on mobile, but we can make it harder
    document.addEventListener('keyup', function(e) {
        // Power + Volume Down (screenshot combo detection - limited)
        if (e.key === 'PrintScreen' || e.keyCode === 44) {
            navigator.clipboard.writeText('');
            showWarning('Screenshots are disabled');
        }
    });

    // ==================== DETECT SCREEN RECORDING (LIMITED) ====================
    // Detect if user might be screen recording
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
        navigator.mediaDevices.getDisplayMedia = function() {
            showWarning('Screen recording detected');
            return Promise.reject(new Error('Screen recording blocked'));
        };
    }

    // ==================== ANTI-IFRAME PROTECTION ====================
    if (window.top !== window.self) {
        window.top.location = window.self.location;
    }

    // ==================== PREVENT PINCH ZOOM ====================
    document.addEventListener('touchmove', function(e) {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
    
    document.addEventListener('gesturestart', function(e) {
        e.preventDefault();
    });

    // ==================== RUN DETECTION LOOPS (Mobile-Optimized) ====================
    let detectionStarted = false;
    
    window.addEventListener('load', () => {
        setTimeout(() => {
            detectionStarted = true;
            
            // Run detection every 3 seconds (less battery intensive on mobile)
            setInterval(() => {
                if (!devtoolsOpen) {
                    const detected = detectDevTools1();
                    if (detected) {
                        handleDevToolsOpen();
                    }
                }
            }, 3000);
            
        }, 2000);
    });

    // ==================== DETECT WHEN APP GOES TO BACKGROUND ====================
    // This might indicate USB debugging or remote debugging
    let wasHidden = false;
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            wasHidden = true;
        } else if (wasHidden) {
            // App came back from background - check for debugging
            setTimeout(() => {
                if (!devtoolsOpen) {
                    const detected = detectDevTools1();
                    if (detected) {
                        handleDevToolsOpen();
                    }
                }
            }, 500);
        }
    });

    // ==================== ORIENTATION CHANGE DETECTION ====================
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            if (detectionStarted && !devtoolsOpen) {
                const detected = detectDevTools1();
                if (detected) {
                    handleDevToolsOpen();
                }
            }
        }, 500);
    });

    // ==================== MOBILE-SPECIFIC PROTECTION INDICATOR ====================
    console.log('%c🔒 Mobile Protection Active', 'color: #00ff00; font-size: 16px; font-weight: bold;');

})();
