import { PointTool } from './point-tool.js';
import { LineTool } from './line-tool.js';
import { SelectTool } from './select-tool.js';
import { TriangleTool } from './triangle-tool.js';
import { HexagonTool } from './hexagon-tool.js';
import { FillTriangleTool } from './fill-tools.js'; 

const tools = {
    point: new PointTool(),
    line: new LineTool(),
    triangle: new TriangleTool(),
    select: new SelectTool(),
    hexagon: new HexagonTool(),
    'fill-triangle': new FillTriangleTool()
};

let currentTool = 'point';
let activeTool = tools[currentTool]; // Initialize with default tool!
// let activeTool = null;

export function setTool(toolName) {
    if (activeTool) {
        activeTool.deactivate();
    }
    
    currentTool = toolName;
    activeTool = tools[toolName];
    activeTool.activate();
    
    // Update UI
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === toolName);
    });
}

export function handleToolAction(event, type, ...args) {
    if (activeTool && activeTool[type]) {
        return activeTool[type](...args);
    }
}

// Add at the bottom
let snappingEnabled = true;

export function setSnapping(enabled) {
    snappingEnabled = enabled;
    console.log('Tool snapping:', enabled);
    
    // You can pass this to active tool if needed
    if (activeTool && activeTool.setSnapping) {
        activeTool.setSnapping(enabled);
    }
}

export function getSnapping() {
    return snappingEnabled;
}
