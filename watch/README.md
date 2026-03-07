

---

🍥 Hexel Core: The Pixel-Bucket Module

A Combinatorial Heart for Graphical Editors

This document outlines the core logic blocks from the Hexel Watch, designed as reusable modules for integrating a real-time, combinatorial "pixel-bucket" into both raster and vector graphics editors.

1. Core Concept: The 7-Vertex Combinatorial Cell

The hexel is not just a shape; it's a state machine. Its logic is based on 7 vertices (0-6) forming 6 triangular faces (F0-F5). A 3-bit input selects a combinatorial pattern, which determines the active faces. This pattern can drive brush shape, distribution, or opacity in real-time.

2. Reusable Logic Excerpts

Module A: The State Machine & Pattern Generator

This is the "lighthouse" core. It maintains a clock, cycles through states, and provides the current combinatorial pattern.

```javascript
// hexel-core.js - The Combinatorial State Machine
export class HexelCore {
    constructor(updateIntervalMs = 1000) {
        this.clock = 0; // Current state (0-7)
        this.interval = updateIntervalMs;
        this.lastTick = Date.now();
        this.isRunning = true;
        this.listeners = [];

        // Combinatorial truth table for 3-bit input
        // Maps input (0-7) to an array of active face indices (0-5)
        this.patternTable = [
            [0],           // 000: Face 0 only
            [1],           // 001: Face 1 only
            [2],           // 010: Face 2 only
            [3],           // 011: Face 3 only
            [4],           // 100: Face 4 only
            [5],           // 101: Face 5 only
            [0,1,2,3,4,5], // 110: All faces (center burst)
            [0,2,4]        // 111: Alternating pattern (custom)
        ];
    }

    // Call this on every animation frame
    tick(now) {
        if (!this.isRunning) return;
        if (now - this.lastTick > this.interval) {
            this.clock = (this.clock + 1) % 8;
            this.lastTick = now;
            this.notifyListeners();
        }
    }

    // Get the current pattern for the brush
    getCurrentPattern() {
        return {
            state: this.clock,
            activeFaces: [...this.patternTable[this.clock]], // Return a copy
            timestamp: this.lastTick
        };
    }

    // Subscribe to state changes (e.g., for UI updates)
    subscribe(callback) {
        this.listeners.push(callback);
    }

    notifyListeners() {
        const pattern = this.getCurrentPattern();
        this.listeners.forEach(cb => cb(pattern));
    }

    // Control methods
    start() { this.isRunning = true; }
    pause() { this.isRunning = false; }
    setState(newState) { this.clock = newState % 8; this.notifyListeners(); }
}
```

Module B: Geometry & Vertex Masking

This module translates active faces into geometric data, crucial for both raster (pixel coverage) and vector (path generation) rendering. It provides a vertex mask—a 7-bit integer representing which of the 7 vertices are active.

```javascript
// hexel-geometry.js - Geometric Translator
export class HexelGeometry {
    constructor() {
        // Vertex coordinates (example for a vertical hexagon)
        this.vertices = [
            { id: 'O', x: 0, y: 0 },  // 0: Center
            { id: 'A', x: 0, y: 120 }, // 1: Bottom
            { id: 'B', x: 104, y: 60 }, // 2: Bottom-right
            { id: 'C', x: 104, y: -60 }, // 3: Top-right
            { id: 'D', x: 0, y: -120 }, // 4: Top
            { id: 'E', x: -104, y: -60 }, // 5: Top-left
            { id: 'F', x: -104, y: 60 }  // 6: Bottom-left
        ];

        // Each face is a triangle defined by three vertex indices
        this.faces = [
            { id: 'F0', v: [0, 1, 2] }, // O-A-B
            { id: 'F1', v: [0, 2, 3] }, // O-B-C
            { id: 'F2', v: [0, 3, 4] }, // O-C-D
            { id: 'F3', v: [0, 4, 5] }, // O-D-E
            { id: 'F4', v: [0, 5, 6] }, // O-E-F
            { id: 'F5', v: [0, 6, 1] }  // O-F-A
        ];
    }

    // Convert a list of active face indices to a 7-bit vertex mask
    activeFacesToVertexMask(activeFaces) {
        let mask = 0;
        activeFaces.forEach(faceIndex => {
            const face = this.faces[faceIndex];
            if (face) {
                face.v.forEach(vIdx => {
                    mask |= (1 << vIdx); // Set the bit for this vertex
                });
            }
        });
        return mask;
    }

    // Get the polygon path for active faces (for vector output)
    getActivePolygon(activeFaces) {
        // For simplicity, this returns a union of triangles.
        // A more advanced version would calculate the convex hull.
        const points = [];
        const vertexSet = new Set();
        activeFaces.forEach(faceIndex => {
            this.faces[faceIndex].v.forEach(vIdx => vertexSet.add(vIdx));
        });

        // Convert set of vertex indices to coordinates (order matters for a path)
        // This basic version just collects unique points.
        vertexSet.forEach(vIdx => points.push(this.vertices[vIdx]));

        // In a real implementation, you would sort these points to create a proper polygon.
        return points;
    }

    // Get a bitmap-like mask for raster operations (conceptual)
    getRasterMask(activeFaces, resolution = 32) {
        // This would return a 2D array (e.g., 32x32) where each cell's value
        // represents coverage by the active faces. Useful for custom brushes.
        // Implementation involves rasterizing the triangles.
        console.warn("Raster mask generation requires a rendering context.");
        return null;
    }
}
```

Module C: Brush Integration Adapter

This module acts as the bridge between the HexelCore and your editor's brush engine.

```javascript
// hexel-brush-adapter.js - Connector for Brush Engines
import { HexelCore } from './hexel-core.js';
import { HexelGeometry } from './hexel-geometry.js';

export class HexelBrushAdapter {
    constructor(updateIntervalMs = 1000) {
        this.core = new HexelCore(updateIntervalMs);
        this.geo = new HexelGeometry();
        this.currentBrushData = this.generateBrushData();
        
        // Update brush data whenever the core state changes
        this.core.subscribe(() => {
            this.currentBrushData = this.generateBrushData();
        });
    }

    generateBrushData() {
        const pattern = this.core.getCurrentPattern();
        const activeFaces = pattern.activeFaces;
        
        return {
            ...pattern,
            vertexMask: this.geo.activeFacesToVertexMask(activeFaces),
            // Add other useful derived data, like center intensity
            centerIntensity: activeFaces.length === 6 ? 1.0 : activeFaces.length / 6
        };
    }

    // Method to be called in the editor's render/animation loop
    update(now) {
        this.core.tick(now);
        return this.currentBrushData;
    }

    // --- API for Brush Engine ---
    
    // Get the current brush shape as a list of points (for vector stamps)
    getVectorStamp() {
        return this.geo.getActivePolygon(this.currentBrushData.activeFaces);
    }

    // Get the current brush influence as a vertex mask (for per-vertex effects)
    getVertexMask() {
        return this.currentBrushData.vertexMask;
    }

    // Get the current brush intensity (0-1) for the center or overall
    getIntensity() {
        return this.currentBrushData.centerIntensity;
    }

    // Direct access to the core for manual control
    getCore() {
        return this.core;
    }
}
```

3. Integration Example

How a minimal editor loop would use this adapter.

```javascript
// main-editor.js
import { HexelBrushAdapter } from './hexel-brush-adapter.js';

const brush = new HexelBrushAdapter(1000); // Updates every second

function editorAnimationFrame(now) {
    // 1. Update the brush state based on time
    const brushState = brush.update(now);
    
    // 2. Use the state in your rendering
    console.log(`Brush State: ${brushState.state}, Mask: 0x${brushState.vertexMask.toString(16)}`);
    
    // Example: Modify vertex positions based on mask
    if (brushState.vertexMask & 0b0000001) { // Check vertex 0 (center)
        // Apply effect to center vertex
    }
    
    // 3. Draw something with the vector stamp
    const stampPolygon = brush.getVectorStamp();
    // ... render polygon in your vector context
    
    requestAnimationFrame(editorAnimationFrame);
}

requestAnimationFrame(editorAnimationFrame);
```

4. Key Architectural Insights

· Separation of Concerns: The logic is split into State (HexelCore), Structure (HexelGeometry), and Integration (HexelBrushAdapter). This makes it easy to swap out geometry (e.g., for a different tiling pattern) or change the timing without affecting the brush logic.
· Data over Methods: The adapter produces a brushData object. Passing this simple object around is often more flexible than calling many getter methods, especially in performance-sensitive loops.
· Vertex Mask as a Universal Key: The 7-bit integer is a compact, fast, and unambiguous way to communicate a complex shape state between modules or even to a GPU (e.g., as a uniform in a shader).
· Extensibility: The patternTable in HexelCore is a simple array. For a serious editor, you could replace this with a more complex lookup system, or even allow artists to define their own pattern sequences.

This modular approach provides the "pixel-bucket" heart you're looking for, ready to be plugged into both existing and future graphical editors.
---

