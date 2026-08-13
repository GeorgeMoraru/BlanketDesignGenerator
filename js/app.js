/**
 * Blanket Design Generator - App Logic
 * Designed for modularity, readability, and installability (PWA).
 */

(function() {
    'use strict';

    // =========================================================================
    // 0. Security & Utility Helpers
    // =========================================================================
    const escapeHtml = (str) => {
        if (typeof str !== 'string') return String(str ?? '');
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    const sanitizeHexColor = (color) => {
        if (typeof color === 'string' && /^#([0-9a-fA-F]{3}){1,2}$/.test(color.trim())) {
            return color.trim();
        }
        return '#ffffff';
    };

    const sanitizeInt = (val, defaultVal = 1, min = 1, max = 10000) => {
        const parsed = parseInt(val, 10);
        if (isNaN(parsed)) return defaultVal;
        return Math.max(min, Math.min(max, parsed));
    };

    const safeLocalStorageGet = (key, fallback = null) => {
        try {
            return localStorage.getItem(key) ?? fallback;
        } catch (e) {
            console.warn('[Storage] localStorage.getItem failed:', e);
            return fallback;
        }
    };

    const safeLocalStorageSet = (key, value) => {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            console.warn('[Storage] localStorage.setItem failed:', e);
            return false;
        }
    };

    const debounce = (fn, delay = 250) => {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    };

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
        },
        star: {
            className: 'granny-star',
            name: 'Sunburst Star',
            minColors: 4
        },
        stripes: {
            className: 'granny-stripes',
            name: 'Striped Block',
            minColors: 4
        },
        chevron: {
            className: 'granny-chevron',
            name: 'Chevron Ripple',
            minColors: 3
        }
    };

    const getPatternStyleDetails = (style) => {
        return PATTERN_STYLES[style] || PATTERN_STYLES.classic;
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
        },
        {
            name: "Stylecraft Special DK - Sunset Breeze",
            brand: "Stylecraft",
            colors: ["#ff9e79", "#f67280", "#c06c84", "#6c5b7b"],
            shades: ["Apricot (1026)", "Shrimp (1132)", "Pomegranate (1124)", "Plum (1061)"]
        },
        {
            name: "Paintbox Yarns - Lavender Mist",
            brand: "Paintbox Yarns",
            colors: ["#e1bee7", "#b39ddb", "#7e57c2", "#ede7f6"],
            shades: ["Lilac (145)", "Heather (146)", "Pansy (147)", "Fresh Linen (102)"]
        },
        {
            name: "Red Heart - Rainbow Burst",
            brand: "Red Heart",
            colors: ["#ff5252", "#ffeb3b", "#4caf50", "#2196f3"],
            shades: ["Hot Red (0311)", "Bright Yellow (0320)", "Kelly Green (0360)", "Super Blue (0380)"]
        },
        {
            name: "Hobbii - Mermaid Cove",
            brand: "Hobbii",
            colors: ["#80deea", "#26c6da", "#00acc1", "#006064"],
            shades: ["Mint (082)", "Turquoise (085)", "Teal (087)", "Ocean (089)"]
        },
        {
            name: "Scheepjes - Earth & Sky",
            brand: "Scheepjes",
            colors: ["#8d6e63", "#d7ccc8", "#90caf9", "#1565c0"],
            shades: ["Chestnut (2602)", "Clay (2605)", "Sky Blue (2610)", "Royal Indigo (2615)"]
        },
        {
            name: "Stylecraft Special DK - Neon Dream",
            brand: "Stylecraft",
            colors: ["#ff007f", "#39ff14", "#00f0ff", "#ff5f00"],
            shades: ["Neon Pink (1254)", "Neon Lime (1256)", "Neon Turquoise (1258)", "Neon Orange (1260)"]
        },
        {
            name: "Paintbox Yarns - Carnival Festival",
            brand: "Paintbox Yarns",
            colors: ["#d500f9", "#ffea00", "#00e5ff", "#ff6d00"],
            shades: ["Fuchsia Blast (160)", "Lemon Drop (115)", "Turquoise Tint (130)", "Tangerine (116)"]
        },
        {
            name: "Scheepjes - Technicolor Rainbow",
            brand: "Scheepjes",
            colors: ["#ff1744", "#651fff", "#00e676", "#ff9100"],
            shades: ["Hot Cherry (410)", "Ultra Violet (412)", "Shamrock (415)", "Electric Mandarin (418)"]
        },
        {
            name: "Hobbii - Retro Pop Candy",
            brand: "Hobbii",
            colors: ["#ff4081", "#18ffff", "#b2ff59", "#ffd740"],
            shades: ["Pink Bubblegum (088)", "Blueberry Ice (092)", "Key Lime (095)", "Lemon Drop (099)"]
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
        if (!Array.isArray(colors)) return '';
        return colors.map((color, index) => `--color-${index + 1}: ${sanitizeHexColor(color)};`).join(' ');
    };

    // =========================================================================
    // 4. Application State Management
    // =========================================================================
    const state = {
        rows: 8,
        cols: 8,
        geometry: 'square',
        crochetTerms: 'US',
        extractedPhotoPalette: [],
        borderWidth: 2,
        borderColor: '#27212b',
        borderStyle: 'solid',
        paletteIndex: 0,
        borderLayers: [
            { id: 'b-1', type: 'solid', color: '#d8c1c5' },
            { id: 'b-2', type: 'granny-cluster', color: '#b49b9c' }
        ],
        patterns: [],
        blanketGrid: [],
        completedSquares: new Set(),
        lockedCells: new Set(),
        workMode: false,
        paintMode: false,
        activeBrushPatternId: 0,
        nextPatternId: 0,
        history: [],
        currentUser: null,
        unsubscribeCloudSync: null
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
        const palIndex = state.paletteIndex !== undefined ? state.paletteIndex : 0;
        const colors = [...COMMERCIAL_PALETTES[palIndex].colors];
        const pattern = {
            id: state.nextPatternId++,
            style: style,
            quantity: 1,
            paletteIndex: palIndex,
            colors: colors,
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

        if (state.geometry === 'stripe') {
            for (let r = 0; r < rows; r++) {
                let lockedId = null;
                for (let c = 0; c < cols; c++) {
                    if (grid[r][c] !== null) {
                        lockedId = grid[r][c];
                        break;
                    }
                }

                let chosenId = lockedId;
                if (chosenId === null) {
                    const topNeighbor = r > 0 ? grid[r - 1][0] : null;
                    let available = remainingQuantities.filter(p => p.qty > 0);
                    if (available.length === 0) {
                        available = state.patterns.map(p => ({ id: p.id, qty: 999 }));
                    }
                    let options = available.filter(p => p.id !== topNeighbor);
                    if (options.length === 0) {
                        options = available;
                    }
                    const chosen = options[Math.floor(Math.random() * options.length)];
                    chosenId = chosen.id;
                    const rem = remainingQuantities.find(p => p.id === chosenId);
                    if (rem) {
                        rem.qty = Math.max(0, rem.qty - cols);
                    }
                } else {
                    const rem = remainingQuantities.find(p => p.id === chosenId);
                    if (rem) {
                        rem.qty = Math.max(0, rem.qty - cols);
                    }
                }

                for (let c = 0; c < cols; c++) {
                    grid[r][c] = chosenId;
                }
            }
            return grid;
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
    // 5b. Multi-Layer Border & Drag-and-Drop Controllers
    // =========================================================================
    const STITCH_TYPES = {
        solid: 'Solid DC/HDC Band',
        'granny-cluster': 'Granny Cluster (3-DC)',
        moss: 'Moss Stitch (Woven)',
        ribbed: 'Ribbed Cable',
        shell: 'Shell / Scallop Edging'
    };

    const updateBorderLayersFromState = () => {
        const palIndex = state.paletteIndex !== undefined ? state.paletteIndex : 0;
        const colors = COMMERCIAL_PALETTES[palIndex].colors;
        const style = state.borderStyle || 'solid';
        const width = state.borderWidth !== undefined ? state.borderWidth : 2;
        
        state.borderLayers = Array.from({ length: width }, (_, i) => ({
            id: `b-${i}`,
            type: style,
            color: colors[i % colors.length] || '#27212b'
        }));
    };

    const getComplementaryHex = (hex) => {
        let color = (hex || '#000000').replace('#', '');
        if (color.length === 3) color = color.split('').map(c => c + c).join('');
        const num = parseInt(color, 16);
        let r = 255 - ((num >> 16) & 255);
        let g = 255 - ((num >> 8) & 255);
        let b = 255 - (num & 255);
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    };

    const generateOmbreShades = (hex, count) => {
        let color = (hex || '#e07a5f').replace('#', '');
        if (color.length === 3) color = color.split('').map(c => c + c).join('');
        const num = parseInt(color, 16);
        let r = (num >> 16) & 255;
        let g = (num >> 8) & 255;
        let b = num & 255;

        const shades = [];
        for (let i = 0; i < count; i++) {
            const factor = 0.4 + (i / Math.max(1, count - 1)) * 0.7;
            const nr = Math.min(255, Math.floor(r * factor));
            const ng = Math.min(255, Math.floor(g * factor));
            const nb = Math.min(255, Math.floor(b * factor));
            shades.push(`#${((1 << 24) + (nr << 16) + (ng << 8) + nb).toString(16).slice(1)}`);
        }
        return shades;
    };

    const updateLockControlsUI = () => {
        const dragLockControls = document.querySelector('#drag-lock-controls');
        const badge = document.querySelector('#locked-count-badge');
        const clearBtn = document.querySelector('#clear-locks-btn');
        if (!dragLockControls) return;

        const lockCount = state.lockedCells ? state.lockedCells.size : 0;
        if (lockCount > 0) {
            dragLockControls.style.display = 'flex';
            if (badge) badge.textContent = `${lockCount} Locked`;
            if (clearBtn) clearBtn.style.display = 'inline-block';
        } else {
            if (badge) badge.textContent = '0 Locked';
            if (clearBtn) clearBtn.style.display = 'none';
            dragLockControls.style.display = 'none';
        }
    };

    const swapTiles = (r1, c1, r2, c2) => {
        if (!state.blanketGrid || r1 < 0 || r1 >= state.rows || c1 < 0 || c1 >= state.cols ||
            r2 < 0 || r2 >= state.rows || c2 < 0 || c2 >= state.cols) {
            return false;
        }

        const srcKey = `${r1}-${c1}`;
        const destKey = `${r2}-${c2}`;

        if (state.lockedCells.has(destKey)) {
            console.log(`Cannot drop onto locked cell (${r2}, ${c2})`);
            return false;
        }

        const temp = state.blanketGrid[r1][c1];
        state.blanketGrid[r1][c1] = state.blanketGrid[r2][c2];
        state.blanketGrid[r2][c2] = temp;

        if (state.lockedCells.has(srcKey)) {
            state.lockedCells.delete(srcKey);
            state.lockedCells.add(destKey);
        }

        drawBlanketCanvas(true);
        appendToHistory();
        return true;
    };

    let touchDragState = null;

    const setupCellPointerDrag = (cell, inR, inC) => {
        cell.addEventListener('pointerdown', (e) => {
            if (state.paintMode || state.workMode) return;
            if (e.target.closest('.cell-lock-btn')) return;

            touchDragState = {
                srcR: inR,
                srcC: inC,
                startX: e.clientX,
                startY: e.clientY,
                isDragging: false,
                ghostEl: null,
                pointerId: e.pointerId
            };
        });
    };

    window.addEventListener('pointermove', (e) => {
        if (!touchDragState) return;
        const dx = e.clientX - touchDragState.startX;
        const dy = e.clientY - touchDragState.startY;

        if (!touchDragState.isDragging && Math.sqrt(dx * dx + dy * dy) > 8) {
            touchDragState.isDragging = true;

            const ghost = document.createElement('div');
            ghost.className = 'drag-ghost';
            const patId = state.blanketGrid[touchDragState.srcR][touchDragState.srcC];
            const pattern = state.patterns.find(p => p.id === patId);
            if (pattern) {
                const styleDetails = getPatternStyleDetails(pattern.style);
                ghost.classList.add(styleDetails.className);
                ghost.style = getPatternColorVariables(pattern.colors);
            }
            ghost.style.transform = `translate3d(${e.clientX - 24}px, ${e.clientY - 24}px, 0)`;
            document.body.appendChild(ghost);
            touchDragState.ghostEl = ghost;
        }

        if (touchDragState.isDragging && touchDragState.ghostEl) {
            touchDragState.ghostEl.style.transform = `translate3d(${e.clientX - 24}px, ${e.clientY - 24}px, 0)`;

            const targetEl = document.elementFromPoint(e.clientX, e.clientY);
            document.querySelectorAll('.cellSquare.drag-over').forEach(c => c.classList.remove('drag-over'));
            if (targetEl && targetEl.classList.contains('cellSquare') && !targetEl.classList.contains('border-cell')) {
                targetEl.classList.add('drag-over');
            }
        }
    });

    window.addEventListener('pointerup', (e) => {
        if (!touchDragState) return;

        if (touchDragState.isDragging) {
            if (touchDragState.ghostEl) {
                touchDragState.ghostEl.remove();
            }
            document.querySelectorAll('.cellSquare.drag-over').forEach(c => c.classList.remove('drag-over'));

            const targetEl = document.elementFromPoint(e.clientX, e.clientY);
            if (targetEl && targetEl.classList.contains('cellSquare') && !targetEl.classList.contains('border-cell')) {
                const destR = parseInt(targetEl.dataset.inRow);
                const destC = parseInt(targetEl.dataset.inCol);
                if (!isNaN(destR) && !isNaN(destC)) {
                    swapTiles(touchDragState.srcR, touchDragState.srcC, destR, destC);
                }
            }
        }
        touchDragState = null;
    });

    // =========================================================================
    // 5c. Photo-to-Palette AI Engine (CIELAB Delta E Matcher)
    // =========================================================================
    const hexToRgb = (hex) => {
        let c = (hex || '#000000').replace('#', '');
        if (c.length === 3) c = c.split('').map(x => x + x).join('');
        const num = parseInt(c, 16);
        return [ (num >> 16) & 255, (num >> 8) & 255, num & 255 ];
    };

    const rgbToLab = (r, g, b) => {
        let nr = r / 255, ng = g / 255, nb = b / 255;
        nr = nr > 0.04045 ? Math.pow((nr + 0.055) / 1.055, 2.4) : nr / 12.92;
        ng = ng > 0.04045 ? Math.pow((ng + 0.055) / 1.055, 2.4) : ng / 12.92;
        nb = nb > 0.04045 ? Math.pow((nb + 0.055) / 1.055, 2.4) : nb / 12.92;

        let x = (nr * 0.4124564 + ng * 0.3575761 + nb * 0.1804375) / 0.95047;
        let y = (nr * 0.2126729 + ng * 0.7151522 + nb * 0.0721750) / 1.00000;
        let z = (nr * 0.0193339 + ng * 0.1191920 + nb * 0.9503041) / 1.08883;

        const fx = x > 0.008856 ? Math.cbrt(x) : (7.787 * x) + (16 / 116);
        const fy = y > 0.008856 ? Math.cbrt(y) : (7.787 * y) + (16 / 116);
        const fz = z > 0.008856 ? Math.cbrt(z) : (7.787 * z) + (16 / 116);

        return [ (116 * fy) - 16, 500 * (fx - fy), 200 * (fy - fz) ];
    };

    const deltaE76 = (lab1, lab2) => {
        const dl = lab1[0] - lab2[0];
        const da = lab1[1] - lab2[1];
        const db = lab1[2] - lab2[2];
        return Math.sqrt(dl * dl + da * da + db * db);
    };

    const findClosestYarnShade = (hexColor) => {
        const [r, g, b] = hexToRgb(hexColor);
        const targetLab = rgbToLab(r, g, b);
        let minDelta = Infinity;
        let bestMatch = { brand: 'Custom', shadeName: hexColor, hex: hexColor };

        COMMERCIAL_PALETTES.forEach(pal => {
            pal.colors.forEach((hex, i) => {
                const [pr, pg, pb] = hexToRgb(hex);
                const palLab = rgbToLab(pr, pg, pb);
                const dist = deltaE76(targetLab, palLab);
                if (dist < minDelta) {
                    minDelta = dist;
                    bestMatch = {
                        brand: pal.brand,
                        shadeName: pal.shades[i],
                        hex: hex
                    };
                }
            });
        });
        return bestMatch;
    };

    const extractPhotoPalette = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 100;
                canvas.height = 100;
                ctx.drawImage(img, 0, 0, 100, 100);

                const imgData = ctx.getImageData(0, 0, 100, 100).data;
                const sampledColors = [];
                for (let i = 0; i < imgData.length; i += 64) {
                    const r = imgData[i];
                    const g = imgData[i + 1];
                    const b = imgData[i + 2];
                    const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
                    sampledColors.push(hex);
                }

                const extracted = Array.from(new Set(sampledColors)).slice(0, 4);
                state.extractedPhotoPalette = extracted;

                renderPhotoSwatches();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };

    const renderPhotoSwatches = () => {
        const container = document.querySelector('#photo-swatches-container');
        const list = document.querySelector('#photo-swatches-list');
        if (!container || !list) return;

        list.innerHTML = '';
        state.extractedPhotoPalette.forEach(hex => {
            const match = findClosestYarnShade(hex);
            const item = document.createElement('div');
            item.className = 'photo-swatch-item';
            item.innerHTML = `
                <div class="photo-swatch-circle" style="background:${hex};"></div>
                <div class="yarn-match-name">
                    <strong>${match.brand}</strong> - ${match.shadeName}
                </div>
            `;
            list.appendChild(item);
        });
        container.style.display = 'block';
    };

    const applyPhotoPaletteToState = () => {
        if (!state.extractedPhotoPalette || state.extractedPhotoPalette.length === 0) return;
        if (state.patterns.length > 0) {
            state.patterns.forEach(p => {
                p.colors = [...state.extractedPhotoPalette];
            });
            drawBlanketCanvas(true);
            renderPatternsList();
        }
    };

    // =========================================================================
    // 5d. Round-by-Round Written Pattern Generator
    // =========================================================================
    const CROCHET_TERMS = {
        US: {
            sc: 'sc',
            hdc: 'hdc',
            dc: 'dc',
            tr: 'tr',
            slst: 'sl st',
            ring: 'magic ring (or ch 4, sl st to first ch to form ring)'
        },
        UK: {
            sc: 'dc',
            hdc: 'htr',
            dc: 'tr',
            tr: 'dtr',
            slst: 'ss',
            ring: 'magic ring (or ch 4, ss to first ch to form ring)'
        }
    };

    const generateWrittenInstructions = () => {
        const outputBox = document.querySelector('#written-instructions-output');
        if (!outputBox) return;

        const terms = CROCHET_TERMS[state.crochetTerms || 'US'];
        let html = `<h4 style="margin:0 0 8px 0; color:var(--accent);">Written Instructions (${state.crochetTerms || 'US'} Terms)</h4>`;
        html += `<p style="font-size:11px; color:var(--text-secondary); margin-bottom:10px;">Geometry: <strong>${(state.geometry || 'square').toUpperCase()}</strong> | Motifs: <strong>${state.patterns.length}</strong> patterns</p>`;

        state.patterns.forEach((p, idx) => {
            const pName = PATTERN_STYLES[p.style]?.name || 'Granny Motif';
            const c1 = p.colors[0] || '#ffffff';
            const c2 = p.colors[1] || c1;
            const c3 = p.colors[2] || c2;
            const c4 = p.colors[3] || c3;

            html += `<div class="written-round-step">`;
            html += `<strong>Pattern #${idx + 1} (${pName})</strong> - Make ${p.quantity} motifs:<br/>`;
            html += `• <strong>Round 1</strong>: With <span class="color-dot" style="background:${c1}"></span>, start with ${terms.ring}. Ch 3 (counts as 1 ${terms.dc}), 2 ${terms.dc} into ring, ch 2, *3 ${terms.dc} into ring, ch 2; repeat from * 2 more times. Join with ${terms.slst}. Fasten off.<br/>`;
            html += `• <strong>Round 2</strong>: Join <span class="color-dot" style="background:${c2}"></span> in any ch-2 corner. Ch 3, (2 ${terms.dc}, ch 2, 3 ${terms.dc}) in same corner, ch 1, *(3 ${terms.dc}, ch 2, 3 ${terms.dc}) in next corner, ch 1; repeat from * 2 more times. Join with ${terms.slst}. Fasten off.<br/>`;
            html += `• <strong>Round 3</strong>: Join <span class="color-dot" style="background:${c3}"></span> in corner space. Ch 3, (2 ${terms.dc}, ch 2, 3 ${terms.dc}) in same corner, ch 1, 3 ${terms.dc} in next ch-1 space, ch 1, *(3 ${terms.dc}, ch 2, 3 ${terms.dc}) in corner, ch 1, 3 ${terms.dc} in side space, ch 1; repeat from *. Join with ${terms.slst}. Fasten off.<br/>`;
            html += `• <strong>Round 4</strong>: Join <span class="color-dot" style="background:${c4}"></span> in corner space. Repeat Round 3 working 3 ${terms.dc} clusters along edges. Join with ${terms.slst}. Fasten off.`;
            html += `</div>`;
        });

        outputBox.innerHTML = html;
        outputBox.style.display = 'block';
    };

    // =========================================================================
    // 6. UI / DOM Controller
    // =========================================================================
    
    // Update the layout grid cell count badge & validate sizes
    const updateDimensionsInfo = () => {
        const rowsInput = document.querySelector('#rows');
        const colsInput = document.querySelector('#columns');
        const bWidthSelect = document.querySelector('#border-width-select');
        const bStyleSelect = document.querySelector('#border-pattern-select');
        
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

            if (totalCells > 1600) {
                badge.innerText += ` ⚠️ High Grid Size`;
                badge.title += ` Note: Grids >1600 cells may impact DOM rendering performance on low-end devices.`;
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

        if (!state.patterns || state.patterns.length === 0) {
            addPatternToState('classic');
            addPatternToState('flower');
        }

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
            const styleDetails = getPatternStyleDetails(pattern.style);

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
                <div class="pattern-inputs-grid" style="display: flex; gap: 8px;">
                    <select class="pattern-style-select" data-id="${pattern.id}" style="width: 100%;">
                        ${styleOptions}
                    </select>
                </div>
                ${(() => {
                    if (!state.blanketGrid || state.blanketGrid.length === 0) return '';
                    let count = 0;
                    for (const row of state.blanketGrid) {
                        for (const cell of row) { if (cell === pattern.id) count++; }
                    }
                    if (count === 0) return '';
                    const yardagePerCell = 2.5;
                    const totalM = Math.ceil(count * yardagePerCell);
                    const skeins = Math.ceil(totalM / 100);
                    return `<div style="font-size:11px;color:var(--text-secondary);margin-top:4px;padding:4px 6px;background:rgba(255,255,255,0.04);border-radius:6px;">🧶 ${count} squares · ~${totalM}m · ${skeins} skein${skeins !== 1 ? 's' : ''}</div>`;
                })()}
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
                        previewSymbol.classList.add(getPatternStyleDetails(matched.style).className);
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
        updateBorderLayersFromState();
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

            if (!state.patterns || state.patterns.length === 0) {
                addPatternToState('classic');
                addPatternToState('flower');
            }

            const colors = COMMERCIAL_PALETTES[state.paletteIndex].colors;
            state.patterns.forEach(p => {
                p.paletteIndex = state.paletteIndex;
                p.colors = [...colors];
            });

            redistributeQuantities();
            renderPatternsList();
            syncUIQuantitiesToState();
            updateDimensionsInfo();

            // Reset work mode progress for new generation
            state.completedSquares = new Set();
            
            // Perform layout computation
            state.blanketGrid = solveBlanketGrid();
        } else if (!state.blanketGrid || state.blanketGrid.length !== state.rows || !state.blanketGrid[0] || state.blanketGrid[0].length !== state.cols) {
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

        // Auto-scale cell size dynamically to fit viewport width and height without horizontal scrolling
        const isMobile = window.innerWidth <= 768;
        const availW = isMobile ? Math.min(window.innerWidth - 24, (canvas.clientWidth || window.innerWidth) - 24) : (canvas.clientWidth || 800);
        const availH = isMobile ? Math.min(window.innerHeight - 180, (canvas.clientHeight || window.innerHeight) - 180) : (canvas.clientHeight || 700);
        
        const spacing = 0;
        let padding = isMobile ? 12 : 24;
        if (state.geometry === 'hexagon') {
            padding += isMobile ? 24 : 48;
        }
        const cellW = Math.floor((availW - padding - (totalCols * spacing)) / totalCols);
        const cellH = Math.floor((availH - padding - (totalRows * spacing)) / totalRows);
        const calculatedCellSize = Math.max(14, Math.min(72, Math.min(cellW, cellH)));

        // Create table grid element
        const table = document.createElement('table');
        table.className = `blanket grid-${state.geometry || 'square'}`;
        table.style.setProperty('--cell-size', `${calculatedCellSize}px`);
        table.style.setProperty('--cell-spacing', `${spacing}px`);
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
                    
                    const distFromEdge = Math.min(r, totalRows - 1 - r, c, totalCols - 1 - c);
                    const layer = state.borderLayers && state.borderLayers[distFromEdge] ? state.borderLayers[distFromEdge] : null;

                    const layerColor = layer ? layer.color : bColor;
                    cell.classList.add('granny-solid');
                    cell.style.backgroundColor = layerColor;
                    cell.style.setProperty('--color-1', layerColor);

                    if (layer && layer.type !== 'solid') {
                        cell.classList.add(`stitch-${layer.type}`);
                    } else if (bStyle !== 'solid') {
                        cell.classList.add(`border-${bStyle}`);
                    }
                    cell.title = `Border Round ${distFromEdge + 1}${layer ? ' (' + (STITCH_TYPES[layer.type] || layer.type) + ')' : ''}`;

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
                    cell.dataset.inRow = inR;
                    cell.dataset.inCol = inC;

                    if (state.geometry === 'triangle') {
                        cell.classList.add((inR + inC) % 2 === 0 ? 'tri-up' : 'tri-down');
                    } else if (state.geometry === 'c2c') {
                        const badge = document.createElement('span');
                        badge.className = 'c2c-badge';
                        badge.textContent = `D${inR + inC + 1}`;
                        cell.appendChild(badge);
                    }

                    const patternId = (state.blanketGrid && state.blanketGrid[inR] && state.blanketGrid[inR][inC] !== undefined) ? state.blanketGrid[inR][inC] : null;
                    const pattern = patternId !== null ? state.patterns.find(p => p.id === patternId) : null;

                    if (pattern) {
                        const styleDetails = getPatternStyleDetails(pattern.style);
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
                        updateLockControlsUI();
                    });

                    cell.appendChild(lockBtn);

                    // Setup touch pointer drag and HTML5 drag and drop
                    cell.setAttribute('draggable', 'true');
                    setupCellPointerDrag(cell, inR, inC);

                    cell.addEventListener('dragstart', (e) => {
                        if (state.paintMode || state.workMode) return;
                        e.dataTransfer.setData('text/plain', JSON.stringify({ r: inR, c: inC }));
                        e.dataTransfer.effectAllowed = 'move';
                        cell.classList.add('cell-dragging');
                    });
                    cell.addEventListener('dragend', () => {
                        cell.classList.remove('cell-dragging');
                    });
                    cell.addEventListener('dragover', (e) => {
                        if (state.paintMode || state.workMode) return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        cell.classList.add('drag-over');
                    });
                    cell.addEventListener('dragleave', () => {
                        cell.classList.remove('drag-over');
                    });
                    cell.addEventListener('drop', (e) => {
                        if (state.paintMode || state.workMode) return;
                        e.preventDefault();
                        cell.classList.remove('drag-over');
                        const dataStr = e.dataTransfer.getData('text/plain');
                        if (!dataStr) return;
                        
                        try {
                            const source = JSON.parse(dataStr);
                            if (source.r !== inR || source.c !== inC) {
                                swapTiles(source.r, source.c, inR, inC);
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
                                cell.classList.add(getPatternStyleDetails(pattern.style).className);
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
    
    // Toggle Design Sidebar
    const toggleSidebar = (open) => {
        const sidebar = document.querySelector('.design-sidebar');
        const overlay = document.querySelector('#menu-overlay');
        if (sidebar) sidebar.classList.toggle('open', open);
        if (overlay) {
            overlay.classList.toggle('active', open);
            if (open) {
                toggleDrawer(false);
            }
        }
    };

    // Toggle Settings Drawer
    const toggleDrawer = (open) => {
        const drawer = document.querySelector('.settings-container');
        const overlay = document.querySelector('#menu-overlay');
        if (drawer) drawer.classList.toggle('open', open);
        if (overlay) {
            overlay.classList.toggle('active', open);
            if (open) {
                toggleSidebar(false);
            }
        }
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
            if (Array.isArray(item.patterns)) {
                item.patterns.forEach(p => {
                    if (Array.isArray(p.colors)) {
                        p.colors.forEach(c => uniqueColors.add(sanitizeHexColor(c)));
                    }
                });
            }
            Array.from(uniqueColors).slice(0, 8).forEach(color => {
                swatchesHtml += `<div class="history-preview-swatch" style="background: ${color};"></div>`;
            });
            
            const safeRows = sanitizeInt(item.rows, 8, 1, 100);
            const safeCols = sanitizeInt(item.cols, 8, 1, 100);
            
            historyItem.innerHTML = `
                <div class="history-item-header">
                    <span class="history-item-time">${escapeHtml(dateStr)}</span>
                    <div style="display:flex; align-items:center; gap:6px;">
                        <span class="history-item-size">${safeRows}×${safeCols}</span>
                        <button class="btn-delete-history btn-delete" data-id="${item.id}" title="Remove design" style="padding: 2px 4px;">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </div>
                <div class="history-preview-bar">
                    ${swatchesHtml}
                </div>
            `;
            
            historyItem.addEventListener('click', (e) => {
                if (e.target.closest('.btn-delete-history')) {
                    e.stopPropagation();
                    deleteHistoryItem(item.id);
                } else {
                    restoreDesign(item.id);
                }
            });
            
            listContainer.appendChild(historyItem);
        });
    };

    const restoreDesign = (id) => {
        const item = state.history.find(h => h.id === id);
        if (!item) return;
        
        state.rows = item.rows;
        state.cols = item.cols;
        state.borderWidth = item.borderWidth ?? 2;
        state.borderColor = item.borderColor || '#27212b';
        state.borderStyle = item.borderStyle || (item.borderLayers && item.borderLayers[0] ? item.borderLayers[0].type : 'solid');
        state.lockedCells = new Set(item.lockedCells || []);
        state.patterns = JSON.parse(JSON.stringify(item.patterns));
        state.blanketGrid = JSON.parse(JSON.stringify(item.grid));
        
        updateBorderLayersFromState();

        if (state.patterns && state.patterns.length > 0) {
            state.paletteIndex = state.patterns[0].paletteIndex || 0;
        }
        
        const rowsInput = document.querySelector('#rows');
        const colsInput = document.querySelector('#columns');
        if (rowsInput) rowsInput.value = state.rows;
        if (colsInput) colsInput.value = state.cols;

        const borderPatternSelect = document.querySelector('#border-pattern-select');
        const borderWidthSelect = document.querySelector('#border-width-select');
        if (borderPatternSelect) borderPatternSelect.value = state.borderStyle;
        if (borderWidthSelect) borderWidthSelect.value = state.borderWidth;
        
        let maxPatternId = 0;
        state.patterns.forEach(p => {
            if (p.id >= maxPatternId) maxPatternId = p.id + 1;
        });
        state.nextPatternId = maxPatternId;
        
        populateGlobalPaletteDropdown();
        renderPatternsList();
        updateDimensionsInfo();
        drawBlanketCanvas(true);
        
        const downloadBtn = document.querySelector('#download-image-btn');
        if (downloadBtn) downloadBtn.style.display = 'flex';
        
        toggleDrawer(false);
    };

    const deleteHistoryItem = (id) => {
        state.history = state.history.filter(h => h.id !== id);
        localforage.setItem('blanket_local_history', state.history);
        renderHistoryList();
        if (state.currentUser && window.FirebaseAuthSync) {
            window.FirebaseAuthSync.deleteDesignFromCloud(state.currentUser.uid, id);
        }
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
        if (typeof showToast === 'function') {
            showToast('✓ Design saved to history');
        }

        if (state.currentUser && window.FirebaseAuthSync) {
            window.FirebaseAuthSync.saveDesignToCloud(state.currentUser.uid, entry);
        }
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

        // Add Border yarn estimate for Multi-Layer Border System
        if (state.borderLayers && state.borderLayers.length > 0) {
            const innerW = state.cols;
            const innerH = state.rows;
            const STITCH_MULTIPLIERS = {
                solid: 1.0,
                'granny-cluster': 1.25,
                moss: 1.1,
                ribbed: 1.4,
                shell: 1.5
            };

            state.borderLayers.forEach((layer, idx) => {
                const k = idx + 1;
                // Linear perimeter formula: 2 * (W + H + 8*k)
                const perimeterUnits = 2 * (innerW + innerH + 8 * k);
                const multiplier = STITCH_MULTIPLIERS[layer.type] || 1.0;
                const layerYarn = perimeterUnits * (amountPerSquare * 0.12) * multiplier;

                colorAmounts[layer.color] = (colorAmounts[layer.color] || 0) + layerYarn;
            });
        }

        // Add Joining Seam Yarn
        const joinMethod = document.querySelector('#join-method')?.value || 'none';
        const SEAM_MULTIPLIERS = {
            none: 0,
            mattress: 1.25,
            whip: 1.25,
            slipstitch: 1.60,
            jayg: 1.85,
            sc: 2.40
        };

        const seamMult = SEAM_MULTIPLIERS[joinMethod] || 0;
        let totalEdges = 0;
        if (state.rows > 0 && state.cols > 0) {
            totalEdges = state.rows * (state.cols - 1) + state.cols * (state.rows - 1);
        }

        const joinYarnNeeded = totalEdges * (isMetric ? 0.15 : 0.16) * seamMult * (amountPerSquare * 0.1);
        const bColor = state.borderLayers && state.borderLayers.length > 0 ? state.borderLayers[0].color : '#27212b';
        if (joinYarnNeeded > 0) {
            colorAmounts[bColor] = (colorAmounts[bColor] || 0) + joinYarnNeeded;
        }

        const addBuffer = document.querySelector('#yarn-safety-buffer')?.checked;
        const safetyFactor = addBuffer ? 1.10 : 1.0;

        const resultsContainer = document.querySelector('#yarn-results');
        resultsContainer.innerHTML = `<strong>Estimated Yarn Needed ${addBuffer ? '(Includes 10% Safety Buffer)' : ''}:</strong><ul>`;
        let total = 0;
        Object.keys(colorAmounts).forEach(color => {
            const amount = Math.ceil(colorAmounts[color] * safetyFactor);
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
        
        resultsContainer.innerHTML += `</ul><div class="yarn-total">Grand Total: ${total} ${unitFullLabel}</div>`;
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

                // PAGE 3: Written Instructions
                doc.addPage();
                doc.setFontSize(18);
                doc.text('Step-by-Step Written Pattern Instructions', 14, 20);
                doc.setFontSize(10);
                doc.text(`Terminology: ${state.crochetTerms || 'US'} Terms | Geometry: ${(state.geometry || 'square').toUpperCase()}`, 14, 28);

                let patternY = 36;
                const terms = CROCHET_TERMS[state.crochetTerms || 'US'];
                state.patterns.forEach((p, idx) => {
                    if (patternY > 260) {
                        doc.addPage();
                        patternY = 20;
                    }
                    const pName = PATTERN_STYLES[p.style]?.name || 'Granny Motif';
                    doc.setFontSize(11);
                    doc.text(`Pattern #${idx + 1} (${pName}) - Make ${p.quantity} motifs:`, 14, patternY);
                    patternY += 6;
                    doc.setFontSize(9);
                    doc.text(`- Round 1: Start with ${terms.ring}. Ch 3, 2 ${terms.dc} into ring, ch 2, *3 ${terms.dc}, ch 2; repeat 2x. Join with ${terms.slst}.`, 16, patternY);
                    patternY += 5;
                    doc.text(`- Round 2: Join in corner. Ch 3, (2 ${terms.dc}, ch 2, 3 ${terms.dc}) in corner, ch 1, *(3 ${terms.dc}, ch 2, 3 ${terms.dc}) in next corner, ch 1; repeat 2x.`, 16, patternY);
                    patternY += 5;
                    doc.text(`- Round 3: Join in corner. Ch 3, (2 ${terms.dc}, ch 2, 3 ${terms.dc}) in corner, ch 1, 3 ${terms.dc} in side space, ch 1; repeat around.`, 16, patternY);
                    patternY += 5;
                    doc.text(`- Round 4: Join in corner. Repeat Round 3 working 3 ${terms.dc} into side spaces along edges.`, 16, patternY);
                    patternY += 8;
                });

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
                    const distFromEdge = Math.min(r, totalRows - 1 - r, c, totalCols - 1 - c);
                    const layer = state.borderLayers && state.borderLayers[distFromEdge] ? state.borderLayers[distFromEdge] : null;
                    const layerColor = layer ? layer.color : bColor;
                    ctx.fillStyle = layerColor;
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
    const populateGlobalPaletteDropdown = () => {
        const globalPaletteSelect = document.querySelector('#global-palette-select');
        if (!globalPaletteSelect) return;
        globalPaletteSelect.innerHTML = '';
        
        COMMERCIAL_PALETTES.forEach((pal, idx) => {
            const opt = document.createElement('option');
            opt.value = idx;
            opt.textContent = `${pal.brand} - ${pal.name}`;
            if (state.paletteIndex === idx) opt.selected = true;
            globalPaletteSelect.appendChild(opt);
        });
    };

    // =========================================================================
    // 8. Event Bindings Setup
    // =========================================================================
    const bindEvents = () => {
        const rowsInput = document.querySelector('#rows');
        const colsInput = document.querySelector('#columns');
        
        const debouncedDimensionsChange = debounce(onDimensionsChange, 250);
        if (rowsInput) {
            rowsInput.addEventListener('change', onDimensionsChange);
            rowsInput.addEventListener('input', debouncedDimensionsChange);
        }
        if (colsInput) {
            colsInput.addEventListener('change', onDimensionsChange);
            colsInput.addEventListener('input', debouncedDimensionsChange);
        }

        const globalPaletteSelect = document.querySelector('#global-palette-select');
        if (globalPaletteSelect) {
            globalPaletteSelect.addEventListener('change', (e) => {
                const idx = parseInt(e.target.value);
                state.paletteIndex = idx;
                const colors = COMMERCIAL_PALETTES[idx].colors;
                
                // Update patterns colors
                state.patterns.forEach(p => {
                    p.paletteIndex = idx;
                    p.colors = [...colors];
                });
                
                // Update border layers colors
                updateBorderLayersFromState();
                
                // Rerender lists & draw
                renderPatternsList();
                drawBlanketCanvas(true);
            });
        }

        const borderPatternSelect = document.querySelector('#border-pattern-select');
        if (borderPatternSelect) {
            borderPatternSelect.addEventListener('change', (e) => {
                state.borderStyle = e.target.value;
                updateBorderLayersFromState();
                drawBlanketCanvas(true);
            });
        }

        const borderWidthSelect = document.querySelector('#border-width-select');
        if (borderWidthSelect) {
            borderWidthSelect.addEventListener('change', (e) => {
                state.borderWidth = parseInt(e.target.value) || 0;
                updateBorderLayersFromState();
                drawBlanketCanvas(true);
            });
        }

        const sidebarToggleBtn = document.querySelector('#sidebar-toggle-btn');
        const sidebarCloseBtn = document.querySelector('#sidebar-close-btn');
        if (sidebarToggleBtn) {
            sidebarToggleBtn.addEventListener('click', () => toggleSidebar(true));
        }
        if (sidebarCloseBtn) {
            sidebarCloseBtn.addEventListener('click', () => toggleSidebar(false));
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
            generateBtn.addEventListener('click', () => drawBlanketCanvas(false));
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

        // Work Mode Toggle Button
        const workModeToggleBtn = document.querySelector('#work-mode-toggle-btn');
        if (workModeToggleBtn) {
            workModeToggleBtn.addEventListener('click', () => {
                state.workMode = !state.workMode;
                workModeToggleBtn.classList.toggle('active', state.workMode);
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
            menuOverlay.addEventListener('click', () => {
                toggleDrawer(false);
                toggleSidebar(false);
            });
        }


        // Motif Geometry Shape Selector
        const geomSelect = document.querySelector('#geometry-shape');
        if (geomSelect) {
            geomSelect.addEventListener('change', (e) => {
                state.geometry = e.target.value;
                if (state.blanketGrid && state.blanketGrid.length > 0) {
                    drawBlanketCanvas(true);
                }
            });
        }

        // Photo-to-Palette AI Upload Handlers
        const triggerPhotoBtn = document.querySelector('#trigger-photo-upload-btn');
        const photoInput = document.querySelector('#photo-upload-input');
        const applyPhotoBtn = document.querySelector('#apply-photo-palette-btn');

        if (triggerPhotoBtn && photoInput) {
            triggerPhotoBtn.addEventListener('click', () => photoInput.click());
            photoInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    extractPhotoPalette(e.target.files[0]);
                }
            });
        }

        if (applyPhotoBtn) {
            applyPhotoBtn.addEventListener('click', applyPhotoPaletteToState);
        }

        // Written Pattern Generator Handlers
        const toggleWrittenBtn = document.querySelector('#toggle-written-instructions-btn');
        if (toggleWrittenBtn) {
            toggleWrittenBtn.addEventListener('click', generateWrittenInstructions);
        }

        const termsUsBtn = document.querySelector('#terms-us-btn');
        const termsUkBtn = document.querySelector('#terms-uk-btn');
        if (termsUsBtn && termsUkBtn) {
            termsUsBtn.addEventListener('click', () => {
                state.crochetTerms = 'US';
                termsUsBtn.classList.add('active');
                termsUkBtn.classList.remove('active');
                generateWrittenInstructions();
            });
            termsUkBtn.addEventListener('click', () => {
                state.crochetTerms = 'UK';
                termsUkBtn.classList.add('active');
                termsUsBtn.classList.remove('active');
                generateWrittenInstructions();
            });
        }

        // Pattern Sharing Button
        const sharePatternBtn = document.querySelector('#share-pattern-btn');
        if (sharePatternBtn) {
            sharePatternBtn.addEventListener('click', shareCurrentPattern);
        }

        // Clear locks button
        const clearLocksBtn = document.querySelector('#clear-locks-btn');
        if (clearLocksBtn) {
            clearLocksBtn.addEventListener('click', () => {
                state.lockedCells.clear();
                updateLockControlsUI();
                drawBlanketCanvas(true);
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

        // Auto-rescale grid layout on window resize / mobile orientation change
        let resizeTimer = null;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (state.blanketGrid && state.blanketGrid.length > 0) {
                    drawBlanketCanvas(true);
                }
            }, 150);
        });

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

    const shareCurrentPattern = async () => {
        const payload = {
            rows: state.rows,
            cols: state.cols,
            geometry: state.geometry,
            paletteIndex: state.paletteIndex,
            borderLayers: state.borderLayers,
            patterns: state.patterns,
            blanketGrid: state.blanketGrid
        };
        const encoded = encodeURIComponent(JSON.stringify(payload));
        const shareUrl = `${window.location.origin}${window.location.pathname}#share=${encoded}`;

        if (window.NativeBridge) {
            await window.NativeBridge.sharePattern({
                title: `Blanket Pattern (${state.rows}x${state.cols})`,
                text: `Check out my ${state.geometry} crochet blanket design!`,
                url: shareUrl
            });
        }
    };

    const loadPatternFromUrlHash = () => {
        if (location.hash && location.hash.startsWith('#share=')) {
            try {
                const encoded = location.hash.replace('#share=', '');
                const decoded = JSON.parse(decodeURIComponent(encoded));
                if (decoded && typeof decoded === 'object') {
                    if (decoded.rows) state.rows = sanitizeInt(decoded.rows, 8, 1, 100);
                    if (decoded.cols) state.cols = sanitizeInt(decoded.cols, 8, 1, 100);
                    if (decoded.geometry && typeof decoded.geometry === 'string') state.geometry = escapeHtml(decoded.geometry);
                    if (Array.isArray(decoded.borderLayers)) {
                        state.borderLayers = decoded.borderLayers.map(l => ({
                            id: typeof l.id === 'string' ? escapeHtml(l.id) : 'b-1',
                            type: typeof l.type === 'string' ? escapeHtml(l.type) : 'solid',
                            color: sanitizeHexColor(l.color)
                        }));
                    }
                    if (Array.isArray(decoded.patterns) && decoded.patterns.length > 0) {
                        state.patterns = decoded.patterns.map(p => ({
                            id: sanitizeInt(p.id, 0, 0, 10000),
                            style: typeof p.style === 'string' ? escapeHtml(p.style) : 'classic',
                            paletteIndex: sanitizeInt(p.paletteIndex, 0, 0, 100),
                            colors: Array.isArray(p.colors) ? p.colors.map(c => sanitizeHexColor(c)) : ['#ffffff'],
                            quantity: sanitizeInt(p.quantity, 1, 0, 10000),
                            isLocked: Boolean(p.isLocked)
                        }));
                    }
                    if (Array.isArray(decoded.blanketGrid)) state.blanketGrid = decoded.blanketGrid;
                    
                    if (decoded.paletteIndex !== undefined) {
                        state.paletteIndex = sanitizeInt(decoded.paletteIndex, 0, 0, 100);
                    } else if (state.patterns.length > 0) {
                        state.paletteIndex = state.patterns[0].paletteIndex || 0;
                    }

                    if (state.borderLayers && state.borderLayers.length > 0) {
                        state.borderWidth = state.borderLayers.length;
                        state.borderStyle = state.borderLayers[0].type || 'solid';
                    } else {
                        state.borderWidth = 2;
                        state.borderStyle = 'solid';
                    }

                    const borderPatternSelect = document.querySelector('#border-pattern-select');
                    const borderWidthSelect = document.querySelector('#border-width-select');
                    if (borderPatternSelect) borderPatternSelect.value = state.borderStyle;
                    if (borderWidthSelect) borderWidthSelect.value = state.borderWidth;

                    updateBorderLayersFromState();
                    populateGlobalPaletteDropdown();
                    renderPatternsList();
                    drawBlanketCanvas(true);
                    console.log('Loaded shared pattern from URL hash!');
                }
            } catch (err) {
                console.warn('Failed to parse URL hash pattern:', err);
            }
        }
    };

    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        safeLocalStorageSet('blanket_theme', theme);
        const sunIcon = document.querySelector('#theme-icon-sun');
        const moonIcon = document.querySelector('#theme-icon-moon');
        if (sunIcon && moonIcon) {
            sunIcon.style.display = theme === 'light' ? 'block' : 'none';
            moonIcon.style.display = theme === 'dark' ? 'block' : 'none';
        }
    };

    const initTheme = () => {
        const savedTheme = safeLocalStorageGet('blanket_theme', 'dark');
        applyTheme(savedTheme);
    };

    const initFirebaseAuthSync = () => {
        if (!window.FirebaseAuthSync) return;

        const gatewayScreen = document.querySelector('#login-gateway-screen');
        const gatewayLoginBtn = document.querySelector('#gateway-google-login-btn');

        const loginBtn = document.querySelector('#google-login-btn');
        const logoutBtn = document.querySelector('#google-logout-btn');
        const userProfile = document.querySelector('#google-user-profile');
        const userName = document.querySelector('#google-user-name');
        const userAvatar = document.querySelector('#google-user-avatar');
        const syncStatus = document.querySelector('#google-sync-status');

        const handleGoogleLogin = async () => {
            try {
                await window.FirebaseAuthSync.loginWithGoogle();
            } catch (err) {
                console.error('[Google Login Error]:', err);
            }
        };

        if (loginBtn) loginBtn.addEventListener('click', handleGoogleLogin);
        if (gatewayLoginBtn) gatewayLoginBtn.addEventListener('click', handleGoogleLogin);

        const gatewayGuestBtn = document.querySelector('#gateway-guest-btn');
        if (gatewayGuestBtn && gatewayScreen) {
            gatewayGuestBtn.addEventListener('click', () => {
                gatewayScreen.classList.add('hidden');
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                try {
                    if (state.unsubscribeCloudSync) {
                        state.unsubscribeCloudSync();
                        state.unsubscribeCloudSync = null;
                    }
                    await window.FirebaseAuthSync.logoutGoogle();
                    if (gatewayScreen) gatewayScreen.classList.remove('hidden');
                } catch (err) {
                    console.error('[Google Logout Error]:', err);
                }
            });
        }

        window.FirebaseAuthSync.onAuthChange((user) => {
            state.currentUser = user;
            if (user) {
                if (gatewayScreen) gatewayScreen.classList.add('hidden');
                if (loginBtn) loginBtn.style.display = 'none';
                if (userProfile) userProfile.style.display = 'flex';
                if (userName) userName.textContent = user.displayName || user.email || 'Google User';
                if (userAvatar) userAvatar.src = user.photoURL || 'https://www.gstatic.com/images/branding/product/1x/avatar_square_blue_512dp.png';
                if (syncStatus) syncStatus.textContent = 'Cloud Sync Active';

                // Sync offline local history to cloud upon login
                if (state.history && state.history.length > 0) {
                    state.history.forEach(design => {
                        window.FirebaseAuthSync.saveDesignToCloud(user.uid, design);
                    });
                }

                // Subscribe to cloud Firestore designs
                if (state.unsubscribeCloudSync) state.unsubscribeCloudSync();
                state.unsubscribeCloudSync = window.FirebaseAuthSync.subscribeCloudDesigns(user.uid, (cloudDesigns) => {
                    if (cloudDesigns && Array.isArray(cloudDesigns)) {
                        const mergedMap = new Map();
                        [...cloudDesigns, ...state.history].forEach(item => {
                            if (item && item.id) {
                                if (!mergedMap.has(item.id)) {
                                    mergedMap.set(item.id, item);
                                }
                            }
                        });
                        state.history = Array.from(mergedMap.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 500);
                        localforage.setItem('blanket_local_history', state.history);
                        renderHistoryList();
                    }
                });
            } else {
                if (loginBtn) loginBtn.style.display = 'flex';
                if (userProfile) userProfile.style.display = 'none';
                if (state.unsubscribeCloudSync) {
                    state.unsubscribeCloudSync();
                    state.unsubscribeCloudSync = null;
                }
            }
        });
    };

    // =========================================================================
    // 9. Application Bootstrap
    // =========================================================================
    const initApp = () => {
        initTheme();
        initDefaultState();
        populateGlobalPaletteDropdown();
        updateBorderLayersFromState();
        renderPatternsList();
        updateDimensionsInfo();
        initHistory();
        bindEvents();
        initFirebaseAuthSync();
        loadPatternFromUrlHash();
        initUXFeatures();
        drawBlanketCanvas(false);
    };

    // =========================================================================
    // UX Features: Tooltips, Zoom, Toasts
    // =========================================================================
    const showToast = (message, duration = 2000) => {
        const container = document.querySelector('#toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = 'toast-item';
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, duration + 300);
    };

    const initUXFeatures = () => {
        // 1. HOVER TOOLTIPS
        const tooltip = document.querySelector('#canvas-tooltip');
        const blanketContainer = document.querySelector('#blanket-container');

        if (tooltip && blanketContainer) {
            blanketContainer.addEventListener('mouseover', (e) => {
                const cell = e.target.closest('td.cellSquare');
                if (!cell) { tooltip.style.opacity = '0'; return; }

                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                const bWidth = state.borderWidth || 0;

                let patternInfo = '';
                let colorInfo = '';

                if (cell.classList.contains('border-cell') || cell.classList.contains('border-corner')) {
                    patternInfo = 'Border round';
                    const bc = state.borderLayers?.[0]?.colors?.[0] || '#888';
                    colorInfo = `<span style="display:inline-block;width:10px;height:10px;background:${bc};border-radius:2px;margin-right:4px;vertical-align:middle;"></span>${getYarnShadeInfo(bc)}`;
                } else {
                    const inR = row - bWidth;
                    const inC = col - bWidth;
                    const patternId = state.blanketGrid?.[inR]?.[inC];
                    const pattern = state.patterns?.find(p => p.id === patternId);
                    if (pattern) {
                        const styleDetails = getPatternStyleDetails(pattern.style);
                        patternInfo = styleDetails.name;
                        const c1 = pattern.colors?.[0] || '#888';
                        colorInfo = `<span style="display:inline-block;width:10px;height:10px;background:${c1};border-radius:2px;margin-right:4px;vertical-align:middle;"></span>${getYarnShadeInfo(c1)}`;
                    }
                }

                tooltip.innerHTML = `<strong>${patternInfo}</strong>${colorInfo}<br><span style="color:rgba(255,255,255,0.5);font-size:10px;">Row ${row + 1}, Col ${col + 1}</span>`;
                tooltip.style.opacity = '1';
            });

            blanketContainer.addEventListener('mousemove', (e) => {
                tooltip.style.left = (e.pageX + 14) + 'px';
                tooltip.style.top = (e.pageY - 10) + 'px';
            });

            blanketContainer.addEventListener('mouseleave', () => {
                tooltip.style.opacity = '0';
            });
        }

        // 2. CANVAS ZOOM CONTROLS
        let zoomLevel = 1;
        const ZOOM_STEP = 0.15;
        const ZOOM_MIN = 0.4;
        const ZOOM_MAX = 3.0;

        const applyZoom = () => {
            const table = document.querySelector('#blanket-container table');
            const zoomControls = document.querySelector('#zoom-controls');
            if (table) {
                table.style.transformOrigin = 'top center';
                table.style.transform = `scale(${zoomLevel})`;
                table.style.transition = 'transform 0.2s ease';
            }
            if (zoomControls) zoomControls.style.display = 'flex';
        };

        const zoomInBtn = document.querySelector('#zoom-in-btn');
        const zoomOutBtn = document.querySelector('#zoom-out-btn');
        const zoomResetBtn = document.querySelector('#zoom-reset-btn');

        if (zoomInBtn) zoomInBtn.addEventListener('click', () => {
            zoomLevel = Math.min(ZOOM_MAX, +(zoomLevel + ZOOM_STEP).toFixed(2));
            applyZoom();
        });
        if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => {
            zoomLevel = Math.max(ZOOM_MIN, +(zoomLevel - ZOOM_STEP).toFixed(2));
            applyZoom();
        });
        if (zoomResetBtn) zoomResetBtn.addEventListener('click', () => {
            zoomLevel = 1;
            applyZoom();
        });

        // Show zoom controls whenever a blanket grid table is created
        const blanketObserver = new MutationObserver(() => {
            const table = document.querySelector('#blanket-container table');
            const zoomControls = document.querySelector('#zoom-controls');
            if (table && zoomControls) {
                zoomControls.style.display = 'flex';
                table.style.transformOrigin = 'top center';
                table.style.transform = `scale(${zoomLevel})`;
            }
        });
        if (blanketContainer) {
            blanketObserver.observe(blanketContainer, { childList: true, subtree: false });
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }

})();