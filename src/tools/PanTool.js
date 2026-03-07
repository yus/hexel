// src/tools/PanTool.js
export class PanTool {
    constructor(mapper) {
        this.mapper = mapper;
        this.dragging = false;
        this.lastX = 0;
        this.lastY = 0;
    }

    onDragStart(x, y) {
        this.dragging = true;
        this.lastX = x;
        this.lastY = y;
    }

    onDragMove(x, y) {
        if (!this.dragging) return;
        const dx = x - this.lastX;
        const dy = y - this.lastY;

        // CORRECT: subtract both axes
        this.mapper.offsetX -= dx;
        this.mapper.offsetY -= dy;  // FIXED!

        this.lastX = x;
        this.lastY = y;
    }

    onDragEnd() {
        this.dragging = false;
    }
}
