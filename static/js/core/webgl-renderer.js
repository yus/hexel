// Unified WebGL renderer for grid AND points
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
        
        this.initShaders();
        this.initBuffers();
    }
    
    initShaders() {
        const gl = this.gl;
        
        // === POINT SHADER ===
        const pointVS = `
            attribute vec2 a_position;
            attribute vec3 a_color;
            attribute float a_size;
            
            uniform vec2 u_resolution;
            uniform vec2 u_offset;
            uniform float u_scale;
            
            varying vec3 v_color;
            
            void main() {
                vec2 worldPos = a_position * u_scale + u_offset;
                vec2 screenPos = worldPos / u_resolution * 2.0 - 1.0;
                
                gl_Position = vec4(screenPos * vec2(1, -1), 0, 1);
                gl_PointSize = a_size * u_scale;
                
                v_color = a_color;
            }
        `;
        
        const pointFS = `
            precision highp float;
            varying vec3 v_color;
            
            void main() {
                vec2 coord = gl_PointCoord - vec2(0.5);
                float dist = length(coord);
                
                if (dist > 0.5) discard;
                
                // Smooth circle
                float alpha = 1.0 - smoothstep(0.45, 0.5, dist);
                gl_FragColor = vec4(v_color, alpha * 0.9);
            }
        `;
        
        // === GRID SHADER (your existing one enhanced) ===
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

        // In webgl-renderer.js, find your grid fragment shader and temporarily replace with this:

        const gridFS = `
            precision highp float;
            
            uniform vec2 u_resolution;
            uniform vec2 u_offset;
            uniform float u_scale;
            uniform float u_time;
            uniform float u_debug; // Add this
            
            const float H_STEP = 48.0;
            const float V_STEP = 41.569;
            const vec3 GRID_COLOR = vec3(0.784, 0.576, 0.824);
            
            float gridLine(float coord, float step, float width) {
                float gridPos = mod(coord + step/2.0, step) - step/2.0;
                float dist = abs(gridPos);
                return 1.0 - smoothstep(0.0, width, dist);
            }
            
            void main() {
                vec2 pos = gl_FragCoord.xy - u_offset;
                pos /= u_scale;
                
                // DEBUG: Force visibility
                if (u_debug > 0.5) {
                    gl_FragColor = vec4(1.0, 0.0, 0.0, 0.5); // RED semi-transparent
                    return;
                }
                
                // Your zoom configuration
                float horizAlpha = 0.15;
                float diagAlpha = 0.1;
                float lineWidth = 0.8;
                
                if (u_scale < 0.5) {
                    horizAlpha = 0.15;
                    diagAlpha = 0.1;
                    lineWidth = 0.3;
                } else if (u_scale < 1.0) {
                    horizAlpha = 0.15;
                    diagAlpha = 0.1;
                    lineWidth = 0.4;
                } else {
                    horizAlpha = 0.15;
                    diagAlpha = 0.1;
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
                
                // DEBUG: Ensure minimum alpha
                alpha = max(alpha, 0.1);
                
                gl_FragColor = vec4(GRID_COLOR, alpha);
            }
        `;

        /*
        const gridFS = `
            precision highp float;
            
            uniform vec2 u_resolution;
            uniform vec2 u_offset;
            uniform float u_scale;
            uniform float u_time;
            
            const float H_STEP = 48.0;
            const float V_STEP = 41.569;
            const vec3 GRID_COLOR = vec3(0.784, 0.576, 0.824);
            
            float gridLine(float coord, float step, float width) {
                float gridPos = mod(coord + step/2.0, step) - step/2.0;
                float dist = abs(gridPos);
                return 1.0 - smoothstep(0.0, width, dist);
            }
            
            void main() {
                vec2 pos = gl_FragCoord.xy - u_offset;
                pos /= u_scale;
                
                // Your zoom configuration
                float horizAlpha = 0.15;
                float diagAlpha = 0.1;
                float lineWidth = 0.8;
                
                if (u_scale < 0.5) {
                    horizAlpha = 0.15;
                    diagAlpha = 0.1;
                    lineWidth = 0.3;
                } else if (u_scale < 1.0) {
                    horizAlpha = 0.15;
                    diagAlpha = 0.1;
                    lineWidth = 0.4;
                } else {
                    horizAlpha = 0.15;
                    diagAlpha = 0.1;
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
                
                gl_FragColor = vec4(GRID_COLOR, alpha);
            }
        `;
        */
        
        // Compile shaders
        this.programs.grid = this.createProgram(gridVS, gridFS);
        this.programs.point = this.createProgram(pointVS, pointFS);
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
        
        // Dynamic point buffer
        this.buffers.points = gl.createBuffer();
    }
    
    addPoint(q, r, color, size) {
        // Convert hexel to world coordinates
        const x = q * 48 + (r % 2 !== 0 ? 24 : 0);
        const y = r * 41.569;
        
        // Parse color
        const rColor = parseInt(color.slice(1,3), 16) / 255;
        const gColor = parseInt(color.slice(3,5), 16) / 255;
        const bColor = parseInt(color.slice(5,7), 16) / 255;
        
        this.points.push({
            x, y,
            r: rColor, g: gColor, b: bColor,
            size: size / 4 // Normalize size
        });
        
        this.updatePointBuffer();
    }
    
    updatePointBuffer() {
        const gl = this.gl;
        const data = [];
        
        this.points.forEach(p => {
            data.push(p.x, p.y, p.r, p.g, p.b, p.size);
        });
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.points);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_DRAW);
    }

    // Add to HexelRenderer class
    setPreviewMode(enabled) {
        this.previewMode = enabled;
        // Use different blending or shader for previews
    }
    
    clearPreview() {
        // Just redraw without preview elements
        this.drawAll(this.currentScale, this.currentOffsetX, this.currentOffsetY);
    }
    
    drawHexagonOutline(hexel, color, alpha, dashed = false) {
        // Convert hexel to screen coordinates and draw outline
        const { x, y } = this.hexelToWorld(hexel.q, hexel.r);
        
        // Use line shader with appropriate style
        this.drawPolygon(this.getHexagonVertices(x, y), color, alpha, dashed);
    }
    
    drawHexagonCorners(hexel, color, alpha) {
        const { x, y } = this.hexelToWorld(hexel.q, hexel.r);
        const size = HEXEL_SIZE;
        
        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3;
            const cx = x + size * Math.cos(angle);
            const cy = y + size * Math.sin(angle);
            
            this.drawPoint({ q: hexel.q, r: hexel.r }, color, 2, alpha);
        }
    }
    
    drawLine(start, end, color, alpha, dashed = false) {
        // Draw line between two hexels
        const startWorld = this.hexelToWorld(start.q, start.r);
        const endWorld = this.hexelToWorld(end.q, end.r);
        
        this.drawLineSegments([startWorld, endWorld], color, alpha, dashed);
    }
    
    drawPoint(hexel, color, size, alpha) {
        const world = this.hexelToWorld(hexel.q, hexel.r);
        // Add to point buffer with preview flag
        this.previewPoints.push({ ...world, color, size, alpha });
        this.updatePreviewBuffer();
    }
    
    syncFromStorage() {
        import('../drawing/points.js').then(({ points, lines, triangles, hexagons }) => {
            this.points = [...points];
            this.lines = [...lines];
            this.triangles = [...triangles];
            this.hexagons = [...hexagons];
            this.updatePointBuffer();
        });
    }
    
    drawAll(scale, offsetX, offsetY) {
        const gl = this.gl;
        
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        // Draw grid
        this.drawGrid(scale, offsetX, offsetY);
        
        // Draw points
        this.drawPoints(scale, offsetX, offsetY);
    }

    // In webgl-renderer.js, temporarily replace drawGrid with:
    drawGrid(scale, offsetX, offsetY) {
        const gl = this.gl;
        gl.clearColor(0.5, 0.2, 0.8, 1); // Purple
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
    
    /* drawGrid(scale, offsetX, offsetY) {
        const gl = this.gl;
        const program = this.programs.grid;
        
        gl.useProgram(program);
        
        // Set up attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.quad);
        const positionLoc = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
        
        // Set uniforms
        gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), 
            gl.canvas.width, gl.canvas.height);
        gl.uniform2f(gl.getUniformLocation(program, 'u_offset'), offsetX, offsetY);
        gl.uniform1f(gl.getUniformLocation(program, 'u_scale'), scale);
        gl.uniform1f(gl.getUniformLocation(program, 'u_time'), performance.now() / 1000);
        
        // Draw
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    } */
    
    drawPoints(scale, offsetX, offsetY) {
        if (this.points.length === 0) return;
        
        const gl = this.gl;
        const program = this.programs.point;
        
        gl.useProgram(program);
        
        // Set up attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.points);
        
        const stride = 6 * 4; // 6 floats * 4 bytes
        
        const positionLoc = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, stride, 0);
        
        const colorLoc = gl.getAttribLocation(program, 'a_color');
        gl.enableVertexAttribArray(colorLoc);
        gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, stride, 8);
        
        const sizeLoc = gl.getAttribLocation(program, 'a_size');
        gl.enableVertexAttribArray(sizeLoc);
        gl.vertexAttribPointer(sizeLoc, 1, gl.FLOAT, false, stride, 20);
        
        // Set uniforms
        gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), 
            gl.canvas.width, gl.canvas.height);
        gl.uniform2f(gl.getUniformLocation(program, 'u_offset'), offsetX, offsetY);
        gl.uniform1f(gl.getUniformLocation(program, 'u_scale'), scale);
        
        // Draw points
        gl.drawArrays(gl.POINTS, 0, this.points.length);
    }
    
    clear() {
        this.points = [];
        this.lines = [];
        this.triangles = [];
        this.hexagons = [];
        this.updatePointBuffer();
    }
}
