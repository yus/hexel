import { getViewport, setOffset, zoom } from '../core/viewport.js';
import { getRenderer } from '../main.js';

export class PanTool {
    constructor() {
        this.isPanning = false;
        this.lastX = 0;
        this.lastY = 0;
    }
    
    activate() {
        document.body.style.cursor = 'grab';
        document.body.dataset.tool = 'pan';
    }
    
    deactivate() {
        document.body.style.cursor = 'default';
        document.body.dataset.tool = '';
        this.isPanning = false;
    }
    
    onMouseDown(x, y) {
        this.isPanning = true;
        this.lastX = x;
        this.lastY = y;
        document.body.style.cursor = 'grabbing';
    }
    
    onMouseMove(x, y) {
        if (!this.isPanning) return;
        
        const dx = x - this.lastX;
        const dy = y - this.lastY;
        
        const { scale } = getViewport();
        
        // Pan at speed that feels good
        const worldDx = dx / scale;
        const worldDy = -dy / scale; // Invert Y for natural feel
        
        setOffset(worldDx, worldDy);
        
        const { scale: newScale, offsetX, offsetY } = getViewport();
        const renderer = getRenderer();
        if (renderer) {
            renderer.drawAll(newScale, offsetX, offsetY);
        }
        
        this.lastX = x;
        this.lastY = y;
    }
    
    onMouseUp() {
        this.isPanning = false;
        document.body.style.cursor = 'grab';
    }
    
    onWheel(e, x, y) {
        e.preventDefault();
        
        const delta = -e.deltaY * 0.001;
        zoom(1 + delta, x, y);
        
        const { scale, offsetX, offsetY } = getViewport();
        const renderer = getRenderer();
        if (renderer) {
            renderer.drawAll(scale, offsetX, offsetY);
        }
        
        import('../ui/indicators.js').then(m => m.showZoomIndicator());
    }
}
