export let points = [];

export function addPoint(q, r, color, size) {
    const exists = points.some(p => p.q === q && p.r === r);
    if (exists) return false;
    
    points.push({ q, r, color, size });
    return true;
}

export function removePoint(q, r) {
    points = points.filter(p => !(p.q === q && p.r === r));
}

export function clearPoints() {
    points = [];
}
