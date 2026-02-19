import { gridCtx } from './canvas.js';
import { H_STEP, V_STEP } from '../utils/constants.js';
import { screenToHexel } from './hexel.js';
import { points } from '../drawing/points.js';

// Zoom configuration - YOUR BRILLIANT DISCOVERY!
const zoomConfig = [
    { max: 0.5, horiz: { alpha: 0.15, width: 0.3 }, diag: { alpha: 0.1, width: 0.2 } },
    { max: 1.0, horiz: { alpha: 0.15, width: 0.3 }, diag: { alpha: 0.1, width: 0.3 } },
    { max: Infinity, horiz: { alpha: 0.15, width: (scale) => 0.5 / scale }, diag: { alpha: 0.1, width: (scale) => 0.5 / scale } }
];

export function drawGrid(scale, offsetX, offsetY, gridEnabled) {
    gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
    
    if (!gridEnabled) return;
    
    gridCtx.save();
    gridCtx.translate(gridCanvas.width / 2 + offsetX, gridCanvas.height / 2 + offsetY);
    gridCtx.scale(scale, scale);
    
    // Get config for current zoom
    const config = zoomConfig.find(c => scale < c.max);
    const horiz = config.horiz;
    const diag = config.diag;
    
    // Base color
    const gridColor = 'rgba(200, 147, 210,';
    
    // Calculate visible range
    const left = -gridCanvas.width / 2 / scale;
    const right = gridCanvas.width / 2 / scale;
    const top = -gridCanvas.height / 2 / scale;
    const bottom = gridCanvas.height / 2 / scale;
    
    const startCol = Math.floor(left / H_STEP) - 2;
    const endCol = Math.ceil(right / H_STEP) + 2;
    const startRow = Math.floor(top / V_STEP) - 2;
    const endRow = Math.ceil(bottom / V_STEP) + 2;
    
    // Update UI
    updateGridUI(scale, offsetX, offsetY);
    
    // Draw horizontals
    drawHorizontals(startRow, endRow, left, right, gridColor, horiz);
    
    // Draw diagonals
    const tan60 = Math.tan(60 * Math.PI / 180);
    drawDiagonals(startRow, endRow, startCol, endCol, left, right, gridColor, diag, tan60, true);
    drawDiagonals(startRow, endRow, startCol, endCol, left, right, gridColor, diag, tan60, false);
    
    // Draw vertices
    drawVertices(startRow, endRow, startCol, endCol);
    
    // Draw origin
    gridCtx.fillStyle = '#ffffff';
    gridCtx.globalAlpha = 0.3;
    gridCtx.beginPath();
    gridCtx.arc(0, 0, 3, 0, Math.PI * 2);
    gridCtx.fill();
    
    gridCtx.restore();
}

function drawHorizontals(startRow, endRow, left, right, gridColor, horiz) {
    gridCtx.beginPath();
    gridCtx.strokeStyle = `${gridColor}${horiz.alpha})`;
    gridCtx.lineWidth = typeof horiz.width === 'function' ? horiz.width(scale) : horiz.width;
    
    for (let row = startRow; row <= endRow; row++) {
        const y = row * V_STEP;
        gridCtx.moveTo(left * scale, y);
        gridCtx.lineTo(right * scale, y);
    }
    gridCtx.stroke();
}

function drawDiagonals(startRow, endRow, startCol, endCol, left, right, gridColor, diag, tan60, positive) {
    gridCtx.beginPath();
    gridCtx.strokeStyle = `${gridColor}${diag.alpha})`;
    gridCtx.lineWidth = typeof diag.width === 'function' ? diag.width(scale) : diag.width;
    
    for (let row = startRow - 3; row <= endRow + 3; row++) {
        const rowOffset = (row % 2 === 0) ? 0 : H_STEP / 2;
        const baseY = row * V_STEP;
        
        for (let col = startCol - 3; col <= endCol + 3; col++) {
            const x = col * H_STEP + rowOffset;
            
            if (positive) {
                gridCtx.moveTo(x - 1000, baseY - 1000 * tan60);
                gridCtx.lineTo(x + 1000, baseY + 1000 * tan60);
            } else {
                gridCtx.moveTo(x - 1000, baseY + 1000 * tan60);
                gridCtx.lineTo(x + 1000, baseY - 1000 * tan60);
            }
        }
    }
    gridCtx.stroke();
}

function drawVertices(startRow, endRow, startCol, endCol) {
    gridCtx.fillStyle = '#b388ff';
    gridCtx.globalAlpha = 0.1;
    
    for (let row = startRow; row <= endRow; row++) {
        const baseY = row * V_STEP;
        const rowOffset = (row % 2 !== 0) ? H_STEP / 2 : 0;
        
        for (let col = startCol; col <= endCol; col++) {
            const x = col * H_STEP + rowOffset;
            
            gridCtx.beginPath();
            gridCtx.arc(x, baseY, 1.0, 0, Math.PI * 2);
            gridCtx.fill();
        }
    }
}

function updateGridUI(scale, offsetX, offsetY) {
    const centerHexel = screenToHexel(window.innerWidth/2, window.innerHeight/2);
    
    document.getElementById('world-coord').textContent = 
        `${(-offsetX / H_STEP).toFixed(2)}, ${(-offsetY / V_STEP).toFixed(2)}`;
    document.getElementById('hexel-coord').textContent = `(${centerHexel.q}, ${centerHexel.r})`;
    document.getElementById('zoom-value').textContent = scale.toFixed(2) + 'x';
    document.getElementById('status-zoom').textContent = scale.toFixed(2) + 'x';
    document.getElementById('status-hexel').textContent = `${centerHexel.q},${centerHexel.r}`;
    document.getElementById('status-points').textContent = points.length;
    document.getElementById('stat-points').textContent = points.length;
}

// Export Grid State
let gridEnabled = true; // Your existing variable

export function getGridState() {
    return gridEnabled;
}

export function setGridState(enabled) {
    gridEnabled = enabled;
}

export function toggleGridState() {
    gridEnabled = !gridEnabled;
    return gridEnabled;
}
