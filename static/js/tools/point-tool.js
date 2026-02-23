import { screenToHexel } from '../core/hexel.js';
import { getViewport } from '../core/viewport.js';
import { addMessage } from '../ui/messages.js';
import { getRenderer } from '../main.js';
import { addPoint } from '../drawing/points.js';

export class PointTool {
    // Add these empty methods to prevent errors
    onMouseDown(x, y) {
        // Point tool doesn't need mouse down
    }
    
    onMouseUp(x, y) {
        // Point tool doesn't need mouse up
    }

    onClick(x, y) {
        const { scale, offsetX, offsetY } = getViewport();
        const hexel = screenToHexel(x, y, scale, offsetX, offsetY);
        
        const color = document.querySelector('.color-swatch.active')?.dataset.color || '#ffaa66';
        const size = parseInt(document.getElementById('size-slider')?.value || '8');
        
        // Add to storage
        import('../drawing/points.js').then(m => m.addPoint(hexel.q, hexel.r, color, size));
        
        // Add to renderer
        const renderer = getRenderer();
        if (renderer) {
            renderer.addPoint(hexel.q, hexel.r, color, size);
            const { scale, offsetX, offsetY } = getViewport();
            renderer.drawAll(scale, offsetX, offsetY);
        }
        
        import('../ui/panels.js').then(m => m.updateStats());
        addMessage(`✨ point at (${hexel.q}, ${hexel.r})`);
    }
    
    onMouseMove(x, y) {
        const { scale, offsetX, offsetY } = getViewport();
        const hexel = screenToHexel(x, y, scale, offsetX, offsetY);
        
        const renderer = getRenderer();
        if (renderer) {
            renderer.clearPreview();
            
            const color = document.querySelector('.color-swatch.active')?.dataset.color || '#ffaa66';
            const size = parseInt(document.getElementById('size-slider')?.value || '8');
            
            renderer.setPreviewMode(true);
            renderer.addPoint(hexel.q, hexel.r, color, size, true);
            renderer.setPreviewMode(false);
            
            renderer.drawAll(scale, offsetX, offsetY);
        }
    }
}
