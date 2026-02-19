// ===== ALL IMPORTS AT THE TOP =====
import { drawCanvas, drawCtx } from '../core/canvas.js';
import { points } from './points.js';
import { lines } from './lines.js';
import { triangles } from './triangles.js';  // <-- MOVED HERE from bottom
import { hexelToScreen } from '../core/hexel.js';
import { getViewport } from '../core/viewport.js';

// ===== YOUR EXISTING drawAll FUNCTION =====
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
    
    // Draw triangles if you have them
    triangles.forEach(triangle => {
        // Your triangle drawing code
    });
    
    // Draw lines
    lines.forEach(line => {
        // Your line drawing code
    });
}

// ===== ADD clearAll FUNCTION =====
export function clearAll() {
    // Clear all drawing data
    points.length = 0;
    lines.length = 0;
    triangles.length = 0;
    
    // Redraw empty canvas
    drawAll();
    
    // Update stats
    import('../ui/panels.js').then(m => m.updateStats());
    import('../ui/messages.js').then(m => m.addMessage('🧹 Canvas cleared'));
    
    return true;
}
