// Initialize the game when the page loads
window.addEventListener('load', () => {
    // Get the canvas element
    const canvas = document.getElementById('game-canvas');
    
    // Create and start the game
    const game = new Game(canvas);
    game.start();
    
    // Handle game restart
    canvas.addEventListener('click', () => {
        if (game.gameOver) {
            game.restart();
        }
    });
    
    // Display game instructions
    showInstructions();
});

// Display game instructions
function showInstructions() {
    // Create the instructions div
    const instructionsDiv = document.createElement('div');
    instructionsDiv.id = 'instructions';
    instructionsDiv.innerHTML = `
        <h2>Diep.io Clone</h2>
        <ul>
            <li>Move with WASD or arrow keys</li>
            <li>Aim and shoot with mouse</li>
            <li>Press E or Q to activate special ability</li>
            <li>Destroy shapes and enemies to gain points</li>
            <li>Score points to level up and advance through game levels</li>
            <li>Reach level 10 to unlock tank classes with unique abilities:</li>
            <ul>
                <li><strong>Twin:</strong> Two barrels, Special: 360° bullet spray</li>
                <li><strong>Sniper:</strong> High damage, Special: Piercing shot</li>
                <li><strong>Machine Gun:</strong> Rapid fire, Special: Bullet barrage</li>
                <li><strong>Destroyer:</strong> Powerful shots, Special: Shockwave</li>
            </ul>
            <li>Earn upgrade points by defeating enemies</li>
            <li>Press P to pause the game</li>
        </ul>
        <button id="start-btn">Start Game</button>
    `;
    
    // Style the instructions
    instructionsDiv.style.position = 'absolute';
    instructionsDiv.style.top = '50%';
    instructionsDiv.style.left = '50%';
    instructionsDiv.style.transform = 'translate(-50%, -50%)';
    instructionsDiv.style.background = 'rgba(0, 0, 0, 0.8)';
    instructionsDiv.style.color = 'white';
    instructionsDiv.style.padding = '20px';
    instructionsDiv.style.borderRadius = '10px';
    instructionsDiv.style.textAlign = 'center';
    instructionsDiv.style.zIndex = '100';
    
    // Style the button
    const button = instructionsDiv.querySelector('button');
    button.style.padding = '10px 20px';
    button.style.background = '#00B2E1';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.marginTop = '10px';
    button.style.cursor = 'pointer';
    
    // Add instructions to the document
    document.body.appendChild(instructionsDiv);
    
    // Remove instructions when the start button is clicked
    button.addEventListener('click', () => {
        instructionsDiv.style.display = 'none';
    });
} 