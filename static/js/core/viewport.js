import { H_STEP, V_STEP } from '../utils/constants.js';

let scale = 1.0;
let offsetX = 0;
let offsetY = 0;

export function getViewport() {
    return { scale, offsetX, offsetY };
}

export function setScale(newScale) {
    scale = Math.max(0.2, Math.min(10, newScale));
}

export function setOffset(dx, dy) {
    offsetX += dx;
    offsetY += dy;
}

export function zoom(factor, centerX, centerY) {
    const prevScale = scale;
    
    // Get world position before zoom
    const worldX = (centerX - (window.innerWidth/2 + offsetX)) / (H_STEP * prevScale);
    const worldY = (centerY - (window.innerHeight/2 + offsetY)) / (V_STEP * prevScale);
    
    // Apply zoom
    scale *= factor;
    scale = Math.max(0.2, Math.min(10, scale));
    
    // Adjust offset to zoom toward center
    offsetX = centerX - window.innerWidth/2 - worldX * H_STEP * scale;
    offsetY = centerY - window.innerHeight/2 - worldY * V_STEP * scale;
}
