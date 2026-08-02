/**
 * Blanket Design Generator - App Logic
 * Designed for modularity, readability, and installability (PWA).
 */

(function() {
    'use strict';

    // =========================================================================
    // 1. Service Worker & PWA Registration
    // =========================================================================
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('PWA Service Worker registered successfully!', reg.scope))
                .catch(err => console.error('PWA Service Worker registration failed:', err));
        });
    }

    // =========================================================================
    // 2. Pattern Styles Registry (Extendable Dictionary)
    // =========================================================================
    const PATTERN_STYLES = {
        solid: { 
            className: 'granny-solid', 
            name: 'Solid Color', 
            minColors: 1 
        },
        classic: { 
            className: 'granny-classic', 
            name: 'Classic Granny', 
            minColors: 4 
        },
        flower: { 
            className: 'granny-flower', 
            name: 'Flower Center', 
            minColors: 3 
        },
        mitered: { 
            className: 'granny-mitered', 
            name: 'Mitered Corner', 
            minColors: 4 
        },
        diamond: { 
            className: 'granny-diamond', 
            name: 'Diamond Quad', 
            minColors: 4 
        },
        target: {
            className: 'granny-target',
            name: 'Target Rings',
            minColors: 4
        },
        checker: {
            className: 'granny-checker',
            name: 'Checkerboard',
            minColors: 4
        }
    };

    // =========================================================================
    // 3. Color Utilities (Cozy Pastel HSL Palette Generator)
    // =========================================================================
    const COMMERCIAL_PALETTES = [
        { 
            name: "Stylecraft Special DK - Vintage Rose", 
            brand: "Stylecraft", 
            colors: ["#d8c1c5", "#b49b9c", "#886e70", "#e6ded2"],
            shades: ["Pale Rose (1824)", "Mushroom (1832)", "Dark Walnut (1054)", "Cream (1005)"]
        },
        { 
            name: "Paintbox Yarns - Ocean Mist", 
            brand: "Paintbox Yarns", 
            colors: ["#a1cdd8", "#6a9ca8", "#335e6a", "#e8f0f2"],
            shades: ["Duck Egg (135)", "Storm Blue (132)", "Midnight (137)", "Paper White (101)"]
        },
        { 
            name: "Scheepjes Softfun - Spring Garden", 
            brand: "Scheepjes", 
            colors: ["#f2b9b2", "#f7d2a8", "#a6c9a2", "#fcf4e8"],
            shades: ["Soft Coral (2612)", "Peach (2615)", "Sage Green (2616)", "Linen (2426)"]
        },
        { 
            name: "Red Heart Super Saver - Autumn Sunset", 
            brand: "Red Heart", 
            colors: ["#e88f6a", "#d2605a", "#9a444a", "#faebd7"],
            shades: ["Terracotta (0365)", "Paprika (0373)", "Burgundy (0376)", "Buff (0334)"]
        },
        { 
            name: "Hobbii Rainbow Cotton - Forest Walk", 
            brand: "Hobbii", 
            colors: ["#899b82", "#5c7352", "#3a4a33", "#dde5d9"],
            shades: ["Dusty Green (074)", "Forest Sage (075)", "Deep Pine (077)", "Natural Ivory (002)"]
        }
    ];

    const getYarnShadeInfo = (colorHex) => {
        for (const pal of COMMERCIAL_PALETTES) {
            const idx = pal.colors.indexOf(colorHex);
            if (idx !== -1 && pal.shades && pal.shades[idx]) {
                return `${pal.brand}: ${pal.shades[idx]}`;
            }
        }
        return `Craft Shade (${colorHex.toUpperCase()})`;
    };

    const generateHarmoniousPalette = () => {
        const index = Math.floor(Math.random() * COMMERCIAL_PALETTES.length);
        return {
            index: index,
            colors: [...COMMERCIAL_PALETTES[index].colors]
        };
    };

    // Helper to generate CSS custom properties style string for a pattern's colors
    const getPatternColorVariables = (colors) => {
        return colors.map((color, index) => `--color-${index + 1}: ${color};`).join(' ');
    };

    // =========================================================================
    // 4. Application State Management
    // =========================================================================
    const state = {
        rows: 8,
        cols: 8,
        borderWidth: 1,
        borderColor: '#27212b',
        borderStyle: 'solid',
        patterns: [],
        blanketGrid: [],
        completedSquares: new Set(),
        lockedCells: new Set(),
        workMode: false,
        paintMode: false,
        activeBrushPatternId: 0,
        nextPatternId: 0,
        history: []
    };

    // Initialize state with default configuration
    const initDefaultState = () => {
        // Get dimensions from inputs, fall back to state defaults
        const rowsInput = document.querySelector('#rows');
        const colsInput = document.querySelector('#columns');
        if (rowsInput) state.rows = parseInt(rowsInput.value) || 8;
        if (colsInput) state.cols = parseInt(colsInput.value) || 8;

        // Start with two default patterns
        addPatternToState('classic');
        addPatternToState('flower');
    };

    // Redistribute pattern quantities to divide total cells as evenly as possible
    const redistributeQuantities = () => {
        const totalCells = state.rows * state.cols;
        const count = state.patterns.length;
        if (count === 0) return;

        const baseQty = Math.floor(totalCells / count);
        let remainder = totalCells % count;

        state.patterns.forEach(pattern => {
            pattern.quantity = baseQty + (remainder > 0 ? 1 : 0);
            if (remainder > 0) remainder--;
        });
    };

    // Add a new pattern to state
    const addPatternToState = (style = 'solid') => {
        const palette = generateHarmoniousPalette();
        const pattern = {
            id: state.nextPatternId++,
            style: style,
            quantity: 1,
            paletteIndex: palette.index,
            colors: palette.colors,
            isLocked: false
        };
        state.patterns.push(pattern);

        redistributeQuantities();
    };

    // Remove a pattern from state
    const removePatternFromState = (id) => {
        state.patterns = state.patterns.filter(p => p.id !== id);
        redistributeQuantities();
    };

    // =========================================================================
    // 5. Grid Solver & Generator Algorithm
    // =========================================================================
    // Helper to check if a grid contains any adjacent duplicates
    const hasGridDuplicates = (grid) => {
        const rows = grid.length;
        const cols = grid[0].length;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = grid[r][c];
                if (cell === null) continue;
                if (c < cols - 1 && cell === grid[r][c + 1]) return true;
                if (r < rows - 1 && cell === grid[r + 1][c]) return true;
            }
        }
        return false;
    };

    // Attempts a single layout fill
    const generateGridAttempt = () => {
        const rows = state.rows;
        const cols = state.cols;
        const grid = Array.from({ length: rows }, () => Array(cols).fill(null));

        // Create a temporary mutable copy of pattern quantities to decrement as we place cells
        const remainingQuantities = state.patterns.map(p => ({
            id: p.id,
            qty: p.quantity
        }));

        // Pre-fill cells that are locked in position
        if (state.blanketGrid && state.blanketGrid.length === rows && state.blanketGrid[0]?.length === cols) {
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const key = `${r}-${c}`;
                    if (state.lockedCells.has(key)) {
                        const existingId = state.blanketGrid[r][c];
                        if (existingId !== undefined && existingId !== null && state.patterns.some(p => p.id === existingId)) {
                            grid[r][c] = existingId;
                            const rem = remainingQuantities.find(p => p.id === existingId);
                            if (rem && rem.qty > 0) rem.qty--;
                        } else {
                            state.lockedCells.delete(key);
                        }
                    }
                }
            }
        }

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (grid[r][c] !== null) continue; // Skip locked cells

                const leftNeighbor = c > 0 ? grid[r][c - 1] : null;
                const topNeighbor = r > 0 ? grid[r - 1][c] : null;

                // 1. Gather patterns that have quantity remaining
                let available = remainingQuantities.filter(p => p.qty > 0);

                // Fallback: If we run out of all allocated patterns, pull from any configured pattern
                if (available.length === 0) {
                    if (state.patterns.length > 0) {
                        const randomPattern = state.patterns[Math.floor(Math.random() * state.patterns.length)];
                        grid[r][c] = randomPattern.id;
                    } else {
                        grid[r][c] = 0; // Absolute fallback if there are no patterns at all
                    }
                    continue;
                }

                // 2. Enforce adjacency: Filter out neighbor patterns
                let options = available.filter(p => p.id !== leftNeighbor && p.id !== topNeighbor);

                // Fallback: If ALL available remaining colors are identical to neighbors, relax constraint
                if (options.length === 0) {
                    options = available;
                }

                // 3. Select a pattern randomly from the valid options
                const chosen = options[Math.floor(Math.random() * options.length)];
                grid[r][c] = chosen.id;

                // Decrement the remaining quantity
                chosen.qty--;
            }
        }
        return grid;
    };

    /**
     * Generates a 2D grid representation of the blanket.
     * Enforces the adjacency constraint strictly by retrying attempts.
     */
    const solveBlanketGrid = () => {
        let grid;
        let attempts = 0;
        const maxAttempts = 150;

        do {
            grid = generateGridAttempt();
            attempts++;
        } while (hasGridDuplicates(grid) && attempts < maxAttempts);

        console.log(`Generated blanket layout in ${attempts} attempts.`);
        return grid;
    };

    // =========================================================================
    // 6. UI / DOM Controller
    // =========================================================================
    
    // Update the layout grid cell count badge & validate sizes
    const updateDimensionsInfo = () => {
        const rowsInput = document.querySelector('#rows');
        const colsInput = document.querySelector('#columns');
        const bWidthSelect = document.querySelector('#border-width');
        const bStyleSelect = document.querySelector('#border-style');
        const bColorSelect = document.querySelector('#border-color');
        
        if (rowsInput) {
            const rVal = parseInt(rowsInput.value);
            state.rows = (!isNaN(rVal) && rVal > 0) ? rVal : 1;
        }
        if (colsInput) {
            const cVal = parseInt(colsInput.value);
            state.cols = (!isNaN(cVal) && cVal > 0) ? cVal : 1;
        }
        if (bWidthSelect) {
            state.borderWidth = parseInt(bWidthSelect.value) || 0;
        }
        if (bStyleSelect) {
            state.borderStyle = bStyleSelect.value || 'solid';
        }
        if (bColorSelect) {
            state.borderColor = bColorSelect.value || '#27212b';
        }

        const bWidth = state.borderWidth;
        const innerCells = state.rows * state.cols;
        const totalRows = state.rows + bWidth * 2;
        const totalCols = state.cols + bWidth * 2;
        const totalCells = totalRows * totalCols;
        const borderCells = totalCells - innerCells;

        const badge = document.querySelector('#cell-count-badge');
        if (badge) {
            if (bWidth > 0) {
                badge.innerText = `${innerCells} + ${borderCells} border (${totalCells} total)`;
            } else {
                badge.innerText = `${totalCells} cells`;
            }
            
            // Check if pattern quantities cover the cell requirement
            const totalQty = state.patterns.reduce((sum, p) => sum + p.quantity, 0);
            if (totalQty < innerCells) {
                badge.style.background = 'rgba(239, 68, 68, 0.1)';
                badge.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                badge.style.color = '#f87171';
                badge.title = `Shortage: You configured ${totalQty} blocks, but need ${innerCells}. Fallbacks will fill the rest.`;
            } else {
                badge.style.background = 'rgba(91, 192, 190, 0.1)';
                badge.style.borderColor = 'rgba(91, 192, 190, 0.2)';
                badge.style.color = 'var(--accent)';
                badge.title = `Covers cells: You configured ${totalQty} blocks for ${innerCells} inner cells.`;
            }
        }
    };

    // Triggered when rows/columns inputs change
    const onDimensionsChange = () => {
        const rowsInput = document.querySelector('#rows');
        const colsInput = document.querySelector('#columns');
        
        if (rowsInput) {
            const rVal = parseInt(rowsInput.value);
            state.rows = (!isNaN(rVal) && rVal > 0) ? rVal : 1;
        }
        if (colsInput) {
            const cVal = parseInt(colsInput.value);
            state.cols = (!isNaN(cVal) && cVal > 0) ? cVal : 1;
        }

        redistributeQuantities();
        renderPatternsList();
        updateDimensionsInfo();
    };

    // Sync input controls back to state patterns before generating
    const syncUIQuantitiesToState = () => {
        state.patterns.forEach(pattern => {
            const rowEl = document.querySelector(`#pattern-row-${pattern.id}`);
            if (rowEl) {
                const styleSelect = rowEl.querySelector('.pattern-style-select');
                if (styleSelect) pattern.style = styleSelect.value;
            }
        });
    };

    // Render the patterns configurations inside the sidebar
    const renderPatternsList = () => {
        const container = document.querySelector('#patterns-list');
        if (!container) return;

        container.innerHTML = '';

        state.patterns.forEach((pattern, index) => {
            const item = document.createElement('div');
            item.className = 'pattern-item';
            item.id = `pattern-row-${pattern.id}`;

            // Create Style select options dynamically
            let styleOptions = '';
            Object.keys(PATTERN_STYLES).forEach(key => {
                const isSelected = pattern.style === key ? 'selected' : '';
                styleOptions += `<option value="${key}" ${isSelected}>${PATTERN_STYLES[key].name}</option>`;
            });

            // Create Palette select options
            let paletteOptions = '';
            COMMERCIAL_PALETTES.forEach((pal, idx) => {
                const isSelected = pattern.paletteIndex === idx ? 'selected' : '';
                paletteOptions += `<option value="${idx}" ${isSelected}>${pal.name}</option>`;
            });

            const colorVars = getPatternColorVariables(pattern.colors);
            const styleDetails = PATTERN_STYLES[pattern.style];

            item.innerHTML = `
                <div class="pattern-item-header">
                    <div class="pattern-title-group">
                        <div class="patternSymbol ${styleDetails.className}" style="${colorVars}"></div>
                        <span class="pattern-index-label">Pattern #${index + 1}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:6px;">
                        <button class="btn-lock-pattern ${pattern.isLocked ? 'active' : ''}" data-id="${pattern.id}" title="${pattern.isLocked ? 'Unlock positions for this pattern' : 'Lock all positions for this pattern'}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                ${pattern.isLocked ? 
                                    '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>' : 
                                    '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path>'}
                            </svg>
                        </button>
                        <button class="btn-delete" data-id="${pattern.id}" title="Remove pattern">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    </div>
                </div>
                <div class="pattern-inputs-grid">
                    <select class="pattern-style-select" data-id="${pattern.id}">
                        ${styleOptions}
                    </select>
                    <select class="pattern-palette-select" data-id="${pattern.id}" style="margin-top: 8px;">
                        ${paletteOptions}
                    </select>
                </div>
            `;

            // Attach event listeners to newly created select elements for instant preview updates
            const selectEl = item.querySelector('.pattern-style-select');
            selectEl.addEventListener('change', (e) => {
                const pId = parseInt(e.target.dataset.id);
                const matched = state.patterns.find(p => p.id === pId);
                if (matched) {
                    matched.style = e.target.value;
                    
                    // Update preview element classes
                    const previewSymbol = item.querySelector('.patternSymbol');
                    if (previewSymbol) {
                        // Strip old granny style classes
                        Object.values(PATTERN_STYLES).forEach(style => {
                            previewSymbol.classList.remove(style.className);
                        });
                        // Add new
                        previewSymbol.classList.add(PATTERN_STYLES[matched.style].className);
                    }
                }
            });

            const paletteSelect = item.querySelector('.pattern-palette-select');
            paletteSelect.addEventListener('change', (e) => {
                const pId = parseInt(e.target.dataset.id);
                const matched = state.patterns.find(p => p.id === pId);
                if (matched) {
                    matched.paletteIndex = parseInt(e.target.value);
                    matched.colors = [...COMMERCIAL_PALETTES[matched.paletteIndex].colors];
                    const previewSymbol = item.querySelector('.patternSymbol');
                    if (previewSymbol) {
                        previewSymbol.style = getPatternColorVariables(matched.colors);
                    }
                }
            });

            // Lock pattern handler
            const patternLockBtn = item.querySelector('.btn-lock-pattern');
            if (patternLockBtn) {
                patternLockBtn.addEventListener('click', (e) => {
                    const pId = parseInt(e.currentTarget.dataset.id);
                    const matched = state.patterns.find(p => p.id === pId);
                    if (!matched) return;

                    matched.isLocked = !matched.isLocked;

                    if (state.blanketGrid && state.blanketGrid.length > 0) {
                        for (let r = 0; r < state.rows; r++) {
                            for (let c = 0; c < state.cols; c++) {
                                if (state.blanketGrid[r]?.[c] === pId) {
                                    if (matched.isLocked) {
                                        state.lockedCells.add(`${r}-${c}`);
                                    } else {
                                        state.lockedCells.delete(`${r}-${c}`);
                                    }
                                }
                            }
                        }
                    }

                    renderPatternsList();
                    const canvasTable = document.querySelector('#blanket-container table');
                    if (canvasTable) {
                        const cellElems = canvasTable.querySelectorAll('td.cellSquare:not(.border-cell)');
                        cellElems.forEach(cell => {
                            const r = parseInt(cell.dataset.row);
                            const c = parseInt(cell.dataset.col);
                            const bWidth = state.borderWidth || 0;
                            const inR = r - bWidth;
                            const inC = c - bWidth;
                            const key = `${inR}-${inC}`;
                            const isLocked = state.lockedCells.has(key);
                            cell.classList.toggle('locked', isLocked);
                            const lockBtn = cell.querySelector('.cell-lock-btn');
                            if (lockBtn) {
                                lockBtn.title = isLocked ? 'Unlock position (cell will change on regenerate)' : 'Lock position (cell won\'t change on regenerate)';
                                lockBtn.setAttribute('aria-label', lockBtn.title);
                                lockBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">${isLocked ? '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>' : '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path>'}</svg>`;
                            }
                        });
                    }
                });
            }

            // Delete click handler
            const deleteBtn = item.querySelector('.btn-delete');
            deleteBtn.addEventListener('click', (e) => {
                const btn = e.currentTarget;
                const pId = parseInt(btn.dataset.id);
                removePatternFromState(pId);
                renderPatternsList();
                updateDimensionsInfo();
            });

            container.appendChild(item);
        });
    };

    // Generate blanket data and render it on the canvas
    const updateWorkModeProgress = () => {
        const progressEl = document.querySelector('#work-mode-progress');
        if (!progressEl) return;
        
        const bWidth = state.borderWidth || 0;
        const totalRows = state.rows + bWidth * 2;
        const totalCols = state.cols + bWidth * 2;
        const total = totalRows * totalCols;
        const completed = state.completedSquares.size;
        progressEl.textContent = `${completed} / ${total}`;
    };

    const drawBlanketCanvas = (preserveGrid = false) => {
        if (!preserveGrid) {
            const rowsInput = document.querySelector('#rows');
            const colsInput = document.querySelector('#columns');

            if (rowsInput) {
                const rVal = parseInt(rowsInput.value);
                if (isNaN(rVal) || rVal < 1) {
                    rowsInput.value = 1;
                    state.rows = 1;
                } else {
                    state.rows = rVal;
                }
            }

            if (colsInput) {
                const cVal = parseInt(colsInput.value);
                if (isNaN(cVal) || cVal < 1) {
                    colsInput.value = 1;
                    state.cols = 1;
                } else {
                    state.cols = cVal;
                }
            }

            redistributeQuantities();
            renderPatternsList();
            syncUIQuantitiesToState();
            updateDimensionsInfo();

            // Reset work mode progress for new generation
            state.completedSquares = new Set();
            
            // Perform layout computation
            state.blanketGrid = solveBlanketGrid();
        }

        const canvas = document.querySelector('#blanket-container');
        if (!canvas) return;

        updateWorkModeProgress();
        const workModeControls = document.querySelector('#work-mode-controls');
        if (workModeControls) workModeControls.style.display = 'flex';
        const paintModeControls = document.querySelector('#paint-mode-controls');
        if (paintModeControls) paintModeControls.style.display = 'flex';
        updatePaintBrushOptions();

        const bWidth = state.borderWidth || 0;
        const bColor = state.borderColor || '#27212b';
        const bStyle = state.borderStyle || 'solid';
        const innerRows = state.rows;
        const innerCols = state.cols;
        const totalRows = innerRows + bWidth * 2;
        const totalCols = innerCols + bWidth * 2;

        // Create table grid element
        const table = document.createElement('table');
        table.className = 'blanket';
        if (state.workMode) {
            table.classList.add('work-mode-active');
        }
        if (state.paintMode) {
            table.classList.add('paint-mode-active');
        }

        for (let r = 0; r < totalRows; r++) {
            const row = document.createElement('tr');
            
            for (let c = 0; c < totalCols; c++) {
                const cell = document.createElement('td');
                cell.className = 'cellSquare';
                
                const isBorder = r < bWidth || r >= totalRows - bWidth || c < bWidth || c >= totalCols - bWidth;

                if (isBorder) {
                    cell.classList.add('border-cell');
                    if (bStyle !== 'solid') {
                        cell.classList.add(`border-${bStyle}`);
                    }
                    cell.classList.add('granny-solid');
                    cell.style.backgroundColor = bColor;
                    cell.style.setProperty('--color-1', bColor);
                    cell.title = 'Border square';

                    const isTop = r < bWidth;
                    const isBottom = r >= totalRows - bWidth;
                    const isLeft = c < bWidth;
                    const isRight = c >= totalCols - bWidth;

                    if ((isTop || isBottom) && (isLeft || isRight)) {
                        cell.classList.add('border-corner');
                    }
                } else {
                    const inR = r - bWidth;
                    const inC = c - bWidth;
                    const patternId = state.blanketGrid[inR][inC];
                    const pattern = state.patterns.find(p => p.id === patternId);

                    if (pattern) {
                        const styleDetails = PATTERN_STYLES[pattern.style];
                        cell.classList.add(styleDetails.className);
                        cell.style = getPatternColorVariables(pattern.colors);
                    } else {
                        // Fallback to solid color if empty/unassigned
                        cell.classList.add('granny-solid');
                        cell.style = '--color-1: #1e294b;';
                    }

                    // Add lock button for inner grid cell
                    const lockKey = `${inR}-${inC}`;
                    const isCellLocked = state.lockedCells.has(lockKey);
                    if (isCellLocked) {
                        cell.classList.add('locked');
                    }

                    const lockBtn = document.createElement('button');
                    lockBtn.className = 'cell-lock-btn';
                    lockBtn.title = isCellLocked ? 'Unlock position (cell will change on regenerate)' : 'Lock position (cell won\'t change on regenerate)';
                    lockBtn.setAttribute('aria-label', lockBtn.title);
                    lockBtn.innerHTML = `
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            ${isCellLocked ? 
                                '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>' : 
                                '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path>'}
                        </svg>
                    `;

                    lockBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (state.lockedCells.has(lockKey)) {
                            state.lockedCells.delete(lockKey);
                            cell.classList.remove('locked');
                            lockBtn.title = 'Lock position (cell won\'t change on regenerate)';
                            lockBtn.setAttribute('aria-label', lockBtn.title);
                            lockBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>`;
                        } else {
                            state.lockedCells.add(lockKey);
                            cell.classList.add('locked');
                            lockBtn.title = 'Unlock position (cell will change on regenerate)';
                            lockBtn.setAttribute('aria-label', lockBtn.title);
                            lockBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;
                        }
                    });

                    cell.appendChild(lockBtn);

                    // Add drag and drop functionality
                    cell.setAttribute('draggable', 'true');
                    cell.addEventListener('dragstart', (e) => {
                        if (state.paintMode || state.workMode) return;
                        e.dataTransfer.setData('text/plain', JSON.stringify({ r: inR, c: inC }));
                        e.dataTransfer.effectAllowed = 'move';
                        cell.style.opacity = '0.5';
                    });
                    cell.addEventListener('dragend', () => {
                        cell.style.opacity = '1';
                    });
                    cell.addEventListener('dragover', (e) => {
                        if (state.paintMode || state.workMode) return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                    });
                    cell.addEventListener('drop', (e) => {
                        if (state.paintMode || state.workMode) return;
                        e.preventDefault();
                        const dataStr = e.dataTransfer.getData('text/plain');
                        if (!dataStr) return;
                        
                        try {
                            const source = JSON.parse(dataStr);
                            const srcR = source.r;
                            const srcC = source.c;
                            
                            if (srcR !== inR || srcC !== inC) {
                                // Swap pattern IDs in the grid state
                                const temp = state.blanketGrid[srcR][srcC];
                                state.blanketGrid[srcR][srcC] = state.blanketGrid[inR][inC];
                                state.blanketGrid[inR][inC] = temp;
                                
                                // Redraw table, preserving grid state
                                drawBlanketCanvas(true);
                            }
                        } catch (err) {
                            console.error('Drop error:', err);
                        }
                    });
                }

                // Staggered entry animation delay
                const delay = (r + c) * 15;
                cell.style.animationDelay = `${delay}ms`;

                // Cell Interaction (Work Mode & Paint Mode)
                cell.dataset.row = r;
                cell.dataset.col = c;
                if (state.completedSquares.has(`${r}-${c}`)) {
                    cell.classList.add('completed');
                }
                
                cell.addEventListener('click', () => {
                    if (state.paintMode) {
                        const inR = r - bWidth;
                        const inC = c - bWidth;
                        if (inR >= 0 && inR < state.rows && inC >= 0 && inC < state.cols) {
                            const pId = state.activeBrushPatternId;
                            state.blanketGrid[inR][inC] = pId;
                            state.lockedCells.add(`${inR}-${inC}`);

                            const pattern = state.patterns.find(p => p.id === pId);
                            Object.values(PATTERN_STYLES).forEach(s => cell.classList.remove(s.className));
                            if (pattern) {
                                cell.classList.add(PATTERN_STYLES[pattern.style].className);
                                cell.style = getPatternColorVariables(pattern.colors);
                            }
                            cell.classList.add('locked');

                            const lockBtn = cell.querySelector('.cell-lock-btn');
                            if (lockBtn) {
                                lockBtn.title = 'Unlock position (cell will change on regenerate)';
                                lockBtn.setAttribute('aria-label', lockBtn.title);
                                lockBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;
                            }

                            const resultsContainer = document.querySelector('#yarn-results');
                            if (resultsContainer && resultsContainer.style.display !== 'none') {
                                calculateYarnEstimate();
                            }
                        }
                        return;
                    }

                    if (!state.workMode) return;
                    
                    const key = `${r}-${c}`;
                    if (state.completedSquares.has(key)) {
                        state.completedSquares.delete(key);
                        cell.classList.remove('completed');
                    } else {
                        state.completedSquares.add(key);
                        cell.classList.add('completed');
                    }
                    updateWorkModeProgress();
                });

                row.appendChild(cell);
            }
            table.appendChild(row);
        }

        // Render table
        canvas.innerHTML = '';
        canvas.appendChild(table);

        // Show download FAB
        const downloadBtn = document.querySelector('#download-image-btn');
        if (downloadBtn) downloadBtn.style.display = 'flex';

        // Auto-close settings menu drawer
        toggleDrawer(false);

        // Save layout to history (sync to cloud if configured)
        appendToHistory();
    };

    // =========================================================================
    // 7. Drawer, History, Export & Import Controllers
    // =========================================================================
    
    // Toggle Settings Drawer
    const toggleDrawer = (open) => {
        const drawer = document.querySelector('.settings-container');
        const overlay = document.querySelector('#menu-overlay');
        if (drawer) drawer.classList.toggle('open', open);
        if (overlay) overlay.classList.toggle('active', open);
    };

    // Initialize history from IndexedDB (localforage) with migration from localStorage
    const initHistory = async () => {
        try {
            // Check for legacy localStorage data and migrate it
            const legacyData = localStorage.getItem('blanket_local_history');
            if (legacyData) {
                const parsed = JSON.parse(legacyData);
                await localforage.setItem('blanket_local_history', parsed);
                localStorage.removeItem('blanket_local_history');
            }

            // Load from localforage
            const localData = await localforage.getItem('blanket_local_history');
            state.history = localData ? localData : [];
        } catch (e) {
            console.error('Failed to load local history:', e);
            state.history = [];
        }
        renderHistoryList();
    };

    // Export history as a downloadable JSON file
    const exportHistory = () => {
        if (state.history.length === 0) {
            alert('No designs saved yet. Generate a design first!');
            return;
        }
        const json = JSON.stringify(state.history, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const link = document.createElement('a');
        link.download = `blanket-history-${Date.now()}.json`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
    };

    // Import history from a JSON file
    const importHistory = (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (!Array.isArray(imported)) throw new Error('Invalid format');
                // Merge imported with existing, deduplicate by id, keep newest 500
                const merged = [...imported, ...state.history];
                const seen = new Set();
                state.history = merged.filter(item => {
                    if (seen.has(item.id)) return false;
                    seen.add(item.id);
                    return true;
                }).slice(0, 500);
                localforage.setItem('blanket_local_history', state.history);
                renderHistoryList();
                alert(`Imported ${imported.length} design(s) successfully!`);
            } catch (err) {
                alert('Failed to import: invalid JSON file.');
            }
        };
        reader.readAsText(file);
    };

    const renderHistoryList = () => {
        const listContainer = document.querySelector('#history-list');
        const countBadge = document.querySelector('#history-count-badge');
        if (!listContainer) return;
        
        listContainer.innerHTML = '';
        if (countBadge) countBadge.innerText = `${state.history.length} saved`;
        
        if (state.history.length === 0) {
            listContainer.innerHTML = '<div class="history-empty-state">No designs saved yet.</div>';
            return;
        }
        
        state.history.forEach((item) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.dataset.id = item.id;
            
            const dateStr = new Date(item.timestamp).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            let swatchesHtml = '';
            const uniqueColors = new Set();
            item.patterns.forEach(p => p.colors.forEach(c => uniqueColors.add(c)));
            Array.from(uniqueColors).slice(0, 8).forEach(color => {
                swatchesHtml += `<div class="history-preview-swatch" style="background: ${color};"></div>`;
            });
            
            historyItem.innerHTML = `
                <div class="history-item-header">
                    <span class="history-item-time">${dateStr}</span>
                    <span class="history-item-size">${item.rows}×${item.cols}</span>
                </div>
                <div class="history-preview-bar">
                    ${swatchesHtml}
                </div>
            `;
            
            historyItem.addEventListener('click', () => {
                restoreDesign(item.id);
            });
            
            listContainer.appendChild(historyItem);
        });
    };

    const restoreDesign = (id) => {
        const item = state.history.find(h => h.id === id);
        if (!item) return;
        
        state.rows = item.rows;
        state.cols = item.cols;
        state.borderWidth = item.borderWidth ?? 1;
        state.borderColor = item.borderColor || '#27212b';
        state.lockedCells = new Set(item.lockedCells || []);
        state.patterns = JSON.parse(JSON.stringify(item.patterns));
        state.blanketGrid = JSON.parse(JSON.stringify(item.grid));
        
        const rowsInput = document.querySelector('#rows');
        const colsInput = document.querySelector('#columns');
        const bWidthSelect = document.querySelector('#border-width');
        const bColorSelect = document.querySelector('#border-color');
        if (rowsInput) rowsInput.value = state.rows;
        if (colsInput) colsInput.value = state.cols;
        if (bWidthSelect) bWidthSelect.value = state.borderWidth;
        if (bColorSelect) bColorSelect.value = state.borderColor;
        
        let maxPatternId = 0;
        state.patterns.forEach(p => {
            if (p.id >= maxPatternId) maxPatternId = p.id + 1;
        });
        state.nextPatternId = maxPatternId;
        
        renderPatternsList();
        updateDimensionsInfo();
        
        const canvas = document.querySelector('#blanket-container');
        if (canvas) {
            const bWidth = state.borderWidth || 0;
            const bColor = state.borderColor || '#27212b';
            const totalRows = state.rows + bWidth * 2;
            const totalCols = state.cols + bWidth * 2;

            const table = document.createElement('table');
            table.className = 'blanket';
            if (state.workMode) {
                table.classList.add('work-mode-active');
            }
            
            for (let r = 0; r < totalRows; r++) {
                const row = document.createElement('tr');
                for (let c = 0; c < totalCols; c++) {
                    const cell = document.createElement('td');
                    cell.className = 'cellSquare';
                    
                    const isBorder = r < bWidth || r >= totalRows - bWidth || c < bWidth || c >= totalCols - bWidth;

                    if (isBorder) {
                        cell.classList.add('border-cell');
                        cell.classList.add('granny-solid');
                        cell.style.backgroundColor = bColor;
                        cell.style.setProperty('--color-1', bColor);
                        cell.title = 'Border square';

                        const isTop = r < bWidth;
                        const isBottom = r >= totalRows - bWidth;
                        const isLeft = c < bWidth;
                        const isRight = c >= totalCols - bWidth;

                        if ((isTop || isBottom) && (isLeft || isRight)) {
                            cell.classList.add('border-corner');
                        }
                    } else {
                        const inR = r - bWidth;
                        const inC = c - bWidth;
                        const patternId = state.blanketGrid[inR][inC];
                        const pattern = state.patterns.find(p => p.id === patternId);
                        
                        if (pattern) {
                            const styleDetails = PATTERN_STYLES[pattern.style];
                            cell.classList.add(styleDetails.className);
                            cell.style = getPatternColorVariables(pattern.colors);
                        } else {
                            cell.classList.add('granny-solid');
                            cell.style = '--color-1: #1e294b;';
                        }

                        const lockKey = `${inR}-${inC}`;
                        if (state.lockedCells.has(lockKey)) {
                            cell.classList.add('locked');
                        }
                    }
                    
                    const delay = (r + c) * 15;
                    cell.style.animationDelay = `${delay}ms`;
                    row.appendChild(cell);
                }
                table.appendChild(row);
            }
            canvas.innerHTML = '';
            canvas.appendChild(table);
        }
        
        const downloadBtn = document.querySelector('#download-image-btn');
        if (downloadBtn) downloadBtn.style.display = 'flex';
        
        toggleDrawer(false);
    };

    const appendToHistory = () => {
        const entry = {
            id: `design_${Date.now()}`,
            timestamp: Date.now(),
            rows: state.rows,
            cols: state.cols,
            borderWidth: state.borderWidth,
            borderColor: state.borderColor,
            lockedCells: Array.from(state.lockedCells),
            patterns: JSON.parse(JSON.stringify(state.patterns)),
            grid: JSON.parse(JSON.stringify(state.blanketGrid))
        };
        
        state.history.unshift(entry);
        
        if (state.history.length > 500) {
            state.history = state.history.slice(0, 500);
        }
        
        localforage.setItem('blanket_local_history', state.history);
        renderHistoryList();
    };


    // Canvas Draw Helpers
    const drawRoundedRect = (ctx, x, y, width, height, radius) => {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    };

    const drawStitchOverlay = (ctx, x, y, size) => {
        const step = 8;
        ctx.save();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let offset = 0; offset < size; offset += step) {
            ctx.beginPath();
            ctx.moveTo(x + offset, y);
            ctx.lineTo(x + offset, y + size);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, y + offset);
            ctx.lineTo(x + size, y + offset);
            ctx.stroke();
        }
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        for (let offset = 4; offset < size; offset += step) {
            ctx.beginPath();
            ctx.moveTo(x + offset, y);
            ctx.lineTo(x + offset, y + size);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, y + offset);
            ctx.lineTo(x + size, y + offset);
            ctx.stroke();
        }
        
        ctx.restore();
    };

    const updateYarnWeightOptions = () => {
        const unitEl = document.querySelector('#yarn-unit');
        const weightSelect = document.querySelector('#yarn-weight');
        if (!unitEl || !weightSelect) return;

        const isMetric = unitEl.value === 'metric';
        const prevIndex = weightSelect.selectedIndex >= 0 ? weightSelect.selectedIndex : 1;

        if (isMetric) {
            weightSelect.innerHTML = `
                <option value="110">DK / Light Worsted (~110 m/sq)</option>
                <option value="140">Worsted / Aran (~140 m/sq)</option>
                <option value="165">Chunky / Bulky (~165 m/sq)</option>
            `;
        } else {
            weightSelect.innerHTML = `
                <option value="120">DK / Light Worsted (~120 yds/sq)</option>
                <option value="150">Worsted / Aran (~150 yds/sq)</option>
                <option value="180">Chunky / Bulky (~180 yds/sq)</option>
            `;
        }
        weightSelect.selectedIndex = prevIndex;
    };

    const calculateYarnEstimate = () => {
        if (!state.blanketGrid || state.blanketGrid.length === 0) {
            alert('Please generate a blanket design first!');
            return;
        }

        const unit = document.querySelector('#yarn-unit')?.value || 'metric';
        const isMetric = unit === 'metric';
        const unitLabel = isMetric ? 'm' : 'yds';
        const unitFullLabel = isMetric ? 'meters' : 'yards';
        const skeinSize = isMetric ? 180 : 200;

        const yarnWeightVal = document.querySelector('#yarn-weight').value;
        const amountPerSquare = parseFloat(yarnWeightVal) || (isMetric ? 140 : 150); 
        
        const patternCounts = {};
        for (let r = 0; r < state.rows; r++) {
            for (let c = 0; c < state.cols; c++) {
                const pid = state.blanketGrid[r][c];
                patternCounts[pid] = (patternCounts[pid] || 0) + 1;
            }
        }

        const colorAmounts = {};
        Object.keys(patternCounts).forEach(pid => {
            const p = state.patterns.find(pat => pat.id === parseInt(pid));
            if (p) {
                const count = patternCounts[pid];
                const totalForPattern = count * amountPerSquare;
                const amountPerColor = totalForPattern / p.colors.length;
                
                p.colors.forEach(color => {
                    colorAmounts[color] = (colorAmounts[color] || 0) + amountPerColor;
                });
            }
        });

        // Add Border yarn estimate if border is present
        const bWidth = state.borderWidth || 0;
        const bColor = state.borderColor || '#27212b';
        if (bWidth > 0) {
            const totalRows = state.rows + bWidth * 2;
            const totalCols = state.cols + bWidth * 2;
            const totalCells = totalRows * totalCols;
            const borderCellsCount = totalCells - (state.rows * state.cols);
            
            const totalBorderAmount = borderCellsCount * amountPerSquare;
            colorAmounts[bColor] = (colorAmounts[bColor] || 0) + totalBorderAmount;
        }

        // Add Joining Yarn
        const joinMethod = document.querySelector('#join-method')?.value || 'none';
        let joinAmountPerEdge = 0;
        if (joinMethod === 'whip') joinAmountPerEdge = isMetric ? 1 : 1.1;
        if (joinMethod === 'jayg') joinAmountPerEdge = isMetric ? 1.5 : 1.6;
        if (joinMethod === 'sc') joinAmountPerEdge = isMetric ? 2 : 2.2;
        
        let totalEdges = 0;
        if (state.rows > 0 && state.cols > 0) {
            totalEdges = (state.rows - 1) * state.cols + (state.cols - 1) * state.rows;
        }
        
        const joinYarnNeeded = totalEdges * joinAmountPerEdge;
        if (joinYarnNeeded > 0) {
            colorAmounts[bColor] = (colorAmounts[bColor] || 0) + joinYarnNeeded;
        }

        const resultsContainer = document.querySelector('#yarn-results');
        resultsContainer.innerHTML = '<strong>Estimated Yarn Needed:</strong><ul>';
        let total = 0;
        Object.keys(colorAmounts).forEach(color => {
            const amount = Math.ceil(colorAmounts[color]);
            const skeins = Math.ceil(amount / skeinSize);
            const shadeInfo = getYarnShadeInfo(color);
            total += amount;
            resultsContainer.innerHTML += `
                <li style="margin-bottom: 6px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span class="color-dot" style="background: ${color}"></span>
                        <span><strong>${amount} ${unitLabel}</strong> (${skeins} skeins)</span>
                    </div>
                    <div style="font-size:0.75rem; color:var(--text-secondary); margin-left:20px; font-weight:500;">${shadeInfo}</div>
                </li>
            `;
        });
        
        resultsContainer.innerHTML += `</ul><div class="yarn-total">Total: ${total} ${unitFullLabel}</div>`;
        resultsContainer.style.display = 'block';
    };

    const updatePaintBrushOptions = () => {
        const select = document.querySelector('#paint-active-pattern');
        if (!select) return;
        select.innerHTML = '';
        state.patterns.forEach((pattern, index) => {
            const opt = document.createElement('option');
            opt.value = pattern.id;
            opt.textContent = `Brush: Pattern #${index + 1} (${PATTERN_STYLES[pattern.style].name})`;
            select.appendChild(opt);
        });
        if (state.patterns.length > 0) {
            if (!state.patterns.some(p => p.id === state.activeBrushPatternId)) {
                state.activeBrushPatternId = state.patterns[0].id;
            }
            select.value = state.activeBrushPatternId;
        }
    };

    const exportPDFBlueprint = async () => {
        if (!state.blanketGrid || state.blanketGrid.length === 0) {
            alert('Please generate a design first!');
            return;
        }

        if (!window.jspdf) {
            alert('PDF Library is still loading, please wait a second.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // PAGE 1: Design Blueprint & Overview
        doc.setFontSize(22);
        doc.text('Craftsman Blanket Blueprint', 14, 20);
        
        doc.setFontSize(11);
        doc.text(`Dimensions: ${state.rows} rows x ${state.cols} cols | Border: ${state.borderWidth} row(s) (${state.borderStyle})`, 14, 28);
        
        const canvas = document.querySelector('#blanket-container table');
        if (canvas) {
            try {
                const canvasImg = await html2canvas(canvas, { scale: 2, useCORS: true, logging: false });
                const imgData = canvasImg.toDataURL('image/png');
                
                const maxWidth = pageWidth - 28;
                let imgWidth = canvasImg.width / 4;
                let imgHeight = canvasImg.height / 4;
                
                if (imgWidth > maxWidth) {
                    const ratio = maxWidth / imgWidth;
                    imgWidth = maxWidth;
                    imgHeight = imgHeight * ratio;
                }
                
                doc.addImage(imgData, 'PNG', 14, 34, imgWidth, imgHeight);

                // PAGE 2: Assembly Diagram Guide
                doc.addPage();
                doc.setFontSize(18);
                doc.text('Assembly Chart & Square Placement Guide', 14, 20);
                doc.setFontSize(10);
                doc.text('Row-by-Row square placement coordinates (Top-Left to Bottom-Right):', 14, 28);

                let startY = 36;
                const bWidth = state.borderWidth || 0;
                const totalRows = state.rows + bWidth * 2;
                const totalCols = state.cols + bWidth * 2;

                doc.setFontSize(9);
                for (let r = 0; r < totalRows && startY < 270; r++) {
                    let rowStr = `Row ${r + 1}: `;
                    for (let c = 0; c < totalCols; c++) {
                        const isBorder = r < bWidth || r >= totalRows - bWidth || c < bWidth || c >= totalCols - bWidth;
                        if (isBorder) {
                            rowStr += `[Border] `;
                        } else {
                            const pid = state.blanketGrid[r - bWidth][c - bWidth];
                            const pIndex = state.patterns.findIndex(p => p.id === pid);
                            rowStr += `[P#${pIndex + 1}] `;
                        }
                    }
                    doc.text(rowStr, 14, startY);
                    startY += 7;
                }

                doc.save(`Blanket_Blueprint_${Date.now()}.pdf`);
            } catch (err) {
                console.error("PDF error:", err);
                alert("Failed to generate PDF.");
            }
        }
    };

    const exportBlanketAsImage = () => {
        if (!state.blanketGrid || state.blanketGrid.length === 0) return;

        const bWidth = state.borderWidth || 0;
        const bColor = state.borderColor || '#27212b';
        const innerRows = state.rows;
        const innerCols = state.cols;
        const totalRows = innerRows + bWidth * 2;
        const totalCols = innerCols + bWidth * 2;
        
        const cellSize = 100;
        const spacing = 8;
        const padding = 24;
        
        const width = totalCols * cellSize + (totalCols - 1) * spacing + padding * 2;
        const height = totalRows * cellSize + (totalRows - 1) * spacing + padding * 2;
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#120f14';
        ctx.fillRect(0, 0, width, height);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, width - 2, height - 2);
        
        for (let r = 0; r < totalRows; r++) {
            for (let c = 0; c < totalCols; c++) {
                const x = padding + c * (cellSize + spacing);
                const y = padding + r * (cellSize + spacing);
                
                const isBorder = r < bWidth || r >= totalRows - bWidth || c < bWidth || c >= totalCols - bWidth;
                
                ctx.save();
                drawRoundedRect(ctx, x, y, cellSize, cellSize, 12);
                ctx.clip();
                
                if (isBorder) {
                    ctx.fillStyle = bColor;
                    ctx.fillRect(x, y, cellSize, cellSize);
                } else {
                    const inR = r - bWidth;
                    const inC = c - bWidth;
                    const patternId = state.blanketGrid[inR][inC];
                    const pattern = state.patterns.find(p => p.id === patternId);
                
                    if (pattern) {
                        const style = pattern.style;
                        const c1 = pattern.colors[0];
                        const c2 = pattern.colors[1];
                        const c3 = pattern.colors[2];
                        const c4 = pattern.colors[3];
                        
                        if (style === 'solid') {
                            ctx.fillStyle = c1;
                            ctx.fillRect(x, y, cellSize, cellSize);
                        } else if (style === 'classic') {
                            ctx.fillStyle = c1;
                            ctx.fillRect(x, y, cellSize, cellSize);
                            
                            ctx.fillStyle = c4;
                            const o1 = cellSize * 0.12;
                            ctx.fillRect(x + o1, y + o1, cellSize - o1*2, cellSize - o1*2);
                            
                            ctx.fillStyle = c3;
                            const o2 = cellSize * 0.24;
                            ctx.fillRect(x + o2, y + o2, cellSize - o2*2, cellSize - o2*2);
                            
                            ctx.fillStyle = c2;
                            const o3 = cellSize * 0.36;
                            ctx.fillRect(x + o3, y + o3, cellSize - o3*2, cellSize - o3*2);
                        } else if (style === 'flower') {
                            ctx.fillStyle = c3;
                            ctx.fillRect(x, y, cellSize, cellSize);
                            
                            ctx.fillStyle = c2;
                            ctx.beginPath();
                            ctx.arc(x + cellSize/2, y + cellSize/2, cellSize * 0.42, 0, Math.PI * 2);
                            ctx.fill();
                            
                            ctx.fillStyle = c1;
                            ctx.beginPath();
                            ctx.arc(x + cellSize/2, y + cellSize/2, cellSize * 0.18, 0, Math.PI * 2);
                            ctx.fill();
                        } else if (style === 'mitered') {
                            ctx.fillStyle = c2;
                            ctx.fillRect(x, y, cellSize, cellSize);
                            
                            ctx.fillStyle = c3;
                            const o1 = cellSize * 0.12;
                            ctx.fillRect(x + o1, y + o1, cellSize - o1, cellSize - o1);
                            
                            ctx.fillStyle = c4;
                            const o2 = cellSize * 0.26;
                            ctx.fillRect(x + o2, y + o2, cellSize - o2, cellSize - o2);
                            
                            ctx.fillStyle = c1;
                            const o3 = cellSize * 0.40;
                            ctx.fillRect(x + o3, y + o3, cellSize - o3, cellSize - o3);
                        } else if (style === 'diamond') {
                            const cx = x + cellSize/2;
                            const cy = y + cellSize/2;
                            
                            ctx.fillStyle = c1;
                            ctx.beginPath();
                            ctx.moveTo(cx, cy);
                            ctx.lineTo(x, y);
                            ctx.lineTo(x + cellSize, y);
                            ctx.closePath();
                            ctx.fill();
                            
                            ctx.fillStyle = c2;
                            ctx.beginPath();
                            ctx.moveTo(cx, cy);
                            ctx.lineTo(x + cellSize, y);
                            ctx.lineTo(x + cellSize, y + cellSize);
                            ctx.closePath();
                            ctx.fill();
                            
                            ctx.fillStyle = c3;
                            ctx.beginPath();
                            ctx.moveTo(cx, cy);
                            ctx.lineTo(x + cellSize, y + cellSize);
                            ctx.lineTo(x, y + cellSize);
                            ctx.closePath();
                            ctx.fill();
                            
                            ctx.fillStyle = c4;
                            ctx.beginPath();
                            ctx.moveTo(cx, cy);
                            ctx.lineTo(x, y + cellSize);
                            ctx.lineTo(x, y);
                            ctx.closePath();
                            ctx.fill();
                        } else if (style === 'target') {
                            ctx.fillStyle = c4;
                            ctx.fillRect(x, y, cellSize, cellSize);
                            
                            ctx.fillStyle = c3;
                            ctx.beginPath();
                            ctx.arc(x + cellSize/2, y + cellSize/2, cellSize * 0.55, 0, Math.PI * 2);
                            ctx.fill();
                            
                            ctx.fillStyle = c2;
                            ctx.beginPath();
                            ctx.arc(x + cellSize/2, y + cellSize/2, cellSize * 0.35, 0, Math.PI * 2);
                            ctx.fill();
                            
                            ctx.fillStyle = c1;
                            ctx.beginPath();
                            ctx.arc(x + cellSize/2, y + cellSize/2, cellSize * 0.15, 0, Math.PI * 2);
                            ctx.fill();
                        } else if (style === 'checker') {
                            ctx.fillStyle = c1;
                            ctx.fillRect(x, y, cellSize/2, cellSize/2);
                            
                            ctx.fillStyle = c2;
                            ctx.fillRect(x + cellSize/2, y, cellSize/2, cellSize/2);
                            
                            ctx.fillStyle = c4;
                            ctx.fillRect(x, y + cellSize/2, cellSize/2, cellSize/2);
                            
                            ctx.fillStyle = c3;
                            ctx.fillRect(x + cellSize/2, y + cellSize/2, cellSize/2, cellSize/2);
                        }
                    } else {
                        ctx.fillStyle = '#1e294b';
                        ctx.fillRect(x, y, cellSize, cellSize);
                    }
                }
                
                drawStitchOverlay(ctx, x, y, cellSize);
                ctx.restore();
            }
        }
        
        const link = document.createElement('a');
        link.download = `blanket-design-${totalRows}x${totalCols}-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    // =========================================================================
    // 8. Event Bindings Setup
    // =========================================================================
    const bindEvents = () => {
        const rowsInput = document.querySelector('#rows');
        const colsInput = document.querySelector('#columns');
        const borderWidthInput = document.querySelector('#border-width');
        const borderStyleInput = document.querySelector('#border-style');
        const borderColorInput = document.querySelector('#border-color');
        
        if (rowsInput) {
            rowsInput.addEventListener('change', onDimensionsChange);
            rowsInput.addEventListener('input', onDimensionsChange);
        }
        if (colsInput) {
            colsInput.addEventListener('change', onDimensionsChange);
            colsInput.addEventListener('input', onDimensionsChange);
        }
        if (borderWidthInput) {
            borderWidthInput.addEventListener('change', onDimensionsChange);
        }
        if (borderStyleInput) {
            borderStyleInput.addEventListener('change', () => {
                state.borderStyle = borderStyleInput.value;
                if (state.blanketGrid && state.blanketGrid.length > 0) {
                    drawBlanketCanvas();
                }
            });
        }
        if (borderColorInput) {
            borderColorInput.addEventListener('change', () => {
                state.borderColor = borderColorInput.value;
                const borderCells = document.querySelectorAll('.border-cell');
                borderCells.forEach(cell => {
                    cell.style.backgroundColor = state.borderColor;
                    cell.style.setProperty('--color-1', state.borderColor);
                });
            });
        }

        const addPatternBtn = document.querySelector('#add-pattern-btn');
        if (addPatternBtn) {
            addPatternBtn.addEventListener('click', () => {
                const styles = Object.keys(PATTERN_STYLES);
                const randomStyle = styles[Math.floor(Math.random() * styles.length)];
                syncUIQuantitiesToState();
                addPatternToState(randomStyle);
                renderPatternsList();
                updateDimensionsInfo();
                updatePaintBrushOptions();
            });
        }

        const generateBtn = document.querySelector('#generate-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', drawBlanketCanvas);
        }

        // Paint Mode Toggle & Select
        const paintToggleBtn = document.querySelector('#paint-mode-toggle-btn');
        const paintSelect = document.querySelector('#paint-active-pattern');
        if (paintToggleBtn) {
            paintToggleBtn.addEventListener('click', () => {
                state.paintMode = !state.paintMode;
                paintToggleBtn.classList.toggle('active', state.paintMode);
                if (paintSelect) {
                    paintSelect.style.display = state.paintMode ? 'inline-block' : 'none';
                    updatePaintBrushOptions();
                }
                const table = document.querySelector('.blanket');
                if (table) {
                    table.classList.toggle('paint-mode-active', state.paintMode);
                }
            });
        }

        if (paintSelect) {
            paintSelect.addEventListener('change', (e) => {
                state.activeBrushPatternId = parseInt(e.target.value);
            });
        }

        // Work Mode Toggle
        const workModeToggle = document.querySelector('#work-mode-toggle');
        if (workModeToggle) {
            workModeToggle.addEventListener('change', (e) => {
                state.workMode = e.target.checked;
                const table = document.querySelector('.blanket');
                const progressEl = document.querySelector('#work-mode-progress');
                if (table) {
                    table.classList.toggle('work-mode-active', state.workMode);
                }
                if (progressEl) {
                    progressEl.style.display = state.workMode ? 'inline-block' : 'none';
                }
            });
        }

        // Settings Toggle Button
        const menuToggleBtn = document.querySelector('#menu-toggle-btn');
        if (menuToggleBtn) {
            menuToggleBtn.addEventListener('click', () => toggleDrawer(true));
        }

        // Settings Close Button
        const menuCloseBtn = document.querySelector('#menu-close-btn');
        if (menuCloseBtn) {
            menuCloseBtn.addEventListener('click', () => toggleDrawer(false));
        }

        // Overlay backdrop click
        const menuOverlay = document.querySelector('#menu-overlay');
        if (menuOverlay) {
            menuOverlay.addEventListener('click', () => toggleDrawer(false));
        }

        // Export history as JSON
        const exportBtn = document.querySelector('#export-history-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportHistory);
        }

        // Import history from JSON file
        const importInput = document.querySelector('#import-history-input');
        if (importInput) {
            importInput.addEventListener('change', (e) => {
                importHistory(e.target.files[0]);
                e.target.value = ''; // reset so same file can be re-imported
            });
        }

        const yarnUnitSelect = document.querySelector('#yarn-unit');
        if (yarnUnitSelect) {
            yarnUnitSelect.addEventListener('change', () => {
                updateYarnWeightOptions();
                const resultsContainer = document.querySelector('#yarn-results');
                if (resultsContainer && resultsContainer.style.display !== 'none') {
                    calculateYarnEstimate();
                }
            });
        }

        const calcYarnBtn = document.querySelector('#calc-yarn-btn');
        if (calcYarnBtn) {
            calcYarnBtn.addEventListener('click', calculateYarnEstimate);
        }

        const downloadPdfBtn = document.querySelector('#download-pdf-btn');
        if (downloadPdfBtn) {
            downloadPdfBtn.addEventListener('click', exportPDFBlueprint);
        }

        // Download image floating button click
        const downloadImageBtn = document.querySelector('#download-image-btn');
        if (downloadImageBtn) {
            downloadImageBtn.addEventListener('click', exportBlanketAsImage);
        }

        // Theme Toggle Button
        const themeToggleBtn = document.querySelector('#theme-toggle-btn');
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
                const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
                applyTheme(nextTheme);
            });
        }
    };

    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('blanket_theme', theme);
        const sunIcon = document.querySelector('#theme-icon-sun');
        const moonIcon = document.querySelector('#theme-icon-moon');
        if (sunIcon && moonIcon) {
            sunIcon.style.display = theme === 'light' ? 'block' : 'none';
            moonIcon.style.display = theme === 'dark' ? 'block' : 'none';
        }
    };

    const initTheme = () => {
        const savedTheme = localStorage.getItem('blanket_theme') || 'dark';
        applyTheme(savedTheme);
    };

    // =========================================================================
    // 9. Application Bootstrap
    // =========================================================================
    document.addEventListener('DOMContentLoaded', () => {
        initTheme();
        initDefaultState();
        renderPatternsList();
        updateDimensionsInfo();
        initHistory();
        bindEvents();
    });

})();