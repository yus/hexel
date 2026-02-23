import { screenToHexel } from '../core/hexel.js';
import { getViewport } from '../core/viewport.js';
import { addMessage } from '../ui/messages.js';
import { getRenderer } from '../main.js';
import { H_STEP, V_STEP, HEXEL_SIZE } from '../utils/constants.js';

let selectedHexel = null;

export class SelectTool {
    constructor() {
        this.hoverHexel = null;
    }
    
    activate() {
        document.body.style.cursor = 'pointer';
        document.body.dataset.tool = 'select';
    }
    
    deactivate() {
        document.body.style.cursor = 'default';
        document.body.dataset.tool = '';
        this.clearHighlight();
    }
    
    onMouseMove(x, y) {
        const { scale, offsetX, offsetY } = getViewport();
        const hexel = screenToHexel(x, y, scale, offsetX, offsetY);
        
        if (!this.hoverHexel || 
            this.hoverHexel.q !== hexel.q || 
            this.hoverHexel.r !== hexel.r) {
            this.hoverHexel = hexel;
            this.drawPreview(hexel);
        }
    }
    
    onClick(x, y) {
        const { scale, offsetX, offsetY } = getViewport();
        const hexel = screenToHexel(x, y, scale, offsetX, offsetY);
        
        selectedHexel = hexel;
        this.showSelectionInfo(hexel);
        this.drawSelectionHighlight(hexel);
        
        addMessage(`🔍 selected hexel (${hexel.q}, ${hexel.r})`);
    }

    // Add this method to your SelectTool class
    drawPreview(hexel) {
        const renderer = getRenderer();
        if (!renderer) return;
        
        renderer.setPreviewMode(true);
        renderer.drawHexagonOutline(hexel, '#ffffff', 0.5, true);
        renderer.setPreviewMode(false);
    }
    
    drawHexagonOutline(hexel, color, alpha, dashed) {
        // Implementation for hexagon outline
        // We'll add this later
    }
    
    drawSelectionHighlight(hexel) {
        const renderer = getRenderer();
        if (!renderer) return;
        
        renderer.setPreviewMode(true);
        renderer.drawHexagonOutline(hexel, '#ffaa66', 0.8, false); // solid
        renderer.drawHexagonCorners(hexel, '#ffaa66', 0.3);
        renderer.setPreviewMode(false);
    }
    
    clearHighlight() {
        const renderer = getRenderer();
        if (renderer) {
            renderer.clearPreview();
        }
        this.hoverHexel = null;
    }
    
    showSelectionInfo(hexel) {
        document.getElementById('selected-hexel').textContent = `(${hexel.q}, ${hexel.r})`;
        
        const worldX = (hexel.q * H_STEP) + (hexel.r % 2 !== 0 ? H_STEP/2 : 0);
        const worldY = hexel.r * V_STEP;
        document.getElementById('selected-world').textContent = `${worldX.toFixed(2)}, ${worldY.toFixed(2)}`;
    }
    
    clearSelection() {
        this.clearHighlight();
        selectedHexel = null;
        document.getElementById('selected-hexel').textContent = '(0, 0)';
        document.getElementById('selected-world').textContent = '0.00, 0.00';
    }
}

export function getSelectedHexel() {
    return selectedHexel;
}
