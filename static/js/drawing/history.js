import { getRenderer } from '../main.js';

const MAX_HISTORY = 50;
let history = [];
let currentIndex = -1;

// Save current state from renderer
export function saveState(renderer = getRenderer()) {
    if (!renderer) return;
    
    // Get data from renderer
    const state = {
        points: [...renderer.points],
        lines: [...renderer.lines],
        triangles: [...renderer.triangles],
        hexagons: [...renderer.hexagons],
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
    
    console.log(`📝 Saved state ${currentIndex + 1}/${history.length}`);
}

export function undo(renderer = getRenderer()) {
    if (!renderer) return false;
    
    if (currentIndex > 0) {
        currentIndex--;
        restoreState(history[currentIndex], renderer);
        import('../ui/messages.js').then(m => 
            m.addMessage('↩️ Undo', 'info', 1500)
        );
        return true;
    }
    return false;
}

export function redo(renderer = getRenderer()) {
    if (!renderer) return false;
    
    if (currentIndex < history.length - 1) {
        currentIndex++;
        restoreState(history[currentIndex], renderer);
        import('../ui/messages.js').then(m => 
            m.addMessage('↪️ Redo', 'info', 1500)
        );
        return true;
    }
    return false;
}

function restoreState(state, renderer) {
    if (!renderer || !state) return;
    
    // Restore data to renderer
    renderer.points = [...state.points];
    renderer.lines = [...state.lines];
    renderer.triangles = [...state.triangles];
    renderer.hexagons = [...state.hexagons];
    
    // Update WebGL buffers
    renderer.updatePointBuffer();
    if (renderer.updateLineBuffer) renderer.updateLineBuffer();
    if (renderer.updateTriangleBuffer) renderer.updateTriangleBuffer();
    
    // Redraw
    import('./core/viewport.js').then(({ getViewport }) => {
        const { scale, offsetX, offsetY } = getViewport();
        renderer.drawAll(scale, offsetX, offsetY);
    });
    
    // Update UI stats
    import('../ui/panels.js').then(m => m.updateStats(renderer));
}

export function clearHistory() {
    history = [];
    currentIndex = -1;
    console.log('🧹 History cleared');
}

export function getHistoryInfo() {
    return {
        length: history.length,
        current: currentIndex + 1,
        canUndo: currentIndex > 0,
        canRedo: currentIndex < history.length - 1
    };
}
