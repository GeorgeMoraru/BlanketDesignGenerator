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
            navigator.serviceWorker.register('/sw.js')
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
    const generateHarmoniousPalette = () => {
        // Pick a base hue randomly across the 360-degree color wheel
        const baseHue = Math.floor(Math.random() * 360);
        // Soft, realistic pastel saturation (35% - 48%)
        const s = 35 + Math.floor(Math.random() * 13); 
        // Soft, cozy lightness (65% - 75%)
        const l = 65 + Math.floor(Math.random() * 10); 

        return [
            `hsl(${baseHue}, ${s}%, ${l}%)`,                               // 1. Base pastel color
            `hsl(${(baseHue + 30) % 360}, ${s - 5}%, ${l + 5}%)`,          // 2. Analogous soft tone
            `hsl(${(baseHue + 150) % 360}, ${s - 10}%, ${l - 5}%)`,         // 3. Soft complementary contrast
            `hsl(35, 30%, 94%)`                                            // 4. Soft wool cream/off-white neutral
        ];
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
        patterns: [],
        blanketGrid: [],
        nextPatternId: 0
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
        const remainder = totalCells % count;

        state.patterns.forEach((pattern, index) => {
            pattern.quantity = baseQty + (index < remainder ? 1 : 0);
        });
    };

    // Add a pattern to our state list
    const addPatternToState = (styleKey = 'classic') => {
        const id = state.nextPatternId++;
        const colors = generateHarmoniousPalette();
        
        state.patterns.push({
            id,
            style: styleKey,
            colors,
            quantity: 0
        });

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

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
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
        
        state.rows = Math.max(1, parseInt(rowsInput.value) || 1);
        state.cols = Math.max(1, parseInt(colsInput.value) || 1);
        
        // Prevent overflow inputs
        rowsInput.value = state.rows;
        colsInput.value = state.cols;

        const totalCells = state.rows * state.cols;
        const badge = document.querySelector('#cell-count-badge');
        if (badge) {
            badge.innerText = `${totalCells} cells`;
            
            // Check if pattern quantities cover the cell requirement
            const totalQty = state.patterns.reduce((sum, p) => sum + p.quantity, 0);
            if (totalQty < totalCells) {
                badge.style.background = 'rgba(239, 68, 68, 0.1)';
                badge.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                badge.style.color = '#f87171';
                badge.title = `Shortage: You configured ${totalQty} blocks, but need ${totalCells}. Fallbacks will fill the rest.`;
            } else {
                badge.style.background = 'rgba(91, 192, 190, 0.1)';
                badge.style.borderColor = 'rgba(91, 192, 190, 0.2)';
                badge.style.color = 'var(--accent)';
                badge.title = `Covers cells: You configured ${totalQty} blocks for ${totalCells} cells.`;
            }
        }
    };

    // Triggered when rows/columns inputs change
    const onDimensionsChange = () => {
        const rowsInput = document.querySelector('#rows');
        const colsInput = document.querySelector('#columns');
        
        state.rows = Math.max(1, parseInt(rowsInput.value) || 1);
        state.cols = Math.max(1, parseInt(colsInput.value) || 1);

        rowsInput.value = state.rows;
        colsInput.value = state.cols;

        redistributeQuantities();
        renderPatternsList();
        updateDimensionsInfo();
    };

    // Sync input controls back to state patterns before generating
    const syncUIQuantitiesToState = () => {
        state.patterns.forEach(pattern => {
            const rowEl = document.querySelector(`#pattern-row-${pattern.id}`);
            if (rowEl) {
                const qtyInput = rowEl.querySelector('.pattern-qty-input');
                const styleSelect = rowEl.querySelector('.pattern-style-select');
                
                if (qtyInput) pattern.quantity = Math.max(0, parseInt(qtyInput.value) || 0);
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

            const colorVars = getPatternColorVariables(pattern.colors);
            const styleDetails = PATTERN_STYLES[pattern.style];

            item.innerHTML = `
                <div class="pattern-item-header">
                    <div class="pattern-title-group">
                        <div class="patternSymbol ${styleDetails.className}" style="${colorVars}"></div>
                        <span class="pattern-index-label">Pattern #${index + 1}</span>
                    </div>
                    <button class="btn-delete" data-id="${pattern.id}" title="Remove pattern">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
                <div class="pattern-inputs-grid">
                    <select class="pattern-style-select" data-id="${pattern.id}">
                        ${styleOptions}
                    </select>
                    <div class="pattern-qty-wrapper">
                        <span class="pattern-qty-label">Qty:</span>
                        <input type="number" min="0" max="1000" class="pattern-qty-input" value="${pattern.quantity}" />
                    </div>
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

            // Quantity change should update cell calculations immediately
            const qtyInput = item.querySelector('.pattern-qty-input');
            qtyInput.addEventListener('input', () => {
                pattern.quantity = Math.max(0, parseInt(qtyInput.value) || 0);
                updateDimensionsInfo();
            });

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
    const drawBlanketCanvas = () => {
        syncUIQuantitiesToState();
        updateDimensionsInfo();

        const canvas = document.querySelector('#blanket-container');
        if (!canvas) return;

        // Perform layout computation
        state.blanketGrid = solveBlanketGrid();

        // Create table grid element
        const table = document.createElement('table');
        table.className = 'blanket';

        for (let r = 0; r < state.rows; r++) {
            const row = document.createElement('tr');
            
            for (let c = 0; c < state.cols; c++) {
                const cell = document.createElement('td');
                cell.className = 'cellSquare';
                
                // Get assigned pattern
                const patternId = state.blanketGrid[r][c];
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

                // Staggered entry animation delay
                const delay = (r + c) * 15;
                cell.style.animationDelay = `${delay}ms`;

                row.appendChild(cell);
            }
            table.appendChild(row);
        }

        // Render table
        canvas.innerHTML = '';
        canvas.appendChild(table);
    };

    // =========================================================================
    // 7. Event Bindings Setup
    // =========================================================================
    const bindEvents = () => {
        // Blanket Dimensions adjustments
        const rowsInput = document.querySelector('#rows');
        const colsInput = document.querySelector('#columns');
        
        if (rowsInput) {
            rowsInput.addEventListener('change', onDimensionsChange);
            rowsInput.addEventListener('input', onDimensionsChange);
        }
        if (colsInput) {
            colsInput.addEventListener('change', onDimensionsChange);
            colsInput.addEventListener('input', onDimensionsChange);
        }

        // Add Pattern Click
        const addPatternBtn = document.querySelector('#add-pattern-btn');
        if (addPatternBtn) {
            addPatternBtn.addEventListener('click', () => {
                // Determine layout styles currently available
                const styles = Object.keys(PATTERN_STYLES);
                const randomStyle = styles[Math.floor(Math.random() * styles.length)];
                
                // Sync current state quantities first so we don't wipe out edits
                syncUIQuantitiesToState();
                
                addPatternToState(randomStyle);
                renderPatternsList();
                updateDimensionsInfo();
            });
        }

        // Generate Design Click
        const generateBtn = document.querySelector('#generate-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', drawBlanketCanvas);
        }
    };

    // =========================================================================
    // 8. Application Bootstrap
    // =========================================================================
    document.addEventListener('DOMContentLoaded', () => {
        initDefaultState();
        renderPatternsList();
        updateDimensionsInfo();
        bindEvents();
    });

})();