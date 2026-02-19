import { H_STEP, V_STEP } from '../utils/constants.js';
import { gridCanvas } from './canvas.js';

export function screenToHexel(screenX, screenY, scale, offsetX, offsetY) {
    const centerX = gridCanvas.width / 2 + offsetX;
    const centerY = gridCanvas.height / 2 + offsetY;
    
    const scaledH = H_STEP * scale;
    const scaledV = V_STEP * scale;
    
    const gridX = (screenX - centerX) / scaledH;
    const gridY = (screenY - centerY) / scaledV;
    
    const row = Math.round(gridY);
    let col;
    
    if (row % 2 !== 0) {
        col = Math.round(gridX - 0.5);
    } else {
        col = Math.round(gridX);
    }
    
    return { q: col, r: row };
}

export function hexelToScreen(q, r, scale, offsetX, offsetY) {
    const centerX = gridCanvas.width / 2 + offsetX;
    const centerY = gridCanvas.height / 2 + offsetY;
    
    const scaledH = H_STEP * scale;
    const scaledV = V_STEP * scale;
    
    return {
        x: centerX + (r % 2 !== 0 ? (q + 0.5) * scaledH : q * scaledH),
        y: centerY + r * scaledV
    };
}
