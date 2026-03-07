// src/utils/math.js
// 📐 60° grid math utilities

export const HEXEL_SIZE = 24;
export const H_STEP = HEXEL_SIZE * 2;
export const V_STEP = HEXEL_SIZE * Math.sqrt(3);
export const TAN_60 = Math.tan(60 * Math.PI / 180);

// Axial to cube coordinates (for hex math)
export function axialToCube(q, r) {
    return { x: q, z: r, y: -q - r };
}

// Cube to axial coordinates
export function cubeToAxial(x, y, z) {
    return { q: x, r: z };
}

// Distance between two hexels (axial coordinates)
export function hexDistance(q1, r1, q2, r2) {
    const a = axialToCube(q1, r1);
    const b = axialToCube(q2, r2);
    return (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z)) / 2;
}

// Get all vertices within radius
export function hexRing(centerQ, centerR, radius) {
    const results = [];
    const cube = axialToCube(centerQ, centerR);

    for (let q = -radius; q <= radius; q++) {
        for (let r = -radius; r <= radius; r++) {
            const s = -q - r;
            if (Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) <= radius) {
                results.push({ q: centerQ + q, r: centerR + r });
            }
        }
    }

    return results;
}

// Line interpolation between two hexels
export function hexLerp(q1, r1, q2, r2, t) {
    const a = axialToCube(q1, r1);
    const b = axialToCube(q2, r2);

    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    const z = a.z + (b.z - a.z) * t;

    // Round to nearest hex
    const rx = Math.round(x);
    const ry = Math.round(y);
    const rz = Math.round(z);

    const xDiff = Math.abs(rx - x);
    const yDiff = Math.abs(ry - y);
    const zDiff = Math.abs(rz - z);

    if (xDiff > yDiff && xDiff > zDiff) {
        return cubeToAxial(-ry - rz, ry, rz);
    } else if (yDiff > zDiff) {
        return cubeToAxial(rx, -rx - rz, rz);
    } else {
        return cubeToAxial(rx, ry, -rx - ry);
    }
}

// Get line of hexels between two points
export function hexLine(q1, r1, q2, r2) {
    const N = hexDistance(q1, r1, q2, r2);
    const results = [];

    for (let i = 0; i <= N; i++) {
        results.push(hexLerp(q1, r1, q2, r2, i / N));
    }

    return results;
}

// Barycentric coordinates for point in triangle
export function barycentric(px, py, ax, ay, bx, by, cx, cy) {
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
    const w = 1 - u - v;

    return { u, v, w };
}
