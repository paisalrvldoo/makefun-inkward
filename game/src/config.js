export const WIDTH = 1280;
export const HEIGHT = 800;
export const STEP = 1 / 60;
export const FIELD = { x: 18, y: 128, w: 978, h: 566 };
export const BELL = { x: 494, y: 411, radius: 33, hp: 12 };
export const MONK = { speed: 220, radius: 14, dashSpeed: 720, dashTime: 0.18, dashCooldown: 1.65 };
export const INK = { max: 100, regen: 11, cost: 0.065, width: 9, lifetime: 16, closeRadius: 26, minLength: 135 };
export const COLORS = {
  paper: '#d8cdb5', ink: '#0a0f16', faint: '#4a4c40', red: '#c93127', gold: '#c49a3d',
  line: '#a17e32', green: '#3d6d5d', pink: '#d9a09c', blue: '#5b829e', white: '#faf4e4',
};
export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const inField = p => p.x >= FIELD.x + 8 && p.x <= FIELD.x + FIELD.w - 8 && p.y >= FIELD.y + 8 && p.y <= FIELD.y + FIELD.h - 8;
