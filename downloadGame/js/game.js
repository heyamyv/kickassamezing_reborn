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

// Calculate speed multiplier based on canvas height (baseline 400px)
// Use more aggressive multiplier for mobile to compensate for larger screens
const speedMultiplier = isMobile ? (canvas.height / 400) * 2.5 : 1;

// Game state
let gameState = 'playing'; // playing, won, lost
let score = 0;
let timeLeft = 20;
let gameTimer;

// File types
const fileTypes = [
    { name: 'Harry Potter 7', isVirus: false, color: '#cccccc' },
    { name: 'John Grisham Novel', isVirus: false, color: '#cccccc' },
    { name: 'Trolley Status', isVirus: false, color: '#cccccc' },
    { name: 'Dubai', isVirus: false, color: '#cccccc' },
    { name: 'evanescence sound track', isVirus: false, color: '#cccccc' },
    { name: 'Really good movie', isVirus: false, color: '#cccccc' },
    { name: 'burger menu', isVirus: false, color: '#cccccc' },
    { name: 'kroger belt catalog', isVirus: false, color: '#cccccc' },
    { name: '$_for_nigerian_prince', isVirus: true, color: '#cccccc' },
    { name: 'openME!.vir', isVirus: true, color: '#cccccc' },
    { name: 'virusforyou.zip', isVirus: true, color: '#cccccc' },
    { name: 'Trojan.exe', isVirus: true, color: '#cccccc' },
    { name: 'ILOVEYOU', isVirus: true, color: '#cccccc' },
    { name: 'DEF_CLICK_HERE', isVirus: true, color: '#cccccc' },
    { name: 'doom!', isVirus: true, color: '#cccccc' },
    { name: 'Harry Potter 9', isVirus: true, color: '#cccccc' }
];

// Generate random file size between 200KB and 1GB
function getRandomFileSize() {
    const sizeInMB = Math.floor(Math.random() * 824) + 200; // 200-1024 KB range
    if (sizeInMB >= 1000) {
        return (sizeInMB / 1024).toFixed(2) + ' GB';
    } else {
        return sizeInMB + ' KB';
    }
}

// Files array
const files = [];
let spawnTimer = 0;
const spawnDelay = 60; // Frames between spawns

// Initialize game
function init() {
    // Hide loading message
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) loadingDiv.style.display = 'none';

    // Clear files
    files.length = 0;

    // Reset game state
    gameState = 'playing';
    score = 0;
    timeLeft = 20;
    spawnTimer = 0;

    document.getElementById('score').textContent = score;
    document.getElementById('timer').textContent = timeLeft;

    // Start game timer
    startGameTimer();

    // Start game loop
    gameLoop();
}

function startGameTimer() {
    gameTimer = setInterval(() => {
        if (gameState === 'playing') {
            timeLeft--;
            document.getElementById('timer').textContent = timeLeft;

            if (timeLeft <= 0) {
                let message;
                let isWinner = false;
                let isZeroScore = false;

                if (score === 0) {
                    message = 'why you so bad at dis';
                    isZeroScore = true;
                } else if (score >= 10) {
                    message = 'Congrats';
                    isWinner = true;
                } else {
                    message = 'Time\'s up! You downloaded ' + score + ' files!';
                }

                endGame(true, message, isWinner, isZeroScore);
            }
        }
    }, 1000);
}

// Check if a position overlaps with existing files
function checkOverlap(x, y, width, height) {
    for (let file of files) {
        // Check if this position overlaps with an existing file
        // Add some padding to prevent files from being too close
        const padding = 10;
        if (x < file.x + file.width + padding &&
            x + width + padding > file.x &&
            y < file.y + file.height + padding &&
            y + height + padding > file.y) {
            return true;
        }
    }
    return false;
}

// Spawn a new file
function spawnFile() {
    // Random file type (50% chance of good file, 50% chance of virus)
    const isVirusRoll = Math.random();
    let fileType;

    if (isVirusRoll < 0.5) {
        // Good file
        const goodFiles = fileTypes.filter(f => !f.isVirus);
        fileType = {...goodFiles[Math.floor(Math.random() * goodFiles.length)]};
    } else {
        // Virus
        const viruses = fileTypes.filter(f => f.isVirus);
        fileType = {...viruses[Math.floor(Math.random() * viruses.length)]};
    }

    // Try to find a non-overlapping position
    const width = 180;
    const height = 60;
    const y = -50;
    let x;
    let attempts = 0;
    const maxAttempts = 20;

    do {
        x = Math.random() * (canvas.width - width);
        attempts++;
    } while (checkOverlap(x, y, width, height) && attempts < maxAttempts);

    // Only spawn if we found a non-overlapping position
    if (attempts < maxAttempts) {
        files.push({
            x: x,
            y: y,
            width: width,
            height: height,
            speed: (1 + Math.random() * 0.5) * speedMultiplier,
            size: getRandomFileSize(),
            ...fileType
        });
    }
}

// Update files
function updateFiles() {
    spawnTimer++;

    if (spawnTimer >= spawnDelay) {
        spawnFile();
        spawnTimer = 0;
    }

    // Move files down
    for (let i = files.length - 1; i >= 0; i--) {
        files[i].y += files[i].speed;

        // Remove files that are off screen
        if (files[i].y > canvas.height + 100) {
            files.splice(i, 1);
        }
    }
}

// Draw files
function drawFiles() {
    files.forEach(file => {
        // Draw file box
        ctx.fillStyle = file.color;
        ctx.fillRect(file.x, file.y, file.width, file.height);

        // Draw border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(file.x, file.y, file.width, file.height);

        // Draw file name with text wrapping
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 14px Courier, monospace';
        ctx.textAlign = 'left';

        const maxWidth = file.width - 20; // 10px padding on each side
        const words = file.name.split(' ');
        let line = '';
        let y = file.y + 20;

        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && i > 0) {
                ctx.fillText(line, file.x + 10, y);
                line = words[i] + ' ';
                y += 16;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, file.x + 10, y);

        // Draw file size
        ctx.font = '12px Courier, monospace';
        ctx.fillText(file.size, file.x + 10, file.y + 50);
    });
}

// Handle canvas click/touch
function handleClick(e) {
    if (gameState !== 'playing') return;

    const rect = canvas.getBoundingClientRect();
    let clickX, clickY;

    // Handle both mouse and touch events
    if (e.type === 'touchstart' || e.type === 'touchend') {
        e.preventDefault();
        const touch = e.touches[0] || e.changedTouches[0];
        clickX = (touch.clientX - rect.left) * (canvas.width / rect.width);
        clickY = (touch.clientY - rect.top) * (canvas.height / rect.height);
    } else {
        clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
        clickY = (e.clientY - rect.top) * (canvas.height / rect.height);
    }

    // Check if clicked on a file
    for (let i = files.length - 1; i >= 0; i--) {
        const file = files[i];
        if (clickX >= file.x && clickX <= file.x + file.width &&
            clickY >= file.y && clickY <= file.y + file.height) {

            if (file.isVirus) {
                // Clicked virus - game over
                // Play sound2
                const virusSound = document.getElementById('clickSound');
                virusSound.currentTime = 0;
                virusSound.volume = 0.5;
                virusSound.play().catch(e => console.log('Sound play failed'));

                endGame(false, 'BUSTED! You downloaded a virus and got caught!', false, false);
            } else {
                // Downloaded good file
                score++;
                document.getElementById('score').textContent = score;

                // Remove file
                files.splice(i, 1);
            }
            break;
        }
    }
}

canvas.addEventListener('click', handleClick);
canvas.addEventListener('touchstart', handleClick);
canvas.addEventListener('touchend', handleClick);

// Game loop
function gameLoop() {
    if (gameState !== 'playing') return;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid background (computer screen effect)
    ctx.strokeStyle = '#001100';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Update and draw
    updateFiles();
    drawFiles();

    requestAnimationFrame(gameLoop);
}

function endGame(won, message, isWinner = false, isZeroScore = false) {
    gameState = won ? 'won' : 'lost';
    clearInterval(gameTimer);

    const gameOverDiv = document.getElementById('gameOver');
    const gameOverText = document.getElementById('gameOverText');

    gameOverText.textContent = message;
    gameOverDiv.classList.remove('hidden');

    // Remove any existing images and containers
    const existingDelinquentImg = document.getElementById('delinquentImg');
    if (existingDelinquentImg) {
        existingDelinquentImg.remove();
    }
    const existingDoodImg = document.getElementById('doodImg');
    if (existingDoodImg) {
        existingDoodImg.remove();
    }
    const existingDoodDisappointed = document.getElementById('doodDisappointed');
    if (existingDoodDisappointed) {
        existingDoodDisappointed.remove();
    }
    const existingCongratsContainer = document.getElementById('congratsContainer');
    if (existingCongratsContainer) {
        existingCongratsContainer.remove();
    }

    // Reset gameOverText display
    gameOverText.style.display = 'block';

    // Check for different end game states
    if (isZeroScore) {
        // 0 files downloaded - show red border and "Dood disappointed" text
        gameOverDiv.classList.add('lost');

        const disappointedText = document.createElement('p');
        disappointedText.id = 'doodDisappointed';
        disappointedText.textContent = 'Dood disappointed';
        disappointedText.style.fontSize = '1.8em';
        disappointedText.style.marginTop = '20px';
        disappointedText.style.color = '#ff4444';
        gameOverDiv.insertBefore(disappointedText, document.getElementById('restartBtn'));
    } else if (!won) {
        // Virus clicked - show red border and delinquent image
        gameOverDiv.classList.add('lost');

        const delinquentImg = document.createElement('img');
        delinquentImg.id = 'delinquentImg';
        delinquentImg.src = 'assets/images/delinquent.jpg';
        delinquentImg.style.maxWidth = '300px';
        delinquentImg.style.marginTop = '20px';
        delinquentImg.style.borderRadius = '10px';
        gameOverDiv.insertBefore(delinquentImg, document.getElementById('restartBtn'));
    } else if (isWinner) {
        // Winner screen with dood2.png next to text
        gameOverDiv.classList.remove('lost');

        // Create a container for the congrats text and image
        const congratsContainer = document.createElement('div');
        congratsContainer.id = 'congratsContainer';
        congratsContainer.style.display = 'flex';
        congratsContainer.style.alignItems = 'center';
        congratsContainer.style.justifyContent = 'center';
        congratsContainer.style.gap = '20px';
        congratsContainer.style.marginTop = '20px';
        congratsContainer.style.flexWrap = 'wrap';

        // Move the congrats text into the container
        const congratsText = document.createElement('h2');
        congratsText.textContent = 'Congrats';
        congratsText.style.fontSize = '2.8em';
        congratsText.style.color = '#00ff00';
        congratsText.style.margin = '0';

        const doodImg = document.createElement('img');
        doodImg.id = 'doodImg';
        doodImg.src = 'assets/images/dood2.png';
        doodImg.style.maxWidth = '200px';
        doodImg.style.borderRadius = '10px';

        congratsContainer.appendChild(congratsText);
        congratsContainer.appendChild(doodImg);

        // Hide the original h2 text and insert the container
        gameOverText.style.display = 'none';
        gameOverDiv.insertBefore(congratsContainer, document.getElementById('restartBtn'));
    } else {
        gameOverDiv.classList.remove('lost');
        gameOverText.style.display = 'block';
    }
}

// Button handlers
document.getElementById('restartBtn').addEventListener('click', () => {
    location.reload();
});

// Wait for DOM to be ready and start game
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
