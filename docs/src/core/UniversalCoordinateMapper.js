// src/core/UniversalCoordinateMapper.js
export class UniversalCoordinateMapper {
    constructor(canvas) {
        this.canvas = canvas;
        this.hexelSize = 24;
        this.hStep = this.hexelSize * 2;
        this.vStep = this.hexelSize * Math.sqrt(3);
        this.scale = 1.0;
        this.offsetX = 0;
        this.offsetY = 0;
    }

    screenToGrid(screenX, screenY) {
        const cx = this.canvas.width/2 + this.offsetX;
        const cy = this.canvas.height/2 + this.offsetY;
        return {
            x: (screenX - cx) / (this.hStep * this.scale),
            y: (screenY - cy) / (this.vStep * this.scale)
        };
    }

    screenToVertex(screenX, screenY, threshold = 15) {
        const { x, y } = this.screenToGrid(screenX, screenY);
        const r = Math.round(y);
        const q = r % 2 ? Math.round(x - 0.5) : Math.round(x);

        const vx = this.vertexToScreen(q, r);
        const dist = Math.hypot(screenX - vx.x, screenY - vx.y);

        return dist <= threshold ? { q, r, ...vx, distance: dist } : null;
    }

    vertexToScreen(q, r) {
        const cx = this.canvas.width/2 + this.offsetX;
        const cy = this.canvas.height/2 + this.offsetY;
        const x = cx + (r % 2 ? (q + 0.5) : q) * this.hStep * this.scale;
        const y = cy + r * this.vStep * this.scale;
        return { x, y };
    }

    setView(scale, offsetX, offsetY) {
        this.scale = scale;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
    }

    // Add at the end of the class
    getDebugInfo() {
        return {
            offsetX: this.offsetX,
            offsetY: this.offsetY,
            scale: this.scale,
            hStep: this.hStep,
            vStep: this.vStep,
            canvasWidth: this.canvas?.width,
            canvasHeight: this.canvas?.height
        };
    }   
}
