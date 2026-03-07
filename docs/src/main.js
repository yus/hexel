// src/main.js
// 🍥 HEXEL STUDIO — Main Entry Point

import { UniversalCoordinateMapper } from '/hexel/src/core/UniversalCoordinateMapper.js';
import { PointStore } from '/hexel/src/core/PointStore.js';
import { EdgeStore } from '/hexel/src/core/EdgeStore.js';
import { FaceStore } from '/hexel/src/core/FaceStore.js';
import { CompositeStore } from '/hexel/src/core/CompositeStore.js';
import { HexelChip } from '/hexel/src/core/HexelChip.js';

import { ToolManager } from '/hexel/src/tools/ToolManager.js';
import { VertexBrush } from '/hexel/src/tools/VertexBrush.js';
import { EdgeBrush } from '/hexel/src/tools/EdgeBrush.js';
import { FaceBrush } from '/hexel/src/tools/FaceBrush.js';
import { HexelPointBrush } from '/hexel/src/tools/HexelPointBrush.js';
import { HexelShapeBrush } from '/hexel/src/tools/HexelShapeBrush.js';
import { HexelFillBrush } from '/hexel/src/tools/HexelFillBrush.js';
import { SelectTool } from '/hexel/src/tools/SelectTool.js';
import { PanTool } from '/hexel/src/tools/PanTool.js';

import { ToolPalette } from '/hexel/src/ui/ToolPalette.js';
import { StatusBar } from '/hexel/src/ui/StatusBar.js';
import { PropertyPanel } from '/hexel/src/ui/PropertyPanel.js';
import { EventManager } from '/hexel/src/ui/events.js';

class HexelStudio {
    constructor() {
        console.log('🍥 HEXEL STUDIO initializing...');
        
        // Get canvas
        this.canvas = document.getElementById('main-canvas');
        if (!this.canvas) {
            console.error('Canvas not found!');
            return;
        }
        
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Core systems
        this.mapper = new UniversalCoordinateMapper(this.canvas);
        
        // Storage
        this.stores = {
            points: new PointStore(),
            edges: new EdgeStore(),
            faces: new FaceStore()
        };
        this.stores.composite = new CompositeStore(
            this.stores.points,
            this.stores.edges,
            this.stores.faces
        );
        
        // Lighthouse chip
        this.chip = new HexelChip(1000); // Tick every second
        this.startChip();
        
        // Create all tools
        this.tools = this.createTools();
        
        // Tool manager
        this.toolManager = new ToolManager(this.mapper, this.stores, this.chip);
        this.toolManager.registerTools(this.tools);
        
        // Set default tool
        this.toolManager.setTool('pan');
        
        // UI Components
        this.ui = {
            palette: new ToolPalette(this.toolManager),
            status: new StatusBar(this.toolManager, this.mapper, this.chip, this.stores),
            properties: new PropertyPanel(this.toolManager, this.stores, this.chip)
        };
        
        // Event manager
        this.events = new EventManager(this.canvas, this.toolManager, this.mapper);
        
        // Start render loop
        this.animate();
        
        console.log('✨ HEXEL STUDIO ready!');
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createTools() {
        return {
            // UI tools
            select: new SelectTool(this.mapper, this.stores.composite),
            pan: new PanTool(this.mapper),
            
            // Element brushes
            vertex: new VertexBrush(this.mapper, this.stores.points),
            edge: new EdgeBrush(this.mapper, this.stores.edges),
            face: new FaceBrush(this.mapper, this.stores.faces),
            
            // Composite brushes
            hexelPoint: new HexelPointBrush(this.mapper, this.stores.composite, this.chip),
            hexelShape: new HexelShapeBrush(this.mapper, this.stores.composite, this.chip),
            hexelFill: new HexelFillBrush(this.mapper, this.stores.composite, this.chip)
        };
    }
    
    startChip() {
        const tick = () => {
            this.chip.tick();
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }
    
    animate() {
        this.render();
        requestAnimationFrame(() => this.animate());
    }
    
    render() {
        const ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid (temporary simple grid)
        this.drawGrid(ctx);
        
        // Draw all stored elements
        this.drawElements(ctx);
    }
    
    drawGrid(ctx) {
        // Simple grid for now — will be replaced with proper WebGL shader
        ctx.strokeStyle = '#b388ff';
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.2;
        
        // Draw a few lines to show grid is working
        const centerX = this.canvas.width / 2 + this.mapper.offsetX;
        const centerY = this.canvas.height / 2 + this.mapper.offsetY;
        
        ctx.beginPath();
        for (let i = -10; i <= 10; i++) {
            const y = centerY + i * 40 * this.mapper.scale;
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
        }
        ctx.stroke();
    }
    
    drawElements(ctx) {
        // Draw points
        this.stores.points.getAll().forEach(point => {
            const { x, y } = this.mapper.vertexToScreen(point.q, point.r);
            
            ctx.fillStyle = point.color || '#ffaa66';
            ctx.beginPath();
            ctx.arc(x, y, (point.size || 6) * Math.sqrt(this.mapper.scale), 0, Math.PI*2);
            ctx.fill();
            
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        });
        
        // Draw edges (simplified)
        this.stores.edges.getAll().forEach(edge => {
            const p1 = this.mapper.vertexToScreen(edge.q1, edge.r1);
            const p2 = this.mapper.vertexToScreen(edge.q2, edge.r2);
            
            ctx.strokeStyle = edge.color || '#4ecdc4';
            ctx.lineWidth = (edge.width || 2) * Math.sqrt(this.mapper.scale);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        });
    }
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.studio = new HexelStudio();
});
