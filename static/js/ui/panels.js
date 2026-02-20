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
    
    // Grid size
    document.getElementById('stat-grid').textContent = '48px';
    document.getElementById('stat-hexel').textContent = '24';
}

function initSettings() {
    const gridOpacity = document.getElementById('grid-opacity');
    const snapToggle = document.getElementById('snap-toggle');
    
    if (gridOpacity) {
        gridOpacity.addEventListener('input', (e) => {
            const opacity = parseFloat(e.target.value);
            // Will be used in grid drawing
            import('../core/grid.js').then(m => m.setGridOpacity(opacity));
        });
    }
    
    if (snapToggle) {
        snapToggle.addEventListener('change', (e) => {
            const snap = e.target.checked;
            import('../tools/tool-manager.js').then(m => m.setSnapping(snap));
            import('../core/grid.js').then(m => m.setSnapping(snap));
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
