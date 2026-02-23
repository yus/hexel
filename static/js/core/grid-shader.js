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
        this.gridOpacity = 0.15;
        this.previewMode = false;
        this.currentScale = 1.0;
        this.currentOffsetX = 0;
        this.currentOffsetY = 0;
        
        this.initShaders();
        this.initBuffers();
        this.initBlending();
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
            uniform vec2 u_resolution;
            uniform vec2 u_offset;
            uniform float u_scale;
            
            void main() {
                vec2 worldPos = a_position * u_scale + u_offset;
                vec2 screenPos = worldPos / u_resolution * 2.0 - 1.0;
                gl_Position = vec4(screenPos * vec2(1, -1), 0, 1);
            }
        `;
        
        const gridFS = `
            precision highp float;
            
            uniform vec2 u_resolution;
            uniform vec2 u_offset;
            uniform float u_scale;
            uniform float u_time;
            uniform float u_opacity;
            uniform float u_debug;
            
            const float H_STEP = 48.0;
            const float V_STEP = 41.569;
            const vec3 GRID_COLOR = vec3(0.784, 0.576, 0.824);
            
            float gridLine(float coord, float step, float width) {
                float gridPos = mod(coord + step/2.0, step) - step/2.0;
                float dist = abs(gridPos);
                return 1.0 - smoothstep(0.0, width, dist);
            }
            
            void main() {
                // DEBUG: Force visibility if enabled
                if (u_debug > 0.5) {
                    gl_FragColor = vec4(1.0, 0.0, 0.0, 0.5);
                    return;
                }
                
                vec2 pos = gl_FragCoord.xy - u_offset;
                pos /= u_scale;
                
                // Your zoom configuration
                float horizAlpha = u_opacity;
                float diagAlpha = u_opacity * 0.7;
                float lineWidth = 0.8;
                
                if (u_scale < 0.5) {
                    lineWidth = 0.3;
                } else if (u_scale < 1.0) {
                    lineWidth = 0.4;
                } else {
                    lineWidth = 0.5 / u_scale;
                }
                
                // Horizontal lines
                float horiz = gridLine(pos.y, V_STEP, lineWidth);
                
                // Diagonal lines
                float rowOffset = mod(floor(pos.y / V_STEP), 2.0) * (H_STEP / 2.0);
                float tan60 = 1.732;
                
                float diagPos1 = pos.x - rowOffset - pos.y / tan60;
                float diagPos2 = pos.x - rowOffset + pos.y / tan60;
                
                float diag1 = gridLine(diagPos1, H_STEP, lineWidth);
                float diag2 = gridLine(diagPos2, H_STEP, lineWidth);
                
                float alpha = 0.0;
                if (horiz > 0.0) {
                    alpha = horiz * horizAlpha;
                } else if (diag1 > 0.0 || diag2 > 0.0) {
                    alpha = max(diag1, diag2) * diagAlpha;
                }
                
                // gl_FragColor = vec4(GRID_COLOR, alpha);
                gl_FragColor = vec4(1.0, 0.0, 0.0, 0.5); // Solid red, 50% alpha
            }
        `;
        
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
    
    setPreviewMode(enabled) {
        this.previewMode = enabled;
    }
    
    clearPreview() {
        this.previewPoints = [];
        this.previewLines = [];
        this.previewHexagons = [];
        this.drawAll(this.currentScale, this.currentOffsetX, this.currentOffsetY);
    }
    
    addPoint(q, r, color, size, preview = false) {
        // Convert hexel to world coordinates
        const x = q * 48 + (r % 2 !== 0 ? 24 : 0);
        const y = r * 41.569;
        
        // Parse color
        const rColor = parseInt(color.slice(1,3), 16) / 255;
        const gColor = parseInt(color.slice(3,5), 16) / 255;
        const bColor = parseInt(color.slice(5,7), 16) / 255;
        
        const point = { x, y, r: rColor, g: gColor, b: bColor, size: size / 4 };
        
        if (preview) {
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
        
        // Regular points
        this.points.forEach(p => {
            data.push(p.x, p.y, p.r, p.g, p.b, p.size, 0); // 0 = not preview
        });
        
        // Preview points
        this.previewPoints.forEach(p => {
            data.push(p.x, p.y, p.r, p.g, p.b, p.size, 1); // 1 = preview
        });
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.points);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_DRAW);
    }
    
    drawAll(scale, offsetX, offsetY) {
        this.currentScale = scale;
        this.currentOffsetX = offsetX;
        this.currentOffsetY = offsetY;
        
        const gl = this.gl;
        
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        if (this.gridEnabled) {
            this.drawGrid(scale, offsetX, offsetY);
        }
        
        this.drawPoints(scale, offsetX, offsetY);
        // Add drawLines, drawHexagons etc
    }
    
    drawGrid(scale, offsetX, offsetY) {
        console.log('📐 drawGrid CALLED - scale:', scale, 'opacity:', this.gridOpacity, 'enabled:', this.gridEnabled);

        // If you get here but no grid, add this test:
        const gl = this.gl;

        // TEST 1: Clear with red to prove WebGL works
        gl.clearColor(1, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        const program = this.programs.grid;
        
        gl.useProgram(program);
        
        // Quad attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.quad);
        const positionLoc = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
        
        // Uniforms
        gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), 
            gl.canvas.width, gl.canvas.height);
        gl.uniform2f(gl.getUniformLocation(program, 'u_offset'), offsetX, offsetY);
        gl.uniform1f(gl.getUniformLocation(program, 'u_scale'), scale);
        gl.uniform1f(gl.getUniformLocation(program, 'u_time'), performance.now() / 1000);
        gl.uniform1f(gl.getUniformLocation(program, 'u_opacity'), this.gridOpacity);
        gl.uniform1f(gl.getUniformLocation(program, 'u_debug'), 0.0);
        
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
    }

    // Add this method to your HexelRenderer class
    clear() {
        console.log('🧹 Clearing renderer data');
        
        // Clear all data arrays
        this.points = [];
        this.lines = [];
        this.triangles = [];
        this.hexagons = [];
        this.previewPoints = [];
        this.previewLines = [];
        this.previewHexagons = [];
        
        // Update buffers (with empty data)
        this.updatePointBuffer();
        this.updateHexagonBuffer();
        
        // Force a redraw
        this.drawAll(this.currentScale, this.currentOffsetX, this.currentOffsetY);
    }
}
