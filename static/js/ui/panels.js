import { getRenderer } from '../main.js';
import { getViewport } from '../core/viewport.js';
import { points, lines, triangles } from '../drawing/points.js';

// Properties panel management
export function initPanels() {
    updateStats();
    initSettings();
    initColorPicker();
}

export function updateStats() {
    import('../drawing/points.js').then(m => {
        document.getElementById('stat-points').textContent = m.points.length;
        document.getElementById('status-points').textContent = m.points.length;
    });
    
    import('../drawing/lines.js').then(m => {
        document.getElementById('stat-lines').textContent = m.lines.length;
    });
    
    // Grid size (static for now)
    document.getElementById('stat-grid').textContent = '48px';
    document.getElementById('stat-hexel').textContent = '24';
}

function initSettings() {
    const gridOpacity = document.getElementById('grid-opacity');
    const snapToggle = document.getElementById('snap-toggle');
    
    // In the grid opacity slider handler
    if (gridOpacity) {
        gridOpacity.addEventListener('input', (e) => {
            const opacity = parseFloat(e.target.value);
            
            // IMPORTANT: Import getRenderer at the top of the file!
            const renderer = getRenderer();
            if (renderer) {
                renderer.gridOpacity = opacity;
                const { scale, offsetX, offsetY } = getViewport();
                renderer.drawAll(scale, offsetX, offsetY);
            }
            
            import('../core/grid.js').then(m => m.setGridOpacity(opacity));
        });
    }
    
    if (snapToggle) {
        snapToggle.addEventListener('change', (e) => {
            const snap = e.target.checked;
            
            // Update tool manager if function exists
            import('../tools/tool-manager.js').then(m => {
                if (m.setSnapping) {
                    m.setSnapping(snap);
                } else {
                    console.warn('setSnapping not found in tool-manager.js');
                }
            });
            
            // Update grid if function exists
            import('../core/grid.js').then(m => {
                if (m.setSnapping) {
                    m.setSnapping(snap);
                } else {
                    console.warn('setSnapping not found in grid.js');
                }
            });
        });
    }
}

function initColorPicker() {
    const swatches = document.querySelectorAll('.color-swatch');
    swatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            swatches.forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            
            const color = swatch.dataset.color;
            document.dispatchEvent(new CustomEvent('color-changed', { detail: { color } }));
        });
    });
}

export function showToolProperties(toolName) {
    const propsDiv = document.getElementById('tool-properties');
    if (!propsDiv) return;
    
    // Clear
    propsDiv.innerHTML = '';
    
    // Load tool-specific properties
    switch(toolName) {
        case 'line':
            propsDiv.innerHTML = `
                <div class="coord-display">
                    <div class="section-title">LINE MODE</div>
                    <div class="tool-actions">
                        <button class="tool-btn active" data-line-mode="straight">📏 Straight</button>
                        <button class="tool-btn" data-line-mode="free">🖊️ Free</button>
                    </div>
                </div>
            `;
            break;
        case 'triangle':
            propsDiv.innerHTML = `
                <div class="coord-display">
                    <div class="section-title">TRIANGLE MODE</div>
                    <div class="tool-actions">
                        <button class="tool-btn active" data-triangle-mode="single">△ Single</button>
                        <button class="tool-btn" data-triangle-mode="fill">🎨 Fill</button>
                    </div>
                </div>
            `;
            break;
    }
}
