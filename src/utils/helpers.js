// src/utils/helpers.js
// 🛠️ General utility functions

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

// Throttle for animation performance
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

// Generate unique ID
export function uid() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Clamp value between min and max
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// Map value from one range to another
export function mapRange(value, fromMin, fromMax, toMin, toMax) {
    return toMin + (toMax - toMin) * ((value - fromMin) / (fromMax - fromMin));
}

// Check if point is in canvas
export function inCanvas(x, y, canvas) {
    return x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height;
}
