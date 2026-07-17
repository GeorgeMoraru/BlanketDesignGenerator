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
        nextPatternId: 0,
        history: [],
        githubPat: '',
        githubRepo: '',
        githubFileSha: ''
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

        // Show download FAB
        const downloadBtn = document.querySelector('#download-image-btn');
        if (downloadBtn) downloadBtn.style.display = 'flex';

        // Auto-close settings menu drawer
        toggleDrawer(false);

        // Save layout to history (sync to cloud if configured)
        appendToHistory();
    };

    // =========================================================================
    // 7. Drawer, History, GitHub Sync, & Export Controllers
    // =========================================================================
    
    // Toggle Settings Drawer
    const toggleDrawer = (open) => {
        const drawer = document.querySelector('.settings-container');
        const overlay = document.querySelector('#menu-overlay');
        if (drawer) drawer.classList.toggle('open', open);
        if (overlay) overlay.classList.toggle('active', open);
    };

    // Save Sync credentials
    const saveSyncSettings = () => {
        const patInput = document.querySelector('#github-pat');
        const repoInput = document.querySelector('#github-repo');
        
        state.githubPat = patInput ? patInput.value.trim() : '';
        state.githubRepo = repoInput ? repoInput.value.trim() : '';
        
        localStorage.setItem('blanket_github_pat', state.githubPat);
        localStorage.setItem('blanket_github_repo', state.githubRepo);
        
        alert('Sync settings saved! Fetching history from cloud...');
        syncHistoryFromGitHub();
    };

    const loadSyncSettings = () => {
        state.githubPat = localStorage.getItem('blanket_github_pat') || '';
        state.githubRepo = localStorage.getItem('blanket_github_repo') || '';
        
        const patInput = document.querySelector('#github-pat');
        const repoInput = document.querySelector('#github-repo');
        
        if (patInput) patInput.value = state.githubPat;
        if (repoInput) repoInput.value = state.githubRepo;
    };

    const initHistory = () => {
        loadSyncSettings();
        
        if (state.githubPat && state.githubRepo) {
            syncHistoryFromGitHub();
        } else {
            try {
                const localData = localStorage.getItem('blanket_local_history');
                state.history = localData ? JSON.parse(localData) : [];
            } catch (e) {
                console.error('Failed to parse local history:', e);
                state.history = [];
            }
            renderHistoryList();
        }
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
        state.patterns = JSON.parse(JSON.stringify(item.patterns));
        state.blanketGrid = JSON.parse(JSON.stringify(item.grid));
        
        const rowsInput = document.querySelector('#rows');
        const colsInput = document.querySelector('#columns');
        if (rowsInput) rowsInput.value = state.rows;
        if (colsInput) colsInput.value = state.cols;
        
        let maxPatternId = 0;
        state.patterns.forEach(p => {
            if (p.id >= maxPatternId) maxPatternId = p.id + 1;
        });
        state.nextPatternId = maxPatternId;
        
        renderPatternsList();
        updateDimensionsInfo();
        
        const canvas = document.querySelector('#blanket-container');
        if (canvas) {
            const table = document.createElement('table');
            table.className = 'blanket';
            
            for (let r = 0; r < state.rows; r++) {
                const row = document.createElement('tr');
                for (let c = 0; c < state.cols; c++) {
                    const cell = document.createElement('td');
                    cell.className = 'cellSquare';
                    
                    const patternId = state.blanketGrid[r][c];
                    const pattern = state.patterns.find(p => p.id === patternId);
                    
                    if (pattern) {
                        const styleDetails = PATTERN_STYLES[pattern.style];
                        cell.classList.add(styleDetails.className);
                        cell.style = getPatternColorVariables(pattern.colors);
                    } else {
                        cell.classList.add('granny-solid');
                        cell.style = '--color-1: #1e294b;';
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
            patterns: JSON.parse(JSON.stringify(state.patterns)),
            grid: JSON.parse(JSON.stringify(state.blanketGrid))
        };
        
        state.history.unshift(entry);
        
        if (state.history.length > 500) {
            state.history = state.history.slice(0, 500);
        }
        
        localStorage.setItem('blanket_local_history', JSON.stringify(state.history));
        renderHistoryList();
        
        if (state.githubPat && state.githubRepo) {
            pushHistoryToGitHub();
        }
    };

    const syncHistoryFromGitHub = () => {
        if (!state.githubPat || !state.githubRepo) return;
        
        const url = `https://api.github.com/repos/${state.githubRepo}/contents/blanket-history.json`;
        
        fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `token ${state.githubPat}`,
                'Cache-Control': 'no-cache'
            }
        })
        .then(res => {
            if (res.status === 200) {
                return res.json();
            } else if (res.status === 404) {
                state.githubFileSha = '';
                throw new Error('FILE_NOT_FOUND');
            } else {
                throw new Error(`API_ERROR_${res.status}`);
            }
        })
        .then(data => {
            state.githubFileSha = data.sha;
            const jsonText = atob(data.content);
            const remoteHistory = JSON.parse(jsonText);
            
            if (Array.isArray(remoteHistory)) {
                state.history = remoteHistory.slice(0, 500);
                localStorage.setItem('blanket_local_history', JSON.stringify(state.history));
                renderHistoryList();
                console.log('Successfully synced history from GitHub.');
            }
        })
        .catch(err => {
            if (err.message !== 'FILE_NOT_FOUND') {
                console.error('Failed to sync history from GitHub:', err);
                try {
                    const localData = localStorage.getItem('blanket_local_history');
                    state.history = localData ? JSON.parse(localData) : [];
                } catch (e) {
                    state.history = [];
                }
                renderHistoryList();
            }
        });
    };

    const pushHistoryToGitHub = () => {
        if (!state.githubPat || !state.githubRepo) return;
        
        const url = `https://api.github.com/repos/${state.githubRepo}/contents/blanket-history.json`;
        const jsonContent = JSON.stringify(state.history);
        const base64Content = btoa(unescape(encodeURIComponent(jsonContent)));
        
        const bodyData = {
            message: `Update blanket designer history [${state.history.length} entries]`,
            content: base64Content
        };
        
        if (state.githubFileSha) {
            bodyData.sha = state.githubFileSha;
        }
        
        fetch(url, {
            method: 'PUT',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `token ${state.githubPat}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyData)
        })
        .then(res => {
            if (res.status === 200 || res.status === 201) {
                return res.json();
            } else {
                if (res.status === 409) {
                    console.warn('GitHub conflict. Re-syncing SHA and retrying...');
                    fetch(url, {
                        headers: {
                            'Accept': 'application/vnd.github.v3+json',
                            'Authorization': `token ${state.githubPat}`
                        }
                    })
                    .then(r => r.json())
                    .then(latest => {
                        state.githubFileSha = latest.sha;
                        pushHistoryToGitHub();
                    });
                }
                throw new Error(`PUSH_FAILED_${res.status}`);
            }
        })
        .then(data => {
            state.githubFileSha = data.content.sha;
            console.log('Successfully saved history to GitHub.');
        })
        .catch(err => {
            console.error('Failed to push history to GitHub:', err);
        });
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

    const exportBlanketAsImage = () => {
        const rows = state.rows;
        const cols = state.cols;
        if (!state.blanketGrid || state.blanketGrid.length === 0) return;
        
        const cellSize = 100;
        const spacing = 8;
        const padding = 24;
        
        const width = cols * cellSize + (cols - 1) * spacing + padding * 2;
        const height = rows * cellSize + (rows - 1) * spacing + padding * 2;
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, width - 2, height - 2);
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = padding + c * (cellSize + spacing);
                const y = padding + r * (cellSize + spacing);
                
                const patternId = state.blanketGrid[r][c];
                const pattern = state.patterns.find(p => p.id === patternId);
                
                ctx.save();
                drawRoundedRect(ctx, x, y, cellSize, cellSize, 12);
                ctx.clip();
                
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
                
                drawStitchOverlay(ctx, x, y, cellSize);
                ctx.restore();
            }
        }
        
        const link = document.createElement('a');
        link.download = `blanket-design-${rows}x${cols}-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    // =========================================================================
    // 8. Event Bindings Setup
    // =========================================================================
    const bindEvents = () => {
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

        const addPatternBtn = document.querySelector('#add-pattern-btn');
        if (addPatternBtn) {
            addPatternBtn.addEventListener('click', () => {
                const styles = Object.keys(PATTERN_STYLES);
                const randomStyle = styles[Math.floor(Math.random() * styles.length)];
                syncUIQuantitiesToState();
                addPatternToState(randomStyle);
                renderPatternsList();
                updateDimensionsInfo();
            });
        }

        const generateBtn = document.querySelector('#generate-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', drawBlanketCanvas);
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

        // Save sync credentials
        const saveSyncBtn = document.querySelector('#save-sync-btn');
        if (saveSyncBtn) {
            saveSyncBtn.addEventListener('click', saveSyncSettings);
        }

        // Download image floating button click
        const downloadImageBtn = document.querySelector('#download-image-btn');
        if (downloadImageBtn) {
            downloadImageBtn.addEventListener('click', exportBlanketAsImage);
        }
    };

    // =========================================================================
    // 9. Application Bootstrap
    // =========================================================================
    document.addEventListener('DOMContentLoaded', () => {
        initDefaultState();
        renderPatternsList();
        updateDimensionsInfo();
        initHistory();
        bindEvents();
    });

})();