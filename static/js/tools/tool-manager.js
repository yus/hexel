import { PointTool } from './point-tool.js';
import { LineTool } from './line-tool.js';
import { SelectTool } from './select-tool.js';
import { TriangleTool } from './triangle-tool.js';
import { HexagonTool } from './hexagon-tool.js';
import { FillTriangleTool } from './fill-tools.js';
import { PanTool } from './pan-tool.js';

const tools = {
    point: new PointTool(),
    line: new LineTool(),
    triangle: new TriangleTool(),
    select: new SelectTool(),
    hexagon: new HexagonTool(),
    'fill-triangle': new FillTriangleTool(),
    pan: new PanTool()
};

let currentTool = 'point';
let activeTool = tools.point;

let snappingEnabled = true;

export function setSnapping(enabled) {
    snappingEnabled = enabled;
    console.log('Snapping:', enabled);
}

export function getSnapping() {
    return snappingEnabled;
}

export function setTool(toolName) {
    console.log('Switching tool to:', toolName);
    
    // Deactivate current tool if it has the method
    if (activeTool && typeof activeTool.deactivate === 'function') {
        activeTool.deactivate();
    }
    
    // Set new tool
    currentTool = toolName;
    activeTool = tools[toolName];
    
    // Activate new tool if it has the method
    if (activeTool && typeof activeTool.activate === 'function') {
        activeTool.activate();
    }
    
    // Update UI
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === toolName);
    });
}

export function getCurrentTool() {
    return activeTool;
}

export function handleToolAction(action, ...args) {
    if (!activeTool) return;
    
    const fn = activeTool[action];
    if (typeof fn === 'function') {
        return fn.apply(activeTool, args);
    } else {
        console.log(`Tool ${currentTool} has no ${action} method`);
    }
}
