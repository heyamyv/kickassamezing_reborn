// Game canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Detect mobile
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

// Adjust canvas size for mobile
if (isMobile) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 150;
}

// Game state
let gameState = 'playing'; // playing, won, lost
let score = 0;
let timeLeft = 20;
let gameTimer;
let invulnerabilityTimer = 0; // Grace period at game start

// Load original game images
const images = {
    dood1: new Image(),
    dood2: new Image(),
    cloud: new Image(),
    airplane: new Image(),
    ufo: new Image(),
    sun: new Image()
};

let imagesLoaded = 0;
const totalImages = Object.keys(images).length;

// Load all images
images.dood1.src = 'assets/images/dood1.png';
images.dood2.src = 'assets/images/dood2.png';
images.cloud.src = 'assets/images/cloud_original.png';
images.airplane.src = 'assets/images/airplane_original.png';
images.ufo.src = 'assets/images/ufo_original.png';
images.sun.src = 'assets/images/sun_original.png';

// Track image loading
Object.values(images).forEach(img => {
    img.onload = () => {
        imagesLoaded++;
        console.log(`Image loaded: ${imagesLoaded}/${totalImages}`);
        if (imagesLoaded === totalImages) {
            console.log('All images loaded!');
        }
    };
    img.onerror = (e) => {
        console.error('Failed to load image:', img.src);
    };
});

// Player object
const player = {
    x: canvas.width / 2,
    y: canvas.height - 150,
    width: 92,  // 30% smaller (132 * 0.7)
    height: 92, // 30% smaller (132 * 0.7)
    speed: 7,
    rotation: 0,
    vx: 0,
    vy: 0,
    imageIndex: 0,  // 0 = normal face (dood1), 1 = eating face (dood2)
    eatingTimer: 0  // Timer for eating animation
};

// Keyboard state
const keys = {};

// Clouds array
const clouds = [];
const totalCloudCount = 15; // Total clouds to spawn throughout the game
const initialCloudCount = 6; // Start with 6 clouds
let cloudsSpawned = 0; // Track how many clouds have been spawned
let nextSpawnScore = 2; // Spawn new cloud every 2 clouds eaten

// Obstacles array
const obstacles = [];

// Initialize game
function init() {
    // Hide loading message
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) loadingDiv.style.display = 'none';

    // Clear arrays from any previous game
    clouds.length = 0;
    obstacles.length = 0;

    // Reset player position
    player.x = canvas.width / 2;
    player.y = canvas.height - 150;
    player.vx = 0;
    player.vy = 0;
    player.rotation = 0;
    player.imageIndex = 0;
    player.eatingTimer = 0;

    // Reset game state
    gameState = 'playing';
    score = 0;
    timeLeft = 20;
    invulnerabilityTimer = 90; // 1.5 seconds of invulnerability at 60fps
    document.getElementById('timer').textContent = timeLeft;

    // Setup mobile controls if on mobile
    if (isMobile) {
        setupMobileControls();
        // Update instructions for mobile
        const controlsText = document.getElementById('controlsText');
        if (controlsText) {
            controlsText.textContent = 'Tap on screen to move Dood and eat all 15 clouds!';
        }
    }

    // Create initial clouds (scaled up bigger) - distributed throughout vertical space - 20% larger
    // Avoid spawning too close to player's starting position (bottom center)
    cloudsSpawned = 0;
    nextSpawnScore = 2;
    for (let i = 0; i < initialCloudCount; i++) {
        clouds.push({
            x: Math.random() * (canvas.width - 180) + 90,
            y: Math.random() * (canvas.height - 400) + 70, // Keep clouds in upper 3/4 of screen
            width: 168,
            height: 84,
            eaten: false,
            floatOffset: Math.random() * Math.PI * 2,
            floatSpeed: 0.02 + Math.random() * 0.02
        });
        cloudsSpawned++;
    }

    // Create obstacles
    createObstacles();

    // Start game timer
    startGameTimer();

    // Start background music
    const bgMusic = document.getElementById('bgMusic');
    bgMusic.volume = 0.3;
    bgMusic.play().catch(e => console.log('Audio autoplay prevented'));

    // Start game loop
    gameLoop();
}

function createObstacles() {
    // Airplane - 100% larger (double size) - moves in straight line left to right
    obstacles.push({
        type: 'airplane',
        x: -250,
        y: canvas.height * 0.12,
        width: 440,
        height: 140,
        speed: 2.8,
        direction: 1
    });

    // Birds - 50% larger - spread vertically with wavy flight
    // Avoid spawning near player's starting position (center horizontally, bottom vertically)
    for (let i = 0; i < 3; i++) {
        let birdX;
        // Spawn birds away from center (player starts at center)
        if (Math.random() > 0.5) {
            birdX = Math.random() * (canvas.width * 0.3); // Left third
        } else {
            birdX = canvas.width * 0.7 + Math.random() * (canvas.width * 0.3); // Right third
        }

        obstacles.push({
            type: 'bird',
            x: birdX,
            y: canvas.height * 0.25 + i * (canvas.height * 0.2),
            baseY: canvas.height * 0.25 + i * (canvas.height * 0.2),
            width: 68,
            height: 54,
            speed: 2.1 + Math.random(),
            direction: Math.random() > 0.5 ? 1 : -1,
            flap: 0,
            waveOffset: Math.random() * Math.PI * 2,
            waveAmplitude: 20 + Math.random() * 15,
            waveFrequency: 0.03 + Math.random() * 0.02
        });
    }

    // UFO - 100% larger (double size) with 10% wider - moves in straight line left to right - positioned lower
    obstacles.push({
        type: 'ufo',
        x: -220,
        y: canvas.height * 0.4,
        width: 396,
        height: 220,
        speed: 2.1,
        direction: 1
    });

    // Parachute - 200% larger (3x size) with gentle sway
    // Spawn away from center to avoid immediate collision with player
    let parachuteX;
    if (Math.random() > 0.5) {
        parachuteX = Math.random() * (canvas.width * 0.3); // Left third
    } else {
        parachuteX = canvas.width * 0.7 + Math.random() * (canvas.width * 0.3); // Right third
    }

    obstacles.push({
        type: 'parachute',
        x: parachuteX,
        y: 0,
        width: 280,
        height: 440,
        speed: 1.1,
        direction: 1,
        swayOffset: 0,
        swayAmplitude: 25,
        swayFrequency: 0.02
    });
}

function startGameTimer() {
    gameTimer = setInterval(() => {
        if (gameState === 'playing') {
            timeLeft--;
            document.getElementById('timer').textContent = timeLeft;

            if (timeLeft <= 0) {
                endGame(false, 'Time\'s up! Dood only ate ' + score + ' clouds!');
            }
        }
    }, 1000);
}

// Input handling
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Target position for tap controls
let tapTarget = null;

// Mobile controls setup
function setupMobileControls() {
    // On mobile, use tap-to-move instead of D-pad
    canvas.addEventListener('touchstart', handleTap);
    canvas.addEventListener('touchmove', handleTap);
}

function handleTap(e) {
    if (gameState !== 'playing') return;

    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];

    // Convert screen coordinates to canvas coordinates
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    tapTarget = {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
    };
}

// Update player
function updatePlayer() {
    player.vx = 0;
    player.vy = 0;

    if (isMobile && tapTarget) {
        // Mobile: move toward tap location
        const dx = tapTarget.x - player.x;
        const dy = tapTarget.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 10) {
            // Normalize and apply speed
            player.vx = (dx / distance) * player.speed;
            player.vy = (dy / distance) * player.speed;

            // Set rotation based on horizontal movement
            if (dx < -5) {
                player.rotation = -15;
            } else if (dx > 5) {
                player.rotation = 15;
            } else {
                player.rotation = 0;
            }
        } else {
            // Reached target
            tapTarget = null;
            player.rotation = 0;
        }
    } else {
        // Desktop: arrow key controls
        if (keys['ArrowLeft'] || keys['a']) {
            player.vx = -player.speed;
            player.rotation = -15;
        }
        if (keys['ArrowRight'] || keys['d']) {
            player.vx = player.speed;
            player.rotation = 15;
        }
        if (keys['ArrowUp'] || keys['w']) {
            player.vy = -player.speed;
        }
        if (keys['ArrowDown'] || keys['s']) {
            player.vy = player.speed;
        }

        // Reset rotation if not moving horizontally
        if (!keys['ArrowLeft'] && !keys['a'] && !keys['ArrowRight'] && !keys['d']) {
            player.rotation = 0;
        }
    }

    player.x += player.vx;
    player.y += player.vy;

    // Boundary checking
    player.x = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, player.x));
    player.y = Math.max(player.height / 2, Math.min(canvas.height - player.height / 2, player.y));

    // Handle eating animation timer
    if (player.eatingTimer > 0) {
        player.eatingTimer--;
        player.imageIndex = 1; // Show eating face
    } else {
        player.imageIndex = 0; // Show normal face
    }
}

// Spawn a new cloud
function spawnNewCloud() {
    if (cloudsSpawned >= totalCloudCount) return;

    const minDistance = 200; // Minimum distance from existing clouds
    let attempts = 0;
    let newX, newY, tooClose;

    // Try to find a position that's not too close to existing clouds
    do {
        newX = Math.random() * (canvas.width - 180) + 90;
        newY = Math.random() * (canvas.height - 400) + 70; // Keep clouds in upper 3/4 of screen
        tooClose = false;
        attempts++;

        // Check distance from all existing clouds
        for (let cloud of clouds) {
            const dx = newX - cloud.x;
            const dy = newY - cloud.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < minDistance) {
                tooClose = true;
                break;
            }
        }

        // After 10 attempts, just place it anywhere
        if (attempts >= 10) break;
    } while (tooClose);

    clouds.push({
        x: newX,
        y: newY,
        width: 168,
        height: 84,
        eaten: false,
        floatOffset: Math.random() * Math.PI * 2,
        floatSpeed: 0.02 + Math.random() * 0.02
    });
    cloudsSpawned++;
}

// Update clouds
function updateClouds() {
    clouds.forEach(cloud => {
        if (!cloud.eaten) {
            // Floating animation
            cloud.floatOffset += cloud.floatSpeed;
            cloud.renderY = cloud.y + Math.sin(cloud.floatOffset) * 5;
        }
    });

    // Check if there are no uneaten clouds left - spawn 2 immediately to avoid getting stuck
    const uneatenClouds = clouds.filter(c => !c.eaten).length;
    if (uneatenClouds === 0 && cloudsSpawned < totalCloudCount) {
        spawnNewCloud();
        if (cloudsSpawned < totalCloudCount) {
            spawnNewCloud();
        }
    }
}

// Update obstacles
function updateObstacles() {
    obstacles.forEach(obstacle => {
        if (obstacle.type === 'airplane' || obstacle.type === 'ufo') {
            // Move horizontally in straight line
            obstacle.x += obstacle.speed * obstacle.direction;

            if (obstacle.x > canvas.width + 250 || obstacle.x < -250) {
                obstacle.direction *= -1;
                obstacle.y = canvas.height * 0.1 + Math.random() * (canvas.height * 0.5);
            }
        } else if (obstacle.type === 'bird') {
            // Move horizontally
            obstacle.x += obstacle.speed * obstacle.direction;
            obstacle.flap += 0.2;

            // Add wavy flight pattern
            obstacle.waveOffset += obstacle.waveFrequency;
            obstacle.y = obstacle.baseY + Math.sin(obstacle.waveOffset) * obstacle.waveAmplitude;

            if (obstacle.x > canvas.width + 30 || obstacle.x < -30) {
                obstacle.direction *= -1;
            }
        } else if (obstacle.type === 'parachute') {
            // Move downward
            obstacle.y += obstacle.speed;

            // Gentle swaying motion
            obstacle.swayOffset += obstacle.swayFrequency;
            obstacle.x += Math.sin(obstacle.swayOffset) * 2;

            if (obstacle.y > canvas.height) {
                obstacle.y = -60;
                obstacle.x = Math.random() * canvas.width;
                obstacle.swayOffset = 0;
            }
        }
    });
}

// Collision detection
function checkCollisions() {
    // Check cloud collisions
    clouds.forEach(cloud => {
        if (!cloud.eaten && isColliding(player, cloud)) {
            cloud.eaten = true;
            score++;
            document.getElementById('score').textContent = score;

            // Trigger eating animation (show eating face for 15 frames)
            player.eatingTimer = 15;

            // Play eat sound
            const eatSound = document.getElementById('eatSound');
            eatSound.currentTime = 0;
            eatSound.play().catch(e => console.log('Sound play failed'));

            // Spawn 2 new clouds every 2 clouds eaten (until we reach the total)
            if (score >= nextSpawnScore && cloudsSpawned < totalCloudCount) {
                spawnNewCloud();
                if (cloudsSpawned < totalCloudCount) {
                    spawnNewCloud();
                }
                nextSpawnScore += 2;
            }

            if (score >= totalCloudCount) {
                endGame(true, 'Dood got to eat all 15 clouds!');
            }
        }
    });

    // Check obstacle collisions (skip during invulnerability period)
    if (invulnerabilityTimer > 0) {
        invulnerabilityTimer--;
    }

    obstacles.forEach(obstacle => {
        // Skip collision check during invulnerability period
        if (invulnerabilityTimer > 0) {
            return;
        }

        // Skip collision check if obstacle is not substantially on-screen (at least 50% visible)
        const obstacleRight = obstacle.x + obstacle.width / 2;
        const obstacleLeft = obstacle.x - obstacle.width / 2;

        // Calculate how much of the obstacle is visible
        const visibleLeft = Math.max(0, obstacleLeft);
        const visibleRight = Math.min(canvas.width, obstacleRight);
        const visibleWidth = Math.max(0, visibleRight - visibleLeft);
        const percentVisible = visibleWidth / obstacle.width;

        // Only check collision if at least 50% of obstacle is visible
        const isSubstantiallyVisible = percentVisible >= 0.5;

        if (isSubstantiallyVisible && isColliding(player, obstacle)) {
            console.log('COLLISION DETECTED:', {
                type: obstacle.type,
                obstacleX: obstacle.x,
                obstacleY: obstacle.y,
                obstacleWidth: obstacle.width,
                obstacleHeight: obstacle.height,
                playerX: player.x,
                playerY: player.y,
                percentVisible: percentVisible
            });
            endGame(false, 'CRAP!! Dood hit a ' + obstacle.type + '!');
        }
    });
}

function isColliding(obj1, obj2) {
    // Reduce collision area very aggressively for large obstacles
    let obstaclePadding = 0;
    if (obj2.type === 'airplane' || obj2.type === 'ufo') {
        obstaclePadding = 0.4; // 80% reduction (40% on each side)
    } else if (obj2.type === 'parachute') {
        obstaclePadding = 0.35; // 70% reduction (35% on each side)
    } else if (obj2.type === 'bird') {
        obstaclePadding = 0.3; // 60% reduction (30% on each side)
    }

    // Also reduce player hitbox by 30% (15% on each side) since sprite has transparent areas
    const playerPadding = 0.15;

    const obj1Left = obj1.x - obj1.width / 2 + (obj1.width * playerPadding);
    const obj1Right = obj1.x + obj1.width / 2 - (obj1.width * playerPadding);
    const obj1Top = obj1.y - obj1.height / 2 + (obj1.height * playerPadding);
    const obj1Bottom = obj1.y + obj1.height / 2 - (obj1.height * playerPadding);

    const obj2Left = obj2.x - obj2.width / 2 + (obj2.width * obstaclePadding);
    const obj2Right = obj2.x + obj2.width / 2 - (obj2.width * obstaclePadding);
    const obj2Top = (obj2.renderY || obj2.y) - obj2.height / 2 + (obj2.height * obstaclePadding);
    const obj2Bottom = (obj2.renderY || obj2.y) + obj2.height / 2 - (obj2.height * obstaclePadding);

    return obj1Left < obj2Right &&
           obj1Right > obj2Left &&
           obj1Top < obj2Bottom &&
           obj1Bottom > obj2Top;
}

// Drawing functions
function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.rotation * Math.PI / 180);

    // Draw Dood using original images
    const doodImg = player.imageIndex === 0 ? images.dood1 : images.dood2;
    ctx.drawImage(doodImg, -player.width / 2, -player.height / 2, player.width, player.height);

    ctx.restore();
}

function drawClouds() {
    clouds.forEach(cloud => {
        if (!cloud.eaten) {
            const y = cloud.renderY || cloud.y;

            // Draw cloud using original image
            ctx.drawImage(
                images.cloud,
                cloud.x - cloud.width / 2,
                y - cloud.height / 2,
                cloud.width,
                cloud.height
            );
        }
    });
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.save();

        if (obstacle.type === 'airplane') {
            // Flip image based on direction (default image faces right, travels left to right)
            if (obstacle.direction > 0) {
                // Moving right - use default orientation
                ctx.drawImage(images.airplane, obstacle.x - obstacle.width / 2, obstacle.y - obstacle.height / 2, obstacle.width, obstacle.height);
            } else {
                // Moving left - flip the image
                ctx.translate(obstacle.x + obstacle.width / 2, obstacle.y);
                ctx.scale(-1, 1);
                ctx.drawImage(images.airplane, -obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height);
            }
        } else if (obstacle.type === 'bird') {
            // Bird - simple drawing
            ctx.fillStyle = '#8B4513';
            const flapOffset = Math.sin(obstacle.flap) * 5;
            ctx.beginPath();
            ctx.moveTo(obstacle.x, obstacle.y);
            ctx.lineTo(obstacle.x - 10, obstacle.y - 5 + flapOffset);
            ctx.lineTo(obstacle.x - 15, obstacle.y);
            ctx.moveTo(obstacle.x, obstacle.y);
            ctx.lineTo(obstacle.x + 10, obstacle.y - 5 + flapOffset);
            ctx.lineTo(obstacle.x + 15, obstacle.y);
            ctx.stroke();
        } else if (obstacle.type === 'ufo') {
            // Flip UFO image based on direction (default image faces right, travels left to right)
            if (obstacle.direction > 0) {
                // Moving right - use default orientation
                ctx.drawImage(images.ufo, obstacle.x - obstacle.width / 2, obstacle.y - obstacle.height / 2, obstacle.width, obstacle.height);
            } else {
                // Moving left - flip the image
                ctx.translate(obstacle.x + obstacle.width / 2, obstacle.y);
                ctx.scale(-1, 1);
                ctx.drawImage(images.ufo, -obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height);
            }
        } else if (obstacle.type === 'parachute') {
            // Parachute - simple drawing
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(obstacle.x, obstacle.y, 20, 0, Math.PI, true);
            ctx.stroke();
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(obstacle.x - 5, obstacle.y + 20, 10, 15);
        }

        ctx.restore();
    });
}

function drawSky() {
    // Draw sun using original image - 20% larger - positioned for vertical canvas
    ctx.drawImage(images.sun, canvas.width - 150, 30, 132, 132);
}

// Game loop
function gameLoop() {
    if (gameState !== 'playing') return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw sky elements
    drawSky();

    // Update
    updatePlayer();
    updateClouds();
    updateObstacles();
    checkCollisions();

    // Draw
    drawClouds();
    drawObstacles();
    drawPlayer();

    requestAnimationFrame(gameLoop);
}

function endGame(won, message) {
    gameState = won ? 'won' : 'lost';
    clearInterval(gameTimer);

    const gameOverDiv = document.getElementById('gameOver');
    const gameOverText = document.getElementById('gameOverText');

    gameOverText.textContent = message;
    gameOverDiv.classList.remove('hidden');

    const bgMusic = document.getElementById('bgMusic');
    bgMusic.pause();
}

// Button handlers
document.getElementById('restartBtn').addEventListener('click', () => {
    location.reload();
});

// Start game when images are loaded
function checkImagesLoaded() {
    console.log('Checking images:', imagesLoaded, '/', totalImages);
    if (imagesLoaded === totalImages) {
        console.log('Starting game!');
        init();
    } else {
        setTimeout(checkImagesLoaded, 100);
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkImagesLoaded);
} else {
    checkImagesLoaded();
}
