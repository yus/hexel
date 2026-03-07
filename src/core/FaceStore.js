// src/core/FaceStore.js
// 🔺 Stores triangular faces (center vertex + two neighbors)

export class FaceStore {
    constructor() {
        // Key format: `${centerQ},${centerR}-${faceIndex}`
        // faceIndex: 0-5 around center vertex
        this.faces = new Map();
    }

    // Generate key for a face
    _getKey(centerQ, centerR, faceIndex) {
        return `${centerQ},${centerR}-${faceIndex}`;
    }

    // Check if face exists
    has(centerQ, centerR, faceIndex) {
        const key = this._getKey(centerQ, centerR, faceIndex);
        return this.faces.has(key);
    }

    // Add a face
    add(centerQ, centerR, faceIndex, data = {}) {
        const key = this._getKey(centerQ, centerR, faceIndex);
        this.faces.set(key, {
            centerQ, centerR,
            faceIndex,
            type: 'face',
            color: data.color || '#96ceb4',
            opacity: data.opacity || 0.3,
            createdAt: Date.now(),
            ...data
        });
    }

    // Remove a face
    remove(centerQ, centerR, faceIndex) {
        const key = this._getKey(centerQ, centerR, faceIndex);
        this.faces.delete(key);
    }

    // Get all faces
    getAll() {
        return Array.from(this.faces.values());
    }

    // Get all faces around a center vertex
    getFacesForCenter(centerQ, centerR) {
        const result = [];
        for (let i = 0; i < 6; i++) {
            const key = this._getKey(centerQ, centerR, i);
            if (this.faces.has(key)) {
                result.push(this.faces.get(key));
            }
        }
        return result;
    }

    clear() {
        this.faces.clear();
    }

    get count() {
        return this.faces.size;
    }
}
