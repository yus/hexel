import { screenToHexel } from '../core/hexel.js';
import { getViewport } from '../core/viewport.js';
import { addMessage } from '../ui/messages.js';
import { drawCtx } from '../core/canvas.js';
import { hexelToScreen } from '../core/hexel.js';
import { H_STEP, V_STEP } from '../utils/constants.js';
import { lines, addLine } from '../drawing/lines.js';

export class LineTool {
    constructor() {
        this.startHexel = null;
        this.previewLine = null;
        this.isDrawing = false;
    }
    
    activate() {
        document.body.style.cursor = 'cell';
        document.body.dataset.tool = 'line';
    }
    
    deactivate() {
        document.body.style.cursor = 'default';
        document.body.dataset.tool = '';
        this.cancelPreview();
    }
    
    onMouseDown(x, y) {
        const { scale, offsetX, offsetY } = getViewport();
        const hexel = screenToHexel(x, y, scale, offsetX, offsetY);
        
        // Start line
        this.startHexel = hexel;
        this.isDrawing = true;
        
        addMessage(`📍 line start at (${hexel.q}, ${hexel.r})`, 'info', 2000);
    }
    
    onMouseMove(x, y) {
        if (!this.isDrawing || !this.startHexel) return;
        
        const { scale, offsetX, offsetY } = getViewport();
        const endHexel = screenToHexel(x, y, scale, offsetX, offsetY);
        
        // Update preview
        this.previewLine = {
            start: this.startHexel,
            end: endHexel
        };
        
        this.drawPreview();
    }
    
    onMouseUp(x, y) {
        if (!this.isDrawing || !this.startHexel) return;
        
        const { scale, offsetX, offsetY } = getViewport();
        const endHexel = screenToHexel(x, y, scale, offsetX, offsetY);
        
        // Calculate line points using hexagon grid algorithm
        const linePoints = this.calculateHexelLine(this.startHexel, endHexel);
        
        // Add line to drawing
        if (linePoints.length > 1) {
            const color = document.querySelector('.color-swatch.active')?.dataset.color || '#ffaa66';
            const size = parseInt(document.getElementById('size-slider')?.value || '8');
            
            addLine({
                points: linePoints,
                color: color,
                size: size,
                start: this.startHexel,
                end: endHexel
            });
            
            addMessage(`📏 line from (${this.startHexel.q},${this.startHexel.r}) to (${endHexel.q},${endHexel.r})`);
            
            // Redraw
            import('../drawing/renderer.js').then(m => m.drawAll());
        }
        
        // Reset
        this.cancelPreview();
    }
    
    calculateHexelLine(start, end) {
        // Bresenham-like algorithm for hex grid
        const points = [];
        
        let { q: q0, r: r0 } = start;
        let { q: q1, r: r1 } = end;
        
        // Convert to cube coordinates for easier line calculation
        const cube0 = this.axialToCube(q0, r0);
        const cube1 = this.axialToCube(q1, r1);
        
        const N = Math.max(
            Math.abs(cube0.x - cube1.x),
            Math.abs(cube0.y - cube1.y),
            Math.abs(cube0.z - cube1.z)
        );
        
        for (let i = 0; i <= N; i++) {
            const t = i / N;
            
            // Interpolate cube coordinates
            const cubeX = Math.round(cube0.x + (cube1.x - cube0.x) * t);
            const cubeY = Math.round(cube0.y + (cube1.y - cube0.y) * t);
            const cubeZ = Math.round(cube0.z + (cube1.z - cube0.z) * t);
            
            // Convert back to axial
            const { q, r } = this.cubeToAxial({ x: cubeX, y: cubeY, z: cubeZ });
            
            points.push({ q, r });
        }
        
        // Remove duplicates
        return points.filter((point, index, self) => 
            index === self.findIndex(p => p.q === point.q && p.r === point.r)
        );
    }
    
    axialToCube(q, r) {
        return {
            x: q,
            z: r,
            y: -q - r
        };
    }
    
    cubeToAxial(cube) {
        return {
            q: cube.x,
            r: cube.z
        };
    }
    
    drawPreview() {
        if (!this.previewLine) return;
        
        // Clear preview layer (we'll redraw everything)
        import('../drawing/renderer.js').then(m => m.drawAll());
        
        // Draw preview on top
        drawCtx.save();
        
        const { scale, offsetX, offsetY } = getViewport();
        const start = hexelToScreen(this.previewLine.start.q, this.previewLine.start.r, scale, offsetX, offsetY);
        const end = hexelToScreen(this.previewLine.end.q, this.previewLine.end.r, scale, offsetX, offsetY);
        
        // Draw preview line
        drawCtx.strokeStyle = '#ffffff';
        drawCtx.lineWidth = 2 / scale;
        drawCtx.setLineDash([5 / scale, 5 / scale]);
        drawCtx.globalAlpha = 0.6;
        
        drawCtx.beginPath();
        drawCtx.moveTo(start.x, start.y);
        drawCtx.lineTo(end.x, end.y);
        drawCtx.stroke();
        
        // Draw start and end points
        drawCtx.fillStyle = '#ffaa66';
        drawCtx.globalAlpha = 0.8;
        drawCtx.setLineDash([]);
        
        drawCtx.beginPath();
        drawCtx.arc(start.x, start.y, 4 / scale, 0, Math.PI * 2);
        drawCtx.fill();
        
        drawCtx.beginPath();
        drawCtx.arc(end.x, end.y, 4 / scale, 0, Math.PI * 2);
        drawCtx.fill();
        
        drawCtx.restore();
    }
    
    cancelPreview() {
        this.startHexel = null;
        this.previewLine = null;
        this.isDrawing = false;
        
        // Clear preview
        import('../drawing/renderer.js').then(m => m.drawAll());
    }
}
