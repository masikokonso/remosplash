/**
 * Website Protection Script
 * Protects against code inspection and theft
 * WARNING: No protection is 100% foolproof
 */

(function() {
    'use strict';
    
    // Configuration
    const config = {
        redirectUrl: 'https://www.google.com', // Where to redirect if DevTools detected
        useBlur: true, // Set to false to use redirect instead of blur
        showWarning: true, // Show warning message when DevTools detected
        blockPrintScreen: true,
        blockSelection: true,
        blockCopy: true
    };

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
        
        // F5 or Ctrl+R - Refresh (optional - remove if you want users to refresh)
        // if (e.keyCode === 116 || (e.ctrlKey && e.keyCode === 82)) {
        //     e.preventDefault();
        //     return false;
        // }
        
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
        
        // CSS-based selection blocking
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

    // ==================== DEVTOOLS DETECTION ====================
    let devtoolsOpen = false;
    
    // Method 1: Console detection using toString
    const detectDevTools1 = () => {
        const element = new Image();
        Object.defineProperty(element, 'id', {
            get: function() {
                devtoolsOpen = true;
                handleDevToolsOpen();
                throw new Error('DevTools detected');
            }
        });
        console.log(element);
    };

    // Method 2: Debugger statement detection
    const detectDevTools2 = () => {
        const start = new Date();
        debugger;
        const end = new Date();
        if (end - start > 100) {
            devtoolsOpen = true;
            handleDevToolsOpen();
        }
    };

    // Method 3: Window size detection
    const detectDevTools3 = () => {
        const widthThreshold = window.outerWidth - window.innerWidth > 160;
        const heightThreshold = window.outerHeight - window.innerHeight > 160;
        
        if (widthThreshold || heightThreshold) {
            devtoolsOpen = true;
            handleDevToolsOpen();
        }
    };

    // Method 4: Firebug detection (older method but still useful)
    const detectDevTools4 = () => {
        if (window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized) {
            devtoolsOpen = true;
            handleDevToolsOpen();
        }
    };

    // Method 5: Console properties detection
    const detectDevTools5 = () => {
        let checkStatus = false;
        const devtools = /./;
        devtools.toString = function() {
            checkStatus = true;
            devtoolsOpen = true;
            handleDevToolsOpen();
        };
        console.log('%c', devtools);
    };

    // Method 6: Performance timing detection
    const detectDevTools6 = () => {
        const threshold = 100;
        const start = performance.now();
        debugger;
        const end = performance.now();
        
        if (end - start > threshold) {
            devtoolsOpen = true;
            handleDevToolsOpen();
        }
    };

    // Handle DevTools Detection
    function handleDevToolsOpen() {
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
        document.head.appendChild(style);
        
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

    // ==================== CLEAR CONSOLE PERIODICALLY ====================
    setInterval(() => {
        console.clear();
    }, 1000);

    // ==================== DETECT BROWSER EXTENSIONS ====================
    const detectExtensions = () => {
        // Check for common developer extensions
        const extensionChecks = [
            'chrome-extension://',
            'moz-extension://',
            '__REACT_DEVTOOLS_GLOBAL_HOOK__',
            '__REDUX_DEVTOOLS_EXTENSION__'
        ];
        
        // This is a basic check - extensions are hard to detect fully
        if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__ || window.__REDUX_DEVTOOLS_EXTENSION__) {
            console.warn('Developer extension detected');
        }
    };

    // ==================== ANTI-IFRAME PROTECTION ====================
    if (window.top !== window.self) {
        // Prevent website from being embedded in iframe
        window.top.location = window.self.location;
    }

    // ==================== RUN DETECTION LOOPS ====================
    // Run various detection methods periodically
    setInterval(() => {
        detectDevTools2();
        detectDevTools3();
        detectDevTools6();
    }, 1000);

    setInterval(() => {
        detectDevTools5();
    }, 2000);

    // Initial checks
    window.addEventListener('load', () => {
        detectDevTools4();
        detectExtensions();
    });

    // Check on resize (DevTools opening/closing changes window size)
    window.addEventListener('resize', () => {
        detectDevTools3();
    });

    // ==================== DISABLE CONSOLE FUNCTIONS ====================
    // Override console functions (optional - can break legitimate debugging)
    /*
    const noop = () => {};
    window.console.log = noop;
    window.console.warn = noop;
    window.console.error = noop;
    window.console.info = noop;
    window.console.debug = noop;
    */

    // ==================== PROTECTION STATUS ====================
    console.log('%c🔒 Website Protection Active', 'color: #00ff00; font-size: 20px; font-weight: bold;');
    
})();