// static/js/drawing/points.js
export let points = [];
export let lines = [];
export let triangles = [];
export let hexagons = [];

export function addPoint(q, r, color, size) {
    points.push({ q, r, color, size });
}

export function removePoint(q, r) {
    points = points.filter(p => !(p.q === q && p.r === r));
}

export function clearPoints() {
    points = [];
}

// Similar for lines, triangles, hexagons...
export function clearLines() { lines = []; }
export function clearTriangles() { triangles = []; }
export function clearHexagons() { hexagons = []; }
