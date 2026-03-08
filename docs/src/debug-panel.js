// debug-panel.js - Complete with toggle, disable, and performance

const DEBUG_CONFIG = {
    enabled: true,        // Master switch
    maxLines: 200,        // Keep performance smooth
    showTimestamps: true,
    collapsed: false
};

window.debug = {
    history: [],
    enabled: DEBUG_CONFIG.enabled,
    
    // Main log method - optimized
    log: function(msg) {
        if (!this.enabled) return;
        
        const timestamp = DEBUG_CONFIG.showTimestamps ? 
            `[${new Date().toLocaleTimeString()}] ` : '';
        const entry = `${timestamp}${msg}`;
        
        this.history.push(entry);
        if (this.history.length > DEBUG_CONFIG.maxLines) {
            this.history.shift();
        }
        
        // Always log to console
        console.log(entry);
        
        // Throttle DOM updates (max 60fps)
        if (!this._updatePending) {
            this._updatePending = true;
            requestAnimationFrame(() => {
                this._updateDisplay();
                this._updatePending = false;
            });
        }
    },
    
    // Separate display update
    _updateDisplay: function() {
        const el = document.getElementById('debug-log');
        if (!el) return;
        
        // Use innerHTML once, not per line
        el.innerHTML = this.history.map(l => 
            `<div style="border-bottom:1px solid #2a2a38; padding:2px; font-size:10px;">${l}</div>`
        ).join('');
        el.scrollTop = el.scrollHeight;
    },
    
    // Clear logs
    clear: function() {
        this.history = [];
        this._updateDisplay();
        this.log('🐞 Debug cleared');
    },
    
    // Copy to clipboard
    copy: function() {
        const text = this.history.join('\n');
        navigator.clipboard?.writeText(text).then(() => {
            this.log('📋 Copied to clipboard');
        });
    },
    
    // Toggle panel visibility
    toggle: function() {
        const panel = document.getElementById('debug-panel');
        const content = document.getElementById('debug-content');
        const toggleBtn = document.getElementById('debug-toggle-btn');
    
        if (!panel || !content) return;
    
        const isCollapsed = content.style.display === 'none';
    
        if (isCollapsed) {
            // Expand
            content.style.display = 'block';
            panel.style.height = 'auto';
            toggleBtn.innerHTML = '🔻';
            this.log('🔻 Debug expanded');
        } else {
            // Collapse
            content.style.display = 'none';
            panel.style.height = '40px';
            toggleBtn.innerHTML = '🔺';
            this.log('🔺 Debug collapsed');
        }
    },
    
    // Disable debug completely
    disable: function() {
        this.enabled = false;
        const panel = document.getElementById('debug-panel');
        if (panel) panel.style.display = 'none';
        console.log('❄️ Debug disabled');
    },
    
    // Enable debug
    enable: function() {
        this.enabled = true;
        const panel = document.getElementById('debug-panel');
        if (panel) panel.style.display = 'block';
        this.log('🫧 Debug enabled');
    },
    
    // Test grid/mapper
    testGrid: function() {
        if (window.studio?.mapper) {
            const m = window.studio.mapper;
            this.log(`📍 offsetX: ${m.offsetX.toFixed(2)}, offsetY: ${m.offsetY.toFixed(2)}, scale: ${m.scale}`);
            if (window.studio.render) window.studio.render();
        } else {
            this.log('❌ Studio not ready');
        }
    },
    
    testMapper: function() {
        if (window.studio?.mapper) {
            const m = window.studio.mapper;
            this.log(`📐 Mapper: offset=(${m.offsetX.toFixed(2)},${m.offsetY.toFixed(2)}) scale=${m.scale}`);
        } else {
            this.log('❌ Mapper not available');
        }
    },
    
    // Update mouse display
    updateMouse: function(x, y) {
        const el = document.getElementById('debug-mouse');
        if (el) el.innerHTML = `${Math.round(x)},${Math.round(y)}`;
    },
    
    updateGrid: function(x, y) {
        const el = document.getElementById('debug-grid');
        if (el) el.innerHTML = typeof x === 'number' ? `${x.toFixed(2)},${y.toFixed(2)}` : `${x},${y}`;
    },
    
    updateHexel: function(q, r) {
        const el = document.getElementById('debug-hexel');
        if (el) el.innerHTML = `${q},${r}`;
    }
};

// Override console with care (no infinite loops)
const originalConsole = console.log;
console.log = function(...args) {
    originalConsole.apply(console, args);
    // Don't call debug.log here - let debug.log call console.log
};

// Time update
setInterval(() => {
    const el = document.getElementById('debug-time');
    if (el) el.innerHTML = new Date().toLocaleTimeString();
}, 1000);

// Wait for studio
(function waitForStudio() {
    if (window.studio) {
        window.debug.log('✅ Studio connected!');
        window.debug.testMapper();
    } else {
        window.debug.log('⏳ Waiting for studio...');
        setTimeout(waitForStudio, 500);
    }
})();

// Mouse tracking with throttling
let lastMouseUpdate = 0;
document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastMouseUpdate < 50) return; // Throttle to 20fps
    lastMouseUpdate = now;
    
    window.debug.updateMouse(e.clientX, e.clientY);
    
    if (window.studio?.mapper) {
        const rect = window.studio.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (x >= 0 && x <= window.studio.canvas.width && y >= 0 && y <= window.studio.canvas.height) {
            try {
                const grid = window.studio.mapper.screenToGrid(x, y);
                window.debug.updateGrid(grid.x, grid.y);
                
                const vertex = window.studio.mapper.screenToVertex(x, y, 30);
                window.debug.updateHexel(vertex ? vertex.q : '--', vertex ? vertex.r : '--');
            } catch (e) {
                // Silent fail
            }
        }
    } else {
        window.debug.updateGrid('--', '--');
        window.debug.updateHexel('--', '--');
    }
});

// Initial log
window.debug.log('🐞 DEBUG PANEL LOADED');
window.debug.log('📍 Canvas ID: main-canvas');
