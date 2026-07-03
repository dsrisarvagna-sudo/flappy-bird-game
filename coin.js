console.log("coin.js loaded");

class Coin {

    constructor(x, y) {

        this.x = x;
        this.y = y;

        this.radius = 14;

        // Must match pipe speed in pipe.js — both are 5
        this.speed = 5;

        this.collected = false;

        this.angle = 0;   // for spin animation

    }

    update() {

        this.x -= this.speed;
        this.angle += 0.12;

    }

    draw(ctx) {

        if (this.collected) return;

        ctx.save();

        ctx.translate(this.x, this.y);

        // Squash horizontally to fake a 3D spin
        let squash = Math.cos(this.angle);

        ctx.scale(squash, 1);

        // Coin body
        let gradient = ctx.createRadialGradient(0, 0, 2, 0, 0, this.radius);
        gradient.addColorStop(0, "#FFF6B0");
        gradient.addColorStop(0.6, "#FFD700");
        gradient.addColorStop(1, "#B8860B");

        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner ring
        ctx.strokeStyle = "#B8860B";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius - 4, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();

    }

}