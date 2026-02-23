eimport { getViewport, setOffset, zoom } from '../core/viewport.js';
import { getRenderer } from '../main.js';
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
    const drawCanvas = document.getElementById('grid-gl-canvas'); // Now using WebGL canvas
    
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
    console.log('Mouse down', e.clientX, e.clientY);
    e.preventDefault();
    
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    isDragging = false;
    lastX = e.clientX;
    lastY = e.clientY;
    clickStartTime = Date.now();
    clickStartPos = { x: e.clientX, y: e.clientY };
    
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
        console.log('Dragging:', { dx, dy });
        
        // Get current viewport
        const { scale, offsetX, offsetY } = getViewport();
        
        // IMPORTANT: Convert screen pixels to world coordinates
        // The offset needs to be scaled by zoom!
        const worldDx = dx / scale;
        const worldDy = dy / scale;
        
        // Update viewport with world coordinates
        setOffset(worldDx, worldDy);
        
        // Get new values after update
        const newViewport = getViewport();
        const renderer = getRenderer();
        if (renderer) {
            renderer.drawAll(newViewport.scale, newViewport.offsetX, newViewport.offsetY);
        }
        
        // Update last position for next move
        lastX = e.clientX;
        lastY = e.clientY;
    } else {
        // Tool hover
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        handleToolAction('onMouseMove', x, y);
    }
}

function onMouseUp(e) {
    if (!isDragging) {
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
    
    // Zoom factor (negative for natural direction)
    const delta = -e.deltaY * 0.001;
    const zoomFactor = 1 + delta;
    
    // Apply zoom
    zoom(zoomFactor, x, y);
    
    // Redraw
    const { scale, offsetX, offsetY } = getViewport();
    const renderer = getRenderer();
    if (renderer) {
        renderer.drawAll(scale, offsetX, offsetY);
    }
    
    showZoomIndicator();
}

function onTouchStart(e) {
    e.preventDefault();
    
    if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        lastDistance = Math.hypot(
            touch1.clientX - touch2.clientX,
            touch1.clientY - touch2.clientY
        );
    } else {
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
            const renderer = getRenderer();
            if (renderer) {
                renderer.drawAll(scale, offsetX, offsetY);
            }
        }
        
        lastDistance = distance;
    } else if (e.touches.length === 1 && lastX) {
        const touch = e.touches[0];
        const dx = touch.clientX - lastX;
        const dy = touch.clientY - lastY;
        
        setOffset(dx, dy);
        
        const { scale, offsetX, offsetY } = getViewport();
        const renderer = getRenderer();
        if (renderer) {
            renderer.drawAll(scale, offsetX, offsetY);
        }
        
        lastX = touch.clientX;
        lastY = touch.clientY;
    }
}

function onTouchEnd(e) {
    e.preventDefault();
    
    if (e.touches.length === 0 && !isDragging) {
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
    // Ignore if in input/textarea
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    const { scale, offsetX, offsetY } = getViewport(); // Get current values
    
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
        case 'f':
            import('../tools/tool-manager.js').then(m => m.setTool('fill-triangle'));
            break;
        case ' ':
            e.preventDefault();
            import('../core/grid.js').then(m => m.toggleGrid());
            break;
        case 'r':
            e.preventDefault();
            resetView();
            break;
        case 'arrowleft':
            e.preventDefault();
            setOffset(20, 0);
            updateAfterPan();
            break;
        case 'arrowright':
            e.preventDefault();
            setOffset(-20, 0);
            updateAfterPan();
            break;
        case 'arrowup':
            e.preventDefault();
            setOffset(0, 20);
            updateAfterPan();
            break;
        case 'arrowdown':
            e.preventDefault();
            setOffset(0, -20);
            updateAfterPan();
            break;
    }
    
    // Undo/Redo with Cmd/Ctrl
    if (e.metaKey || e.ctrlKey) {
        switch(e.key.toLowerCase()) {
            case 'z':
                e.preventDefault();
                if (e.shiftKey) {
                    import('../drawing/history.js').then(m => m.redo());
                } else {
                    import('../drawing/history.js').then(m => m.undo());
                }
                break;
        }
    }
}

function resetView() {
    const { offsetX, offsetY } = getViewport();
    setOffset(-offsetX, -offsetY);
    
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    zoom(1 / scale, centerX, centerY);
    
    updateAfterPan();
    import('./messages.js').then(m => m.addMessage('🔄 View reset'));
}

function updateAfterPan() {
    const { scale, offsetX, offsetY } = getViewport();
    const renderer = getRenderer();
    if (renderer) {
        renderer.drawAll(scale, offsetX, offsetY);
    }
}
