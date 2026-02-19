import { points } from './points.js';
import { lines } from './lines.js';
import { triangles } from './triangles.js';

const MAX_HISTORY = 50;
let history = [];
let currentIndex = -1;

// Save current state
export function saveState() {
    // Create snapshot
    const state = {
        points: JSON.parse(JSON.stringify(points)),
        lines: JSON.parse(JSON.stringify(lines)),
        triangles: JSON.parse(JSON.stringify(triangles)),
        timestamp: Date.now()
    };
    
    // If we're not at the end, truncate
    if (currentIndex < history.length - 1) {
        history = history.slice(0, currentIndex + 1);
    }
    
    // Add new state
    history.push(state);
    currentIndex++;
    
    // Limit history size
    if (history.length > MAX_HISTORY) {
        history.shift();
        currentIndex--;
    }
}

export function undo() {
    if (currentIndex > 0) {
        currentIndex--;
        restoreState(history[currentIndex]);
        import('../ui/messages.js').then(m => m.addMessage('↩️ undo'));
        return true;
    }
    return false;
}

export function redo() {
    if (currentIndex < history.length - 1) {
        currentIndex++;
        restoreState(history[currentIndex]);
        import('../ui/messages.js').then(m => m.addMessage('↪️ redo'));
        return true;
    }
    return false;
}

function restoreState(state) {
    // Clear and restore
    points.length = 0;
    lines.length = 0;
    triangles.length = 0;
    
    points.push(...state.points);
    lines.push(...state.lines);
    triangles.push(...state.triangles);
    
    // Redraw
    import('./renderer.js').then(m => m.drawAll());
    import('../ui/panels.js').then(m => m.updateStats());
}

export function clearHistory() {
    history = [];
    currentIndex = -1;
    saveState(); // Save initial empty state
}
