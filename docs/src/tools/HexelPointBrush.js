// src/tools/HexelPointBrush.js
// 🍥 Single-click brush that activates vertices/edges/faces based on chip state

export class HexelPointBrush {
    constructor(mapper, compositeStore, chip) {
        this.mapper = mapper;
        this.store = compositeStore;  // CompositeStore with points, edges, faces
        this.chip = chip;              // HexelChip (lighthouse clock)
        this.active = false;
        this.threshold = 15;

        // Current chip pattern
        this.currentPattern = {
            state: 0,
            activeFaces: [0],
            vertexMask: 0b0000001
        };

        // Subscribe to chip updates
        this.chip.subscribe((pattern) => {
            this.currentPattern = pattern;
        });
        this.batch = [];
        this.batchSize = 100;
        this.batchTimeout = null;
    }

    add(q, r) {
        // Don't push immediately — batch for WebGL
        this.batch.push({ q, r, type: 'point', color: '#ff6b6b' });
        
        if (this.batch.length >= this.batchSize) {
            this.flushBatch();
        } else if (!this.batchTimeout) {
            // Flush after 16ms (next frame)
            this.batchTimeout = setTimeout(() => this.flushBatch(), 16);
        }
    }
    
    flushBatch() {
        if (this.batch.length === 0) return;
        
        // Convert batch to WebGL-friendly format
        const vertices = this.batch.map(p => ({
            position: this.mapper.vertexToScreen(p.q, p.r),
            color: p.color,
            size: 6
        }));
        
        // Send to WebGL renderer
        window.webglRenderer?.addPoints(vertices);
        
        // Also update stores for persistence
        this.batch.forEach(p => {
            this.store.points.add(p.q, p.r, { color: p.color });
        });
        
        this.batch = [];
        this.batchTimeout = null;
    }
}
    

    // Single click — place pattern at vertex
    onClick(screenX, screenY) {
        const vertex = this.mapper.screenToVertex(screenX, screenY, this.threshold);
        if (!vertex) return null;

        const elements = this.interpretPattern(vertex.q, vertex.r);

        // Add all elements to store
        elements.forEach(el => {
            switch(el.type) {
                case 'vertex':
                    this.store.points.add(el.q, el.r, el);
                    break;
                case 'edge':
                    this.store.edges.add(el.q1, el.r1, el.q2, el.r2, el);
                    break;
                case 'face':
                    this.store.faces.add(el.centerQ, el.centerR, el.faceIndex, el);
                    break;
            }
        });

        return { vertex, elements };
    }

    getNeighbors(q, r) {
        const dirs = [[1,0], [1,-1], [0,-1], [-1,0], [-1,1], [0,1]];
        return dirs.map(([dq, dr]) => ({ q: q + dq, r: r + dr }));
    }

    activate() { this.active = true; }
    deactivate() { this.active = false; }
}
