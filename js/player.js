// Player class (tank)
class Player extends Entity {
    constructor(x, y) {
        super(x, y, 15, '#00B2E1');
        
        // Basic stats
        this.speed = 3;
        this.rotationSpeed = 0.05;
        this.angle = 0;
        this.health = 100;
        this.maxHealth = 100;
        this.score = 0;
        this.level = 1;
        this.experience = 0;
        this.experienceToNextLevel = 100;
        
        // Movement
        this.movement = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        
        // Shooting
        this.shooting = false;
        this.shootingCooldown = 0;
        this.shootingRate = 20; // Lower is faster
        this.bulletSpeed = 7;
        this.bulletDamage = 5;
        
        // Mouse position
        this.mouseX = 0;
        this.mouseY = 0;
        
        // Tank class
        this.tankClass = "basic"; // Default class
        this.availableClasses = ["twin", "sniper", "machine", "destroyer"];
        this.hasChosenClass = false;
        
        // Special abilities
        this.specialAbility = null;
        this.specialCooldown = 0;
        this.specialMaxCooldown = 300; // 5 seconds at 60fps
        this.usingSpecial = false;
    }
    
    update(canvasWidth, canvasHeight, camera) {
        // Handle movement
        let dx = 0;
        let dy = 0;
        
        if (this.movement.up) dy -= this.speed;
        if (this.movement.down) dy += this.speed;
        if (this.movement.left) dx -= this.speed;
        if (this.movement.right) dx += this.speed;
        
        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            const factor = this.speed / Math.sqrt(dx * dx + dy * dy);
            dx *= factor;
            dy *= factor;
        }
        
        // Update position
        this.x += dx;
        this.y += dy;
        
        // Restrict to game bounds (world size)
        const worldSize = 2000;
        this.x = Utils.clamp(this.x, this.radius, worldSize - this.radius);
        this.y = Utils.clamp(this.y, this.radius, worldSize - this.radius);
        
        // Calculate angle to mouse
        const mouseWorldX = this.mouseX + camera.x;
        const mouseWorldY = this.mouseY + camera.y;
        this.angle = Math.atan2(mouseWorldY - this.y, mouseWorldX - this.x);
        
        // Handle shooting cooldown
        if (this.shootingCooldown > 0) {
            this.shootingCooldown--;
        }
        
        // Handle special ability cooldown
        if (this.specialCooldown > 0) {
            this.specialCooldown--;
        }
    }
    
    shoot(bullets) {
        if (this.shootingCooldown <= 0 && this.shooting) {
            switch(this.tankClass) {
                case "twin":
                    this.shootTwin(bullets);
                    break;
                case "sniper":
                    this.shootSniper(bullets);
                    break;
                case "machine":
                    this.shootMachine(bullets);
                    break;
                case "destroyer":
                    this.shootDestroyer(bullets);
                    break;
                default:
                    this.shootBasic(bullets);
                    break;
            }
            
            // Reset cooldown
            this.shootingCooldown = this.shootingRate;
        }
    }
    
    shootBasic(bullets) {
        // Calculate barrel end position accurately
        const barrelLength = this.radius + 15;
        const bulletX = this.x + Math.cos(this.angle) * barrelLength;
        const bulletY = this.y + Math.sin(this.angle) * barrelLength;
        
        bullets.push(new Bullet(
            bulletX,
            bulletY,
            this.angle,
            this.bulletSpeed,
            this.bulletDamage,
            this.color,
            true
        ));
    }
    
    shootTwin(bullets) {
        // Twin barrel - two bullets side by side
        const barrelLength = this.radius + 15;
        const spread = 8; // Distance between barrels
        
        // Calculate perpendicular vector to angle
        const perpX = Math.sin(this.angle);
        const perpY = -Math.cos(this.angle);
        
        // Spawn two bullets offset perpendicular to firing angle
        for (let i = -1; i <= 1; i += 2) {
            const bulletX = this.x + Math.cos(this.angle) * barrelLength + perpX * spread * i / 2;
            const bulletY = this.y + Math.sin(this.angle) * barrelLength + perpY * spread * i / 2;
            
            bullets.push(new Bullet(
                bulletX,
                bulletY,
                this.angle,
                this.bulletSpeed,
                this.bulletDamage,
                this.color,
                true
            ));
        }
    }
    
    shootSniper(bullets) {
        // Sniper - single high-velocity, high-damage bullet
        const barrelLength = this.radius + 25; // Longer barrel
        const bulletX = this.x + Math.cos(this.angle) * barrelLength;
        const bulletY = this.y + Math.sin(this.angle) * barrelLength;
        
        bullets.push(new Bullet(
            bulletX,
            bulletY,
            this.angle,
            this.bulletSpeed * 1.5, // Faster bullet
            this.bulletDamage * 2,  // More damage
            this.color,
            true
        ));
    }
    
    shootMachine(bullets) {
        // Machine gun - rapid fire with spread
        const barrelLength = this.radius + 15;
        const spread = 0.15; // Random spread
        
        // Add randomness to angle
        const randomAngle = this.angle + (Math.random() - 0.5) * spread;
        
        const bulletX = this.x + Math.cos(randomAngle) * barrelLength;
        const bulletY = this.y + Math.sin(randomAngle) * barrelLength;
        
        bullets.push(new Bullet(
            bulletX,
            bulletY,
            randomAngle,
            this.bulletSpeed * 0.9, // Slightly slower
            this.bulletDamage * 0.7, // Less damage
            this.color,
            true
        ));
    }
    
    shootDestroyer(bullets) {
        // Destroyer - large, powerful bullet
        const barrelLength = this.radius + 15;
        const bulletX = this.x + Math.cos(this.angle) * barrelLength;
        const bulletY = this.y + Math.sin(this.angle) * barrelLength;
        
        // Create large bullet
        const largeBullet = new Bullet(
            bulletX,
            bulletY,
            this.angle,
            this.bulletSpeed * 0.7, // Slower
            this.bulletDamage * 3,  // Much more damage
            this.color,
            true
        );
        
        // Make the bullet larger
        largeBullet.radius = 10;
        
        bullets.push(largeBullet);
    }
    
    activateSpecial(bullets) {
        if (this.specialCooldown <= 0 && this.specialAbility) {
            switch(this.tankClass) {
                case "twin":
                    this.specialTwinBlast(bullets);
                    break;
                case "sniper":
                    this.specialSniperPierce(bullets);
                    break;
                case "machine":
                    this.specialMachineBarrage(bullets);
                    break;
                case "destroyer":
                    this.specialDestroyerShockwave(bullets);
                    break;
                default:
                    // Basic tank has no special
                    return;
            }
            
            // Reset special cooldown
            this.specialCooldown = this.specialMaxCooldown;
        }
    }
    
    specialTwinBlast(bullets) {
        // 360-degree blast of bullets
        const bulletCount = 16;
        
        for (let i = 0; i < bulletCount; i++) {
            const angle = (Math.PI * 2) * (i / bulletCount);
            const bulletX = this.x + Math.cos(angle) * (this.radius + 15);
            const bulletY = this.y + Math.sin(angle) * (this.radius + 15);
            
            bullets.push(new Bullet(
                bulletX,
                bulletY,
                angle,
                this.bulletSpeed * 1.2,
                this.bulletDamage,
                this.color,
                true
            ));
        }
    }
    
    specialSniperPierce(bullets) {
        // Super piercing shot that goes through enemies
        const barrelLength = this.radius + 25;
        const bulletX = this.x + Math.cos(this.angle) * barrelLength;
        const bulletY = this.y + Math.sin(this.angle) * barrelLength;
        
        const piercingBullet = new Bullet(
            bulletX,
            bulletY,
            this.angle,
            this.bulletSpeed * 2,
            this.bulletDamage * 5,
            '#00FFFF', // Special color
            true
        );
        
        piercingBullet.piercing = true; // Special property for collision detection
        
        bullets.push(piercingBullet);
    }
    
    specialMachineBarrage(bullets) {
        // Temporary rate of fire increase
        this.usingSpecial = true;
        const oldRate = this.shootingRate;
        this.shootingRate = 3;
        
        // Reset after 3 seconds
        setTimeout(() => {
            this.shootingRate = oldRate;
            this.usingSpecial = false;
        }, 3000);
    }
    
    specialDestroyerShockwave(bullets) {
        // Massive explosion
        const bulletCount = 24;
        
        for (let i = 0; i < bulletCount; i++) {
            const angle = (Math.PI * 2) * (i / bulletCount);
            const bulletX = this.x + Math.cos(angle) * (this.radius + 15);
            const bulletY = this.y + Math.sin(angle) * (this.radius + 15);
            
            const shockBullet = new Bullet(
                bulletX,
                bulletY,
                angle,
                this.bulletSpeed * 1.2,
                this.bulletDamage * 2,
                '#FF7700', // Special color
                true
            );
            
            shockBullet.radius = 8;
            
            bullets.push(shockBullet);
        }
    }
    
    setTankClass(className) {
        this.tankClass = className;
        this.hasChosenClass = true;
        
        // Adjust stats based on class
        switch(className) {
            case "twin":
                this.shootingRate = 15; // Faster firing
                this.bulletDamage *= 0.8; // Reduced damage
                this.specialAbility = "Twin Blast";
                break;
                
            case "sniper":
                this.shootingRate = 50; // Slower firing
                this.bulletSpeed *= 1.5; // Faster bullets
                this.bulletDamage *= 1.5; // More damage
                this.specialAbility = "Piercing Shot";
                break;
                
            case "machine":
                this.shootingRate = 7; // Very fast firing
                this.bulletDamage *= 0.6; // Much less damage
                this.bulletSpeed *= 0.8; // Slower bullets
                this.specialAbility = "Bullet Barrage";
                break;
                
            case "destroyer":
                this.shootingRate = 60; // Very slow firing
                this.bulletDamage *= 2.5; // High damage
                this.bulletSpeed *= 0.7; // Slow bullets
                this.specialAbility = "Shockwave";
                break;
        }
    }
    
    draw(ctx, camera) {
        // Draw tank body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x - camera.x, this.y - camera.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw tank based on class
        if (this.tankClass === "twin") {
            this.drawTwinTank(ctx, camera);
        } else if (this.tankClass === "sniper") {
            this.drawSniperTank(ctx, camera);
        } else if (this.tankClass === "machine") {
            this.drawMachineTank(ctx, camera);
        } else if (this.tankClass === "destroyer") {
            this.drawDestroyerTank(ctx, camera);
        } else {
            // Draw basic tank barrel
            this.drawBasicTank(ctx, camera);
        }
        
        // Draw special ability cooldown indicator if has special
        if (this.specialAbility) {
            this.drawSpecialCooldown(ctx, camera);
        }
        
        // Draw health bar
        this.drawHealthBar(ctx, camera);
    }
    
    drawBasicTank(ctx, camera) {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.rotate(this.angle);
        
        const barrelLength = this.radius + 15;
        ctx.fillStyle = '#666';
        ctx.fillRect(0, -3, barrelLength, 6);
        
        ctx.restore();
    }
    
    drawTwinTank(ctx, camera) {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.rotate(this.angle);
        
        const barrelLength = this.radius + 15;
        ctx.fillStyle = '#666';
        
        // Draw two barrels
        ctx.fillRect(0, -6, barrelLength, 4);
        ctx.fillRect(0, 2, barrelLength, 4);
        
        ctx.restore();
    }
    
    drawSniperTank(ctx, camera) {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.rotate(this.angle);
        
        const barrelLength = this.radius + 25; // Longer barrel
        ctx.fillStyle = '#666';
        ctx.fillRect(0, -2, barrelLength, 4); // Thinner barrel
        
        ctx.restore();
    }
    
    drawMachineTank(ctx, camera) {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.rotate(this.angle);
        
        const barrelLength = this.radius + 15;
        ctx.fillStyle = '#666';
        
        // Trapezoidal barrel
        ctx.beginPath();
        ctx.moveTo(0, -3);
        ctx.lineTo(barrelLength, -6);
        ctx.lineTo(barrelLength, 6);
        ctx.lineTo(0, 3);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    drawDestroyerTank(ctx, camera) {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.rotate(this.angle);
        
        const barrelLength = this.radius + 15;
        ctx.fillStyle = '#666';
        ctx.fillRect(0, -6, barrelLength, 12); // Wide barrel
        
        ctx.restore();
    }
    
    drawSpecialCooldown(ctx, camera) {
        const x = this.x - camera.x;
        const y = this.y - camera.y - this.radius - 20;
        const width = this.radius * 2;
        const height = 3;
        
        // Background
        ctx.fillStyle = '#333';
        ctx.fillRect(x - width/2, y, width, height);
        
        // Cooldown indicator
        if (this.specialCooldown > 0) {
            const cooldownPercent = 1 - (this.specialCooldown / this.specialMaxCooldown);
            ctx.fillStyle = this.usingSpecial ? '#FFFF00' : '#00FFFF';
            ctx.fillRect(x - width/2, y, width * cooldownPercent, height);
        } else {
            ctx.fillStyle = '#00FFFF';
            ctx.fillRect(x - width/2, y, width, height);
        }
    }
    
    drawHealthBar(ctx, camera) {
        const healthPercentage = this.health / this.maxHealth;
        const barWidth = this.radius * 2;
        const barHeight = 4;
        
        const barX = this.x - camera.x - barWidth/2;
        const barY = this.y - camera.y - this.radius - 10;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        ctx.fillStyle = '#2ECC71';
        ctx.fillRect(barX, barY, barWidth * healthPercentage, barHeight);
    }
    
    addScore(points) {
        this.score += points;
        this.experience += points;
        
        // Check for level up
        if (this.experience >= this.experienceToNextLevel) {
            this.levelUp();
        }
        
        // Update score display
        document.getElementById('score').textContent = `Score: ${this.score}`;
    }
    
    levelUp() {
        this.level++;
        this.experience -= this.experienceToNextLevel;
        this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * 1.5);
        
        // Improve stats
        this.maxHealth += 10;
        this.health = this.maxHealth;
        this.radius += 1;
        this.bulletDamage += 1;
        
        // Update level display
        document.getElementById('level').textContent = `Level: ${this.level}`;
    }
    
    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.markedForDeletion = true;
            return true; // Player died
        }
        return false;
    }
} 