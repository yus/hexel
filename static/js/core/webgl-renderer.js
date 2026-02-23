import { getViewport } from '../core/viewport.js';
import { HEXEL_SIZE, 
        H_STEP, 
        V_STEP, 
        SQRT3, 
        GRID_COLOR, 
        DEFAULT_POINT_COLOR, 
        GRID_LINE_WIDTH, 
        POINT_SIZE } from '../utils/constants.js';

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
        this.previewPoints = [];
        this.previewLines = [];
        this.previewMode = false;
        
        // State
        this.gridEnabled = true;
        this.gridOpacity = 0.3;
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
      // Grid shader
      const gridVS = `
          attribute vec2 a_position;
          void main() {
              gl_Position = vec4(a_position, 0, 1);
          }
      `;
      
      const gridFS = `
          precision highp float;
          
          uniform vec2 u_resolution;
          uniform vec2 u_offset;
          uniform float u_scale;
          uniform float u_opacity;
          
          void main() {
              vec2 pos = (gl_FragCoord.xy - u_offset * u_resolution) / u_scale;
              
              // Three axes at 0°, 60°, and 120°
              float axis1 = pos.x;
              float axis2 = -0.5 * pos.x + 0.866 * pos.y;
              float axis3 = -0.5 * pos.x - 0.866 * pos.y;
              
              // Grid spacing
              float spacing = 12.0;
              
              // Distance to nearest grid line on each axis
              float d1 = abs(mod(axis1 + spacing/2.0, spacing) - spacing/2.0);
              float d2 = abs(mod(axis2 + spacing/2.0, spacing) - spacing/2.0);
              float d3 = abs(mod(axis3 + spacing/2.0, spacing) - spacing/2.0);
              
              float lineWidth = 1.5;
              float isLine = 0.0;
              
              if (d1 < lineWidth || d2 < lineWidth || d3 < lineWidth) {
                  isLine = 1.0;
              }
              
              gl_FragColor = vec4(0.784, 0.576, 0.824, isLine * u_opacity);
          }
      `;
      
      /*  
      const formatGLSLFloat = (num) => {
            return num.toString().includes('.') ? num.toString() : num.toString() + '.0';
        };
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
            uniform float u_opacity;
            
            const float H_STEP = ${formatGLSLFloat(H_STEP)};
            const float V_STEP = ${formatGLSLFloat(V_STEP)};
            const float SQRT3 = ${SQRT3};
            const vec3 GRID_COLOR = vec3(${parseInt(GRID_COLOR.slice(1,3),16)/255}, ${parseInt(GRID_COLOR.slice(3,5),16)/255}, ${parseInt(GRID_COLOR.slice(5,7),16)/255});
            
            float gridLine(float coord, float step, float width) {
                float gridPos = mod(coord + step/2.0, step) - step/2.0;
                float dist = abs(gridPos);
                return 1.0 - smoothstep(0.0, width, dist);
            }
            
            void main() {
                vec2 pos = (gl_FragCoord.xy - u_offset * u_resolution) / u_scale;
                
                float horiz = gridLine(pos.y, V_STEP, 1.5);
                float rowOffset = mod(floor(pos.y / V_STEP), 2.0) * (H_STEP / 2.0);
                
                float diagPos1 = pos.x - rowOffset - pos.y * 0.57735;
                float diagPos2 = pos.x - rowOffset + pos.y * 0.57735;
                
                float diag1 = gridLine(diagPos1, H_STEP, 1.5);
                float diag2 = gridLine(diagPos2, H_STEP, 1.5);
                
                float alpha = max(max(horiz, diag1), diag2) * u_opacity;
                gl_FragColor = vec4(GRID_COLOR, alpha);
            }
        `;
        */
        
        // Point shader
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
                // Apply pan and zoom in shader!
                vec2 worldPos = a_position * u_scale + u_offset;
                vec2 screenPos = worldPos / u_resolution * 2.0 - 1.0;
                
                gl_Position = vec4(screenPos * vec2(1, -1), 0, 1);
                gl_PointSize = a_size;
                
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
                
                float alpha = 1.0 - smoothstep(0.45, 0.5, dist);
                if (v_preview > 0.5) {
                    float dash = mod(gl_PointCoord.x * 10.0, 1.0);
                    if (dash < 0.5) discard;
                    alpha *= 0.8;
                }
                
                gl_FragColor = vec4(v_color, alpha);
            }
        `;
        
        this.programs.grid = this.createProgram(gridVS, gridFS);
        this.programs.point = this.createProgram(pointVS, pointFS);
    }
    
    createProgram(vsSource, fsSource) {
        const gl = this.gl;
        const vs = this.compileShader(gl.VERTEX_SHADER, vsSource);
        const fs = this.compileShader(gl.FRAGMENT_SHADER, fsSource);
        
        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
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
            -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1
        ]), gl.STATIC_DRAW);
        
        // Dynamic point buffer
        this.buffers.points = gl.createBuffer();
    }
    
    addPoint(q, r, color, size, preview = false) {
        // Convert hexel to world coordinates
        const x = q * H_STEP + (r % 2 !== 0 ? H_STEP/2 : 0);
        const y = r * V_STEP;
        
        console.log(`📍 Point at world (${x}, ${y})`); // DEBUG
        
        // Parse color
        const rColor = parseInt(color.slice(1,3), 16) / 255;
        const gColor = parseInt(color.slice(3,5), 16) / 255;
        const bColor = parseInt(color.slice(5,7), 16) / 255;
        
        // MAKE POINTS BIGGER! Size is in pixels at screen
        const point = { 
            x, y, 
            r: rColor, g: gColor, b: bColor, 
            size: preview ? 12 : 16, // Force big sizes for testing
            preview 
        };
        
        if (preview) {
            this.previewPoints.push(point);
        } else {
            this.points.push(point);
        }
        
        this.updatePointBuffer();
    }
    
    addLine(start, end, color, preview = false) {
        const startX = start.q * H_STEP + (start.r % 2 !== 0 ? H_STEP/2 : 0);
        const startY = start.r * V_STEP;
        const endX = end.q * H_STEP + (end.r % 2 !== 0 ? H_STEP/2 : 0);
        const endY = end.r * V_STEP;

        // Add points with size based on HEXEL_SIZE
        const pointSize = HEXEL_SIZE / 8;
        
        const r = parseInt(color.slice(1,3), 16) / 255;
        const g = parseInt(color.slice(3,5), 16) / 255;
        const b = parseInt(color.slice(5,7), 16) / 255;
        
        // Add 50 points along the line for smoothness
        for (let i = 0; i <= 50; i++) {
            const t = i / 50;
            const x = startX * (1-t) + endX * t;
            const y = startY * (1-t) + endY * t;
            
            const point = { x, y, r, g, b, size: 3, preview };
            
            if (preview) {
                this.previewPoints.push(point);
            } else {
                this.points.push(point);
            }
        }
        
        this.updatePointBuffer();
    }
    
    updatePointBuffer() {
        const gl = this.gl;
        const data = [];
        
        // Store points in WORLD coordinates (NO transform here!)
        const addPoints = (points) => {
            points.forEach(p => {
                data.push(
                    p.x, p.y,  // World coordinates!
                    p.r, p.g, p.b,
                    p.size,
                    p.preview ? 1 : 0
                );
            });
        };
        
        addPoints(this.points);
        addPoints(this.previewPoints);
        
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
        
        this.drawPoints();
    }
    
    drawGrid(scale, offsetX, offsetY) {
        const gl = this.gl;
        const program = this.programs.grid;
        
        gl.useProgram(program);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.quad);
        const posLoc = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
        
        gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), 
            gl.canvas.width, gl.canvas.height);
        gl.uniform2f(gl.getUniformLocation(program, 'u_offset'), offsetX/gl.canvas.width, offsetY/gl.canvas.height);
        gl.uniform1f(gl.getUniformLocation(program, 'u_scale'), scale);
        gl.uniform1f(gl.getUniformLocation(program, 'u_opacity'), this.gridOpacity);
        
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    
    drawPoints(scale, offsetX, offsetY) {
        const totalPoints = this.points.length + this.previewPoints.length;
        if (totalPoints === 0) return;

         console.log('🎯 Drawing points at scale:', scale, 'offset:', offsetX, offsetY);
        
        // Log first point's screen position
        if (this.points.length > 0) {
            const p = this.points[0];
            const screenX = p.x * scale + offsetX + this.gl.canvas.width/2;
            const screenY = p.y * scale + offsetY + this.gl.canvas.height/2;
            console.log('First point screen position:', screenX, screenY);
            console.log('Canvas size:', this.gl.canvas.width, this.gl.canvas.height);
        }
        
        const gl = this.gl;
        const program = this.programs.point;
        
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.points);
        
        const stride = 7 * 4;
        
        const posLoc = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, stride, 0);
        
        const colorLoc = gl.getAttribLocation(program, 'a_color');
        gl.enableVertexAttribArray(colorLoc);
        gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, stride, 8);
        
        const sizeLoc = gl.getAttribLocation(program, 'a_size');
        gl.enableVertexAttribArray(sizeLoc);
        gl.vertexAttribPointer(sizeLoc, 1, gl.FLOAT, false, stride, 20);
        
        const previewLoc = gl.getAttribLocation(program, 'a_preview');
        gl.enableVertexAttribArray(previewLoc);
        gl.vertexAttribPointer(previewLoc, 1, gl.FLOAT, false, stride, 24);
        
        gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), 
            gl.canvas.width, gl.canvas.height);
        
        gl.drawArrays(gl.POINTS, 0, totalPoints);
    }

    // In webgl-renderer.js, add:
    drawHexagonOutline(hexel, color, alpha, dashed) {
        console.log('Drawing hexagon outline:', hexel, color);
        // For now, just log - implement actual rendering later
    }
    
    drawHexagonCorners(hexel, color, alpha) {
        console.log('Drawing hexagon corners:', hexel, color);
    }

    setPreviewMode(enabled) {
        this.previewMode = enabled;
        // You can add visual feedback for preview mode later
        // For now, just store the state
    }
    
    clearPreview() {
        this.previewPoints = [];
        this.previewLines = [];
        this.updatePointBuffer();
        this.drawAll(this.currentScale, this.currentOffsetX, this.currentOffsetY);
    }
    
    clear() {
        this.points = [];
        this.lines = [];
        this.previewPoints = [];
        this.previewLines = [];
        this.updatePointBuffer();
        this.drawAll(this.currentScale, this.currentOffsetX, this.currentOffsetY);
    }
}
