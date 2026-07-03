console.log("sound.js loaded");

const jumpSound  = new Audio("jump.wav");
const scoreSound = new Audio("score.wav");
const hitSound   = new Audio("hit.wav");

jumpSound.volume  = 0.6;
scoreSound.volume = 0.7;
hitSound.volume   = 0.8;

function playJump() {
    jumpSound.currentTime = 0;
    jumpSound.play().catch(() => {});
}

function playScore() {
    scoreSound.currentTime = 0;
    scoreSound.play().catch(() => {});
}

function playHit() {
    hitSound.currentTime = 0;
    hitSound.play().catch(() => {});
}

// coin.wav not downloaded yet — uses score sound as fallback
function playCoin() {
    scoreSound.currentTime = 0;
    scoreSound.play().catch(() => {});
}

// bg.mp3 not downloaded yet — stub so game.js doesn't crash
const bgMusic = {
    play:        function() {},
    pause:       function() {},
    currentTime: 0,
    volume:      0,
    loop:        false
};

function playMusic() {}
