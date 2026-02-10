/* ============================================
   SUDOKU MASTER GAME
   ============================================ */

const Sudoku = {
    grid: [],
    solution: [],
    initialGrid: [],
    selectedCell: null,
    level: 1,
    difficulty: 'easy',
    mistakes: 0,
    maxMistakes: 3,
    hints: 3,
    timer: 0,
    notes: {}, // cell notes
    gameActive: true,
    keydownHandler: null,
    timerInterval: null,
    
    // Difficulty settings
    difficulties: {
        easy: { cells: 45, name: 'Easy' },
        medium: { cells: 35, name: 'Medium' },
        hard: { cells: 25, name: 'Hard' },
        expert: { cells: 17, name: 'Expert' }
    },
    
    init(container, level) {
        this.cleanup();
        this.level = level;
        this.setDifficulty(level);
        this.mistakes = 0;
        this.hints = 3;
        this.timer = 0;
        this.notes = {};
        this.gameActive = true;
        this.selectedCell = null;
        
        this.generatePuzzle();
        this.render(container);
        this.startTimer();
    },
    
    setDifficulty(level) {
        if (level <= 4) this.difficulty = 'easy';
        else if (level <= 8) this.difficulty = 'medium';
        else if (level <= 12) this.difficulty = 'hard';
        else this.difficulty = 'expert';
        
        this.maxMistakes = this.difficulty === 'expert' ? 1 : 
                          this.difficulty === 'hard' ? 2 : 3;
    },
    
    generatePuzzle() {
        // Generate a complete valid Sudoku grid
        this.solution = this.generateCompleteGrid();
        
        // Create puzzle by removing cells
        this.grid = JSON.parse(JSON.stringify(this.solution));
        this.initialGrid = JSON.parse(JSON.stringify(this.solution));
        
        const cellsToRemove = 81 - this.difficulties[this.difficulty].cells;
        const positions = [];
        
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                positions.push([i, j]);
            }
        }
        
        // Shuffle positions
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }
        
        // Remove cells
        for (let i = 0; i < cellsToRemove; i++) {
            const [row, col] = positions[i];
            this.grid[row][col] = 0;
            this.initialGrid[row][col] = 0;
        }
    },
    
    generateCompleteGrid() {
        const grid = Array(9).fill(null).map(() => Array(9).fill(0));
        
        // Fill diagonal 3x3 boxes first (they're independent)
        for (let box = 0; box < 9; box += 3) {
            this.fillBox(grid, box, box);
        }
        
        // Solve the rest
        this.solveSudoku(grid);
        
        return grid;
    },
    
    fillBox(grid, startRow, startCol) {
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        // Shuffle
        for (let i = nums.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [nums[i], nums[j]] = [nums[j], nums[i]];
        }
        
        let idx = 0;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                grid[startRow + i][startCol + j] = nums[idx++];
            }
        }
    },
    
    solveSudoku(grid) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (grid[row][col] === 0) {
                    for (let num = 1; num <= 9; num++) {
                        if (this.isValidMove(grid, row, col, num)) {
                            grid[row][col] = num;
                            if (this.solveSudoku(grid)) return true;
                            grid[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    },
    
    isValidMove(grid, row, col, num) {
        // Check row
        for (let x = 0; x < 9; x++) {
            if (grid[row][x] === num) return false;
        }
        
        // Check column
        for (let x = 0; x < 9; x++) {
            if (grid[x][col] === num) return false;
        }
        
        // Check 3x3 box
        const startRow = row - row % 3;
        const startCol = col - col % 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (grid[i + startRow][j + startCol] === num) return false;
            }
        }
        
        return true;
    },
    
    render(container) {
        container.innerHTML = `
            <div class="sudoku-game">
                <div class="sudoku-header">
                    <div class="difficulty-selector">
                        ${Object.entries(this.difficulties).map(([key, diff]) => `
                            <button class="diff-btn ${this.difficulty === key ? 'active' : ''}" 
                                    data-diff="${key}" onclick="Sudoku.changeDifficulty('${key}')">
                                ${diff.name}
                            </button>
                        `).join('')}
                    </div>
                    <div class="sudoku-stats">
                        <span class="stat"><i class="fas fa-times-circle"></i> ${this.mistakes}/${this.maxMistakes}</span>
                        <span class="stat"><i class="fas fa-lightbulb"></i> ${this.hints}</span>
                    </div>
                </div>
                
                <div class="sudoku-grid" id="sudoku-grid">
                    ${this.renderGrid()}
                </div>
                
                <div class="sudoku-controls">
                    <div class="number-pad">
                        ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `
                            <button class="num-btn" onclick="Sudoku.inputNumber(${n})">${n}</button>
                        `).join('')}
                    </div>
                    <div class="control-buttons">
                        <button class="ctrl-btn" onclick="Sudoku.toggleNotes()" id="notes-btn">
                            <i class="fas fa-pencil-alt"></i> Notes
                        </button>
                        <button class="ctrl-btn" onclick="Sudoku.erase()">
                            <i class="fas fa-eraser"></i> Erase
                        </button>
                        <button class="ctrl-btn hint" onclick="Sudoku.useHint()">
                            <i class="fas fa-lightbulb"></i> Hint
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add keyboard listener
        if (!this.keydownHandler) {
            this.keydownHandler = (e) => this.handleKeyPress(e);
        }
        document.addEventListener('keydown', this.keydownHandler);
    },
    
    renderGrid() {
        let html = '';
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const value = this.grid[row][col];
                const isInitial = this.initialGrid[row][col] !== 0;
                const isSelected = this.selectedCell && 
                                  this.selectedCell.row === row && 
                                  this.selectedCell.col === col;
                const notes = this.notes[`${row}-${col}`] || [];
                
                let classes = ['sudoku-cell'];
                if (isInitial) classes.push('initial');
                if (isSelected) classes.push('selected');
                if ((row + 1) % 3 === 0 && row !== 8) classes.push('border-bottom');
                if ((col + 1) % 3 === 0 && col !== 8) classes.push('border-right');
                
                // Highlight same numbers
                if (this.selectedCell && value !== 0) {
                    const selectedValue = this.grid[this.selectedCell.row][this.selectedCell.col];
                    if (value === selectedValue) classes.push('same-number');
                }
                
                // Highlight related cells
                if (this.selectedCell) {
                    const sameRow = this.selectedCell.row === row;
                    const sameCol = this.selectedCell.col === col;
                    const sameBox = Math.floor(this.selectedCell.row / 3) === Math.floor(row / 3) &&
                                   Math.floor(this.selectedCell.col / 3) === Math.floor(col / 3);
                    if ((sameRow || sameCol || sameBox) && !isSelected) classes.push('related');
                }
                
                html += `
                    <div class="${classes.join(' ')}" 
                         data-row="${row}" 
                         data-col="${col}"
                         onclick="Sudoku.selectCell(${row}, ${col})">
                        ${value !== 0 ? value : notes.length > 0 ? 
                            `<div class="notes">${notes.map(n => `<span>${n}</span>`).join('')}</div>` : ''}
                    </div>
                `;
            }
        }
        return html;
    },
    
    selectCell(row, col) {
        if (!this.gameActive) return;
        this.selectedCell = { row, col };
        this.updateGrid();
    },
    
    inputNumber(num) {
        if (!this.gameActive || !this.selectedCell) return;
        
        const { row, col } = this.selectedCell;
        
        // Can't change initial cells
        if (this.initialGrid[row][col] !== 0) return;
        
        // Check if in notes mode
        const notesBtn = document.getElementById('notes-btn');
        const inNotesMode = notesBtn.classList.contains('active');
        
        if (inNotesMode) {
            // Add/remove note
            const key = `${row}-${col}`;
            if (!this.notes[key]) this.notes[key] = [];
            
            const idx = this.notes[key].indexOf(num);
            if (idx > -1) {
                this.notes[key].splice(idx, 1);
            } else {
                this.notes[key].push(num);
            }
        } else {
            // Input number
            if (this.solution[row][col] === num) {
                this.grid[row][col] = num;
                delete this.notes[`${row}-${col}`];
                updateGameScore(10);
                
                // Check if puzzle complete
                if (this.isComplete()) {
                    this.gameComplete();
                }
            } else {
                this.mistakes++;
                updateStreak(false);
                
                // Show error animation
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                cell.classList.add('error');
                setTimeout(() => cell.classList.remove('error'), 500);
                
                if (this.mistakes >= this.maxMistakes) {
                    this.gameOver();
                }
            }
        }
        
        this.updateGrid();
        this.updateStats();
    },
    
    handleKeyPress(e) {
        if (!this.gameActive) return;
        
        const key = e.key;
        
        // Number input
        if (key >= '1' && key <= '9') {
            this.inputNumber(parseInt(key));
            return;
        }
        
        // Navigation
        if (!this.selectedCell) {
            this.selectedCell = { row: 0, col: 0 };
        } else {
            let { row, col } = this.selectedCell;
            
            switch(key) {
                case 'ArrowUp': row = Math.max(0, row - 1); break;
                case 'ArrowDown': row = Math.min(8, row + 1); break;
                case 'ArrowLeft': col = Math.max(0, col - 1); break;
                case 'ArrowRight': col = Math.min(8, col + 1); break;
                case 'Delete':
                case 'Backspace': this.erase(); return;
                case 'n': this.toggleNotes(); return;
            }
            
            this.selectedCell = { row, col };
        }
        
        this.updateGrid();
    },
    
    toggleNotes() {
        const btn = document.getElementById('notes-btn');
        btn.classList.toggle('active');
    },
    
    erase() {
        if (!this.selectedCell) return;
        
        const { row, col } = this.selectedCell;
        if (this.initialGrid[row][col] !== 0) return;
        
        this.grid[row][col] = 0;
        delete this.notes[`${row}-${col}`];
        this.updateGrid();
    },
    
    useHint() {
        if (this.hints <= 0 || !this.gameActive) return;
        
        // Find an empty or incorrect cell
        const emptyCells = [];
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.grid[row][col] === 0 || this.grid[row][col] !== this.solution[row][col]) {
                    emptyCells.push({ row, col });
                }
            }
        }
        
        if (emptyCells.length === 0) return;
        
        const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        this.grid[cell.row][cell.col] = this.solution[cell.row][cell.col];
        delete this.notes[`${cell.row}-${cell.col}`];
        
        this.hints--;
        this.selectedCell = cell;
        
        updateGameScore(-20); // Penalty for hint
        this.updateGrid();
        this.updateStats();
        
        if (this.isComplete()) {
            this.gameComplete();
        }
    },
    
    changeDifficulty(diff) {
        this.difficulty = diff;
        this.init(document.getElementById('game-area'), this.level);
    },
    
    updateGrid() {
        const gridEl = document.getElementById('sudoku-grid');
        if (gridEl) gridEl.innerHTML = this.renderGrid();
    },
    
    updateStats() {
        const statsEl = document.querySelector('.sudoku-stats');
        if (statsEl) {
            statsEl.innerHTML = `
                <span class="stat"><i class="fas fa-times-circle"></i> ${this.mistakes}/${this.maxMistakes}</span>
                <span class="stat"><i class="fas fa-lightbulb"></i> ${this.hints}</span>
            `;
        }
    },
    
    isComplete() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.grid[row][col] !== this.solution[row][col]) {
                    return false;
                }
            }
        }
        return true;
    },
    
    gameComplete() {
        this.gameActive = false;
        this.stopTimer();
        
        const timeBonus = Math.max(0, 300 - this.timer);
        const hintBonus = this.hints * 50;
        const totalBonus = timeBonus + hintBonus;
        
        levelComplete(totalBonus);
    },
    
    gameOver() {
        this.gameActive = false;
        this.stopTimer();
        gameOver(`Too many mistakes! The puzzle was ${this.difficulties[this.difficulty].name}.`);
    },
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            if (!GameState.isPaused) {
                this.timer++;
            }
        }, 1000);
    },
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    },
    
    showHint() {
        this.useHint();
    },

    cleanup() {
        this.stopTimer();
        this.gameActive = false;
        this.selectedCell = null;

        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler);
        }
    }
};
