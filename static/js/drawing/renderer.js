import { drawCtx } from '../core/canvas.js';
import { points } from './points.js';
import { lines } from './lines.js';
import { hexelToScreen } from '../core/hexel.js';
import { getViewport } from '../core/viewport.js';

export function drawAll() {
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    
    const { scale, offsetX, offsetY } = getViewport();
    
    // Draw points
    points.forEach(point => {
        const screen = hexelToScreen(point.q, point.r, scale, offsetX, offsetY);
        
        drawCtx.fillStyle = point.color;
        drawCtx.globalAlpha = 0.9;
        drawCtx.beginPath();
        drawCtx.arc(screen.x, screen.y, point.size * Math.sqrt(scale), 0, Math.PI*2);
        drawCtx.fill();
        
        drawCtx.strokeStyle = '#ffffff';
        drawCtx.lineWidth = 1.5;
        drawCtx.stroke();
    });
    
    // Draw lines (to be implemented)
    lines.forEach(line => {
        // Line drawing implementation
    });
}
