/* ============================================
   SNAKE CHALLENGE GAME
   ============================================ */

const SnakeGame = {
    canvas: null,
    ctx: null,
    gridSize: 20,
    tileCount: { x: 20, y: 20 },
    snake: [],
    food: null,
    obstacles: [],
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    score: 0,
    gameLoop: null,
    gameSpeed: 150,
    level: 1,
    keydownHandler: null,
    touchStartHandler: null,
    touchEndHandler: null,
    touchStartX: 0,
    touchStartY: 0,
    
    init(container, level) {
        this.cleanup();
        this.level = level;
        this.setDifficulty(level);
        this.snake = [{ x: 5, y: 5 }];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.score = 0;
        this.obstacles = [];
        
        this.render(container);
        this.spawnFood();
        this.generateObstacles();
        this.startGame();
    },
    
    setDifficulty(level) {
        // Speed increases with level
        this.gameSpeed = Math.max(50, 150 - (level * 7));
        
        // Grid size
        if (level <= 5) {
            this.tileCount = { x: 15, y: 15 };
        } else if (level <= 10) {
            this.tileCount = { x: 20, y: 20 };
        } else {
            this.tileCount = { x: 25, y: 25 };
        }
    },
    
    render(container) {
        const canvasWidth = this.tileCount.x * this.gridSize;
        const canvasHeight = this.tileCount.y * this.gridSize;
        
        container.innerHTML = `
            <div class="snake-game">
                <canvas id="snake-canvas" class="snake-canvas" 
                        width="${canvasWidth}" height="${canvasHeight}"></canvas>
                <div class="snake-controls">
                    <span class="control-hint">
                        Use <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> or WASD to move
                    </span>
                </div>
            </div>
        `;
        
        this.canvas = document.getElementById('snake-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Keyboard controls
        if (!this.keydownHandler) {
            this.keydownHandler = (e) => this.handleKeyPress(e);
        }
        document.addEventListener('keydown', this.keydownHandler);

        // Touch controls for mobile
        this.touchStartHandler = (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        };

        this.touchEndHandler = (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const dx = touchEndX - this.touchStartX;
            const dy = touchEndY - this.touchStartY;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > 0 && this.direction.x === 0) this.nextDirection = { x: 1, y: 0 };
                else if (dx < 0 && this.direction.x === 0) this.nextDirection = { x: -1, y: 0 };
            } else {
                if (dy > 0 && this.direction.y === 0) this.nextDirection = { x: 0, y: 1 };
                else if (dy < 0 && this.direction.y === 0) this.nextDirection = { x: 0, y: -1 };
            }
        };

        this.canvas.addEventListener('touchstart', this.touchStartHandler, { passive: true });
        this.canvas.addEventListener('touchend', this.touchEndHandler, { passive: true });
    },
    
    generateObstacles() {
        this.obstacles = [];
        const obstacleCount = Math.floor(this.level / 3);
        
        for (let i = 0; i < obstacleCount; i++) {
            let pos;
            do {
                pos = {
                    x: Math.floor(Math.random() * this.tileCount.x),
                    y: Math.floor(Math.random() * this.tileCount.y)
                };
            } while (this.isSnakeAt(pos) || (this.food && this.food.x === pos.x && this.food.y === pos.y));
            
            this.obstacles.push(pos);
        }
    },
    
    spawnFood() {
        do {
            this.food = {
                x: Math.floor(Math.random() * this.tileCount.x),
                y: Math.floor(Math.random() * this.tileCount.y)
            };
        } while (this.isSnakeAt(this.food) || this.isObstacleAt(this.food));
    },
    
    isSnakeAt(pos) {
        return this.snake.some(segment => segment.x === pos.x && segment.y === pos.y);
    },
    
    isObstacleAt(pos) {
        return this.obstacles.some(obs => obs.x === pos.x && obs.y === pos.y);
    },
    
    handleKeyPress(e) {
        const key = e.key.toLowerCase();
        
        if ((key === 'arrowup' || key === 'w') && this.direction.y === 0) {
            this.nextDirection = { x: 0, y: -1 };
        } else if ((key === 'arrowdown' || key === 's') && this.direction.y === 0) {
            this.nextDirection = { x: 0, y: 1 };
        } else if ((key === 'arrowleft' || key === 'a') && this.direction.x === 0) {
            this.nextDirection = { x: -1, y: 0 };
        } else if ((key === 'arrowright' || key === 'd') && this.direction.x === 0) {
            this.nextDirection = { x: 1, y: 0 };
        }
    },
    
    startGame() {
        this.gameLoop = setInterval(() => this.update(), this.gameSpeed);
    },
    
    stopGame() {
        clearInterval(this.gameLoop);
        this.gameLoop = null;
    },
    
    update() {
        if (GameState.isPaused) return;
        
        this.direction = this.nextDirection;
        
        const head = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;
        
        // Check wall collision
        if (head.x < 0 || head.x >= this.tileCount.x || head.y < 0 || head.y >= this.tileCount.y) {
            this.gameOver();
            return;
        }
        
        // Check self collision
        if (this.isSnakeAt(head)) {
            this.gameOver();
            return;
        }
        
        // Check obstacle collision
        if (this.isObstacleAt(head)) {
            this.gameOver();
            return;
        }
        
        this.snake.unshift(head);
        
        // Check food
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            updateGameScore(10);
            updateStreak(true);
            this.spawnFood();
            
            // Check win condition (snake fills 70% of grid)
            if (this.snake.length >= this.tileCount.x * this.tileCount.y * 0.7) {
                this.stopGame();
                levelComplete(this.score);
            }
        } else {
            this.snake.pop();
        }
        
        this.draw();
    },
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.ctx.strokeStyle = '#2d2d4a';
        this.ctx.lineWidth = 0.5;
        for (let x = 0; x <= this.tileCount.x; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.gridSize, 0);
            this.ctx.lineTo(x * this.gridSize, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.tileCount.y; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.gridSize);
            this.ctx.lineTo(this.canvas.width, y * this.gridSize);
            this.ctx.stroke();
        }
        
        // Draw obstacles
        this.ctx.fillStyle = '#ef4444';
        this.obstacles.forEach(obs => {
            this.ctx.fillRect(
                obs.x * this.gridSize + 2,
                obs.y * this.gridSize + 2,
                this.gridSize - 4,
                this.gridSize - 4
            );
        });
        
        // Draw food
        this.ctx.fillStyle = '#f59e0b';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2 - 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Draw snake
        this.snake.forEach((segment, i) => {
            if (i === 0) {
                // Head
                this.ctx.fillStyle = '#10b981';
            } else {
                // Body - gradient
                const ratio = i / this.snake.length;
                this.ctx.fillStyle = `hsl(150, 70%, ${40 + ratio * 20}%)`;
            }
            
            this.ctx.fillRect(
                segment.x * this.gridSize + 1,
                segment.y * this.gridSize + 1,
                this.gridSize - 2,
                this.gridSize - 2
            );
        });
    },
    
    gameOver() {
        this.stopGame();
        gameOver('You crashed! Try again.');
    },
    
    showHint() {
        // Show direction to food
        if (!this.food || this.snake.length === 0) return;
        
        const head = this.snake[0];
        const dx = this.food.x - head.x;
        const dy = this.food.y - head.y;
        
        let hint = '';
        if (Math.abs(dx) > Math.abs(dy)) {
            hint = dx > 0 ? '→' : '←';
        } else {
            hint = dy > 0 ? '↓' : '↑';
        }
        
        // Show hint on canvas
        this.ctx.fillStyle = 'rgba(245, 158, 11, 0.8)';
        this.ctx.font = 'bold 40px Poppins';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(hint, this.canvas.width / 2, this.canvas.height / 2);
        
        setTimeout(() => this.draw(), 1500);
    },

    cleanup() {
        this.stopGame();

        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler);
        }

        if (this.canvas && this.touchStartHandler) {
            this.canvas.removeEventListener('touchstart', this.touchStartHandler);
        }
        if (this.canvas && this.touchEndHandler) {
            this.canvas.removeEventListener('touchend', this.touchEndHandler);
        }

        this.touchStartHandler = null;
        this.touchEndHandler = null;
    }
};
