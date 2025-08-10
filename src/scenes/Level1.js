import fondoImgSrc from '../assets/nivel1/fondo.jpg';
import casasImgSrc from '../assets/nivel1/casas.png';
import Cholita from '../entities/cholita.js';
import DoorScene from './DoorScene.js';

export default class Level1Scene {
    constructor({ canvas, ctx, camera, goTo, onEnterDoor, initialState = null, destroyedDoorIds = [] }) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.camera = camera;

        this.goTo = goTo || null;
        this.onEnterDoor = onEnterDoor || null;

        // Estado inicial (posición/cámara) para volver donde estabas
        this._initialState = initialState; // { x, bottom, cameraX }
        this._restored = false;

        // Persistencia de puertas destruidas entre escenas
        this._destroyedDoorIds = new Set(destroyedDoorIds || []);

        // --- Config ---
        this.BAND_HEIGHT = 0.20;
        this.GROUND_MARGIN = 8;
        this.BG_TILE_FACTOR = 1.8;
        this.HOUSES_HEIGHT = 0.60;
        this.HOUSES_WIDTH_FACTOR = 3.5;

        this.SHOW_BAND = false;
        this.SHOW_MARKERS = false;

        this.LEVEL_WIDTH = 20000;
        this.WALK = { top: 0, bottom: 0 };

        // Player
        this.bullets = [];
        this.cholita = new Cholita(120, 0, {
            speed: 320, vSpeed: 220, jumpSpeed: 800, gravity: 2200,
            laneTop: 0, laneBottom: 0,
            onShoot: ({ x, y, dir }) => this.bullets.push(new Bullet(x, y, dir, this.camera, this.canvas))
        });

        // Puertas
        this.doors = [];
        this._createDoors();

        // Fondos
        this.bg = new Image(); this.bgLoaded = false; this.bg.onload = () => this.bgLoaded = true; this.bg.src = fondoImgSrc;
        this.casas = new Image(); this.casasLoaded = false; this.casas.onload = () => this.casasLoaded = true; this.casas.src = casasImgSrc;

        // Transición de bruja
        this._initWitchTransition();

        // Overlay / hints
        this._buildOverlay();
        this.overlayOpen = false;
        this._lastDoorIdx = -1;
        this._entering = false; // evita dobles entradas
    }

    init() { }

    destroy() {
        if (this.overlay && this.overlay.parentNode) this.overlay.parentNode.removeChild(this.overlay);
        this.overlay = null;
        if (this._hintEl && this._hintEl.parentNode) this._hintEl.parentNode.removeChild(this._hintEl);
        this._hintEl = null;
        if (this._witchOverlay && this._witchOverlay.parentNode) this._witchOverlay.parentNode.removeChild(this._witchOverlay);
        this._witchOverlay = null;
        if (this._witchAudio) {
            this._witchAudio.pause();
            this._witchAudio = null;
        }
    }

    groundY = () => this.canvas.height - this.GROUND_MARGIN;

    resize() {
        const h = this.canvas.height;
        const bottom = this.groundY();
        const band = Math.floor(h * this.BAND_HEIGHT);
        this.WALK.bottom = bottom;
        this.WALK.top = Math.max(0, bottom - band);

        // límites del lane
        this.cholita.laneTop = this.WALK.top;
        this.cholita.laneBottom = this.WALK.bottom;

        // Restaurar estado inicial (una sola vez)
        if (!this._restored && this._initialState) {
            const s = this._initialState;
            this.cholita.x = clamp(s.x, 0, this.LEVEL_WIDTH - this.cholita.w);
            this.cholita.bottom = clamp(s.bottom, this.WALK.top, this.WALK.bottom);
            this.cholita.groundY = this.cholita.bottom;
            this.camera.x = clamp(s.cameraX, 0, Math.max(0, this.LEVEL_WIDTH - this.canvas.width));
            this._restored = true;
        } else {
            if (this.cholita.onGround) {
                const newBottom = clamp(this.cholita.bottom, this.WALK.top, this.WALK.bottom);
                this.cholita.groundY = newBottom;
                this.cholita.bottom = newBottom;
            } else {
                this.cholita.groundY = this.WALK.bottom;
            }
            if (!this._restored) {
                this.cholita.bottom = this.WALK.bottom;
                this.cholita.groundY = this.WALK.bottom;
            }
        }

        // Puertas: base al borde superior del lane
        const doorH = 92;
        this.doors.forEach(d => { d.h = doorH; d.y = this.WALK.top - doorH; });
    }

    onKeyDown(e) {
        if (e.code === 'KeyB') this.SHOW_BAND = !this.SHOW_BAND;
        if (e.code === 'KeyM') this.SHOW_MARKERS = !this.SHOW_MARKERS;
        if (e.code === 'KeyK') this.cholita.vx = this.cholita.facing * (this.cholita.speed * 1.8);
        // Entrada ahora es por disparo, no con "E"
        if (e.code === 'KeyW' || e.code === 'ArrowUp') this.cholita.jump?.();
    }

    onPointerDown() { this.cholita.shoot?.(); }
    onPointerMove(e) {
        const screenX = e.clientX;
        const playerScreenX = this.cholita.x - this.camera.x + this.cholita.w * 0.5;
        this.cholita.facing = screenX >= playerScreenX ? 1 : -1;
    }

    update(dt, { keys }) {
        this.cholita.update(keys, dt);
        this.cholita.x = clamp(this.cholita.x, 0, this.LEVEL_WIDTH - this.cholita.w);

        // Balas
        this.bullets.forEach(b => b.update(dt));
        this._handleBulletDoorCollisions(); // antes de podar
        for (let i = this.bullets.length - 1; i >= 0; i--) if (this.bullets[i].dead) this.bullets.splice(i, 1);

        // Cámara
        const target = clamp(
            this.cholita.x + this.cholita.w * 0.5 - this.canvas.width * 0.35,
            0,
            Math.max(0, this.LEVEL_WIDTH - this.canvas.width)
        );
        this.camera.x += (target - this.camera.x) * 0.12;
    }

    draw(ctx) {
        const w = this.canvas.width, h = this.canvas.height;

        // Cielo
        ctx.fillStyle = '#405988';
        ctx.fillRect(0, 0, w, h);

        // Fondo (parallax)
        if (this.bgLoaded) {
            const scaleH = h / this.bg.height;
            const imgW = this.bg.width * scaleH * this.BG_TILE_FACTOR;
            const imgH = h;
            const parallax = this.camera.x * 0.25;
            let startX = -((parallax % imgW) + imgW);
            for (let x = startX; x < w + imgW; x += imgW) {
                ctx.drawImage(this.bg, Math.floor(x), 0, Math.floor(imgW), imgH);
            }
        }

        // Casas
        if (this.casasLoaded) {
            const targetH = Math.floor(h * this.HOUSES_HEIGHT);
            const scale = targetH / this.casas.height;
            const imgW = this.casas.width * scale * this.HOUSES_WIDTH_FACTOR;
            const imgH = targetH;
            const yPos = h - imgH;
            const mOff = -((this.camera.x * 0.20) % imgW);
            for (let x = mOff - imgW; x < w + imgW; x += imgW) {
                ctx.drawImage(this.casas, Math.floor(x), Math.floor(yPos), Math.floor(imgW), Math.floor(imgH));
            }
        }

        // Banda jugable (debug)
        if (this.SHOW_BAND) {
            ctx.save();
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = '#2a59cf';
            ctx.fillRect(0, this.WALK.top, w, this.WALK.bottom - this.WALK.top);
            ctx.restore();
        }

        // Baldosas piso
        ctx.fillStyle = '#3a3a3a';
        const tileW = 40;
        const off = -((this.camera.x) % tileW);
        const tileY = this.groundY() - (this.GROUND_MARGIN - 8);
        for (let x = off; x < w; x += tileW) ctx.fillRect(Math.floor(x), tileY, 20, 8);

        // Marcadores (debug)
        if (this.SHOW_MARKERS) {
            ctx.fillStyle = '#415a77';
            for (let mx = 200; mx <= this.LEVEL_WIDTH; mx += 200) {
                const sx = Math.floor(mx - this.camera.x);
                if (sx >= -6 && sx <= w + 6) ctx.fillRect(sx, this.WALK.top - 40, 4, 40);
            }
        }

        // Puertas (solo las que existan)
        this.doors.forEach(d => d.draw(ctx, this.camera.x));

        // Balas + Jugador
        this.bullets.forEach(b => b.draw(ctx));
        this.cholita.draw(ctx, this.camera.x);
    }

    /* === Transición de Bruja === */
    _initWitchTransition() {
        this._witchAudio = new Audio();
        this._witchAudio.src = '/bruja/risabruja.ogg'; // ruta pública
        this._witchAudio.loop = false;
        this._witchAudio.volume = 0.8;

        this._createWitchOverlay();
    }


    _createWitchOverlay() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle at center, #1a0d1a, #000);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            pointer-events: none;
        `;

        // Contenedor de la bruja
        const witchContainer = document.createElement('div');
        witchContainer.style.cssText = `
            position: relative;
            max-width: 60vw;
            max-height: 70vh;
            filter: drop-shadow(0 0 30px #ff0066) contrast(1.2) brightness(0.9);
            animation: witchFloat 2s ease-in-out infinite, witchPulse 1s ease-in-out infinite alternate;
        `;

        // Imagen de la bruja
        const witchImg = document.createElement('img');
        witchImg.src = '/bruja/bru.jpg.png';
        witchImg.style.cssText = `
            width: 100%;
            height: auto;
            object-fit: contain;
        `;

        // Texto inquietante
        const scaryText = document.createElement('div');
        scaryText.textContent = 'LA PUERTA SE ABRE...';
        scaryText.style.cssText = `
            position: absolute;
            top: 10%;
            left: 50%;
            transform: translateX(-50%);
            color: #ff0066;
            font-size: clamp(24px, 4vw, 48px);
            text-shadow: 0 0 20px #ff0066, 0 0 40px #ff0066;
            text-align: center;
            font-family: 'Creepster', cursive;
            letter-spacing: 3px;
            opacity: 0;
            animation: textAppear 1s ease-in-out 0.5s forwards;
        `;

        // Efectos de partículas
        const particlesContainer = document.createElement('div');
        particlesContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        `;

        // Flash de rayo
        const lightning = document.createElement('div');
        lightning.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0);
            pointer-events: none;
        `;

        // Ensamblar overlay
        witchContainer.appendChild(witchImg);
        overlay.appendChild(witchContainer);
        overlay.appendChild(scaryText);
        overlay.appendChild(particlesContainer);
        overlay.appendChild(lightning);

        // Agregar estilos de animación
        const style = document.createElement('style');
        style.textContent = `
            @keyframes witchFloat {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-20px) rotate(2deg); }
            }
            
            @keyframes witchPulse {
                0% { filter: drop-shadow(0 0 30px #ff0066) contrast(1.2) brightness(0.9); }
                100% { filter: drop-shadow(0 0 50px #ff0066) contrast(1.4) brightness(1.1); }
            }
            
            @keyframes textAppear {
                0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                100% { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
            
            @keyframes particleFloat {
                0% { transform: translateY(100vh) scale(0); opacity: 0; }
                10% { opacity: 1; transform: translateY(90vh) scale(1); }
                90% { opacity: 1; transform: translateY(10vh) scale(1); }
                100% { transform: translateY(-10vh) scale(0); opacity: 0; }
            }
            
            @keyframes lightningFlash {
                0% { background: rgba(255, 255, 255, 0); }
                50% { background: rgba(255, 255, 255, 0.8); }
                100% { background: rgba(255, 255, 255, 0); }
            }
        `;
        document.head.appendChild(style);

        // Agregar al DOM
        const host = this.canvas.parentElement || document.body;
        host.appendChild(overlay);

        this._witchOverlay = overlay;
        this._witchLightning = lightning;
        this._witchParticles = particlesContainer;
    }

    _showWitchTransition(doorId, snapshot, callback) {
        if (!this._witchOverlay) return;

        // Mostrar overlay
        this._witchOverlay.style.display = 'flex';

        // Reproducir audio
        this._witchAudio.currentTime = 0;
        this._witchAudio.play().catch(e => console.log('Error audio bruja:', e));

        // Crear partículas
        this._createTransitionParticles();

        // Efectos de rayo
        this._createLightningEffects();

        // Ocultar después de 3 segundos y ejecutar callback
        setTimeout(() => {
            this._hideWitchTransition();
            if (callback) callback();
        }, 3000);
    }

    _hideWitchTransition() {
        if (this._witchOverlay) {
            this._witchOverlay.style.display = 'none';
        }
        if (this._witchAudio) {
            this._witchAudio.pause();
        }
    }

    _createTransitionParticles() {
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.style.cssText = `
                    position: absolute;
                    width: ${Math.random() * 6 + 2}px;
                    height: ${Math.random() * 6 + 2}px;
                    background: ${['#ff6b6b', '#4ecdc4', '#ffe66d'][Math.floor(Math.random() * 3)]};
                    border-radius: 50%;
                    left: ${Math.random() * 100}%;
                    animation: particleFloat ${8 + Math.random() * 4}s linear forwards;
                `;
                this._witchParticles.appendChild(particle);

                setTimeout(() => particle.remove(), 12000);
            }, i * 100);
        }
    }

    _createLightningEffects() {
        const flashCount = 3;
        for (let i = 0; i < flashCount; i++) {
            setTimeout(() => {
                this._witchLightning.style.animation = 'lightningFlash 0.3s ease-out';
                setTimeout(() => {
                    this._witchLightning.style.animation = '';
                }, 300);
            }, i * 800 + Math.random() * 500);
        }
    }

    /* === Colisiones bala - puerta === */
    _handleBulletDoorCollisions() {
        if (this._entering) return; // evita múltiples triggers

        for (let bi = 0; bi < this.bullets.length; bi++) {
            const b = this.bullets[bi];
            const bLeft = b.x, bTop = b.y, bRight = b.x + b.w, bBottom = b.y + b.h;

            for (let i = 0; i < this.doors.length; i++) {
                const d = this.doors[i];

                const left = d.x - d.w / 2;
                const top = d.y;
                const right = left + d.w;
                const bottom = top + d.h;

                const hit = !(bRight < left || bLeft > right || bBottom < top || bTop > bottom);
                if (hit) {
                    // Guarda datos ANTES de modificar arrays
                    const doorId = d.id;

                    // 1) eliminar puerta del mundo
                    this._destroyedDoorIds.add(doorId);
                    this.doors.splice(i, 1); // 👈 desaparece de inmediato
                    // 2) invalidar bala
                    b.dead = true;

                    // 3) feedback + entrar con transición
                    this._flashHint(`¡Puerta ${doorId} destruida!`);

                    // snapshot para volver exactamente al mismo lugar
                    const snapshot = {
                        x: this.cholita.x,
                        bottom: this.cholita.bottom,
                        cameraX: this.camera.x
                    };

                    // Entrar en micro-tick para evitar reentradas
                    this._entering = true;

                    // 🧙‍♀️ MOSTRAR TRANSICIÓN DE BRUJA ANTES DE ENTRAR
                    setTimeout(() => {
                        this._showWitchTransition(doorId, snapshot, () => {
                            this.enterDoorById(doorId, snapshot);
                        });
                    }, 500); // Pequeño delay para ver la puerta desaparecer

                    return;
                }
            }
        }
    }

    /* === Puertas === */
    _createDoors() {
        this.doors = [];
        const count = 7;
        const margin = 400;
        for (let i = 0; i < count; i++) {
            const t = (i + 1) / (count + 1);
            const x = Math.floor(margin + t * (this.LEVEL_WIDTH - margin * 2));
            const id = i + 1;
            // No recrear puertas ya destruidas previamente
            if (!this._destroyedDoorIds.has(id)) {
                this.doors.push(new Door(id, x, 0, 64, 92));
            }
        }
    }

    /* (solo si aún usas esta lógica en otro lado) */
    _nearestDoorIfInRange() {
        const pxCenter = this.cholita.x + this.cholita.w * 0.5;
        const pyFeet = this.cholita.bottom;

        const maxDX = 100;
        const laneH = Math.abs(this.WALK.bottom - this.WALK.top);
        const maxDY = laneH + 20;

        let found = -1;
        let best = 1e9;
        for (let i = 0; i < this.doors.length; i++) {
            const d = this.doors[i];
            const dx = Math.abs(d.x - pxCenter);
            const dy = Math.abs((d.y + d.h) - pyFeet);
            if (dx <= maxDX && dy <= maxDY && dx < best) { best = dx; found = i; }
        }
        return found;
    }

    /* === Overlay / Hints === */
    _buildOverlay() {
        const root = document.createElement('div');
        root.style.position = 'absolute';
        root.style.inset = '0';
        root.style.display = 'none';
        root.style.alignItems = 'center';
        root.style.justifyContent = 'center';
        root.style.zIndex = '999';
        root.style.pointerEvents = 'none';

        const shade = document.createElement('div');
        shade.style.position = 'absolute';
        shade.style.inset = '0';
        shade.style.background = 'rgba(0,0,0,0.55)';
        shade.style.pointerEvents = 'auto';
        shade.addEventListener('click', () => this._hideOverlay());

        const card = document.createElement('div');
        card.style.pointerEvents = 'auto';
        card.style.minWidth = '320px';
        card.style.maxWidth = '80vw';
        card.style.background = '#0b0f1a';
        card.style.color = 'white';
        card.style.border = '2px solid #5bc0be';
        card.style.borderRadius = '12px';
        card.style.boxShadow = '0 10px 30px rgba(0,0,0,0.4)';
        card.style.padding = '18px 22px';
        card.style.fontFamily = 'system-ui, sans-serif';
        card.style.whiteSpace = 'pre-wrap';

        const title = document.createElement('div');
        title.style.fontSize = '18px';
        title.style.fontWeight = '700';
        title.style.marginBottom = '10px';
        title.textContent = 'Puerta';

        const body = document.createElement('div');
        body.style.fontSize = '15px';
        body.style.lineHeight = '1.45';
        body.textContent = '...';

        const close = document.createElement('button');
        close.textContent = 'Cerrar (E)';
        close.style.marginTop = '14px';
        close.style.padding = '8px 14px';
        close.style.borderRadius = '8px';
        close.style.border = '1px solid #5bc0be';
        close.style.background = '#1c2541';
        close.style.color = '#fff';
        close.style.cursor = 'pointer';
        close.addEventListener('click', () => this._hideOverlay());

        card.appendChild(title);
        card.appendChild(body);
        card.appendChild(close);

        root.appendChild(shade);
        root.appendChild(card);

        this.overlay = root;
        this.overlayTitle = title;
        this.overlayBody = body;

        const host = this.canvas.parentElement || document.body;
        if (host === document.body) {
            document.body.style.position = document.body.style.position || 'relative';
        }
        host.appendChild(root);

        window.addEventListener('keydown', (ev) => {
            if (!this.overlayOpen) return;
            if (ev.code === 'KeyE' || ev.code === 'Escape') {
                this._hideOverlay();
                ev.preventDefault();
            }
        }, { passive: false });
    }

    _showOverlay(text) {
        if (!this.overlay) return;
        this.overlayTitle.textContent = 'Puerta';
        this.overlayBody.textContent = text;
        this.overlay.style.display = 'flex';
        this.overlayOpen = true;
    }
    _hideOverlay() { if (!this.overlay) return; this.overlay.style.display = 'none'; this.overlayOpen = false; }

    _flashHint(text) {
        if (!this._hintEl) {
            const el = document.createElement('div');
            el.style.position = 'absolute';
            el.style.left = '50%';
            el.style.bottom = '12%';
            el.style.transform = 'translateX(-50%)';
            el.style.padding = '8px 12px';
            el.style.borderRadius = '8px';
            el.style.background = 'rgba(0,0,0,0.7)';
            el.style.color = '#fff';
            el.style.font = '14px system-ui, sans-serif';
            el.style.zIndex = '1000';
            el.style.pointerEvents = 'none';
            el.style.display = 'none';
            const host = this.canvas.parentElement || document.body;
            host.appendChild(el);
            this._hintEl = el;
        }
        this._hintEl.textContent = text;
        this._hintEl.style.display = 'block';
        clearTimeout(this._hintTo);
        this._hintTo = setTimeout(() => { if (this._hintEl) this._hintEl.style.display = 'none'; }, 1100);
    }

    /* === Entrar a puerta por índice o id === */
    enterDoor(doorIdx) {
        if (doorIdx < 0 || doorIdx >= this.doors.length) return;
        const doorId = this.doors[doorIdx].id;
        this.enterDoorById(doorId);
    }

    enterDoorById(doorId, snapshotOptional = null) {
        // snapshot (si no vino de la colisión)
        const snapshot = snapshotOptional || {
            x: this.cholita.x,
            bottom: this.cholita.bottom,
            cameraX: this.camera.x
        };

        if (this.onEnterDoor) {
            this.onEnterDoor(doorId, snapshot);
            return;
        }

        if (this.goTo) {
            this.goTo(new DoorScene({
                canvas: this.canvas,
                ctx: this.ctx,
                camera: this.camera,
                doorId,
                goBack: () => {
                    this.goTo(new Level1Scene({
                        canvas: this.canvas,
                        ctx: this.ctx,
                        camera: this.camera,
                        goTo: this.goTo,
                        initialState: snapshot,
                        destroyedDoorIds: Array.from(this._destroyedDoorIds) // 👈 puertas rotas siguen ausentes
                    }));
                }
            }));
            return;
        }

        this._flashHint(`Puerta ${doorId} (falta configurar goTo/onEnterDoor)`);
    }
}

/* ====== Utiles locales ====== */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

class Bullet {
    constructor(x, y, dir, camera, canvas) {
        this.x = x; this.y = y; this.w = 20; this.h = 8;
        this.vx = dir * 880; this.dead = false;
        this.camera = camera; this.canvas = canvas;
    }
    update(dt) {
        this.x += this.vx * dt;
        if (this.x < this.camera.x - 300 || this.x > this.camera.x + this.canvas.width + 300) this.dead = true;
    }
    draw(ctx) {
        ctx.fillStyle = '#222120ff';
        ctx.fillRect(Math.floor(this.x - this.camera.x), Math.floor(this.y), this.w, this.h);
    }
}

/* ====== Puerta simple ====== */
class Door {
    constructor(id, x, y, w = 64, h = 92) {
        this.id = id;
        this.x = x;   // centro de la puerta en X
        this.y = y;   // esquina superior izquierda
        this.w = w;
        this.h = h;
    }
    draw(ctx, cameraX) {
        const sx = Math.floor(this.x - cameraX);
        const left = Math.floor(sx - this.w / 2);
        const top = Math.floor(this.y);

        ctx.save();
        // Marco
        ctx.fillStyle = '#6b4e3d';
        ctx.fillRect(left, top, this.w, this.h);
        // Interior
        ctx.fillStyle = '#3d2e26';
        ctx.fillRect(left + 6, top + 6, this.w - 12, this.h - 12);
        // Placa con número
        ctx.fillStyle = '#caa472';
        ctx.fillRect(left + this.w / 2 - 14, top + 10, 28, 18);
        ctx.fillStyle = '#1b1b1b';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(this.id), left + this.w / 2, top + 19);
        // Bisagra visual
        ctx.fillStyle = '#8d6e63';
        ctx.fillRect(left - 6, top + this.h - 2, this.w + 12, 4);
        ctx.restore();
    }
}