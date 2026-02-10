/* ============================================
   WORD GUESS (WORDLE-STYLE) GAME
   ============================================ */

const WordGuess = {
    targetWord: '',
    currentRow: 0,
    currentCol: 0,
    guesses: [],
    level: 1,
    wordLength: 5,
    maxGuesses: 6,
    gameActive: true,
    hints: 3,
    keydownHandler: null,
    
    // Word lists by length
    wordLists: {
        4: ['PLAY', 'GAME', 'WORD', 'BIRD', 'FISH', 'TREE', 'BLUE', 'PINK', 'LOVE', 'HOPE'],
        5: [
            'ABOUT', 'ABOVE', 'ABUSE', 'ACTOR', 'ACUTE', 'ADMIT', 'ADOPT', 'ADULT', 'AFTER', 'AGAIN',
            'AGENT', 'AGREE', 'AHEAD', 'ALARM', 'ALBUM', 'ALERT', 'ALIKE', 'ALIVE', 'ALLOW', 'ALONE',
            'ALONG', 'ALTER', 'AMONG', 'ANGER', 'ANGLE', 'ANGRY', 'APART', 'APPLE', 'APPLY', 'ARENA',
            'ARGUE', 'ARISE', 'ARRAY', 'ASIDE', 'ASSET', 'AUDIO', 'AUDIT', 'AVOID', 'AWARD', 'AWARE',
            'BADLY', 'BAKER', 'BASIS', 'BEACH', 'BEGAN', 'BEGIN', 'BEGUN', 'BEING', 'BELOW', 'BENCH',
            'BILLY', 'BIRTH', 'BLACK', 'BLAME', 'BLIND', 'BLOCK', 'BLOOD', 'BOARD', 'BOOST', 'BOOTH'
        ],
        6: ['ANIMAL', 'BANANA', 'CIRCLE', 'DOCTOR', 'FAMILY', 'GARDEN', 'ISLAND', 'JUNGLE', 'MARKET', 'OFFICE'],
        7: ['BALANCE', 'CAPTAIN', 'DANGER', 'FACTORY', 'HOLIDAY', 'JOURNEY', 'LIBRARY', 'MACHINE', 'NETWORK', 'PACKAGE']
    },
    
    // Letter status
    letterStatus: {},
    
    init(container, level) {
        this.cleanup();
        this.level = level;
        this.setDifficulty(level);
        this.currentRow = 0;
        this.currentCol = 0;
        this.guesses = [];
        this.gameActive = true;
        this.hints = 3;
        this.letterStatus = {};
        
        // Select random word
        const words = this.wordLists[this.wordLength];
        this.targetWord = words[Math.floor(Math.random() * words.length)];
        
        this.render(container);
    },
    
    setDifficulty(level) {
        if (level <= 4) this.wordLength = 4;
        else if (level <= 8) this.wordLength = 5;
        else if (level <= 12) this.wordLength = 6;
        else this.wordLength = 7;
    },
    
    render(container) {
        container.innerHTML = `
            <div class="wordguess-game">
                <div class="wordguess-header">
                    <div class="word-length">
                        <span>${this.wordLength} letters</span>
                    </div>
                    <div class="wordguess-stats">
                        <span class="stat"><i class="fas fa-lightbulb"></i> ${this.hints}</span>
                    </div>
                </div>
                
                <div class="wordguess-grid" id="wordguess-grid">
                    ${this.renderGrid()}
                </div>
                
                <div class="wordguess-keyboard" id="wordguess-keyboard">
                    ${this.renderKeyboard()}
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
        for (let row = 0; row < this.maxGuesses; row++) {
            html += '<div class="wordguess-row">';
            for (let col = 0; col < this.wordLength; col++) {
                const guess = this.guesses[row];
                const letter = guess ? guess[col] : '';
                const status = this.getLetterStatus(row, col);
                
                html += `<div class="wordguess-cell ${status}" data-row="${row}" data-col="${col}">${letter}</div>`;
            }
            html += '</div>';
        }
        return html;
    },
    
    getLetterStatus(row, col) {
        if (row >= this.guesses.length) return '';
        
        const guess = this.guesses[row];
        const letter = guess[col];
        
        if (letter === this.targetWord[col]) return 'correct';
        if (this.targetWord.includes(letter)) return 'present';
        return 'absent';
    },
    
    renderKeyboard() {
        const rows = [
            'QWERTYUIOP',
            'ASDFGHJKL',
            'ZXCVBNM'
        ];
        
        return rows.map(row => `
            <div class="keyboard-row">
                ${row.split('').map(letter => {
                    const status = this.letterStatus[letter] || '';
                    return `<button class="key ${status}" onclick="WordGuess.inputLetter('${letter}')">${letter}</button>`;
                }).join('')}
            </div>
        `).join('') + `
            <div class="keyboard-row">
                <button class="key wide" onclick="WordGuess.submitGuess()">ENTER</button>
                <button class="key wide" onclick="WordGuess.backspace()">⌫</button>
            </div>
        `;
    },
    
    handleKeyPress(e) {
        if (!this.gameActive) return;
        
        const key = e.key.toUpperCase();
        
        if (key === 'ENTER') {
            this.submitGuess();
        } else if (key === 'BACKSPACE') {
            this.backspace();
        } else if (key >= 'A' && key <= 'Z') {
            this.inputLetter(key);
        }
    },
    
    inputLetter(letter) {
        if (!this.gameActive || this.currentCol >= this.wordLength) return;
        
        const cell = document.querySelector(`[data-row="${this.currentRow}"][data-col="${this.currentCol}"]`);
        cell.textContent = letter;
        cell.classList.add('filled');
        
        this.currentCol++;
    },
    
    backspace() {
        if (!this.gameActive || this.currentCol === 0) return;
        
        this.currentCol--;
        const cell = document.querySelector(`[data-row="${this.currentRow}"][data-col="${this.currentCol}"]`);
        cell.textContent = '';
        cell.classList.remove('filled');
    },
    
    submitGuess() {
        if (!this.gameActive || this.currentCol < this.wordLength) return;
        
        // Get current guess
        let guess = '';
        for (let col = 0; col < this.wordLength; col++) {
            guess += document.querySelector(`[data-row="${this.currentRow}"][data-col="${col}"]`).textContent;
        }
        
        // Check if valid word (simplified - in real app, check against dictionary)
        const validWords = this.wordLists[this.wordLength];
        if (!validWords.includes(guess)) {
            // Shake animation for invalid word
            const row = document.querySelectorAll('.wordguess-row')[this.currentRow];
            row.classList.add('shake');
            setTimeout(() => row.classList.remove('shake'), 500);
            return;
        }
        
        this.guesses.push(guess);
        
        // Update letter status
        for (let i = 0; i < this.wordLength; i++) {
            const letter = guess[i];
            if (this.targetWord[i] === letter) {
                this.letterStatus[letter] = 'correct';
            } else if (this.targetWord.includes(letter) && this.letterStatus[letter] !== 'correct') {
                this.letterStatus[letter] = 'present';
            } else if (!this.letterStatus[letter]) {
                this.letterStatus[letter] = 'absent';
            }
        }
        
        // Update display
        this.updateGrid();
        this.updateKeyboard();
        
        // Check win
        if (guess === this.targetWord) {
            this.gameWin();
            return;
        }
        
        // Check loss
        if (this.currentRow >= this.maxGuesses - 1) {
            this.gameOver();
            return;
        }
        
        // Move to next row
        this.currentRow++;
        this.currentCol = 0;
    },
    
    updateGrid() {
        document.getElementById('wordguess-grid').innerHTML = this.renderGrid();
        
        // Animate the current row
        const row = document.querySelectorAll('.wordguess-row')[this.currentRow];
        if (row) {
            row.querySelectorAll('.wordguess-cell').forEach((cell, i) => {
                setTimeout(() => {
                    cell.classList.add('reveal');
                }, i * 100);
            });
        }
    },
    
    updateKeyboard() {
        document.getElementById('wordguess-keyboard').innerHTML = this.renderKeyboard();
    },
    
    gameWin() {
        this.gameActive = false;
        
        // Calculate bonus based on rows used
        const rowsBonus = (this.maxGuesses - this.currentRow) * 50;
        
        // Confetti effect
        createConfetti();
        
        setTimeout(() => {
            levelComplete(rowsBonus);
        }, 1500);
    },
    
    gameOver() {
        this.gameActive = false;
        
        // Reveal word
        setTimeout(() => {
            gameOver(`The word was: ${this.targetWord}`);
        }, 1000);
    },
    
    showHint() {
        if (this.hints <= 0 || !this.gameActive) return;
        
        // Reveal a random unrevealed letter
        const unrevealedPositions = [];
        for (let i = 0; i < this.wordLength; i++) {
            const isRevealed = this.guesses.some(guess => guess[i] === this.targetWord[i]);
            if (!isRevealed) {
                unrevealedPositions.push(i);
            }
        }
        
        if (unrevealedPositions.length === 0) return;
        
        const pos = unrevealedPositions[Math.floor(Math.random() * unrevealedPositions.length)];
        const letter = this.targetWord[pos];
        
        // Highlight the letter position
        for (let row = 0; row < this.maxGuesses; row++) {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${pos}"]`);
            if (cell && !cell.textContent) {
                cell.style.borderColor = 'var(--accent)';
                cell.style.boxShadow = '0 0 10px var(--accent)';
                setTimeout(() => {
                    cell.style.borderColor = '';
                    cell.style.boxShadow = '';
                }, 2000);
                break;
            }
        }
        
        this.hints--;
        updateGameScore(-25);
        
        // Update stats display
        document.querySelector('.wordguess-stats').innerHTML = 
            `<span class="stat"><i class="fas fa-lightbulb"></i> ${this.hints}</span>`;
    },

    cleanup() {
        this.gameActive = false;

        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler);
        }
    }
};
