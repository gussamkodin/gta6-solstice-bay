// Keyboard + mouse state. Pointer lock gives free-look aiming; keys are edge- and level-triggered.
// The weapon wheel (hold Q) releases pointer lock and tracks the cursor in screen pixels instead.
export const keys = new Set();
export const pressed = new Set();
export const mouse = { dx: 0, dy: 0, down: false, clicked: false, locked: false, x: 0, y: 0 };

export function initInput(canvas, onEscape) {
  addEventListener('keydown', e => {
    if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code)) e.preventDefault();
    if (!keys.has(e.code)) pressed.add(e.code);
    keys.add(e.code);
    if (e.code === 'Escape') onEscape();
  });
  addEventListener('keyup', e => keys.delete(e.code));
  addEventListener('blur', () => { keys.clear(); mouse.down = false; });
  canvas.addEventListener('mousedown', e => {
    if (e.button === 0) {
      mouse.down = true; mouse.clicked = true;
      if (!mouse.locked) { const req = canvas.requestPointerLock?.(); if (req && req.catch) req.catch(() => {}); }
    }
  });
  addEventListener('mouseup', e => { if (e.button === 0) mouse.down = false; });
  addEventListener('mousemove', e => {
    mouse.x = e.clientX; mouse.y = e.clientY;
    if (mouse.locked) { mouse.dx += e.movementX; mouse.dy += e.movementY; }
  });
  document.addEventListener('pointerlockchange', () => {
    mouse.locked = document.pointerLockElement === canvas;
    if (!mouse.locked && !wheelActive) mouse.down = false;
  });
}
export const key = c => keys.has(c);
export const hit = c => pressed.has(c);
// while the weapon wheel is open the cursor must survive pointer-lock loss
let wheelActive = false;
export function setWheelActive(on) { wheelActive = on; }
export function endFrame() { pressed.clear(); mouse.dx = 0; mouse.dy = 0; mouse.clicked = false; }
export function axis(neg, pos) { return (key(pos) ? 1 : 0) - (key(neg) ? 1 : 0); }
