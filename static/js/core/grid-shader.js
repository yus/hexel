// WebGL Grid Shader - ULTIMATE HAIRLINE PERFECTION
export function initGridShader() {
    const canvas = document.getElementById('grid-gl-canvas');
    const gl = canvas.getContext('webgl');
    
    if (!gl) {
        console.warn('WebGL not supported, falling back to canvas');
        return null;
    }
    
    // Vertex Shader
    const vsSource = `
        attribute vec2 a_position;
        uniform vec2 u_resolution;
        uniform vec2 u_offset;
        uniform float u_scale;
        
        void main() {
            // Convert from pixel coordinates to clip space
            vec2 zeroToOne = (a_position - u_offset) / u_resolution;
            vec2 zeroToTwo = zeroToOne * 2.0;
            vec2 clipSpace = zeroToTwo - 1.0;
            
            gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        }
    `;
    
    // Fragment Shader - THIS IS WHERE THE MAGIC HAPPENS!
    const fsSource = `
        precision highp float;
        
        uniform vec2 u_resolution;
        uniform vec2 u_offset;
        uniform float u_scale;
        uniform float u_time;
        
        // Grid parameters
        const float H_STEP = 48.0;
        const float V_STEP = 41.569; // 24 * sqrt(3)
        const vec3 GRID_COLOR = vec3(0.784, 0.576, 0.824); // #c893d2
        
        // Anti-aliased grid line function
        float gridLine(float coord, float step, float width) {
            float gridPos = mod(coord + step/2.0, step) - step/2.0;
            float dist = abs(gridPos);
            
            // Smooth step for anti-aliasing
            return 1.0 - smoothstep(0.0, width, dist);
        }
        
        void main() {
            // Get position in grid space
            vec2 pos = gl_FragCoord.xy - u_offset;
            pos /= u_scale;
            
            // Your ZOOM CONFIGURATION implemented in GLSL!
            float horizAlpha = 0.15;
            float diagAlpha = 0.1;
            float lineWidth = 0.8;
            
            if (u_scale < 0.5) {
                // Very zoomed out
                horizAlpha = 0.15;
                diagAlpha = 0.1;
                lineWidth = 0.3;
            } else if (u_scale < 1.0) {
                // Zoomed out
                horizAlpha = 0.15;
                diagAlpha = 0.1;
                lineWidth = 0.4;
            } else {
                // Normal and zoomed in
                horizAlpha = 0.15;
                diagAlpha = 0.1;
                lineWidth = 0.5 / u_scale;
            }
            
            // Horizontal lines
            float horiz = gridLine(pos.y, V_STEP, lineWidth);
            
            // Diagonal lines (+60°)
            float rowOffset = mod(floor(pos.y / V_STEP), 2.0) * (H_STEP / 2.0);
            float tan60 = 1.732; // tan(60°)
            
            // Transform to diagonal coordinates
            float diagPos1 = pos.x - rowOffset - pos.y / tan60;
            float diagPos2 = pos.x - rowOffset + pos.y / tan60;
            
            float diag1 = gridLine(diagPos1, H_STEP, lineWidth);
            float diag2 = gridLine(diagPos2, H_STEP, lineWidth);
            
            // Combine lines with different alphas for horizontals vs diagonals
            float alpha = 0.0;
            
            if (horiz > 0.0) {
                alpha = horiz * horizAlpha;
            } else if (diag1 > 0.0 || diag2 > 0.0) {
                alpha = max(diag1, diag2) * diagAlpha;
            }
            
            // Grid vertices (optional, can be enabled/disabled)
            float vertexSize = 0.5;
            float vertexAlpha = 0.0;
            
            // Output final color
            gl_FragColor = vec4(GRID_COLOR, alpha);
        }
    `;
    
    // Compile shaders
    const vertexShader = compileShader(gl, vsSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, fsSource, gl.FRAGMENT_SHADER);
    
    // Create program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Shader link failed');
        return null;
    }
    
    // Set up geometry (full-screen quad)
    const positions = new Float32Array([
        -1, -1, 1, -1, -1, 1,
        -1, 1, 1, -1, 1, 1
    ]);
    
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    
    // Get attribute and uniform locations
    const positionLoc = gl.getAttribLocation(program, 'a_position');
    const resolutionLoc = gl.getUniformLocation(program, 'u_resolution');
    const offsetLoc = gl.getUniformLocation(program, 'u_offset');
    const scaleLoc = gl.getUniformLocation(program, 'u_scale');
    const timeLoc = gl.getUniformLocation(program, 'u_time');
    
    return {
        gl, program,
        positionLoc, resolutionLoc, offsetLoc, scaleLoc, timeLoc,
        positionBuffer
    };
}

function compileShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile failed:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    
    return shader;
}

export function drawGridGL(shader, scale, offsetX, offsetY) {
    const { gl, program, positionLoc, resolutionLoc, offsetLoc, scaleLoc, timeLoc, positionBuffer } = shader;
    
    // Set viewport
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    
    // Clear
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Use program
    gl.useProgram(program);
    
    // Set up attributes
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    
    // Set uniforms
    gl.uniform2f(resolutionLoc, gl.canvas.width, gl.canvas.height);
    gl.uniform2f(offsetLoc, offsetX, offsetY);
    gl.uniform1f(scaleLoc, scale);
    gl.uniform1f(timeLoc, performance.now() / 1000);
    
    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}
