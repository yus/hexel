// src/tools/HexelShapeBrush.js
// 🌀 Drag-based brush that builds shapes from chip patterns

export class HexelShapeBrush {
    constructor(mapper, compositeStore, chip) {
        this.mapper = mapper;
        this.store = compositeStore;
        this.chip = chip;
        this.active = false;
        this.threshold = 15;

        // Drawing state
        this.drawing = false;
        this.startVertex = null;
        this.verticesInShape = new Set(); // Track vertices in current shape

        this.currentPattern = { state: 0, activeFaces: [0], vertexMask: 0b0000001 };
        this.chip.subscribe((p) => { this.currentPattern = p; });
    }

    // Calculate which vertices are in a shape between start and end
    calculateShapeVertices(start, end) {
        const vertices = new Set();

        // Get all vertices in the rectangular region (simplified)
        // In reality, you'd use a proper hexagon shape algorithm
        const qMin = Math.min(start.q, end.q);
        const qMax = Math.max(start.q, end.q);
        const rMin = Math.min(start.r, end.r);
        const rMax = Math.max(start.r, end.r);

        for (let q = qMin; q <= qMax; q++) {
            for (let r = rMin; r <= rMax; r++) {
                // Check if point is roughly in hexagon shape
                const dq = Math.abs(q - (start.q + end.q)/2);
                const dr = Math.abs(r - (start.r + end.r)/2);
                if (dq + dr <= Math.max(qMax - qMin, rMax - rMin)) {
                    vertices.add(`${q},${r}`);
                }
            }
        }

        return vertices;
    }

    // Apply chip pattern to all vertices in shape
    applyPatternToShape(vertices) {
        vertices.forEach(vertexKey => {
            const [q, r] = vertexKey.split(',').map(Number);
            const elements = this.interpretPatternForVertex(q, r);

            elements.forEach(el => {
                switch(el.type) {
                    case 'vertex':
                        this.store.points.add(q, r, el);
                        break;
                    case 'edge':
                        this.store.edges.add(el.q1, el.r1, el.q2, el.r2, el);
                        break;
                    case 'face':
                        this.store.faces.add(q, r, el.faceIndex, el);
                        break;
                }
            });
        });
    }

    // Similar to HexelPointBrush's interpretPattern but for a specific vertex
    interpretPatternForVertex(centerQ, centerR) {
        const elements = [];
        const { activeFaces, vertexMask } = this.currentPattern;
        const neighbors = this.getNeighbors(centerQ, centerR);

        // Center vertex
        if (vertexMask & 0b0000001) {
            elements.push({ type: 'vertex', q: centerQ, r: centerR });
        }

        // Faces and edges
        activeFaces.forEach(faceIndex => {
            elements.push({
                type: 'face',
                centerQ, centerR,
                faceIndex,
                color: '#96ceb4',
                opacity: 0.2
            });

            const v1 = neighbors[faceIndex];
            const v2 = neighbors[(faceIndex + 1) % 6];

            // Only add edges if both vertices are in the shape
            if (this.verticesInShape.has(`${v1.q},${v1.r}`)) {
                elements.push({
                    type: 'edge',
                    q1: centerQ, r1: centerR,
                    q2: v1.q, r2: v1.r
                });
            }

            if (this.verticesInShape.has(`${v1.q},${v1.r}`) &&
                this.verticesInShape.has(`${v2.q},${v2.r}`)) {
                elements.push({
                    type: 'edge',
                    q1: v1.q, r1: v1.r,
                    q2: v2.q, r2: v2.r
                });
            }
        });

        return elements;
    }

    onDragStart(screenX, screenY) {
        this.startVertex = this.mapper.screenToVertex(screenX, screenY, this.threshold);
        if (this.startVertex) {
            this.drawing = true;
            this.verticesInShape.clear();
            this.verticesInShape.add(`${this.startVertex.q},${this.startVertex.r}`);
        }
        return this.startVertex;
    }

    onDragMove(screenX, screenY) {
        if (!this.drawing || !this.startVertex) return;

        const currentVertex = this.mapper.screenToVertex(screenX, screenY, this.threshold);
        if (currentVertex) {
            // Calculate shape between start and current
            this.verticesInShape = this.calculateShapeVertices(
                this.startVertex,
                currentVertex
            );

            // Clear previous shape and redraw with new pattern
            this.clearShape();
            this.applyPatternToShape(this.verticesInShape);
        }
    }

    onDragEnd() {
        this.drawing = false;
        this.startVertex = null;
        this.verticesInShape.clear();
    }

    clearShape() {
        // In a real implementation, you'd want to track which elements
        // belong to this shape and only remove those
        // This is simplified
    }

    getNeighbors(q, r) {
        const dirs = [[1,0], [1,-1], [0,-1], [-1,0], [-1,1], [0,1]];
        return dirs.map(([dq, dr]) => ({ q: q + dq, r: r + dr }));
    }

    activate() { this.active = true; }
    deactivate() { this.active = false; }
}
