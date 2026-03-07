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

    // Global debug object
    window.debug = {
        logs: [],
    
        log: function(...args) {
            const msg = args.map(a => 
                typeof a === 'object' ? JSON.stringify(a).slice(0,100) : String(a)
            ).join(' ');
        
            this.logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
            if (this.logs.length > 20) this.logs.shift();
        
            const el = document.getElementById('debug-log');
            if (el) {
                el.innerHTML = this.logs.map(l => `<div style="border-bottom:1px solid #2a2a38; padding:2px;">${l}</div>`).join('');
                el.scrollTop = el.scrollHeight;
            }
        },
    
        clear: function() {
            this.logs = [];
            document.getElementById('debug-log').innerHTML = '';
            this.log('🐞 Debug cleared');
        },
    
        copy: function() {
            const text = this.logs.join('\n');
            navigator.clipboard?.writeText(text).then(() => {
                this.log('📋 Copied to clipboard');
            });
        },
    
        testGrid: function() {
            if (window.studio?.mapper) {
                const m = window.studio.mapper;
                this.log(`📍 offsetX: ${m.offsetX}, offsetY: ${m.offsetY}, scale: ${m.scale}`);
                // Force grid redraw
                if (window.studio.render) window.studio.render();
            } else {
                this.log('❌ Studio not ready');
            }
        },

        testMapper: function() {
            const studio = getStudio();
            if (studio?.mapper) {
                const info = studio.mapper.getDebugInfo?.() || {
                    offsetX: studio.mapper.offsetX,
                    offsetY: studio.mapper.offsetY,
                    scale: studio.mapper.scale
                };
                this.log(`📐 Mapper: offset=(${info.offsetX},${info.offsetY}) scale=${info.scale}`);
        
                // Force a redraw to test
                if (studio.render) studio.render();
            } else {
                this.log('❌ Mapper not available');
            }
        },
    
        updateMouse: function(x, y) {
            document.getElementById('debug-mouse').innerHTML = `${Math.round(x)},${Math.round(y)}`;
        },
    
        updateGrid: function(x, y) {
            document.getElementById('debug-grid').innerHTML = `${x.toFixed(2)},${y.toFixed(2)}`;
        },
    
        updateHexel: function(q, r) {
            document.getElementById('debug-hexel').innerHTML = `${q},${r}`;
        }
    };

    // Override console
    const originalConsole = console.log;
    console.log = function(...args) {
        originalConsole(...args);
        window.debug.log(...args);
    };

    // Time update
    // Better studio access with retry
function getStudio() {
    return window.studio || null;
}

// Aggressive studio retry
(function waitForStudio() {
    if (window.studio) {
        window.debug.log('✅ Studio connected!');
        window.debug.testMapper(); // Test immediately
    } else {
        window.debug.log('⏳ Waiting for studio...');
        setTimeout(waitForStudio, 500);
    }
})();

// Update mouse with better error handling
document.addEventListener('mousemove', (e) => {
    window.debug.updateMouse(e.clientX, e.clientY);
    
    const studio = getStudio();
    if (studio?.mapper) {
        const rect = studio.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (x >= 0 && x <= studio.canvas.width && y >= 0 && y <= studio.canvas.height) {
            try {
                const grid = studio.mapper.screenToGrid(x, y);
                window.debug.updateGrid(grid.x, grid.y);
                
                const vertex = studio.mapper.screenToVertex(x, y, 30);
                if (vertex) {
                    window.debug.updateHexel(vertex.q, vertex.r);
                } else {
                    window.debug.updateHexel('--', '--');
                }
            } catch (e) {
                window.debug.log(`⚠️ Error: ${e.message}`);
            }
        }
    } else {
        // Update with placeholder
        window.debug.updateGrid('--', '--');
        window.debug.updateHexel('--', '--');
    }
});

    window.debug.log('🐞 Debug panel ready');
    window.debug.log('📍 Move mouse to see coordinates');
