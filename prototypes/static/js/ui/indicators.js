// Visual indicators (zoom, messages, etc)
let zoomTimeout;
let messageQueue = [];

export function initIndicators() {
    // Create zoom indicator if it doesn't exist
    if (!document.getElementById('zoom-indicator')) {
        const indicator = document.createElement('div');
        indicator.id = 'zoom-indicator';
        indicator.className = 'zoom-indicator';
        document.body.appendChild(indicator);
    }
    
    // Create message area if it doesn't exist
    if (!document.getElementById('message-area')) {
        const msgArea = document.createElement('div');
        msgArea.id = 'message-area';
        document.body.appendChild(msgArea);
    }
}

export function showZoomIndicator() {
    const indicator = document.getElementById('zoom-indicator');
    if (!indicator) return;
    
    import('../core/viewport.js').then(({ getViewport }) => {
        const { scale } = getViewport();
        const percent = Math.round(scale * 100);
        
        indicator.textContent = `${percent}%`;
        indicator.classList.add('visible');
        
        // Add zoom bar
        let zoomBar = indicator.querySelector('.zoom-bar');
        if (!zoomBar) {
            zoomBar = document.createElement('div');
            zoomBar.className = 'zoom-bar';
            indicator.appendChild(zoomBar);
        }
        
        // Update zoom bar width (0.2 to 10 scale range)
        const minZoom = 20;
        const maxZoom = 1000;
        const percentOfMax = (scale * 100 - minZoom) / (maxZoom - minZoom) * 100;
        zoomBar.style.width = `${Math.min(100, Math.max(0, percentOfMax))}%`;
        
        clearTimeout(zoomTimeout);
        zoomTimeout = setTimeout(() => {
            indicator.classList.remove('visible');
        }, 1000);
    });
}

export function showCoordinates(x, y, hexel) {
    const coordIndicator = document.getElementById('coord-indicator');
    if (!coordIndicator) return;
    
    coordIndicator.innerHTML = `
        <span>📍 ${x.toFixed(0)}, ${y.toFixed(0)}</span>
        <span>⬟ (${hexel.q}, ${hexel.r})</span>
    `;
}

export function showTooltip(text, x, y, duration = 2000) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y - 30}px`;
    
    document.body.appendChild(tooltip);
    
    setTimeout(() => {
        tooltip.classList.add('fade-out');
        setTimeout(() => tooltip.remove(), 300);
    }, duration);
}

export function showProgress(message, percent) {
    const progressBar = document.getElementById('progress-bar');
    if (!progressBar) return;
    
    progressBar.style.width = `${percent}%`;
    progressBar.setAttribute('data-message', message);
    progressBar.classList.add('visible');
    
    if (percent >= 100) {
        setTimeout(() => {
            progressBar.classList.remove('visible');
        }, 500);
    }
}

export function showLoading(show = true) {
    const loader = document.getElementById('loading-indicator');
    if (!loader) return;
    
    if (show) {
        loader.classList.add('visible');
    } else {
        loader.classList.remove('visible');
    }
}

export function showGridInfo() {
    import('../core/viewport.js').then(({ getViewport }) => {
        import('../utils/constants.js').then(({ H_STEP, V_STEP }) => {
            const { scale } = getViewport();
            
            const info = document.getElementById('grid-info');
            if (!info) return;
            
            info.innerHTML = `
                <div>Grid: ${(H_STEP * scale).toFixed(1)}px × ${(V_STEP * scale).toFixed(1)}px</div>
                <div>Zoom: ${(scale * 100).toFixed(0)}%</div>
            `;
        });
    });
}

// Add CSS for indicators
const style = document.createElement('style');
style.textContent = `
    .zoom-indicator {
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(20, 20, 28, 0.9);
        border: 1px solid var(--accent);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
        z-index: 200;
        opacity: 0;
        transition: opacity 0.2s;
        backdrop-filter: blur(4px);
        min-width: 80px;
        text-align: center;
        overflow: hidden;
    }
    
    .zoom-indicator.visible {
        opacity: 1;
    }
    
    .zoom-bar {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: var(--accent);
        transition: width 0.2s;
    }
    
    .tooltip {
        position: fixed;
        background: var(--ui-bg);
        border: 1px solid var(--accent);
        color: var(--text);
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 12px;
        pointer-events: none;
        z-index: 1000;
        animation: tooltipFadeIn 0.2s;
        box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
    }
    
    @keyframes tooltipFadeIn {
        from { opacity: 0; transform: translateY(5px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .tooltip.fade-out {
        opacity: 0;
        transition: opacity 0.3s;
    }
    
    #progress-bar {
        position: fixed;
        top: 0;
        left: 0;
        height: 3px;
        background: var(--accent);
        width: 0;
        transition: width 0.3s;
        z-index: 1000;
        opacity: 0;
    }
    
    #progress-bar.visible {
        opacity: 1;
    }
    
    #loading-indicator {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        border: 3px solid var(--ui-border);
        border-top-color: var(--accent);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        z-index: 1000;
        display: none;
    }
    
    #loading-indicator.visible {
        display: block;
    }
    
    @keyframes spin {
        to { transform: translate(-50%, -50%) rotate(360deg); }
    }
    
    #grid-info {
        position: fixed;
        bottom: 50px;
        left: 20px;
        background: rgba(20, 20, 28, 0.8);
        border: 1px solid var(--ui-border);
        padding: 8px 12px;
        font-size: 11px;
        font-family: 'JetBrains Mono', monospace;
        color: var(--text-dim);
        border-radius: 4px;
        backdrop-filter: blur(4px);
        z-index: 150;
    }
`;

document.head.appendChild(style);
