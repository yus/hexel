import { setTool } from '../tools/tool-manager.js';
import { clearAll } from '../drawing/renderer.js';
import { getGridState, toggleGrid } from '../core/grid.js';
import { addMessage } from './messages.js';
import { getRenderer } from '../main.js';

export function initToolbar() {
    // Tool buttons
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setTool(btn.dataset.tool);
        });
    });
    
    // Grid toggle - using imported function
    document.getElementById('header-grid-toggle').addEventListener('click', () => {
        const newState = toggleGrid();
        updateGridButton(newState);
        addMessage(`Grid ${newState ? 'on' : 'off'}`);
    });
    
    // Clear button
    document.getElementById('header-clear').addEventListener('click', () => {
        clearAll();
        addMessage('✨ Canvas cleared');
    });
    
    // Initial button state
    updateGridButton(getGridState());
}

function updateGridState(enabled) {
    const btn = document.getElementById('header-grid-toggle');
    if (btn) {
        btn.classList.toggle('active', enabled);
        btn.innerHTML = enabled ? 
            '<span>⬟</span> <span>GRID ON</span>' : 
            '<span>⬟</span> <span>GRID OFF</span>';
    }
    
    const statusGrid = document.getElementById('status-grid');
    if (statusGrid) {
        statusGrid.textContent = enabled ? 'ON' : 'OFF';
    }
}

// Make sure grid.js's toggleGrid returns the new state
