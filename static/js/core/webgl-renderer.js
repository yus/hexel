// Add these constants at the very top of the file, before the HexelRenderer class
const HEXEL_SIZE = 24;
const H_STEP = HEXEL_SIZE * 2;        // 48
const V_STEP = HEXEL_SIZE * 1.7320508; // ~41.569 (sqrt(3) * size)

// Or import them if they exist in constants.js:
// import { H_STEP, V_STEP, HEXEL_SIZE } from '../utils/constants.js';

// WebGL Renderer - Unified GPU rendering for grid AND elements
export class HexelRenderer {
    constructor(gl) {
        this.gl = gl;
        this.programs = {};
        this.buffers = {};
        
        // Data storage
        this.points = [];
        this.lines = [];
        this.triangles = [];
        this.hexagons = [];
        
        // Preview data (cleared each frame)
        this.previewPoints = [];
        this.previewLines = [];
        this.previewHexagons = [];
        
        // State
        this.gridEnabled = true;
        this.gridOpacity = 0.5;        
        this.previewMode = false;
        this.currentScale = 1.0;
        this.currentOffsetX = 0;
        this.currentOffsetY = 0;
        
        this.initShaders();
        this.initBuffers();
        this.initBlending();

        // Force an initial draw
        setTimeout(() => {
            this.drawAll(1.0, 0, 0);
        }, 10);

        // TEST: Add a point at origin
        this.addPoint(0, 0, '#ffaa66', 8);
    }
    
    initBlending() {
        const gl = this.gl;
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }
    
    initShaders() {
        const gl = this.gl;
        
        // === GRID SHADER (your existing one with debug) ===
        const gridVS = `
            attribute vec2 a_position;
            
            void main() {
                // Just pass through - a_position is already in clip space
                gl_Position = vec4(a_position, 0, 1);
            }
        `;
        
        const gridFS = `
            precision highp float;
            
            uniform vec2 u_resolution;
            uniform vec2 u_offset;
            uniform float u_scale;
            uniform float u_opacity;
            uniform float u_mode; // 0 = both, 1 = horizontal only, 2 = vertical only
            
            const float SIZE = 24.0;
            const float SQRT3 = 1.73205080757;
            
            void main() {
                // Apply pan and zoom
                vec2 pos = (gl_FragCoord.xy - u_offset * u_resolution) / u_scale;
                
                // Barycentric coordinates for triangle grid
                float u = pos.x;
                float v = -0.5 * pos.x + SQRT3/2.0 * pos.y;
                float w = -0.5 * pos.x - SQRT3/2.0 * pos.y;
                
                // Scale to grid size
                u = u / SIZE;
                v = v / SIZE;
                w = w / SIZE;
                
                // Distance to nearest grid line on each axis
                float du = abs(u - floor(u + 0.5));
                float dv = abs(v - floor(v + 0.5));
                float dw = abs(w - floor(w + 0.5));
                
                // Line width adapts to zoom
                float lineWidth = 0.03 / u_scale;
                lineWidth = clamp(lineWidth, 0.02, 0.2);
                
                // Determine which lines to draw based on mode
                float grid = 0.0;
                
                if (u_mode == 0.0) { // Both
                    if (du < lineWidth || dv < lineWidth || dw < lineWidth) {
                        grid = 1.0;
                    }
                } else if (u_mode == 1.0) { // Horizontal only (u axis)
                    if (du < lineWidth) {
                        grid = 1.0;
                    }
                } else if (u_mode == 2.0) { // Vertical only (v and w axes)
                    if (dv < lineWidth || dw < lineWidth) {
                        grid = 1.0;
                    }
                }
                
                gl_FragColor = vec4(0.784, 0.576, 0.824, grid * u_opacity);
            }
        `;

        /* const gridFS = `
            precision highp float;
            
            uniform vec2 u_resolution;
            uniform float u_opacity;
            
            void main() {
                vec2 pos = gl_FragCoord.xy;
                
                // Simple 50px grid
                float xLine = mod(pos.x, 50.0);
                float yLine = mod(pos.y, 50.0);
                
                float isLine = 0.0;
                if (xLine < 1.0 || yLine < 1.0) {
                    isLine = 1.0;
                }
                
                gl_FragColor = vec4(0.784, 0.576, 0.824, isLine * u_opacity);
            }
        `; */
        
        // === POINT SHADER ===
        const pointVS = `
            attribute vec2 a_position;
            attribute vec3 a_color;
            attribute float a_size;
            attribute float a_preview;
            
            uniform vec2 u_resolution;
            uniform vec2 u_offset;
            uniform float u_scale;
            
            varying vec3 v_color;
            varying float v_preview;
            
            void main() {
                vec2 worldPos = a_position * u_scale + u_offset;
                vec2 screenPos = worldPos / u_resolution * 2.0 - 1.0;
                
                gl_Position = vec4(screenPos * vec2(1, -1), 0, 1);
                gl_PointSize = a_size * u_scale * (a_preview > 0.5 ? 1.0 : 1.0);
                
                v_color = a_color;
                v_preview = a_preview;
            }
        `;
        
        const pointFS = `
            precision highp float;
            varying vec3 v_color;
            varying float v_preview;
            
            void main() {
                vec2 coord = gl_PointCoord - vec2(0.5);
                float dist = length(coord);
                
                if (dist > 0.5) discard;
                
                // Smooth circle
                float alpha = 1.0 - smoothstep(0.45, 0.5, dist);
                
                // Preview points are dashed
                if (v_preview > 0.5) {
                    // Create dash pattern
                    float dash = mod(gl_PointCoord.x * 10.0, 1.0);
                    if (dash < 0.5) discard;
                    alpha *= 0.8;
                }
                
                gl_FragColor = vec4(v_color, alpha * 0.9);
            }
        `;
        
        // === LINE SHADER ===
        const lineVS = `
            attribute vec2 a_position;
            attribute vec3 a_color;
            attribute float a_preview;
            
            uniform vec2 u_resolution;
            uniform vec2 u_offset;
            uniform float u_scale;
            uniform mat3 u_transform;
            
            varying vec3 v_color;
            varying float v_preview;
            
            void main() {
                vec2 worldPos = a_position * u_scale + u_offset;
                vec2 screenPos = worldPos / u_resolution * 2.0 - 1.0;
                gl_Position = vec4(screenPos * vec2(1, -1), 0, 1);
                
                v_color = a_color;
                v_preview = a_preview;
            }
        `;
        
        const lineFS = `
            precision highp float;
            varying vec3 v_color;
            varying float v_preview;
            
            void main() {
                float alpha = 1.0;
                
                // Preview lines are dashed
                if (v_preview > 0.5) {
                    float dash = mod(gl_FragCoord.x * 0.1, 1.0);
                    if (dash < 0.5) discard;
                    alpha = 0.6;
                }
                
                gl_FragColor = vec4(v_color, alpha);
            }
        `;
        
        this.programs.grid = this.createProgram(gridVS, gridFS);
        this.programs.point = this.createProgram(pointVS, pointFS);
        this.programs.line = this.createProgram(lineVS, lineFS);
    }
    
    createProgram(vsSource, fsSource) {
        const gl = this.gl;
        
        const vertexShader = this.compileShader(gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fsSource);
        
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        return program;
    }
    
    compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile failed:', gl.getShaderInfoLog(shader));
            return null;
        }
        
        return shader;
    }
    
    initBuffers() {
        const gl = this.gl;
        
        // Full-screen quad for grid
        this.buffers.quad = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.quad);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1, 1, -1, -1, 1,
            -1, 1, 1, -1, 1, 1
        ]), gl.STATIC_DRAW);
        
        // Dynamic buffers for points and lines
        this.buffers.points = gl.createBuffer();
        this.buffers.lines = gl.createBuffer();
        this.buffers.preview = gl.createBuffer();
    }

    // Add this method to your HexelRenderer class
    updateHexagonBuffer() {
        // If you don't have hexagon support yet, just create an empty method
        console.log('🔄 Updating hexagon buffer');
        
        const gl = this.gl;
        if (!gl) return;
        
        // If you have hexagon data, update the buffer here
        // For now, just ensure the buffer exists
        if (!this.buffers.hexagons) {
            this.buffers.hexagons = gl.createBuffer();
        }
        
        // You can implement actual hexagon rendering later
        this.hexagonVertexCount = 0;
    }
    
    setPreviewMode(enabled) {
        this.previewMode = enabled;
    }
    
    clearPreview() {
        this.previewPoints = [];
        this.previewLines = [];
        this.previewHexagons = [];
        this.drawAll(this.currentScale, this.currentOffsetX, this.currentOffsetY);
    }
    /*
    addPoint(q, r, color, size, preview = false) {
        // Convert hexel to world coordinates
        const x = q * 48 + (r % 2 !== 0 ? 24 : 0);
        const y = r * 41.569;
        
        // Parse color
        const rColor = parseInt(color.slice(1,3), 16) / 255;
        const gColor = parseInt(color.slice(3,5), 16) / 255;
        const bColor = parseInt(color.slice(5,7), 16) / 255;
        
        const point = { x, y, r: rColor, g: gColor, b: bColor, size: size / 4 };
        
        
        if (preview || this.previewMode) {
            this.previewPoints.push(point);
        } else {
            this.points.push(point);
        }    
        this.updatePointBuffer(); // <-- THIS IS CRITICAL!
    }
    */
    addPoint(q, r, color, size, preview = false) {
        // Convert hexel to world coordinates using H_STEP and V_STEP
        const x = q * H_STEP + (r % 2 !== 0 ? H_STEP/2 : 0);
        const y = r * V_STEP;
        
        // Parse color (assuming hex format like "#ffaa66")
        const rColor = parseInt(color.slice(1,3), 16) / 255;
        const gColor = parseInt(color.slice(3,5), 16) / 255;
        const bColor = parseInt(color.slice(5,7), 16) / 255;
        
        const point = { x, y, r: rColor, g: gColor, b: bColor, size: size / 4 };
        
        if (preview || this.previewMode) {
            this.previewPoints.push(point);
        } else {
            this.points.push(point);
        }
        
        this.updatePointBuffer();
    }
    
    addLine(start, end, color, preview = false) {
        // Implementation for lines
        const target = preview ? this.previewLines : this.lines;
        target.push({ start, end, color });
        this.updateLineBuffer();
    }
    
    addHexagon(q, r, color, preview = false) {
        const target = preview ? this.previewHexagons : this.hexagons;
        target.push({ q, r, color });
        this.updateHexagonBuffer();
    }
    
    updatePointBuffer() {
        const gl = this.gl;
        const data = [];
        
        // Regular points (preview flag = 0)
        this.points.forEach(p => {
            data.push(p.x, p.y, p.r, p.g, p.b, p.size, 0);
        });
        
        // Preview points (preview flag = 1)
        this.previewPoints.forEach(p => {
            data.push(p.x, p.y, p.r, p.g, p.b, p.size, 1);
        });
        
        if (data.length === 0) {
            this.pointCount = 0;
            return;
        }
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.points);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_DRAW);
        
        // THIS LINE WAS MISSING!
        this.pointCount = this.points.length + this.previewPoints.length;
        
        console.log('Point buffer updated, count:', this.pointCount);
    }
    
    drawAll(scale, offsetX, offsetY) {
        console.log('drawAll called');
        this.currentScale = scale;
        this.currentOffsetX = offsetX;
        this.currentOffsetY = offsetY;
        
        const gl = this.gl;
        
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        if (this.gridEnabled) {
            this.drawGrid(scale, offsetX, offsetY);
        }
        
        this.drawPoints(scale, offsetX, offsetY);
        // Add drawLines, drawHexagons etc
    }
    
    drawGrid(scale, offsetX, offsetY) {
        const gl = this.gl;
        const program = this.programs.grid;
        
        gl.useProgram(program);
        
        // Quad attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.quad);
        const positionLoc = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
        
        // Convert offset to WebGL space (critical for panning!)
        const webglOffsetX = offsetX / gl.canvas.width;
        const webglOffsetY = offsetY / gl.canvas.height;
        
        // Set all uniforms
        gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), 
            gl.canvas.width, gl.canvas.height);
        gl.uniform2f(gl.getUniformLocation(program, 'u_offset'), webglOffsetX, webglOffsetY);
        gl.uniform1f(gl.getUniformLocation(program, 'u_scale'), scale);
        gl.uniform1f(gl.getUniformLocation(program, 'u_opacity'), this.gridOpacity);
        gl.uniform1f(gl.getUniformLocation(program, 'u_mode'), this.gridMode || 0.0);
        
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    
    drawPoints(scale, offsetX, offsetY) {
        if (this.points.length === 0 && this.previewPoints.length === 0) return;
        
        const gl = this.gl;
        const program = this.programs.point;
        
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.points);
        
        const stride = 7 * 4; // 7 floats * 4 bytes
        
        const positionLoc = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, stride, 0);
        
        const colorLoc = gl.getAttribLocation(program, 'a_color');
        gl.enableVertexAttribArray(colorLoc);
        gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, stride, 8);
        
        const sizeLoc = gl.getAttribLocation(program, 'a_size');
        gl.enableVertexAttribArray(sizeLoc);
        gl.vertexAttribPointer(sizeLoc, 1, gl.FLOAT, false, stride, 20);
        
        const previewLoc = gl.getAttribLocation(program, 'a_preview');
        gl.enableVertexAttribArray(previewLoc);
        gl.vertexAttribPointer(previewLoc, 1, gl.FLOAT, false, stride, 24);
        
        // Uniforms
        gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), 
            gl.canvas.width, gl.canvas.height);
        gl.uniform2f(gl.getUniformLocation(program, 'u_offset'), offsetX, offsetY);
        gl.uniform1f(gl.getUniformLocation(program, 'u_scale'), scale);
        
        gl.drawArrays(gl.POINTS, 0, this.points.length + this.previewPoints.length);
        
        console.log('Drawing points, count:', this.points.length + this.previewPoints.length);
    
        if (this.points.length === 0 && this.previewPoints.length === 0) {
            console.log('No points to draw');
            return;
        }
    }

    // Add this method to your HexelRenderer class
    clear() {
        console.log('🧹 Clearing renderer data');
        
        this.points = [];
        this.lines = [];
        this.triangles = [];
        this.hexagons = [];
        this.previewPoints = [];
        this.previewLines = [];
        this.previewHexagons = [];
        
        // Check if methods exist before calling
        if (this.updatePointBuffer) this.updatePointBuffer();
        if (this.updateHexagonBuffer) this.updateHexagonBuffer(); // Now safe
        
        // Force a redraw
        this.drawAll(this.currentScale, this.currentOffsetX, this.currentOffsetY);
    }
}
