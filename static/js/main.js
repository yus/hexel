// Main entry point
import { initCanvases } from './core/canvas.js';
import { initToolbar } from './ui/toolbar.js';
import { initEvents } from './ui/events.js';
import { initPanels } from './ui/panels.js';
import { initMobile } from './ui/mobile.js';
import { initShortcuts } from './ui/shortcuts.js';
import { drawAll } from './drawing/renderer.js';
import { initGridShader, drawGridGL } from './core/grid-shader.js';
import { saveState } from './drawing/history.js';

// App state
let glShader = null;
let useWebGL = true;

document.addEventListener('DOMContentLoaded', async () => {
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
    
    // Initialize core systems
    initCanvases();
    
    // Now import viewport and get values
    const { getViewport } = await import('./core/viewport.js');
    const { scale, offsetX, offsetY, gridEnabled } = getViewport();
    
    // Draw initial grid
    if (useWebGL && glShader) {
        drawGridGL(glShader, scale, offsetX, offsetY);
    } else {
        const { drawGrid } = await import('./core/grid.js');
        drawGrid(scale, offsetX, offsetY, gridEnabled);
    }
    
    // Draw all elements
    drawAll();
    
    // Initialize UI components
    initToolbar();
    initEvents();
    initPanels();
    initMobile();
    initShortcuts();
    
    // Hide SVG if exists (legacy)
    const svg = document.getElementById('grid-svg');
    if (svg) svg.style.display = 'none';
    
    // Save initial state for undo/redo
    saveState();
    
    console.log('✨ HEXEL STUDIO ready!');
    
    // Handle window resize
    window.addEventListener('resize', async () => {
        const glCanvas = document.getElementById('grid-gl-canvas');
        if (glCanvas) {
            glCanvas.width = window.innerWidth;
            glCanvas.height = window.innerHeight;
        }
        
        const { getViewport } = await import('./core/viewport.js');
        const { scale, offsetX, offsetY, gridEnabled } = getViewport();
        
        if (useWebGL && glShader) {
            drawGridGL(glShader, scale, offsetX, offsetY);
        } else {
            const { drawGrid } = await import('./core/grid.js');
            drawGrid(scale, offsetX, offsetY, gridEnabled);
        }
        
        drawAll();
    });
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
    
    // Redraw with new renderer
    import('./core/viewport.js').then(({ getViewport }) => {
        const { scale, offsetX, offsetY, gridEnabled } = getViewport();
        
        if (useWebGL && glShader) {
            drawGridGL(glShader, scale, offsetX, offsetY);
        } else {
            import('./core/grid.js').then(({ drawGrid }) => {
                drawGrid(scale, offsetX, offsetY, gridEnabled);
            });
        }
        drawAll();
    });
}
