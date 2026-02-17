// Game canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Detect mobile
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

// Game state
let gameState = 'playing'; // playing, won, lost
let score = 0;
let timeLeft = 60;
let gameTimer;

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
    y: canvas.height - 130,
    width: 110,
    height: 110,
    speed: 7,
    rotation: 0,
    vx: 0,
    vy: 0,
    imageIndex: 0
};

// Keyboard state
const keys = {};

// Clouds array
const clouds = [];
const cloudCount = 10;

// Obstacles array
const obstacles = [];

// Initialize game
function init() {
    // Hide loading message
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) loadingDiv.style.display = 'none';

    // Show mobile controls if on mobile
    if (isMobile) {
        const mobileControls = document.getElementById('mobileControls');
        if (mobileControls) {
            mobileControls.classList.remove('hidden');
            setupMobileControls();
        }
        // Update instructions for mobile
        const controlsText = document.getElementById('controlsText');
        if (controlsText) {
            controlsText.textContent = 'Use on-screen controls to move Dood and eat all 10 clouds!';
        }
    }

    // Create clouds (scaled up bigger)
    for (let i = 0; i < cloudCount; i++) {
        clouds.push({
            x: Math.random() * (canvas.width - 150) + 75,
            y: Math.random() * (canvas.height - 200) + 70,
            width: 140,
            height: 70,
            eaten: false,
            floatOffset: Math.random() * Math.PI * 2,
            floatSpeed: 0.02 + Math.random() * 0.02
        });
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
    // Airplane (even bigger)
    obstacles.push({
        type: 'airplane',
        x: canvas.width,
        y: 80,
        width: 220,
        height: 70,
        speed: 2.8,
        direction: -1
    });

    // Birds (even bigger)
    for (let i = 0; i < 3; i++) {
        obstacles.push({
            type: 'bird',
            x: Math.random() * canvas.width,
            y: 120 + i * 95,
            width: 45,
            height: 36,
            speed: 2.1 + Math.random(),
            direction: Math.random() > 0.5 ? 1 : -1,
            flap: 0
        });
    }

    // UFO (even bigger)
    obstacles.push({
        type: 'ufo',
        x: 150,
        y: 50,
        width: 180,
        height: 110,
        speed: 2.1,
        direction: 1
    });

    // Parachute (even bigger)
    obstacles.push({
        type: 'parachute',
        x: Math.random() * canvas.width,
        y: 0,
        width: 70,
        height: 110,
        speed: 1.1,
        direction: 1
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

// Mobile controls setup
function setupMobileControls() {
    const buttons = document.querySelectorAll('.dpad-btn');

    buttons.forEach(btn => {
        const key = btn.dataset.key;

        // Touch start - activate key
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            keys[key] = true;
        });

        // Touch end - deactivate key
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            keys[key] = false;
        });

        // Also handle mouse for testing
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            keys[key] = true;
        });

        btn.addEventListener('mouseup', (e) => {
            e.preventDefault();
            keys[key] = false;
        });
    });
}

// Update player
function updatePlayer() {
    player.vx = 0;
    player.vy = 0;

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

    player.x += player.vx;
    player.y += player.vy;

    // Boundary checking
    player.x = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, player.x));
    player.y = Math.max(player.height / 2, Math.min(canvas.height - player.height / 2, player.y));

    // Alternate between images for animation
    if (player.vx !== 0 || player.vy !== 0) {
        if (Math.random() > 0.9) {
            player.imageIndex = player.imageIndex === 0 ? 1 : 0;
        }
    }
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
}

// Update obstacles
function updateObstacles() {
    obstacles.forEach(obstacle => {
        if (obstacle.type === 'airplane' || obstacle.type === 'ufo') {
            obstacle.x += obstacle.speed * obstacle.direction;

            if (obstacle.x > canvas.width + 100 || obstacle.x < -100) {
                obstacle.direction *= -1;
                obstacle.y = 30 + Math.random() * 100;
            }
        } else if (obstacle.type === 'bird') {
            obstacle.x += obstacle.speed * obstacle.direction;
            obstacle.flap += 0.2;

            if (obstacle.x > canvas.width + 30 || obstacle.x < -30) {
                obstacle.direction *= -1;
            }
        } else if (obstacle.type === 'parachute') {
            obstacle.y += obstacle.speed;
            obstacle.x += Math.sin(obstacle.y * 0.02) * 2;

            if (obstacle.y > canvas.height) {
                obstacle.y = -60;
                obstacle.x = Math.random() * canvas.width;
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

            // Play eat sound
            const eatSound = document.getElementById('eatSound');
            eatSound.currentTime = 0;
            eatSound.play().catch(e => console.log('Sound play failed'));

            if (score >= cloudCount) {
                endGame(true, 'Dood got to eat all 10 clouds!');
            }
        }
    });

    // Check obstacle collisions
    obstacles.forEach(obstacle => {
        if (isColliding(player, obstacle)) {
            endGame(false, 'CRAP!! Dood hit a ' + obstacle.type + '!');
        }
    });
}

function isColliding(obj1, obj2) {
    const obj1Left = obj1.x - obj1.width / 2;
    const obj1Right = obj1.x + obj1.width / 2;
    const obj1Top = obj1.y - obj1.height / 2;
    const obj1Bottom = obj1.y + obj1.height / 2;

    const obj2Left = obj2.x - obj2.width / 2;
    const obj2Right = obj2.x + obj2.width / 2;
    const obj2Top = (obj2.renderY || obj2.y) - obj2.height / 2;
    const obj2Bottom = (obj2.renderY || obj2.y) + obj2.height / 2;

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
            // Flip image if going right
            if (obstacle.direction > 0) {
                ctx.translate(obstacle.x + obstacle.width / 2, obstacle.y);
                ctx.scale(-1, 1);
                ctx.drawImage(images.airplane, -obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height);
            } else {
                ctx.drawImage(images.airplane, obstacle.x - obstacle.width / 2, obstacle.y - obstacle.height / 2, obstacle.width, obstacle.height);
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
            // Flip UFO image if going right
            if (obstacle.direction > 0) {
                ctx.translate(obstacle.x + obstacle.width / 2, obstacle.y);
                ctx.scale(-1, 1);
                ctx.drawImage(images.ufo, -obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height);
            } else {
                ctx.drawImage(images.ufo, obstacle.x - obstacle.width / 2, obstacle.y - obstacle.height / 2, obstacle.width, obstacle.height);
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
    // Draw sun using original image (even bigger)
    ctx.drawImage(images.sun, 720, 30, 110, 110);
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

document.getElementById('mainMenuBtn').addEventListener('click', () => {
    window.location.href = '../../mainscreen.html';
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
