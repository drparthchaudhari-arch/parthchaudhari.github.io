/* ============================================
   PARTH GAMES - MAIN JAVASCRIPT
   ============================================ */

// Game State
const GameState = {
    currentGame: null,
    currentLevel: 1,
    score: 0,
    streak: 0,
    hints: 3,
    isPaused: false,
    timer: 0,
    timerInterval: null,
    totalScore: parseInt(localStorage.getItem('totalScore')) || 0,
    highestStreak: parseInt(localStorage.getItem('highestStreak')) || 0,
    gameProgress: JSON.parse(localStorage.getItem('gameProgress')) || {}
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateNavStats();
    loadLeaderboard();
    setupNavigation();
    setupTabs();
});

// Navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('href').substring(1);
            showSection(target);
            
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
}

function showSection(sectionId) {
    const gameContainer = document.getElementById('game-container');
    if (gameContainer && !gameContainer.classList.contains('hidden')) {
        stopTimer();
        cleanupGame(GameState.currentGame);
        resetGameOverlays();
        gameContainer.classList.add('hidden');
        GameState.currentGame = null;
    }

    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

function getGameController(gameName) {
    switch (gameName) {
        case 'wordvet': return WordVet;
        case 'sudoku': return Sudoku;
        case 'tictactoe': return TicTacToe;
        case 'memory': return MemoryGame;
        case 'snake': return SnakeGame;
        case 'game2048': return Game2048;
        case 'hangman': return Hangman;
        case 'wordguess': return WordGuess;
        case 'iq': return IQChallenge;
        default: return null;
    }
}

function cleanupGame(gameName = GameState.currentGame) {
    const controller = getGameController(gameName);
    if (controller && typeof controller.cleanup === 'function') {
        try {
            controller.cleanup();
        } catch (error) {
            console.warn(`Cleanup failed for ${gameName}:`, error);
        }
    }
}

function resetGameOverlays() {
    document.getElementById('pause-menu').classList.add('hidden');
    document.getElementById('level-complete-modal').classList.add('hidden');
    document.getElementById('game-over-modal').classList.add('hidden');
    document.getElementById('pause-btn').innerHTML = '<i class="fas fa-pause"></i>';
    GameState.isPaused = false;
}

// Update Navigation Stats
function updateNavStats() {
    document.getElementById('total-score').textContent = GameState.totalScore.toLocaleString();
    document.getElementById('streak').textContent = GameState.streak;
}

// Start Game
function startGame(gameName) {
    cleanupGame(GameState.currentGame);

    GameState.currentGame = gameName;
    GameState.currentLevel = GameState.gameProgress[gameName] || 1;
    GameState.score = 0;
    GameState.streak = 0;
    GameState.hints = 3;
    GameState.isPaused = false;
    GameState.timer = 0;
    
    // Hide main content, show game container
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById('game-container').classList.remove('hidden');
    resetGameOverlays();
    
    // Set game title
    const gameNames = {
        'wordvet': 'WordVet',
        'sudoku': 'Sudoku Master',
        'tictactoe': 'Tic Tac Toe Pro',
        'memory': 'Memory Match',
        'snake': 'Snake Challenge',
        'game2048': '2048 Puzzle',
        'hangman': 'Hangman Classic',
        'wordguess': 'Word Guess',
        'iq': 'IQ Challenge'
    };
    document.getElementById('current-game-name').textContent = gameNames[gameName];
    
    // Update level indicator
    document.getElementById('current-level').textContent = GameState.currentLevel;
    
    // Update hint count
    document.getElementById('hint-count').textContent = GameState.hints;
    
    // Show/hide word list panel for WordVet
    const wordListPanel = document.getElementById('word-list-panel');
    if (gameName === 'wordvet') {
        wordListPanel.classList.remove('hidden');
    } else {
        wordListPanel.classList.add('hidden');
    }
    
    // Initialize the specific game
    const gameArea = document.getElementById('game-area');
    gameArea.innerHTML = '';

    const gameInitializers = {
        wordvet: () => WordVet.init(gameArea, GameState.currentLevel),
        sudoku: () => Sudoku.init(gameArea, GameState.currentLevel),
        tictactoe: () => TicTacToe.init(gameArea, GameState.currentLevel),
        memory: () => MemoryGame.init(gameArea, GameState.currentLevel),
        snake: () => SnakeGame.init(gameArea, GameState.currentLevel),
        game2048: () => Game2048.init(gameArea, GameState.currentLevel),
        hangman: () => Hangman.init(gameArea, GameState.currentLevel),
        wordguess: () => WordGuess.init(gameArea, GameState.currentLevel),
        iq: () => IQChallenge.init(gameArea, GameState.currentLevel)
    };

    const initGame = gameInitializers[gameName];
    if (!initGame) {
        gameArea.innerHTML = `<p style="text-align:center;color:var(--text-secondary);">This game is not available yet.</p>`;
        return;
    }

    try {
        initGame();
    } catch (error) {
        console.error(`Failed to initialize game "${gameName}"`, error);
        gameArea.innerHTML = `<p style="text-align:center;color:var(--danger);">Game failed to load. Please refresh and try again.</p>`;
        return;
    }
    
    // Start timer
    startTimer();
    
    // Update progress bar
    updateProgressBar();
}

// Timer Functions
function startTimer() {
    clearInterval(GameState.timerInterval);
    GameState.timerInterval = setInterval(() => {
        if (!GameState.isPaused) {
            GameState.timer++;
            updateTimerDisplay();
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(GameState.timerInterval);
}

function updateTimerDisplay() {
    const minutes = Math.floor(GameState.timer / 60).toString().padStart(2, '0');
    const seconds = (GameState.timer % 60).toString().padStart(2, '0');
    document.getElementById('game-timer').textContent = `${minutes}:${seconds}`;
}

function updateProgressBar() {
    const progress = ((GameState.currentLevel - 1) / 15) * 100;
    document.getElementById('level-progress').style.width = `${progress}%`;
}

// Pause Game
function togglePause() {
    GameState.isPaused = !GameState.isPaused;
    const pauseMenu = document.getElementById('pause-menu');
    const pauseBtn = document.getElementById('pause-btn');
    
    if (GameState.isPaused) {
        pauseMenu.classList.remove('hidden');
        pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    } else {
        pauseMenu.classList.add('hidden');
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }
}

// Use Hint
function useHint() {
    if (GameState.hints > 0) {
        GameState.hints--;
        document.getElementById('hint-count').textContent = GameState.hints;
        
        // Call game's hint function
        switch(GameState.currentGame) {
            case 'wordvet':
                WordVet.showHint();
                break;
            case 'sudoku':
                Sudoku.showHint();
                break;
            case 'tictactoe':
                TicTacToe.showHint();
                break;
            case 'memory':
                MemoryGame.showHint();
                break;
            case 'snake':
                SnakeGame.showHint();
                break;
            case 'game2048':
                Game2048.showHint();
                break;
            case 'hangman':
                Hangman.showHint();
                break;
            case 'wordguess':
                WordGuess.showHint();
                break;
            case 'iq':
                IQChallenge.showHint();
                break;
        }
    }
}

// Restart Level
function restartLevel() {
    stopTimer();
    GameState.timer = 0;
    GameState.score = 0;
    GameState.streak = 0;
    GameState.hints = 3;
    resetGameOverlays();

    document.getElementById('game-score').textContent = '0';
    document.getElementById('game-streak').textContent = '0';
    document.getElementById('hint-count').textContent = '3';
    
    startGame(GameState.currentGame);
}

// Exit Game
function exitGame() {
    stopTimer();
    cleanupGame(GameState.currentGame);
    resetGameOverlays();
    
    // Save progress
    if (GameState.score > 0) {
        GameState.totalScore += GameState.score;
        localStorage.setItem('totalScore', GameState.totalScore);
    }
    
    // Hide game container
    document.getElementById('game-container').classList.add('hidden');
    
    // Show games section
    showSection('games');
    
    // Update nav stats
    updateNavStats();
    
    // Clear game area
    document.getElementById('game-area').innerHTML = '';
    GameState.currentGame = null;
}

// Level Complete
function levelComplete(bonusScore = 0) {
    stopTimer();
    
    const levelScore = GameState.score + bonusScore;
    GameState.totalScore += levelScore;
    localStorage.setItem('totalScore', GameState.totalScore);
    
    // Save progress
    GameState.gameProgress[GameState.currentGame] = GameState.currentLevel + 1;
    localStorage.setItem('gameProgress', JSON.stringify(GameState.gameProgress));
    
    // Show modal
    const modal = document.getElementById('level-complete-modal');
    const titleEl = modal.querySelector('h2');
    const completeNote = modal.querySelector('.game-complete-note');
    if (titleEl) {
        titleEl.textContent = 'Level Complete!';
    }
    if (completeNote) {
        completeNote.remove();
    }
    document.getElementById('level-score').textContent = levelScore.toLocaleString();
    document.getElementById('level-time').textContent = document.getElementById('game-timer').textContent;
    document.getElementById('level-hints').textContent = 3 - GameState.hints;
    
    modal.classList.remove('hidden');
}

// Next Level
function nextLevel() {
    document.getElementById('level-complete-modal').classList.add('hidden');
    GameState.currentLevel++;
    
    if (GameState.currentLevel > 15) {
        // Game completed all levels
        showGameComplete();
    } else {
        startGame(GameState.currentGame);
    }
}

// Replay Level
function replayLevel() {
    document.getElementById('level-complete-modal').classList.add('hidden');
    restartLevel();
}

// Game Over
function gameOver(message = 'Better luck next time!') {
    stopTimer();
    
    const modal = document.getElementById('game-over-modal');
    document.getElementById('game-over-message').textContent = message;
    modal.classList.remove('hidden');
}

// Show Game Complete
function showGameComplete() {
    const modal = document.getElementById('level-complete-modal');
    const titleEl = modal.querySelector('h2');
    const statsEl = modal.querySelector('.level-stats');

    if (titleEl) {
        titleEl.textContent = 'Game Complete!';
    }

    let noteEl = modal.querySelector('.game-complete-note');
    if (!noteEl) {
        noteEl = document.createElement('p');
        noteEl.className = 'game-complete-note';
        if (statsEl) {
            statsEl.insertAdjacentElement('beforebegin', noteEl);
        } else {
            modal.querySelector('.modal-content').appendChild(noteEl);
        }
    }
    noteEl.textContent = "Congratulations! You've completed all 15 levels!";

    modal.classList.remove('hidden');
}

// Toggle Word List (for WordVet)
function toggleWordList() {
    const wordList = document.getElementById('word-list');
    const btn = document.querySelector('.btn-toggle i');
    
    if (wordList.classList.contains('hidden')) {
        wordList.classList.remove('hidden');
        btn.classList.remove('fa-eye');
        btn.classList.add('fa-eye-slash');
    } else {
        wordList.classList.add('hidden');
        btn.classList.remove('fa-eye-slash');
        btn.classList.add('fa-eye');
    }
}

// Update Game Score
function updateGameScore(points) {
    GameState.score += points;
    document.getElementById('game-score').textContent = GameState.score.toLocaleString();
}

// Update Streak
function updateStreak(increment = true) {
    if (increment) {
        GameState.streak++;
    } else {
        GameState.streak = 0;
    }
    
    if (GameState.streak > GameState.highestStreak) {
        GameState.highestStreak = GameState.streak;
        localStorage.setItem('highestStreak', GameState.highestStreak);
    }
    
    document.getElementById('game-streak').textContent = GameState.streak;
}

// Leaderboard Tabs
function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadLeaderboard(tab.dataset.tab);
        });
    });
}

// Load Leaderboard
function loadLeaderboard(game = 'all') {
    const tbody = document.getElementById('leaderboard-body');
    
    // Sample leaderboard data (in real app, fetch from server)
    const leaderboardData = [
        { rank: 1, name: 'Parth', score: 15000, level: 15, game: 'wordvet' },
        { rank: 2, name: 'Ava', score: 14200, level: 14, game: 'sudoku' },
        { rank: 3, name: 'Alex', score: 12500, level: 12, game: 'tictactoe' },
        { rank: 4, name: 'Sarah', score: 11000, level: 14, game: 'memory' },
        { rank: 5, name: 'Mike', score: 9500, level: 10, game: 'snake' },
        { rank: 6, name: 'Noah', score: 9000, level: 13, game: 'game2048' },
        { rank: 7, name: 'Liam', score: 8700, level: 11, game: 'hangman' },
        { rank: 8, name: 'Emma', score: 8200, level: 11, game: 'iq' },
        { rank: 9, name: 'Mia', score: 7900, level: 10, game: 'wordguess' },
        { rank: 10, name: 'John', score: 7800, level: 9, game: 'wordvet' },
        { rank: 11, name: 'Lisa', score: 6500, level: 8, game: 'tictactoe' },
        { rank: 12, name: 'David', score: 5400, level: 7, game: 'memory' }
    ];
    
    let filteredData = game === 'all' 
        ? leaderboardData 
        : leaderboardData.filter(d => d.game === game);

    if (filteredData.length === 0) {
        tbody.innerHTML = '<div class="table-row"><span class="player" style="grid-column: 1 / -1; justify-content: center;">No scores yet for this game.</span></div>';
        return;
    }
    
    tbody.innerHTML = filteredData.map(entry => `
        <div class="table-row">
            <span class="rank">#${entry.rank}</span>
            <span class="player">
                <div class="player-avatar">${entry.name[0]}</div>
                ${entry.name}
            </span>
            <span class="score">${entry.score.toLocaleString()}</span>
            <span class="level">${entry.level}</span>
        </div>
    `).join('');
}

// Utility Functions
function generateId() {
    return Math.random().toString(36).substring(2, 9);
}

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}
