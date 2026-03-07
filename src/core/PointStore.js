// src/core/PointStore.js
// 🟢 Stores individual hexel vertices (q, r coordinates)

export class PointStore {
    constructor() {
        this.points = new Map(); // key: `${q},${r}`
    }

    // Check if vertex exists
    has(q, r) {
        return this.points.has(`${q},${r}`);
    }

    // Add a vertex point
    add(q, r, data = {}) {
        const key = `${q},${r}`;
        this.points.set(key, {
            q, r,
            type: 'vertex',
            color: data.color || '#ffaa66',
            size: data.size || 6,
            createdAt: Date.now(),
            ...data
        });
    }

    // Remove a vertex
    remove(q, r) {
        this.points.delete(`${q},${r}`);
    }

    // Get all vertices
    getAll() {
        return Array.from(this.points.values());
    }

    // Clear all points
    clear() {
        this.points.clear();
    }

    // Get count
    get count() {
        return this.points.size;
    }
}
