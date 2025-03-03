const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set base design size
const DESIGN_WIDTH = 375;
const DESIGN_HEIGHT = 667;

// Adjust canvas size to fit viewport
function resizeCanvas() {
    const aspectRatio = DESIGN_WIDTH / DESIGN_HEIGHT;
    let newWidth = window.innerWidth;
    let newHeight = window.innerWidth / aspectRatio;

    if (newHeight > window.innerHeight) {
        newHeight = window.innerHeight;
        newWidth = newHeight * aspectRatio;
    }

    canvas.width = DESIGN_WIDTH; // Logical size for game logic
    canvas.height = DESIGN_HEIGHT;
    canvas.style.width = `${newWidth}px`; // Visible size
    canvas.style.height = `${newHeight}px`;
    ctx.scale(DESIGN_WIDTH / newWidth, DESIGN_HEIGHT / newHeight); // Scale drawing context
}

// Initial resize and listen for window resize
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

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
const cowSizeSlider = document.getElementById('cowSizeSlider');
const cowSizeValue = document.getElementById('cowSizeValue');
const hitRadiusSlider = document.getElementById('hitRadiusSlider');
const hitRadiusValue = document.getElementById('hitRadiusValue');
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

// Load cow and background images with error handling
const cowRegular = new Image();
cowRegular.src = 'cow-regular.png';
cowRegular.onload = () => console.log('cow-regular.png loaded');
cowRegular.onerror = () => console.error('Failed to load cow-regular.png');
const cowFlapped = new Image();
cowFlapped.src = 'cow-flapped.png';
cowFlapped.onload = () => console.log('cow-flapped.png loaded');
cowFlapped.onerror = () => console.error('Failed to load cow-flapped.png');
const farmBackground = new Image();
farmBackground.src = 'farm-background.png';
farmBackground.onload = () => console.log('farm-background.png loaded');
farmBackground.onerror = () => console.error('Failed to load farm-background.png');

// Game variables
let cow = {
    x: 50,
    y: DESIGN_HEIGHT / 2,
    radius: cowSizeSlider ? parseInt(cowSizeSlider.value) : 20,
    hitRadius: hitRadiusSlider ? parseInt(hitRadiusSlider.value) : 20,
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
let pipeSpeed = speedSlider ? parseFloat(speedSlider.value) : 2;
let score = 0;
let highScore = localStorage.getItem('flappyHighScore') ? parseInt(localStorage.getItem('flappyHighScore')) : 0;
let gameOver = false;
let gameStarted = false;
const pipeSpacing = 200;
let backgroundX = 0;
const backgroundSpeed = pipeSpeed * 0.5;

// Update high score display on start menu
if (highScoreDisplay) highScoreDisplay.textContent = highScore;

// Update speed display and background speed
if (speedSlider) {
    speedSlider.addEventListener('input', () => {
        speedValue.textContent = speedSlider.value;
        pipeSpeed = parseFloat(speedSlider.value);
    });
}

// Update cow size display
if (cowSizeSlider) {
    cowSizeSlider.addEventListener('input', () => {
        cowSizeValue.textContent = cowSizeSlider.value;
        cow.radius = parseInt(cowSizeSlider.value);
    });
}

// Update hit radius display
if (hitRadiusSlider) {
    hitRadiusSlider.addEventListener('input', () => {
        hitRadiusValue.textContent = hitRadiusSlider.value;
        cow.hitRadius = parseInt(hitRadiusSlider.value);
    });
}

// Pipe generation
function generatePipe() {
    const minTopHeight = cow.hitRadius + 50;
    const maxTopHeight = DESIGN_HEIGHT - pipeGap - cow.hitRadius - 50;
    const topHeight = Math.floor(Math.random() * (maxTopHeight - minTopHeight + 1)) + minTopHeight;

    pipes.push({
        x: DESIGN_WIDTH,
        topHeight: topHeight,
        bottomHeight: DESIGN_HEIGHT - topHeight - pipeGap
    });
    console.log('Pipe generated:', pipes[pipes.length - 1]);
}

let lastPipeX = DESIGN_WIDTH;

function updatePipes() {
    if (!gameStarted) return;

    if (pipes.length === 0 || (lastPipeX - pipeSpeed <= DESIGN_WIDTH - pipeSpacing)) {
        generatePipe();
        lastPipeX = DESIGN_WIDTH;
    }

    pipes.forEach((pipe, index) => {
        pipe.x -= pipeSpeed;

        if (
            cow.x + cow.hitRadius > pipe.x && 
            cow.x - cow.hitRadius < pipe.x + pipeWidth &&
            (cow.y - cow.hitRadius < pipe.topHeight || cow.y + cow.hitRadius > DESIGN_HEIGHT - pipe.bottomHeight)
        ) {
            if (!gameOver) {
                playSound('crash.wav');
                gameOver = true;
            }
        }

        if (pipe.x + pipeWidth < cow.x - cow.hitRadius && !pipe.passed) {
            score++;
            pipe.passed = true;
            playSound('point.wav');
        }

        if (pipe.x + pipeWidth < 0) {
            pipes.splice(index, 1);
            if (index === 0) lastPipeX = pipes.length > 0 ? pipes[0].x : DESIGN_WIDTH;
        }
    });

    if (pipes.length > 0) {
        lastPipeX = pipes[pipes.length - 1].x;
    }
}

// Cow movement and animation
function updateCow() {
    if (!gameStarted) return;
    cow.velocity += cow.gravity;
    cow.y += cow.velocity;

    cow.flapTimer += Math.abs(cow.velocity) * 0.02 + cow.flapSpeed;
    if (cow.flapTimer >= 1) {
        cow.flapTimer = 0;
        cow.flapping = !cow.flapping;
    }

    if (cow.y + cow.hitRadius > DESIGN_HEIGHT || cow.y - cow.hitRadius < 0) {
        if (!gameOver) {
            playSound('crash.wav');
            gameOver = true;
        }
    }
}

// Background movement
function updateBackground() {
    if (!gameStarted) return;
    backgroundX -= backgroundSpeed;
    if (backgroundX <= -DESIGN_WIDTH) {
        backgroundX += DESIGN_WIDTH;
    }
}

// Draw everything
function draw() {
    if (farmBackground.complete && farmBackground.naturalWidth > 0) {
        ctx.drawImage(farmBackground, backgroundX, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
        ctx.drawImage(farmBackground, backgroundX + DESIGN_WIDTH, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    } else {
        ctx.fillStyle = '#007745';
        ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, DESIGN_HEIGHT - 100, DESIGN_WIDTH, 100);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(50, DESIGN_HEIGHT - 100, 100, 60);
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(200, DESIGN_HEIGHT - 60, 50, 40);
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

        gradient = ctx.createLinearGradient(pipe.x, DESIGN_HEIGHT - pipe.bottomHeight, pipe.x + pipeWidth, DESIGN_HEIGHT - pipe.bottomHeight);
        gradient.addColorStop(0, '#228B22');
        gradient.addColorStop(1, '#32CD32');
        ctx.fillStyle = gradient;
        ctx.fillRect(pipe.x, DESIGN_HEIGHT - pipe.bottomHeight + capHeight, pipeWidth, pipe.bottomHeight - capHeight);
        ctx.fillStyle = '#006400';
        ctx.fillRect(pipe.x - 5, DESIGN_HEIGHT - pipe.bottomHeight, pipeWidth + 10, capHeight);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(pipe.x - 5, DESIGN_HEIGHT - pipe.bottomHeight, pipeWidth + 10, capHeight);
    });

    const cowImage = cow.flapping ? cowFlapped : cowRegular;
    const cowSize = cow.radius * 2;
    if (cowImage.complete && cowImage.naturalWidth > 0) {
        ctx.drawImage(cowImage, cow.x - cow.radius, cow.y - cow.radius, cowSize, cowSize);
    } else {
        console.log('Drawing fallback cow');
        ctx.beginPath();
        ctx.arc(cow.x, cow.y, cow.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'yellow';
        ctx.fill();
        ctx.closePath();
    }

    ctx.font = '30px Arial';
    const scoreText = `Score: ${score}`;
    const textWidth = ctx.measureText(scoreText).width;
    ctx.fillStyle = '#D4A67C';
    ctx.beginPath();
    ctx.roundRect(5, 10, textWidth + 10, 40, 10);
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

// Sound control helper with overlap
function playSound(soundFile) {
    if (soundToggle.checked) {
        const audio = new Audio(soundFile);
        console.log(`Playing sound: ${soundFile}`);
        audio.play().catch(error => console.error(`Error playing ${soundFile}:`, error));
    }
}

// Reset game state for play again
function resetGameForPlay() {
    cow.y = DESIGN_HEIGHT / 2;
    cow.velocity = 0;
    cow.radius = parseInt(cowSizeSlider.value);
    cow.hitRadius = parseInt(hitRadiusSlider.value);
    cow.flapping = false;
    cow.flapTimer = 0;
    pipes = [];
    score = 0;
    gameOver = false;
    lastPipeX = DESIGN_WIDTH;
    backgroundX = 0;
    gameOverMenu.style.display = 'none';
    playSound('background.mp3');
    generatePipe();
}

// Reset game state for main menu
function resetGame() {
    cow.y = DESIGN_HEIGHT / 2;
    cow.velocity = 0;
    cow.radius = cowSizeSlider ? parseInt(cowSizeSlider.value) : 20;
    cow.hitRadius = hitRadiusSlider ? parseInt(hitRadiusSlider.value) : 20;
    cow.flapping = false;
    cow.flapTimer = 0;
    pipes = [];
    score = 0;
    gameOver = false;
    gameStarted = false;
    lastPipeX = DESIGN_WIDTH;
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
        updateCow();
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
        cow.velocity = cow.jump;
        cow.flapping = true;
        playSound('jump.mp3');
    }
});

// Start game on button click
startButton.addEventListener('click', () => {
    console.log('Start Game clicked');
    if (startMenu) startMenu.style.display = 'none';
    if (canvas) canvas.style.display = 'block';
    gameStarted = true;
    pipeSpeed = speedSlider ? parseFloat(speedSlider.value) : 2;
    cow.radius = cowSizeSlider ? parseInt(cowSizeSlider.value) : 20;
    cow.hitRadius = hitRadiusSlider ? parseInt(hitRadiusSlider.value) : 20;
    playSound('background.mp3');
    generatePipe();
    lastPipeX = DESIGN_WIDTH;
    console.log('Game started, cow:', cow, 'pipes:', pipes);
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
