// Import only the witch image that works
import witchImageSrc from '../../bruja/bru.jpg.png';
import BienvenidosAudio from '../../bruja/bienvenidosAMiMundo.mp3';
import AmbienteTetrico from '../../bruja/ambientaltetrico2.wav';
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
                title: "Adivinanza narrativa",
                story:
                    "En una Villa Imperial donde el frío muerde,\n" +
                    "un cerro guarda metales rojos y plateados.\n" +
                    "De noche camina un sombrero con cuchillo bruñido,\n" +
                    "engrasando máquinas, susurro de bocaminas.\n" +
                    "Cuando suenan campanas en calles empedradas,\n" +
                    "nadie corre… pero nadie duerme tranquilo.",
                hint: "Villa Imperial y Cerro Rico.",
                options: ["Oruro", "Potosí", "La Paz", "Chuquisaca"],
                correctIndex: 1
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

        // Efectos visuales téricos
        this.time = 0;
        this.particles = [];
        this.glitchEffect = 0;
        this.bloodDrops = [];
        this.eyeGlow = 0;

        // Audio tétrico
        this._initAudio();

        // Imagen de la bruja
        this._initWitchImage();

        // Crear partículas iniciales
        this._createParticles();
        this._createBloodDrops();

        // Agregar estilos CSS tétricos
        this._addCreepyStyles();
    }

    _initAudio() {
        // Audio de bienvenida - usando ruta relativa al public
        this.welcomeAudio = new Audio(BienvenidosAudio);
        this.welcomeAudio.volume = 0.7;

        // Audio ambiental tétrico (loop)
        this.ambientAudio = new Audio(AmbienteTetrico);
        this.ambientAudio.loop = true;
        this.ambientAudio.volume = 0.4;

        // Reproducir audio de bienvenida al iniciar
        this.welcomeAudio.play().catch(e => console.log('Error welcome audio:', e));

        // Iniciar audio ambiental después de 2 segundos
        setTimeout(() => {
            this.ambientAudio.play().catch(e => console.log('Error ambient audio:', e));
        }, 2000);
    }

    _initWitchImage() {
        this.witchImage = new Image();
        this.witchImage.src = witchImageSrc;
        this.witchLoaded = false;
        this.witchImage.onload = () => {
            this.witchLoaded = true;
        };
    }

    _createParticles() {
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: Math.random() * 0.3 + 0.1,
                size: Math.random() * 3 + 1,
                alpha: Math.random() * 0.5 + 0.3,
                color: Math.random() > 0.7 ? '#ff0066' : '#660066'
            });
        }
    }

    _createBloodDrops() {
        for (let i = 0; i < 8; i++) {
            this.bloodDrops.push({
                x: Math.random() * this.canvas.width,
                y: -10,
                vy: Math.random() * 2 + 1,
                size: Math.random() * 4 + 2,
                trail: []
            });
        }
    }

    _addCreepyStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Creepster&family=Nosifer&display=swap');
            
            @keyframes creepyGlow {
                0%, 100% { text-shadow: 0 0 10px #ff0066, 0 0 20px #ff0066, 0 0 30px #ff0066; }
                50% { text-shadow: 0 0 20px #ff0066, 0 0 30px #ff0066, 0 0 40px #ff0066; }
            }
            
            @keyframes bloodDrip {
                0% { transform: scaleY(0); }
                100% { transform: scaleY(1); }
            }
            
            @keyframes witchFloat {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-15px) rotate(1deg); }
            }
        `;
        document.head.appendChild(style);
    }

    init() { }

    destroy() {
        if (this.welcomeAudio) {
            this.welcomeAudio.pause();
            this.welcomeAudio = null;
        }
        if (this.ambientAudio) {
            this.ambientAudio.pause();
            this.ambientAudio = null;
        }
    }

    resize() { }

    update(dt, { keys }) {
        this.time += dt;
        this.glitchEffect = Math.sin(this.time * 8) * 0.1;
        this.eyeGlow = (Math.sin(this.time * 3) + 1) * 0.5;

        // Actualizar partículas
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.alpha = Math.sin(this.time * 2 + p.x * 0.01) * 0.3 + 0.4;

            if (p.y > this.canvas.height + 10) {
                p.y = -10;
                p.x = Math.random() * this.canvas.width;
            }
            if (p.x < -10 || p.x > this.canvas.width + 10) {
                p.vx *= -1;
            }
        });

        // Actualizar gotas de sangre
        this.bloodDrops.forEach(drop => {
            drop.y += drop.vy;
            drop.trail.push({ x: drop.x, y: drop.y });
            if (drop.trail.length > 10) drop.trail.shift();

            if (drop.y > this.canvas.height + 20) {
                drop.y = -10;
                drop.x = Math.random() * this.canvas.width;
                drop.trail = [];
            }
        });
    }

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

    _drawBackground(ctx) {
        const w = this.canvas.width, h = this.canvas.height;

        // Fondo base oscuro con gradiente tétrico
        const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h));
        gradient.addColorStop(0, '#1a0d1a');
        gradient.addColorStop(0.5, '#0d0607');
        gradient.addColorStop(1, '#000000');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // Efecto de vetas rojas
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = '#330011';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(0, h * (i / 5) + Math.sin(this.time + i) * 20);
            ctx.lineTo(w, h * (i / 5) + Math.sin(this.time + i + 1) * 20);
            ctx.stroke();
        }
        ctx.restore();
    }

    _drawParticles(ctx) {
        ctx.save();
        this.particles.forEach(p => {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }

    _drawBloodDrops(ctx) {
        ctx.save();
        this.bloodDrops.forEach(drop => {
            // Rastro de la gota
            ctx.strokeStyle = '#660000';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            drop.trail.forEach((point, i) => {
                if (i === 0) ctx.moveTo(point.x, point.y);
                else ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();

            // Gota principal
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = '#cc0000';
            ctx.beginPath();
            ctx.arc(drop.x, drop.y, drop.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }

    _drawWitch(ctx) {
        if (!this.witchLoaded) return;

        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.save();

        // Posición de la bruja (esquina superior derecha)
        const witchW = 150;
        const witchH = (this.witchImage.height / this.witchImage.width) * witchW;
        const witchX = w - witchW - 20;
        const witchY = 20 + Math.sin(this.time * 2) * 5; // Flotación

        // Efecto de brillo tétrico
        ctx.globalAlpha = 0.8;
        ctx.shadowColor = '#ff0066';
        ctx.shadowBlur = 20;

        // Dibujar la bruja
        ctx.drawImage(this.witchImage, witchX, witchY, witchW, witchH);

        // Ojos brillantes
        ctx.globalAlpha = this.eyeGlow;
        ctx.fillStyle = '#ff0066';
        ctx.beginPath();
        ctx.arc(witchX + witchW * 0.3, witchY + witchH * 0.3, 3, 0, Math.PI * 2);
        ctx.arc(witchX + witchW * 0.7, witchY + witchH * 0.3, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    _drawGlitchEffect(ctx) {
        if (Math.random() < 0.02) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#ff0066';
            const glitchH = 5;
            const y = Math.random() * this.canvas.height;
            ctx.fillRect(0, y, this.canvas.width, glitchH);
            ctx.restore();
        }
    }

    draw(ctx) {
        const w = this.canvas.width, h = this.canvas.height;

        // Fondo tétrico
        this._drawBackground(ctx);

        // Partículas flotantes
        this._drawParticles(ctx);

        // Gotas de sangre
        this._drawBloodDrops(ctx);

        // Bruja flotante
        this._drawWitch(ctx);

        // Efectos de glitch ocasionales
        this._drawGlitchEffect(ctx);

        // Contenido principal con efectos
        ctx.save();

        // Título principal con efecto tétrico
        ctx.fillStyle = "#ff0066";
        ctx.shadowColor = "#ff0066";
        ctx.shadowBlur = 15;
        ctx.textAlign = "center";
        ctx.font = "bold 28px 'Creepster', system-ui";
        ctx.fillText(`PUERTA ${this.doorId} - ACERTIJO MALDITO`, w / 2, 70);

        // Subtítulo del cuento
        ctx.fillStyle = "#ffccdd";
        ctx.shadowBlur = 10;
        ctx.font = "bold 20px 'Nosifer', system-ui";
        ctx.fillText(this.title, w / 2, 110);

        // Marco decorativo para el texto
        ctx.strokeStyle = "#660033";
        ctx.lineWidth = 2;
        ctx.shadowBlur = 0;
        const textBoxX = w * 0.20;
        const textBoxY = 130;
        const textBoxW = w * 0.60;
        const textBoxH = h * 0.35;
        ctx.strokeRect(textBoxX, textBoxY, textBoxW, textBoxH);

        // Cuerpo del cuento con texto sangriento
        ctx.textAlign = "left";
        ctx.font = "30px system-ui";
        ctx.fillStyle = "#ffdddd";
        ctx.shadowColor = "#660000";
        ctx.shadowBlur = 3;
        const marginX = textBoxX + 30;
        let cursorY = textBoxY + 50;
        cursorY = this.wrapText(ctx, this.story, marginX, cursorY, textBoxW - 60, 44);

        // Hint con efecto especial
        if (this.showHint) {
            ctx.fillStyle = "#ffff66";
            ctx.shadowColor = "#ffff00";
            ctx.shadowBlur = 8;
            ctx.font = "italic 14px system-ui";
            this.wrapText(ctx, `💀 PISTA MALDITA: ${this.hint}`, marginX, cursorY + 15, textBoxW - 30, 20);
        }

        // Pregunta principal
        ctx.textAlign = "center";
        ctx.fillStyle = "#ff6666";
        ctx.shadowColor = "#ff0000";
        ctx.shadowBlur = 10;
        ctx.font = "bold 18px system-ui";
        ctx.fillText("¿A QUÉ DEPARTAMENTO PERTENECE ESTE CUENTO MALDITO?", w / 2, h * 0.62);

        // Opciones con diseño tétrico
        this.options.forEach((opt, i) => {
            const isSelected = i === this.selectedIndex;
            const optY = h * 0.62 + 35 + i * 35;

            if (isSelected) {
                // Marco de selección sangriento
                ctx.fillStyle = "rgba(255, 0, 102, 0.3)";
                ctx.fillRect(w * 0.3, optY - 20, w * 0.4, 30);

                ctx.strokeStyle = "#ff0066";
                ctx.lineWidth = 2;
                ctx.strokeRect(w * 0.3, optY - 20, w * 0.4, 30);

                ctx.fillStyle = "#ffff00";
                ctx.shadowColor = "#ffff00";
                ctx.shadowBlur = 15;
            } else {
                ctx.fillStyle = "#cccccc";
                ctx.shadowColor = "#666666";
                ctx.shadowBlur = 5;
            }

            ctx.font = "bold 16px system-ui";
            ctx.fillText(`${String.fromCharCode(65 + i)}. ${opt}`, w / 2, optY);
        });

        // Controles con estilo tétrico
        ctx.fillStyle = "#999999";
        ctx.shadowBlur = 3;
        ctx.font = "12px system-ui";
        ctx.fillText("💀 H: Pista • WASD/Flechas: Navegar • Enter/Space: Responder • Esc: Volver 💀", w / 2, h - 20);

        // Resultado con efectos especiales
        if (this.result !== null) {
            // Overlay de resultado
            ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
            ctx.fillRect(0, 0, w, h);

            ctx.fillStyle = this.result ? "#00ff00" : "#ff0000";
            ctx.shadowColor = this.result ? "#00ff00" : "#ff0000";
            ctx.shadowBlur = 25;
            ctx.font = "bold 36px 'Creepster', system-ui";
            ctx.textAlign = "center";

            const resultText = this.result ? "¡CORRECTO!" : "¡INCORRECTO!";
            ctx.fillText(resultText, w / 2, h / 2 - 20);

            ctx.fillStyle = "#ffffff";
            ctx.shadowBlur = 10;
            ctx.font = "18px system-ui";
            ctx.fillText("Presiona Enter o Esc para escapar de esta pesadilla...", w / 2, h / 2 + 30);

            // Efecto de respuesta correcta/incorrecta
            if (this.result) {
                // Partículas de victoria
                for (let i = 0; i < 5; i++) {
                    ctx.fillStyle = `hsl(${(this.time * 100 + i * 72) % 360}, 100%, 50%)`;
                    ctx.beginPath();
                    const angle = (this.time * 2 + i) * Math.PI / 3;
                    const radius = 100 + Math.sin(this.time * 4) * 20;
                    ctx.arc(w / 2 + Math.cos(angle) * radius, h / 2 + Math.sin(angle) * radius, 5, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else {
                // Efecto de X roja
                ctx.strokeStyle = "#ff0000";
                ctx.lineWidth = 8;
                ctx.shadowBlur = 20;
                const crossSize = 50;
                ctx.beginPath();
                ctx.moveTo(w / 2 - crossSize, h / 2 - crossSize - 60);
                ctx.lineTo(w / 2 + crossSize, h / 2 + crossSize - 60);
                ctx.moveTo(w / 2 + crossSize, h / 2 - crossSize - 60);
                ctx.lineTo(w / 2 - crossSize, h / 2 + crossSize - 60);
                ctx.stroke();
            }
        }

        ctx.restore();
    }
}