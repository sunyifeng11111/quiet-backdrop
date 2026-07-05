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

const solidBackdropRenderers = new Set<BackgroundProject['renderer']>(['scroll-grid', 'gradient', 'spotlight', 'grain', 'scanline']);

export const loopingPhase = (time: number, duration: number, speed: number) => {
  const progress = duration > 0 ? ((time % duration) + duration) % duration / duration : 0;
  const cycleCount = 1 + Math.round(speed * 3);
  return progress * cycleCount * TAU;
};

const setup = (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, project: BackgroundProject, viewport: RenderViewport) => {
  const { width, height } = viewport;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (solidBackdropRenderers.has(project.renderer)) {
    ctx.fillStyle = project.quick.background;
  } else {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, project.quick.background);
    gradient.addColorStop(1, mixColor(project.quick.background, project.quick.accent, 0.12 + project.quick.energy * 0.08));
    ctx.fillStyle = gradient;
  }
  ctx.fillRect(0, 0, width, height);
  ctx.translate(width * (0.5 + project.canvas.offsetX * 0.35), height * (0.5 + project.canvas.offsetY * 0.35));
  if (project.renderer !== 'scroll-grid') ctx.rotate(project.quick.direction * Math.PI / 180);
};

export const scrollGridOffset = (time: number, duration: number, speed: number, spacing: number, direction: number) => {
  const cycleCount = 2 + Math.round(speed * 18);
  const progress = duration > 0 ? ((time % duration) + duration) % duration / duration : 0;
  if (progress === 0) return 0;
  const sign = direction === 90 ? 1 : -1;
  return progress * spacing * cycleCount * sign;
};

const drawScrollGrid = (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, project: BackgroundProject, time: number, viewport: RenderViewport) => {
  const { width, height } = viewport;
  const q = project.quick;
  const a = project.advanced;
  const spacing = Math.max(16, Math.min(width, height) * 0.05 * a.spacing / (0.6 + q.density));
  const reach = Math.hypot(width, height) * 0.75;
  const travel = scrollGridOffset(time, project.animation.duration, q.speed, spacing, q.direction);
  const offset = ((travel % spacing) + spacing) % spacing;

  ctx.lineWidth = Math.max(0.65, Math.min(width, height) / 1080) * a.thickness;
  ctx.strokeStyle = colorWithAlpha(q.foreground, a.opacity);
  ctx.beginPath();
  for (let x = -reach; x <= reach; x += spacing) {
    ctx.moveTo(x, -reach);
    ctx.lineTo(x, reach);
  }
  for (let y = -reach + offset - spacing; y <= reach + spacing; y += spacing) {
    ctx.moveTo(-reach, y);
    ctx.lineTo(reach, y);
  }
  ctx.stroke();
};

const drawGradient = (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, project: BackgroundProject, time: number, viewport: RenderViewport) => {
  const { width, height } = viewport;
  const q = project.quick;
  const a = project.advanced;
  const phase = loopingPhase(time, project.animation.duration, q.speed);
  const reach = Math.hypot(width, height) * 0.8;
  ctx.fillStyle = q.background;
  ctx.fillRect(-reach, -reach, reach * 2, reach * 2);

  const blobs = [
    { color: q.foreground, x: Math.cos(phase) * width * 0.24, y: Math.sin(phase * 0.75) * height * 0.22, radius: reach * 0.58 },
    { color: q.accent, x: Math.cos(phase * 0.6 + 2.2) * width * 0.3, y: Math.sin(phase + 1.1) * height * 0.28, radius: reach * 0.52 },
  ];
  for (const blob of blobs) {
    const radius = blob.radius * a.scale * (0.84 + q.energy * a.amplitude * 0.22);
    const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, radius);
    gradient.addColorStop(0, colorWithAlpha(blob.color, a.opacity * (0.34 + q.energy * 0.2)));
    gradient.addColorStop(0.48, colorWithAlpha(blob.color, a.opacity * 0.16));
    gradient.addColorStop(1, colorWithAlpha(blob.color, 0));
    ctx.fillStyle = gradient;
    ctx.fillRect(-reach, -reach, reach * 2, reach * 2);
  }
};

const drawSpotlight = (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, project: BackgroundProject, time: number, viewport: RenderViewport) => {
  const { width, height } = viewport;
  const q = project.quick;
  const a = project.advanced;
  const phase = loopingPhase(time, project.animation.duration, q.speed);
  const reach = Math.hypot(width, height) * 0.8;
  const pulse = 0.5 + Math.sin(phase * Math.max(1, Math.round(a.frequency))) * 0.5;
  const radius = Math.max(width, height) * a.scale * (0.46 + pulse * 0.08 * a.amplitude);

  ctx.fillStyle = q.background;
  ctx.fillRect(-reach, -reach, reach * 2, reach * 2);

  const primaryX = -width * 0.22 + Math.sin(phase * 0.5) * width * 0.12;
  const primaryY = -height * 0.14 + Math.cos(phase * 0.5) * height * 0.08;
  const primary = ctx.createRadialGradient(primaryX, primaryY, 0, primaryX, primaryY, radius);
  primary.addColorStop(0, colorWithAlpha(q.foreground, a.opacity * (0.32 + pulse * 0.1)));
  primary.addColorStop(0.42, colorWithAlpha(q.foreground, a.opacity * 0.16));
  primary.addColorStop(1, colorWithAlpha(q.foreground, 0));
  ctx.fillStyle = primary;
  ctx.fillRect(-reach, -reach, reach * 2, reach * 2);

  const secondaryX = width * 0.28 + Math.cos(phase * 0.5) * width * 0.1;
  const secondaryY = height * 0.22 + Math.sin(phase * 0.5) * height * 0.1;
  const secondaryRadius = radius * (0.72 + pulse * 0.12);
  const secondary = ctx.createRadialGradient(secondaryX, secondaryY, 0, secondaryX, secondaryY, secondaryRadius);
  secondary.addColorStop(0, colorWithAlpha(q.accent, a.opacity * (0.24 + q.energy * 0.12)));
  secondary.addColorStop(0.48, colorWithAlpha(q.accent, a.opacity * 0.1));
  secondary.addColorStop(1, colorWithAlpha(q.accent, 0));
  ctx.fillStyle = secondary;
  ctx.fillRect(-reach, -reach, reach * 2, reach * 2);

  const vignette = ctx.createRadialGradient(0, 0, Math.min(width, height) * 0.18, 0, 0, reach * 0.9);
  vignette.addColorStop(0.42, colorWithAlpha(q.background, 0));
  vignette.addColorStop(1, colorWithAlpha(q.background, 0.76));
  ctx.fillStyle = vignette;
  ctx.fillRect(-reach, -reach, reach * 2, reach * 2);
};

const drawGrain = (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, project: BackgroundProject, time: number, viewport: RenderViewport) => {
  const { width, height } = viewport;
  const q = project.quick;
  const a = project.advanced;
  const reach = Math.hypot(width, height) * 0.8;
  const frameCount = 12 + Math.round(q.speed * 36);
  const progress = project.animation.duration > 0 ? (time % project.animation.duration) / project.animation.duration : 0;
  const phase = progress * TAU;
  const noiseFrame = Math.floor(progress * frameCount);
  const count = Math.round(width * height / (340 - q.density * 150));
  const size = Math.max(1.25, Math.min(width, height) / 860) * a.thickness * a.scale;

  const base = ctx.createLinearGradient(-reach, -reach, reach, reach);
  base.addColorStop(0, mixColor(q.background, q.foreground, 0.08));
  base.addColorStop(0.52, q.background);
  base.addColorStop(1, mixColor(q.background, q.accent, 0.16));
  ctx.fillStyle = base;
  ctx.fillRect(-reach, -reach, reach * 2, reach * 2);

  const leakX = -width * 0.48 + Math.sin(progress * TAU) * width * 0.08;
  const leakY = height * 0.18;
  const leak = ctx.createRadialGradient(leakX, leakY, 0, leakX, leakY, height * 0.82);
  leak.addColorStop(0, colorWithAlpha(q.accent, a.opacity * (0.22 + q.energy * 0.18)));
  leak.addColorStop(0.4, colorWithAlpha(q.accent, a.opacity * 0.08));
  leak.addColorStop(1, colorWithAlpha(q.accent, 0));
  ctx.fillStyle = leak;
  ctx.fillRect(-reach, -reach, reach * 2, reach * 2);

  ctx.strokeStyle = colorWithAlpha(q.foreground, a.opacity * (0.5 + q.energy * 0.38));
  ctx.lineWidth = size;
  ctx.beginPath();
  for (let index = 0; index < count; index += 1) {
    const x = (seeded(index, noiseFrame * 1.7, q.seed) * 2 - 1) * reach;
    const y = (seeded(index * 1.9, noiseFrame * 2.3, q.seed + 11) * 2 - 1) * reach;
    const grainSize = size * (0.45 + seeded(index * 2.7, noiseFrame, q.seed + 23) * 0.8);
    ctx.moveTo(x, y);
    ctx.lineTo(x + grainSize, y);
  }
  ctx.stroke();

  const dustCount = Math.round(18 + q.density * 34);
  ctx.fillStyle = colorWithAlpha(q.foreground, a.opacity * 0.34);
  ctx.beginPath();
  for (let index = 0; index < dustCount; index += 1) {
    const x = (seeded(index * 3.1, noiseFrame * 0.6, q.seed + 31) * 2 - 1) * reach;
    const y = (seeded(index * 4.3, noiseFrame * 0.9, q.seed + 47) * 2 - 1) * reach;
    const radius = size * (0.7 + seeded(index, noiseFrame, q.seed + 59) * 2.2);
    ctx.moveTo(x + radius, y);
    ctx.arc(x, y, radius, 0, TAU);
  }
  ctx.fill();

  const scratchCount = Math.round(3 + q.density * 7);
  ctx.strokeStyle = colorWithAlpha(q.foreground, a.opacity * 0.16);
  ctx.lineWidth = Math.max(0.45, size * 0.34);
  ctx.beginPath();
  for (let index = 0; index < scratchCount; index += 1) {
    const x = (seeded(index * 5.7, q.seed, 7) * 2 - 1) * width * 0.55;
    const y = (seeded(index * 2.4, noiseFrame * 0.15, q.seed + 71) * 2 - 1) * height * 0.55;
    const length = height * (0.18 + seeded(index, q.seed, 13) * 0.38);
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.sin(index + phase) * size, y + length);
  }
  ctx.stroke();

  const vignette = ctx.createRadialGradient(0, 0, Math.min(width, height) * 0.24, 0, 0, reach * 0.86);
  vignette.addColorStop(0.48, colorWithAlpha('#000000', 0));
  vignette.addColorStop(1, colorWithAlpha('#000000', 0.58));
  ctx.fillStyle = vignette;
  ctx.fillRect(-reach, -reach, reach * 2, reach * 2);
};

const drawScanline = (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, project: BackgroundProject, time: number, viewport: RenderViewport) => {
  const { width, height } = viewport;
  const q = project.quick;
  const a = project.advanced;
  const reach = Math.hypot(width, height) * 0.8;
  const phase = loopingPhase(time, project.animation.duration, q.speed);
  const progress = (phase / TAU) % 1;
  const gap = Math.max(6, Math.min(width, height) * 0.018 * a.spacing / (0.62 + q.density));
  const offset = (progress * gap * (2 + Math.round(q.speed * 8))) % gap;

  ctx.fillStyle = q.background;
  ctx.fillRect(-reach, -reach, reach * 2, reach * 2);
  ctx.strokeStyle = colorWithAlpha(q.foreground, a.opacity * 0.48);
  ctx.lineWidth = Math.max(0.55, Math.min(width, height) / 1200) * a.thickness;
  ctx.beginPath();
  for (let y = -reach + offset; y <= reach; y += gap) {
    ctx.moveTo(-reach, y);
    ctx.lineTo(reach, y);
  }
  ctx.stroke();

  const sweepY = -height * 0.72 + progress * height * 1.44;
  const band = height * (0.06 + q.energy * a.amplitude * 0.12);
  const sweep = ctx.createLinearGradient(0, sweepY - band, 0, sweepY + band);
  sweep.addColorStop(0, colorWithAlpha(q.accent, 0));
  sweep.addColorStop(0.5, colorWithAlpha(q.accent, a.opacity * (0.12 + q.energy * 0.36)));
  sweep.addColorStop(1, colorWithAlpha(q.accent, 0));
  ctx.fillStyle = sweep;
  ctx.fillRect(-reach, sweepY - band, reach * 2, band * 2);
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
  if (project.renderer === 'scroll-grid') drawScrollGrid(ctx, project, time, viewport);
  if (project.renderer === 'gradient') drawGradient(ctx, project, time, viewport);
  if (project.renderer === 'spotlight') drawSpotlight(ctx, project, time, viewport);
  if (project.renderer === 'grain') drawGrain(ctx, project, time, viewport);
  if (project.renderer === 'scanline') drawScanline(ctx, project, time, viewport);
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
