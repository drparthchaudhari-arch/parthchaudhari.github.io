/* ============================================
   IQ CHALLENGE GAME
   ============================================ */

const IQChallenge = {
    currentQuestion: 0,
    questions: [],
    score: 0,
    level: 1,
    hintShown: false,
    
    // Question banks by category
    mathQuestions: [
        { q: 'What is 15 × 4?', options: ['45', '50', '60', '65'], answer: 2, hint: '10×4 + 5×4' },
        { q: 'What is 144 ÷ 12?', options: ['10', '11', '12', '14'], answer: 2, hint: '12×12 = 144' },
        { q: 'What is 7² + 8²?', options: ['105', '113', '120', '125'], answer: 1, hint: '49 + 64' },
        { q: 'If 3x + 5 = 20, what is x?', options: ['3', '4', '5', '6'], answer: 2, hint: '3x = 15' },
        { q: 'What is 25% of 80?', options: ['15', '18', '20', '22'], answer: 2, hint: '80 ÷ 4' },
        { q: 'What comes next: 2, 6, 12, 20, ?', options: ['28', '30', '32', '34'], answer: 1, hint: 'Differences: +4, +6, +8, +10' },
        { q: 'What is the square root of 256?', options: ['14', '15', '16', '17'], answer: 2, hint: '16×16' },
        { q: 'If a = 3 and b = 4, what is a² + b²?', options: ['16', '20', '25', '30'], answer: 2, hint: '9 + 16' },
        { q: 'What is 0.75 as a fraction?', options: ['2/3', '3/4', '4/5', '5/6'], answer: 1, hint: '75/100 = 3/4' },
        { q: 'What is the next prime number after 23?', options: ['27', '29', '31', '33'], answer: 1, hint: '27 is 3×9, 29 is prime' }
    ],
    
    logicQuestions: [
        { q: 'All roses are flowers. Some flowers fade quickly. Therefore:', options: ['All roses fade quickly', 'Some roses fade quickly', 'Roses never fade quickly', 'Cannot be determined'], answer: 3, hint: 'We only know about some flowers' },
        { q: 'If CAT = 312, DOG = 415, then BAT = ?', options: ['213', '312', '412', '512'], answer: 0, hint: 'A=1, B=2, C=3...' },
        { q: 'Which is the odd one out?', options: ['Square', 'Circle', 'Triangle', 'Rectangle'], answer: 1, hint: 'Only one has no corners' },
        { q: 'If A is taller than B, and B is taller than C, then:', options: ['A is shortest', 'C is tallest', 'A is tallest', 'Cannot tell'], answer: 2, hint: 'A > B > C' },
        { q: 'What comes next: O, T, T, F, F, S, S, ?', options: ['E', 'N', 'T', 'O'], answer: 0, hint: 'First letters of numbers: One, Two, Three...' },
        { q: 'If it takes 5 machines 5 minutes to make 5 widgets, how long for 100 machines to make 100 widgets?', options: ['5 min', '10 min', '50 min', '100 min'], answer: 0, hint: 'Each machine makes 1 widget in 5 minutes' },
        { q: 'A bat and ball cost $11. The bat costs $10 more than the ball. How much is the ball?', options: ['$0.50', '$1', '$1.50', '$2'], answer: 0, hint: 'If ball is $0.50, bat is $10.50' },
        { q: 'Which number does not belong: 2, 3, 5, 9, 11, 13?', options: ['2', '5', '9', '11'], answer: 2, hint: '9 is not prime' },
        { q: 'If WATER is written as YCVGT, how is WINE written?', options: ['YKPG', 'YLPG', 'YKPH', 'YMPG'], answer: 0, hint: 'Each letter +2 in alphabet' },
        { q: 'Complete: 1, 1, 2, 3, 5, 8, 13, ?', options: ['18', '20', '21', '23'], answer: 2, hint: 'Fibonacci sequence' }
    ],
    
    patternQuestions: [
        { q: 'What comes next: △, □, ○, △, □, ?', options: ['△', '□', '○', '◇'], answer: 2, hint: 'Triangle, Square, Circle repeating' },
        { q: 'What is the missing number? 3, 6, 9, ?, 15', options: ['10', '11', '12', '13'], answer: 2, hint: 'Add 3 each time' },
        { q: 'Which shape has the most sides?', options: ['Pentagon', 'Hexagon', 'Octagon', 'Triangle'], answer: 2, hint: 'Octa means 8' },
        { q: 'What comes next: A, C, E, G, ?', options: ['H', 'I', 'J', 'K'], answer: 1, hint: 'Every other letter: A, B, C, D, E...' },
        { q: 'If 🔴 = 3, 🔵 = 5, then 🟢 = ?', options: ['4', '5', '6', '7'], answer: 3, hint: 'Colors of rainbow: Red=3, Orange=4, Yellow=5, Green=6, Blue=5...' },
        { q: 'What is the next number: 1, 4, 9, 16, 25, ?', options: ['30', '36', '42', '49'], answer: 1, hint: 'Perfect squares: 1², 2², 3²...' },
        { q: 'Complete the pattern: 2, 6, 12, 20, 30, ?', options: ['38', '40', '42', '44'], answer: 2, hint: '1×2, 2×3, 3×4, 4×5, 5×6, 6×7' },
        { q: 'What letter comes next: Z, X, V, T, ?', options: ['P', 'Q', 'R', 'S'], answer: 2, hint: 'Go backwards: Z(26), X(24), V(22)...' },
        { q: 'If 🌞 = day and 🌙 = night, what is 🌅?', options: ['Noon', 'Sunset', 'Sunrise', 'Midnight'], answer: 2, hint: 'Sun rising over horizon' },
        { q: 'What number should replace ?: 8, 27, 64, ?, 216', options: ['100', '125', '144', '169'], answer: 1, hint: 'Cubes: 2³, 3³, 4³, 5³, 6³' }
    ],
    
    vetQuestions: [
        { q: 'Which organ filters blood in animals?', options: ['Heart', 'Lungs', 'Kidneys', 'Stomach'], answer: 2, hint: 'There are two of them' },
        { q: 'What is the largest organ in a dog\'s body?', options: ['Heart', 'Liver', 'Skin', 'Brain'], answer: 2, hint: 'It covers the entire body' },
        { q: 'Which bone is in the hind leg of a cat?', options: ['Humerus', 'Femur', 'Radius', 'Scapula'], answer: 1, hint: 'Same as human thigh bone' },
        { q: 'What vaccine is essential for all dogs?', options: ['Flu', 'Rabies', 'COVID', 'Measles'], answer: 1, hint: 'Required by law in most places' },
        { q: 'Which parasite causes heartworm disease?', options: ['Flea', 'Tick', 'Mosquito', 'Mite'], answer: 2, hint: 'Transmitted through bites' },
        { q: 'What is the normal body temperature for a dog?', options: ['98.6°F', '100-102.5°F', '104°F', '95°F'], answer: 1, hint: 'Slightly higher than humans' },
        { q: 'Which organ produces insulin in cats?', options: ['Liver', 'Pancreas', 'Kidney', 'Spleen'], answer: 1, hint: 'Also produces digestive enzymes' },
        { q: 'What does a veterinarian use to listen to heart/lungs?', options: ['Microscope', 'Stethoscope', 'Thermometer', 'X-ray'], answer: 1, hint: 'Has earpieces and a chest piece' },
        { q: 'Which disease is highly contagious among dogs?', options: ['Parvovirus', 'Diabetes', 'Arthritis', 'Cancer'], answer: 0, hint: 'Affects the digestive system' },
        { q: 'What is the medical term for dog\'s kneecap?', options: ['Femur', 'Patella', 'Tibia', 'Fibula'], answer: 1, hint: 'Small bone at front of knee' }
    ],
    
    init(container, level) {
        this.level = level;
        this.currentQuestion = 0;
        this.score = 0;
        this.hintShown = false;
        
        this.generateQuestions();
        this.render(container);
    },
    
    generateQuestions() {
        this.questions = [];
        
        // Mix question types based on level
        const questionCount = 5 + Math.floor(this.level / 3);
        
        // Add questions from each category
        const categories = [this.mathQuestions, this.logicQuestions, this.patternQuestions, this.vetQuestions];
        
        for (let i = 0; i < questionCount; i++) {
            const category = categories[i % categories.length];
            const available = category.filter(q => !this.questions.includes(q));
            if (available.length > 0) {
                const question = available[Math.floor(Math.random() * available.length)];
                this.questions.push(question);
            }
        }
        
        // Shuffle
        this.questions = shuffleArray(this.questions);
    },
    
    render(container) {
        this.renderQuestion(container);
    },
    
    renderQuestion(container) {
        const q = this.questions[this.currentQuestion];
        
        container.innerHTML = `
            <div class="iq-game">
                <div class="iq-question">
                    <h3>Question ${this.currentQuestion + 1}/${this.questions.length}</h3>
                    <p class="question-text">${q.q}</p>
                    <div class="iq-options" id="iq-options">
                        ${q.options.map((opt, i) => `
                            <button class="iq-option" data-index="${i}">${opt}</button>
                        `).join('')}
                    </div>
                    <div class="iq-hint hidden" id="iq-hint">
                        <i class="fas fa-lightbulb"></i> ${q.hint}
                    </div>
                </div>
                <div class="iq-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(this.currentQuestion / this.questions.length) * 100}%"></div>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners
        container.querySelectorAll('.iq-option').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleAnswer(e));
        });
    },
    
    handleAnswer(e) {
        const selectedIndex = parseInt(e.target.dataset.index);
        const correctIndex = this.questions[this.currentQuestion].answer;
        const options = document.querySelectorAll('.iq-option');
        
        // Disable all buttons
        options.forEach(btn => btn.disabled = true);
        
        // Show correct/incorrect
        if (selectedIndex === correctIndex) {
            e.target.classList.add('correct');
            this.score++;
            updateGameScore(20 * (1 + GameState.streak * 0.1));
            updateStreak(true);
        } else {
            e.target.classList.add('wrong');
            options[correctIndex].classList.add('correct');
            updateStreak(false);
        }
        
        // Next question or finish
        setTimeout(() => {
            this.currentQuestion++;
            this.hintShown = false;
            
            if (this.currentQuestion >= this.questions.length) {
                this.finishGame();
            } else {
                this.renderQuestion(document.getElementById('game-area'));
            }
        }, 1500);
    },
    
    showHint() {
        if (this.hintShown) return;
        
        const hintEl = document.getElementById('iq-hint');
        if (hintEl) {
            hintEl.classList.remove('hidden');
            this.hintShown = true;
        }
    },
    
    finishGame() {
        const percentage = (this.score / this.questions.length) * 100;
        
        if (percentage >= 70) {
            levelComplete(this.score * 10);
        } else {
            gameOver(`You scored ${this.score}/${this.questions.length}. Need 70% to pass.`);
        }
    }
};
