// static/js/tools/hexagon-tool.js
import { screenToHexel } from '../core/hexel.js';
import { getViewport } from '../core/viewport.js';
import { addMessage } from '../ui/messages.js';
import { getRenderer } from '../main.js';

export class HexagonTool {
    constructor() {
        this.previewHexel = null;
    }
    
    activate() {
        document.body.style.cursor = 'crosshair';
        document.body.dataset.tool = 'hexagon';
    }
    
    deactivate() {
        document.body.style.cursor = 'default';
        document.body.dataset.tool = '';
        this.clearPreview();
    }
    
    onClick(x, y) {
        const { scale, offsetX, offsetY } = getViewport();
        const hexel = screenToHexel(x, y, scale, offsetX, offsetY);
        
        const color = document.querySelector('.color-swatch.active')?.dataset.color || '#ffaa66';
        
        const renderer = getRenderer();
        if (renderer) {
            renderer.syncFromStorage();
            renderer.addHexagon(hexel.q, hexel.r, color);
            renderer.drawAll(scale, offsetX, offsetY);
        }
        
        addMessage(`⬟ Hexagon at (${hexel.q}, ${hexel.r})`);
    }
    
    onMouseMove(x, y) {
        const { scale, offsetX, offsetY } = getViewport();
        const hexel = screenToHexel(x, y, scale, offsetX, offsetY);
        
        this.previewHexel = hexel;
        this.drawPreview();
    }
    
    drawPreview() {
        this.clearPreview();
        
        if (!this.previewHexel) return;
        
        const renderer = getRenderer();
        if (renderer) {
            const color = document.querySelector('.color-swatch.active')?.dataset.color || '#ffaa66';
            renderer.setPreviewMode(true);
            renderer.addHexagon(this.previewHexel.q, this.previewHexel.r, color, true);
            renderer.setPreviewMode(false);
            
            const { scale, offsetX, offsetY } = getViewport();
            renderer.drawAll(scale, offsetX, offsetY);
        }
    }
    
    clearPreview() {
        const renderer = getRenderer();
        if (renderer) {
            renderer.clearPreview();
        }
        this.previewHexel = null;
    }
}
