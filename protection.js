/**
 * Mobile-Only Protection - FIXED PC Detection
 */

(function() {
    'use strict';
    
    // ==================== DEBUG MODE ====================
    const DEBUG = true; // Set to false after testing
    
    function debugLog(message) {
        if (DEBUG) {
            console.log('🔒 Protection: ' + message);
        }
    }
    
    // ==================== STRICT DEVICE DETECTION ====================
    function isMobileDevice() {
        debugLog('Starting device detection...');
        
        const userAgent = navigator.userAgent.toLowerCase();
        const platform = navigator.platform.toLowerCase();
        
        debugLog('User Agent: ' + userAgent);
        debugLog('Platform: ' + platform);
        
        // FIRST: Explicitly check for DESKTOP/PC platforms
        const desktopPlatforms = ['win32', 'win64', 'windows', 'macintel', 'linux x86_64', 'linux i686'];
        const isDesktopPlatform = desktopPlatforms.some(p => platform.includes(p));
        
        if (isDesktopPlatform) {
            debugLog('❌ Desktop platform detected: ' + platform);
            return false; // Definitely NOT mobile
        }
        
        // SECOND: Check for desktop-specific keywords in User Agent
        const desktopKeywords = ['windows nt', 'macintosh', 'linux x86', 'x11'];
        const hasDesktopKeyword = desktopKeywords.some(keyword => userAgent.includes(keyword));
        
        if (hasDesktopKeyword) {
            debugLog('❌ Desktop keyword found in UA');
            return false; // Definitely NOT mobile
        }
        
        // THIRD: Now check for MOBILE keywords
        const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone', 'mobile', 'tablet'];
        const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
        
        debugLog('Mobile keywords in UA: ' + isMobileUA);
        
        // FOURTH: Check device characteristics (only if no desktop detected)
        const maxTouchPoints = navigator.maxTouchPoints || 0;
        const hasTouch = 'ontouchstart' in window;
        const screenWidth = window.screen.width;
        
        debugLog('Max touch points: ' + maxTouchPoints);
        debugLog('Has touch events: ' + hasTouch);
        debugLog('Screen width: ' + screenWidth);
        
        // For mobile, we want:
        // - Mobile UA keyword OR
        // - Mobile platform (not desktop) AND touch support AND small screen
        const isMobile = isMobileUA || 
                        (!isDesktopPlatform && !hasDesktopKeyword && hasTouch && maxTouchPoints > 1 && screenWidth < 768);
        
        debugLog('Final decision - Is Mobile: ' + isMobile);
        
        return isMobile;
    }
    
    // ==================== CHECK DEVICE TYPE ====================
    if (!isMobileDevice()) {
        debugLog('❌ DESKTOP/PC DETECTED - Protection script will NOT run');
        if (DEBUG) {
            alert('Desktop/PC detected - Protection DISABLED\n\nThis script only runs on mobile devices.');
        }
        return; // EXIT COMPLETELY - No protection on PC
    }
    
    debugLog('✅ MOBILE DEVICE DETECTED - Protection ENABLED');
    if (DEBUG) {
        alert('Mobile device detected - Protection is now ACTIVE!');
    }
    
    // ==================== CONFIGURATION ====================
    const config = {
        blockRightClick: true,
        blockSelection: true,
        blockCopy: true,
        showWarnings: true
    };
    
    // ==================== DISABLE RIGHT CLICK / LONG PRESS ====================
    if (config.blockRightClick) {
        // Method 1: Context Menu
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            e.stopPropagation();
            debugLog('Context menu blocked');
            showWarning('Long press disabled');
            return false;
        }, false);
        
        // Method 2: Long Press Detection
        let longPressTimer;
        
        document.addEventListener('touchstart', function(e) {
            longPressTimer = setTimeout(function() {
                e.preventDefault();
                e.stopPropagation();
                debugLog('Long press blocked');
                showWarning('Long press disabled');
            }, 500);
        }, false);
        
        document.addEventListener('touchend', function() {
            clearTimeout(longPressTimer);
        }, false);
        
        document.addEventListener('touchmove', function() {
            clearTimeout(longPressTimer);
        }, false);
        
        debugLog('Right-click/Long-press protection enabled');
    }
    
    // ==================== DISABLE TEXT SELECTION ====================
    if (config.blockSelection) {
        // Prevent selection start
        document.addEventListener('selectstart', function(e) {
            e.preventDefault();
            debugLog('Text selection blocked');
            return false;
        }, false);
        
        // CSS-based blocking
        const style = document.createElement('style');
        style.textContent = `
            * {
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                -ms-user-select: none !important;
                user-select: none !important;
                -webkit-touch-callout: none !important;
            }
        `;
        document.head.appendChild(style);
        
        debugLog('Text selection protection enabled');
    }
    
    // ==================== DISABLE COPY/PASTE ====================
    if (config.blockCopy) {
        document.addEventListener('copy', function(e) {
            e.preventDefault();
            e.clipboardData.setData('text/plain', '');
            debugLog('Copy blocked');
            showWarning('Copying is disabled');
            return false;
        }, false);
        
        document.addEventListener('cut', function(e) {
            e.preventDefault();
            debugLog('Cut blocked');
            return false;
        }, false);
        
        debugLog('Copy/Cut protection enabled');
    }
    
    // ==================== SHOW WARNING FUNCTION ====================
    function showWarning(message) {
        if (!config.showWarnings) return;
        
        debugLog('Showing warning: ' + message);
        
        // Remove existing warning if any
        const existingWarning = document.getElementById('mobile-protection-warning');
        if (existingWarning) {
            existingWarning.remove();
        }
        
        const warning = document.createElement('div');
        warning.id = 'mobile-protection-warning';
        warning.textContent = message;
        warning.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #ff4444;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            z-index: 999999;
            font-family: Arial, sans-serif;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            text-align: center;
            max-width: 80%;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(warning);
        
        setTimeout(() => {
            if (warning && warning.parentNode) {
                warning.style.opacity = '0';
                warning.style.transition = 'opacity 0.3s';
                setTimeout(() => warning.remove(), 300);
            }
        }, 2500);
    }
    
    // ==================== KEYBOARD SHORTCUTS (for external keyboards) ====================
    document.addEventListener('keydown', function(e) {
        if (e.keyCode === 123 ||
            (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) ||
            (e.ctrlKey && (e.keyCode === 85 || e.keyCode === 83))) {
            e.preventDefault();
            debugLog('Keyboard shortcut blocked: ' + e.keyCode);
            showWarning('Keyboard shortcuts disabled');
            return false;
        }
    }, false);
    
    // ==================== PREVENT ZOOM ====================
    document.addEventListener('touchmove', function(e) {
        if (e.scale !== 1) {
            e.preventDefault();
        }
    }, { passive: false });
    
    document.addEventListener('gesturestart', function(e) {
        e.preventDefault();
    }, false);
    
    // Add viewport meta tag if not exists
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
        viewportMeta = document.createElement('meta');
        viewportMeta.name = 'viewport';
        document.head.appendChild(viewportMeta);
    }
    viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    
    // ==================== ANTI-IFRAME ====================
    if (window.top !== window.self) {
        debugLog('Iframe detected - redirecting');
        window.top.location = window.self.location;
    }
    
    // ==================== DEVTOOLS DETECTION ====================
    let devtoolsDetected = false;
    
    function checkDevTools() {
        const threshold = 100;
        const start = performance.now();
        debugger;
        const end = performance.now();
        
        if (end - start > threshold && !devtoolsDetected) {
            devtoolsDetected = true;
            debugLog('⚠️ DevTools detected!');
            handleDevTools();
        }
    }
    
    function handleDevTools() {
        document.body.style.filter = 'blur(10px)';
        document.body.style.pointerEvents = 'none';
        
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 9999999;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #ff4444;
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 20px;
        `;
        overlay.innerHTML = `
            <div>
                <h1 style="font-size: 32px; margin-bottom: 15px;">⚠️ WARNING ⚠️</h1>
                <p style="font-size: 18px;">Developer Tools Detected!</p>
                <p style="font-size: 14px; margin-top: 15px;">Close DevTools to continue</p>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    
    // Run detection every 2 seconds
    setInterval(checkDevTools, 2000);
    
    // ==================== INITIALIZATION COMPLETE ====================
    debugLog('✅ All protections initialized successfully!');
    
    // Show confirmation
    setTimeout(() => {
        showWarning('🔒 Protection Active');
    }, 1000);
    
})();
