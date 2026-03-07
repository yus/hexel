// src/tools/HexelFillBrush.js
// 🪣 Flood fill that propagates chip pattern through adjacent faces

export class HexelFillBrush {
    constructor(mapper, compositeStore, chip) {
        this.mapper = mapper;
        this.store = compositeStore;
        this.chip = chip;
        this.active = false;

        this.currentPattern = { state: 0, activeFaces: [0], vertexMask: 0b0000001 };
        this.chip.subscribe((p) => { this.currentPattern = p; });
    }

    // Flood fill on faces
    onClick(screenX, screenY) {
        // Find which face was clicked
        const face = this.findFace(screenX, screenY);
        if (!face) return null;

        const { centerQ, centerR, faceIndex } = face;
        const targetValue = this.getFaceValue(centerQ, centerR, faceIndex);

        // Perform flood fill
        const filled = this.floodFill(centerQ, centerR, faceIndex, targetValue);

        return { filled: filled.length };
    }

    // Get current value of a face (whether it's active)
    getFaceValue(centerQ, centerR, faceIndex) {
        return this.store.faces.has(centerQ, centerR, faceIndex) ? 1 : 0;
    }

    // Flood fill algorithm
    floodFill(startQ, startR, startFaceIndex, targetValue) {
        const stack = [{ q: startQ, r: startR, faceIndex: startFaceIndex }];
        const visited = new Set();
        const filled = [];

        const neighbors = this.getFaceNeighbors(startQ, startR, startFaceIndex);

        while (stack.length > 0) {
            const current = stack.pop();
            const key = `${current.q},${current.r}-${current.faceIndex}`;

            if (visited.has(key)) continue;
            visited.add(key);

            // Check if this face matches target value
            if (this.getFaceValue(current.q, current.r, current.faceIndex) === targetValue) {
                // Apply current chip pattern to this face
                this.applyPatternToFace(current.q, current.r, current.faceIndex);
                filled.push(current);

                // Add neighboring faces
                const faceNeighbors = this.getFaceNeighbors(
                    current.q,
                    current.r,
                    current.faceIndex
                );
                faceNeighbors.forEach(n => stack.push(n));
            }
        }

        return filled;
    }

    // Apply chip pattern to a single face
    applyPatternToFace(centerQ, centerR, faceIndex) {
        const { activeFaces, vertexMask } = this.currentPattern;
        const neighbors = this.getNeighbors(centerQ, centerR);

        // If this face index is in activeFaces, activate it
        if (activeFaces.includes(faceIndex)) {
            this.store.faces.add(centerQ, centerR, faceIndex, {
                color: '#96ceb4',
                opacity: 0.3
            });

            // Add edges based on vertex mask
            const v1 = neighbors[faceIndex];
            const v2 = neighbors[(faceIndex + 1) % 6];

            if (vertexMask & 0b0000001) { // Center vertex
                this.store.points.add(centerQ, centerR);
            }

            if (vertexMask & 0b0000010) { // Edge from center to v1
                this.store.edges.add(centerQ, centerR, v1.q, v1.r);
            }

            if (vertexMask & 0b0000100) { // Perimeter edge
                this.store.edges.add(v1.q, v1.r, v2.q, v2.r);
            }
        }
    }

    // Find neighboring faces (simplified — needs full implementation)
    getFaceNeighbors(q, r, faceIndex) {
        // Each face has up to 3 neighboring faces
        const neighbors = [];

        // 1. Adjacent face sharing the same center
        neighbors.push({ q, r, faceIndex: (faceIndex + 1) % 6 });
        neighbors.push({ q, r, faceIndex: (faceIndex + 5) % 6 });

        // 2. Face in adjacent hexel (more complex — needs full implementation)
        // This depends on your coordinate system

        return neighbors;
    }

    findFace(screenX, screenY) {
        // Reuse FaceBrush's face detection logic
        const center = this.mapper.screenToVertex(screenX, screenY, 30);
        if (!center) return null;

        const neighbors = this.getNeighbors(center.q, center.r);

        for (let i = 0; i < neighbors.length; i++) {
            const v1 = neighbors[i];
            const v2 = neighbors[(i + 1) % neighbors.length];

            const cScreen = this.mapper.vertexToScreen(center.q, center.r);
            const v1Screen = this.mapper.vertexToScreen(v1.q, v1.r);
            const v2Screen = this.mapper.vertexToScreen(v2.q, v2.r);

            if (this.pointInTriangle(
                screenX, screenY,
                cScreen.x, cScreen.y,
                v1Screen.x, v1Screen.y,
                v2Screen.x, v2Screen.y
            )) {
                return { centerQ: center.q, centerR: center.r, faceIndex: i };
            }
        }
        return null;
    }

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

    getNeighbors(q, r) {
        const dirs = [[1,0], [1,-1], [0,-1], [-1,0], [-1,1], [0,1]];
        return dirs.map(([dq, dr]) => ({ q: q + dq, r: r + dr }));
    }

    activate() { this.active = true; }
    deactivate() { this.active = false; }
}
