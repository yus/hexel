// src/ui/events.js
// 🖱️ Central event manager for canvas interactions

export class EventManager {
    constructor(canvas, toolManager, mapper) {
        this.canvas = canvas;
        this.tools = toolManager;
        this.mapper = mapper;

        // State
        this.isDragging = false;
        this.dragThreshold = 3; // pixels
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.dragStartX = 0;
        this.dragStartY = 0;

        this.init();
    }

    init() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.onMouseLeave(e));

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
        this.canvas.addEventListener('touchcancel', (e) => this.onTouchCancel(e));

        // Wheel zoom
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

        // Context menu prevention
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    // === MOUSE HANDLERS ===

    onMouseDown(e) {
        e.preventDefault();

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.lastMouseX = x;
        this.lastMouseY = y;
        this.dragStartX = x;
        this.dragStartY = y;

        // Left click only (button 0)
        if (e.button === 0) {
            this.tools.onMouseDown?.(x, y, e);
        }
    }

    onMouseMove(e) {
        e.preventDefault();

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if we should start dragging
        if (!this.isDragging && this.lastMouseX !== 0) {
            const dx = Math.abs(x - this.dragStartX);
            const dy = Math.abs(y - this.dragStartY);

            if (dx > this.dragThreshold || dy > this.dragThreshold) {
                this.isDragging = true;
                this.tools.onDragStart?.(this.dragStartX, this.dragStartY, e);
            }
        }

        // Handle drag or hover
        if (this.isDragging) {
            this.tools.onDragMove?.(x, y, e);
        } else {
            this.tools.onMouseMove?.(x, y, e);
        }

        this.lastMouseX = x;
        this.lastMouseY = y;
    }

    onMouseUp(e) {
        e.preventDefault();

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.isDragging) {
            this.tools.onDragEnd?.(x, y, e);
        } else if (e.button === 0) {
            // It was a click (not drag)
            this.tools.onClick?.(x, y, e);
        }

        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
    }

    onMouseLeave(e) {
        if (this.isDragging) {
            // Cancel drag if mouse leaves canvas
            this.tools.onDragEnd?.(this.lastMouseX, this.lastMouseY, e);
            this.isDragging = false;
        }
        this.lastMouseX = 0;
        this.lastMouseY = 0;
    }

    // === TOUCH HANDLERS ===

    onTouchStart(e) {
        e.preventDefault();
        if (e.touches.length !== 1) return;

        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        this.lastMouseX = x;
        this.lastMouseY = y;
        this.dragStartX = x;
        this.dragStartY = y;

        this.tools.onMouseDown?.(x, y, e);
    }

    onTouchMove(e) {
        e.preventDefault();
        if (e.touches.length !== 1) return;

        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        // Check if we should start dragging
        if (!this.isDragging && this.lastMouseX !== 0) {
            const dx = Math.abs(x - this.dragStartX);
            const dy = Math.abs(y - this.dragStartY);

            if (dx > this.dragThreshold || dy > this.dragThreshold) {
                this.isDragging = true;
                this.tools.onDragStart?.(this.dragStartX, this.dragStartY, e);
            }
        }

        if (this.isDragging) {
            this.tools.onDragMove?.(x, y, e);
        }

        this.lastMouseX = x;
        this.lastMouseY = y;
    }

    onTouchEnd(e) {
        e.preventDefault();

        if (this.isDragging) {
            const rect = this.canvas.getBoundingClientRect();
            this.tools.onDragEnd?.(this.lastMouseX, this.lastMouseY, e);
        } else if (e.touches.length === 0) {
            // It was a tap
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.changedTouches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            this.tools.onClick?.(x, y, e);
        }

        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
    }

    onTouchCancel(e) {
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
    }

    // === WHEEL ZOOM ===

    onWheel(e) {
        e.preventDefault();

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Forward to pan tool or direct mapper
        const panTool = this.tools.getTool('pan');
        if (panTool && this.tools.isCurrent('pan')) {
            panTool.onWheel?.(e, x, y);
        } else {
            // Default zoom behavior
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.mapper.zoom(delta, x, y);
        }
    }
}
