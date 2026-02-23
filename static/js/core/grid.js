// static/js/core/grid.js
// This file now acts as a compatibility layer for the WebGL renderer

import { getRenderer } from '../main.js';

// Grid state
let gridEnabled = true;
let gridOpacity = 0.25;
let gridSnappingEnabled = true;

// Re-export for backward compatibility
export { gridEnabled, gridOpacity, gridSnappingEnabled };

// Main drawing function - now uses WebGL renderer
export function drawGrid(scale, offsetX, offsetY, enabled = gridEnabled) {
    const renderer = getRenderer();
    if (!renderer) {
        console.warn('Renderer not available');
        return;
    }
    
    // Update grid visibility in renderer
    renderer.gridEnabled = enabled;
    renderer.gridOpacity = gridOpacity;
    
    // Redraw everything (grid + points)
    renderer.drawAll(scale, offsetX, offsetY);
}

// Toggle grid on/off
export function toggleGrid() {
    gridEnabled = !gridEnabled;
    
    import('../core/viewport.js').then(({ getViewport }) => {
        const { scale, offsetX, offsetY } = getViewport();
        drawGrid(scale, offsetX, offsetY, gridEnabled);
    });
    
    // Update UI
    const btn = document.getElementById('header-grid-toggle');
    if (btn) btn.classList.toggle('active', gridEnabled);
    
    document.getElementById('status-grid').textContent = gridEnabled ? 'ON' : 'OFF';
    
    return gridEnabled;
}

// Set grid opacity
export function setGridOpacity(opacity) {
    gridOpacity = opacity;
    
    import('../core/viewport.js').then(({ getViewport }) => {
        const { scale, offsetX, offsetY } = getViewport();
        drawGrid(scale, offsetX, offsetY, gridEnabled);
    });
}

// Snapping functions
export function setSnapping(enabled) {
    gridSnappingEnabled = enabled;
    console.log('Grid snapping:', enabled);
    
    localStorage?.setItem('hexelSnapping', enabled);
    window.dispatchEvent(new CustomEvent('snapping-changed', { detail: { enabled } }));
}

export function getSnapping() {
    return gridSnappingEnabled;
}

// Get grid state
export function getGridState() {
    return gridEnabled;
}
