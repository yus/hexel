// src/core/CompositeStore.js
// 🌀 Stores hexel elements (combination of vertices, edges, faces)

export class CompositeStore {
    constructor(pointStore, edgeStore, faceStore) {
        this.points = pointStore;
        this.edges = edgeStore;
        this.faces = faceStore;
    }

    // Add a hexel element based on type
    addElement(type, ...args) {
        switch(type) {
            case 'vertex':
                return this.points.add(...args);
            case 'edge':
                return this.edges.add(...args);
            case 'face':
                return this.faces.add(...args);
            default:
                console.warn('Unknown element type:', type);
        }
    }

    // Clear everything
    clearAll() {
        this.points.clear();
        this.edges.clear();
        this.faces.clear();
    }

    // Get all elements
    getAll() {
        return {
            points: this.points.getAll(),
            edges: this.edges.getAll(),
            faces: this.faces.getAll()
        };
    }

    // Statistics
    get stats() {
        return {
            points: this.points.count,
            edges: this.edges.count,
            faces: this.faces.count,
            total: this.points.count + this.edges.count + this.faces.count
        };
    }
}
