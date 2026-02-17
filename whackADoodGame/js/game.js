// Game elements
const mainMenu = document.getElementById('mainMenu');
const instructionsScreen = document.getElementById('instructionsScreen');
const gameScreen = document.getElementById('gameScreen');
const gameOverDiv = document.getElementById('gameOver');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const hammer = document.getElementById('hammer');

// Detect mobile
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

// Adjust canvas size for mobile
if (isMobile) {
    canvas.width = window.innerWidth;
    // Account for header height (60px) and ensure bottom is visible
    canvas.height = window.innerHeight - 70;
}

// Load original game images
const images = {
    dood: new Image(),
    doodPopup: new Image(),
    doodHit: new Image(),
    hole: new Image(),
    winKickass: new Image(),
    winPrettyGood: new Image(),
    winMediocre: new Image(),
    winLoser: new Image()
};

let imagesLoaded = 0;
const totalImages = Object.keys(images).length;

// Load all images
images.dood.src = 'assets/images/dood.png';
images.doodPopup.src = 'assets/images/dood_popup.png';
images.doodHit.src = 'assets/images/dood_hit.png';
images.hole.src = 'assets/images/hole.png';
images.winKickass.src = 'assets/images/win_kickass.png';
images.winPrettyGood.src = 'assets/images/win_prettygood.png';
images.winMediocre.src = 'assets/images/win_mediocre.png';
images.winLoser.src = 'assets/images/win_loser.png';

// Track image loading
Object.values(images).forEach(img => {
    img.onload = () => {
        imagesLoaded++;
        console.log(`Image loaded: ${imagesLoaded}/${totalImages}`);
    };
    img.onerror = (e) => {
        console.error('Failed to load image:', img.src);
    };
});

// Game state
let gameState = 'menu'; // menu, playing, gameover
let score = 0;
let timeLeft = 30;
let gameTimer;
let totalDoods = 0;
let maxActiveDoods = 2; // Start with 2 Doods at a time
let spawnTimer = 20; // Frames until next Dood spawns - 20% faster
let gameStartTime = 0; // Track elapsed time for difficulty scaling

// Hole positions (15 holes in 5x3 grid - matching original game!)
const holes = [];
const holeRadius = 50;
const doodHeight = 60; // How far the Dood pops up from the hole

// Create 15 holes in a more organic layout (5 rows x 3 cols for vertical canvas)
// Dynamic positioning based on canvas size - ONLY in grass area (not sky)
const cols = 3;
const rows = 5;
const marginX = canvas.width * 0.15; // 15% margin on sides
const grassStartY = canvas.height * 0.36; // Holes start at 36% from top (buffer from hill at 30%)
const grassEndY = canvas.height * 0.88; // End at 88% (leave margin at bottom for visibility)
const availableWidth = canvas.width - (marginX * 2);
const availableHeight = grassEndY - grassStartY;
const spacingX = availableWidth / (cols - 1);
const spacingY = availableHeight / (rows - 1);

for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
        // Base grid position centered with dynamic spacing - starting from grassStartY
        const baseX = marginX + col * spacingX;
        const baseY = grassStartY + row * spacingY;
        const offsetX = (Math.random() - 0.5) * 30; // Random offset -15 to +15 (reduced)
        const offsetY = (Math.random() - 0.5) * 20; // Random offset -10 to +10 (reduced from -15 to +15)

        holes.push({
            x: baseX + offsetX,
            y: baseY + offsetY,
            active: false,
            doodY: 0,
            state: 'hidden',
            timer: 0,
            starTimer: 0 // Timer for star burst effect
        });
    }
}

// Audio elements
const whackSound = document.getElementById('whackSound');
const popupSound = document.getElementById('popupSound');
const missSound = document.getElementById('missSound');
const bgMusic = document.getElementById('bgMusic');

// Button handlers - Main Menu
document.getElementById('playBtn').addEventListener('click', startGame);
document.getElementById('instructionsBtn').addEventListener('click', showInstructions);

// Instructions screen
document.getElementById('backToMenuBtn').addEventListener('click', () => {
    instructionsScreen.classList.add('hidden');
    mainMenu.classList.remove('hidden');
});

// Game over buttons
document.getElementById('playAgainBtn').addEventListener('click', () => {
    gameOverDiv.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    startGame();
});

document.getElementById('backToMenuBtn2').addEventListener('click', () => {
    gameOverDiv.classList.add('hidden');
    gameScreen.classList.add('hidden');
    mainMenu.classList.remove('hidden');
});

// Quit button during game
document.getElementById('quitBtn').addEventListener('click', () => {
    gameState = 'menu';
    clearInterval(gameTimer);
    gameScreen.classList.add('hidden');
    mainMenu.classList.remove('hidden');
});

// Mouse tracking for hammer (desktop: always show, mobile: hide until hit)
if (!isMobile) {
    // Desktop: show hammer following mouse
    hammer.style.display = 'block';
    hammer.style.opacity = '1';
    document.addEventListener('mousemove', (e) => {
        hammer.style.left = e.clientX + 'px';
        hammer.style.top = e.clientY + 'px';
    });
}

// Canvas click/touch handler
function handleHit(e) {
    if (gameState !== 'playing') return;

    const rect = canvas.getBoundingClientRect();
    let clickX, clickY;

    // Handle both mouse and touch events
    let screenX, screenY;
    if (e.type === 'touchstart' || e.type === 'touchend') {
        e.preventDefault();
        const touch = e.touches[0] || e.changedTouches[0];
        screenX = touch.clientX;
        screenY = touch.clientY;
        clickX = screenX - rect.left;
        clickY = screenY - rect.top;
    } else {
        screenX = e.clientX;
        screenY = e.clientY;
        clickX = e.clientX - rect.left;
        clickY = e.clientY - rect.top;
    }

    // Scale coordinates to match canvas internal size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    clickX *= scaleX;
    clickY *= scaleY;

    // Show hammer at click/touch position
    hammer.style.left = screenX + 'px';
    hammer.style.top = screenY + 'px';

    if (isMobile) {
        // Mobile: temporarily show hammer on hit
        hammer.style.display = 'block';
        hammer.style.opacity = '1';
        hammer.classList.add('hitting');
        setTimeout(() => {
            hammer.classList.remove('hitting');
            hammer.style.opacity = '0';
            setTimeout(() => hammer.style.display = 'none', 100);
        }, 200);
    } else {
        // Desktop: just do hitting animation
        hammer.classList.add('hitting');
        setTimeout(() => hammer.classList.remove('hitting'), 200);
    }

    let hit = false;

    holes.forEach(hole => {
        if (hole.state === 'up' && isClickInHole(clickX, clickY, hole)) {
            // Hit!
            hole.state = 'hit';
            hole.timer = 10;
            hole.starTimer = 20; // Show stars for 20 frames
            score++;
            document.getElementById('score').textContent = score + '/' + totalDoods;
            playSound(whackSound);
            hit = true;
        }
    });

    // No sound on miss - only play sound when you hit a Dood
}

canvas.addEventListener('click', handleHit);
canvas.addEventListener('touchstart', handleHit);
canvas.addEventListener('touchend', handleHit);

function isClickInHole(x, y, hole) {
    // Make hit detection based on a rectangular area covering the Dood
    const doodWidth = 105;
    const doodHeight_sprite = 125;
    const spriteHoleOffset = doodHeight_sprite * 0.63;

    // Calculate where the sprite actually is
    const spriteTop = hole.y - spriteHoleOffset + (doodHeight - hole.doodY);
    const spriteBottom = spriteTop + doodHeight_sprite;
    const spriteLeft = hole.x - doodWidth / 2;
    const spriteRight = hole.x + doodWidth / 2;

    return x >= spriteLeft && x <= spriteRight && y >= spriteTop && y <= spriteBottom;
}

function showInstructions() {
    mainMenu.classList.add('hidden');
    instructionsScreen.classList.remove('hidden');
}

function startGame() {
    // Check if images are loaded
    if (imagesLoaded < totalImages) {
        console.log('Waiting for images to load...');
        setTimeout(startGame, 100);
        return;
    }

    // Reset game state
    score = 0;
    timeLeft = 30;
    totalDoods = 0;
    gameState = 'playing';
    spawnTimer = 20; // Start first Dood after a delay - 20% faster
    gameStartTime = Date.now(); // Track start time for difficulty

    document.getElementById('score').textContent = '0/0';
    document.getElementById('timer').textContent = timeLeft;

    // Reset holes
    holes.forEach(hole => {
        hole.active = false;
        hole.doodY = 0;
        hole.state = 'hidden';
        hole.timer = 0;
        hole.starTimer = 0;
    });

    // Show game screen
    mainMenu.classList.add('hidden');
    instructionsScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');

    // Start timer
    clearInterval(gameTimer);
    gameTimer = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').textContent = timeLeft;

        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);

    // Start game loop
    gameLoop();
}

function updateDoods() {
    // Calculate difficulty scaling based on elapsed time
    const elapsedSeconds = (Date.now() - gameStartTime) / 1000;

    // Gradually decrease spawn delay - 20% faster (starts at 20-36 frames, goes down to 10-20 frames after 20 seconds)
    const difficultyFactor = Math.min(elapsedSeconds / 20, 1); // 0 to 1 over 20 seconds
    const baseDelay = 20 - (10 * difficultyFactor); // 20 down to 10
    const randomDelay = 16 - (6 * difficultyFactor); // 16 down to 10

    // Gradually increase max active Doods (2 at start, 3 after 10 seconds, 4 after 22 seconds)
    if (elapsedSeconds > 22) {
        maxActiveDoods = 4;
    } else if (elapsedSeconds > 10) {
        maxActiveDoods = 3;
    } else {
        maxActiveDoods = 2;
    }

    // Count currently active Doods
    const activeCount = holes.filter(h => h.state !== 'hidden').length;

    // Spawn timer countdown
    spawnTimer--;

    // Try to spawn a new Dood if below max and timer is up
    if (activeCount < maxActiveDoods && spawnTimer <= 0) {
        // Find available holes
        const availableHoles = holes.filter(h => h.state === 'hidden');

        if (availableHoles.length > 0) {
            // Choose random hole
            const randomHole = availableHoles[Math.floor(Math.random() * availableHoles.length)];
            randomHole.state = 'rising';
            randomHole.timer = 0;
            totalDoods++;
            document.getElementById('score').textContent = score + '/' + totalDoods;

            // Reset spawn timer - with gradually decreasing delay for difficulty
            spawnTimer = baseDelay + Math.random() * randomDelay;
        }
    }

    // Update all holes
    holes.forEach(hole => {
        // Update star burst timer
        if (hole.starTimer > 0) {
            hole.starTimer--;
        }

        // Update Dood animation
        if (hole.state === 'rising') {
            hole.doodY += 5; // Rise speed - 20% faster
            if (hole.doodY >= doodHeight) {
                hole.doodY = doodHeight;
                hole.state = 'up';
                // Gradually reduce how long Dood stays up - 20% faster (starts at 32-48 frames, goes to 16-28 frames)
                const elapsedSeconds = (Date.now() - gameStartTime) / 1000;
                const difficultyFactor = Math.min(elapsedSeconds / 20, 1);
                const baseStayTime = 32 - (16 * difficultyFactor); // 32 down to 16
                const randomStayTime = 16 - (4 * difficultyFactor); // 16 down to 12
                hole.timer = baseStayTime + Math.random() * randomStayTime;
            }
        } else if (hole.state === 'up') {
            hole.timer--;
            if (hole.timer <= 0) {
                hole.state = 'falling';
            }
        } else if (hole.state === 'falling') {
            hole.doodY -= 5; // Descent speed - 20% faster
            if (hole.doodY <= 0) {
                hole.doodY = 0;
                hole.state = 'hidden';
            }
        } else if (hole.state === 'hit') {
            hole.doodY -= 7; // Hit animation - 20% faster
            if (hole.doodY <= 0) {
                hole.doodY = 0;
                hole.state = 'hidden';
            }
        }
    });
}

function drawBackground() {
    // Draw blue sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#00BFFF');
    skyGradient.addColorStop(1, '#87CEEB');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw curved grass hill (dynamic based on canvas size)
    // Hill should be at ~30% to leave room for holes starting at 33%
    const hillTop = canvas.height * 0.30;
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.moveTo(0, hillTop);
    // Create wavy hill using quadratic curves (scaled to canvas width)
    ctx.quadraticCurveTo(canvas.width * 0.25, hillTop - 15, canvas.width * 0.5, hillTop);
    ctx.quadraticCurveTo(canvas.width * 0.75, hillTop + 15, canvas.width, hillTop);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fill();
}

function drawHoles() {
    holes.forEach(hole => {
        const holeSize = 105;
        const doodDisplayWidth = 95; // How wide to display
        const doodDisplayHeight = 95; // How tall to display

        // Actual source image dimensions
        const doodSourceWidth = 160;
        const doodSourceHeight = 186;

        // Always draw background hole
        ctx.drawImage(
            images.hole,
            hole.x - holeSize / 2,
            hole.y - holeSize / 2,
            holeSize,
            holeSize
        );

        if (hole.doodY > 0) {
            const doodTop = hole.y - hole.doodY;

            // Draw star burst effect if recently hit
            if (hole.starTimer > 0) {
                ctx.fillStyle = 'rgba(255, 255, 0, ' + (hole.starTimer / 20) + ')';
                ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const radius = i % 2 === 0 ? 50 : 30;
                    const x = hole.x + Math.cos(angle) * radius;
                    const y = doodTop + Math.sin(angle) * radius;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();

                const starColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'];
                for (let i = 0; i < 4; i++) {
                    const angle = (i / 4) * Math.PI * 2 + (hole.starTimer * 0.1);
                    const x = hole.x + Math.cos(angle) * 40;
                    const y = doodTop - 30 + Math.sin(angle) * 20;
                    ctx.fillStyle = starColors[i];
                    ctx.font = 'bold 20px Arial';
                    ctx.fillText('★', x, y);
                }
            }

            let doodImg = images.dood;
            if (hole.state === 'hit' && hole.starTimer > 0) {
                doodImg = images.dood;
            }

            // Calculate how much of the source to show based on doodY
            const visibleDisplayHeight = Math.min(hole.doodY, doodDisplayHeight);
            const visibleSourceHeight = (visibleDisplayHeight / doodDisplayHeight) * doodSourceHeight;

            // Crop from the TOP of the source sprite
            const sourceX = 0;
            const sourceY = 0;
            const sourceWidth = doodSourceWidth; // Use full width of source
            const sourceHeight = visibleSourceHeight;

            // Draw centered on the hole
            const destX = hole.x - doodDisplayWidth / 2;
            const destY = hole.y - visibleDisplayHeight;

            ctx.drawImage(
                doodImg,
                sourceX, sourceY, sourceWidth, sourceHeight, // Source: full width, cropped height
                destX, destY, doodDisplayWidth, visibleDisplayHeight // Destination: scaled down
            );
        }
    });
}

function gameLoop() {
    if (gameState !== 'playing') return;

    // Draw background first
    drawBackground();

    // Update and draw game elements
    updateDoods();
    drawHoles();

    requestAnimationFrame(gameLoop);
}

function endGame() {
    gameState = 'gameover';
    clearInterval(gameTimer);

    // Hide game screen
    gameScreen.classList.add('hidden');

    const gameOverTitle = document.getElementById('gameOverTitle');
    const gameOverText = document.getElementById('gameOverText');

    // Determine which screen to show based on score
    const percentage = totalDoods > 0 ? (score / totalDoods) * 100 : 0;

    let title, message, emoji;
    if (percentage === 100) {
        title = 'KICKASS!';
        message = 'You are a kickassamazin person all around';
        emoji = '🔥';
    } else if (percentage >= 60) {
        title = 'Pretty GOOD!';
        message = 'need improvement on your kickassamezingness';
        emoji = '👍';
    } else if (percentage >= 30) {
        title = 'MEDIOCRE';
        message = 'stop being a mediocre loser';
        emoji = '😐';
    } else {
        title = 'LOSER!';
        message = 'obviously you suck at life';
        emoji = '💩';
    }

    // Clear previous content
    gameOverTitle.innerHTML = '';
    gameOverText.innerHTML = '';

    // Set title with emoji
    gameOverTitle.textContent = `${emoji} ${title} ${emoji}`;
    gameOverTitle.style.fontSize = '3em';
    gameOverTitle.style.marginBottom = '20px';

    // Set message and score
    gameOverText.innerHTML = `
        <p style="font-size: 2em; margin: 20px 0;">${message}</p>
        <p style="font-size: 1.8em; color: #ffd93d;">You hit ${score} out of ${totalDoods} doods!</p>
        <p style="font-size: 1.5em; color: #aaa;">${Math.round(percentage)}% success rate</p>
    `;

    gameOverDiv.classList.remove('hidden');
}

function playSound(audio) {
    audio.currentTime = 0;
    audio.volume = 0.4;
    audio.play().catch(e => console.log('Sound play failed'));
}

// Initialize
hammer.style.display = 'block';
