(function() {
            // === CANVAS SETUP ===
            const gridCanvas = document.getElementById('grid-canvas');
            const drawCanvas = document.getElementById('draw-canvas');
            const gridCtx = gridCanvas.getContext('2d');
            const drawCtx = drawCanvas.getContext('2d');

            // === HEXEL GEOMETRY ===
            const HEXEL_SIZE = 24; // base hexel unit
            const H_STEP = HEXEL_SIZE * 2;
            const V_STEP = HEXEL_SIZE * Math.sqrt(3);

            // === VIEW STATE ===
            let scale = 1.0;
            let offsetX = 0;
            let offsetY = 0;
            let gridEnabled = true;
            let currentTool = 'point';
            let currentColor = '#ffaa66';
            let currentSize = 8;

            // === DRAWING STATE ===
            let points = [];
            let lines = [];
            let undoStack = [];
            let redoStack = [];

            // === INTERACTION ===
            let isDragging = false;
            let dragThreshold = 3;
            let lastX, lastY;
            let lastDistance = 0;
            let clickStartTime = 0;
            let clickStartPos = { x: 0, y: 0 };
            let zoomTimeout;

            // === MOBILE MENU ===
            let mobileMenuOpen = false;

            // === RESIZE ===
            function resizeCanvases() {
                gridCanvas.width = window.innerWidth;
                gridCanvas.height = window.innerHeight;
                drawCanvas.width = window.innerWidth;
                drawCanvas.height = window.innerHeight;
                drawGrid();
                drawAll();
            }

            // === MESSAGE SYSTEM ===
            function addMessage(text, type = 'info', duration = 3000) {
                const msgArea = document.getElementById('message-area');
                const msgId = 'msg-' + Date.now() + '-' + Math.random();
                
                const msgEl = document.createElement('div');
                msgEl.id = msgId;
                msgEl.className = 'message';
                msgEl.textContent = text;
                
                msgArea.appendChild(msgEl);
                
                setTimeout(() => {
                    const el = document.getElementById(msgId);
                    if (el) el.remove();
                }, duration);
            }

            // === ZOOM INDICATOR ===
            function showZoomIndicator() {
                const indicator = document.getElementById('zoom-indicator');
                indicator.textContent = `${(scale * 100).toFixed(0)}%`;
                indicator.classList.add('visible');
                
                clearTimeout(zoomTimeout);
                zoomTimeout = setTimeout(() => {
                    indicator.classList.remove('visible');
                }, 1000);
            }

            // === HEXEL CONVERSIONS ===
            function screenToHexel(screenX, screenY) {
                const centerX = gridCanvas.width / 2 + offsetX;
                const centerY = gridCanvas.height / 2 + offsetY;
                
                const scaledH = H_STEP * scale;
                const scaledV = V_STEP * scale;
                
                const gridX = (screenX - centerX) / scaledH;
                const gridY = (screenY - centerY) / scaledV;
                
                const row = Math.round(gridY);
                let col;
                
                if (row % 2 !== 0) {
                    col = Math.round(gridX - 0.5);
                } else {
                    col = Math.round(gridX);
                }
                
                return { q: col, r: row };
            }

            function hexelToScreen(q, r) {
                const centerX = gridCanvas.width / 2 + offsetX;
                const centerY = gridCanvas.height / 2 + offsetY;
                
                const scaledH = H_STEP * scale;
                const scaledV = V_STEP * scale;
                
                return {
                    x: centerX + (r % 2 !== 0 ? (q + 0.5) * scaledH : q * scaledH),
                    y: centerY + r * scaledV
                };
            }

            // === DRAW GRID (Canvas with transforms) ===
            function drawGrid() {
                gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
                
                if (!gridEnabled) return;
                
                // Save context state
                gridCtx.save();
                
                // Apply transforms instead of manual coordinate calculations
                gridCtx.translate(gridCanvas.width / 2 + offsetX, gridCanvas.height / 2 + offsetY);
                gridCtx.scale(scale, scale);
                
                // Grid styling
                // Grid styling - intelligent line width
                gridCtx.strokeStyle = '#b388ff';
                if (scale < 0.5) {
                    gridCtx.lineWidth = 0.3; // Fixed thin at very low zoom
                } else if (scale < 1.0) {
                    gridCtx.lineWidth = 0.4; // Slightly thicker but still hairline
                } else {
                    gridCtx.lineWidth = 0.5 / scale; // Normal calculation for >= 1.0
                }
                
                // Calculate visible range in grid coordinates
                const left = -gridCanvas.width / 2 / scale;
                const right = gridCanvas.width / 2 / scale;
                const top = -gridCanvas.height / 2 / scale;
                const bottom = gridCanvas.height / 2 / scale;
                
                const startCol = Math.floor(left / H_STEP) - 2;
                const endCol = Math.ceil(right / H_STEP) + 2;
                const startRow = Math.floor(top / V_STEP) - 2;
                const endRow = Math.ceil(bottom / V_STEP) + 2;
                
                // Update UI (keep this part)
                const centerHexel = screenToHexel(gridCanvas.width/2, gridCanvas.height/2);
                document.getElementById('world-coord').textContent = 
                    `${(-offsetX / H_STEP).toFixed(2)}, ${(-offsetY / V_STEP).toFixed(2)}`;
                document.getElementById('hexel-coord').textContent = `(${centerHexel.q}, ${centerHexel.r})`;
                document.getElementById('zoom-value').textContent = scale.toFixed(2) + 'x';
                document.getElementById('status-zoom').textContent = scale.toFixed(2) + 'x';
                document.getElementById('status-hexel').textContent = `${centerHexel.q},${centerHexel.r}`;
                document.getElementById('status-points').textContent = points.length;
                document.getElementById('stat-points').textContent = points.length;
                
                // === DRAW HORIZONTAL LINES ===
                gridCtx.beginPath();
                gridCtx.globalAlpha = 0.15;
                
                for (let row = startRow; row <= endRow; row++) {
                    const y = row * V_STEP;
                    gridCtx.moveTo(left * scale, y);
                    gridCtx.lineTo(right * scale, y);
                }
                gridCtx.stroke();
                
                // === DRAW DIAGONALS (+60°) ===
                gridCtx.beginPath();
                const tan60 = Math.tan(60 * Math.PI / 180);
                
                for (let row = startRow - 3; row <= endRow + 3; row++) {
                    const rowOffset = (row % 2 === 0) ? 0 : H_STEP / 2;
                    const baseY = row * V_STEP;
                    
                    for (let col = startCol - 3; col <= endCol + 3; col++) {
                        const x = col * H_STEP + rowOffset;
                        
                        // Draw infinite line through this point at +60°
                        gridCtx.moveTo(x - 1000, baseY - 1000 * tan60);
                        gridCtx.lineTo(x + 1000, baseY + 1000 * tan60);
                    }
                }
                gridCtx.stroke();
                
                // === DRAW DIAGONALS (-60°) ===
                gridCtx.beginPath();
                
                for (let row = startRow - 3; row <= endRow + 3; row++) {
                    const rowOffset = (row % 2 === 0) ? 0 : H_STEP / 2;
                    const baseY = row * V_STEP;
                    
                    for (let col = startCol - 3; col <= endCol + 3; col++) {
                        const x = col * H_STEP + rowOffset;
                        
                        // Draw infinite line through this point at -60°
                        gridCtx.moveTo(x - 1000, baseY + 1000 * tan60);
                        gridCtx.lineTo(x + 1000, baseY - 1000 * tan60);
                    }
                }
                gridCtx.stroke();
                
                // === DRAW VERTICES ===
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
                
                // === DRAW ORIGIN ===
                gridCtx.fillStyle = '#ffffff';
                gridCtx.globalAlpha = 0.3;
                gridCtx.beginPath();
                gridCtx.arc(0, 0, 3, 0, Math.PI * 2);
                gridCtx.fill();
                
                // Restore context
                gridCtx.restore();
            }
            
            // Update resize handler
            window.addEventListener('resize', () => {
                resizeCanvases(); // This already calls drawGrid() and drawAll()
            });
            
            // Wait for DOM to be fully loaded
            document.addEventListener('DOMContentLoaded', function() {
                // Hide SVG grid permanently (if it exists)
                const svg = document.getElementById('grid-svg');
                if (svg) {
                    svg.style.display = 'none';
                }
                
                // Make sure canvas grid is visible
                const gridCanvas = document.getElementById('grid-canvas');
                if (gridCanvas) {
                    gridCanvas.style.display = 'block'; // Ensure canvas is visible
                }
                
                // Initial grid draw
                drawGrid();
                drawAll();
                
                // Make sure toggle button reflects initial state
                const gridToggle = document.getElementById('header-grid-toggle');
                if (gridToggle) {
                    gridToggle.classList.toggle('active', gridEnabled);
                }
            });

            // === DRAW ALL ELEMENTS ===
            function drawAll() {
                drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
                
                // Draw points
                points.forEach(point => {
                    const screen = hexelToScreen(point.q, point.r);
                    
                    drawCtx.fillStyle = point.color;
                    drawCtx.globalAlpha = 0.9;
                    drawCtx.beginPath();
                    drawCtx.arc(screen.x, screen.y, point.size * Math.sqrt(scale), 0, Math.PI*2);
                    drawCtx.fill();
                    
                    drawCtx.strokeStyle = '#ffffff';
                    drawCtx.lineWidth = 1.5;
                    drawCtx.stroke();
                });
                
                // Draw lines (placeholder)
                lines.forEach(line => {
                    // Line drawing implementation
                });
            }

            // === ADD HEXEL POINT ===
            function addHexelPoint(q, r) {
                const exists = points.some(p => p.q === q && p.r === r);
                if (exists) {
                    addMessage(`⚠️ hexel (${q},${r}) already has a point`, 'warning');
                    return false;
                }
                
                points.push({ q, r, color: currentColor, size: currentSize });
                drawAll();
                addMessage(`✨ placed point at hexel (${q},${r})`);
                updateStats();
                return true;
            }

            function updateStats() {
                document.getElementById('status-points').textContent = points.length;
                document.getElementById('stat-points').textContent = points.length;
            }

            // === ZOOM FUNCTION ===
            function zoom(factor, centerX, centerY) {
                const prevScale = scale;
                
                // Get world position before zoom
                const worldX = (centerX - (gridCanvas.width/2 + offsetX)) / (H_STEP * prevScale);
                const worldY = (centerY - (gridCanvas.height/2 + offsetY)) / (V_STEP * prevScale);
                
                // Apply zoom
                scale *= factor;
                scale = Math.max(0.2, Math.min(10, scale));
                
                // Adjust offset to zoom toward center
                offsetX = centerX - gridCanvas.width/2 - worldX * H_STEP * scale;
                offsetY = centerY - gridCanvas.height/2 - worldY * V_STEP * scale;
                
                drawGrid();
                drawAll();
                showZoomIndicator();
            }

            // === PINCH ZOOM ===
            function handlePinchZoom(e) {
                if (e.touches.length !== 2) return;
                
                e.preventDefault();
                
                const rect = drawCanvas.getBoundingClientRect();
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                
                const distance = Math.hypot(
                    touch1.clientX - touch2.clientX,
                    touch1.clientY - touch2.clientY
                );
                
                if (lastDistance > 0) {
                    const zoomFactor = distance / lastDistance;
                    
                    // Get pinch center
                    const centerX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
                    const centerY = (touch1.clientY + touch2.clientY) / 2 - rect.top;
                    
                    zoom(zoomFactor, centerX, centerY);
                }
                
                lastDistance = distance;
            }

            // === MOUSE/WHEEL ZOOM ===
            function handleWheelZoom(e) {
                e.preventDefault();
                
                const rect = drawCanvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
                zoom(zoomFactor, mouseX, mouseY);
            }

            // === INTERACTION HANDLERS ===
            function handlePointerStart(e) {
                e.preventDefault();
                
                const clientX = e.clientX ?? e.touches?.[0]?.clientX;
                const clientY = e.clientY ?? e.touches?.[0]?.clientY;
                
                if (!clientX) return;
                
                const rect = drawCanvas.getBoundingClientRect();
                const x = clientX - rect.left;
                const y = clientY - rect.top;
                
                lastX = clientX;
                lastY = clientY;
                clickStartPos = { x, y };
                clickStartTime = Date.now();
                isDragging = false;
                
                // Reset pinch distance
                if (e.touches?.length === 2) {
                    lastDistance = Math.hypot(
                        e.touches[0].clientX - e.touches[1].clientX,
                        e.touches[0].clientY - e.touches[1].clientY
                    );
                }
            }

            function handlePointerMove(e) {
                e.preventDefault();
                
                // Handle pinch zoom
                if (e.touches?.length === 2) {
                    handlePinchZoom(e);
                    return;
                }
                
                const clientX = e.clientX ?? e.touches?.[0]?.clientX;
                const clientY = e.clientY ?? e.touches?.[0]?.clientY;
                
                if (!clientX || !clientY || lastX === undefined) return;
                
                const dx = clientX - lastX;
                const dy = clientY - lastY;
                
                if (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold) {
                    isDragging = true;
                    
                    offsetX += dx;
                    offsetY += dy;
                    
                    lastX = clientX;
                    lastY = clientY;
                    
                    drawGrid();
                    drawAll();
                }
            }

            function handlePointerEnd(e) {
                e.preventDefault();
                
                if (e.touches?.length === 0) {
                    lastDistance = 0;
                }
                
                if (!isDragging && lastX !== undefined) {
                    // Handle click/tap
                    const clientX = e.clientX ?? e.changedTouches?.[0]?.clientX;
                    const clientY = e.clientY ?? e.changedTouches?.[0]?.clientY;
                    
                    if (clientX) {
                        const rect = drawCanvas.getBoundingClientRect();
                        const x = clientX - rect.left;
                        const y = clientY - rect.top;
                        
                        const hexel = screenToHexel(x, y);
                        
                        switch(currentTool) {
                            case 'point':
                                addHexelPoint(hexel.q, hexel.r);
                                break;
                            case 'hexagon':
                                // Draw hexagon ring
                                for (let dq = -1; dq <= 1; dq++) {
                                    for (let dr = -1; dr <= 1; dr++) {
                                        if (Math.abs(dq + dr) <= 1) {
                                            points.push({
                                                q: hexel.q + dq,
                                                r: hexel.r + dr,
                                                color: currentColor,
                                                size: currentSize * 0.7
                                            });
                                        }
                                    }
                                }
                                drawAll();
                                addMessage(`⬡ hexagon at (${hexel.q},${hexel.r})`);
                                break;
                        }
                        
                        document.getElementById('status-hexel').textContent = `${hexel.q},${hexel.r}`;
                    }
                }
                
                lastX = undefined;
                lastY = undefined;
                isDragging = false;
            }

            // === MOBILE MENU ===
            function toggleMobileMenu(open) {
                const menu = document.getElementById('mobile-menu');
                const overlay = document.getElementById('mobile-overlay');
                
                if (open) {
                    menu.classList.add('open');
                    overlay.style.display = 'block';
                    mobileMenuOpen = true;
                } else {
                    menu.classList.remove('open');
                    overlay.style.display = 'none';
                    mobileMenuOpen = false;
                }
            }

            // === INIT ===
            function init() {
                resizeCanvases();
                
                // Event listeners
                drawCanvas.addEventListener('mousedown', handlePointerStart);
                drawCanvas.addEventListener('mousemove', handlePointerMove);
                drawCanvas.addEventListener('mouseup', handlePointerEnd);
                drawCanvas.addEventListener('mouseleave', handlePointerEnd);
                
                drawCanvas.addEventListener('touchstart', handlePointerStart);
                drawCanvas.addEventListener('touchmove', handlePointerMove);
                drawCanvas.addEventListener('touchend', handlePointerEnd);
                drawCanvas.addEventListener('touchcancel', handlePointerEnd);
                
                drawCanvas.addEventListener('wheel', handleWheelZoom, { passive: false });
                
                // Menu toggle
                document.getElementById('menu-toggle').addEventListener('click', () => toggleMobileMenu(true));
                document.querySelector('.close-menu').addEventListener('click', () => toggleMobileMenu(false));
                document.getElementById('mobile-overlay').addEventListener('click', () => toggleMobileMenu(false));
                
                // Tool buttons
                const toolButtons = ['point', 'line', 'triangle', 'hexagon'];
                toolButtons.forEach(tool => {
                    const btn = document.getElementById(`tool-${tool}`);
                    const mobileBtn = document.getElementById(`mobile-tool-${tool}`);
                    
                    if (btn) {
                        btn.addEventListener('click', () => {
                            document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                            btn.classList.add('active');
                            if (mobileBtn) mobileBtn.classList.add('active');
                            currentTool = tool;
                            document.getElementById('status-tool').textContent = tool.toUpperCase();
                            addMessage(`🔧 switched to ${tool} tool`);
                        });
                    }
                    
                    if (mobileBtn) {
                        mobileBtn.addEventListener('click', () => {
                            document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                            mobileBtn.classList.add('active');
                            if (btn) btn.classList.add('active');
                            currentTool = tool;
                            document.getElementById('status-tool').textContent = tool.toUpperCase();
                            toggleMobileMenu(false);
                            addMessage(`🔧 switched to ${tool} tool`);
                        });
                    }
                });
                
                // Color swatches
                document.querySelectorAll('.color-swatch').forEach(swatch => {
                    swatch.addEventListener('click', () => {
                        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
                        swatch.classList.add('active');
                        currentColor = swatch.dataset.color;
                    });
                });
                
                // Size slider
                const sizeSlider = document.getElementById('point-size');
                const mobileSizeSlider = document.getElementById('mobile-point-size');
                const sizeValue = document.getElementById('size-value');
                
                function updateSize(val) {
                    currentSize = parseInt(val);
                    sizeValue.textContent = currentSize + 'px';
                    if (mobileSizeSlider) mobileSizeSlider.value = val;
                }
                
                sizeSlider.addEventListener('input', (e) => updateSize(e.target.value));
                if (mobileSizeSlider) {
                    mobileSizeSlider.addEventListener('input', (e) => updateSize(e.target.value));
                }
                
                // Grid toggle
                function toggleGrid() {
                    gridEnabled = !gridEnabled;
                    
                    // Toggle both canvas and SVG
                    const gridCanvas = document.getElementById('grid-canvas');
                    const gridSvg = document.getElementById('grid-svg');
                    
                    if (gridEnabled) {
                        gridCanvas.style.display = 'none';  // Hide canvas grid
                        gridSvg.style.display = 'block';    // Show SVG grid
                        drawGrid(); // Draw SVG grid
                    } else {
                        gridCanvas.style.display = 'none';  // Keep canvas hidden
                        gridSvg.style.display = 'none';     // Hide SVG grid
                    }
                    
                    // Update UI
                    const gridToggle = document.getElementById('header-grid-toggle');
                    if (gridToggle) {
                        gridToggle.classList.toggle('active', gridEnabled);
                    }
                }
                
                document.getElementById('header-grid-toggle').addEventListener('click', toggleGrid);
                
                // Clear button
                document.getElementById('header-clear').addEventListener('click', () => {
                    points = [];
                    lines = [];
                    drawAll();
                    addMessage('🗑️ cleared all drawings');
                    updateStats();
                });
                
                // Reset view
                document.getElementById('header-zoom-fit').addEventListener('click', () => {
                    scale = 1.0;
                    offsetX = 0;
                    offsetY = 0;
                    drawGrid();
                    drawAll();
                    addMessage('↺ view reset');
                });
                
                // Keyboard shortcuts
                window.addEventListener('keydown', (e) => {
                    if (e.key === 'r' || e.key === 'R') {
                        scale = 1.0;
                        offsetX = 0;
                        offsetY = 0;
                        drawGrid();
                        drawAll();
                        addMessage('↺ view reset');
                    }
                    
                    if (e.key === ' ') {
                        e.preventDefault();
                        toggleGrid();
                    }
                    
                    // Tool shortcuts
                    if (e.key === 'p' || e.key === 'P') {
                        document.getElementById('tool-point').click();
                    }
                    if (e.key === 'l' || e.key === 'L') {
                        document.getElementById('tool-line').click();
                    }
                    if (e.key === 't' || e.key === 'T') {
                        document.getElementById('tool-triangle').click();
                    }
                    if (e.key === 'h' || e.key === 'H') {
                        document.getElementById('tool-hexagon').click();
                    }
                });
                
                window.addEventListener('resize', resizeCanvases);
                
                // Initial active color
                document.querySelector('.color-swatch').classList.add('active');
                
                // Welcome
                addMessage('⬟ HEXEL STUDIO · 60° grid', 'info', 4000);
                
                // Initial draw
                drawGrid();
                drawAll();
            }

            init();
        })();
