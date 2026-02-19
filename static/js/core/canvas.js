// Canvas setup & context management
export let gridCanvas, drawCanvas;
export let gridCtx, drawCtx;

export function initCanvases() {
    gridCanvas = document.getElementById('grid-canvas');
    drawCanvas = document.getElementById('draw-canvas');
    gridCtx = gridCanvas.getContext('2d');
    drawCtx = drawCanvas.getContext('2d');
    
    resizeCanvases();
    window.addEventListener('resize', resizeCanvases);
}

export function resizeCanvases() {
    gridCanvas.width = window.innerWidth;
    gridCanvas.height = window.innerHeight;
    drawCanvas.width = window.innerWidth;
    drawCanvas.height = window.innerHeight;
    
    // Re-draw after resize
    import('./grid.js').then(m => m.drawGrid());
    import('../drawing/renderer.js').then(m => m.drawAll());
}
