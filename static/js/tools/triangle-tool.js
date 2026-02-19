import { screenToHexel } from '../core/hexel.js';
import { getViewport } from '../core/viewport.js';
import { addMessage } from '../ui/messages.js';
import { drawCtx } from '../core/canvas.js';
import { hexelToScreen } from '../core/hexel.js';
import { HEXEL_SIZE } from '../utils/constants.js';
import { triangles, addTriangle } from '../drawing/triangles.js';

export class TriangleTool {
    constructor() {
        this.selectedHexel = null;
        this.selectedTriangle = null;
        this.previewTriangle = null;
    }
    
    activate() {
        document.body.style.cursor = 'crosshair';
        document.body.dataset.tool = 'triangle';
    }
    
    deactivate() {
        document.body.style.cursor = 'default';
        document.body.dataset.tool = '';
        this.clearPreview();
    }
    
    onClick(x, y) {
        const { scale, offsetX, offsetY } = getViewport();
        const hexel = screenToHexel(x, y, scale, offsetX, offsetY);
        
        // Find which triangle was clicked
        const triangleIndex = this.getTriangleAtPoint(x, y, hexel, scale, offsetX, offsetY);
        
        if (triangleIndex !== -1) {
            this.selectedHexel = hexel;
            this.selectedTriangle = triangleIndex;
            
            // Add triangle to drawing
            const color = document.querySelector('.color-swatch.active')?.dataset.color || '#ffaa66';
            
            addTriangle({
                hexel: hexel,
                triangle: triangleIndex,
                color: color,
                points: this.getTrianglePoints(hexel, triangleIndex)
            });
            
            addMessage(`△ triangle ${triangleIndex} in hexel (${hexel.q}, ${hexel.r})`);
            
            // Redraw
            import('../drawing/renderer.js').then(m => m.drawAll());
        }
    }
    
    onMouseMove(x, y) {
        const { scale, offsetX, offsetY } = getViewport();
        const hexel = screenToHexel(x, y, scale, offsetX, offsetY);
        
        // Find which triangle is being hovered
        const triangleIndex = this.getTriangleAtPoint(x, y, hexel, scale, offsetX, offsetY);
        
        if (triangleIndex !== -1) {
            this.previewTriangle = {
                hexel: hexel,
                triangle: triangleIndex
            };
            this.drawPreview();
        } else {
            this.clearPreview();
        }
    }
    
    getTriangleAtPoint(x, y, hexel, scale, offsetX, offsetY) {
        const center = hexelToScreen(hexel.q, hexel.r, scale, offsetX, offsetY);
        
        // Convert screen point to hexel-local coordinates
        const localX = (x - center.x) / scale;
        const localY = (y - center.y) / scale;
        
        // Hexagon vertices (in local coordinates)
        const vertices = [];
        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3;
            vertices.push({
                x: HEXEL_SIZE * Math.cos(angle),
                y: HEXEL_SIZE * Math.sin(angle)
            });
        }
        
        // Check which triangle contains the point
        for (let i = 0; i < 6; i++) {
            const v1 = vertices[i];
            const v2 = vertices[(i + 1) % 6];
            
            if (this.pointInTriangle(localX, localY, {x: 0, y: 0}, v1, v2)) {
                return i;
            }
        }
        
        return -1;
    }
    
    pointInTriangle(px, py, a, b, c) {
        // Barycentric coordinate method
        const v0x = c.x - a.x;
        const v0y = c.y - a.y;
        const v1x = b.x - a.x;
        const v1y = b.y - a.y;
        const v2x = px - a.x;
        const v2y = py - a.y;
        
        const dot00 = v0x * v0x + v0y * v0y;
        const dot01 = v0x * v1x + v0y * v1y;
        const dot02 = v0x * v2x + v0y * v2y;
        const dot11 = v1x * v1x + v1y * v1y;
        const dot12 = v1x * v2x + v1y * v2y;
        
        const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
        const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
        const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
        
        return (u >= 0) && (v >= 0) && (u + v < 1);
    }
    
    getTrianglePoints(hexel, triangleIndex) {
        const points = [];
        const center = { x: hexel.q * H_STEP + (hexel.r % 2 !== 0 ? H_STEP/2 : 0), y: hexel.r * V_STEP };
        
        // Triangle vertices (0 = center, 1 = vertex i, 2 = vertex i+1)
        const angle1 = triangleIndex * Math.PI / 3;
        const angle2 = (triangleIndex + 1) * Math.PI / 3;
        
        points.push({ x: center.x, y: center.y }); // Center
        points.push({
            x: center.x + HEXEL_SIZE * Math.cos(angle1),
            y: center.y + HEXEL_SIZE * Math.sin(angle1)
        });
        points.push({
            x: center.x + HEXEL_SIZE * Math.cos(angle2),
            y: center.y + HEXEL_SIZE * Math.sin(angle2)
        });
        
        return points;
    }
    
    drawPreview() {
        if (!this.previewTriangle) return;
        
        this.clearPreview();
        
        drawCtx.save();
        
        const { scale, offsetX, offsetY } = getViewport();
        const center = hexelToScreen(
            this.previewTriangle.hexel.q, 
            this.previewTriangle.hexel.r, 
            scale, offsetX, offsetY
        );
        
        // Get triangle vertices
        const angle1 = this.previewTriangle.triangle * Math.PI / 3;
        const angle2 = (this.previewTriangle.triangle + 1) * Math.PI / 3;
        
        const v1 = {
            x: center.x + HEXEL_SIZE * scale * Math.cos(angle1),
            y: center.y + HEXEL_SIZE * scale * Math.sin(angle1)
        };
        const v2 = {
            x: center.x + HEXEL_SIZE * scale * Math.cos(angle2),
            y: center.y + HEXEL_SIZE * scale * Math.sin(angle2)
        };
        
        // Draw preview triangle
        drawCtx.fillStyle = '#ffffff';
        drawCtx.globalAlpha = 0.2;
        drawCtx.beginPath();
        drawCtx.moveTo(center.x, center.y);
        drawCtx.lineTo(v1.x, v1.y);
        drawCtx.lineTo(v2.x, v2.y);
        drawCtx.closePath();
        drawCtx.fill();
        
        drawCtx.strokeStyle = '#ffffff';
        drawCtx.lineWidth = 2 / scale;
        drawCtx.setLineDash([5 / scale, 5 / scale]);
        drawCtx.globalAlpha = 0.6;
        drawCtx.stroke();
        
        drawCtx.restore();
    }
    
    clearPreview() {
        this.previewTriangle = null;
        import('../drawing/renderer.js').then(m => m.drawAll());
    }
}
