import { setTool } from '../tools/tool-manager.js';
import { gridEnabled } from '../core/grid.js';

export function initToolbar() {
    // Tool buttons
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setTool(btn.dataset.tool);
        });
    });
    
    // Grid toggle
    document.getElementById('header-grid-toggle').addEventListener('click', toggleGrid);
    
    // Clear button
    document.getElementById('header-clear').addEventListener('click', clearAll);
}

function toggleGrid() {
    gridEnabled = !gridEnabled;
    import('../core/grid.js').then(m => m.drawGrid());
    
    const btn = document.getElementById('header-grid-toggle');
    btn.classList.toggle('active', gridEnabled);
}
