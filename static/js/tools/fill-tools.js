import { screenToHexel } from '../core/hexel.js';
import { getViewport } from '../core/viewport.js';
import { addMessage } from '../ui/messages.js';
import { drawCtx } from '../core/canvas.js';
import { hexelToScreen } from '../core/hexel.js';
import { HEXEL_SIZE, H_STEP, V_STEP } from '../utils/constants.js';
import { triangles, addTriangle, addHexelFill } from '../drawing/triangles.js';

export class FillTriangleTool {
    constructor() {
        this.mode = 'single'; // 'single' or 'hexel'
        this.previewTriangle = null;
        this.brushSize = 1; // For future multi-brush
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
            <div class="coord-display">
                <div class="section-title">BRUSH SIZE</div>
                <input type="range" id="fill-size" class="size-slider" min="1" max="5" value="1">
                <div class="size-labels">
                    <span>1x1</span>
                    <span>5x5</span>
                </div>
            </div>
        `;
        
        // Add event listeners
        propsDiv.querySelectorAll('[data-fill-mode]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.mode = e.target.dataset.fillMode;
                this.showProperties(); // Refresh
            });
        });
    }
    
    onClick(x, y) {
        const { scale, offsetX, offsetY } = getViewport();
        const hexel = screenToHexel(x, y, scale, offsetX, offsetY);
        
        // Find which triangle was clicked
        const triangleIndex = this.getTriangleAtPoint(x, y, hexel, scale, offsetX, offsetY);
        
        if (triangleIndex !== -1) {
            const color = document.querySelector('.color-swatch.active')?.dataset.color || '#ffaa66';
            const size = parseInt(document.getElementById('fill-size')?.value || '1');
            
            if (this.mode === 'single') {
                // Fill single triangle
                addTriangle({
                    hexel: hexel,
                    triangle: triangleIndex,
                    color: color,
                    mode: 'fill'
                });
                addMessage(`🎨 filled triangle ${triangleIndex} in hexel (${hexel.q}, ${hexel.r})`);
            } else {
                // Fill all 6 triangles in hexel
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
        
        // Hexagon vertices
        const vertices = [];
        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3;
            vertices.push({
                x: HEXEL_SIZE * Math.cos(angle),
                y: HEXEL_SIZE * Math.sin(angle)
            });
        }
        
        // Check each triangle
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
        
        drawCtx.save();
        
        const { scale, offsetX, offsetY } = getViewport();
        const center = hexelToScreen(
            this.previewTriangle.hexel.q, 
            this.previewTriangle.hexel.r, 
            scale, offsetX, offsetY
        );
        
        if (this.mode === 'single') {
            // Preview single triangle
            this.drawTrianglePreview(center, this.previewTriangle.triangle, scale);
        } else {
            // Preview full hexel
            for (let i = 0; i < 6; i++) {
                this.drawTrianglePreview(center, i, scale, 0.1); // Lower alpha for unselected
            }
            // Highlight the hovered triangle
            this.drawTrianglePreview(center, this.previewTriangle.triangle, scale, 0.3);
        }
        
        drawCtx.restore();
    }
    
    drawTrianglePreview(center, triangleIndex, scale, alpha = 0.2) {
        const angle1 = triangleIndex * Math.PI / 3;
        const angle2 = (triangleIndex + 1) * Math.PI / 3;
        
        const v1 = {
            x: center.x + HEXEL_SIZE * scale * Math.cos(angle1),
            y: center.y + HEXEL_SIZE * scale * Math.sin(angle1)
        };
        const v2 = {
            x: center.x + HEXEL_SIZE * scale * Math.cos(angle2),
            y: center.y + HEXEL_SIZE * scale * Math.sin(angle2)
        };
        
        // Get current color
        const color = document.querySelector('.color-swatch.active')?.dataset.color || '#ffaa66';
        
        // Draw preview triangle
        drawCtx.fillStyle = color;
        drawCtx.globalAlpha = alpha;
        drawCtx.beginPath();
        drawCtx.moveTo(center.x, center.y);
        drawCtx.lineTo(v1.x, v1.y);
        drawCtx.lineTo(v2.x, v2.y);
        drawCtx.closePath();
        drawCtx.fill();
        
        drawCtx.strokeStyle = '#ffffff';
        drawCtx.lineWidth = 1.5 / scale;
        drawCtx.globalAlpha = alpha * 2;
        drawCtx.stroke();
    }
    
    clearPreview() {
        this.previewTriangle = null;
        import('../drawing/renderer.js').then(m => m.drawAll());
    }
}

// Export both tools
export const FillHexelTool = FillTriangleTool; // Reuse with mode='hexel' default
