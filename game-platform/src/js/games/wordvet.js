/* ============================================
   WORDVET GAME
   ============================================ */

const WordVet = {
    grid: [],
    words: [],
    foundWords: [],
    selectedCells: [],
    gridSize: { rows: 6, cols: 8 },
    isDragging: false,
    currentWord: '',
    hintShown: false,
    hintCells: [],
    mouseUpHandler: null,
    touchEndHandler: null,
    
    // Word Lists
    normalWords: [
        'CAT', 'DOG', 'BIRD', 'FISH', 'LION', 'TIGER', 'BEAR', 'WOLF', 'FOX', 'DEER',
        'HORSE', 'SHEEP', 'GOAT', 'COW', 'PIG', 'DUCK', 'GOOSE', 'HEN', 'EAGLE', 'OWL',
        'TREE', 'FLOWER', 'GRASS', 'LEAF', 'RIVER', 'OCEAN', 'MOUNTAIN', 'FOREST', 'DESERT', 'BEACH',
        'SUN', 'MOON', 'STAR', 'CLOUD', 'RAIN', 'SNOW', 'WIND', 'STORM', 'RAINBOW', 'THUNDER',
        'APPLE', 'BANANA', 'ORANGE', 'GRAPE', 'PEACH', 'MANGO', 'BREAD', 'CHEESE', 'PIZZA', 'PASTA',
        'RED', 'BLUE', 'GREEN', 'YELLOW', 'ORANGE', 'PURPLE', 'PINK', 'BROWN', 'BLACK', 'WHITE',
        'HEAD', 'HAND', 'FOOT', 'ARM', 'LEG', 'EYE', 'EAR', 'NOSE', 'MOUTH', 'HAIR',
        'HOUSE', 'DOOR', 'WINDOW', 'TABLE', 'CHAIR', 'BED', 'LAMP', 'PHONE', 'BOOK', 'PENCIL',
        'CAR', 'BUS', 'TRAIN', 'PLANE', 'BOAT', 'SHIP', 'BIKE', 'TRUCK', 'TAXI', 'SUBWAY',
        'DOCTOR', 'TEACHER', 'POLICE', 'FARMER', 'CHEF', 'DRIVER', 'NURSE', 'ARTIST', 'SINGER', 'ACTOR'
    ],
    
    vetWords: [
        'FEMUR', 'TIBIA', 'FIBULA', 'HUMERUS', 'RADIUS', 'ULNA', 'SCAPULA', 'PELVIS', 'STERNUM', 'RIBS',
        'SPINE', 'SKULL', 'MANDIBLE', 'MAXILLA', 'CLAVICLE', 'PATELLA', 'TENDON', 'LIGAMENT', 'MUSCLE', 'CARTILAGE',
        'HEART', 'LUNGS', 'LIVER', 'KIDNEY', 'SPLEEN', 'PANCREAS', 'STOMACH', 'INTESTINE', 'COLON', 'BLADDER',
        'RABIES', 'PARVO', 'DISTEMPER', 'HEARTWORM', 'LEUKEMIA', 'DIABETES', 'ARTHRITIS', 'CANCER', 'TUMOR', 'INFECTION',
        'FLEA', 'TICK', 'MITE', 'LICE', 'WORM', 'ROUNDWORM', 'HOOKWORM', 'WHIPWORM', 'TAPEWORM', 'GIARDIA',
        'ANTIBIOTIC', 'VACCINE', 'ANTIVIRAL', 'ANTIFUNGAL', 'SURGERY', 'SPAY', 'NEUTER', 'VACCINATION', 'DEWORMER', 'SUPPLEMENT',
        'AMOXICILLIN', 'CEPHALEXIN', 'CLAVAMOX', 'PREDNISONE', 'CARPROFEN', 'RIMADYL', 'BIOPSY', 'RADIOGRAPH', 'ULTRASOUND', 'BLOODWORK',
        'TEMPERATURE', 'PULSE', 'RESPIRATION', 'HEARTRATE', 'BLOODPRESSURE', 'HYDRATION', 'LABRADOR', 'RETRIEVER', 'SHEPHERD', 'BULLDOG',
        'PERSIAN', 'SIAMESE', 'MAINECOON', 'BENGAL', 'RAGDOLL', 'SPHYNX', 'VETERINARIAN', 'CLINIC', 'HOSPITAL', 'PATIENT',
        'SURGERY', 'DENTISTRY', 'ONCOLOGY', 'DERMATOLOGY', 'CARDIOLOGY', 'NEUROLOGY', 'OPHTHALMOLOGY', 'ORTHOPEDICS', 'RADIOLOGY', 'ANESTHESIOLOGY'
    ],
    
    themes: [
        'Animals', 'Nature', 'Food', 'Colors', 'Body Parts', 'Household', 'Transportation', 'Professions',
        'Canine Anatomy', 'Feline Anatomy', 'Internal Organs', 'Common Diseases', 'Parasites', 'Medications',
        'Dog Breeds', 'Cat Breeds', 'Veterinary Specialties', 'Diagnostic Tests', 'Vital Signs', 'Treatments'
    ],
    
    colors: [
        'from-emerald-400 to-emerald-600',
        'from-teal-400 to-teal-600',
        'from-cyan-400 to-cyan-600',
        'from-sky-400 to-sky-600',
        'from-blue-400 to-blue-600',
        'from-indigo-400 to-indigo-600',
        'from-violet-400 to-violet-600',
        'from-purple-400 to-purple-600',
        'from-fuchsia-400 to-fuchsia-600',
        'from-pink-400 to-pink-600',
        'from-rose-400 to-rose-600',
        'from-orange-400 to-orange-600',
        'from-amber-400 to-amber-600',
        'from-yellow-400 to-yellow-600',
        'from-lime-400 to-lime-600'
    ],
    
    init(container, level) {
        this.cleanup();
        this.foundWords = [];
        this.selectedCells = [];
        this.currentWord = '';
        this.hintShown = false;
        this.hintCells = [];
        
        // Set difficulty based on level
        this.setDifficulty(level);
        
        // Generate words for this level
        this.generateWords(level);
        
        // Generate grid
        this.generateGrid();
        
        // Render game
        this.render(container);
        
        // Update word list panel
        this.updateWordList();
    },
    
    setDifficulty(level) {
        if (level <= 5) {
            this.gridSize = { rows: 6, cols: 8 };
        } else if (level <= 10) {
            this.gridSize = { rows: 7, cols: 9 };
        } else if (level <= 15) {
            this.gridSize = { rows: 8, cols: 10 };
        }
    },
    
    generateWords(level) {
        const wordCount = Math.min(3 + Math.floor(level / 3), 8);
        const vetRatio = Math.min(0.3 + (level * 0.03), 0.7);
        const vetWordCount = Math.floor(wordCount * vetRatio);
        
        this.words = [];
        const usedWords = new Set();
        
        // Add vet words
        while (this.words.filter(w => this.vetWords.includes(w)).length < vetWordCount) {
            const word = this.vetWords[Math.floor(Math.random() * this.vetWords.length)];
            if (!usedWords.has(word) && word.length >= 3 && word.length <= 10) {
                this.words.push(word);
                usedWords.add(word);
            }
        }
        
        // Add normal words
        while (this.words.length < wordCount) {
            const word = this.normalWords[Math.floor(Math.random() * this.normalWords.length)];
            if (!usedWords.has(word) && word.length >= 3 && word.length <= 10) {
                this.words.push(word);
                usedWords.add(word);
            }
        }
        
        // Sort by length (longest first)
        this.words.sort((a, b) => b.length - a.length);
    },
    
    generateGrid() {
        const { rows, cols } = this.gridSize;
        this.grid = Array(rows).fill(null).map(() => Array(cols).fill(''));
        
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],          [0, 1],
            [1, -1],  [1, 0], [1, 1]
        ];
        
        const placedWords = [];
        
        // Try to place each word
        for (const word of this.words) {
            let placed = false;
            let attempts = 0;
            
            while (!placed && attempts < 100) {
                const row = Math.floor(Math.random() * rows);
                const col = Math.floor(Math.random() * cols);
                const [dRow, dCol] = directions[Math.floor(Math.random() * directions.length)];
                
                // Check if word fits
                let fits = true;
                const positions = [];
                
                for (let i = 0; i < word.length; i++) {
                    const newRow = row + dRow * i;
                    const newCol = col + dCol * i;
                    
                    if (newRow < 0 || newRow >= rows || newCol < 0 || newCol >= cols) {
                        fits = false;
                        break;
                    }
                    
                    if (this.grid[newRow][newCol] !== '' && this.grid[newRow][newCol] !== word[i]) {
                        fits = false;
                        break;
                    }
                    
                    positions.push([newRow, newCol]);
                }
                
                if (fits) {
                    for (let i = 0; i < word.length; i++) {
                        const [r, c] = positions[i];
                        this.grid[r][c] = word[i];
                    }
                    placedWords.push(word);
                    placed = true;
                }
                
                attempts++;
            }
        }
        
        // Update words list to only include placed words
        this.words = placedWords;
        
        // Fill empty cells
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (this.grid[r][c] === '') {
                    this.grid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
                }
            }
        }
    },
    
    render(container) {
        const { rows, cols } = this.gridSize;
        
        container.innerHTML = `
            <div class="wordvet-game">
                <div class="word-display">
                    <div class="current-word" id="current-word"></div>
                </div>
                <div class="word-grid" id="word-grid" 
                     style="grid-template-columns: repeat(${cols}, 1fr);">
                    ${this.grid.map((row, r) => 
                        row.map((letter, c) => `
                            <div class="word-grid-cell" 
                                 data-row="${r}" 
                                 data-col="${c}"
                                 data-letter="${letter}">
                                ${letter}
                            </div>
                        `).join('')
                    ).join('')}
                </div>
            </div>
        `;
        
        // Add event listeners
        const grid = document.getElementById('word-grid');
        const cells = grid.querySelectorAll('.word-grid-cell');
        
        cells.forEach(cell => {
            cell.addEventListener('mousedown', (e) => this.handleStart(e));
            cell.addEventListener('mouseenter', (e) => this.handleMove(e));
            cell.addEventListener('touchstart', (e) => this.handleStart(e), { passive: false });
            cell.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        });

        if (!this.mouseUpHandler) {
            this.mouseUpHandler = () => this.handleEnd();
        }
        if (!this.touchEndHandler) {
            this.touchEndHandler = () => this.handleEnd();
        }

        document.addEventListener('mouseup', this.mouseUpHandler);
        document.addEventListener('touchend', this.touchEndHandler);
    },
    
    handleStart(e) {
        e.preventDefault();
        this.isDragging = true;
        this.selectedCells = [];
        this.currentWord = '';
        this.clearSelection();
        
        const cell = e.target.closest('.word-grid-cell');
        if (cell) {
            this.selectCell(cell);
        }
    },
    
    handleMove(e) {
        if (!this.isDragging) return;
        
        const cell = e.target.closest('.word-grid-cell');
        if (cell && !cell.classList.contains('selected')) {
            const lastCell = this.selectedCells[this.selectedCells.length - 1];
            if (lastCell && this.isAdjacent(lastCell, cell)) {
                this.selectCell(cell);
            }
        }
    },
    
    handleTouchMove(e) {
        e.preventDefault();
        if (!this.isDragging) return;
        
        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const cell = element?.closest('.word-grid-cell');
        
        if (cell && !cell.classList.contains('selected')) {
            const lastCell = this.selectedCells[this.selectedCells.length - 1];
            if (lastCell && this.isAdjacent(lastCell, cell)) {
                this.selectCell(cell);
            }
        }
    },
    
    handleEnd() {
        if (!this.isDragging) return;
        this.isDragging = false;
        
        const word = this.currentWord.toUpperCase();
        
        if (this.words.includes(word) && !this.foundWords.includes(word)) {
            // Word found!
            this.foundWords.push(word);
            this.markFound();
            updateGameScore(word.length * 10 * (1 + GameState.streak * 0.1));
            updateStreak(true);
            this.updateWordList();
            
            // Check if level complete
            if (this.foundWords.length === this.words.length) {
                setTimeout(() => levelComplete(GameState.streak * 50), 500);
            }
        } else {
            updateStreak(false);
            this.clearSelection();
        }
        
        this.currentWord = '';
        document.getElementById('current-word').textContent = '';
    },
    
    selectCell(cell) {
        cell.classList.add('selected');
        this.selectedCells.push(cell);
        this.currentWord += cell.dataset.letter;
        
        const wordDisplay = document.getElementById('current-word');
        wordDisplay.textContent = this.currentWord;
        
        // Check if valid word start
        const upperWord = this.currentWord.toUpperCase();
        const isValidStart = this.words.some(w => w.startsWith(upperWord));
        if (isValidStart) {
            wordDisplay.classList.add('valid');
        } else {
            wordDisplay.classList.remove('valid');
        }
    },
    
    isAdjacent(cell1, cell2) {
        const r1 = parseInt(cell1.dataset.row);
        const c1 = parseInt(cell1.dataset.col);
        const r2 = parseInt(cell2.dataset.row);
        const c2 = parseInt(cell2.dataset.col);
        
        return Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1 && !(r1 === r2 && c1 === c2);
    },
    
    clearSelection() {
        document.querySelectorAll('.word-grid-cell.selected').forEach(cell => {
            cell.classList.remove('selected');
        });
        this.selectedCells = [];
    },
    
    markFound() {
        this.selectedCells.forEach(cell => {
            cell.classList.remove('selected');
            cell.classList.add('found');
        });
    },
    
    updateWordList() {
        const wordList = document.getElementById('word-list');
        wordList.innerHTML = this.words.map(word => {
            const isFound = this.foundWords.includes(word);
            const colorIndex = this.words.indexOf(word) % this.colors.length;
            return `
                <div class="word-item ${isFound ? 'found' : 'hidden-word'} ${isFound ? this.colors[colorIndex] : ''}">
                    ${isFound ? word : '•'.repeat(word.length)}
                </div>
            `;
        }).join('');
    },
    
    showHint() {
        if (this.hintShown) {
            // Clear hint
            this.hintCells.forEach(cell => cell.classList.remove('hint'));
            this.hintShown = false;
            this.hintCells = [];
            return;
        }
        
        // Find an unfound word
        const unfoundWords = this.words.filter(w => !this.foundWords.includes(w));
        if (unfoundWords.length === 0) return;
        
        const targetWord = unfoundWords[0];
        const { rows, cols } = this.gridSize;
        
        // Search for word in grid
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (this.grid[r][c] === targetWord[0]) {
                    // Check all directions
                    const directions = [
                        [-1, -1], [-1, 0], [-1, 1],
                        [0, -1],          [0, 1],
                        [1, -1],  [1, 0], [1, 1]
                    ];
                    
                    for (const [dRow, dCol] of directions) {
                        let found = true;
                        const positions = [];
                        
                        for (let i = 0; i < Math.min(2, targetWord.length); i++) {
                            const newRow = r + dRow * i;
                            const newCol = c + dCol * i;
                            
                            if (newRow < 0 || newRow >= rows || newCol < 0 || newCol >= cols ||
                                this.grid[newRow][newCol] !== targetWord[i]) {
                                found = false;
                                break;
                            }
                            positions.push([newRow, newCol]);
                        }
                        
                        if (found) {
                            positions.forEach(([row, col]) => {
                                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                                if (cell) {
                                    cell.classList.add('hint');
                                    this.hintCells.push(cell);
                                }
                            });
                            this.hintShown = true;
                            return;
                        }
                    }
                }
            }
        }
    },

    cleanup() {
        this.isDragging = false;
        this.currentWord = '';

        if (this.mouseUpHandler) {
            document.removeEventListener('mouseup', this.mouseUpHandler);
        }
        if (this.touchEndHandler) {
            document.removeEventListener('touchend', this.touchEndHandler);
        }
    }
};
