import './style.css';
import Level1Scene from './scenes/Level1.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });
const camera = { x: 0 };
const keys = new Set();
let last = performance.now();
let current = null;
let paused = false;

/* ===== gestor de escena ===== */
function setScene(scene) {
  if (current?.destroy) current.destroy();
  current = scene;
  current?.init?.();
  onResize();
}

function onResize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  current?.resize?.();
}
addEventListener('resize', onResize);

/* ===== entradas ===== */
addEventListener('keydown', (e) => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  keys.add(e.code);
  current?.onKeyDown?.(e);
}, { passive: false });

addEventListener('keyup', (e) => {
  keys.delete(e.code);
  current?.onKeyUp?.(e);
}, { passive: true });

canvas.addEventListener('pointerdown', (e) => current?.onPointerDown?.(e), { passive: true });
canvas.addEventListener('pointermove', (e) => current?.onPointerMove?.(e), { passive: true });
canvas.addEventListener('pointerup', (e) => current?.onPointerUp?.(e), { passive: true });

/* ===== loop ===== */
function loop(now) {
  const dt = paused ? 0 : Math.min(0.033, (now - last) / 1000);
  last = now;
  current?.update?.(dt, { keys, camera, canvas, ctx });
  current?.draw?.(ctx, { camera, canvas });
  requestAnimationFrame(loop);
}

/* ===== iniciar juego ===== */
function startGame() {
  // Oculta menú si existe
  const menu = document.getElementById('menu');
  if (menu) menu.style.display = 'none';

  // Muestra canvas
  canvas.style.display = 'block';
  canvas.tabIndex = 0; // para poder enfocar y captar teclas
  canvas.focus();

  setScene(new Level1Scene({ canvas, ctx, camera, goTo: setScene }));
  requestAnimationFrame(loop);

  // Si tienes overlay de transición con id="transition", haz fade-out
  const trans = document.getElementById('transition');
  if (trans) {
    setTimeout(() => trans.classList.add('fade-out'), 300);
  }
}

/* ===== auto/submit ===== */
window.addEventListener('load', () => {
  const form = document.getElementById('login-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      startGame();
    });
  } else {
    // No hay formulario -> arranca directdasddasd
    startGame();
  }
});
