import { useEffect, useRef } from 'react';
import { drawFrame } from '../render/renderers';
import { createProject } from '../store/projectStore';
import type { BackgroundTemplate } from '../types';

export function TemplatePreview({ template, portrait = true }: { template: BackgroundTemplate; portrait?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    const project = createProject(template);
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      const time = ((now - start) / 1000) % project.animation.duration;
      drawFrame(ctx, project, time, { width: canvas.width, height: canvas.height });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [template]);

  return <canvas ref={canvasRef} className="template-canvas" width={portrait ? 360 : 480} height={portrait ? 640 : 300} aria-hidden="true" />;
}
