const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 375;
canvas.height = 667;

// Audio elements
const backgroundMusic = document.getElementById('backgroundMusic');
const jumpSound = document.getElementById('jumpSound');
const crashSound = document.getElementById('crashSound');
const pointSound = document.getElementById('pointSound');

// Menu elements
const startMenu = document.getElementById('startMenu');
const settingsMenu = document.getElementById('settingsMenu');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const birdSizeSlider = document.getElementById('birdSizeSlider');
const birdSizeValue = document.getElementById('birdSizeValue');
const soundToggle = document.getElementById('soundToggle');
const startButton = document.getElementById('startButton');
const settingsButton = document.getElementById('settingsButton');
const backButton = document.getElementById('backButton');
const gameOverMenu = document.getElementById('gameOverMenu');
const currentScoreDisplay = document.getElementById('currentScore');
const highScoreGameOverDisplay = document.getElementById('highScoreGameOver');
const playAgainButton = document.getElementById('playAgainButton');
const mainMenuButton = document.getElementById('mainMenuButton');
const highScoreDisplay = document.getElementById('highScoreDisplay');

// Load bird and background images
const birdRegular = new Image();
birdRegular.src = 'bird-regular.png';
const birdFlapped = new Image();
birdFlapped.src = 'bird-flapped.png';
const farmBackground = new Image();
farmBackground.src = 'farm-background.png';

// Game variables
let bird = {
    x: 50,
    y: canvas.height / 2,
    radius: parseInt(birdSizeSlider.value),
    velocity: 0,
    gravity: 0.5,
    jump: -10,
    flapping: false,
    flapTimer: 0,
    flapSpeed: 0.1
};

let pipes = [];
let pipeWidth = 50;
let pipeGap = 150;
let pipeSpeed = parseFloat(speedSlider.value);
let score = 0;
let highScore = localStorage.getItem('flappyHighScore') ? parseInt(localStorage.getItem('flappyHighScore')) : 0;
let gameOver = false;
let gameStarted = false;
const pipeSpacing = 200;
let backgroundX = 0;
const backgroundSpeed = pipeSpeed * 0.5;

// Update high score display on start menu
highScoreDisplay.textContent = highScore;

// Update speed display and background speed
speedSlider.addEventListener('input', () => {
    speedValue.textContent = speedSlider.value;
    pipeSpeed = parseFloat(speedSlider.value);
});

// Update bird size display
birdSizeSlider.addEventListener('input', () => {
    birdSizeValue.textContent = birdSizeSlider.value;
    bird.radius = parseInt(birdSizeSlider.value);
});

// Pipe generation
function generatePipe() {
    const minTopHeight = bird.radius + 50;
    const maxTopHeight = canvas.height - pipeGap - bird.radius - 50;
    const topHeight = Math.floor(Math.random() * (maxTopHeight - minTopHeight + 1)) + minTopHeight;

    pipes.push({
        x: canvas.width,
        topHeight: topHeight,
        bottomHeight: canvas.height - topHeight - pipeGap
    });
}

let lastPipeX = canvas.width;

function updatePipes() {
    if (!gameStarted) return;

    if (pipes.length === 0 || (lastPipeX - pipeSpeed <= canvas.width - pipeSpacing)) {
        generatePipe();
        lastPipeX = canvas.width;
    }

    pipes.forEach((pipe, index) => {
        pipe.x -= pipeSpeed;

        if (
            bird.x + bird.radius > pipe.x && 
            bird.x - bird.radius < pipe.x + pipeWidth &&
            (bird.y - bird.radius < pipe.topHeight || bird.y + bird.radius > canvas.height - pipe.bottomHeight)
        ) {
            if (!gameOver) {
                playSound(crashSound);
                gameOver = true;
            }
        }

        if (pipe.x + pipeWidth < bird.x - bird.radius && !pipe.passed) {
            score++;
            pipe.passed = true;
            playSound(pointSound);
        }

        if (pipe.x + pipeWidth < 0) {
            pipes.splice(index, 1);
            if (index === 0) lastPipeX = pipes.length > 0 ? pipes[0].x : canvas.width;
        }
    });

    if (pipes.length > 0) {
        lastPipeX = pipes[pipes.length - 1].x;
    }
}

// Bird movement and animation
function updateBird() {
    if (!gameStarted) return;
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    bird.flapTimer += Math.abs(bird.velocity) * 0.02 + bird.flapSpeed;
    if (bird.flapTimer >= 1) {
        bird.flapTimer = 0;
        bird.flapping = !bird.flapping;
    }

    if (bird.y + bird.radius > canvas.height || bird.y - bird.radius < 0) {
        if (!gameOver) {
            playSound(crashSound);
            gameOver = true;
        }
    }
}

// Background movement
function updateBackground() {
    if (!gameStarted) return;
    backgroundX -= backgroundSpeed;
    if (backgroundX <= -canvas.width) {
        backgroundX += canvas.width;
    }
}

// Draw everything
function draw() {
    if (farmBackground.complete && farmBackground.naturalWidth > 0) {
        ctx.drawImage(farmBackground, backgroundX, 0, canvas.width, canvas.height);
        ctx.drawImage(farmBackground, backgroundX + canvas.width, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(50, canvas.height - 100, 100, 60);
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(200, canvas.height - 60, 50, 40);
    }

    pipes.forEach(pipe => {
        const capHeight = 20;
        let gradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipeWidth, 0);
        gradient.addColorStop(0, '#228B22');
        gradient.addColorStop(1, '#32CD32');
        ctx.fillStyle = gradient;
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight - capHeight);
        ctx.fillStyle = '#006400';
        ctx.fillRect(pipe.x - 5, pipe.topHeight - capHeight, pipeWidth + 10, capHeight);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(pipe.x - 5, pipe.topHeight - capHeight, pipeWidth + 10, capHeight);

        gradient = ctx.createLinearGradient(pipe.x, canvas.height - pipe.bottomHeight, pipe.x + pipeWidth, canvas.height - pipe.bottomHeight);
        gradient.addColorStop(0, '#228B22');
        gradient.addColorStop(1, '#32CD32');
        ctx.fillStyle = gradient;
        ctx.fillRect(pipe.x, canvas.height - pipe.bottomHeight + capHeight, pipeWidth, pipe.bottomHeight - capHeight);
        ctx.fillStyle = '#006400';
        ctx.fillRect(pipe.x - 5, canvas.height - pipe.bottomHeight, pipeWidth + 10, capHeight);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(pipe.x - 5, canvas.height - pipe.bottomHeight, pipeWidth + 10, capHeight);
    });

    const birdImage = bird.flapping ? birdFlapped : birdRegular;
    const birdSize = bird.radius * 2;
    if (birdImage.complete) {
        ctx.drawImage(birdImage, bird.x - bird.radius, bird.y - bird.radius, birdSize, birdSize);
    } else {
        ctx.beginPath();
        ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'yellow';
        ctx.fill();
        ctx.closePath();
    }

    // Draw score with dynamic backdrop
    ctx.font = '30px Arial'; // Set font before measuring
    const scoreText = `Score: ${score}`;
    const textWidth = ctx.measureText(scoreText).width;
    ctx.fillStyle = '#D3D3D3'; // Light grey background
    ctx.beginPath();
    ctx.roundRect(5, 10, textWidth + 10, 40, 10); // Dynamic width + padding
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.fillText(scoreText, 10, 40);

    if (gameOver) {
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('flappyHighScore', highScore);
            highScoreDisplay.textContent = highScore;
            highScoreGameOverDisplay.textContent = highScore;
        }
        gameOverMenu.style.display = 'block';
        currentScoreDisplay.textContent = score;
        highScoreGameOverDisplay.textContent = highScore;
    }
}

// Sound control helper
function playSound(sound) {
    if (soundToggle.checked) {
        sound.play();
    }
}

// Reset game state for play again
function resetGameForPlay() {
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    bird.radius = parseInt(birdSizeSlider.value);
    bird.flapping = false;
    bird.flapTimer = 0;
    pipes = [];
    score = 0;
    gameOver = false;
    lastPipeX = canvas.width;
    backgroundX = 0;
    gameOverMenu.style.display = 'none';
    playSound(backgroundMusic);
    generatePipe();
}

// Reset game state for main menu
function resetGame() {
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    bird.radius = parseInt(birdSizeSlider.value);
    bird.flapping = false;
    bird.flapTimer = 0;
    pipes = [];
    score = 0;
    gameOver = false;
    gameStarted = false;
    lastPipeX = canvas.width;
    backgroundX = 0;
    canvas.style.display = 'none';
    gameOverMenu.style.display = 'none';
    settingsMenu.style.display = 'none';
    startMenu.style.display = 'block';
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
}

// Game loop
function gameLoop() {
    if (gameStarted && !gameOver) {
        updateBird();
        updatePipes();
        updateBackground();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

// Jump on tap/click
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!gameStarted) return;
    if (!gameOver) {
        bird.velocity = bird.jump;
        bird.flapping = true;
        playSound(jumpSound);
    }
});

// Start game on button click
startButton.addEventListener('click', () => {
    console.log('Start Game clicked');
    startMenu.style.display = 'none';
    canvas.style.display = 'block';
    gameStarted = true;
    pipeSpeed = parseFloat(speedSlider.value);
    bird.radius = parseInt(birdSizeSlider.value);
    playSound(backgroundMusic);
    generatePipe();
    lastPipeX = canvas.width;
});

// Settings menu navigation
settingsButton.addEventListener('click', () => {
    console.log('Settings clicked');
    startMenu.style.display = 'none';
    settingsMenu.style.display = 'block';
});

backButton.addEventListener('click', () => {
    console.log('Back clicked');
    settingsMenu.style.display = 'none';
    startMenu.style.display = 'block';
});

// Game over menu buttons
playAgainButton.addEventListener('click', () => {
    console.log('Play Again clicked');
    resetGameForPlay();
});

mainMenuButton.addEventListener('click', () => {
    console.log('Main Menu clicked');
    resetGame();
});

// Initial setup
console.log('Script loaded');
gameLoop();