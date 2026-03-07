// src/ui/StatusBar.js
// 📊 Real-time status bar showing tool, position, chip state, and counts

export class StatusBar {
    constructor(toolManager, mapper, chip, stores) {
        this.tools = toolManager;
        this.mapper = mapper;
        this.chip = chip;
        this.stores = stores;

        this.element = null;
        this.lastMousePos = { x: 0, y: 0 };

        this.init();
        this.setupListeners();
    }

    init() {
        // Create status bar container
        this.element = document.createElement('div');
        this.element.id = 'status-bar';
        this.element.className = 'status-bar';

        // Initial content
        this.updateContent();

        document.body.appendChild(this.element);
    }

    setupListeners() {
        // Track mouse position
        document.addEventListener('mousemove', (e) => {
            this.lastMousePos = { x: e.clientX, y: e.clientY };
            this.updateContent();
        });

        // Update on tool change
        this.tools.subscribe('onToolChange', () => this.updateContent());

        // Update on chip tick
        this.chip.subscribe(() => this.updateContent());

        // Periodic update for counts
        setInterval(() => this.updateContent(), 100);
    }

    getGridPosition() {
        if (!this.mapper.canvas) return '—, —';

        const rect = this.mapper.canvas.getBoundingClientRect();
        const screenX = this.lastMousePos.x - rect.left;
        const screenY = this.lastMousePos.y - rect.top;

        if (screenX < 0 || screenX > this.mapper.canvas.width ||
            screenY < 0 || screenY > this.mapper.canvas.height) {
            return '—, —';
        }

        const grid = this.mapper.screenToGrid(screenX, screenY);
        return `${grid.x.toFixed(2)}, ${grid.y.toFixed(2)}`;
    }

    getNearestVertex() {
        if (!this.mapper.canvas) return '—';

        const rect = this.mapper.canvas.getBoundingClientRect();
        const screenX = this.lastMousePos.x - rect.left;
        const screenY = this.lastMousePos.y - rect.top;

        if (screenX < 0 || screenX > this.mapper.canvas.width ||
            screenY < 0 || screenY > this.mapper.canvas.height) {
            return '—';
        }

        const vertex = this.mapper.screenToVertex(screenX, screenY, 30);
        return vertex ? `(${vertex.q}, ${vertex.r})` : '—';
    }

    updateContent() {
        if (!this.element) return;

        const tool = this.tools.currentToolName || 'none';
        const chipState = this.chip?.currentState ?? 0;
        const gridPos = this.getGridPosition();
        const vertex = this.getNearestVertex();

        const points = this.stores?.points?.count ?? 0;
        const edges = this.stores?.edges?.count ?? 0;
        const faces = this.stores?.faces?.count ?? 0;

        this.element.innerHTML = `
            <div class="status-item tool">
                <span class="status-icon">🖌️</span>
                <span class="status-label">Tool:</span>
                <span class="status-value">${tool}</span>
            </div>
            <div class="status-item chip">
                <span class="status-icon">🍥</span>
                <span class="status-label">Chip:</span>
                <span class="status-value">${chipState}</span>
            </div>
            <div class="status-item position">
                <span class="status-icon">📍</span>
                <span class="status-label">Grid:</span>
                <span class="status-value">${gridPos}</span>
            </div>
            <div class="status-item vertex">
                <span class="status-icon">●</span>
                <span class="status-label">Vertex:</span>
                <span class="status-value">${vertex}</span>
            </div>
            <div class="status-item counts">
                <span class="status-icon">📊</span>
                <span class="status-label">P:</span>
                <span class="status-value">${points}</span>
                <span class="status-label">E:</span>
                <span class="status-value">${edges}</span>
                <span class="status-label">F:</span>
                <span class="status-value">${faces}</span>
            </div>
            <div class="status-item zoom">
                <span class="status-icon">🔍</span>
                <span class="status-label">Zoom:</span>
                <span class="status-value">${(this.mapper.scale * 100).toFixed(0)}%</span>
            </div>
        `;
    }
}
