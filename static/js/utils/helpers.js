// Debounce function for performance
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle for smooth performance
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Format coordinates nicely
export function formatCoord(value) {
    return value.toFixed(2);
}

// Generate unique ID
export function generateId() {
    return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Check if point is in hexagon (for selection)
export function pointInHexagon(px, py, cx, cy, size) {
    const dx = Math.abs(px - cx);
    const dy = Math.abs(py - cy);
    
    // Hexagon is basically a circle approximation
    if (dx > size || dy > size * 0.866) return false;
    
    // More precise check
    const slope = 0.57735; // tan(30°)
    const x1 = size - dy * slope;
    return dx <= x1;
}

// Convert hex axial to cube coordinates
export function axialToCube(q, r) {
    return { x: q, z: r, y: -q - r };
}

// Convert cube to axial
export function cubeToAxial(x, y, z) {
    return { q: x, r: z };
}

// Get distance between two hexels
export function hexelDistance(q1, r1, q2, r2) {
    const cube1 = axialToCube(q1, r1);
    const cube2 = axialToCube(q2, r2);
    
    return Math.max(
        Math.abs(cube1.x - cube2.x),
        Math.abs(cube1.y - cube2.y),
        Math.abs(cube1.z - cube2.z)
    );
}

// Get neighboring hexel
export function getNeighbor(q, r, direction) {
    // Directions: 0=E, 1=SE, 2=SW, 3=W, 4=NW, 5=NE
    const directions = [
        { q: 1, r: 0 },  // E
        { q: 1, r: -1 }, // SE
        { q: 0, r: -1 }, // SW
        { q: -1, r: 0 }, // W
        { q: -1, r: 1 }, // NW
        { q: 0, r: 1 }   // NE
    ];
    
    const dir = directions[direction];
    if (!dir) return null;
    
    // Adjust for odd/even rows
    if (r % 2 !== 0 && (direction === 2 || direction === 3)) {
        dir.q += 1;
    }
    
    return {
        q: q + dir.q,
        r: r + dir.r
    };
}
