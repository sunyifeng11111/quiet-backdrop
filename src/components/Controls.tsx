import * as Slider from '@radix-ui/react-slider';
import { ArrowsClockwise, CaretDown, DiceFive, SlidersHorizontal } from '@phosphor-icons/react';
import { useState } from 'react';
import { track } from '../lib/analytics';
import { getTemplate } from '../data/templates';
import { useProjectStore } from '../store/projectStore';
import type { AdvancedControls, AspectRatio, QuickControls } from '../types';

const palettes = [
  ['#f1f0eb', '#8d918b', '#4d6bff'],
  ['#101214', '#b6bbb5', '#7d94ff'],
  ['#071a1b', '#3d9189', '#65e3d3'],
  ['#171310', '#d28c5e', '#ffb077'],
  ['#1b1020', '#d282bc', '#ff99e0'],
  ['#eceff1', '#87939a', '#406fff'],
];

interface RangeControlProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  display?: string;
  onChange: (value: number) => void;
  onStart: () => void;
  onEnd: () => void;
}

export function RangeControl({ label, value, min = 0, max = 1, step = 0.01, display, onChange, onStart, onEnd }: RangeControlProps) {
  return (
    <label className="range-control">
      <span><b>{label}</b><output>{display ?? Math.round(value * 100)}</output></span>
      <Slider.Root className="slider-root" min={min} max={max} step={step} value={[value]} onValueChange={([next]) => onChange(next)} onPointerDown={onStart} onPointerUp={onEnd} onPointerCancel={onEnd}>
        <Slider.Track className="slider-track"><Slider.Range className="slider-range" /></Slider.Track>
        <Slider.Thumb className="slider-thumb" aria-label={label} />
      </Slider.Root>
    </label>
  );
}

export function QuickControlsPanel() {
  const project = useProjectStore((state) => state.project);
  const update = useProjectStore((state) => state.update);
  const begin = useProjectStore((state) => state.beginTransaction);
  const commit = useProjectStore((state) => state.commitTransaction);
  if (!project) return null;
  const setQuick = <K extends keyof QuickControls>(key: K, value: QuickControls[K]) => update((draft) => { draft.quick[key] = value; }, false);
  const setPalette = ([background, foreground, accent]: string[]) => update((draft) => {
    draft.quick.background = background;
    draft.quick.foreground = foreground;
    draft.quick.accent = accent;
  });
  const range = (key: 'density' | 'speed' | 'energy' | 'direction', label: string, max = 1, display?: string) => (
    <RangeControl label={label} value={project.quick[key]} max={max} step={key === 'direction' ? 1 : 0.01} display={display} onChange={(value) => setQuick(key, value)} onStart={begin} onEnd={commit} />
  );
  return (
    <div className="control-stack">
      <section className="control-section">
        <div className="section-heading"><h3>配色</h3><span>背景 / 图形 / 强调</span></div>
        <div className="palette-grid">
          {palettes.map((palette) => (
            <button key={palette.join()} className="palette-button" type="button" onClick={() => setPalette(palette)} aria-label={`应用配色 ${palette.join(' ')}`}>
              {palette.map((color) => <i key={color} style={{ background: color }} />)}
            </button>
          ))}
        </div>
        <div className="color-row">
          {(['background', 'foreground', 'accent'] as const).map((key) => (
            <label key={key} className="color-input"><input type="color" value={project.quick[key]} onChange={(event) => setQuick(key, event.target.value)} /><span>{project.quick[key]}</span></label>
          ))}
        </div>
      </section>
      <section className="control-section compact-ranges">
        {range('density', '密度')}
        {range('speed', '速度')}
        {project.renderer !== 'scroll-grid' && range('energy', '动感')}
        {project.renderer === 'scroll-grid' ? (
          <div className="direction-control">
            <span><b>滑动方向</b><output>{project.quick.direction === 90 ? '向下' : '向上'}</output></span>
            <div className="segmented-tabs" role="group" aria-label="网格滑动方向">
              <button type="button" data-state={project.quick.direction !== 90 ? 'active' : 'inactive'} aria-pressed={project.quick.direction !== 90} onClick={() => setQuick('direction', 270)}>向上滑动</button>
              <button type="button" data-state={project.quick.direction === 90 ? 'active' : 'inactive'} aria-pressed={project.quick.direction === 90} onClick={() => setQuick('direction', 90)}>向下滑动</button>
            </div>
          </div>
        ) : range('direction', '方向', 360, `${Math.round(project.quick.direction)}°`)}
      </section>
      <div className="two-button-row">
        <button className="secondary-button" type="button" onClick={() => update((draft) => { draft.quick.seed = Math.floor(Math.random() * 100000); })}><DiceFive size={17} />生成变体</button>
        <button className="secondary-button" type="button" onClick={() => {
          const template = getTemplate(project.templateId);
          update((draft) => { draft.quick = structuredClone(template.quick); });
        }}><ArrowsClockwise size={17} />重置快捷项</button>
      </div>
    </div>
  );
}

const aspectOptions: Array<{ id: AspectRatio; label: string; description: string }> = [
  { id: '9:16', label: '9:16', description: '竖屏' },
  { id: '16:9', label: '16:9', description: '横屏' },
  { id: '1:1', label: '1:1', description: '方形' },
  { id: '4:5', label: '4:5', description: '信息流' },
];

export function CanvasFormatPanel() {
  const project = useProjectStore((state) => state.project);
  const update = useProjectStore((state) => state.update);
  if (!project) return null;
  const mobile = window.matchMedia('(max-width: 767px), (pointer: coarse)').matches;
  return (
    <section className="canvas-format-panel">
      <div className="section-heading"><h3>画面尺寸</h3><span>导出默认沿用此规格</span></div>
      <div className="aspect-options" role="group" aria-label="画面比例">
        {aspectOptions.map((option) => (
          <button key={option.id} className={project.canvas.aspectRatio === option.id ? 'active' : ''} type="button" aria-pressed={project.canvas.aspectRatio === option.id} onClick={() => update((draft) => { draft.canvas.aspectRatio = option.id; })}>
            <b>{option.label}</b><small>{option.description}</small>
          </button>
        ))}
      </div>
      <div className="resolution-options" role="group" aria-label="画面分辨率">
        <span>分辨率</span>
        <button className={project.canvas.resolution === '1080' ? 'active' : ''} type="button" aria-pressed={project.canvas.resolution === '1080'} onClick={() => update((draft) => { draft.canvas.resolution = '1080'; })}>1080</button>
        <button className={project.canvas.resolution === '2k' ? 'active' : ''} type="button" aria-pressed={project.canvas.resolution === '2k'} disabled={mobile} onClick={() => update((draft) => { draft.canvas.resolution = '2k'; })}>2K{mobile ? ' 桌面' : ''}</button>
      </div>
    </section>
  );
}

export function AdvancedControlsPanel() {
  const [open, setOpen] = useState(false);
  const project = useProjectStore((state) => state.project);
  const update = useProjectStore((state) => state.update);
  const begin = useProjectStore((state) => state.beginTransaction);
  const commit = useProjectStore((state) => state.commitTransaction);
  if (!project) return null;
  const definitions: Array<{ key: keyof AdvancedControls; label: string; min: number; max: number }> = [
    { key: 'spacing', label: '间距倍率', min: 0.2, max: 2 },
    { key: 'thickness', label: '线条粗细', min: 0.2, max: 4 },
    { key: 'amplitude', label: '运动振幅', min: 0, max: 2 },
    { key: 'frequency', label: '波动频率', min: 0.2, max: 3 },
    { key: 'perspective', label: '透视强度', min: 0, max: 1 },
    { key: 'opacity', label: '图形透明度', min: 0.05, max: 1 },
    { key: 'scale', label: '图形尺度', min: 0.5, max: 2 },
  ];
  return (
    <section className="advanced-section">
      <button className="advanced-toggle" type="button" aria-expanded={open} onClick={() => {
        const next = !open;
        setOpen(next);
        if (next) track('advanced_opened', { renderer: project.renderer });
      }}><span><SlidersHorizontal size={18} />高级参数</span><CaretDown className={open ? 'rotated' : ''} size={16} /></button>
      {open && <div className="advanced-body">
        {definitions.map(({ key, label, min, max }) => (
          <RangeControl key={key} label={label} value={project.advanced[key]} min={min} max={max} step={0.01} display={project.advanced[key].toFixed(2)} onChange={(value) => update((draft) => { draft.advanced[key] = value; }, false)} onStart={begin} onEnd={commit} />
        ))}
      </div>}
    </section>
  );
}
