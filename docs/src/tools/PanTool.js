// src/tools/PanTool.js
// ✋ Pan tool with full guards against undefined

export class PanTool {
    constructor(mapper) {
        this.mapper = mapper;
        this.active = false;
        this.dragging = false;
        this.lastX = 0;
        this.lastY = 0;
    }
    
    // Called when tool is activated
    activate() {
        this.active = true;
        console.log('PanTool activated');
    }
    
    // Called when tool is deactivated
    deactivate() {
        this.active = false;
        this.dragging = false;
        console.log('PanTool deactivated');
    }
    
    // Mouse down / touch start
    onDragStart(x, y) {
        if (!this.mapper) {
            console.warn('PanTool: mapper undefined');
            return null;
        }
        
        this.dragging = true;
        this.lastX = x;
        this.lastY = y;
        
        return { x, y };
    }
    
    // Mouse move / touch move
    onDragMove(x, y) {
        if (!this.mapper) {
            console.warn('PanTool: mapper undefined');
            return;
        }
        
        if (!this.dragging) return;
        
        const dx = x - this.lastX;
        const dy = y - this.lastY;
        
        // Update mapper offsets (subtract for natural pan)
        this.mapper.offsetX -= dx;
        this.mapper.offsetY -= dy;
        
        this.lastX = x;
        this.lastY = y;
        
        return { dx, dy };
    }
    
    // Mouse up / touch end
    onDragEnd(x, y) {
        if (!this.mapper) {
            console.warn('PanTool: mapper undefined');
            return null;
        }
        
        this.dragging = false;
        
        return { x, y };
    }
    
    // Hover (no-op for pan)
    onHover(x, y) {
        return null;
    }
    
    // Click (no-op for pan)
    onClick(x, y) {
        return null;
    }
    
    // Wheel zoom (optional enhancement)
    onWheel(e, x, y) {
        if (!this.mapper) {
            console.warn('PanTool: mapper undefined');
            return;
        }
        
        e.preventDefault();
        
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = this.mapper.scale * delta;
        
        // Clamp scale
        this.mapper.scale = Math.max(0.2, Math.min(5, newScale));
        
        return { scale: this.mapper.scale };
    }
}
