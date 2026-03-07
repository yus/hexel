// src/tools/FaceBrush.js
// 🔺 Places/stores triangular faces (barycentric)

export class FaceBrush {
    constructor(mapper, faceStore) {
        this.mapper = mapper;
        this.faceStore = faceStore;       // Persistent face storage
        this.active = false;
        this.threshold = 10;
    }

    // Find which face contains the point using barycentric coordinates
    findFace(screenX, screenY) {
        // First find center vertex of potential face
        const center = this.mapper.screenToVertex(screenX, screenY, 30);
        if (!center) return null;

        // Get all 6 surrounding vertices
        const neighbors = this.getNeighbors(center.q, center.r);

        // Check each of the 6 triangles around center
        for (let i = 0; i < neighbors.length; i++) {
            const v1 = neighbors[i];
            const v2 = neighbors[(i + 1) % neighbors.length];

            // Get screen coordinates
            const cScreen = this.mapper.vertexToScreen(center.q, center.r);
            const v1Screen = this.mapper.vertexToScreen(v1.q, v1.r);
            const v2Screen = this.mapper.vertexToScreen(v2.q, v2.r);

            // Barycentric check
            if (this.pointInTriangle(
                screenX, screenY,
                cScreen.x, cScreen.y,
                v1Screen.x, v1Screen.y,
                v2Screen.x, v2Screen.y
            )) {
                return {
                    faceIndex: i,
                    vertices: [center, v1, v2],
                    center: { q: center.q, r: center.r },
                    v1, v2
                };
            }
        }

        return null;
    }

    // Point in triangle test (barycentric)
    pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
        const v0x = cx - ax;
        const v0y = cy - ay;
        const v1x = bx - ax;
        const v1y = by - ay;
        const v2x = px - ax;
        const v2y = py - ay;

        const dot00 = v0x * v0x + v0y * v0y;
        const dot01 = v0x * v1x + v0y * v1y;
        const dot02 = v0x * v2x + v0y * v2y;
        const dot11 = v1x * v1x + v1y * v1y;
        const dot12 = v1x * v2x + v1y * v2y;

        const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
        const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
        const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

        return (u >= 0) && (v >= 0) && (u + v < 1);
    }

    // Click to toggle face
    onClick(screenX, screenY) {
        const face = this.findFace(screenX, screenY);

        if (face) {
            const key = `${face.center.q},${face.center.r}-${face.faceIndex}`;
            if (this.faceStore.has(key)) {
                this.faceStore.remove(key);
            } else {
                this.faceStore.add(key, {
                    type: 'face',
                    centerQ: face.center.q,
                    centerR: face.center.r,
                    faceIndex: face.faceIndex,
                    vertices: face.vertices,
                    color: '#96ceb4',
                    opacity: 0.3
                });
            }
            return face;
        }
        return null;
    }

    getNeighbors(q, r) {
        const dirs = [[1,0], [1,-1], [0,-1], [-1,0], [-1,1], [0,1]];
        return dirs.map(([dq, dr]) => ({ q: q + dq, r: r + dr }));
    }

    activate() { this.active = true; }
    deactivate() { this.active = false; }
}
