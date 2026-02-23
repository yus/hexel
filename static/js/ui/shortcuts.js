import { getViewport, setOffset, zoom } from '../core/viewport.js';
import { getRenderer } from '../main.js';
import { addMessage } from './messages.js';
import { showZoomIndicator } from './indicators.js';
import { setTool } from '../tools/tool-manager.js';
import { undo, redo } from '../drawing/history.js';

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
        }
    }
    
    // Navigation with arrow keys
    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const panAmount = 20;
        
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
}

function toggleGrid() {
    import('../core/grid.js').then(m => {
        gridEnabled = m.toggleGrid();
        
        const { scale, offsetX, offsetY } = getViewport();
        const renderer = getRenderer();
        if (renderer) {
            renderer.gridEnabled = gridEnabled;
            renderer.drawAll(scale, offsetX, offsetY);
        }
        
        const gridToggle = document.getElementById('header-grid-toggle');
        if (gridToggle) {
            gridToggle.classList.toggle('active', gridEnabled);
        }
        
        document.getElementById('status-grid').textContent = gridEnabled ? 'ON' : 'OFF';
        addMessage(`📐 Grid ${gridEnabled ? 'enabled' : 'disabled'}`);
    });
}

function resetView() {
    const { scale, offsetX, offsetY } = getViewport();
    
    setOffset(-offsetX, -offsetY);
    
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
    const { scale, offsetX, offsetY } = getViewport();
    const renderer = getRenderer();
    if (renderer) {
        renderer.drawAll(scale, offsetX, offsetY);
    }
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

export function setGridState(enabled) {
    gridEnabled = enabled;
}
