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
        
        // Add to storage (this updates points array)
        addPoint(hexel.q, hexel.r, color, size);
        
        // CRITICAL: Update renderer with new points
        const renderer = getRenderer();
        if (renderer) {
            // Clear and reload all points from storage
            import('../drawing/points.js').then(({ points }) => {
                renderer.points = []; // Clear existing
                points.forEach(p => {
                    renderer.addPoint(p.q, p.r, p.color, p.size);
                });
                
                // Redraw
                const { scale, offsetX, offsetY } = getViewport();
                renderer.drawAll(scale, offsetX, offsetY);
            });
        }
        
        import('../ui/panels.js').then(m => m.updateStats());
        addMessage(`✨ point at (${hexel.q}, ${hexel.r})`);
    }
}
