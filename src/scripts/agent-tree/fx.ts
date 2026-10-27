// L'effet signature de fin : confettis aux couleurs des agents, avec quelques hermines bretonnes.

import { reduceMotion } from "./motion";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
  ermine: boolean;
  rot: number;
}

const cssVar = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function drawErmine(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.quadraticCurveTo(x + s * 0.7, y + s * 0.2, x, y + s);
  ctx.quadraticCurveTo(x - s * 0.7, y + s * 0.2, x, y - s);
  ctx.fill();
  for (const [dx, dy] of [
    [-0.45, -1.35],
    [0, -1.6],
    [0.45, -1.35],
  ]) {
    ctx.beginPath();
    ctx.arc(x + dx * s, y + dy * s, s * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function createConfetti(canvas: HTMLCanvasElement, viewW: number, viewH: number) {
  const ctx = canvas.getContext("2d")!;
  let parts: Particle[] = [];

  new ResizeObserver(() => {
    const r = canvas.getBoundingClientRect();
    canvas.width = r.width * devicePixelRatio;
    canvas.height = r.height * devicePixelRatio;
  }).observe(canvas);

  /** Lance une gerbe depuis un point exprimé dans les coordonnées du SVG. */
  return function burst(fromX: number, fromY: number) {
    if (reduceMotion) return;
    const kx = canvas.width / viewW;
    const ky = canvas.height / viewH;
    const colors = ["--c-projets", "--c-parcours", "--c-stack", "--c-contact", "--accent"].map(
      cssVar,
    );
    const ink = cssVar("--fg");
    for (let i = 0; i < 70; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.6;
      const speed = (5 + Math.random() * 8) * kx;
      const ermine = i % 6 === 0;
      parts.push({
        x: fromX * kx,
        y: fromY * ky,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.6,
        life: 1,
        size: (5 + Math.random() * 5) * kx,
        color: ermine ? ink : colors[i % colors.length],
        ermine,
        rot: Math.random() * 6,
      });
    }
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      parts = parts.filter((p) => p.life > 0);
      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.26 * kx;
        p.vx *= 0.985;
        p.life -= 0.011;
        p.rot += 0.09;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        if (p.ermine) drawErmine(ctx, p.x, p.y, p.size);
        else {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
      if (parts.length) requestAnimationFrame(tick);
    };
    tick();
  };
}
