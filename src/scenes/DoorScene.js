export default class Door1Scene {
    constructor({ canvas, ctx, camera, doorId, goBack }) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.camera = camera;
        this.doorId = doorId;
        this.goBack = goBack;

        // Lista de preguntas
        this.questions = [
            {
                question: "¿La capital de Bolivia es Sucre?",
                type: "truefalse",
                options: ["Verdadero", "Falso"],
                correctIndex: 0
            },
            {
                question: "¿Cuántos departamentos tiene Bolivia?",
                type: "multiple",
                options: ["7", "8", "9", "10"],
                correctIndex: 2
            },
            {
                question: "¿El Lago Titicaca es el más alto del mundo?",
                type: "truefalse",
                options: ["Verdadero", "Falso"],
                correctIndex: 0
            },
            {
                question: "¿Cuál es la moneda oficial de Bolivia?",
                type: "multiple",
                options: ["Peso boliviano", "Boliviano", "Sol", "Guaraní"],
                correctIndex: 1
            }
        ];

        // Elegir pregunta aleatoria
        const randomIndex = Math.floor(Math.random() * this.questions.length);
        const q = this.questions[randomIndex];

        this.question = q.question;
        this.type = q.type;
        this.options = q.options;
        this.correctIndex = q.correctIndex;

        this.selectedIndex = 0;
        this.result = null;
    }

    init() { }
    destroy() { }
    resize() { }

    update(dt, { keys }) { }

    onKeyDown(e) {
        if (this.result !== null) {
            // Si ya se respondió, volver con Escape / Enter
            if (e.code === "Escape" || e.code === "Enter") {
                this.goBack?.(this.result);
            }
            return;
        }

        // Navegar opciones con flechas o WASD
        if (e.code === "ArrowUp" || e.code === "KeyW") {
            this.selectedIndex = (this.selectedIndex - 1 + this.options.length) % this.options.length;
        }
        if (e.code === "ArrowDown" || e.code === "KeyS") {
            this.selectedIndex = (this.selectedIndex + 1) % this.options.length;
        }

        // También permitir A/D para mover horizontal (si en el futuro hay UI horizontal)
        if (e.code === "ArrowLeft" || e.code === "KeyA") {
            this.selectedIndex = (this.selectedIndex - 1 + this.options.length) % this.options.length;
        }
        if (e.code === "ArrowRight" || e.code === "KeyD") {
            this.selectedIndex = (this.selectedIndex + 1) % this.options.length;
        }

        // Seleccionar respuesta
        if (e.code === "Enter" || e.code === "Space") {
            this.result = this.selectedIndex === this.correctIndex;
        }
    }

    draw(ctx) {
        const w = this.canvas.width, h = this.canvas.height;
        ctx.fillStyle = "#0b0f1a";
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";

        ctx.font = "bold 32px system-ui";
        ctx.fillText(`Puerta ${this.doorId} - Acertijo`, w / 2, 80);

        ctx.font = "20px system-ui";
        ctx.fillText(this.question, w / 2, 140);

        // Mostrar opciones
        this.options.forEach((opt, i) => {
            ctx.fillStyle = i === this.selectedIndex ? "#ff0" : "#fff";
            ctx.fillText(opt, w / 2, 200 + i * 30);
        });

        // Resultado
        if (this.result !== null) {
            ctx.fillStyle = this.result ? "#0f0" : "#f00";
            ctx.fillText(
                this.result ? "¡Correcto!" : "Incorrecto...",
                w / 2,
                h - 50
            );
            ctx.font = "16px system-ui";
            ctx.fillStyle = "#fff";
            ctx.fillText("Presiona Enter o Esc para volver", w / 2, h - 20);
        }
    }
}
