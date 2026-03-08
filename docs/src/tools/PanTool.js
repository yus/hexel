// src/tools/PanTool.js
// ✋ Pan tool with full guards against undefined

export class PanTool {
    constructor(mapper) {
        this.mapper = mapper;
        this.active = false;
        this.dragging = false;
        this.lastX = 0;
        this.lastY = 0;
        this.pinchStartDist = null;
    
        // Bind touch handlers
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
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

    // Touch start handler
    handleTouchStart(e) {
        if (e.touches.length === 2) {
            this.pinchStartDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
        }
    }

    // Touch move handler
    handleTouchMove(e) {
        if (e.touches.length === 2) {
            this.onTouchPinch(e);
        }
    }

    // Touch end handler
    handleTouchEnd() {
        this.pinchStartDist = null;
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
    // In PanTool.js

onWheel(e, x, y) {
    e.preventDefault();
    
    // Handle pinch gesture (touch events with scale)
    if (e.scale) {
        // Safari pinch gesture
        const delta = e.scale > 1 ? 1.1 : 0.9;
        this.applyZoom(delta, x, y);
    } 
    // Handle mouse wheel
    else if (e.deltaY) {
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this.applyZoom(delta, x, y);
    }
}

// Handle touch pinch events
onTouchPinch(e) {
    e.preventDefault();
    
    if (e.touches.length !== 2) return;
    
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    
    // Calculate current distance
    const currentDist = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
    );
    
    // Store initial distance on first move
    if (!this.pinchStartDist) {
        this.pinchStartDist = currentDist;
        return;
    }
    
    // Calculate zoom factor based on distance change
    const zoomFactor = currentDist / this.pinchStartDist;
    
    // Get pinch center point
    const centerX = (touch1.clientX + touch2.clientX) / 2;
    const centerY = (touch1.clientY + touch2.clientY) / 2;
    
    // Apply zoom
    this.applyZoom(zoomFactor, centerX, centerY);
    
    // Update for next move
    this.pinchStartDist = currentDist;
}

// Unified zoom method
applyZoom(factor, screenX, screenY) {
    if (!this.mapper) return;
    
    // Convert screen to world coordinates before zoom
    const rect = this.mapper.canvas.getBoundingClientRect();
    const canvasX = screenX - rect.left;
    const canvasY = screenY - rect.top;
    
    const worldX = (canvasX - (this.mapper.canvas.width/2 + this.mapper.offsetX)) / 
                   (this.mapper.hStep * this.mapper.scale);
    const worldY = (canvasY - (this.mapper.canvas.height/2 + this.mapper.offsetY)) / 
                   (this.mapper.vStep * this.mapper.scale);
    
    // Apply zoom with limits
    this.mapper.scale *= factor;
    this.mapper.scale = Math.max(0.2, Math.min(5, this.mapper.scale));
    
    // Adjust offset to zoom toward cursor
    this.mapper.offsetX = canvasX - this.mapper.canvas.width/2 - 
                         worldX * this.mapper.hStep * this.mapper.scale;
    this.mapper.offsetY = canvasY - this.mapper.canvas.height/2 - 
                         worldY * this.mapper.vStep * this.mapper.scale;
    
    // Trigger render
    window.studio?.render();
}
