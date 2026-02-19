import { PointTool } from './point-tool.js';
import { LineTool } from './line-tool.js';
import { SelectTool } from './select-tool.js';
import { TriangleTool } from './triangle-tool.js';

let currentTool = 'point';
let activeTool = null;

const tools = {
    point: new PointTool(),
    line: new LineTool(),
    triangle: new TriangleTool(),
    select: new SelectTool()
};

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
