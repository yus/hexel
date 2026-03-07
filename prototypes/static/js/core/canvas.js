// This file is now just for compatibility - can be removed later
import { getRenderer } from '../main.js';

// Keep these exports for backward compatibility
export const gridCanvas = {
    get width() { return getRenderer()?.gl?.canvas?.width || 0; },
    get height() { return getRenderer()?.gl?.canvas?.height || 0; }
};

export const drawCanvas = gridCanvas; // Same for drawing

// These are no longer used but kept to prevent errors
export const gridCtx = null;
export const drawCtx = null;

export function initCanvases() {
    // Nothing to do anymore - WebGL handles it
    console.log('Using WebGL renderer');
}

export function resizeCanvases() {
    const renderer = getRenderer();
    if (renderer?.gl?.canvas) {
        renderer.gl.canvas.width = window.innerWidth;
        renderer.gl.canvas.height = window.innerHeight;
    }
}
