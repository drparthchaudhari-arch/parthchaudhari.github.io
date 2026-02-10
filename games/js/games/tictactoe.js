/* ============================================
   TIC TAC TOE PRO GAME
   ============================================ */

const TicTacToe = {
    board: [],
    currentPlayer: 'X',
    gameMode: 'ai', // 'ai', 'local', 'multiplayer'
    difficulty: 'easy', // 'easy', 'medium', 'hard'
    gameActive: false,
    gridSize: 3,
    winsNeeded: 3,
    aiThinking: false,
    
    init(container, level) {
        this.setDifficulty(level);
        this.board = Array(this.gridSize * this.gridSize).fill('');
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.aiThinking = false;
        
        this.render(container);
    },
    
    setDifficulty(level) {
        if (level <= 5) {
            this.gridSize = 3;
            this.winsNeeded = 3;
            this.difficulty = level <= 2 ? 'easy' : 'medium';
        } else if (level <= 10) {
            this.gridSize = 5;
            this.winsNeeded = 4;
            this.difficulty = level <= 7 ? 'medium' : 'hard';
        } else {
            this.gridSize = 7;
            this.winsNeeded = 5;
            this.difficulty = 'hard';
        }
    },
    
    render(container) {
        container.innerHTML = `
            <div class="tictactoe-game">
                <div class="game-mode-selector">
                    <button class="mode-btn ${this.gameMode === 'ai' ? 'active' : ''}" data-mode="ai">
                        <i class="fas fa-robot"></i> vs AI
                    </button>
                    <button class="mode-btn ${this.gameMode === 'local' ? 'active' : ''}" data-mode="local">
                        <i class="fas fa-user-friends"></i> Local
                    </button>
                    <button class="mode-btn ${this.gameMode === 'multiplayer' ? 'active' : ''}" data-mode="multiplayer">
                        <i class="fas fa-globe"></i> Online
                    </button>
                </div>
                
                ${this.gameMode === 'ai' ? `
                    <div class="difficulty-selector">
                        <button class="diff-btn ${this.difficulty === 'easy' ? 'active' : ''}" data-diff="easy">Easy</button>
                        <button class="diff-btn ${this.difficulty === 'medium' ? 'active' : ''}" data-diff="medium">Medium</button>
                        <button class="diff-btn ${this.difficulty === 'hard' ? 'active' : ''}" data-diff="hard">Hard</button>
                    </div>
                ` : ''}
                
                <div class="game-status">
                    <span class="turn">${this.currentPlayer}'s Turn</span>
                </div>
                
                <div class="ttt-grid" id="ttt-grid" style="grid-template-columns: repeat(${this.gridSize}, 1fr);">
                    ${this.board.map((cell, i) => `
                        <div class="ttt-cell ${cell.toLowerCase()}" data-index="${i}">
                            ${cell}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Add event listeners
        const cells = container.querySelectorAll('.ttt-cell');
        cells.forEach(cell => {
            cell.addEventListener('click', (e) => this.handleCellClick(e));
        });
        
        // Mode selector
        container.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.gameMode = e.currentTarget.dataset.mode;
                if (this.gameMode === 'multiplayer') {
                    showSection('multiplayer');
                    document.getElementById('game-container').classList.add('hidden');
                    return;
                }
                this.render(container);
            });
        });
        
        // Difficulty selector
        container.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.difficulty = e.currentTarget.dataset.diff;
                container.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });
    },
    
    handleCellClick(e) {
        if (!this.gameActive || this.aiThinking) return;
        
        const index = parseInt(e.target.dataset.index);
        if (this.board[index] !== '') return;
        
        this.makeMove(index);
        
        // AI turn
        if (this.gameMode === 'ai' && this.gameActive && this.currentPlayer === 'O') {
            this.aiThinking = true;
            setTimeout(() => this.makeAIMove(), 500);
        }
    },
    
    makeMove(index) {
        this.board[index] = this.currentPlayer;
        
        const cell = document.querySelector(`[data-index="${index}"]`);
        cell.textContent = this.currentPlayer;
        cell.classList.add(this.currentPlayer.toLowerCase());
        
        // Check win
        if (this.checkWin(this.currentPlayer)) {
            this.gameActive = false;
            this.highlightWin();
            updateGameScore(this.currentPlayer === 'X' ? 100 : 0);
            updateStreak(this.currentPlayer === 'X');
            
            setTimeout(() => {
                if (this.currentPlayer === 'X') {
                    levelComplete(GameState.streak * 20);
                } else {
                    gameOver('AI wins! Try again.');
                }
            }, 1000);
            return;
        }
        
        // Check draw
        if (this.board.every(cell => cell !== '')) {
            this.gameActive = false;
            updateGameScore(50);
            setTimeout(() => levelComplete(), 1000);
            return;
        }
        
        // Switch player
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        document.querySelector('.game-status .turn').textContent = `${this.currentPlayer}'s Turn`;
    },
    
    makeAIMove() {
        let move;
        
        switch(this.difficulty) {
            case 'easy':
                move = this.getRandomMove();
                break;
            case 'medium':
                if (this.gridSize === 3) {
                    move = Math.random() < 0.6 ? this.getBestMove() : this.getRandomMove();
                } else {
                    move = Math.random() < 0.7 ? this.getStrategicMove() : this.getRandomMove();
                }
                break;
            case 'hard':
                move = this.gridSize === 3 ? this.getBestMove() : this.getStrategicMove();
                break;
        }
        
        if (move === undefined || move === null) {
            move = this.getRandomMove();
        }
        this.aiThinking = false;
        this.makeMove(move);
    },
    
    getRandomMove() {
        const available = this.board.map((cell, i) => cell === '' ? i : null).filter(i => i !== null);
        return available[Math.floor(Math.random() * available.length)];
    },

    findCriticalMove(player) {
        for (let i = 0; i < this.board.length; i++) {
            if (this.board[i] !== '') continue;
            this.board[i] = player;
            const wins = this.checkWin(player);
            this.board[i] = '';
            if (wins) return i;
        }
        return -1;
    },

    getStrategicMove() {
        // 1) Win if possible this turn.
        let move = this.findCriticalMove('O');
        if (move !== -1) return move;

        // 2) Block immediate opponent win.
        move = this.findCriticalMove('X');
        if (move !== -1) return move;

        // 3) Take center when available.
        const center = Math.floor((this.gridSize * this.gridSize) / 2);
        if (this.board[center] === '') {
            return center;
        }

        // 4) Choose high-value cells near existing marks.
        let bestScore = -Infinity;
        let bestMoves = [];
        for (let index = 0; index < this.board.length; index++) {
            if (this.board[index] !== '') continue;

            const row = Math.floor(index / this.gridSize);
            const col = index % this.gridSize;
            let score = 0;

            for (let dRow = -1; dRow <= 1; dRow++) {
                for (let dCol = -1; dCol <= 1; dCol++) {
                    if (dRow === 0 && dCol === 0) continue;

                    const nRow = row + dRow;
                    const nCol = col + dCol;
                    if (nRow < 0 || nRow >= this.gridSize || nCol < 0 || nCol >= this.gridSize) {
                        continue;
                    }

                    const neighbor = this.board[nRow * this.gridSize + nCol];
                    if (neighbor === 'O') score += 2;
                    if (neighbor === 'X') score += 1;
                }
            }

            if (score > bestScore) {
                bestScore = score;
                bestMoves = [index];
            } else if (score === bestScore) {
                bestMoves.push(index);
            }
        }

        if (bestMoves.length > 0 && bestScore > 0) {
            return bestMoves[Math.floor(Math.random() * bestMoves.length)];
        }

        // 5) Fall back to corners, then random.
        const size = this.gridSize;
        const corners = [0, size - 1, size * (size - 1), size * size - 1];
        const freeCorner = corners.find(i => this.board[i] === '');
        if (freeCorner !== undefined) {
            return freeCorner;
        }

        return this.getRandomMove();
    },
    
    getBestMove() {
        // Minimax algorithm
        let bestScore = -Infinity;
        let bestMove = 0;
        
        for (let i = 0; i < this.board.length; i++) {
            if (this.board[i] === '') {
                this.board[i] = 'O';
                let score = this.minimax(this.board, 0, false);
                this.board[i] = '';
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }
        
        return bestMove;
    },
    
    minimax(board, depth, isMaximizing) {
        if (this.checkWin('O')) return 10 - depth;
        if (this.checkWin('X')) return depth - 10;
        if (board.every(cell => cell !== '')) return 0;
        
        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < board.length; i++) {
                if (board[i] === '') {
                    board[i] = 'O';
                    let score = this.minimax(board, depth + 1, false);
                    board[i] = '';
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < board.length; i++) {
                if (board[i] === '') {
                    board[i] = 'X';
                    let score = this.minimax(board, depth + 1, true);
                    board[i] = '';
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    },
    
    checkWin(player) {
        const size = this.gridSize;
        const needed = this.winsNeeded;
        
        // Check rows
        for (let row = 0; row < size; row++) {
            for (let col = 0; col <= size - needed; col++) {
                let win = true;
                for (let i = 0; i < needed; i++) {
                    if (this.board[row * size + col + i] !== player) {
                        win = false;
                        break;
                    }
                }
                if (win) return { type: 'row', row, col };
            }
        }
        
        // Check columns
        for (let col = 0; col < size; col++) {
            for (let row = 0; row <= size - needed; row++) {
                let win = true;
                for (let i = 0; i < needed; i++) {
                    if (this.board[(row + i) * size + col] !== player) {
                        win = false;
                        break;
                    }
                }
                if (win) return { type: 'col', row, col };
            }
        }
        
        // Check diagonals
        for (let row = 0; row <= size - needed; row++) {
            for (let col = 0; col <= size - needed; col++) {
                let win = true;
                for (let i = 0; i < needed; i++) {
                    if (this.board[(row + i) * size + col + i] !== player) {
                        win = false;
                        break;
                    }
                }
                if (win) return { type: 'diag', row, col };
            }
        }
        
        // Check anti-diagonals
        for (let row = 0; row <= size - needed; row++) {
            for (let col = needed - 1; col < size; col++) {
                let win = true;
                for (let i = 0; i < needed; i++) {
                    if (this.board[(row + i) * size + col - i] !== player) {
                        win = false;
                        break;
                    }
                }
                if (win) return { type: 'anti-diag', row, col };
            }
        }
        
        return null;
    },
    
    highlightWin() {
        const winInfo = this.checkWin(this.currentPlayer);
        if (!winInfo) return;
        
        const size = this.gridSize;
        const needed = this.winsNeeded;
        const cells = [];
        
        for (let i = 0; i < needed; i++) {
            let index;
            switch(winInfo.type) {
                case 'row':
                    index = winInfo.row * size + winInfo.col + i;
                    break;
                case 'col':
                    index = (winInfo.row + i) * size + winInfo.col;
                    break;
                case 'diag':
                    index = (winInfo.row + i) * size + winInfo.col + i;
                    break;
                case 'anti-diag':
                    index = (winInfo.row + i) * size + winInfo.col - i;
                    break;
            }
            cells.push(index);
        }
        
        cells.forEach(i => {
            document.querySelector(`[data-index="${i}"]`).classList.add('winner');
        });
    },
    
    showHint() {
        // Find best move for current player
        const isPlayerX = this.currentPlayer === 'X';
        
        // Check if can win
        for (let i = 0; i < this.board.length; i++) {
            if (this.board[i] === '') {
                this.board[i] = this.currentPlayer;
                if (this.checkWin(this.currentPlayer)) {
                    const cell = document.querySelector(`[data-index="${i}"]`);
                    cell.style.boxShadow = '0 0 20px var(--success)';
                    setTimeout(() => cell.style.boxShadow = '', 2000);
                }
                this.board[i] = '';
            }
        }
        
        // Check if need to block
        const opponent = this.currentPlayer === 'X' ? 'O' : 'X';
        for (let i = 0; i < this.board.length; i++) {
            if (this.board[i] === '') {
                this.board[i] = opponent;
                if (this.checkWin(opponent)) {
                    const cell = document.querySelector(`[data-index="${i}"]`);
                    cell.style.boxShadow = '0 0 20px var(--danger)';
                    setTimeout(() => cell.style.boxShadow = '', 2000);
                }
                this.board[i] = '';
            }
        }
    }
};
