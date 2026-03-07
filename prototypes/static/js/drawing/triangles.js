export let triangles = [];

export function addTriangle(triangleData) {
    // Check if triangle already exists
    const exists = triangles.some(t => 
        t.hexel.q === triangleData.hexel.q && 
        t.hexel.r === triangleData.hexel.r && 
        t.triangle === triangleData.triangle
    );
    
    if (exists && triangleData.mode === 'fill') {
        // Replace existing
        triangles = triangles.filter(t => 
            !(t.hexel.q === triangleData.hexel.q && 
              t.hexel.r === triangleData.hexel.r && 
              t.triangle === triangleData.triangle)
        );
    }
    
    triangles.push({
        ...triangleData,
        id: Date.now() + Math.random(),
        timestamp: Date.now()
    });
}

export function addHexelFill(hexel, color) {
    for (let i = 0; i < 6; i++) {
        addTriangle({
            hexel: hexel,
            triangle: i,
            color: color,
            mode: 'fill'
        });
    }
}

export function removeTriangle(id) {
    triangles = triangles.filter(t => t.id !== id);
}

export function clearTriangles() {
    triangles = [];
}

export function getTrianglesInHexel(q, r) {
    return triangles.filter(t => t.hexel.q === q && t.hexel.r === r);
}
