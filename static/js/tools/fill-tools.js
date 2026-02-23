import { screenToHexel } from '../core/hexel.js';
import { getViewport } from '../core/viewport.js';
import { addMessage } from '../ui/messages.js';
import { getRenderer } from '../main.js';
import { addTriangle } from '../drawing/triangles.js';

export class FillTriangleTool {
    constructor() {
        this.mode = 'single'; // 'single' or 'hexel'
        this.previewTriangle = null;
    }
    
    activate() {
        document.body.style.cursor = 'crosshair';
        document.body.dataset.tool = 'fill-triangle';
        this.showProperties();
    }
    
    deactivate() {
        document.body.style.cursor = 'default';
        document.body.dataset.tool = '';
        this.clearPreview();
    }
    
    showProperties() {
        const propsDiv = document.getElementById('tool-properties');
        if (!propsDiv) return;
        
        propsDiv.innerHTML = `
            <div class="coord-display">
                <div class="section-title">FILL MODE</div>
                <div class="tool-actions">
                    <button class="tool-btn ${this.mode === 'single' ? 'active' : ''}" data-fill-mode="single">
                        <span class="tool-icon">△</span> Single Triangle
                    </button>
                    <button class="tool-btn ${this.mode === 'hexel' ? 'active' : ''}" data-fill-mode="hexel">
                        <span class="tool-icon">⬟</span> Full Hexel (6)
                    </button>
                </div>
            </div>
        `;
        
        propsDiv.querySelectorAll('[data-fill-mode]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.mode = e.target.dataset.fillMode;
                this.showProperties();
            });
        });
    }
    
    onClick(x, y) {
        const { scale, offsetX, offsetY } = getViewport();
        const hexel = screenToHexel(x, y, scale, offsetX, offsetY);
        
        const triangleIndex = this.getTriangleAtPoint(x, y, hexel, scale, offsetX, offsetY);
        
        if (triangleIndex !== -1) {
            const color = document.querySelector('.color-swatch.active')?.dataset.color || '#ffaa66';
            
            if (this.mode === 'single') {
                addTriangle({
                    hexel: hexel,
                    triangle: triangleIndex,
                    color: color,
                    mode: 'fill'
                });
                addMessage(`🎨 filled triangle ${triangleIndex} in hexel (${hexel.q}, ${hexel.r})`);
            } else {
                for (let i = 0; i < 6; i++) {
                    addTriangle({
                        hexel: hexel,
                        triangle: i,
                        color: color,
                        mode: 'fill'
                    });
                }
                addMessage(`⬟ filled hexel (${hexel.q}, ${hexel.r}) with 6 triangles`);
            }
            
            // Update renderer
            const renderer = getRenderer();
            if (renderer) {
                renderer.syncFromStorage();
                renderer.drawAll(scale, offsetX, offsetY);
            }
        }
    }
    
    onMouseMove(x, y) {
        const { scale, offsetX, offsetY } = getViewport();
        const hexel = screenToHexel(x, y, scale, offsetX, offsetY);
        
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
        const renderer = getRenderer();
        if (!renderer) return -1;
        
        // Get hexel center in screen coordinates
        const gl = renderer.gl;
        const centerX = gl.canvas.width / 2 + offsetX;
        const centerY = gl.canvas.height / 2 + offsetY;
        
        const scaledH = 48 * scale;
        const scaledV = 41.569 * scale;
        
        const screenX = centerX + (hexel.r % 2 !== 0 ? (hexel.q + 0.5) * scaledH : hexel.q * scaledH);
        const screenY = centerY + hexel.r * scaledV;
        
        // Convert to local coordinates
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
    
    drawPreview() {
        if (!this.previewTriangle) return;
        
        this.clearPreview();
        
        const renderer = getRenderer();
        if (!renderer) return;
        
        const color = document.querySelector('.color-swatch.active')?.dataset.color || '#ffaa66';
        
        renderer.setPreviewMode(true);
        
        if (this.mode === 'single') {
            // Preview single triangle
            renderer.addTriangle(this.previewTriangle.hexel, this.previewTriangle.triangle, color, true);
        } else {
            // Preview full hexel
            for (let i = 0; i < 6; i++) {
                renderer.addTriangle(this.previewTriangle.hexel, i, color, true);
            }
        }
        
        renderer.setPreviewMode(false);
        
        const { scale, offsetX, offsetY } = getViewport();
        renderer.drawAll(scale, offsetX, offsetY);
    }
    
    clearPreview() {
        const renderer = getRenderer();
        if (renderer) {
            renderer.clearPreview();
        }
        this.previewTriangle = null;
    }
}

export const FillHexelTool = FillTriangleTool;
