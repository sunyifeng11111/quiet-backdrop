import type { BackgroundProject } from '../types';

export interface RenderViewport {
  width: number;
  height: number;
}

const TAU = Math.PI * 2;

export const animationPhase = (time: number, speed: number) => {
  const cyclesPerSecond = 0.06 + speed * 0.24;
  return (time * cyclesPerSecond * TAU) % TAU;
};

const hexToRgb = (hex: string) => ({
  r: Number.parseInt(hex.slice(1, 3), 16),
  g: Number.parseInt(hex.slice(3, 5), 16),
  b: Number.parseInt(hex.slice(5, 7), 16),
});

const colorWithAlpha = (hex: string, alpha: number) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const mixColor = (a: string, b: string, amount: number) => {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const lerp = (x: number, y: number) => Math.round(x + (y - x) * amount);
  return `rgb(${lerp(ca.r, cb.r)}, ${lerp(ca.g, cb.g)}, ${lerp(ca.b, cb.b)})`;
};

const seeded = (x: number, y: number, seed: number) => {
  const value = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return value - Math.floor(value);
};

const setup = (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, project: BackgroundProject, viewport: RenderViewport) => {
  const { width, height } = viewport;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, project.quick.background);
  gradient.addColorStop(1, mixColor(project.quick.background, project.quick.accent, 0.12 + project.quick.energy * 0.08));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.translate(width * (0.5 + project.canvas.offsetX * 0.35), height * (0.5 + project.canvas.offsetY * 0.35));
  ctx.rotate(project.quick.direction * Math.PI / 180);
};

const drawGrid = (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, project: BackgroundProject, time: number, viewport: RenderViewport) => {
  const { width, height } = viewport;
  const q = project.quick;
  const a = project.advanced;
  const phase = animationPhase(time, q.speed);
  const base = Math.max(24, Math.min(width, height) * 0.095 * a.spacing / (0.55 + q.density));
  const reach = Math.hypot(width, height) * 0.72;
  ctx.lineWidth = Math.max(0.7, Math.min(width, height) / 900) * a.thickness;
  ctx.strokeStyle = colorWithAlpha(q.foreground, a.opacity);
  const drift = Math.sin(phase * Math.max(1, Math.round(a.frequency))) * base * q.speed;
  const energy = q.energy * a.amplitude;

  for (let x = -reach; x <= reach; x += base) {
    ctx.beginPath();
    for (let y = -reach; y <= reach; y += 8) {
      const wave = Math.sin(y / base * a.frequency + phase + x / base) * base * 0.18 * energy;
      const px = x + wave + drift;
      const perspective = 1 + (y / reach) * a.perspective * 0.28;
      if (y === -reach) ctx.moveTo(px * perspective, y);
      else ctx.lineTo(px * perspective, y);
    }
    ctx.stroke();
  }
  for (let y = -reach; y <= reach; y += base) {
    ctx.beginPath();
    for (let x = -reach; x <= reach; x += 8) {
      const wave = Math.cos(x / base * a.frequency + phase + y / base) * base * 0.14 * energy;
      const py = y + wave - drift * 0.55;
      if (x === -reach) ctx.moveTo(x, py);
      else ctx.lineTo(x, py);
    }
    ctx.stroke();
  }
};

const drawCross = (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, project: BackgroundProject, time: number, viewport: RenderViewport) => {
  const { width, height } = viewport;
  const q = project.quick;
  const a = project.advanced;
  const phase = animationPhase(time, q.speed);
  const step = Math.max(30, Math.min(width, height) * 0.12 * a.spacing / (0.5 + q.density));
  const reach = Math.hypot(width, height) * 0.72;
  const arm = step * (0.12 + q.energy * 0.12) * a.scale;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1, Math.min(width, height) / 720) * a.thickness;
  for (let x = -reach; x <= reach; x += step) {
    for (let y = -reach; y <= reach; y += step) {
      const r = seeded(Math.round(x / step), Math.round(y / step), q.seed);
      const pulse = 0.72 + Math.sin(phase * Math.max(1, Math.round(a.frequency)) + r * TAU) * 0.28 * q.energy;
      const dx = Math.sin(phase + r * TAU) * step * 0.16 * q.speed * a.amplitude;
      const dy = Math.cos(phase + r * TAU) * step * 0.16 * q.speed * a.amplitude;
      ctx.strokeStyle = colorWithAlpha(r > 0.82 ? q.accent : q.foreground, a.opacity * (0.55 + r * 0.45));
      ctx.beginPath();
      ctx.moveTo(x + dx - arm * pulse, y + dy);
      ctx.lineTo(x + dx + arm * pulse, y + dy);
      ctx.moveTo(x + dx, y + dy - arm * pulse);
      ctx.lineTo(x + dx, y + dy + arm * pulse);
      ctx.stroke();
    }
  }
};

const drawDots = (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, project: BackgroundProject, time: number, viewport: RenderViewport) => {
  const { width, height } = viewport;
  const q = project.quick;
  const a = project.advanced;
  const phase = animationPhase(time, q.speed);
  const step = Math.max(18, Math.min(width, height) * 0.085 * a.spacing / (0.48 + q.density));
  const reach = Math.hypot(width, height) * 0.72;
  for (let x = -reach; x <= reach; x += step) {
    for (let y = -reach; y <= reach; y += step) {
      const r = seeded(Math.round(x / step), Math.round(y / step), q.seed);
      const wave = Math.sin(x / step * a.frequency * 0.55 + y / step * 0.3 + phase * Math.max(1, Math.round(a.frequency)));
      const radius = Math.max(0.8, step * 0.055 * a.thickness * (1 + wave * q.energy * a.amplitude));
      const drift = step * 0.18 * q.speed * a.amplitude;
      ctx.fillStyle = colorWithAlpha(r > 0.88 ? q.accent : q.foreground, a.opacity * (0.45 + r * 0.55));
      ctx.beginPath();
      ctx.arc(x + Math.sin(phase + r * TAU) * drift, y + Math.cos(phase + r * TAU) * drift, Math.max(0.2, radius), 0, TAU);
      ctx.fill();
    }
  }
};

const drawFlow = (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, project: BackgroundProject, time: number, viewport: RenderViewport) => {
  const { width, height } = viewport;
  const q = project.quick;
  const a = project.advanced;
  const phase = animationPhase(time, q.speed);
  const reach = Math.hypot(width, height) * 0.75;
  const count = Math.round(7 + q.density * 24);
  const gap = (reach * 1.5) / Math.max(1, count - 1);
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(0.8, Math.min(width, height) / 820) * a.thickness;
  for (let line = 0; line < count; line += 1) {
    const yBase = -reach * 0.75 + line * gap;
    ctx.strokeStyle = colorWithAlpha(line % 7 === 0 ? q.accent : q.foreground, a.opacity * (0.38 + line / count * 0.4));
    ctx.beginPath();
    for (let x = -reach; x <= reach; x += 7) {
      const waveA = Math.sin(x / reach * TAU * a.frequency + phase * (1 + q.speed * 1.5) + line * 0.21);
      const waveB = Math.cos(x / reach * Math.PI * a.frequency * 1.7 - phase + line * 0.13);
      const y = yBase + (waveA * 0.7 + waveB * 0.3) * gap * q.energy * a.amplitude * 1.8;
      if (x === -reach) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
};

export const drawFrame = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  project: BackgroundProject,
  time: number,
  viewport: RenderViewport,
) => {
  ctx.save();
  setup(ctx, project, viewport);
  if (project.renderer === 'grid') drawGrid(ctx, project, time, viewport);
  if (project.renderer === 'cross') drawCross(ctx, project, time, viewport);
  if (project.renderer === 'dots') drawDots(ctx, project, time, viewport);
  if (project.renderer === 'flow') drawFlow(ctx, project, time, viewport);
  ctx.restore();
};

export const getDimensions = (aspectRatio: BackgroundProject['canvas']['aspectRatio'], resolution: BackgroundProject['canvas']['resolution']) => {
  const base = resolution === '2k' ? 1440 : 1080;
  if (aspectRatio === '16:9') return { width: resolution === '2k' ? 2560 : 1920, height: base };
  if (aspectRatio === '9:16') return { width: base, height: resolution === '2k' ? 2560 : 1920 };
  if (aspectRatio === '4:5') return { width: base, height: resolution === '2k' ? 1800 : 1350 };
  return { width: base, height: base };
};
