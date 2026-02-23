import { getViewport, setOffset, zoom } from '../core/viewport.js';
import { getRenderer } from '../main.js';
import { addMessage } from './messages.js';
import { showZoomIndicator } from './indicators.js';
import { setTool, getCurrentToolName } from '../tools/tool-manager.js';
import { undo, redo } from '../drawing/history.js';

let gridEnabled = true;
let previousTool = 'point';
let spacePressed = false;

export function initShortcuts() {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Prevent browser shortcuts conflicts
    document.addEventListener('contextmenu', (e) => e.preventDefault());
}

function handleKeyDown(e) {
    // Ignore if in input/textarea
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    // --- MOMENTARY PAN (SPACEBAR) ---
    if (e.code === 'Space' && !spacePressed && !e.repeat) {
        e.preventDefault();
        spacePressed = true;
        
        // Store current tool and switch to pan
        previousTool = getCurrentToolName();
        setTool('pan');
        document.body.style.cursor = 'grab';
    }
    
    // Tool shortcuts (no modifiers)
    if (!e.ctrlKey && !e.metaKey && !e.altKey && !spacePressed) {
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
            case 'g':
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
    
    // Navigation with arrow keys (only if not in pan mode)
    if (!e.ctrlKey && !e.metaKey && !e.altKey && !spacePressed) {
        const panAmount = 20;
        
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                panView(panAmount, 0);
                break;
            case 'ArrowRight':
                e.preventDefault();
                panView(-panAmount, 0);
                break;
            case 'ArrowUp':
                e.preventDefault();
                panView(0, panAmount);
                break;
            case 'ArrowDown':
                e.preventDefault();
                panView(0, -panAmount);
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
    // Release spacebar - go back to previous tool
    if (e.code === 'Space' && spacePressed) {
        e.preventDefault();
        spacePressed = false;
        
        setTool(previousTool);
        document.body.style.cursor = 'default';
    }
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

function panView(dx, dy) {
    const { scale } = getViewport();
    const worldDx = dx / scale;
    const worldDy = -dy / scale; // Invert Y for natural feel
    
    setOffset(worldDx, worldDy);
    updateAfterPan();
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
