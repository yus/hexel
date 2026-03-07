// EXPANDED DEBUG BUFFER - 1000 lines
window.debugHistory = [];
window.debug = window.debug || {};

window.debug.log = function(msg) {
    const timestamp = new Date().toLocaleTimeString();
    const entry = `[${timestamp}] ${msg}`;
    
    // Store in history (keep last 1000)
    window.debugHistory.push(entry);
    if (window.debugHistory.length > 1000) {
        window.debugHistory.shift();
    }
    
    // Also log to console
    console.log(entry);
    
    // Update display if exists
    const el = document.getElementById('debug-log');
    if (el) {
        el.innerHTML = window.debugHistory.map(l => 
            `<div style="border-bottom:1px solid #2a2a38; padding:2px; font-size:9px;">${l}</div>`
        ).join('');
        el.scrollTop = el.scrollHeight;
    }
};

// Capture ALL errors
window.addEventListener('error', function(e) {
    window.debug.log(`🔥 ERROR: ${e.message} at ${e.filename}:${e.lineno}`);
});

// Capture console.log
const originalLog = console.log;
console.log = function(...args) {
    originalLog(...args);
    window.debug.log(args.map(a => 
        typeof a === 'object' ? JSON.stringify(a).slice(0,100) : String(a)
    ).join(' '));
};

// Immediate test
window.debug.log('🔴 DEBUG PANEL LOADED - BUFFER 1000 LINES');
window.debug.log('📍 Canvas ID should be: main-canvas');
