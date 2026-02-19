import { screenToHexel } from '../core/hexel.js';
import { getViewport } from '../core/viewport.js';
import { addMessage } from '../ui/messages.js';

export class SelectTool {
    activate() {
        document.body.style.cursor = 'pointer';
    }
    
    deactivate() {
        document.body.style.cursor = 'default';
    }
    
    onClick(x, y) {
        const { scale, offsetX, offsetY } = getViewport();
        const hexel = screenToHexel(x, y, scale, offsetX, offsetY);
        
        // Update selection display
        document.getElementById('selected-hexel').textContent = 
            `(${hexel.q}, ${hexel.r})`;
        
        addMessage(`🔍 selected hexel (${hexel.q}, ${hexel.r})`);
        
        // Highlight selected hexagon (to be implemented)
    }
}
