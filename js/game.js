// Game class
class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Set canvas dimensions
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Game state
        this.gameOver = false;
        this.paused = false;
        
        // World properties
        this.worldSize = 2000;
        
        // Game level
        this.currentLevel = 1;
        this.maxLevel = 5;
        this.scoreThresholds = [
            0,      // Level 1
            1000,   // Level 2
            3000,   // Level 3
            7000,   // Level 4
            15000   // Level 5
        ];
        
        // Entities
        this.player = new Player(this.worldSize / 2, this.worldSize / 2);
        this.shapes = [];
        this.bullets = [];
        this.enemies = [];
        
        // Camera
        this.camera = {
            x: this.player.x - this.canvas.width / 2,
            y: this.player.y - this.canvas.height / 2
        };
        
        // Background grid
        this.gridSize = 40;
        
        // Shape spawn settings
        this.maxShapes = 100;
        this.shapeSpawnRate = 0.01; // Chance to spawn a shape each frame
        
        // Enemy spawn settings
        this.maxEnemies = 10;
        this.enemySpawnRate = 0.002; // Chance to spawn an enemy each frame
        this.enemySpawnDistance = 800; // Minimum distance from player to spawn
        
        // Upgrade system
        this.showingUpgradeMenu = false;
        this.availableUpgrades = [];
        this.upgradePoints = 0;
        
        // Setup input handlers
        this.setupEventListeners();
        
        // Initialize entities
        this.initShapes();
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    setupEventListeners() {
        // Keyboard input
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Mouse input
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mousedown', () => this.player.shooting = true);
        this.canvas.addEventListener('mouseup', () => this.player.shooting = false);
        
        // Touch input for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.player.shooting = true;
            this.handleTouchMove(e);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleTouchMove(e);
        });
        
        this.canvas.addEventListener('touchend', () => {
            this.player.shooting = false;
        });
    }
    
    handleKeyDown(e) {
        switch(e.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                this.player.movement.up = true;
                break;
            case 's':
            case 'arrowdown':
                this.player.movement.down = true;
                break;
            case 'a':
            case 'arrowleft':
                this.player.movement.left = true;
                break;
            case 'd':
            case 'arrowright':
                this.player.movement.right = true;
                break;
            case ' ':
                this.player.shooting = true;
                break;
            case 'e':
            case 'q':
                // Activate special ability
                this.player.activateSpecial(this.bullets);
                break;
        }
    }
    
    handleKeyUp(e) {
        switch(e.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                this.player.movement.up = false;
                break;
            case 's':
            case 'arrowdown':
                this.player.movement.down = false;
                break;
            case 'a':
            case 'arrowleft':
                this.player.movement.left = false;
                break;
            case 'd':
            case 'arrowright':
                this.player.movement.right = false;
                break;
            case ' ':
                this.player.shooting = false;
                break;
            case 'p':
                this.paused = !this.paused;
                break;
        }
    }
    
    handleMouseMove(e) {
        this.player.mouseX = e.clientX;
        this.player.mouseY = e.clientY;
    }
    
    handleTouchMove(e) {
        if (e.touches.length > 0) {
            this.player.mouseX = e.touches[0].clientX;
            this.player.mouseY = e.touches[0].clientY;
        }
    }
    
    initShapes() {
        // Create initial shapes
        for (let i = 0; i < this.maxShapes / 2; i++) {
            this.spawnRandomShape();
        }
        
        // Create initial enemies based on level
        this.spawnInitialEnemies();
    }
    
    spawnInitialEnemies() {
        // Spawn enemies based on current level
        const enemiesToSpawn = Math.min(this.currentLevel + 1, this.maxEnemies / 2);
        
        for (let i = 0; i < enemiesToSpawn; i++) {
            this.spawnEnemy();
        }
    }
    
    spawnEnemy() {
        if (this.enemies.length >= this.maxEnemies) return;
        
        const buffer = 50;
        let x, y;
        let distanceToPlayer;
        
        // Keep trying until we find a valid spawn position
        do {
            x = Utils.random(buffer, this.worldSize - buffer);
            y = Utils.random(buffer, this.worldSize - buffer);
            distanceToPlayer = Utils.distance(x, y, this.player.x, this.player.y);
        } while (distanceToPlayer < this.enemySpawnDistance);
        
        // Determine enemy tier based on level with some randomness
        let tier;
        const rnd = Math.random();
        
        if (this.currentLevel <= 2) {
            tier = 1;
        } else if (this.currentLevel <= 4) {
            tier = rnd < 0.7 ? 1 : 2;
        } else {
            tier = rnd < 0.5 ? 1 : (rnd < 0.8 ? 2 : 3);
        }
        
        this.enemies.push(new Enemy(x, y, tier));
    }
    
    spawnRandomShape() {
        if (this.shapes.length >= this.maxShapes) return;
        
        const buffer = 50; // Buffer from the edge
        const x = Utils.random(buffer, this.worldSize - buffer);
        const y = Utils.random(buffer, this.worldSize - buffer);
        
        // Don't spawn too close to player
        if (Utils.distance(x, y, this.player.x, this.player.y) < 200) {
            return;
        }
        
        // Random shape type
        const types = ['square', 'triangle', 'pentagon'];
        const typeWeights = [70, 25, 5]; // Probability weights
        
        let rand = Math.random() * 100;
        let typeIndex = 0;
        
        for (let i = 0; i < typeWeights.length; i++) {
            if (rand <= typeWeights[i]) {
                typeIndex = i;
                break;
            }
            rand -= typeWeights[i];
        }
        
        this.shapes.push(new Shape(x, y, types[typeIndex]));
    }
    
    update() {
        if (this.paused || this.gameOver || this.showingUpgradeMenu) return;
        
        // Update camera to follow player - moved to top to ensure it updates first
        this.camera.x = this.player.x - this.canvas.width / 2;
        this.camera.y = this.player.y - this.canvas.height / 2;
        
        // Update player
        this.player.update(this.canvas.width, this.canvas.height, this.camera);
        this.player.shoot(this.bullets);
        
        // Update enemies
        this.enemies.forEach(enemy => {
            enemy.update(this.player, this.worldSize, this.bullets);
        });
        
        // Spawn new shapes
        if (Math.random() < this.shapeSpawnRate && this.shapes.length < this.maxShapes) {
            this.spawnRandomShape();
        }
        
        // Spawn new enemies
        if (Math.random() < this.enemySpawnRate && this.enemies.length < this.maxEnemies) {
            this.spawnEnemy();
        }
        
        // Update bullets
        this.bullets = this.bullets.filter(bullet => !bullet.markedForDeletion);
        this.bullets.forEach(bullet => {
            bullet.update();
            
            // Check if bullet is out of bounds
            if (
                bullet.x < 0 || bullet.x > this.worldSize ||
                bullet.y < 0 || bullet.y > this.worldSize
            ) {
                bullet.markedForDeletion = true;
                return;
            }
            
            // Check collision with shapes
            this.shapes.forEach(shape => {
                if (!bullet.hasHit(shape) && Utils.circleCollision(bullet.x, bullet.y, bullet.radius, shape.x, shape.y, shape.radius)) {
                    const points = shape.takeDamage(bullet.damage);
                    
                    if (points > 0 && bullet.fromPlayer) {
                        this.player.addScore(points);
                    }
                    
                    bullet.registerHit(shape);
                }
            });
            
            // Check collision with enemies (only player bullets hit enemies)
            if (bullet.fromPlayer) {
                this.enemies.forEach(enemy => {
                    if (!bullet.hasHit(enemy) && Utils.circleCollision(bullet.x, bullet.y, bullet.radius, enemy.x, enemy.y, enemy.radius)) {
                        const points = enemy.takeDamage(bullet.damage);
                        
                        if (points > 0) {
                            this.player.addScore(points);
                            this.upgradePoints++;
                        }
                        
                        bullet.registerHit(enemy);
                    }
                });
            }
            
            // Check collision with player (only enemy bullets hit player)
            if (!bullet.fromPlayer && !this.player.markedForDeletion) {
                if (Utils.circleCollision(bullet.x, bullet.y, bullet.radius, this.player.x, this.player.y, this.player.radius)) {
                    if (this.player.takeDamage(bullet.damage)) {
                        this.gameOver = true;
                    }
                    bullet.markedForDeletion = true;
                }
            }
        });
        
        // Update shapes
        this.shapes = this.shapes.filter(shape => !shape.markedForDeletion);
        
        // Update enemies
        this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);
        
        // Check level progress based on score instead of kills
        this.checkLevelProgress();
    }
    
    checkLevelProgress() {
        // Check if player score has reached the next level threshold
        if (this.currentLevel < this.maxLevel && 
            this.player.score >= this.scoreThresholds[this.currentLevel]) {
            this.levelUp();
        }
        
        // Update score display
        document.getElementById('upgrade-points').textContent = `Upgrade Points: ${this.upgradePoints}`;
    }
    
    levelUp() {
        this.currentLevel++;
        
        // Show upgrade menu
        this.showUpgradeMenu();
        
        // Update level display
        document.getElementById('game-level').textContent = `Game Level: ${this.currentLevel}`;
    }
    
    showUpgradeMenu() {
        this.showingUpgradeMenu = true;
        this.paused = true;
        
        // Create upgrade menu
        const upgradeMenu = document.createElement('div');
        upgradeMenu.id = 'upgrade-menu';
        
        // Show class selection if player hasn't chosen a class and is level 10+
        if (!this.player.hasChosenClass && this.player.level >= 10) {
            this.showClassSelection(upgradeMenu);
        } else {
            // Generate regular upgrades
            this.generateUpgrades();
            
            upgradeMenu.innerHTML = `
                <div class="upgrade-header">
                    <h2>Level Up! Choose an Upgrade</h2>
                    <p>Game Level: ${this.currentLevel}</p>
                    <p>Available Points: ${this.upgradePoints}</p>
                    ${this.player.specialAbility ? `<p>Special Ability: ${this.player.specialAbility} (Press E or Q)</p>` : ''}
                </div>
                <div class="upgrade-options">
                    ${this.availableUpgrades.map((upgrade, index) => `
                        <div class="upgrade-option" data-index="${index}">
                            <h3>${upgrade.name}</h3>
                            <p>${upgrade.description}</p>
                            <button class="upgrade-btn" data-index="${index}">Select</button>
                        </div>
                    `).join('')}
                </div>
            `;
            
            // Add button event listeners
            setTimeout(() => {
                const buttons = upgradeMenu.querySelectorAll('.upgrade-btn');
                buttons.forEach(button => {
                    button.addEventListener('click', (e) => {
                        const index = e.target.dataset.index;
                        this.applyUpgrade(index);
                        document.body.removeChild(upgradeMenu);
                        this.showingUpgradeMenu = false;
                        this.paused = false;
                    });
                });
            }, 10);
        }
        
        // Style the menu
        this.styleUpgradeMenu(upgradeMenu);
        
        // Add to document
        document.body.appendChild(upgradeMenu);
    }
    
    showClassSelection(upgradeMenu) {
        upgradeMenu.innerHTML = `
            <div class="upgrade-header">
                <h2>Choose Your Tank Class</h2>
                <p>Select a specialization for your tank</p>
            </div>
            <div class="class-options">
                <div class="class-option" data-class="twin">
                    <h3>Twin Tank</h3>
                    <p>Fires two bullets at once with slightly reduced damage.</p>
                    <p><strong>Special:</strong> 360° bullet spray</p>
                    <button class="class-btn" data-class="twin">Select</button>
                </div>
                <div class="class-option" data-class="sniper">
                    <h3>Sniper Tank</h3>
                    <p>Long-range precision with increased damage but slower fire rate.</p>
                    <p><strong>Special:</strong> Piercing shot</p>
                    <button class="class-btn" data-class="sniper">Select</button>
                </div>
                <div class="class-option" data-class="machine">
                    <h3>Machine Gun Tank</h3>
                    <p>Rapid fire with reduced accuracy and damage.</p>
                    <p><strong>Special:</strong> Rapid fire barrage</p>
                    <button class="class-btn" data-class="machine">Select</button>
                </div>
                <div class="class-option" data-class="destroyer">
                    <h3>Destroyer Tank</h3>
                    <p>Slow-firing but extremely powerful bullets.</p>
                    <p><strong>Special:</strong> Explosive shockwave</p>
                    <button class="class-btn" data-class="destroyer">Select</button>
                </div>
            </div>
        `;
        
        // Add special styling for class options
        setTimeout(() => {
            const classOptions = upgradeMenu.querySelectorAll('.class-option');
            classOptions.forEach(option => {
                option.style.background = 'rgba(255, 255, 255, 0.1)';
                option.style.padding = '15px';
                option.style.marginBottom = '15px';
                option.style.borderRadius = '5px';
                option.style.cursor = 'pointer';
            });
            
            const buttons = upgradeMenu.querySelectorAll('.class-btn');
            buttons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const className = e.target.dataset.class;
                    this.player.setTankClass(className);
                    document.body.removeChild(upgradeMenu);
                    this.showingUpgradeMenu = false;
                    this.paused = false;
                });
            });
        }, 10);
    }
    
    styleUpgradeMenu(upgradeMenu) {
        upgradeMenu.style.position = 'absolute';
        upgradeMenu.style.top = '50%';
        upgradeMenu.style.left = '50%';
        upgradeMenu.style.transform = 'translate(-50%, -50%)';
        upgradeMenu.style.background = 'rgba(0, 0, 0, 0.9)';
        upgradeMenu.style.color = 'white';
        upgradeMenu.style.padding = '20px';
        upgradeMenu.style.borderRadius = '10px';
        upgradeMenu.style.zIndex = '100';
        upgradeMenu.style.width = '80%';
        upgradeMenu.style.maxWidth = '600px';
        
        // Style the header
        const header = upgradeMenu.querySelector('.upgrade-header');
        if (header) {
            header.style.textAlign = 'center';
            header.style.marginBottom = '20px';
        }
        
        // Style the options
        const options = upgradeMenu.querySelectorAll('.upgrade-option');
        options.forEach(option => {
            option.style.background = 'rgba(255, 255, 255, 0.1)';
            option.style.padding = '15px';
            option.style.marginBottom = '10px';
            option.style.borderRadius = '5px';
            option.style.cursor = 'pointer';
        });
        
        // Style buttons
        const buttons = upgradeMenu.querySelectorAll('.upgrade-btn, .class-btn');
        buttons.forEach(button => {
            button.style.padding = '8px 16px';
            button.style.background = '#00B2E1';
            button.style.color = 'white';
            button.style.border = 'none';
            button.style.borderRadius = '5px';
            button.style.cursor = 'pointer';
            button.style.marginTop = '10px';
        });
    }
    
    generateUpgrades() {
        // Enhanced pool of possible upgrades
        const upgradePool = [
            {
                name: "Increased Health",
                description: "Increase max health by 25",
                apply: () => {
                    this.player.maxHealth += 25;
                    this.player.health += 25;
                }
            },
            {
                name: "Faster Movement",
                description: "Increase movement speed by 15%",
                apply: () => {
                    this.player.speed *= 1.15;
                }
            },
            {
                name: "Higher Damage",
                description: "Increase bullet damage by 3",
                apply: () => {
                    this.player.bulletDamage += 3;
                }
            },
            {
                name: "Rapid Fire",
                description: "Decrease shooting cooldown by 15%",
                apply: () => {
                    this.player.shootingRate = Math.max(5, Math.floor(this.player.shootingRate * 0.85));
                }
            },
            {
                name: "Bullet Speed",
                description: "Increase bullet speed by 20%",
                apply: () => {
                    this.player.bulletSpeed *= 1.2;
                }
            },
            {
                name: "Tank Size",
                description: "Increase tank size by 10%",
                apply: () => {
                    this.player.radius *= 1.1;
                }
            },
            {
                name: "Bullet Size",
                description: "Increase bullet size by 20%",
                apply: () => {
                    // Affects the visual and collision size of bullets
                    // Implemented when bullets are created
                }
            },
            {
                name: "Special Cooldown",
                description: "Reduce special ability cooldown by 20%",
                apply: () => {
                    this.player.specialMaxCooldown *= 0.8;
                }
            }
        ];
        
        // Add class-specific upgrades if player has chosen a class
        if (this.player.hasChosenClass) {
            switch(this.player.tankClass) {
                case "twin":
                    upgradePool.push({
                        name: "Triple Shot",
                        description: "Add a third barrel to your twin tank",
                        apply: () => {
                            // This would need special handling in the twin tank shooting method
                        }
                    });
                    break;
                case "sniper":
                    upgradePool.push({
                        name: "Extended Range",
                        description: "Increase bullet lifetime by 50%",
                        apply: () => {
                            // This would be applied when bullets are created
                        }
                    });
                    break;
                case "machine":
                    upgradePool.push({
                        name: "Spreadshot",
                        description: "Increase bullet spread for wider coverage",
                        apply: () => {
                            // This would be applied in the machine gun shooting method
                        }
                    });
                    break;
                case "destroyer":
                    upgradePool.push({
                        name: "Explosive Rounds",
                        description: "Bullets explode on impact",
                        apply: () => {
                            // This would require special handling in the bullet collision code
                        }
                    });
                    break;
            }
        }
        
        // Select 3 random upgrades from the pool
        this.availableUpgrades = [];
        const poolCopy = [...upgradePool];
        
        while (this.availableUpgrades.length < 3 && poolCopy.length > 0) {
            const index = Math.floor(Math.random() * poolCopy.length);
            this.availableUpgrades.push(poolCopy[index]);
            poolCopy.splice(index, 1);
        }
    }
    
    applyUpgrade(index) {
        if (this.upgradePoints > 0 && index >= 0 && index < this.availableUpgrades.length) {
            const upgrade = this.availableUpgrades[index];
            upgrade.apply();
            this.upgradePoints--;
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background grid
        this.drawGrid();
        
        // Draw world border
        this.drawWorldBorder();
        
        // Draw shapes
        this.shapes.forEach(shape => {
            // Only draw shapes that are visible on screen
            if (this.isOnScreen(shape)) {
                shape.draw(this.ctx, this.camera);
            }
        });
        
        // Draw enemies
        this.enemies.forEach(enemy => {
            if (this.isOnScreen(enemy)) {
                enemy.draw(this.ctx, this.camera);
            }
        });
        
        // Draw bullets
        this.bullets.forEach(bullet => {
            if (this.isOnScreen(bullet)) {
                bullet.draw(this.ctx, this.camera);
            }
        });
        
        // Draw player
        this.player.draw(this.ctx, this.camera);
        
        // Draw game level info
        this.drawLevelInfo();
        
        // Draw game over screen
        if (this.gameOver) {
            this.drawGameOver();
        }
    }
    
    drawGrid() {
        const startX = this.gridSize - (this.camera.x % this.gridSize);
        const startY = this.gridSize - (this.camera.y % this.gridSize);
        
        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 0.5;
        
        // Draw vertical lines
        for (let x = startX; x < this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = startY; y < this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    drawWorldBorder() {
        this.ctx.strokeStyle = '#FF0000';
        this.ctx.lineWidth = 3;
        
        // Draw border rectangle
        this.ctx.strokeRect(
            -this.camera.x,
            -this.camera.y,
            this.worldSize,
            this.worldSize
        );
    }
    
    drawLevelInfo() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(10, 70, 200, 40);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Game Level: ${this.currentLevel}`, 20, 90);
        
        // Show progress to next level if not at max level
        if (this.currentLevel < this.maxLevel) {
            const nextLevelScore = this.scoreThresholds[this.currentLevel];
            const progress = Math.floor((this.player.score / nextLevelScore) * 100);
            this.ctx.fillText(`Progress: ${progress}%`, 20, 110);
        } else {
            this.ctx.fillText(`Max Level Reached!`, 20, 110);
        }
    }
    
    drawGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '40px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over', this.canvas.width / 2, this.canvas.height / 2 - 40);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Score: ${this.player.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
        this.ctx.fillText('Click to Restart', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
    
    isOnScreen(entity) {
        const buffer = 100; // Increased buffer for smoother rendering
        const entityX = entity.x - this.camera.x;
        const entityY = entity.y - this.camera.y;
        
        return (
            entityX + buffer > 0 &&
            entityX - buffer < this.canvas.width &&
            entityY + buffer > 0 &&
            entityY - buffer < this.canvas.height
        );
    }
    
    restart() {
        // Reset game state
        this.gameOver = false;
        this.paused = false;
        this.showingUpgradeMenu = false;
        
        // Reset level
        this.currentLevel = 1;
        this.upgradePoints = 0;
        
        // Reset entities
        this.player = new Player(this.worldSize / 2, this.worldSize / 2);
        this.shapes = [];
        this.bullets = [];
        this.enemies = [];
        
        // Reset camera
        this.camera = {
            x: this.player.x - this.canvas.width / 2,
            y: this.player.y - this.canvas.height / 2
        };
        
        // Reset UI
        document.getElementById('score').textContent = 'Score: 0';
        document.getElementById('level').textContent = 'Level: 1';
        if (document.getElementById('game-level')) {
            document.getElementById('game-level').textContent = 'Game Level: 1';
        }
        
        // Initialize shapes and enemies
        this.initShapes();
    }
    
    gameLoop() {
        this.update();
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    start() {
        this.gameLoop();
    }
} 