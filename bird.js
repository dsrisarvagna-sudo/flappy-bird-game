console.log("bird.js loaded");

class Bird {

    constructor() {

        this.x = 120;
        this.y = 300;

        this.radius = 20;

        this.velocity = 0;

        this.gravity = 0.55;

        this.jumpForce = -10;

        // Wing flap animation
        this.wingAngle = 0;

    }

    update() {

        this.velocity += this.gravity;

        this.y += this.velocity;

        // Advance wing flap
        this.wingAngle += 0.2;

    }

    jump() {

        this.velocity = this.jumpForce;

    }

    draw(ctx) {

        ctx.save();

        ctx.translate(this.x, this.y);

        ctx.rotate(this.velocity * 0.05);

        // Body
        ctx.fillStyle = "#FFD93D";
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Animated wing — oscillates up and down using sin
        let wingY = Math.sin(this.wingAngle) * 6;

        ctx.fillStyle = "#F4B400";
        ctx.beginPath();
        ctx.ellipse(-5, 2 + wingY, 12, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eye white
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(8, -6, 5, 0, Math.PI * 2);
        ctx.fill();

        // Eye pupil
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(9, -6, 2, 0, Math.PI * 2);
        ctx.fill();

        // Beak
        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.moveTo(18, -2);
        ctx.lineTo(30, 2);
        ctx.lineTo(18, 6);
        ctx.fill();

        ctx.restore();

    }

}