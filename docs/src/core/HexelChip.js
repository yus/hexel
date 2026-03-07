// src/core/HexelChip.js
// 🍥 The Lighthouse Clock — Combinatorial Heart of HEXEL

export class HexelChip {
    constructor(updateIntervalMs = 1000) {
        this.clock = 0;              // Current state (0-7)
        this.interval = updateIntervalMs;
        this.lastTick = Date.now();
        this.isRunning = true;
        this.listeners = [];
        
        // The 7447-inspired truth table
        // 3-bit input (0-7) → active faces
        this.patternTable = [
            [0],           // 000: Face 0 only
            [1],           // 001: Face 1 only
            [2],           // 010: Face 2 only
            [3],           // 011: Face 3 only
            [4],           // 100: Face 4 only
            [5],           // 101: Face 5 only
            [0,1,2,3,4,5], // 110: ALL faces (center burst)
            [0,2,4]        // 111: Alternating pattern
        ];
        
        // Vertex mask for each pattern (7 bits: 0=center, 1-6=outer)
        this.vertexMasks = [
            0b0000001, // Face 0: center only
            0b0000001, // Face 1: center only
            0b0000001, // Face 2: center only
            0b0000001, // Face 3: center only
            0b0000001, // Face 4: center only
            0b0000001, // Face 5: center only
            0b1111111, // All faces: all vertices
            0b0010101  // Alternating: vertices 0,2,4
        ];
        
        // Current pattern
        this.currentPattern = {
            state: 0,
            activeFaces: this.patternTable[0],
            vertexMask: this.vertexMasks[0],
            intensity: 1.0
        };
    }
    
    // Call this on every animation frame
    tick(now = Date.now()) {
        if (!this.isRunning) return;
        
        if (now - this.lastTick > this.interval) {
            this.clock = (this.clock + 1) % 8;
            this.lastTick = now;
            
            // Update current pattern
            this.currentPattern = {
                state: this.clock,
                activeFaces: [...this.patternTable[this.clock]],
                vertexMask: this.vertexMasks[this.clock],
                intensity: this.calculateIntensity()
            };
            
            this.notifyListeners();
        }
    }
    
    calculateIntensity() {
        // Smooth pulse based on time
        const ms = Date.now() % 2000;
        return ms < 1000 ? ms / 1000 : (2000 - ms) / 1000;
    }
    
    // Get current brush state
    getBrushState() {
        return { ...this.currentPattern };
    }
    
    // Get pattern for a specific offset (for hexel brushes)
    getPatternAtOffset(offset = 0) {
        const state = (this.clock + offset) % 8;
        return {
            state,
            activeFaces: [...this.patternTable[state]],
            vertexMask: this.vertexMasks[state],
            intensity: this.calculateIntensity()
        };
    }
    
    // Subscribe to state changes
    subscribe(callback) {
        this.listeners.push(callback);
    }
    
    notifyListeners() {
        this.listeners.forEach(cb => cb(this.currentPattern));
    }
    
    // Control methods
    start() { this.isRunning = true; }
    pause() { this.isRunning = false; }
    
    setState(newState) {
        this.clock = newState % 8;
        this.currentPattern = {
            state: this.clock,
            activeFaces: [...this.patternTable[this.clock]],
            vertexMask: this.vertexMasks[this.clock],
            intensity: this.calculateIntensity()
        };
        this.notifyListeners();
    }
    
    // Manual tick advance
    next() {
        this.clock = (this.clock + 1) % 8;
        this.currentPattern = {
            state: this.clock,
            activeFaces: [...this.patternTable[this.clock]],
            vertexMask: this.vertexMasks[this.clock],
            intensity: this.calculateIntensity()
        };
        this.notifyListeners();
    }
}
