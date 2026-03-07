// src/tools/SelectTool.js
export class SelectTool {
    constructor(mapper) {
        this.mapper = mapper;
        this.selectedVertex = null;
    }

    onClick(x, y) {
        this.selectedVertex = this.mapper.screenToVertex(x, y);
        return this.selectedVertex;
    }

    getSelection() {
        return this.selectedVertex;
    }
}
