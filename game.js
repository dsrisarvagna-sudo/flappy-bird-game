console.log("game.js loaded");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const bird = new Bird();

let pipes = [];
let coins = [];

// Game states: "start" | "countdown" | "playing" | "dead"
let gameState = "start";

let paused = false;

let score = 0;            // Pipes crossed
let coinsCollected = 0;   // Coins collected
let highScore = localStorage.getItem("highScore") || 0;

let groundOffset = 0;

let clouds = [
    { x: 100, y: 80 },
    { x: 350, y: 140 },
    { x: 700, y: 60 }
];

// Particles for death explosion / score stars
let particles = [];

// Countdown
let countdownValue = 3;
let countdownTimer = 0;          // ms accumulated this step

// Score "pop" animation
let scoreScale = 1;

// Flash on collision
let flashAlpha = 0;

// FPS counter
let showFPS = true;
let lastFrameTime = performance.now();
let fps = 0;

// ----------------------------------------

function resize() {

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

}

resize();

window.addEventListener("resize", resize);

// Coins still spawn with pipes — tracked separately per pipe
let pendingCoinChance = 0.6;

// ----------------------------------------

function gameLoop(now) {

    // ---- FPS calculation ----
    let delta = now - lastFrameTime;
    lastFrameTime = now;
    fps = Math.round(1000 / delta);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background + clouds always draw
    drawBackground();
    drawClouds();

    // Ground scrolls only while playing
    if (gameState === "playing" && !paused) {

        groundOffset -= 4;

        if (groundOffset <= -40) {

            groundOffset = 0;

        }

    }

    drawGround();

    // ---- START SCREEN ----
    if (gameState === "start") {

        drawStartScreen();
        drawFPS();

        requestAnimationFrame(gameLoop);
        return;

    }

    // ---- COUNTDOWN ----
    if (gameState === "countdown") {

        // Draw the scene frozen behind the countdown
        for (let pipe of pipes) pipe.draw(ctx);
        for (let coin of coins) coin.draw(ctx);
        bird.draw(ctx);

        drawCountdown();
        drawFPS();

        countdownTimer += delta;

        if (countdownTimer >= 1000) {

            countdownTimer = 0;
            countdownValue--;

            if (countdownValue <= 0) {

                gameState = "playing";

            }

        }

        requestAnimationFrame(gameLoop);
        return;

    }

    // ---- PIPES ----

    if (gameState === "playing" && !paused) {

        spawnPipeIfNeeded();

    }

    for (let pipe of pipes) {

        if (gameState === "playing" && !paused) {

            pipe.update();

            if (!pipe.scored && pipe.x + pipe.width < bird.x) {

                score++;

                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem("highScore", highScore);
                }

                scoreScale = 1.4;

                pipe.scored = true;
                playScore();

            }

        }

        pipe.draw(ctx);

    }

    pipes = pipes.filter(pipe => pipe.x + pipe.width > 0);

    // ---- COINS ----
    for (let coin of coins) {

        if (gameState === "playing" && !paused) {

            coin.update();

            if (!coin.collected && circleHitsCircle(bird, coin)) {

                coin.collected = true;
                coinsCollected++;
                playCoin();
                spawnStarBurst(coin.x, coin.y);

            }

        }

        coin.draw(ctx);

    }

    coins = coins.filter(coin => coin.x + coin.radius > 0 && !coin.collected);

    // ---- BIRD ----
    if (gameState === "playing" && !paused) {

        bird.update();

        checkCollision();

    }

    // Bird shadow
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = 12;

    bird.draw(ctx);

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    // ---- PARTICLES ----
    updateParticles();
    drawParticles();

    // ---- SCORE HUD (hidden on start screen) ----
    if (gameState !== "start") {

        drawScore();

    }

    // ---- FLASH ON COLLISION ----
    if (flashAlpha > 0) {

        ctx.fillStyle = "rgba(255,255,255," + flashAlpha + ")";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        flashAlpha -= 0.04;

        if (flashAlpha < 0) flashAlpha = 0;

    }

    // ---- PAUSE SCREEN ----
    if (paused) {

        drawPauseScreen();

    }

    // ---- GAME OVER SCREEN ----
    if (gameState === "dead") {

        drawGameOverScreen();

    }

    drawFPS();

    requestAnimationFrame(gameLoop);

}

// ----------------------------------------

// ----------------------------------------

function circleHitsCircle(a, b) {

    let dx = a.x - b.x;
    let dy = a.y - b.y;
    let dist = Math.sqrt(dx * dx + dy * dy);

    return dist < a.radius + b.radius;

}

// ----------------------------------------

function spawnPipeIfNeeded() {

    if (pipes.length === 0) {

        addPipeWithCoin();

    } else {

        let lastPipe = pipes[pipes.length - 1];

        if (canvas.width - lastPipe.x > 350) {

            addPipeWithCoin();

        }

    }

}

function addPipeWithCoin() {

    let pipe = new Pipe(canvas.width, canvas.height);
    pipes.push(pipe);

    if (Math.random() < pendingCoinChance) {

        let coinY = pipe.topHeight + pipe.gap / 2;
        coins.push(new Coin(pipe.x + pipe.width / 2, coinY));

    }

}

// ----------------------------------------

function checkCollision() {

    // Top boundary
    if (bird.y - bird.radius <= 0) {
        triggerGameOver();
        return;
    }

    // Ground
    if (bird.y + bird.radius >= canvas.height - 70) {
        triggerGameOver();
        return;
    }

    // Pipes
    for (let pipe of pipes) {

        let birdLeft   = bird.x - bird.radius;
        let birdRight  = bird.x + bird.radius;
        let birdTop    = bird.y - bird.radius;
        let birdBottom = bird.y + bird.radius;

        if (birdRight > pipe.x && birdLeft < pipe.x + pipe.width) {

            if (birdTop < pipe.topHeight || birdBottom > pipe.topHeight + pipe.gap) {

                triggerGameOver();
                return;

            }

        }

    }

}

// ----------------------------------------

function triggerGameOver() {

    gameState = "dead";

    playHit();
    bgMusic.pause();

    spawnParticles(bird.x, bird.y);

    flashAlpha = 0.6;

}

// ----------------------------------------

function startCountdown() {

    gameState = "countdown";
    countdownValue = 3;
    countdownTimer = 0;

}

// ----------------------------------------

function restartGame() {

    score = 0;
    coinsCollected = 0;
    paused = false;

    bird.x = 120;
    bird.y = 300;
    bird.velocity = 0;
    bird.wingAngle = 0;

    pipes = [];
    coins = [];
    particles = [];

    addPipeWithCoin();

    startCountdown();

    bgMusic.currentTime = 0;
    bgMusic.play();

}

// ----------------------------------------
// Particles — death burst (colored circles)

function spawnParticles(x, y) {

    for (let i = 0; i < 20; i++) {

        let angle = Math.random() * Math.PI * 2;
        let speed = Math.random() * 4 + 1;

        particles.push({
            type: "circle",
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            size: Math.random() * 6 + 3,
            color: ["#FFD93D", "#FF6B6B", "#FFA07A", "#FFFFFF"][Math.floor(Math.random() * 4)]
        });

    }

}

// Particles — star burst on coin/score pickup

function spawnStarBurst(x, y) {

    for (let i = 0; i < 8; i++) {

        let angle = (Math.PI * 2 * i) / 8;
        let speed = 2.5;

        particles.push({
            type: "star",
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            size: 10,
            rotation: Math.random() * Math.PI,
            color: "#FFD700"
        });

    }

}

function updateParticles() {

    for (let p of particles) {

        p.x  += p.vx;
        p.y  += p.vy;

        if (p.type === "circle") {
            p.vy += 0.15;     // gravity on death particles
        }

        if (p.type === "star") {
            p.rotation += 0.1;
        }

        p.life -= 0.025;

    }

    particles = particles.filter(p => p.life > 0);

}

function drawParticles() {

    for (let p of particles) {

        ctx.save();

        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;

        if (p.type === "circle") {

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();

        } else if (p.type === "star") {

            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            drawStarPath(ctx, p.size);
            ctx.fill();

        }

        ctx.restore();

    }

}

function drawStarPath(ctx, size) {

    ctx.beginPath();

    for (let i = 0; i < 5; i++) {

        let outerAngle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        let innerAngle = outerAngle + Math.PI / 5;

        let ox = Math.cos(outerAngle) * size;
        let oy = Math.sin(outerAngle) * size;

        let ix = Math.cos(innerAngle) * size * 0.45;
        let iy = Math.sin(innerAngle) * size * 0.45;

        if (i === 0) ctx.moveTo(ox, oy);
        else ctx.lineTo(ox, oy);

        ctx.lineTo(ix, iy);

    }

    ctx.closePath();

}

// ----------------------------------------

function drawBackground() {

    let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);

    gradient.addColorStop(0, "#70D6FF");
    gradient.addColorStop(0.6, "#87CEEB");
    gradient.addColorStop(1, "#B8F2FF");

    ctx.fillStyle = gradient;

    ctx.fillRect(0, 0, canvas.width, canvas.height);

}

// ----------------------------------------

function drawGround() {

    // Dirt base
    ctx.fillStyle = "#8B5A2B";

    ctx.fillRect(
        0,
        canvas.height - 70,
        canvas.width,
        70
    );

    // Scrolling grass strips
    ctx.fillStyle = "#3CB043";

    for (let i = -40; i < canvas.width; i += 40) {

        ctx.fillRect(
            i + groundOffset,
            canvas.height - 70,
            30,
            8
        );

    }

    // Grass blade detail
    ctx.fillStyle = "#4CAF50";

    for (let i = -40; i < canvas.width; i += 20) {

        let bx = i + groundOffset;

        ctx.beginPath();
        ctx.moveTo(bx,      canvas.height - 70);
        ctx.lineTo(bx + 6,  canvas.height - 82);
        ctx.lineTo(bx + 12, canvas.height - 70);
        ctx.fill();

    }

}

// ----------------------------------------

function drawClouds() {

    ctx.fillStyle = "rgba(255,255,255,0.8)";

    for (let cloud of clouds) {

        ctx.beginPath();

        ctx.arc(cloud.x,      cloud.y,      22, 0, Math.PI * 2);
        ctx.arc(cloud.x + 20, cloud.y - 10, 20, 0, Math.PI * 2);
        ctx.arc(cloud.x + 40, cloud.y,      22, 0, Math.PI * 2);

        ctx.fill();

        if (!paused) {

            cloud.x -= 1;

            if (cloud.x < -80) {

                cloud.x = canvas.width + 100;

            }

        }

    }

}

// ----------------------------------------

function drawScore() {

    ctx.save();

    // Ease the pop scale back toward 1 each frame
    scoreScale += (1 - scoreScale) * 0.2;

    ctx.translate(15, 15);
    ctx.scale(scoreScale, scoreScale);

    // HUD background panel
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, 220, 120);

    // Gold border
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, 220, 120);

    // Text shadow
    ctx.shadowColor = "black";
    ctx.shadowBlur = 8;

    ctx.font = "bold 24px Arial";
    ctx.textAlign = "left";

    ctx.fillStyle = "white";
    ctx.fillText("🏆 Score : " + score, 15, 38);

    ctx.fillStyle = "#FFD700";
    ctx.fillText("🪙 Coins : " + coinsCollected, 15, 73);

    ctx.fillStyle = "#00FF66";
    ctx.fillText("⭐ Best : " + highScore, 15, 108);

    ctx.shadowBlur = 0;

    ctx.restore();

}

// ----------------------------------------

function drawFPS() {

    if (!showFPS) return;

    ctx.save();

    ctx.font = "16px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.textAlign = "right";

    let label = "FPS : " + fps;

    ctx.strokeText(label, canvas.width - 15, 25);
    ctx.fillText(label, canvas.width - 15, 25);

    ctx.restore();

}

// ----------------------------------------

function drawStartScreen() {

    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";

    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 70px Arial";
    ctx.fillText("FLAPPY BIRD(SPIDY EDITION)", canvas.width / 2, 180);

    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.fillText("Press SPACE to Start", canvas.width / 2, 260);

    ctx.font = "22px Arial";
    ctx.fillText("Press P to Pause", canvas.width / 2, 310);

    ctx.fillStyle = "#00FF66";
    ctx.fillText("Best Score : " + highScore, canvas.width / 2, 380);

}

// ----------------------------------------

function drawCountdown() {

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.font = "bold 110px Arial";
    ctx.fillStyle = "#FFD93D";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 6;

    let label = countdownValue > 0 ? String(countdownValue) : "GO!";

    ctx.strokeText(label, canvas.width / 2, canvas.height / 2);
    ctx.fillText(label,  canvas.width / 2, canvas.height / 2);

}

// ----------------------------------------

function drawPauseScreen() {

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";

    ctx.font = "bold 60px Arial";
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 5;
    ctx.strokeText("PAUSED", canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2 - 20);

    ctx.font = "28px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.strokeText("Press P to Continue", canvas.width / 2, canvas.height / 2 + 40);
    ctx.fillText("Press P to Continue",   canvas.width / 2, canvas.height / 2 + 40);

}

// ----------------------------------------


function drawGameOverScreen() {

    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";

    ctx.fillStyle = "#FF4444";
    ctx.font = "bold 70px Arial";
    ctx.fillText("GAME OVER", canvas.width / 2, 180);

    ctx.fillStyle = "white";
    ctx.font = "32px Arial";
    ctx.fillText("🏆 Score : " + score, canvas.width / 2, 270);
    ctx.fillText("🪙 Coins : " + coinsCollected, canvas.width / 2, 320);

    ctx.fillStyle = "#FFD700";
    ctx.fillText("⭐ Best : " + highScore, canvas.width / 2, 380);

    // Medal system
    let medal = "🥉 Bronze";
    if (score >= 20)  medal = "🥈 Silver";
    if (score >= 50)  medal = "🥇 Gold";
    if (score >= 100) medal = "💎 Diamond";

    ctx.font = "30px Arial";
    ctx.fillStyle = "white";
    ctx.fillText("Medal : " + medal, canvas.width / 2, 430);

    ctx.fillStyle = "#00FF66";
    ctx.font = "28px Arial";
    ctx.fillText("Press R to Restart", canvas.width / 2, 485);

}

// ----------------------------------------

function drawRoundedRect(x, y, w, h, r) {

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y,     x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x,     y + h, r);
    ctx.arcTo(x,     y + h, x,     y,     r);
    ctx.arcTo(x,     y,     x + w, y,     r);
    ctx.closePath();

}

// ----------------------------------------
// Background music — starts on first user interaction

function startMusic() {
    playMusic();
}

window.addEventListener("keydown", startMusic, { once: true });
canvas.addEventListener("click",   startMusic, { once: true });

// ----------------------------------------
// Keyboard

window.addEventListener("keydown", function (e) {

    if (e.code === "Space") {

        e.preventDefault();   // Prevent page scrolling

        if (gameState === "start") {

            startCountdown();

        } else if (gameState === "playing" && !paused) {

            bird.jump();
            playJump();

        }

    }

    if (e.key === "p" || e.key === "P") {

        if (gameState === "playing") {

            paused = !paused;

        }

    }

    if (e.key === "r" || e.key === "R") {

        if (gameState === "dead") {

            restartGame();

        }

    }

    if (e.key === "f" || e.key === "F") {

        showFPS = !showFPS;

    }

});

// ----------------------------------------
// Touch / Mouse

canvas.addEventListener("click", function () {

    if (gameState === "start") {

        startCountdown();

    } else if (gameState === "playing" && !paused) {

        bird.jump();
        playJump();

    }

});

playMusic();

requestAnimationFrame(gameLoop);