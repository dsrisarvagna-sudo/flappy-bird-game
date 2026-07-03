console.log("pipe.js loaded");

class Pipe {

    constructor(canvasWidth, canvasHeight) {

        this.x = canvasWidth;
        this.width = 80;
        this.speed = 5;

        this.gap = 200;

        const margin = 120;

        this.topHeight = Math.random() * (canvasHeight - this.gap - margin * 2) + margin;

        this.canvasHeight = canvasHeight;

        this.scored = false;

    }

    update() {

        this.x -= this.speed;

    }

    draw(ctx) {

        // ---- Pipe body gradient ----
        let gradient = ctx.createLinearGradient(
            this.x,
            0,
            this.x + this.width,
            0
        );

        gradient.addColorStop(0, "#145A32");
        gradient.addColorStop(0.5, "#2ECC71");
        gradient.addColorStop(1, "#145A32");

        ctx.fillStyle = gradient;

        // Top pipe body
        ctx.fillRect(
            this.x,
            0,
            this.width,
            this.topHeight
        );

        // Bottom pipe body
        ctx.fillRect(
            this.x,
            this.topHeight + this.gap,
            this.width,
            this.canvasHeight - this.topHeight - this.gap
        );

        // ---- Pipe highlight (left edge bright strip) ----
        ctx.fillStyle = "rgba(255,255,255,0.15)";

        ctx.fillRect(
            this.x + 6,
            0,
            10,
            this.topHeight
        );

        ctx.fillRect(
            this.x + 6,
            this.topHeight + this.gap,
            10,
            this.canvasHeight - this.topHeight - this.gap
        );

        // ---- Caps ----
        ctx.fillStyle = "#27AE60";

        // Top cap
        ctx.fillRect(
            this.x - 5,
            this.topHeight - 15,
            this.width + 10,
            15
        );

        // Bottom cap
        ctx.fillRect(
            this.x - 5,
            this.topHeight + this.gap,
            this.width + 10,
            15
        );

        // ---- Cap highlights ----
        ctx.fillStyle = "rgba(255,255,255,0.2)";

        ctx.fillRect(
            this.x - 5,
            this.topHeight - 15,
            this.width + 10,
            5
        );

        ctx.fillRect(
            this.x - 5,
            this.topHeight + this.gap,
            this.width + 10,
            5
        );

    }

}