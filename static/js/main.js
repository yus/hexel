// Main entry point
import { initToolbar } from './ui/toolbar.js';
import { initEvents } from './ui/events.js';
import { initPanels } from './ui/panels.js';
import { initMobile } from './ui/mobile.js';
import { initShortcuts } from './ui/shortcuts.js';
import { HexelRenderer } from './core/webgl-renderer.js';
import { saveState, undo, redo, clearHistory } from './drawing/history.js';

// App state
let renderer = null;
let gl = null;

// Export for other modules to access
export function getRenderer() {
    return renderer;
}

export function getGL() {
    return gl;
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('HEXEL STUDIO · 60° Grid initializing...');
    
    // Get WebGL canvas
    const canvas = document.getElementById('grid-gl-canvas');
    if (!canvas) {
        console.error('WebGL canvas not found');
        return;
    }
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    gl = canvas.getContext('webgl', { 
        premultipliedAlpha: false,
        alpha: true 
    });
    
    if (!gl) {
        console.error('WebGL not supported');
        return;
    }
    
    // Initialize renderer
    try {
        renderer = new HexelRenderer(gl);
        console.log('✅ WebGL renderer initialized');
    } catch (e) {
        console.error('Renderer initialization failed:', e);
        return;
    }
    
    // Hide old canvases
    const gridCanvas = document.getElementById('grid-canvas');
    const drawCanvas = document.getElementById('draw-canvas');
    
    if (gridCanvas) gridCanvas.style.display = 'none';
    if (drawCanvas) drawCanvas.style.display = 'none';
    
    // Initialize UI with renderer reference
    initToolbar(renderer);
    initEvents(renderer);
    initPanels(renderer);
    initMobile();
    initShortcuts();
    
    // Initialize history with empty state
    clearHistory();
    saveState(renderer); // Save initial empty state
    
    // Initial draw
    renderer.drawAll(1.0, 0, 0);
    
    // Handle window resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        if (renderer) {
            import('./core/viewport.js').then(({ getViewport }) => {
                const { scale, offsetX, offsetY } = getViewport();
                renderer.drawAll(scale, offsetX, offsetY);
            });
        }
    });
    
    console.log('✨ HEXEL STUDIO ready!');
    
    // Expose undo/redo globally for debugging (optional)
    window.hexel = {
        undo: () => undo(renderer),
        redo: () => redo(renderer),
        saveState: () => saveState(renderer),
        renderer
    };
});

// Handle hot reload (if using dev server)
if (import.meta.hot) {
    import.meta.hot.accept(() => {
        console.log('🔄 Hot reloading...');
        if (renderer && gl) {
            import('./core/viewport.js').then(({ getViewport }) => {
                const { scale, offsetX, offsetY } = getViewport();
                renderer.drawAll(scale, offsetX, offsetY);
            });
        }
    });
}
