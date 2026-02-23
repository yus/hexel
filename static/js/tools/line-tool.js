import { screenToHexel } from '../core/hexel.js';
import { getViewport } from '../core/viewport.js';
import { addMessage } from '../ui/messages.js';
import { getRenderer } from '../main.js';
import { addLine } from '../drawing/lines.js';

export class LineTool {
    constructor() {
        this.startHexel = null;
        this.previewEnd = null;
        this.isDrawing = false;
    }
    
    activate() {
        document.body.style.cursor = 'crosshair';
        document.body.dataset.tool = 'line';
    }
    
    deactivate() {
        this.cancelPreview();
    }
    
    onMouseDown(x, y) {
        const { scale, offsetX, offsetY } = getViewport();
        this.startHexel = screenToHexel(x, y, scale, offsetX, offsetY);
        this.isDrawing = true;
        console.log('Line started at:', this.startHexel);
    }
    
    onMouseMove(x, y) {
        if (!this.isDrawing) return;
        
        const { scale, offsetX, offsetY } = getViewport();
        const currentHexel = screenToHexel(x, y, scale, offsetX, offsetY);
        
        const renderer = getRenderer();
        if (renderer) {
            renderer.clearPreview();
            renderer.setPreviewMode(true);
            
            // Check if method exists
            if (typeof renderer.drawLine === 'function') {
                renderer.drawLine(this.startHexel, currentHexel, '#ffffff', 0.6, true);
            } else {
                // Fallback: just log
                console.log('Preview line from', this.startHexel, 'to', currentHexel);
            }
            
            renderer.setPreviewMode(false);
            renderer.drawAll(scale, offsetX, offsetY);
        }
    }
    
    onMouseUp(x, y) {
        if (!this.isDrawing) return;
        
        const { scale, offsetX, offsetY } = getViewport();
        const endHexel = screenToHexel(x, y, scale, offsetX, offsetY);
        const color = document.querySelector('.color-swatch.active')?.dataset.color || '#ffaa66';
        
        // Add to renderer
        const renderer = getRenderer();
        if (renderer) {
            renderer.addLine(this.startHexel, endHexel, color, false);
        }
        
        // Also store in drawing/lines.js for persistence
        import('../drawing/lines.js').then(m => {
            m.addLine({
                start: this.startHexel,
                end: endHexel,
                color: color
            });
        });
        
        addMessage(`📏 line from (${this.startHexel.q},${this.startHexel.r}) to (${endHexel.q},${endHexel.r})`);
        
        this.isDrawing = false;
        this.startHexel = null;
        
        if (renderer) {
            renderer.clearPreview();
        }
    }
    
    drawPreview() {
        // Preview line drawing
    }
    
    cancelPreview() {
        const renderer = getRenderer();
        if (renderer) {
            renderer.clearPreview();
            
            const { scale, offsetX, offsetY } = getViewport();
            renderer.drawAll(scale, offsetX, offsetY);
        }
        
        this.startHexel = null;
        this.previewEnd = null;
        this.isDrawing = false;
    }
}
