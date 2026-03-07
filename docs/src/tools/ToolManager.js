// src/tools/ToolManager.js
// 🎮 Central controller for all tools — with full guards

export class ToolManager {
    constructor(mapper, stores, chip) {
        this.mapper = mapper;
        this.stores = stores || {};
        this.chip = chip;
        
        // Guard against undefined
        if (!this.mapper) {
            console.warn('ToolManager: mapper is undefined');
        }
        
        // All available tools
        this.tools = {};
        this.currentTool = null;
        this.currentToolName = null;
        
        // UI event listeners
        this.listeners = {
            onToolChange: [],
            onHover: [],
            onSelect: []
        };
        
        // Drag state
        this._isDragging = false;
    }
    
    // Register all tools
    registerTools(toolInstances) {
        if (!toolInstances) {
            console.warn('ToolManager.registerTools: no tools provided');
            return;
        }
        
        Object.assign(this.tools, toolInstances);
        console.log(`✅ Registered ${Object.keys(toolInstances).length} tools`);
        
        // Set default tool if available
        if (this.tools.select) {
            this.setTool('select');
        } else if (this.tools.pan) {
            this.setTool('pan');
        }
    }
    
    // Switch active tool
    setTool(toolName) {
        if (!this.tools[toolName]) {
            console.warn(`ToolManager: tool "${toolName}" not found`);
            return false;
        }
        
        // Deactivate current tool safely
        if (this.currentTool && typeof this.currentTool.deactivate === 'function') {
            try {
                this.currentTool.deactivate();
            } catch (e) {
                console.warn('Error deactivating tool:', e);
            }
        }
        
        // Activate new tool safely
        this.currentTool = this.tools[toolName];
        this.currentToolName = toolName;
        
        if (this.currentTool && typeof this.currentTool.activate === 'function') {
            try {
                this.currentTool.activate();
            } catch (e) {
                console.warn('Error activating tool:', e);
            }
        }
        
        // Notify UI
        this.notifyListeners('onToolChange', toolName);
        
        console.log(`🔧 Switched to tool: ${toolName}`);
        return true;
    }
    
    // Get current tool
    getCurrentTool() {
        return this.currentTool;
    }
    
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
    
    // === EVENT DELEGATION ===
    
    onMouseDown(x, y, event) {
        if (!this.currentTool) {
            console.warn('ToolManager: no current tool');
            return null;
        }
        
        try {
            // Check for drag start
            if (typeof this.currentTool.onDragStart === 'function') {
                this._isDragging = true;
                return this.currentTool.onDragStart(x, y, event);
            } 
            // Fallback to click
            else if (typeof this.currentTool.onClick === 'function') {
                return this.currentTool.onClick(x, y, event);
            }
        } catch (e) {
            console.warn('Error in onMouseDown:', e);
        }
        
        return null;
    }
    
    onMouseMove(x, y, event) {
        if (!this.currentTool) return null;
        
        try {
            // Always call hover if available
            if (typeof this.currentTool.onHover === 'function') {
                const hoverResult = this.currentTool.onHover(x, y, event);
                this.notifyListeners('onHover', hoverResult);
            }
            
            // Handle drag if active
            if (this._isDragging && typeof this.currentTool.onDragMove === 'function') {
                return this.currentTool.onDragMove(x, y, event);
            }
        } catch (e) {
            console.warn('Error in onMouseMove:', e);
        }
        
        return null;
    }
    
    onMouseUp(x, y, event) {
        if (!this.currentTool) return null;
        
        try {
            if (this._isDragging && typeof this.currentTool.onDragEnd === 'function') {
                const result = this.currentTool.onDragEnd(x, y, event);
                this._isDragging = false;
                return result;
            }
        } catch (e) {
            console.warn('Error in onMouseUp:', e);
        }
        
        return null;
    }
    
    onClick(x, y, event) {
        if (!this.currentTool) return null;
        
        try {
            if (typeof this.currentTool.onClick === 'function') {
                return this.currentTool.onClick(x, y, event);
            }
        } catch (e) {
            console.warn('Error in onClick:', e);
        }
        
        return null;
    }
    
    // Drag state management
    onDragStart(x, y, event) {
        this._isDragging = true;
        return this.onMouseDown(x, y, event);
    }
    
    onDragMove(x, y, event) {
        return this.onMouseMove(x, y, event);
    }
    
    onDragEnd(x, y, event) {
        return this.onMouseUp(x, y, event);
    }
    
    // === UI SUBSCRIPTION ===
    
    subscribe(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }
    
    notifyListeners(event, data) {
        if (!this.listeners[event]) return;
        
        this.listeners[event].forEach(cb => {
            try {
                cb(data);
            } catch (e) {
                console.warn(`Error in ${event} listener:`, e);
            }
        });
    }
    
    // === UTILITY ===
    
    // Force redraw of current tool preview
    refresh() {
        if (this.currentTool && typeof this.currentTool.refresh === 'function') {
            this.currentTool.refresh();
        }
    }
}
