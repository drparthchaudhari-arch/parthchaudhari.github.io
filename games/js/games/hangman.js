/* ============================================
   HANGMAN CLASSIC GAME
   ============================================ */

const Hangman = {
    word: '',
    guessedLetters: [],
    wrongGuesses: 0,
    maxWrong: 6,
    level: 1,
    category: 'animals',
    hints: 3,
    gameActive: true,
    keydownHandler: null,
    
    // Word categories
    categories: {
        animals: ['ELEPHANT', 'GIRAFFE', 'PENGUIN', 'DOLPHIN', 'BUTTERFLY', 'KANGAROO', 'OCTOPUS', 'RHINOCEROS'],
        countries: ['AUSTRALIA', 'BRAZIL', 'CANADA', 'DENMARK', 'EGYPT', 'FRANCE', 'GERMANY', 'INDIA'],
        foods: ['PIZZA', 'HAMBURGER', 'SPAGHETTI', 'CHOCOLATE', 'PANCAKES', 'SANDWICH', 'CROISSANT', 'AVOCADO'],
        movies: ['INCEPTION', 'TITANIC', 'AVATAR', 'GLADIATOR', 'FROZEN', 'JURASSIC', 'BATMAN', 'SPIDERMAN'],
        science: ['GRAVITY', 'MOLECULE', 'GALAXY', 'ECLIPSE', 'VOLCANO', 'TSUNAMI', 'HURRICANE', 'EARTHQUAKE'],
        vet: ['VETERINARIAN', 'ANTIBIOTICS', 'VACCINATION', 'RADIOGRAPHY', 'ANESTHESIA', 'ORTHOPEDICS', 'DERMATOLOGY', 'CARDIOLOGY']
    },
    
    // Hangman ASCII art
    hangmanStages: [
        `
  +---+
  |   |
      |
      |
      |
      |
=========`,
        `
  +---+
  |   |
  O   |
      |
      |
      |
=========`,
        `
  +---+
  |   |
  O   |
  |   |
      |
      |
=========`,
        `
  +---+
  |   |
  O   |
 /|   |
      |
      |
=========`,
        `
  +---+
  |   |
  O   |
 /|\\  |
      |
      |
=========`,
        `
  +---+
  |   |
  O   |
 /|\\  |
 /    |
      |
=========`,
        `
  +---+
  |   |
  O   |
 /|\\  |
 / \\  |
      |
=========`
    ],
    
    init(container, level) {
        this.cleanup();
        this.level = level;
        this.guessedLetters = [];
        this.wrongGuesses = 0;
        this.hints = 3;
        this.gameActive = true;
        
        // Select category based on level
        const catKeys = Object.keys(this.categories);
        this.category = catKeys[(level - 1) % catKeys.length];
        
        // Select word
        const words = this.categories[this.category];
        this.word = words[Math.floor(Math.random() * words.length)];
        
        this.render(container);
    },
    
    render(container) {
        container.innerHTML = `
            <div class="hangman-game">
                <div class="hangman-header">
                    <div class="category-display">
                        <span>Category: <strong>${this.category.charAt(0).toUpperCase() + this.category.slice(1)}</strong></span>
                    </div>
                    <div class="hangman-stats">
                        <span class="stat"><i class="fas fa-times"></i> ${this.wrongGuesses}/${this.maxWrong}</span>
                        <span class="stat"><i class="fas fa-lightbulb"></i> ${this.hints}</span>
                    </div>
                </div>
                
                <div class="hangman-display">
                    <pre class="hangman-art">${this.hangmanStages[this.wrongGuesses]}</pre>
                </div>
                
                <div class="word-display" id="word-display">
                    ${this.renderWord()}
                </div>
                
                <div class="guessed-letters" id="guessed-letters">
                    ${this.renderGuessedLetters()}
                </div>
                
                <div class="keyboard" id="keyboard">
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
    
    renderWord() {
        return this.word.split('').map(letter => {
            if (this.guessedLetters.includes(letter)) {
                return `<span class="letter revealed">${letter}</span>`;
            } else {
                return `<span class="letter hidden">_</span>`;
            }
        }).join('');
    },
    
    renderGuessedLetters() {
        if (this.guessedLetters.length === 0) return '';
        
        const wrong = this.guessedLetters.filter(l => !this.word.includes(l));
        if (wrong.length === 0) return '';
        
        return `
            <p>Wrong guesses: ${wrong.map(l => `<span class="wrong-letter">${l}</span>`).join(' ')}</p>
        `;
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
                    const guessed = this.guessedLetters.includes(letter);
                    const correct = guessed && this.word.includes(letter);
                    const wrong = guessed && !this.word.includes(letter);
                    
                    let classes = 'key';
                    if (correct) classes += ' correct';
                    if (wrong) classes += ' wrong';
                    
                    return `<button class="${classes}" 
                            ${guessed ? 'disabled' : ''} 
                            onclick="Hangman.guess('${letter}')">${letter}</button>`;
                }).join('')}
            </div>
        `).join('');
    },
    
    guess(letter) {
        if (!this.gameActive || this.guessedLetters.includes(letter)) return;
        
        this.guessedLetters.push(letter);
        
        if (this.word.includes(letter)) {
            // Correct guess
            updateGameScore(10 * (1 + GameState.streak * 0.1));
            updateStreak(true);
            
            // Check win
            if (this.isWin()) {
                this.gameWin();
            }
        } else {
            // Wrong guess
            this.wrongGuesses++;
            updateStreak(false);
            
            if (this.wrongGuesses >= this.maxWrong) {
                this.gameOver();
            }
        }
        
        this.updateDisplay();
    },
    
    handleKeyPress(e) {
        if (!this.gameActive) return;
        
        const key = e.key.toUpperCase();
        if (key >= 'A' && key <= 'Z') {
            this.guess(key);
        }
    },
    
    isWin() {
        return this.word.split('').every(letter => this.guessedLetters.includes(letter));
    },
    
    gameWin() {
        this.gameActive = false;
        
        const remainingGuesses = this.maxWrong - this.wrongGuesses;
        const bonus = remainingGuesses * 20;
        
        levelComplete(bonus);
    },
    
    gameOver() {
        this.gameActive = false;
        
        // Reveal word
        document.getElementById('word-display').innerHTML = 
            this.word.split('').map(l => `<span class="letter revealed">${l}</span>`).join('');
        
        setTimeout(() => {
            gameOver(`The word was: ${this.word}`);
        }, 1500);
    },
    
    updateDisplay() {
        document.getElementById('word-display').innerHTML = this.renderWord();
        document.getElementById('guessed-letters').innerHTML = this.renderGuessedLetters();
        document.getElementById('keyboard').innerHTML = this.renderKeyboard();
        
        // Update hangman art
        document.querySelector('.hangman-art').textContent = this.hangmanStages[this.wrongGuesses];
        
        // Update stats
        document.querySelector('.hangman-stats').innerHTML = `
            <span class="stat"><i class="fas fa-times"></i> ${this.wrongGuesses}/${this.maxWrong}</span>
            <span class="stat"><i class="fas fa-lightbulb"></i> ${this.hints}</span>
        `;
    },
    
    showHint() {
        if (this.hints <= 0 || !this.gameActive) return;
        
        // Find unrevealed letter
        const unrevealed = this.word.split('').filter(l => !this.guessedLetters.includes(l));
        if (unrevealed.length === 0) return;
        
        const letter = unrevealed[Math.floor(Math.random() * unrevealed.length)];
        this.guess(letter);
        
        this.hints--;
        updateGameScore(-30);
    },

    cleanup() {
        this.gameActive = false;

        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler);
        }
    }
};
