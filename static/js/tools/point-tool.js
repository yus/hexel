import { addPoint } from '../drawing/points.js';
import { screenToHexel } from '../core/hexel.js';
import { getViewport } from '../core/viewport.js';
import { addMessage } from '../ui/messages.js';

export class PointTool {
    activate() {
        document.body.style.cursor = 'crosshair';
    }
    
    deactivate() {
        document.body.style.cursor = 'default';
    }
    
    onClick(x, y) {
        const { scale, offsetX, offsetY } = getViewport();
        const hexel = screenToHexel(x, y, scale, offsetX, offsetY);
        
        // Get current color and size from UI
        const color = document.getElementById('current-color').value;
        const size = parseInt(document.getElementById('size-slider').value);
        
        const added = addPoint(hexel.q, hexel.r, color, size);
        
        if (added) {
            addMessage(`✨ point at (${hexel.q}, ${hexel.r})`);
            import('../drawing/renderer.js').then(m => m.drawAll());
        }
    }
}
