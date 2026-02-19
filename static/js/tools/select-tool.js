import { screenToHexel } from '../core/hexel.js';
import { getViewport } from '../core/viewport.js';
import { addMessage } from '../ui/messages.js';
import { drawCtx } from '../core/canvas.js';
import { hexelToScreen } from '../core/hexel.js';
import { H_STEP, V_STEP } from '../utils/constants.js';

let selectedHexel = null;
let selectionHighlight = null;

export class SelectTool {
    constructor() {
        this.isSelecting = false;
        this.hoverHexel = null;
    }
    
    activate() {
        document.body.style.cursor = 'pointer';
        document.body.dataset.tool = 'select';
        // this.showSelectionInfo();
    }
    
    deactivate() {
        document.body.style.cursor = 'default';
        document.body.dataset.tool = '';
        this.clearHighlight();
    }
    
    onMouseMove(x, y) {
        const { scale, offsetX, offsetY } = getViewport();
        const hexel = screenToHexel(x, y, scale, offsetX, offsetY);
        
        // Update hover
        if (!this.hoverHexel || 
            this.hoverHexel.q !== hexel.q || 
            this.hoverHexel.r !== hexel.r) {
            this.hoverHexel = hexel;
            this.drawHoverHighlight(hexel);
        }
    }
    
    onClick(x, y) {
        const { scale, offsetX, offsetY } = getViewport();
        const hexel = screenToHexel(x, y, scale, offsetX, offsetY);
        
        // Set selection
        selectedHexel = hexel;
        this.showSelectionInfo(hexel);
        this.drawSelectionHighlight(hexel);
        
        addMessage(`🔍 selected hexel (${hexel.q}, ${hexel.r})`);
    }
    
    onDoubleClick(x, y) {
        // On double-click, select and show context menu (future)
        const { scale, offsetX, offsetY } = getViewport();
        const hexel = screenToHexel(x, y, scale, offsetX, offsetY);
        
        selectedHexel = hexel;
        this.showSelectionInfo(hexel, true);
        this.drawSelectionHighlight(hexel, true);
        
        addMessage(`✨ hexel (${hexel.q}, ${hexel.r}) selected - press E to edit`, 'info', 4000);
    }
    
    showSelectionInfo(hexel, detailed = false) {
        if (!hexel) {
            console.warn('showSelectionInfo called with undefined hexel');
            return;
        }
        
        // Update UI
        document.getElementById('selected-hexel').textContent = `(${hexel.q}, ${hexel.r})`;
        
        // Calculate world position
        const worldX = (hexel.q * H_STEP) + (hexel.r % 2 !== 0 ? H_STEP/2 : 0);
        const worldY = hexel.r * V_STEP;
        document.getElementById('selected-world').textContent = `${worldX.toFixed(2)}, ${worldY.toFixed(2)}`;
        
        // If detailed, show more info in properties panel
        if (detailed) {
            this.showDetailedInfo(hexel);
        }
    }
    
    showDetailedInfo(hexel) {
        const propsDiv = document.getElementById('tool-properties');
        if (!propsDiv) return;
        
        // Calculate triangle centers (for future triangle selection)
        const center = hexelToScreen(hexel.q, hexel.r, 1.0, 0, 0); // Base scale
        
        propsDiv.innerHTML = `
            <div class="coord-display">
                <div class="coord-row">
                    <span class="coord-label">Hexel</span>
                    <span class="coord-value">(${hexel.q}, ${hexel.r})</span>
                </div>
                <div class="coord-row">
                    <span class="coord-label">World X</span>
                    <span class="coord-value">${worldX.toFixed(2)}</span>
                </div>
                <div class="coord-row">
                    <span class="coord-label">World Y</span>
                    <span class="coord-value">${worldY.toFixed(2)}</span>
                </div>
                <div class="coord-row">
                    <span class="coord-label">Points</span>
                    <span class="coord-value" id="hexel-point-count">0</span>
                </div>
            </div>
            <div class="tool-actions">
                <button class="tool-btn" data-action="fill-hexel">⬟ Fill Hexel</button>
                <button class="tool-btn" data-action="fill-triangle">△ Fill Triangle</button>
                <button class="tool-btn" data-action="clear-hexel">⌫ Clear</button>
            </div>
        `;
        
        // Add event listeners to buttons
        propsDiv.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleAction(action, hexel);
            });
        });
    }
    
    handleAction(action, hexel) {
        switch(action) {
            case 'fill-hexel':
                // Will be implemented with fill tools
                addMessage(`🎨 fill hexel (${hexel.q}, ${hexel.r})`);
                break;
            case 'fill-triangle':
                addMessage(`△ select a triangle in hexel (${hexel.q}, ${hexel.r})`);
                break;
            case 'clear-hexel':
                // Clear points/lines in this hexel
                addMessage(`🧹 cleared hexel (${hexel.q}, ${hexel.r})`);
                break;
        }
    }
    
    drawHoverHighlight(hexel) {
        this.clearHighlight();
        
        const { scale, offsetX, offsetY } = getViewport();
        const center = hexelToScreen(hexel.q, hexel.r, scale, offsetX, offsetY);
        
        // Save context
        drawCtx.save();
        
        // Draw hover outline
        drawCtx.strokeStyle = '#ffffff';
        drawCtx.lineWidth = 2 / scale;
        drawCtx.setLineDash([5 / scale, 5 / scale]);
        drawCtx.globalAlpha = 0.5;
        
        // Draw hexagon outline
        this.drawHexagonOutline(center.x, center.y, scale);
        
        drawCtx.restore();
        
        // Store for cleanup
        this.hoverHighlight = { hexel, time: Date.now() };
    }
    
    drawSelectionHighlight(hexel, persistent = false) {
        this.clearSelection();
        
        const { scale, offsetX, offsetY } = getViewport();
        const center = hexelToScreen(hexel.q, hexel.r, scale, offsetX, offsetY);
        
        // Save context
        drawCtx.save();
        
        // Draw selection highlight
        drawCtx.strokeStyle = '#ffaa66';
        drawCtx.lineWidth = 3 / scale;
        drawCtx.setLineDash([]);
        drawCtx.globalAlpha = 0.8;
        
        // Draw hexagon outline
        this.drawHexagonOutline(center.x, center.y, scale);
        
        // Add corner markers
        drawCtx.fillStyle = '#ffaa66';
        drawCtx.globalAlpha = 0.3;
        this.drawCornerMarkers(center.x, center.y, scale);
        
        drawCtx.restore();
        
        // Store for cleanup
        this.selectionHighlight = { hexel, persistent, time: Date.now() };
    }
    
    drawHexagonOutline(x, y, scale) {
        const size = HEXEL_SIZE * scale;
        
        for (let i = 0; i < 6; i++) {
            const angle1 = i * Math.PI / 3;
            const angle2 = (i + 1) * Math.PI / 3;
            
            const x1 = x + size * Math.cos(angle1);
            const y1 = y + size * Math.sin(angle1);
            const x2 = x + size * Math.cos(angle2);
            const y2 = y + size * Math.sin(angle2);
            
            drawCtx.beginPath();
            drawCtx.moveTo(x1, y1);
            drawCtx.lineTo(x2, y2);
            drawCtx.stroke();
        }
    }
    
    drawCornerMarkers(x, y, scale) {
        const size = HEXEL_SIZE * scale;
        
        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3;
            const cx = x + size * Math.cos(angle);
            const cy = y + size * Math.sin(angle);
            
            drawCtx.beginPath();
            drawCtx.arc(cx, cy, 3 / scale, 0, Math.PI * 2);
            drawCtx.fill();
        }
    }
    
    clearHighlight() {
        // Force redraw of drawing canvas to clear hover
        import('../drawing/renderer.js').then(m => m.drawAll());
        this.hoverHighlight = null;
    }
    
    clearSelection() {
        import('../drawing/renderer.js').then(m => m.drawAll());
        this.selectionHighlight = null;
    }
    
    getSelectedHexel() {
        return selectedHexel;
    }
}

// Export static getter for other tools
export function getSelectedHexel() {
    return selectedHexel;
}
