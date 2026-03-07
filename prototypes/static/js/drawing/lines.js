export let lines = [];

export function addLine(lineData) {
    lines.push({
        ...lineData,
        id: Date.now() + Math.random(),
        timestamp: Date.now()
    });
    return lines.length - 1;
}

export function removeLine(id) {
    lines = lines.filter(line => line.id !== id);
}

export function clearLines() {
    lines = [];
}

export function getLinesInHexel(q, r) {
    return lines.filter(line => 
        line.points.some(point => point.q === q && point.r === r)
    );
}
