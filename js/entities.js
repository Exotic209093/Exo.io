// Game entities

// Base Entity class
class Entity {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.markedForDeletion = false;
    }
    
    update() {
        // To be implemented by subclasses
    }
    
    draw(ctx, camera) {
        const x = this.x - camera.x;
        const y = this.y - camera.y;
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(x, y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Shape class (squares, triangles, pentagons)
class Shape extends Entity {
    constructor(x, y, type) {
        const types = {
            square: { radius: 20, color: '#FFE869', health: 10, points: 10 },
            triangle: { radius: 15, color: '#FC7676', health: 15, points: 25 },
            pentagon: { radius: 25, color: '#768DFC', health: 30, points: 100 }
        };
        
        const shapeType = types[type] || types.square;
        super(x, y, shapeType.radius, shapeType.color);
        
        this.type = type;
        this.health = shapeType.health;
        this.maxHealth = shapeType.health;
        this.points = shapeType.points;
        this.sides = type === 'square' ? 4 : type === 'triangle' ? 3 : 5;
    }
    
    draw(ctx, camera) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        
        if (this.sides === 4) {
            // Draw square
            const size = this.radius * 1.5;
            const x = this.x - camera.x;
            const y = this.y - camera.y;
            ctx.rect(x - size/2, y - size/2, size, size);
        } else {
            // Draw polygon (triangle or pentagon)
            const angle = (Math.PI * 2) / this.sides;
            const x = this.x - camera.x;
            const y = this.y - camera.y;
            
            ctx.moveTo(x + this.radius * Math.cos(0), y + this.radius * Math.sin(0));
            
            for (let i = 1; i <= this.sides; i++) {
                ctx.lineTo(
                    x + this.radius * Math.cos(angle * i),
                    y + this.radius * Math.sin(angle * i)
                );
            }
        }
        
        ctx.fill();
        
        // Draw health bar
        if (this.health < this.maxHealth) {
            this.drawHealthBar(ctx, camera);
        }
    }
    
    drawHealthBar(ctx, camera) {
        const healthPercentage = this.health / this.maxHealth;
        const barWidth = this.radius * 2;
        const barHeight = 4;
        const x = this.x - camera.x;
        const y = this.y - camera.y;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(x - barWidth/2, y - this.radius - 10, barWidth, barHeight);
        
        ctx.fillStyle = '#2ECC71';
        ctx.fillRect(
            x - barWidth/2,
            y - this.radius - 10,
            barWidth * healthPercentage,
            barHeight
        );
    }
    
    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.markedForDeletion = true;
            return this.points;
        }
        return 0;
    }
}

// Bullet class
class Bullet extends Entity {
    constructor(x, y, angle, speed, damage, color, fromPlayer = true) {
        super(x, y, 5, color);
        this.angle = angle;
        this.speed = speed;
        this.damage = damage;
        this.lifetime = 0;
        this.maxLifetime = 100;
        this.fromPlayer = fromPlayer;
        
        // Special properties
        this.piercing = false; // Whether bullet passes through targets
        this.piercedTargets = []; // Keep track of targets already hit (for piercing bullets)
        this.explosive = false; // Whether bullet explodes
        this.explosionRadius = 0;
        this.explosionDamage = 0;
    }
    
    update() {
        // Move bullet
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        
        // Update lifetime
        this.lifetime++;
        if (this.lifetime >= this.maxLifetime) {
            this.markedForDeletion = true;
            
            // If explosive, create explosion effect when lifetime ends
            if (this.explosive) {
                this.createExplosion();
            }
        }
    }
    
    createExplosion() {
        // This would trigger explosion effect and damage
        // The Game class needs to handle this by checking for explosive bullets
        // that are marked for deletion
    }
    
    hasHit(entity) {
        // For piercing bullets, check if already hit this target
        if (this.piercing) {
            return this.piercedTargets.includes(entity.id);
        }
        return false;
    }
    
    registerHit(entity) {
        // For piercing bullets, register this target as hit
        if (this.piercing) {
            this.piercedTargets.push(entity.id);
        } else {
            this.markedForDeletion = true;
        }
    }
}

// Enemy Tank class (AI-controlled)
class Enemy extends Entity {
    constructor(x, y, tier = 1) {
        // Different tiers have different properties
        const tierProps = {
            1: { radius: 15, color: '#F14E54', health: 100, damage: 5, speed: 2, shootRate: 60, points: 250 },
            2: { radius: 18, color: '#E67E22', health: 200, damage: 8, speed: 1.8, shootRate: 50, points: 500 },
            3: { radius: 20, color: '#9B59B6', health: 300, damage: 12, speed: 1.5, shootRate: 40, points: 1000 }
        };
        
        const props = tierProps[tier] || tierProps[1];
        super(x, y, props.radius, props.color);
        
        // Enemy properties
        this.tier = tier;
        this.maxHealth = props.health;
        this.health = props.health;
        this.damage = props.damage;
        this.speed = props.speed;
        this.points = props.points;
        this.angle = 0;
        
        // AI behavior
        this.targetX = x;
        this.targetY = y;
        this.retargetCounter = 0;
        this.retargetRate = 120; // Frames before choosing a new position
        this.shootCounter = 0;
        this.shootRate = props.shootRate; // Frames between shots
        this.detectionRadius = 400; // Distance to detect and target player
        this.fleeing = false;
        this.fleeHealthPercent = 0.3;
    }
    
    update(player, worldSize, bullets) {
        // Calculate distance to player
        const distToPlayer = Utils.distance(this.x, this.y, player.x, player.y);
        const canSeePlayer = distToPlayer < this.detectionRadius;
        
        // Decide whether to chase player or wander
        if (canSeePlayer) {
            const healthPercent = this.health / this.maxHealth;
            
            // If health is low, flee from player
            if (healthPercent < this.fleeHealthPercent) {
                this.fleeing = true;
                const dx = this.x - player.x;
                const dy = this.y - player.y;
                const norm = Math.sqrt(dx * dx + dy * dy);
                this.targetX = Utils.clamp(this.x + (dx / norm) * 200, this.radius, worldSize - this.radius);
                this.targetY = Utils.clamp(this.y + (dy / norm) * 200, this.radius, worldSize - this.radius);
            } else {
                // Chase player
                this.fleeing = false;
                this.targetX = player.x;
                this.targetY = player.y;
                
                // Shoot at player if in range
                this.shootCounter++;
                if (this.shootCounter >= this.shootRate) {
                    this.shootCounter = 0;
                    this.shoot(bullets, player);
                }
            }
            
            // Point towards player
            this.angle = Math.atan2(player.y - this.y, player.x - this.x);
        } else {
            // Random wandering
            this.retargetCounter++;
            if (this.retargetCounter >= this.retargetRate || 
                Utils.distance(this.x, this.y, this.targetX, this.targetY) < 10) {
                this.retargetCounter = 0;
                this.chooseRandomTarget(worldSize);
            }
        }
        
        // Move towards target
        this.moveTowardsTarget();
        
        // Check world boundaries
        this.x = Utils.clamp(this.x, this.radius, worldSize - this.radius);
        this.y = Utils.clamp(this.y, this.radius, worldSize - this.radius);
    }
    
    chooseRandomTarget(worldSize) {
        const moveDistance = 200;
        const angle = Math.random() * Math.PI * 2;
        
        this.targetX = Utils.clamp(
            this.x + Math.cos(angle) * moveDistance,
            this.radius, 
            worldSize - this.radius
        );
        
        this.targetY = Utils.clamp(
            this.y + Math.sin(angle) * moveDistance,
            this.radius, 
            worldSize - this.radius
        );
    }
    
    moveTowardsTarget() {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If not at target yet, move towards it
        if (distance > 5) {
            const speed = this.fleeing ? this.speed * 1.5 : this.speed;
            
            // If chasing player, stop at a distance
            if (!this.fleeing && distance < 150) {
                return;
            }
            
            const vx = (dx / distance) * speed;
            const vy = (dy / distance) * speed;
            
            this.x += vx;
            this.y += vy;
        }
    }
    
    shoot(bullets, player) {
        // Create a bullet from the enemy tank with slight inaccuracy
        const inaccuracy = (Math.random() - 0.5) * 0.2;
        const angle = this.angle + inaccuracy;
        
        const bulletX = this.x + Math.cos(angle) * (this.radius + 10);
        const bulletY = this.y + Math.sin(angle) * (this.radius + 10);
        
        bullets.push(new Bullet(
            bulletX,
            bulletY,
            angle,
            5, // Speed
            this.damage, // Damage
            this.color,
            false // Not from player
        ));
    }
    
    draw(ctx, camera) {
        // Draw tank body
        const x = this.x - camera.x;
        const y = this.y - camera.y;
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(x, y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw tank barrel
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.angle);
        
        ctx.fillStyle = '#666';
        ctx.fillRect(0, -3, this.radius + 10, 6);
        
        ctx.restore();
        
        // Draw health bar
        this.drawHealthBar(ctx, camera);
    }
    
    drawHealthBar(ctx, camera) {
        const healthPercentage = this.health / this.maxHealth;
        const barWidth = this.radius * 2;
        const barHeight = 4;
        const x = this.x - camera.x;
        const y = this.y - camera.y;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(x - barWidth/2, y - this.radius - 10, barWidth, barHeight);
        
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(
            x - barWidth/2,
            y - this.radius - 10,
            barWidth * healthPercentage,
            barHeight
        );
    }
    
    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.markedForDeletion = true;
            return this.points;
        }
        return 0;
    }
} 