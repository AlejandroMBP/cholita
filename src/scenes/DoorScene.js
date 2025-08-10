export default class Door1Scene {
    constructor({ canvas, ctx, camera, doorId, goBack }) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.camera = camera;
        this.doorId = doorId;
        this.goBack = goBack;

        // ==== 7 cuentos bolivianos con acertijo (¿De qué departamento es?) ====
        // Cada item: { title, story, hint, options[4], correctIndex }
        this.riddles = [
            {
                title: "El Kari-Kari del Cerro",
                story:
                    "En una ciudad tan alta que el aire se siente fino y frío, un cerro imponente brilla como plata bajo el sol. " +
                    "En las noches heladas, entre calles empedradas y faroles antiguos, aparece una sombra envuelta en poncho y sombrero ancho. " +
                    "Dicen que lleva un cuchillo afilado y que busca algo extraño: la grasa de los caminantes desprevenidos. " +
                    "Los mineros cuentan que con ella engrasa máquinas en lo profundo de las bocaminas, donde el eco del viento silba como advertencia.",
                hint: "Cerro Rico, altura extrema y leyendas mineras.",
                options: ["Potosí", "Beni", "Santa Cruz", "Tarija"],
                correctIndex: 0
            },
            {
                title: "El Ekeko de la Alasita",
                story:
                    "Cada 24 de enero, las plazas se llenan de colores y miniaturas: casas, autos, títulos y hasta pasajes de avión. " +
                    "Un hombrecito regordete, siempre sonriente y cargado de regalos, reparte abundancia a quien crea en él. " +
                    "Mientras tanto, un nevado majestuoso vigila la ciudad y se tiñe de tonos rosados cuando cae la tarde.",
                hint: "Feria de Alasita y el Illimani en el horizonte.",
                options: ["La Paz", "Chuquisaca", "Cochabamba", "Pando"],
                correctIndex: 0
            },
            {
                title: "La Sirena del Lago",
                story:
                    "En el lago navegable más alto del mundo, una sirena emerge entre las totoras y canta melodías que hipnotizan a los pescadores. " +
                    "Dicen los ancianos que, en las islas del Sol y de la Luna, aún se escuchan los ecos de un antiguo imperio que gobernó estas aguas sagradas.",
                hint: "Lago sagrado, islas legendarias y cultura aymara.",
                options: ["La Paz", "Cochabamba", "Pando", "Chuquisaca"],
                correctIndex: 0
            },
            {
                title: "El Tío de la Mina",
                story:
                    "Bajo tierra, donde la oscuridad es total y el aire se siente pesado, los mineros dejan ofrendas de coca, alcohol y cigarrillos a una figura con cuernos y sonrisa temible. " +
                    "Arriba, cada febrero, las calles se llenan de diablos danzantes, tambores y matracas en un carnaval único en el mundo.",
                hint: "Carnaval declarado Obra Maestra del Patrimonio Oral e Intangible.",
                options: ["Oruro", "Tarija", "Santa Cruz", "Beni"],
                correctIndex: 0
            },
            {
                title: "La Ñusta de Incallajta",
                story:
                    "Entre montañas y valles templados, se alza una fortaleza de piedra donde una princesa inca vigila desde lo alto. " +
                    "En las comunidades cercanas, el aroma dulce de la chicha de maíz anuncia fiesta, mientras las flautas y tambores marcan el ritmo.",
                hint: "Fortaleza de Pocona y corazón del valle boliviano.",
                options: ["Cochabamba", "Potosí", "La Paz", "Pando"],
                correctIndex: 0
            },
            {
                title: "El Canto del Guajojó",
                story:
                    "En las noches tranquilas de los llanos, bajo la sombra de los tajibos florecidos, un ave nocturna entona un canto triste. " +
                    "Cuentan que es el lamento de una joven transformada en pájaro por un amor imposible, y que su voz guía a los viajeros por ríos y palmares.",
                hint: "Oriente boliviano, río Piraí y leyenda guaraní.",
                options: ["Santa Cruz", "Beni", "Tarija", "Oruro"],
                correctIndex: 0
            },
            {
                title: "El Duende del Vino",
                story:
                    "En un valle cubierto de viñedos, las noches se llenan de música y serenatas. " +
                    "En las bodegas antiguas, un duende travieso cambia las botellas de lugar y derrama el aroma dulce de la uva madura. " +
                    "Cada vendimia, la gente brinda con singani y recuerda que no todo lo que se mueve entre barricas es humano.",
                hint: "Valle Central, vendimias y tradición vitivinícola.",
                options: ["Tarija", "Chuquisaca", "La Paz", "Cochabamba"],
                correctIndex: 0
            }
        ];

        // Elegir cuento al azar
        const randomIndex = Math.floor(Math.random() * this.riddles.length);
        const r = this.riddles[randomIndex];

        this.title = r.title;
        this.story = r.story;
        this.hint = r.hint;
        this.options = r.options;
        this.correctIndex = r.correctIndex;

        // Estado UI
        this.selectedIndex = 0;
        this.result = null;
        this.showHint = false;
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

        // Toggle pista
        if (e.code === "KeyH") {
            this.showHint = !this.showHint;
            return;
        }

        // Navegar opciones con flechas o WASD
        if (e.code === "ArrowUp" || e.code === "KeyW" || e.code === "ArrowLeft" || e.code === "KeyA") {
            this.selectedIndex = (this.selectedIndex - 1 + this.options.length) % this.options.length;
        }
        if (e.code === "ArrowDown" || e.code === "KeyS" || e.code === "ArrowRight" || e.code === "KeyD") {
            this.selectedIndex = (this.selectedIndex + 1) % this.options.length;
        }

        // Seleccionar respuesta
        if (e.code === "Enter" || e.code === "Space") {
            this.result = this.selectedIndex === this.correctIndex;
        }
    }

    // Helper para cortar líneas
    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        const lines = [];
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                lines.push(line);
                line = words[n] + ' ';
            } else {
                line = testLine;
            }
        }
        lines.push(line);
        lines.forEach((l, i) => ctx.fillText(l.trim(), x, y + i * lineHeight));
        return y + lines.length * lineHeight;
    }

    draw(ctx) {
        const w = this.canvas.width, h = this.canvas.height;
        ctx.fillStyle = "#0b0f1a";
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";

        // Título
        ctx.font = "bold 32px system-ui";
        ctx.fillText(`Puerta ${this.doorId} - Acertijo`, w / 2, 70);

        // Subtítulo (cuento)
        ctx.font = "bold 24px system-ui";
        ctx.fillText(this.title, w / 2, 115);

        // Cuerpo del cuento (envuelto)
        ctx.textAlign = "left";
        ctx.font = "18px system-ui";
        const marginX = Math.floor(w * 0.1);
        let cursorY = 155;
        cursorY = this.wrapText(ctx, this.story, marginX, cursorY, w - marginX * 2, 26);

        // Hint (opcional con tecla H)
        ctx.textAlign = "center";
        ctx.font = "14px system-ui";
        ctx.fillStyle = "#ddd";
        ctx.fillText("Pulsa H para mostrar/ocultar pista • Enter/Space para responder • Esc/Enter para volver", w / 2, h - 24);

        if (this.showHint) {
            ctx.textAlign = "left";
            ctx.fillStyle = "#ffeb99";
            ctx.font = "16px system-ui";
            this.wrapText(ctx, `Pista: ${this.hint}`, marginX, cursorY + 14, w - marginX * 2, 22);
        }

        // Pregunta + opciones
        ctx.textAlign = "center";
        ctx.fillStyle = "#fff";
        ctx.font = "20px system-ui";
        ctx.fillText("¿A qué departamento pertenece este cuento?", w / 2, h * 0.60);

        this.options.forEach((opt, i) => {
            ctx.fillStyle = i === this.selectedIndex ? "#ff0" : "#fff";
            ctx.fillText(opt, w / 2, h * 0.60 + 40 + i * 28);
        });

        // Resultado
        if (this.result !== null) {
            ctx.fillStyle = this.result ? "#0f0" : "#f00";
            ctx.font = "bold 24px system-ui";
            ctx.fillText(this.result ? "¡Correcto!" : "Incorrecto...", w / 2, h - 70);

            ctx.font = "16px system-ui";
            ctx.fillStyle = "#fff";
            ctx.fillText("Presiona Enter o Esc para volver", w / 2, h - 44);
        }
    }
}
