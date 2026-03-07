// src/ui/PropertyPanel.js
// ⚙️ Tool properties and settings panel

export class PropertyPanel {
    constructor(toolManager, stores, chip) {
        this.tools = toolManager;
        this.stores = stores;
        this.chip = chip;

        this.element = null;
        this.visible = true;

        this.init();
        this.setupListeners();
    }

    init() {
        this.element = document.createElement('div');
        this.element.id = 'property-panel';
        this.element.className = 'property-panel';

        this.updateContent();
        document.body.appendChild(this.element);
    }

    setupListeners() {
        this.tools.subscribe('onToolChange', () => this.updateContent());
        this.chip.subscribe(() => this.updateContent());

        // Update every 500ms for counts
        setInterval(() => this.updateContent(), 500);
    }

    getToolProperties() {
        const tool = this.tools.currentToolName;

        switch(tool) {
            case 'vertex':
                return {
                    icon: '●',
                    name: 'Vertex Brush',
                    description: 'Place individual vertices',
                    settings: [
                        { type: 'slider', name: 'Size', min: 2, max: 20, value: 6, unit: 'px' },
                        { type: 'color', name: 'Color', value: '#ffaa66' },
                        { type: 'checkbox', name: 'Snap to grid', value: true }
                    ]
                };
            case 'edge':
                return {
                    icon: '⎯',
                    name: 'Edge Brush',
                    description: 'Draw edges between vertices',
                    settings: [
                        { type: 'slider', name: 'Width', min: 1, max: 8, value: 2, unit: 'px' },
                        { type: 'color', name: 'Color', value: '#4ecdc4' },
                        { type: 'checkbox', name: 'Continuous drawing', value: true }
                    ]
                };
            case 'face':
                return {
                    icon: '🔺',
                    name: 'Face Brush',
                    description: 'Fill triangular faces',
                    settings: [
                        { type: 'slider', name: 'Opacity', min: 0.1, max: 0.8, step: 0.1, value: 0.3 },
                        { type: 'color', name: 'Color', value: '#96ceb4' }
                    ]
                };
            case 'hexelPoint':
                return {
                    icon: '🍥',
                    name: 'Hexel Point',
                    description: 'Chip-driven single-click composite',
                    settings: [
                        { type: 'readonly', name: 'Chip State', value: this.chip.currentState },
                        { type: 'readonly', name: 'Active Faces', value: `[${this.chip.currentPattern?.activeFaces}]` }
                    ]
                };
            case 'hexelShape':
                return {
                    icon: '🌀',
                    name: 'Hexel Shape',
                    description: 'Drag to build chip-driven shapes',
                    settings: [
                        { type: 'readonly', name: 'Chip State', value: this.chip.currentState },
                        { type: 'checkbox', name: 'Fill interior', value: true }
                    ]
                };
            case 'hexelFill':
                return {
                    icon: '🪣',
                    name: 'Hexel Fill',
                    description: 'Flood fill with chip pattern',
                    settings: [
                        { type: 'readonly', name: 'Chip State', value: this.chip.currentState },
                        { type: 'slider', name: 'Tolerance', min: 0, max: 1, step: 0.1, value: 0.5 }
                    ]
                };
            case 'select':
                return {
                    icon: '🔲',
                    name: 'Select Tool',
                    description: 'Select vertices, edges, or faces',
                    settings: [
                        { type: 'radio', name: 'Mode', options: ['Vertex', 'Edge', 'Face'], value: 'Vertex' }
                    ]
                };
            case 'pan':
                return {
                    icon: '✋',
                    name: 'Pan Tool',
                    description: 'Drag to pan view · Scroll to zoom',
                    settings: [
                        { type: 'readonly', name: 'Offset X', value: this.mapper.offsetX.toFixed(0) },
                        { type: 'readonly', name: 'Offset Y', value: this.mapper.offsetY.toFixed(0) }
                    ]
                };
            default:
                return null;
        }
    }

    updateContent() {
        if (!this.element) return;

        const props = this.getToolProperties();
        const stats = {
            points: this.stores?.points?.count ?? 0,
            edges: this.stores?.edges?.count ?? 0,
            faces: this.stores?.faces?.count ?? 0
        };

        let settingsHtml = '';
        if (props?.settings) {
            settingsHtml = props.settings.map(setting => {
                switch(setting.type) {
                    case 'slider':
                        return `
                            <div class="setting-row">
                                <label>${setting.name}</label>
                                <input type="range" min="${setting.min}" max="${setting.max}"
                                       step="${setting.step || 1}" value="${setting.value}">
                                <span class="value">${setting.value}${setting.unit || ''}</span>
                            </div>
                        `;
                    case 'color':
                        return `
                            <div class="setting-row">
                                <label>${setting.name}</label>
                                <input type="color" value="${setting.value}">
                            </div>
                        `;
                    case 'checkbox':
                        return `
                            <div class="setting-row">
                                <label>
                                    <input type="checkbox" ${setting.value ? 'checked' : ''}>
                                    ${setting.name}
                                </label>
                            </div>
                        `;
                    case 'readonly':
                        return `
                            <div class="setting-row readonly">
                                <span class="label">${setting.name}:</span>
                                <span class="value">${setting.value}</span>
                            </div>
                        `;
                    default:
                        return '';
                }
            }).join('');
        }

        this.element.innerHTML = `
            <div class="panel-header">
                <span class="tool-icon">${props?.icon || '⚙️'}</span>
                <h3>${props?.name || 'Properties'}</h3>
                <button class="close-btn" onclick="this.parentElement.parentElement.style.display='none'">✕</button>
            </div>

            <div class="panel-section">
                <p class="tool-description">${props?.description || 'No tool selected'}</p>
            </div>

            ${props?.settings ? `
                <div class="panel-section">
                    <h4>Settings</h4>
                    ${settingsHtml}
                </div>
            ` : ''}

            <div class="panel-section">
                <h4>Scene Stats</h4>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">● Points</span>
                        <span class="stat-value">${stats.points}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">⎯ Edges</span>
                        <span class="stat-value">${stats.edges}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">🔺 Faces</span>
                        <span class="stat-value">${stats.faces}</span>
                    </div>
                </div>
            </div>

            <div class="panel-section">
                <h4>Chip State</h4>
                <div class="chip-display">
                    <div class="chip-row">
                        <span>State:</span>
                        <span class="chip-value">${this.chip.currentState}</span>
                    </div>
                    <div class="chip-row">
                        <span>Pattern:</span>
                        <span class="chip-value">[${this.chip.currentPattern?.activeFaces}]</span>
                    </div>
                    <div class="chip-row">
                        <span>Mask:</span>
                        <span class="chip-value">0b${this.chip.currentPattern?.vertexMask?.toString(2).padStart(7, '0')}</span>
                    </div>
                </div>
            </div>
        `;
    }

    toggle() {
        this.visible = !this.visible;
        this.element.style.display = this.visible ? 'block' : 'none';
    }
}
