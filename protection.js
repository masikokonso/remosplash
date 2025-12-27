/**
 * Website Protection Script - FIXED VERSION
 * Protects against code inspection and theft
 */

(function() {
    'use strict';
    
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

    // ==================== DISABLE RIGHT CLICK ====================
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showWarning('Right-click is disabled on this website');
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
            showWarning('Copying content is disabled');
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
                showWarning('Screenshots are disabled');
            }
        });
    }

    // ==================== DEVTOOLS DETECTION (IMPROVED) ====================
    
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

    // Method 2: Window size detection (improved)
    const detectDevTools2 = () => {
        // More conservative thresholds to avoid false positives
        const widthThreshold = window.outerWidth - window.innerWidth > 200;
        const heightThreshold = window.outerHeight - window.innerHeight > 200;
        
        // Only trigger if BOTH dimensions are suspicious
        const screenRatio = window.screen.width / window.innerWidth;
        
        if ((widthThreshold || heightThreshold) && screenRatio < 1.5) {
            return true;
        }
        return false;
    };

    // Method 3: Console detection using devtools-detect pattern
    const detectDevTools3 = () => {
        const devtools = {
            isOpen: false,
            orientation: undefined
        };
        
        const threshold = 160;
        const emitEvent = (isOpen, orientation) => {
            devtools.isOpen = isOpen;
            devtools.orientation = orientation;
        };

        setInterval(() => {
            const widthThreshold = window.outerWidth - window.innerWidth > threshold;
            const heightThreshold = window.outerHeight - window.innerHeight > threshold;
            const orientation = widthThreshold ? 'vertical' : 'horizontal';

            if (!(heightThreshold && widthThreshold) &&
                ((window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized) || widthThreshold || heightThreshold)) {
                if (!devtools.isOpen || devtools.orientation !== orientation) {
                    emitEvent(true, orientation);
                    return true;
                }
            } else {
                if (devtools.isOpen) {
                    emitEvent(false, undefined);
                    return false;
                }
            }
        }, 500);
        
        return devtools.isOpen;
    };

    // Handle DevTools Detection
    function handleDevToolsOpen() {
        if (devtoolsOpen || warningShown) return; // Prevent multiple triggers
        
        devtoolsOpen = true;
        warningShown = true;
        
        if (config.useBlur) {
            // Blur the entire page
            document.body.style.filter = 'blur(10px)';
            document.body.style.pointerEvents = 'none';
            
            if (config.showWarning) {
                showDevToolsWarning();
            }
        } else {
            // Redirect to another page
            window.location.href = config.redirectUrl;
        }
    }

    // Show DevTools warning overlay
    function showDevToolsWarning() {
        // Check if overlay already exists
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
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            padding: 20px;
        `;
        overlay.innerHTML = `
            <div>
                <h1 style="font-size: 48px; margin-bottom: 20px;">⚠️ WARNING ⚠️</h1>
                <p>Developer Tools Detected!</p>
                <p style="font-size: 18px; margin-top: 20px;">This action has been logged.</p>
                <p style="font-size: 16px; margin-top: 10px;">Close DevTools to continue.</p>
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
            right: 20px;
            background: #ff4444;
            color: white;
            padding: 15px 25px;
            border-radius: 5px;
            z-index: 999999;
            font-family: Arial, sans-serif;
            font-size: 14px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease-out;
        `;
        warning.textContent = message;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        if (!document.getElementById('warning-animation-style')) {
            style.id = 'warning-animation-style';
            document.head.appendChild(style);
        }
        
        document.body.appendChild(warning);
        
        setTimeout(() => {
            warning.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => warning.remove(), 300);
        }, 3000);
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

    // ==================== RUN DETECTION LOOPS ====================
    // Only run detection after page is fully loaded and with delays
    let detectionStarted = false;
    
    window.addEventListener('load', () => {
        // Wait 2 seconds after page load before starting detection
        setTimeout(() => {
            detectionStarted = true;
            
            // Run detection every 2 seconds (less aggressive)
            setInterval(() => {
                if (!devtoolsOpen) {
                    const detected = detectDevTools1();
                    if (detected) {
                        handleDevToolsOpen();
                    }
                }
            }, 2000);
            
            // Window size check on resize only
            window.addEventListener('resize', () => {
                if (!devtoolsOpen && detectionStarted) {
                    setTimeout(() => {
                        const detected = detectDevTools2();
                        if (detected) {
                            handleDevToolsOpen();
                        }
                    }, 500); // Delay to avoid false positives during legitimate resizing
                }
            });
            
        }, 2000);
    });

    // ==================== DETECT F12 KEY PRESS ====================
    // Additional layer: detect when F12 is actually pressed
    let f12Pressed = false;
    document.addEventListener('keydown', (e) => {
        if (e.keyCode === 123 || 
            (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67))) {
            f12Pressed = true;
            // Start more aggressive checking after F12 press
            setTimeout(() => {
                if (!devtoolsOpen) {
                    const detected = detectDevTools1();
                    if (detected) {
                        handleDevToolsOpen();
                    }
                }
            }, 100);
        }
    });

})();
