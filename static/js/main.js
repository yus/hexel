// Main entry point
import { initCanvases } from './core/canvas.js';
import { initToolbar } from './ui/toolbar.js';
import { initEvents } from './ui/events.js';
import { getViewport } from './core/viewport.js';
import { drawGrid } from './core/grid.js';
import { drawAll } from './drawing/renderer.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize everything
    initCanvases();
    initToolbar();
    initEvents();
    
    // Hide SVG if exists
    const svg = document.getElementById('grid-svg');
    if (svg) svg.style.display = 'none';
    
    // Initial draw
    const { scale, offsetX, offsetY } = getViewport();
    drawGrid(scale, offsetX, offsetY, true);
    drawAll();
});
