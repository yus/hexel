import { screenToHexel } from '../core/hexel.js';
import { getViewport } from '../core/viewport.js';
import { addMessage } from '../ui/messages.js';
import { getRenderer } from '../main.js';
import { addPoint } from '../drawing/points.js';

export class PointTool {
    constructor() {
        this.previewHexel = null;
    }
    
    activate() {
        console.log('🔧 Point tool activated');
        document.body.style.cursor = 'crosshair';
        document.body.dataset.tool = 'point';
    }
    
    deactivate() {
        document.body.style.cursor = 'default';
        document.body.dataset.tool = '';
        this.clearPreview();
    }
    
    onClick(x, y) {
        console.log('🎯 Point click at:', x, y);
        
        const { scale, offsetX, offsetY } = getViewport();
        const hexel = screenToHexel(x, y, scale, offsetX, offsetY);
        
        // Get current color and size from UI
        const color = document.querySelector('.color-swatch.active')?.dataset.color || '#ffaa66';
        const size = parseInt(document.getElementById('size-slider')?.value || '8');
        
        console.log('📍 Adding point at hexel:', hexel, 'color:', color, 'size:', size);
        
        // Add to storage (for persistence)
        addPoint(hexel.q, hexel.r, color, size);
        
        // Add to renderer (for display)
        const renderer = getRenderer();
        if (renderer) {
            renderer.addPoint(hexel.q, hexel.r, color, size, false);
            
            // Force redraw
            const { scale, offsetX, offsetY } = getViewport();
            renderer.drawAll(scale, offsetX, offsetY);
        } else {
            console.error('❌ No renderer available!');
        }
        
        // Update stats panel
        import('../ui/panels.js').then(m => m.updateStats());
        
        addMessage(`✨ point at (${hexel.q}, ${hexel.r})`);
    }
    
    onMouseMove(x, y) {
        // Preview dot follows mouse
        const { scale, offsetX, offsetY } = getViewport();
        const hexel = screenToHexel(x, y, scale, offsetX, offsetY);
        
        // Only update if hexel changed
        if (!this.previewHexel || 
            this.previewHexel.q !== hexel.q || 
            this.previewHexel.r !== hexel.r) {
            
            this.previewHexel = hexel;
            this.drawPreview(hexel);
        }
    }
    
    drawPreview(hexel) {
        const renderer = getRenderer();
        if (!renderer) return;
        
        const color = document.querySelector('.color-swatch.active')?.dataset.color || '#ffaa66';
        const size = parseInt(document.getElementById('size-slider')?.value || '8');
        
        // Clear previous preview
        renderer.clearPreview();
        
        // Draw preview point (semi-transparent)
        renderer.addPoint(hexel.q, hexel.r, color, size, true);
        
        // Redraw
        const { scale, offsetX, offsetY } = getViewport();
        renderer.drawAll(scale, offsetX, offsetY);
    }
    
    clearPreview() {
        const renderer = getRenderer();
        if (renderer) {
            renderer.clearPreview();
            
            const { scale, offsetX, offsetY } = getViewport();
            renderer.drawAll(scale, offsetX, offsetY);
        }
        this.previewHexel = null;
    }
    
    // Empty methods required by tool-manager
    onMouseDown() {}
    onMouseUp() {}
}
