// WebGL Renderer for HEXEL Studio
export class WebGLRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (!this.gl) {
            console.warn('WebGL not available, falling back to 2D');
            return null;
        }
        
        this.initShaders();
        this.initBuffers();
        
        // Batch buffers
        this.pointBuffer = [];
        this.edgeBuffer = [];
        this.faceBuffer = [];
    }
    
    initShaders() {
        // Vertex shader for points
        const vsSource = `
            attribute vec2 aPosition;
            attribute vec3 aColor;
            attribute float aSize;
            
            uniform vec2 uResolution;
            uniform vec2 uOffset;
            uniform float uScale;
            
            varying vec3 vColor;
            
            void main() {
                vec2 screenPos = aPosition + uOffset;
                vec2 clipSpace = (screenPos / uResolution) * 2.0 - 1.0;
                clipSpace.y = -clipSpace.y; // Flip Y
                
                gl_Position = vec4(clipSpace, 0.0, 1.0);
                gl_PointSize = aSize * uScale;
                vColor = aColor;
            }
        `;
        
        // Fragment shader
        const fsSource = `
            precision mediump float;
            varying vec3 vColor;
            
            void main() {
                gl_FragColor = vec4(vColor, 1.0);
            }
        `;
        
        // Compile, link, etc.
        this.program = this.createProgram(vsSource, fsSource);
    }
    
    addPoints(points) {
        this.pointBuffer.push(...points);
        this.scheduleRender();
    }
    
    addEdges(edges) {
        this.edgeBuffer.push(...edges);
        this.scheduleRender();
    }
    
    scheduleRender() {
        if (this.renderPending) return;
        this.renderPending = true;
        requestAnimationFrame(() => this.render());
    }
    
    render() {
        this.renderPending = false;
        
        const gl = this.gl;
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        // Upload point buffer to GPU
        if (this.pointBuffer.length > 0) {
            // Convert to typed arrays
            const positions = new Float32Array(this.pointBuffer.flatMap(p => [p.position.x, p.position.y]));
            const colors = new Float32Array(this.pointBuffer.flatMap(p => {
                const c = this.hexToRgb(p.color);
                return [c.r, c.g, c.b];
            }));
            const sizes = new Float32Array(this.pointBuffer.map(p => p.size));
            
            // Update buffers
            gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
            
            // Draw
            gl.drawArrays(gl.POINTS, 0, this.pointBuffer.length);
        }
        
        // Clear buffers after draw
        this.pointBuffer = [];
        this.edgeBuffer = [];
        this.faceBuffer = [];
    }
    
    hexToRgb(hex) {
        const r = parseInt(hex.slice(1,3), 16) / 255;
        const g = parseInt(hex.slice(3,5), 16) / 255;
        const b = parseInt(hex.slice(5,7), 16) / 255;
        return { r, g, b };
    }
}
