// static/js/drawing/renderer.js
// This file now acts as a compatibility layer for the WebGL renderer

import { getRenderer } from '../main.js';
import { getViewport } from '../core/viewport.js';

// Re-export data arrays for backward compatibility
import { points, lines, triangles, hexagons } from './points.js';
export { points, lines, triangles, hexagons };

// Main drawing function - now uses WebGL renderer
export function drawAll() {
    const renderer = getRenderer();
    if (!renderer) {
        console.warn('Renderer not available');
        return;
    }
    
    // Sync data from storage to renderer
    syncDataToRenderer(renderer);
    
    // Get current viewport
    const { scale, offsetX, offsetY } = getViewport();
    
    // Draw everything
    renderer.drawAll(scale, offsetX, offsetY);
}

// Sync data from storage modules to WebGL renderer
function syncDataToRenderer(renderer) {
    // Clear renderer data
    renderer.points = [];
    renderer.lines = [];
    renderer.triangles = [];
    renderer.hexagons = [];
    
    // Copy points
    points.forEach(p => {
        renderer.addPoint(p.q, p.r, p.color, p.size);
    });
    
    // Copy lines (if your renderer supports them)
    if (renderer.addLine && lines) {
        lines.forEach(l => renderer.addLine(l));
    }
    
    // Copy triangles
    if (renderer.addTriangle && triangles) {
        triangles.forEach(t => renderer.addTriangle(t));
    }
    
    // Copy hexagons
    if (renderer.addHexagon && hexagons) {
        hexagons.forEach(h => renderer.addHexagon(h));
    }
    
    // Update WebGL buffers
    renderer.updatePointBuffer();
    if (renderer.updateLineBuffer) renderer.updateLineBuffer();
    if (renderer.updateTriangleBuffer) renderer.updateTriangleBuffer();
}

// Clear everything
export function clearAll() {
    // Clear data storage
    import('./points.js').then(m => {
        m.clearPoints();
        m.clearLines?.();
        m.clearTriangles?.();
        m.clearHexagons?.();
    });
    
    // Clear renderer
    const renderer = getRenderer();
    if (renderer) {
        renderer.clear();
        
        import('./viewport.js').then(({ getViewport }) => {
            const { scale, offsetX, offsetY } = getViewport();
            renderer.drawAll(scale, offsetX, offsetY);
        });
    }
    
    import('./panels.js').then(m => m.updateStats());
    
    return true;
}

// Individual clear functions
export function clearPoints() {
    import('./points.js').then(m => m.clearPoints());
    drawAll();
}

export function clearLines() {
    import('./points.js').then(m => m.clearLines?.());
    drawAll();
}

export function clearTriangles() {
    import('./points.js').then(m => m.clearTriangles?.());
    drawAll();
}

// Force a redraw (useful after direct data manipulation)
export function redraw() {
    drawAll();
}
