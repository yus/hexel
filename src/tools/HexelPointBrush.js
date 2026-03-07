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
    }

    // Interpret chip pattern for a given grid point
    interpretPattern(centerQ, centerR) {
        const elements = [];
        const { activeFaces, vertexMask } = this.currentPattern;

        // 1. Add center vertex if mask includes bit 0
        if (vertexMask & 0b0000001) {
            elements.push({
                type: 'vertex',
                q: centerQ,
                r: centerR,
                color: '#ffaa66',
                size: 6
            });
        }

        // 2. Add faces and their edges based on activeFaces
        const neighbors = this.getNeighbors(centerQ, centerR);

        activeFaces.forEach(faceIndex => {
            // Add the face itself
            elements.push({
                type: 'face',
                centerQ, centerR,
                faceIndex,
                color: '#96ceb4',
                opacity: 0.3
            });

            // Add the two edges of this face
            const v1 = neighbors[faceIndex];
            const v2 = neighbors[(faceIndex + 1) % 6];

            // Edge from center to v1
            if (vertexMask & (1 << 1)) { // Check if vertex A should be connected
                elements.push({
                    type: 'edge',
                    q1: centerQ, r1: centerR,
                    q2: v1.q, r2: v1.r,
                    color: '#4ecdc4',
                    width: 2
                });
            }

            // Edge from v1 to v2 (perimeter edge)
            if (vertexMask & (1 << 2)) { // Check if perimeter should be drawn
                elements.push({
                    type: 'edge',
                    q1: v1.q, r1: v1.r,
                    q2: v2.q, r2: v2.r,
                    color: '#4ecdc4',
                    width: 2
                });
            }
        });

        return elements;
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
