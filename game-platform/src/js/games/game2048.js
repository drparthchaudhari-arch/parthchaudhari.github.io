/* ============================================
   2048 PUZZLE GAME
   ============================================ */

const Game2048 = {
    grid: [],
    score: 0,
    level: 1,
    gridSize: 4,
    targetTile: 2048,
    gameActive: true,
    hasWon: false,
    keydownHandler: null,
    touchStartHandler: null,
    touchEndHandler: null,
    touchSurface: null,
    touchStartX: 0,
    touchStartY: 0,
    resizeHandler: null,
    
    init(container, level) {
        this.cleanup();
        this.level = level;
        this.setDifficulty(level);
        this.score = 0;
        this.gameActive = true;
        this.hasWon = false;
        
        this.grid = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(0));
        
        // Add initial tiles
        this.addRandomTile();
        this.addRandomTile();
        
        this.render(container);
    },
    
    setDifficulty(level) {
        if (level <= 5) {
            this.gridSize = 4;
            this.targetTile = 2048;
        } else if (level <= 10) {
            this.gridSize = 5;
            this.targetTile = 4096;
        } else {
            this.gridSize = 6;
            this.targetTile = 8192;
        }
    },
    
    render(container) {
        const tileSize = this.getTileSize();

        container.innerHTML = `
            <div class="game-2048">
                <div class="game-2048-header">
                    <div class="score-display">
                        <div class="score-box">
                            <span class="label">Score</span>
                            <span class="value" id="score-2048">0</span>
                        </div>
                        <div class="score-box">
                            <span class="label">Best</span>
                            <span class="value" id="best-2048">${this.getBestScore()}</span>
                        </div>
                    </div>
                    <div class="target-display">
                        <span>Target: <strong>${this.targetTile}</strong></span>
                    </div>
                </div>
                
                <div class="game-2048-grid" id="grid-2048" 
                     style="grid-template-columns: repeat(${this.gridSize}, 1fr); --tile-size: ${tileSize}px;">
                    ${this.renderGrid()}
                </div>
                
                <div class="game-2048-controls">
                    <p class="control-hint">
                        Use <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> or WASD to move tiles
                    </p>
                </div>
            </div>
        `;
        
        // Add keyboard controls
        if (!this.keydownHandler) {
            this.keydownHandler = (e) => this.handleInput(e);
        }
        document.addEventListener('keydown', this.keydownHandler);

        if (!this.resizeHandler) {
            this.resizeHandler = () => this.updateGridSizing();
        }
        window.addEventListener('resize', this.resizeHandler);
        
        // Add touch controls
        this.setupTouchControls(container);
    },
    
    renderGrid() {
        let html = '';
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const value = this.grid[row][col];
                html += `
                    <div class="tile-2048 tile-${value || 'empty'}">
                        ${value || ''}
                    </div>
                `;
            }
        }
        return html;
    },
    
    setupTouchControls(container) {
        this.touchSurface = container;

        this.touchStartHandler = (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        };

        this.touchEndHandler = (e) => {
            if (!this.gameActive) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const dx = touchEndX - this.touchStartX;
            const dy = touchEndY - this.touchStartY;
            
            const minSwipe = 50;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                if (Math.abs(dx) > minSwipe) {
                    if (dx > 0) this.move('right');
                    else this.move('left');
                }
            } else {
                if (Math.abs(dy) > minSwipe) {
                    if (dy > 0) this.move('down');
                    else this.move('up');
                }
            }
        };

        container.addEventListener('touchstart', this.touchStartHandler, { passive: true });
        container.addEventListener('touchend', this.touchEndHandler, { passive: true });
    },
    
    handleInput(e) {
        if (!this.gameActive) return;
        
        const key = e.key.toLowerCase();
        
        switch(key) {
            case 'arrowup':
            case 'w':
                e.preventDefault();
                this.move('up');
                break;
            case 'arrowdown':
            case 's':
                e.preventDefault();
                this.move('down');
                break;
            case 'arrowleft':
            case 'a':
                e.preventDefault();
                this.move('left');
                break;
            case 'arrowright':
            case 'd':
                e.preventDefault();
                this.move('right');
                break;
        }
    },
    
    move(direction) {
        const previousGrid = JSON.parse(JSON.stringify(this.grid));
        let moved = false;
        let scoreGained = 0;
        
        // Helper to slide and merge row
        const slideRow = (row) => {
            // Remove zeros
            let filtered = row.filter(val => val !== 0);
            
            // Merge adjacent equal numbers
            for (let i = 0; i < filtered.length - 1; i++) {
                if (filtered[i] === filtered[i + 1]) {
                    filtered[i] *= 2;
                    scoreGained += filtered[i];
                    filtered[i + 1] = 0;
                }
            }
            
            // Remove zeros again
            filtered = filtered.filter(val => val !== 0);
            
            // Pad with zeros
            while (filtered.length < this.gridSize) {
                filtered.push(0);
            }
            
            return filtered;
        };
        
        if (direction === 'left') {
            for (let row = 0; row < this.gridSize; row++) {
                const newRow = slideRow(this.grid[row]);
                if (JSON.stringify(newRow) !== JSON.stringify(this.grid[row])) {
                    moved = true;
                }
                this.grid[row] = newRow;
            }
        } else if (direction === 'right') {
            for (let row = 0; row < this.gridSize; row++) {
                const newRow = slideRow(this.grid[row].slice().reverse()).reverse();
                if (JSON.stringify(newRow) !== JSON.stringify(this.grid[row])) {
                    moved = true;
                }
                this.grid[row] = newRow;
            }
        } else if (direction === 'up') {
            for (let col = 0; col < this.gridSize; col++) {
                const column = [];
                for (let row = 0; row < this.gridSize; row++) {
                    column.push(this.grid[row][col]);
                }
                const newColumn = slideRow(column);
                for (let row = 0; row < this.gridSize; row++) {
                    if (this.grid[row][col] !== newColumn[row]) moved = true;
                    this.grid[row][col] = newColumn[row];
                }
            }
        } else if (direction === 'down') {
            for (let col = 0; col < this.gridSize; col++) {
                const column = [];
                for (let row = 0; row < this.gridSize; row++) {
                    column.push(this.grid[row][col]);
                }
                const newColumn = slideRow(column.reverse()).reverse();
                for (let row = 0; row < this.gridSize; row++) {
                    if (this.grid[row][col] !== newColumn[row]) moved = true;
                    this.grid[row][col] = newColumn[row];
                }
            }
        }
        
        if (moved) {
            this.score += scoreGained;
            updateGameScore(scoreGained);
            this.addRandomTile();
            this.updateDisplay();
            
            // Check win condition
            if (!this.hasWon && this.hasTile(this.targetTile)) {
                this.hasWon = true;
                setTimeout(() => this.levelComplete(), 500);
                return;
            }
            
            // Check game over
            if (this.isGameOver()) {
                setTimeout(() => this.gameOver(), 500);
            }
        }
    },
    
    addRandomTile() {
        const emptyCells = [];
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col] === 0) {
                    emptyCells.push({ row, col });
                }
            }
        }
        
        if (emptyCells.length > 0) {
            const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[row][col] = Math.random() < 0.9 ? 2 : 4;
        }
    },
    
    hasTile(value) {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col] === value) return true;
            }
        }
        return false;
    },
    
    isGameOver() {
        // Check for empty cells
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col] === 0) return false;
            }
        }
        
        // Check for possible merges
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const val = this.grid[row][col];
                if ((row < this.gridSize - 1 && this.grid[row + 1][col] === val) ||
                    (col < this.gridSize - 1 && this.grid[row][col + 1] === val)) {
                    return false;
                }
            }
        }
        
        return true;
    },
    
    updateDisplay() {
        document.getElementById('grid-2048').innerHTML = this.renderGrid();
        document.getElementById('score-2048').textContent = this.score.toLocaleString();
        this.updateGridSizing();
    },

    updateGridSizing() {
        const gridEl = document.getElementById('grid-2048');
        if (!gridEl) return;
        gridEl.style.setProperty('--tile-size', `${this.getTileSize()}px`);
    },

    getTileSize() {
        const viewportWidth = Math.min(window.innerWidth || 1200, 1200);
        const panelPadding = 56;
        const sideGaps = 16;
        const availableWidth = Math.max(320, viewportWidth - panelPadding - sideGaps);
        const rawSize = Math.floor((availableWidth - ((this.gridSize - 1) * 8) - 16) / this.gridSize);

        if (this.gridSize <= 4) return Math.max(64, Math.min(80, rawSize));
        if (this.gridSize === 5) return Math.max(52, Math.min(72, rawSize));
        return Math.max(42, Math.min(60, rawSize));
    },
    
    getBestScore() {
        return parseInt(localStorage.getItem('2048-best-score') || '0');
    },
    
    saveBestScore() {
        const best = this.getBestScore();
        if (this.score > best) {
            localStorage.setItem('2048-best-score', this.score);
        }
    },
    
    levelComplete() {
        this.saveBestScore();
        
        const targetBonus = this.targetTile / 10;
        levelComplete(targetBonus);
    },
    
    gameOver() {
        this.gameActive = false;
        this.saveBestScore();
        gameOver(`Game Over! Your score: ${this.score.toLocaleString()}`);
    },
    
    showHint() {
        // Show the best possible move direction
        const directions = ['up', 'down', 'left', 'right'];
        let bestDirection = null;
        let bestScore = -1;
        
        for (const dir of directions) {
            const testGrid = JSON.parse(JSON.stringify(this.grid));
            let testScore = 0;
            
            // Simulate move
            // (Simplified - just check if it creates merges)
            // In a real implementation, you'd use the actual move logic
            
            if (testScore > bestScore) {
                bestScore = testScore;
                bestDirection = dir;
            }
        }
        
        if (bestDirection) {
            const arrows = { up: '↑', down: '↓', left: '←', right: '→' };
            
            // Show hint overlay
            const grid = document.getElementById('grid-2048');
            const hint = document.createElement('div');
            hint.className = 'hint-overlay';
            hint.innerHTML = `<span class="hint-arrow">${arrows[bestDirection]}</span>`;
            grid.appendChild(hint);
            
            setTimeout(() => hint.remove(), 1500);
        }
    },

    cleanup() {
        this.gameActive = false;

        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler);
        }

        if (this.touchSurface && this.touchStartHandler) {
            this.touchSurface.removeEventListener('touchstart', this.touchStartHandler);
        }
        if (this.touchSurface && this.touchEndHandler) {
            this.touchSurface.removeEventListener('touchend', this.touchEndHandler);
        }
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }

        this.touchSurface = null;
        this.touchStartHandler = null;
        this.touchEndHandler = null;
        this.resizeHandler = null;
    }
};
