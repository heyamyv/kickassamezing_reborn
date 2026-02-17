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
let maxActiveDoods = 1; // Only 1 Dood at a time to start slower
let spawnTimer = 60; // Frames until next Dood spawns (increased from 30)

// Hole positions (15 holes in 5x3 grid - matching original game!)
const holes = [];
const holeRadius = 50;
const doodHeight = 60; // How far the Dood pops up from the hole

// Create 15 holes in a more organic layout (based on grid with random offsets)
for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
        // Base grid position with random offsets for more natural look
        const baseX = 120 + col * 150;
        const baseY = 250 + row * 130;
        const offsetX = (Math.random() - 0.5) * 60; // Random offset -30 to +30
        const offsetY = (Math.random() - 0.5) * 40; // Random offset -20 to +20

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
document.getElementById('mainMenuBtnStart').addEventListener('click', () => {
    window.location.href = '../../mainscreen.html';
});

// Instructions screen
document.getElementById('backToMenuBtn').addEventListener('click', () => {
    instructionsScreen.classList.add('hidden');
    mainMenu.classList.remove('hidden');
});

// Game over buttons
document.getElementById('playAgainBtn').addEventListener('click', () => {
    gameOverDiv.classList.add('hidden');
    startGame();
});

document.getElementById('backToMenuBtn2').addEventListener('click', () => {
    gameOverDiv.classList.add('hidden');
    gameScreen.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    bgMusic.pause();
});

// Quit button during game
document.getElementById('quitBtn').addEventListener('click', () => {
    gameState = 'menu';
    clearInterval(gameTimer);
    gameScreen.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    bgMusic.pause();
});

// Mouse tracking for hammer (desktop only)
if (!isMobile) {
    document.addEventListener('mousemove', (e) => {
        hammer.style.left = e.clientX + 'px';
        hammer.style.top = e.clientY + 'px';
    });
} else {
    // Hide hammer on mobile
    hammer.style.display = 'none';
}

// Canvas click/touch handler
function handleHit(e) {
    if (gameState !== 'playing') return;

    const rect = canvas.getBoundingClientRect();
    let clickX, clickY;

    // Handle both mouse and touch events
    if (e.type === 'touchstart' || e.type === 'touchend') {
        e.preventDefault();
        const touch = e.touches[0] || e.changedTouches[0];
        clickX = touch.clientX - rect.left;
        clickY = touch.clientY - rect.top;
    } else {
        clickX = e.clientX - rect.left;
        clickY = e.clientY - rect.top;
    }

    // Scale coordinates to match canvas internal size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    clickX *= scaleX;
    clickY *= scaleY;

    if (!isMobile) {
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
    spawnTimer = 60; // Start first Dood after a delay (increased)

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

    // Start background music
    bgMusic.volume = 0.3;
    bgMusic.currentTime = 0;
    bgMusic.play().catch(e => console.log('Audio autoplay prevented'));

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
            playSound(popupSound);

            // Reset spawn timer - longer delay between spawns
            spawnTimer = 60 + Math.random() * 60; // 1-2 seconds between spawns
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
            hole.doodY += 3; // Slower rise (was 4)
            if (hole.doodY >= doodHeight) {
                hole.doodY = doodHeight;
                hole.state = 'up';
                hole.timer = 60 + Math.random() * 50; // Stay up longer (was 40-80)
            }
        } else if (hole.state === 'up') {
            hole.timer--;
            if (hole.timer <= 0) {
                hole.state = 'falling';
            }
        } else if (hole.state === 'falling') {
            hole.doodY -= 3; // Slower descent (was 4)
            if (hole.doodY <= 0) {
                hole.doodY = 0;
                hole.state = 'hidden';
            }
        } else if (hole.state === 'hit') {
            hole.doodY -= 6; // Hit animation stays fast
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
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#B0D8F0');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw curved grass hill (scaled up)
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.moveTo(0, 200);
    // Create wavy hill using quadratic curves
    ctx.quadraticCurveTo(250, 170, 500, 200);
    ctx.quadraticCurveTo(750, 230, canvas.width, 200);
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
    bgMusic.pause();

    const gameOverTitle = document.getElementById('gameOverTitle');
    const gameOverText = document.getElementById('gameOverText');

    // Determine which screen to show based on score
    const percentage = totalDoods > 0 ? (score / totalDoods) * 100 : 0;

    let winImage;
    if (percentage === 100) {
        winImage = images.winKickass;
    } else if (percentage >= 60) {
        winImage = images.winPrettyGood;
    } else if (percentage >= 30) {
        winImage = images.winMediocre;
    } else {
        winImage = images.winLoser;
    }

    // Clear previous content and show original screen
    gameOverTitle.innerHTML = '';
    gameOverText.innerHTML = '';

    // Create image element
    const img = document.createElement('img');
    img.src = winImage.src;
    img.style.maxWidth = '800px';
    img.style.width = '100%';
    img.style.borderRadius = '15px';
    img.style.marginBottom = '20px';

    gameOverTitle.appendChild(img);
    gameOverText.textContent = `You hit ${score} out of ${totalDoods} doods!`;
    gameOverText.style.fontSize = '1.8em';

    gameOverDiv.classList.remove('hidden');
}

function playSound(audio) {
    audio.currentTime = 0;
    audio.volume = 0.4;
    audio.play().catch(e => console.log('Sound play failed'));
}

// Initialize
hammer.style.display = 'block';
