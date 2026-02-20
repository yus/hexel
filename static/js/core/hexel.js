import { H_STEP, V_STEP } from '../utils/constants.js';
import { gridCanvas } from './canvas.js';

export function screenToHexel(screenX, screenY, scale, offsetX, offsetY) {
    // Guard against NaN/undefined
    if (!scale || isNaN(scale)) scale = 1.0;
    if (!offsetX || isNaN(offsetX)) offsetX = 0;
    if (!offsetY || isNaN(offsetY)) offsetY = 0;
    
    const centerX = gridCanvas.width / 2 + offsetX;
    const centerY = gridCanvas.height / 2 + offsetY;
    
    const scaledH = H_STEP * scale;
    const scaledV = V_STEP * scale;
    
    // Guard against division by zero
    if (scaledH === 0 || scaledV === 0) {
        return { q: 0, r: 0 };
    }
    
    const gridX = (screenX - centerX) / scaledH;
    const gridY = (screenY - centerY) / scaledV;
    
    const row = Math.round(gridY);
    let col;
    
    if (row % 2 !== 0) {
        col = Math.round(gridX - 0.5);
    } else {
        col = Math.round(gridX);
    }
    
    // Ensure we return numbers, not NaN
    return { 
        q: isNaN(col) ? 0 : col, 
        r: isNaN(row) ? 0 : row 
    };
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
