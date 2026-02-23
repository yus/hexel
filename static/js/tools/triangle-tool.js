import { screenToHexel } from '../core/hexel.js';
import { getViewport } from '../core/viewport.js';
import { addMessage } from '../ui/messages.js';
import { getRenderer } from '../main.js';
import { addTriangle } from '../drawing/triangles.js';

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
    /*
    onClick(x, y) {
        const { scale, offsetX, offsetY } = getViewport();
        const hexel = screenToHexel(x, y, scale, offsetX, offsetY);
        
        const triangleIndex = this.getTriangleAtPoint(x, y, hexel, scale, offsetX, offsetY);
        
        if (triangleIndex !== -1) {
            const color = document.querySelector('.color-swatch.active')?.dataset.color || '#ffaa66';
            
            addTriangle({
                hexel: hexel,
                triangle: triangleIndex,
                color: color,
                points: this.getTrianglePoints(hexel, triangleIndex)
            });
            
            addMessage(`△ triangle ${triangleIndex} in hexel (${hexel.q}, ${hexel.r})`);
            
            const renderer = getRenderer();
            if (renderer) {
                renderer.syncFromStorage();
                renderer.drawAll(scale, offsetX, offsetY);
            }
        }
    } */

    onClick(x, y) {
        const { scale, offsetX, offsetY } = getViewport();
        const hexel = screenToHexel(x, y, scale, offsetX, offsetY);
        
        const triangleIndex = this.getTriangleAtPoint(x, y, hexel, scale, offsetX, offsetY);
        
        if (triangleIndex !== -1) {
            const color = document.querySelector('.color-swatch.active')?.dataset.color || '#ffaa66';
            
            // Log instead of trying to render
            console.log(`Triangle ${triangleIndex} at hexel (${hexel.q}, ${hexel.r})`);
            addMessage(`△ triangle ${triangleIndex} in hexel (${hexel.q}, ${hexel.r})`);
        }
    }
    
    onMouseMove(x, y) {
        const { scale, offsetX, offsetY } = getViewport();
        const hexel = screenToHexel(x, y, scale, offsetX, offsetY);
        
        const triangleIndex = this.getTriangleAtPoint(x, y, hexel, scale, offsetX, offsetY);
        
        // In onMouseMove (around line 62)
        if (triangleIndex !== -1) {
            this.previewTriangle = {
                hexel: hexel,
                triangle: triangleIndex
            };
            this.drawPreview();  // This calls the method above
        }
    }
    
    getTriangleAtPoint(x, y, hexel, scale, offsetX, offsetY) {
        const renderer = getRenderer();
        if (!renderer) return -1;
        
        const gl = renderer.gl;
        const centerX = gl.canvas.width / 2 + offsetX;
        const centerY = gl.canvas.height / 2 + offsetY;
        
        const scaledH = 48 * scale;
        const scaledV = 41.569 * scale;
        
        const screenX = centerX + (hexel.r % 2 !== 0 ? (hexel.q + 0.5) * scaledH : hexel.q * scaledH);
        const screenY = centerY + hexel.r * scaledV;
        
        const localX = (x - screenX) / scale;
        const localY = (y - screenY) / scale;
        
        const vertices = [];
        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3;
            vertices.push({
                x: 24 * Math.cos(angle),
                y: 24 * Math.sin(angle)
            });
        }
        
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
        const centerX = hexel.q * 48 + (hexel.r % 2 !== 0 ? 24 : 0);
        const centerY = hexel.r * 41.569;
        
        const angle1 = triangleIndex * Math.PI / 3;
        const angle2 = (triangleIndex + 1) * Math.PI / 3;
        
        points.push({ x: centerX, y: centerY });
        points.push({
            x: centerX + 24 * Math.cos(angle1),
            y: centerY + 24 * Math.sin(angle1)
        });
        points.push({
            x: centerX + 24 * Math.cos(angle2),
            y: centerY + 24 * Math.sin(angle2)
        });
        
        return points;
    }
    
    drawPreview() {
        // CRITICAL: Capture preview triangle in a local variable
        const preview = this.previewTriangle;
        
        // Check if it exists and has the required properties
        if (!preview || !preview.hexel) {
            console.log('No valid preview triangle');
            return;
        }

        // For now, just log that we would draw a preview
        console.log('Preview triangle at:', preview.hexel, 'index:', preview.triangle);

        /*
        // Clear any old preview first
        this.clearPreview();
        
        const renderer = getRenderer();
        if (!renderer) return;
        
        const color = document.querySelector('.color-swatch.active')?.dataset.color || '#ffaa66';
        
        // Use the LOCAL preview variable, not this.previewTriangle
        renderer.setPreviewMode(true);
        renderer.addTriangle(
            preview.hexel,
            preview.triangle, 
            color, 
            true
        );
        renderer.setPreviewMode(false);
        
        const { scale, offsetX, offsetY } = getViewport();
        renderer.drawAll(scale, offsetX, offsetY);
        */
    }
    
    clearPreview() {
        const renderer = getRenderer();
        if (renderer) {
            renderer.clearPreview();
        }
        this.previewTriangle = null;
    }
}
