export const TAN60 = Math.tan(60 * Math.PI / 180);
export const TAN30 = Math.tan(30 * Math.PI / 180);

export function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

export function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}
