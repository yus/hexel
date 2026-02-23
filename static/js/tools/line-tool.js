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
        console.log('Line start:', this.startHexel);
    }
    
    onMouseMove(x, y) {
        if (!this.isDrawing) return;
        
        const { scale, offsetX, offsetY } = getViewport();
        this.previewEnd = screenToHexel(x, y, scale, offsetX, offsetY);
        
        this.drawPreview();
    }
    
    onMouseUp(x, y) {
        if (!this.isDrawing || !this.startHexel) return;
        
        const { scale, offsetX, offsetY } = getViewport();
        const endHexel = screenToHexel(x, y, scale, offsetX, offsetY);
        
        // Add line logic here
        console.log('Line from', this.startHexel, 'to', endHexel);
        
        this.cancelPreview();
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
