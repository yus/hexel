// src/tools/ToolManager.js
// 🎮 Central controller for all tools — switches, activates, delegates

export class ToolManager {
    constructor(mapper, stores, chip) {
        this.mapper = mapper;
        this.stores = stores; // { points, edges, faces, composite }
        this.chip = chip;

        // All available tools
        this.tools = {
            // UI tools (always available)
            select: null,
            pan: null,

            // Element brushes (a, b, c)
            vertex: null,
            edge: null,
            face: null,

            // Composite brushes (d, e, f)
            hexelPoint: null,
            hexelShape: null,
            hexelFill: null
        };

        this.currentTool = null;
        this.currentToolName = null;

        // UI event listeners
        this.listeners = {
            onToolChange: [],
            onHover: [],
            onSelect: []
        };
    }

    // Register all tools (call after creating them)
    registerTools(toolInstances) {
        Object.assign(this.tools, toolInstances);

        // Set default tool
        if (this.tools.select) {
            this.setTool('select');
        } else if (this.tools.pan) {
            this.setTool('pan');
        }
    }

    // Switch active tool
    setTool(toolName) {
        if (!this.tools[toolName]) {
            console.warn(`Tool "${toolName}" not found`);
            return false;
        }
    
        // Deactivate current tool safely
        if (this.currentTool && typeof this.currentTool.deactivate === 'function') {
            this.currentTool.deactivate();
        }
    
        // Activate new tool safely
        this.currentTool = this.tools[toolName];
        this.currentToolName = toolName;
    
        if (typeof this.currentTool.activate === 'function') {
            this.currentTool.activate();
        }
    
        // Notify UI
        this.notifyListeners('onToolChange', toolName);
    
        return true;
    }

    // Get current tool
    getCurrentTool() {
        return this.currentTool;
    }

    // === EVENT DELEGATION ===
    // Call these from your canvas event handlers

    onMouseDown(x, y, event) {
        if (!this.currentTool) return;

        if (this.currentTool.onDragStart) {
            return this.currentTool.onDragStart(x, y, event);
        } else if (this.currentTool.onClick) {
            // Single-click tools
            return this.currentTool.onClick(x, y, event);
        }
    }

    onMouseMove(x, y, event) {
        if (!this.currentTool) return;

        // Always call hover if available
        if (this.currentTool.onHover) {
            const hoverResult = this.currentTool.onHover(x, y, event);
            this.notifyListeners('onHover', hoverResult);
        }

        // Handle drag
        if (this.currentTool.onDragMove && this._isDragging) {
            return this.currentTool.onDragMove(x, y, event);
        }
    }

    onMouseUp(x, y, event) {
        if (!this.currentTool) return;

        if (this.currentTool.onDragEnd) {
            const result = this.currentTool.onDragEnd(x, y, event);
            this._isDragging = false;
            return result;
        }
    }

    // Track drag state
    _isDragging = false;

    onDragStart(x, y, event) {
        this._isDragging = true;
        return this.onMouseDown(x, y, event);
    }

    // === TOOL-SPECIFIC HELPERS ===

    // Get tool by name
    getTool(name) {
        return this.tools[name];
    }

    // Check if current tool is of a certain type
    isCurrent(toolName) {
        return this.currentToolName === toolName;
    }

    // Get all tool names
    getToolNames() {
        return Object.keys(this.tools);
    }

    // === UI SUBSCRIPTION ===

    subscribe(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    notifyListeners(event, data) {
        this.listeners[event].forEach(cb => cb(data));
    }
}
