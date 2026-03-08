// src/tools/VertexBrush.js
// 🟢 Places/stores individual hexel vertices

export class VertexBrush {
    constructor(mapper, pointStore) {
        this.mapper = mapper;
        this.pointStore = pointStore;     // Persistent storage
        this.active = false;
        this.threshold = 15;               // Snap distance in pixels
    }

    add(q, r) {
        return {
            color: '#ffaa66', // Warm orange
            size: 8
        };
    }
    
    // Called on click/tap
    onClick(screenX, screenY) {
        const vertex = this.mapper.screenToVertex(screenX, screenY, this.threshold);

        if (vertex) {
            // Toggle vertex in store
            if (this.pointStore.has(vertex.q, vertex.r)) {
                this.pointStore.remove(vertex.q, vertex.r);
            } else {
                this.pointStore.add(vertex.q, vertex.r, {
                    type: 'vertex',
                    color: '#ffaa66',
                    size: 6
                });
            }
            return vertex;
        }
        return null;
    }

    // Called on hover (for preview)
    onHover(screenX, screenY) {
        return this.mapper.screenToVertex(screenX, screenY, this.threshold);
    }

    // Called when brush is activated
    activate() {
        this.active = true;
    }

    deactivate() {
        this.active = false;
    }
}
