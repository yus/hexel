import { getViewport, zoom, setOffset } from '../core/viewport.js';
import { drawGrid } from '../core/grid.js';
import { drawAll } from '../drawing/renderer.js';
import { handleToolAction } from '../tools/tool-manager.js';
import { showZoomIndicator } from './indicators.js';

let isDragging = false;
let lastX, lastY;
let lastDistance = 0;
let clickStartTime = 0;
let clickStartPos = { x: 0, y: 0 };
const dragThreshold = 3;
const clickDelay = 200;

export function initEvents() {
    const drawCanvas = document.getElementById('draw-canvas');
    
    // Mouse events
    drawCanvas.addEventListener('mousedown', onMouseDown);
    drawCanvas.addEventListener('mousemove', onMouseMove);
    drawCanvas.addEventListener('mouseup', onMouseUp);
    drawCanvas.addEventListener('wheel', onWheel);
    
    // Touch events
    drawCanvas.addEventListener('touchstart', onTouchStart);
    drawCanvas.addEventListener('touchmove', onTouchMove);
    drawCanvas.addEventListener('touchend', onTouchEnd);
    
    // Keyboard events
    document.addEventListener('keydown', onKeyDown);
}

function onMouseDown(e) {
    e.preventDefault();
    
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    isDragging = false;
    lastX = e.clientX;
    lastY = e.clientY;
    clickStartTime = Date.now();
    clickStartPos = { x: e.clientX, y: e.clientY };
    
    // Handle tool action
    handleToolAction('onMouseDown', x, y);
}

function onMouseMove(e) {
    if (!lastX) return;
    
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    
    // Check if we should start dragging
    if (!isDragging) {
        const dist = Math.hypot(e.clientX - clickStartPos.x, e.clientY - clickStartPos.y);
        if (dist > dragThreshold) {
            isDragging = true;
        }
    }
    
    if (isDragging) {
        // Pan view
        setOffset(dx, dy);
        const { scale, offsetX, offsetY } = getViewport();
        drawGrid(scale, offsetX, offsetY, true);
        drawAll();
    } else {
        // Tool hover
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        handleToolAction('onMouseMove', x, y);
    }
    
    lastX = e.clientX;
    lastY = e.clientY;
}

function onMouseUp(e) {
    if (!isDragging) {
        // It was a click!
        const clickDuration = Date.now() - clickStartTime;
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (clickDuration < clickDelay) {
            handleToolAction('onClick', x, y);
        } else {
            handleToolAction('onLongClick', x, y);
        }
    }
    
    isDragging = false;
    lastX = null;
    lastY = null;
}

function onWheel(e) {
    e.preventDefault();
    
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const delta = -e.deltaY * 0.001;
    zoom(1 + delta, x, y);
    
    const { scale, offsetX, offsetY } = getViewport();
    drawGrid(scale, offsetX, offsetY, true);
    drawAll();
    showZoomIndicator();
}

function onTouchStart(e) {
    e.preventDefault();
    
    if (e.touches.length === 2) {
        // Pinch zoom start
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        lastDistance = Math.hypot(
            touch1.clientX - touch2.clientX,
            touch1.clientY - touch2.clientY
        );
    } else {
        // Single touch - treat as mouse
        const touch = e.touches[0];
        const rect = e.target.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        lastX = touch.clientX;
        lastY = touch.clientY;
        clickStartTime = Date.now();
        clickStartPos = { x: touch.clientX, y: touch.clientY };
        
        handleToolAction('onMouseDown', x, y);
    }
}

function onTouchMove(e) {
    e.preventDefault();
    
    if (e.touches.length === 2) {
        // Pinch zoom
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
            touch1.clientX - touch2.clientX,
            touch1.clientY - touch2.clientY
        );
        
        if (lastDistance > 0) {
            const zoomFactor = distance / lastDistance;
            const rect = e.target.getBoundingClientRect();
            const centerX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
            const centerY = (touch1.clientY + touch2.clientY) / 2 - rect.top;
            
            zoom(zoomFactor, centerX, centerY);
            
            const { scale, offsetX, offsetY } = getViewport();
            drawGrid(scale, offsetX, offsetY, true);
            drawAll();
        }
        
        lastDistance = distance;
    } else if (e.touches.length === 1 && lastX) {
        // Pan
        const touch = e.touches[0];
        const dx = touch.clientX - lastX;
        const dy = touch.clientY - lastY;
        
        setOffset(dx, dy);
        
        const { scale, offsetX, offsetY } = getViewport();
        drawGrid(scale, offsetX, offsetY, true);
        drawAll();
        
        lastX = touch.clientX;
        lastY = touch.clientY;
    }
}

function onTouchEnd(e) {
    e.preventDefault();
    
    if (e.touches.length === 0 && !isDragging) {
        // It was a tap
        if (e.changedTouches.length > 0) {
            const touch = e.changedTouches[0];
            const rect = e.target.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            handleToolAction('onClick', x, y);
        }
    }
    
    lastDistance = 0;
    isDragging = false;
    lastX = null;
    lastY = null;
}

function onKeyDown(e) {
    // Tool shortcuts
    switch(e.key.toLowerCase()) {
        case 'p':
            import('../tools/tool-manager.js').then(m => m.setTool('point'));
            break;
        case 'l':
            import('../tools/tool-manager.js').then(m => m.setTool('line'));
            break;
        case 't':
            import('../tools/tool-manager.js').then(m => m.setTool('triangle'));
            break;
        case 'h':
            import('../tools/tool-manager.js').then(m => m.setTool('hexagon'));
            break;
        case 's':
            import('../tools/tool-manager.js').then(m => m.setTool('select'));
            break;
        case ' ':
            // Toggle grid
            import('../core/grid.js').then(m => {
                gridEnabled = !gridEnabled;
                const { scale, offsetX, offsetY } = getViewport();
                drawGrid(scale, offsetX, offsetY, gridEnabled);
            });
            break;
        case 'r':
            // Reset view
            setOffset(-offsetX, -offsetY);
            zoom(1 / scale, window.innerWidth/2, window.innerHeight/2);
            break;
    }
    
    // Undo/redo with cmd
    if (e.metaKey || e.ctrlKey) {
        if (e.key === 'z' && !e.shiftKey) {
            // Undo
            import('../drawing/history.js').then(m => m.undo());
        } else if (e.key === 'z' && e.shiftKey) {
            // Redo
            import('../drawing/history.js').then(m => m.redo());
        }
    }
}
