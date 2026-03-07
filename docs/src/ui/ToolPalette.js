// src/ui/ToolPalette.js
// 🎨 Creates the toolbar UI

export class ToolPalette {
    constructor(toolManager) {
        this.tools = toolManager;
        this.container = null;

        this.init();
    }

    init() {
        // Create container
        this.container = document.createElement('div');
        this.container.id = 'tool-palette';
        this.container.className = 'tool-palette';

        // Define tool groups
        const groups = [
            {
                label: 'UI',
                tools: [
                    { id: 'select', icon: '🔲', name: 'Select' },
                    { id: 'pan', icon: '✋', name: 'Pan' }
                ]
            },
            {
                label: 'Elements',
                tools: [
                    { id: 'vertex', icon: '●', name: 'Vertex' },
                    { id: 'edge', icon: '⎯', name: 'Edge' },
                    { id: 'face', icon: '🔺', name: 'Face' }
                ]
            },
            {
                label: 'Hexel',
                tools: [
                    { id: 'hexelPoint', icon: '🍥', name: 'Hexel Point' },
                    { id: 'hexelShape', icon: '🌀', name: 'Hexel Shape' },
                    { id: 'hexelFill', icon: '🪣', name: 'Hexel Fill' }
                ]
            }
        ];

        // Build HTML
        groups.forEach(group => {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'tool-group';

            const label = document.createElement('div');
            label.className = 'group-label';
            label.textContent = group.label;
            groupDiv.appendChild(label);

            group.tools.forEach(tool => {
                const btn = document.createElement('button');
                btn.id = `tool-${tool.id}`;
                btn.className = 'tool-btn';
                btn.innerHTML = `<span class="tool-icon">${tool.icon}</span> ${tool.name}`;

                btn.onclick = () => {
                    this.tools.setTool(tool.id);
                    this.highlightActive(tool.id);
                };

                groupDiv.appendChild(btn);
            });

            this.container.appendChild(groupDiv);
        });

        document.body.appendChild(this.container);

        // Subscribe to tool changes
        this.tools.subscribe('onToolChange', (toolName) => {
            this.highlightActive(toolName);
        });
    }

    highlightActive(toolName) {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeBtn = document.getElementById(`tool-${toolName}`);
        if (activeBtn) activeBtn.classList.add('active');
    }
}
