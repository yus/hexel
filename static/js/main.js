// Main entry point
import { initCanvases } from './core/canvas.js';
import { initToolbar } from './ui/toolbar.js';
import { initEvents } from './ui/events.js';
import { initPanels } from './ui/panels.js';
import { initMobile } from './ui/mobile.js';
import { getViewport } from './core/viewport.js';
import { drawGrid } from './core/grid.js';
import { drawAll } from './drawing/renderer.js';
import { initGridShader, drawGridGL } from './core/grid-shader.js';
import { saveState } from './drawing/history.js';
import { initShortcuts } from './ui/shortcuts.js';

// App state
let glShader = null;
let useWebGL = true;

document.addEventListener('DOMContentLoaded', () => {
    console.log('HEXEL STUDIO · 60° Grid initializing...');
    
    // Try WebGL first for perfect hairline grids
    try {
        glShader = initGridShader();
        if (glShader) {
            console.log('✅ WebGL shader loaded - perfect hairline grids!');
            useWebGL = true;
            
            // Hide canvas grid, show WebGL canvas
            document.getElementById('grid-canvas').style.display = 'none';
            const glCanvas = document.getElementById('grid-gl-canvas');
            if (glCanvas) {
                glCanvas.style.display = 'block';
                glCanvas.width = window.innerWidth;
                glCanvas.height = window.innerHeight;
            }
        } else {
            throw new Error('WebGL shader init failed');
        }
    } catch (e) {
        console.warn('⚠️ WebGL not available, using canvas fallback');
        useWebGL = false;
        
        // Show canvas grid, hide WebGL canvas
        document.getElementById('grid-canvas').style.display = 'block';
        const glCanvas = document.getElementById('grid-gl-canvas');
        if (glCanvas) glCanvas.style.display = 'none';
    }

    // In main.js, after WebGL check, add:
    if (useWebGL && glShader) {
        drawGridGL(glShader, scale, offsetX, offsetY);
        document.getElementById('grid-gl-canvas').style.display = 'block';
        document.getElementById('grid-canvas').style.display = 'none';
    } else {
        document.getElementById('grid-canvas').style.display = 'block';
        document.getElementById('grid-gl-canvas').style.display = 'none';
        drawGrid(scale, offsetX, offsetY, true); // Force grid enabled
    }
    
    // Initialize core systems
    initCanvases();
    initToolbar();
    initEvents();
    initPanels();
    initMobile();
    initShortcuts();
    
    // Hide SVG if exists (legacy)
    const svg = document.getElementById('grid-svg');
    if (svg) svg.style.display = 'none';
    
    // Initial draw
    const { scale, offsetX, offsetY, gridEnabled } = getViewport();
    
    if (useWebGL && glShader) {
        drawGridGL(glShader, scale, offsetX, offsetY);
    } else {
        drawGrid(scale, offsetX, offsetY, gridEnabled);
    }
    
    drawAll();
    
    // Save initial state for undo/redo
    saveState();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        const glCanvas = document.getElementById('grid-gl-canvas');
        if (glCanvas) {
            glCanvas.width = window.innerWidth;
            glCanvas.height = window.innerHeight;
        }
        
        const { scale, offsetX, offsetY, gridEnabled } = getViewport();
        
        if (useWebGL && glShader) {
            drawGridGL(glShader, scale, offsetX, offsetY);
        } else {
            drawGrid(scale, offsetX, offsetY, gridEnabled);
        }
        
        drawAll();
    });
    
    console.log('✨ HEXEL STUDIO ready!');
});

// Export for debugging (optional)
export function toggleRenderer() {
    useWebGL = !useWebGL;
    
    const gridCanvas = document.getElementById('grid-canvas');
    const glCanvas = document.getElementById('grid-gl-canvas');
    
    if (useWebGL && glShader) {
        gridCanvas.style.display = 'none';
        glCanvas.style.display = 'block';
    } else {
        gridCanvas.style.display = 'block';
        if (glCanvas) glCanvas.style.display = 'none';
    }
    
    const { scale, offsetX, offsetY, gridEnabled } = getViewport();
    
    if (useWebGL && glShader) {
        drawGridGL(glShader, scale, offsetX, offsetY);
    } else {
        drawGrid(scale, offsetX, offsetY, gridEnabled);
    }
}

// Hot reload helper (for development)
if (import.meta.hot) {
    import.meta.hot.accept(() => {
        console.log('🔄 Hot reloading...');
        const { scale, offsetX, offsetY, gridEnabled } = getViewport();
        
        if (useWebGL && glShader) {
            drawGridGL(glShader, scale, offsetX, offsetY);
        } else {
            drawGrid(scale, offsetX, offsetY, gridEnabled);
        }
        
        drawAll();
    });
}
