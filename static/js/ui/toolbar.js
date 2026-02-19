import { setTool } from '../tools/tool-manager.js';
import { clearAll } from '../drawing/renderer.js';
import { getGridState, toggleGrid } from '../core/grid.js'; // Keep this
// import { gridEnabled } from '../core/grid.js'; // Keep commented

export function initToolbar() {
    // Tool buttons
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setTool(btn.dataset.tool);
        });
    });
    
    // Grid toggle - NOW USING IMPORTED FUNCTION
    document.getElementById('header-grid-toggle').addEventListener('click', toggleGrid);
    
    // Clear button
    document.getElementById('header-clear').addEventListener('click', clearAll);
}

// 🗑️ REMOVE this entire local function - we're using the imported one!
// function toggleGrid() {
//     gridEnabled = !gridEnabled;
//     import('../core/grid.js').then(m => m.drawGrid());
//     const btn = document.getElementById('header-grid-toggle');
//     btn.classList.toggle('active', gridEnabled);
// }
