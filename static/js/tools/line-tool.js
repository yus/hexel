import { screenToHexel } from '../core/hexel.js';
import { getViewport } from '../core/viewport.js';
import { addMessage } from '../ui/messages.js';
import { getRenderer } from '../main.js';
import { addLine } from '../drawing/lines.js';

export class LineTool {
    constructor() {
        this.startHexel = null;
        this.endHexel = null;
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
        this.startHexel = screenToHexel(x, y, scale, offsetX, offsetY);
        this.isDrawing = true;
        
        addMessage(`📍 line start at (${this.startHexel.q}, ${this.startHexel.r})`, 'info', 2000);
    }
    
    onMouseMove(x, y) {
        if (!this.isDrawing || !this.startHexel) return;
        
        const { scale, offsetX, offsetY } = getViewport();
        this.endHexel = screenToHexel(x, y, scale, offsetX, offsetY);
        
        this.drawPreview();
    }
    
    onMouseUp(x, y) {
        if (!this.isDrawing || !this.startHexel) return;
        
        const { scale, offsetX, offsetY } = getViewport();
        this.endHexel = screenToHexel(x, y, scale, offsetX, offsetY);
        
        // Calculate line points
        const linePoints = this.calculateHexelLine(this.startHexel, this.endHexel);
        
        if (linePoints.length > 1) {
            const color = document.querySelector('.color-swatch.active')?.dataset.color || '#ffaa66';
            const size = parseInt(document.getElementById('size-slider')?.value || '8');
            
            addLine({
                points: linePoints,
                color: color,
                size: size,
                start: this.startHexel,
                end: this.endHexel
            });
            
            addMessage(`📏 line from (${this.startHexel.q},${this.startHexel.r}) to (${this.endHexel.q},${this.endHexel.r})`);
            
            // Update renderer
            const renderer = getRenderer();
            if (renderer) {
                renderer.syncFromStorage();
                renderer.drawAll(scale, offsetX, offsetY);
            }
        }
        
        this.cancelPreview();
    }
    
    drawPreview() {
        const renderer = getRenderer();
        if (!renderer || !this.startHexel || !this.endHexel) return;
        
        renderer.setPreviewMode(true);
        renderer.drawLine(this.startHexel, this.endHexel, '#ffffff', 0.6, true); // dashed
        renderer.drawPoint(this.startHexel, '#ffaa66', 4, 0.8);
        renderer.drawPoint(this.endHexel, '#ffaa66', 4, 0.8);
        renderer.setPreviewMode(false);
    }
    
    calculateHexelLine(start, end) {
        // Bresenham-like algorithm for hex grid
        const points = [];
        
        // Convert to cube coordinates
        const cube0 = this.axialToCube(start.q, start.r);
        const cube1 = this.axialToCube(end.q, end.r);
        
        const N = Math.max(
            Math.abs(cube0.x - cube1.x),
            Math.abs(cube0.y - cube1.y),
            Math.abs(cube0.z - cube1.z)
        );
        
        for (let i = 0; i <= N; i++) {
            const t = i / N;
            
            const cubeX = Math.round(cube0.x + (cube1.x - cube0.x) * t);
            const cubeY = Math.round(cube0.y + (cube1.y - cube0.y) * t);
            const cubeZ = Math.round(cube0.z + (cube1.z - cube0.z) * t);
            
            const { q, r } = this.cubeToAxial({ x: cubeX, y: cubeY, z: cubeZ });
            
            points.push({ q, r });
        }
        
        // Remove duplicates
        return points.filter((point, index, self) => 
            index === self.findIndex(p => p.q === point.q && p.r === point.r)
        );
    }
    
    axialToCube(q, r) {
        return { x: q, z: r, y: -q - r };
    }
    
    cubeToAxial(cube) {
        return { q: cube.x, r: cube.z };
    }
    
    cancelPreview() {
        const renderer = getRenderer();
        if (renderer) {
            renderer.clearPreview();
        }
        this.startHexel = null;
        this.endHexel = null;
        this.isDrawing = false;
    }
}
