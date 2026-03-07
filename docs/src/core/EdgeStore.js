// src/core/EdgeStore.js
// 📏 Stores edges (connections between two vertices)

export class EdgeStore {
    constructor() {
        // Key format: `${q1},${r1}-${q2},${r2}`
        // Always store with q1,r1 as the "smaller" key for consistency
        this.edges = new Map();
    }

    // Generate consistent key (always ordered)
    _getKey(q1, r1, q2, r2) {
        // Sort to ensure consistent keys
        const hash1 = `${q1},${r1}`;
        const hash2 = `${q2},${r2}`;
        return hash1 < hash2 ? `${hash1}-${hash2}` : `${hash2}-${hash1}`;
    }

    // Check if edge exists
    has(q1, r1, q2, r2) {
        const key = this._getKey(q1, r1, q2, r2);
        return this.edges.has(key);
    }

    // Add an edge
    add(q1, r1, q2, r2, data = {}) {
        const key = this._getKey(q1, r1, q2, r2);
        this.edges.set(key, {
            q1, r1, q2, r2,
            type: 'edge',
            color: data.color || '#4ecdc4',
            width: data.width || 2,
            createdAt: Date.now(),
            ...data
        });
    }

    // Remove an edge
    remove(q1, r1, q2, r2) {
        const key = this._getKey(q1, r1, q2, r2);
        this.edges.delete(key);
    }

    // Get all edges
    getAll() {
        return Array.from(this.edges.values());
    }

    // Find edges connected to a vertex
    getEdgesForVertex(q, r) {
        const result = [];
        for (const edge of this.edges.values()) {
            if ((edge.q1 === q && edge.r1 === r) ||
                (edge.q2 === q && edge.r2 === r)) {
                result.push(edge);
            }
        }
        return result;
    }

    clear() {
        this.edges.clear();
    }

    get count() {
        return this.edges.size;
    }
}
