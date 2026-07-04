import { useEffect, useRef } from 'react';
import { CornersOut, Pause, Play } from '@phosphor-icons/react';
import { drawFrame } from '../render/renderers';
import type { BackgroundProject } from '../types';

interface BackgroundCanvasProps {
  project: BackgroundProject;
  time: number;
  playing: boolean;
  onTimeChange: (time: number) => void;
  onPlayingChange: (playing: boolean) => void;
  onOffsetChange: (x: number, y: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onResetOffset: () => void;
}

export function BackgroundCanvas({
  project,
  time,
  playing,
  onTimeChange,
  onPlayingChange,
  onOffsetChange,
  onDragStart,
  onDragEnd,
  onResetOffset,
}: BackgroundCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const projectRef = useRef(project);
  const timeRef = useRef(time);
  const playingRef = useRef(playing);
  const lastFrame = useRef(0);
  const lastNotify = useRef(0);
  const dragRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);

  useEffect(() => { projectRef.current = project; }, [project]);
  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { timeRef.current = time; }, [time]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let raf = 0;
    const render = (now: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d', { alpha: false });
      const current = projectRef.current;
      if (canvas && ctx) {
        if (playingRef.current) {
          const delta = lastFrame.current === 0 ? 0 : Math.min(0.05, (now - lastFrame.current) / 1000);
          timeRef.current = (timeRef.current + delta) % current.animation.duration;
          if (now - lastNotify.current > 120) {
            onTimeChange(timeRef.current);
            lastNotify.current = now;
          }
        }
        drawFrame(ctx, current, timeRef.current, { width: canvas.width, height: canvas.height });
      }
      lastFrame.current = now;
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [onTimeChange]);

  const pointerDown = (event: React.PointerEvent) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, startX: project.canvas.offsetX, startY: project.canvas.offsetY };
    onDragStart();
  };

  const pointerMove = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    const wrap = wrapRef.current;
    if (!drag || !wrap) return;
    const rect = wrap.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, drag.startX + (event.clientX - drag.x) / rect.width));
    const y = Math.max(-1, Math.min(1, drag.startY + (event.clientY - drag.y) / rect.height));
    onOffsetChange(x, y);
  };

  const pointerUp = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    onDragEnd();
  };

  return (
    <div className="canvas-frame" data-aspect={project.canvas.aspectRatio}>
      <div
        ref={wrapRef}
        className="canvas-wrap"
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
        onDoubleClick={onResetOffset}
      >
        <canvas ref={canvasRef} aria-label="视频背景实时预览" />
        <CompositionOverlay project={project} />
        <button className="canvas-reset" type="button" onPointerDown={(event) => event.stopPropagation()} onClick={onResetOffset} aria-label="复位背景位置">
          <CornersOut size={16} />
        </button>
      </div>
      <div className="playback-bar">
        <button className="icon-button" type="button" onClick={() => onPlayingChange(!playing)} aria-label={playing ? '暂停预览' : '播放预览'}>
          {playing ? <Pause weight="fill" size={15} /> : <Play weight="fill" size={15} />}
        </button>
        <input
          className="timeline"
          type="range"
          min="0"
          max={project.animation.duration}
          step="0.01"
          value={Math.min(time, project.animation.duration)}
          onChange={(event) => onTimeChange(Number(event.target.value))}
          aria-label="预览时间"
        />
        <span className="timecode">{time.toFixed(1)}s / {project.animation.duration}s</span>
      </div>
    </div>
  );
}

function CompositionOverlay({ project }: { project: BackgroundProject }) {
  const guide = project.guide;
  if (guide.mode === 'none') return null;
  return (
    <div className={`composition-overlay guide-${guide.mode} tone-${guide.textTone}`} aria-hidden="true">
      <div className="safe-boundary" />
      <div className="person-zone"><span>人物区域</span></div>
      {guide.showText && (
        <div className="preview-copy">
          <strong>{guide.title}</strong>
          <span>{guide.subtitle}</span>
        </div>
      )}
    </div>
  );
}
