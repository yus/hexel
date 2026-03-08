// debug-panel.js — SINGLE CLEAN VERSION

// Create debug namespace
window.debug = {
    history: [],
    
    log: function(msg) {
        const timestamp = new Date().toLocaleTimeString();
        const entry = `[${timestamp}] ${msg}`;
        
        this.history.push(entry);
        if (this.history.length > 500) this.history.shift();
        
        console.log(entry);
        
        const el = document.getElementById('debug-log');
        if (el) {
            el.innerHTML = this.history.map(l => 
                `<div style="border-bottom:1px solid #2a2a38; padding:2px;">${l}</div>`
            ).join('');
            el.scrollTop = el.scrollHeight;
        }
    },
    
    clear: function() {
        this.history = [];
        const el = document.getElementById('debug-log');
        if (el) el.innerHTML = '';
        this.log('🐞 Debug cleared');
    },
    
    copy: function() {
        const text = this.history.join('\n');
        navigator.clipboard?.writeText(text).then(() => {
            this.log('📋 Copied to clipboard');
        });
    },
    
    testGrid: function() {
        if (window.studio?.mapper) {
            const m = window.studio.mapper;
            this.log(`📍 offsetX: ${m.offsetX}, offsetY: ${m.offsetY}, scale: ${m.scale}`);
            if (window.studio.render) window.studio.render();
        } else {
            this.log('❌ Studio not ready');
        }
    },
    
    testMapper: function() {
        if (window.studio?.mapper) {
            const m = window.studio.mapper;
            this.log(`📐 Mapper: offset=(${m.offsetX},${m.offsetY}) scale=${m.scale}`);
            if (window.studio.render) window.studio.render();
        } else {
            this.log('❌ Mapper not available');
        }
    },
    
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

window.debug.toggle = function() {
    const content = document.getElementById('debug-content');
    const isVisible = content.style.display !== 'none';
    content.style.display = isVisible ? 'none' : 'block';
};

window.debug.disable = function() {
    document.getElementById('debug-panel').style.display = 'none';
};

// Capture errors
window.addEventListener('error', function(e) {
    window.debug.log(`🔥 ${e.message} at ${e.filename}:${e.lineno}`);
});

// Override console ✅ FIXED — no infinite loop
const originalLog = console.log;
console.log = function(...args) {
    // Call original first
    originalLog.apply(console, args);
    
    // Then add to debug panel (but don't call console.log again!)
    const el = document.getElementById('debug-log');
    if (el && window.debug && window.debug.history) {
        const msg = args.map(a => 
            typeof a === 'object' ? JSON.stringify(a).slice(0,100) : String(a)
        ).join(' ');
        
        const timestamp = new Date().toLocaleTimeString();
        const entry = `[${timestamp}] ${msg}`;
        
        window.debug.history.push(entry);
        if (window.debug.history.length > 500) window.debug.history.shift();
        
        el.innerHTML = window.debug.history.map(l => 
            `<div style="border-bottom:1px solid #2a2a38; padding:2px;">${l}</div>`
        ).join('');
        el.scrollTop = el.scrollHeight;
    }
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

// Mouse tracking
document.addEventListener('mousemove', (e) => {
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
                window.debug.log(`⚠️ ${e.message}`);
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
