// src/main.js
import { UniversalCoordinateMapper } from './core/UniversalCoordinateMapper.js';
import { PointStore, EdgeStore, FaceStore, CompositeStore } from './core/stores.js';
import { HexelChip } from './core/HexelChip.js';
import { ToolManager } from './tools/ToolManager.js';
import { VertexBrush, EdgeBrush, FaceBrush } from './tools/element-brushes.js';
import { HexelPointBrush, HexelShapeBrush, HexelFillBrush } from './tools/hexel-brushes.js';
import { SelectTool, PanTool } from './tools/ui-tools.js';
import { ToolPalette } from './ui/ToolPalette.js';
import { StatusBar } from './ui/StatusBar.js';
import { PropertyPanel } from './ui/PropertyPanel.js';

class HexelStudio {
    constructor() {
        this.canvas = document.getElementById('main-canvas');

        // Core systems
        this.mapper = new UniversalCoordinateMapper(this.canvas);

        // Storage
        this.stores = {
            points: new PointStore(),
            edges: new EdgeStore(),
            faces: new FaceStore(),
            composite: new CompositeStore(points, edges, faces)
        };

        // Lighthouse chip
        this.chip = new HexelChip();
        this.chip.start(); // Begin ticking

        // Create tools
        const tools = {
            select: new SelectTool(this.mapper, this.stores.composite),
            pan: new PanTool(this.mapper),
            vertex: new VertexBrush(this.mapper, this.stores.points),
            edge: new EdgeBrush(this.mapper, this.stores.edges),
            face: new FaceBrush(this.mapper, this.stores.faces),
            hexelPoint: new HexelPointBrush(this.mapper, this.stores.composite, this.chip),
            hexelShape: new HexelShapeBrush(this.mapper, this.stores.composite, this.chip),
            hexelFill: new HexelFillBrush(this.mapper, this.stores.composite, this.chip)
        };

        // Tool manager
        this.toolManager = new ToolManager(this.mapper, this.stores, this.chip);
        this.toolManager.registerTools(tools);

        // UI
        this.ui = {
            palette: new ToolPalette(this.toolManager),
            status: new StatusBar(this.toolManager, this.mapper, this.chip),
            properties: new PropertyPanel(this.toolManager, this.stores)
        };

        // Start render loop
        this.animate();
    }

    animate() {
        // Update chip
        this.chip.tick();

        // Render grid and elements
        this.render();

        requestAnimationFrame(() => this.animate());
    }

    render() {
        const ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.drawGrid(ctx);

        // Draw all stored elements
        this.drawElements(ctx);
    }

    drawElements(ctx) {
        // Draw faces (back to front)
        this.stores.faces.getAll().forEach(face => {
            // Draw face
        });

        // Draw edges
        this.stores.edges.getAll().forEach(edge => {
            // Draw edge
        });

        // Draw points (front)
        this.stores.points.getAll().forEach(point => {
            const { x, y } = this.mapper.vertexToScreen(point.q, point.r);
            // Draw point
        });
    }
}

// Start when ready
window.addEventListener('load', () => new HexelStudio());
