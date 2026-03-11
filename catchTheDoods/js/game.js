// Game canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Load images
const sadDoodImg = new Image();
sadDoodImg.src = 'assets/images/sad_dood2.png';

// Initialize leaderboard manager
const leaderboard = new LeaderboardManager('catchTheDoods');

// Mobile detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

// Canvas sizing
if (isMobile) {
    canvas.width = Math.min(window.innerWidth - 20, 500);
    canvas.height = Math.min(window.innerHeight - 200, 800);
} else {
    canvas.width = 800;
    canvas.height = 600;
}

// Game variables
let gameState = 'playing';
let score = 0;
let timeLeft = 45;
let lives = 3;
let basketX = canvas.width / 2;
const basketWidth = isMobile ? 100 : 120;
const basketHeight = isMobile ? 25 : 30;
let basketSpeed = isMobile ? 8 : 10;

// Falling objects array
let fallingObjects = [];
let spawnTimer = 0;
let spawnDelay = 60; // frames (1 second at 60fps)

// Speed multiplier for mobile
const speedMultiplier = isMobile ? 1.2 : 1;

// Mouse/touch controls
let mouseX = canvas.width / 2;
let keysPressed = {};

// Difficulty levels
function getDifficulty() {
    if (score >= 31) return { level: 4, goodChance: 0.4, maxObjects: 6, speedRange: [4, 7] };
    if (score >= 21) return { level: 3, goodChance: 0.5, maxObjects: 5, speedRange: [3.5, 6] };
    if (score >= 11) return { level: 2, goodChance: 0.7, maxObjects: 4, speedRange: [2.5, 5] };
    return { level: 1, goodChance: 0.8, maxObjects: 3, speedRange: [2, 4] };
}

// Falling object types
const objectTypes = {
    goodDood: {
        type: 'good',
        points: 1,
        emoji: '😊',
        color: '#FFD700'
    },
    goldenDood: {
        type: 'good',
        points: 3,
        emoji: '🌟',
        color: '#FFA500'
    },
    sadDood: {
        type: 'bad',
        image: sadDoodImg,
        color: '#E74C3C'
    }
};

// Create falling object
function createFallingObject() {
    const difficulty = getDifficulty();
    const random = Math.random();

    let objectType;
    if (random < 0.05) {
        // 5% chance for golden Dood
        objectType = objectTypes.goldenDood;
    } else if (random < difficulty.goodChance) {
        objectType = objectTypes.goodDood;
    } else {
        // Bad object - sad Dood
        objectType = objectTypes.sadDood;
    }

    const speed = (difficulty.speedRange[0] + Math.random() * (difficulty.speedRange[1] - difficulty.speedRange[0])) * speedMultiplier;

    return {
        x: Math.random() * (canvas.width - 60) + 30,
        y: -50,
        width: 50,
        height: 50,
        speed: speed,
        ...objectType
    };
}

// Draw basket
function drawBasket() {
    // Basket body
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(basketX - basketWidth / 2, canvas.height - basketHeight - 10, basketWidth, basketHeight);

    // Basket rim
    ctx.fillStyle = '#654321';
    ctx.fillRect(basketX - basketWidth / 2 - 5, canvas.height - basketHeight - 15, basketWidth + 10, 5);

    // Basket pattern (weave effect)
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
        const x = basketX - basketWidth / 2 + (i * basketWidth / 5);
        ctx.beginPath();
        ctx.moveTo(x, canvas.height - basketHeight - 10);
        ctx.lineTo(x, canvas.height - 10);
        ctx.stroke();
    }
}

// Draw falling object
function drawFallingObject(obj) {
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(obj.x, obj.y + obj.height + 5, obj.width / 2, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Check if object has an image
    if (obj.image) {
        // Draw image (sad_dood2.png)
        const imageSize = obj.width * 1.2;
        ctx.drawImage(obj.image, obj.x - imageSize / 2, obj.y - imageSize / 2, imageSize, imageSize);

        // Draw skull emoji above Dood's head
        ctx.font = `${obj.width * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw emoji with a slight outline for visibility
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.strokeText('💀', obj.x, obj.y - imageSize / 2 - 10);
        ctx.fillText('💀', obj.x, obj.y - imageSize / 2 - 10);
    } else {
        // Object background circle
        ctx.fillStyle = obj.color;
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, obj.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Emoji
        ctx.font = `${obj.width * 0.8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(obj.emoji, obj.x, obj.y);
    }
}

// Update game objects
function updateGame() {
    if (gameState !== 'playing') return;

    // Update basket position based on controls
    if (keysPressed['ArrowLeft']) {
        basketX -= basketSpeed;
    }
    if (keysPressed['ArrowRight']) {
        basketX += basketSpeed;
    }

    // Mouse/touch control
    if (!isMobile || mouseX !== null) {
        basketX += (mouseX - basketX) * 0.15;
    }

    // Keep basket in bounds
    basketX = Math.max(basketWidth / 2, Math.min(canvas.width - basketWidth / 2, basketX));

    // Spawn falling objects
    spawnTimer++;
    const difficulty = getDifficulty();

    if (spawnTimer >= spawnDelay && fallingObjects.length < difficulty.maxObjects) {
        fallingObjects.push(createFallingObject());
        spawnTimer = 0;
        // Speed up spawning as difficulty increases
        spawnDelay = Math.max(30, 60 - (difficulty.level - 1) * 10);
    }

    // Update falling objects
    for (let i = fallingObjects.length - 1; i >= 0; i--) {
        const obj = fallingObjects[i];
        obj.y += obj.speed;

        // Check collision with basket
        if (obj.y + obj.height / 2 >= canvas.height - basketHeight - 10 &&
            obj.y + obj.height / 2 <= canvas.height - 10 &&
            obj.x >= basketX - basketWidth / 2 &&
            obj.x <= basketX + basketWidth / 2) {

            if (obj.type === 'good') {
                score += obj.points;
                updateScoreDisplay();
                showFloatingScore(obj.points, obj.x);
            } else {
                lives--;
                updateLivesDisplay();
                if (lives <= 0) {
                    endGame();
                }
            }

            fallingObjects.splice(i, 1);
            continue;
        }

        // Remove objects that fall off screen
        if (obj.y > canvas.height + 100) {
            fallingObjects.splice(i, 1);
        }
    }
}

// Draw game
function drawGame() {
    // Clear canvas with sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw clouds (background decoration)
    drawClouds();

    // Draw falling objects
    fallingObjects.forEach(obj => drawFallingObject(obj));

    // Draw basket
    drawBasket();

    // Draw difficulty level indicator
    const difficulty = getDifficulty();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Level ${difficulty.level}`, 10, 25);
}

// Draw background clouds
let cloudPositions = [];
function initClouds() {
    for (let i = 0; i < 5; i++) {
        cloudPositions.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * 0.6,
            size: 30 + Math.random() * 40,
            speed: 0.2 + Math.random() * 0.3
        });
    }
}

function drawClouds() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    cloudPositions.forEach(cloud => {
        // Move cloud
        cloud.x += cloud.speed;
        if (cloud.x > canvas.width + cloud.size) {
            cloud.x = -cloud.size;
            cloud.y = Math.random() * canvas.height * 0.6;
        }

        // Draw cloud (3 circles)
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.size * 0.6, cloud.y - cloud.size * 0.3, cloud.size * 0.8, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.size * 1.2, cloud.y, cloud.size * 0.9, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Floating score animation
let floatingScores = [];
function showFloatingScore(points, x) {
    floatingScores.push({
        text: `+${points}`,
        x: x,
        y: canvas.height - basketHeight - 40,
        opacity: 1,
        life: 60
    });
}

function updateFloatingScores() {
    for (let i = floatingScores.length - 1; i >= 0; i--) {
        const fs = floatingScores[i];
        fs.y -= 1;
        fs.opacity -= 0.016;
        fs.life--;

        ctx.save();
        ctx.globalAlpha = fs.opacity;
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(fs.text, fs.x, fs.y);
        ctx.fillText(fs.text, fs.x, fs.y);
        ctx.restore();

        if (fs.life <= 0) {
            floatingScores.splice(i, 1);
        }
    }
}

// Update UI displays
function updateScoreDisplay() {
    document.getElementById('score').textContent = score;
}

function updateTimeDisplay() {
    document.getElementById('time').textContent = timeLeft;
}

function updateLivesDisplay() {
    const hearts = '❤️'.repeat(lives) + '🖤'.repeat(3 - lives);
    document.getElementById('lives').textContent = hearts;
}

// Timer
let timerInterval;
function startTimer() {
    timerInterval = setInterval(() => {
        if (gameState !== 'playing') return;

        timeLeft--;
        updateTimeDisplay();

        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

// End game
function endGame() {
    gameState = 'ended';
    clearInterval(timerInterval);

    const endScreen = document.getElementById('endScreen');
    const endTitle = document.getElementById('endTitle');
    const endMessage = document.getElementById('endMessage');
    const endImage = document.getElementById('endImage');
    const endContent = endScreen.querySelector('.end-content');

    // Remove previous tier classes
    endContent.classList.remove('tier-bad', 'tier-okay', 'tier-good', 'tier-amazing');

    // Determine tier and message
    if (lives === 0) {
        endContent.classList.add('tier-bad');
        endTitle.textContent = 'Game Over!';
        endMessage.textContent = `You ran out of lives! Final score: ${score} Doods caught.`;
        endImage.src = '../assets/dood.png';
        endImage.style.display = 'block';
    } else if (score === 0) {
        endContent.classList.add('tier-bad');
        endTitle.textContent = 'Oops!';
        endMessage.textContent = 'You didn\'t catch any Doods! Try again!';
        endImage.src = '../assets/dood.png';
        endImage.style.display = 'block';
    } else if (score <= 5) {
        endContent.classList.add('tier-bad');
        endTitle.textContent = 'Nice Try!';
        endMessage.textContent = `You only caught ${score} Dood${score === 1 ? '' : 's'}. Keep practicing!`;
        endImage.src = '../assets/dood.png';
        endImage.style.display = 'block';
    } else if (score <= 15) {
        endContent.classList.add('tier-okay');
        endTitle.textContent = 'Not Bad!';
        endMessage.textContent = `You caught ${score} Doods! Getting better!`;
        endImage.src = '../assets/dood.png';
        endImage.style.display = 'block';
    } else if (score <= 25) {
        endContent.classList.add('tier-good');
        endTitle.textContent = 'Great Job!';
        endMessage.textContent = `Awesome! You caught ${score} Doods!`;
        endImage.src = '../assets/dood.png';
        endImage.style.display = 'block';
    } else {
        endContent.classList.add('tier-amazing');
        endTitle.textContent = 'AMAZING!';
        endMessage.textContent = `You're a Dood-catching master! ${score} Doods caught!`;
        endImage.src = '../eatTheClouds/assets/images/dood2.png';
        endImage.style.display = 'block';
    }

    // Check and update personal best
    const personalBestElement = document.getElementById('personalBest');
    const previousBest = leaderboard.getPersonalBest();
    const newRecord = leaderboard.savePersonalBest(score);

    if (newRecord && score > 0) {
        personalBestElement.textContent = `🎉 NEW RECORD! Previous best: ${previousBest}`;
        personalBestElement.classList.add('new-record');
    } else if (previousBest > 0) {
        personalBestElement.textContent = `Your Personal Best: ${previousBest}`;
        personalBestElement.classList.remove('new-record');
    } else {
        personalBestElement.textContent = '';
    }

    // Show submit section if score > 0
    const submitSection = document.getElementById('submitSection');
    if (score > 0) {
        submitSection.classList.remove('hidden');
        // Pre-fill with saved name if exists
        const savedName = localStorage.getItem('playerName') || '';
        document.getElementById('playerName').value = savedName;
    } else {
        submitSection.classList.add('hidden');
    }

    endScreen.classList.remove('hidden');
}

// Game loop
function gameLoop() {
    if (gameState === 'playing') {
        updateGame();
        drawGame();
        updateFloatingScores();
        requestAnimationFrame(gameLoop);
    }
}

// Event listeners
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    mouseX = e.touches[0].clientX - rect.left;
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    mouseX = e.touches[0].clientX - rect.left;
});

document.addEventListener('keydown', (e) => {
    keysPressed[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keysPressed[e.key] = false;
});

document.getElementById('playAgainBtn').addEventListener('click', () => {
    location.reload();
});

// Submit to leaderboard
document.getElementById('submitBtn').addEventListener('click', async () => {
    const submitBtn = document.getElementById('submitBtn');
    const playerNameInput = document.getElementById('playerName');
    const submitMessage = document.getElementById('submitMessage');

    // Get player name
    const playerName = playerNameInput.value.trim() || 'Anonymous';

    // Disable button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    submitMessage.textContent = '';
    submitMessage.classList.remove('success', 'error');

    try {
        // Check if can submit
        if (!leaderboard.canSubmitToGlobal()) {
            const seconds = leaderboard.getTimeUntilNextSubmit();
            throw new Error(`Please wait ${Math.ceil(seconds / 60)} minutes before submitting again`);
        }

        // Save player name for next time
        if (playerName !== 'Anonymous') {
            localStorage.setItem('playerName', playerName);
        }

        // Submit score
        const result = await leaderboard.submitToGlobal(score, playerName);

        // Show success message
        submitMessage.textContent = `✓ Score submitted! You ranked #${result.rank} out of ${result.totalPlayers} players!`;
        submitMessage.classList.add('success');

        // Hide submit section after success
        setTimeout(() => {
            document.getElementById('submitSection').classList.add('hidden');
        }, 3000);

    } catch (error) {
        // Show error message
        submitMessage.textContent = error.message || 'Failed to submit score. Try again later.';
        submitMessage.classList.add('error');

        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit to Leaderboard';
    }
});

// Initialize game
function initGame() {
    initClouds();
    updateScoreDisplay();
    updateTimeDisplay();
    updateLivesDisplay();
    startTimer();
    gameLoop();
}

// Start game when page loads
window.addEventListener('load', initGame);

// Handle window resize on mobile
window.addEventListener('resize', () => {
    if (isMobile) {
        canvas.width = Math.min(window.innerWidth - 20, 500);
        canvas.height = Math.min(window.innerHeight - 200, 800);
        basketX = canvas.width / 2;
    }
});
