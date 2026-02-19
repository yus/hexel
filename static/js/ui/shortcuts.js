// Keyboard shortcuts management
import { setTool } from '../tools/tool-manager.js';
import { getViewport, zoom, setOffset } from '../core/viewport.js';
import { drawGrid } from '../core/grid.js';
import { drawAll } from '../drawing/renderer.js';
import { undo, redo } from '../drawing/history.js';
import { addMessage } from './messages.js';
import { showZoomIndicator } from './indicators.js';

let gridEnabled = true;

export function initShortcuts() {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Prevent browser shortcuts conflicts
    document.addEventListener('contextmenu', (e) => e.preventDefault());
}

function handleKeyDown(e) {
    // Ignore if in input/textarea
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    // Tool shortcuts (no modifiers)
    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        switch(e.key.toLowerCase()) {
            case 'p':
                e.preventDefault();
                setTool('point');
                addMessage('🔧 Point tool selected', 'info', 1000);
                break;
            case 'l':
                e.preventDefault();
                setTool('line');
                addMessage('📏 Line tool selected', 'info', 1000);
                break;
            case 't':
                e.preventDefault();
                setTool('triangle');
                addMessage('△ Triangle tool selected', 'info', 1000);
                break;
            case 'h':
                e.preventDefault();
                setTool('hexagon');
                addMessage('⬟ Hexagon tool selected', 'info', 1000);
                break;
            case 's':
                e.preventDefault();
                setTool('select');
                addMessage('🔍 Select tool selected', 'info', 1000);
                break;
            case 'f':
                e.preventDefault();
                setTool('fill-triangle');
                addMessage('🎨 Fill tool selected', 'info', 1000);
                break;
            case ' ':
                e.preventDefault();
                toggleGrid();
                break;
            case 'r':
                e.preventDefault();
                resetView();
                break;
            case 'escape':
            case 'esc':
                e.preventDefault();
                cancelCurrentAction();
                break;
        }
    }
    
    // Undo/Redo with Cmd/Ctrl
    if (e.metaKey || e.ctrlKey) {
        switch(e.key.toLowerCase()) {
            case 'z':
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
                break;
            case 'y':
                e.preventDefault();
                redo();
                break;
            case 'c':
                // Copy (future implementation)
                if (e.target.tagName !== 'INPUT') {
                    e.preventDefault();
                    copySelection();
                }
                break;
            case 'v':
                // Paste (future implementation)
                if (e.target.tagName !== 'INPUT') {
                    e.preventDefault();
                    pasteSelection();
                }
                break;
            case 'a':
                // Select all
                e.preventDefault();
                selectAll();
                break;
        }
    }
    
    // Navigation with arrow keys
    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const panAmount = 20;
        const { scale, offsetX, offsetY } = getViewport();
        
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                setOffset(panAmount, 0);
                updateAfterPan();
                break;
            case 'ArrowRight':
                e.preventDefault();
                setOffset(-panAmount, 0);
                updateAfterPan();
                break;
            case 'ArrowUp':
                e.preventDefault();
                setOffset(0, panAmount);
                updateAfterPan();
                break;
            case 'ArrowDown':
                e.preventDefault();
                setOffset(0, -panAmount);
                updateAfterPan();
                break;
        }
    }
    
    // Zoom with +/- keys
    if (!e.ctrlKey && !e.metaKey) {
        switch(e.key) {
            case '+':
            case '=':
                e.preventDefault();
                zoomIn();
                break;
            case '-':
            case '_':
                e.preventDefault();
                zoomOut();
                break;
        }
    }
}

function handleKeyUp(e) {
    // Handle key release if needed
    if (e.key === 'Shift') {
        // Temporary tool switch released
    }
}

function toggleGrid() {
    gridEnabled = !gridEnabled;
    
    const { scale, offsetX, offsetY } = getViewport();
    
    // Update WebGL or canvas grid
    const glCanvas = document.getElementById('grid-gl-canvas');
    if (glCanvas && glCanvas.style.display !== 'none') {
        // WebGL grid - toggle visibility
        glCanvas.style.opacity = gridEnabled ? '1' : '0';
    } else {
        // Canvas grid
        drawGrid(scale, offsetX, offsetY, gridEnabled);
    }
    
    // Update UI
    const gridToggle = document.getElementById('header-grid-toggle');
    if (gridToggle) {
        gridToggle.classList.toggle('active', gridEnabled);
        gridToggle.innerHTML = gridEnabled ? 
            '<span>⬟</span> <span>GRID ON</span>' : 
            '<span>⬟</span> <span>GRID OFF</span>';
    }
    
    document.getElementById('status-grid').textContent = gridEnabled ? 'ON' : 'OFF';
    addMessage(`📐 Grid ${gridEnabled ? 'enabled' : 'disabled'}`);
}

function resetView() {
    const { scale, offsetX, offsetY } = getViewport();
    
    // Reset to center
    setOffset(-offsetX, -offsetY);
    
    // Reset zoom to 1.0
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    zoom(1 / scale, centerX, centerY);
    
    updateAfterPan();
    addMessage('🔄 View reset');
    showZoomIndicator();
}

function zoomIn() {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    zoom(1.2, centerX, centerY);
    updateAfterPan();
    showZoomIndicator();
}

function zoomOut() {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    zoom(0.8, centerX, centerY);
    updateAfterPan();
    showZoomIndicator();
}

function updateAfterPan() {
    const { scale, offsetX, offsetY, gridEnabled } = getViewport();
    
    // Update WebGL or canvas
    const glCanvas = document.getElementById('grid-gl-canvas');
    if (glCanvas && glCanvas.style.display !== 'none') {
        import('../core/grid-shader.js').then(m => {
            const { glShader } = require('../main.js');
            if (glShader) m.drawGridGL(glShader, scale, offsetX, offsetY);
        });
    } else {
        drawGrid(scale, offsetX, offsetY, gridEnabled);
    }
    
    drawAll();
}

function cancelCurrentAction() {
    import('../tools/tool-manager.js').then(m => {
        const currentTool = m.getCurrentTool();
        if (currentTool && currentTool.cancel) {
            currentTool.cancel();
            addMessage('✖️ Action cancelled');
        }
    });
}

// Placeholders for future features
function copySelection() {
    addMessage('📋 Copy (coming soon)', 'info', 1500);
}

function pasteSelection() {
    addMessage('📋 Paste (coming soon)', 'info', 1500);
}

function selectAll() {
    addMessage('🔲 Select all (coming soon)', 'info', 1500);
}

// Export for use in other modules
export function setGridState(enabled) {
    gridEnabled = enabled;
}
