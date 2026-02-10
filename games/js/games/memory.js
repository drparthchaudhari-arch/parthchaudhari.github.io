/* ============================================
   MEMORY MATCH GAME
   ============================================ */

const MemoryGame = {
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    totalPairs: 0,
    gridSize: { rows: 4, cols: 4 },
    isLocked: false,
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', 
             '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞'],
    
    init(container, level) {
        this.setDifficulty(level);
        this.matchedPairs = 0;
        this.flippedCards = [];
        this.isLocked = false;
        
        this.generateCards();
        this.render(container);
    },
    
    setDifficulty(level) {
        if (level <= 5) {
            this.gridSize = { rows: 4, cols: 4 };
            this.totalPairs = 8;
        } else if (level <= 10) {
            this.gridSize = { rows: 4, cols: 6 };
            this.totalPairs = 12;
        } else {
            this.gridSize = { rows: 6, cols: 6 };
            this.totalPairs = 18;
        }
    },
    
    generateCards() {
        const selectedEmojis = this.emojis.slice(0, this.totalPairs);
        this.cards = [...selectedEmojis, ...selectedEmojis];
        this.cards = shuffleArray(this.cards);
    },
    
    render(container) {
        const { rows, cols } = this.gridSize;
        
        container.innerHTML = `
            <div class="memory-game">
                <div class="memory-grid" id="memory-grid" 
                     style="grid-template-columns: repeat(${cols}, 1fr);">
                    ${this.cards.map((emoji, i) => `
                        <div class="memory-card" data-index="${i}" data-emoji="${emoji}">
                            <div class="memory-card-inner">
                                <div class="memory-card-front"></div>
                                <div class="memory-card-back">${emoji}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="memory-stats">
                    <span>Pairs: <strong>${this.matchedPairs}/${this.totalPairs}</strong></span>
                </div>
            </div>
        `;
        
        // Add event listeners
        const cards = container.querySelectorAll('.memory-card');
        cards.forEach(card => {
            card.addEventListener('click', (e) => this.handleCardClick(e));
        });
    },
    
    handleCardClick(e) {
        if (this.isLocked) return;
        
        const card = e.currentTarget;
        const index = parseInt(card.dataset.index);
        
        // Don't allow clicking same card or already matched cards
        if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
        
        // Flip card
        card.classList.add('flipped');
        this.flippedCards.push(card);
        
        // Check if two cards flipped
        if (this.flippedCards.length === 2) {
            this.isLocked = true;
            this.checkMatch();
        }
    },
    
    checkMatch() {
        const [card1, card2] = this.flippedCards;
        const match = card1.dataset.emoji === card2.dataset.emoji;
        
        if (match) {
            setTimeout(() => {
                card1.classList.add('matched');
                card2.classList.add('matched');
                this.matchedPairs++;
                this.flippedCards = [];
                this.isLocked = false;
                
                // Update stats
                document.querySelector('.memory-stats strong').textContent = 
                    `${this.matchedPairs}/${this.totalPairs}`;
                
                // Score
                updateGameScore(20 * (1 + GameState.streak * 0.1));
                updateStreak(true);
                
                // Check win
                if (this.matchedPairs === this.totalPairs) {
                    setTimeout(() => levelComplete(GameState.streak * 30), 500);
                }
            }, 500);
        } else {
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                this.flippedCards = [];
                this.isLocked = false;
                updateStreak(false);
            }, 1000);
        }
    },
    
    showHint() {
        // Find an unmatched pair and briefly show them
        const unmatched = document.querySelectorAll('.memory-card:not(.matched):not(.flipped)');
        if (unmatched.length < 2) return;
        
        // Group by emoji
        const emojiGroups = {};
        unmatched.forEach(card => {
            const emoji = card.dataset.emoji;
            if (!emojiGroups[emoji]) emojiGroups[emoji] = [];
            emojiGroups[emoji].push(card);
        });
        
        // Find a pair
        for (const emoji in emojiGroups) {
            if (emojiGroups[emoji].length === 2) {
                const [card1, card2] = emojiGroups[emoji];
                card1.classList.add('flipped');
                card2.classList.add('flipped');
                
                setTimeout(() => {
                    if (!card1.classList.contains('matched')) {
                        card1.classList.remove('flipped');
                        card2.classList.remove('flipped');
                    }
                }, 1500);
                break;
            }
        }
    }
};
