// src/tools/EdgeBrush.js
// 📏 Places/stores edges between two vertices

export class EdgeBrush {
    constructor(mapper, edgeStore) {
        this.mapper = mapper;
        this.edgeStore = edgeStore;       // Persistent edge storage
        this.active = false;
        this.threshold = 12;               // Distance to edge in pixels

        // For line drawing
        this.startVertex = null;
        this.drawing = false;
    }

    add(q1, r1, q2, r2) {
        return {
            color: '#4ecdc4', // Turquoise
            width: 3
        };
    }

    // Find nearest edge to screen point
    findNearestEdge(screenX, screenY) {
        // First find nearest vertex
        const v1 = this.mapper.screenToVertex(screenX, screenY, 20);
        if (!v1) return null;

        // Get all 6 neighboring vertices
        const neighbors = this.getNeighbors(v1.q, v1.r);

        // Find closest edge
        let bestEdge = null;
        let minDist = Infinity;

        neighbors.forEach(({ q, r }) => {
            const v2 = { q, r };
            const v1Screen = this.mapper.vertexToScreen(v1.q, v1.r);
            const v2Screen = this.mapper.vertexToScreen(q, r);

            const dist = this.pointToSegmentDistance(
                screenX, screenY,
                v1Screen.x, v1Screen.y,
                v2Screen.x, v2Screen.y
            );

            if (dist < minDist) {
                minDist = dist;
                bestEdge = {
                    q1: v1.q, r1: v1.r,
                    q2: q, r2: r,
                    midpoint: {
                        x: (v1Screen.x + v2Screen.x) / 2,
                        y: (v1Screen.y + v2Screen.y) / 2
                    },
                    distance: dist
                };
            }
        });

        return minDist <= this.threshold ? bestEdge : null;
    }

    // Single click: toggle nearest edge
    onClick(screenX, screenY) {
        const edge = this.findNearestEdge(screenX, screenY);

        if (edge) {
            const key = `${edge.q1},${edge.r1}-${edge.q2},${edge.r2}`;
            if (this.edgeStore.has(key)) {
                this.edgeStore.remove(key);
            } else {
                this.edgeStore.add(key, {
                    type: 'edge',
                    q1: edge.q1, r1: edge.r1,
                    q2: edge.q2, r2: edge.r2,
                    color: '#4ecdc4',
                    width: 2
                });
            }
            return edge;
        }
        return null;
    }

    // Drag: draw continuous line
    onDragStart(screenX, screenY) {
        this.startVertex = this.mapper.screenToVertex(screenX, screenY, this.threshold);
        this.drawing = !!this.startVertex;
        return this.startVertex;
    }

    onDragMove(screenX, screenY) {
        if (!this.drawing || !this.startVertex) return;

        const endVertex = this.mapper.screenToVertex(screenX, screenY, this.threshold);
        if (endVertex) {
            this.drawLine(this.startVertex, endVertex);
            this.startVertex = endVertex; // Continuous drawing
        }
    }

    onDragEnd() {
        this.drawing = false;
        this.startVertex = null;
    }

    // Grid-aware line drawing (Bresenham for hex grids)
    drawLine(v1, v2) {
        const points = this.getHexLine(v1, v2);
        points.forEach(p => {
            const key = `${p.q1},${p.r1}-${p.q2},${p.r2}`;
            this.edgeStore.add(key, {
                type: 'edge',
                q1: p.q1, r1: p.r1,
                q2: p.q2, r2: p.r2,
                color: '#4ecdc4',
                width: 2
            });
        });
    }

    // Bresenham for hex grids (simplified)
    getHexLine(v1, v2) {
        const points = [];
        let { q: q1, r: r1 } = v1;
        const { q: q2, r: r2 } = v2;

        const dq = Math.abs(q2 - q1);
        const dr = Math.abs(r2 - r1);
        const sq = q1 < q2 ? 1 : -1;
        const sr = r1 < r2 ? 1 : -1;

        let err = dq - dr;

        while (true) {
            // Add edge from current vertex to neighbor?
            // This is simplified — full hex line algo needed
            points.push({ q1, r1, q2: q1 + sq, r2: r1 });

            if (q1 === q2 && r1 === r2) break;

            const e2 = 2 * err;
            if (e2 > -dr) {
                err -= dr;
                q1 += sq;
            }
            if (e2 < dq) {
                err += dq;
                r1 += sr;
            }
        }

        return points;
    }

    // Helper: get 6 neighboring vertices
    getNeighbors(q, r) {
        const dirs = [[1,0], [1,-1], [0,-1], [-1,0], [-1,1], [0,1]];
        return dirs.map(([dq, dr]) => ({ q: q + dq, r: r + dr }));
    }

    // Distance from point to line segment
    pointToSegmentDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;
        if (param < 0) {
            xx = x1; yy = y1;
        } else if (param > 1) {
            xx = x2; yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        return Math.hypot(dx, dy);
    }

    activate() { this.active = true; }
    deactivate() { this.active = false; }
}
