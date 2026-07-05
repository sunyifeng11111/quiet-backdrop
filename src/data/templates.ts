import type { AdvancedControls, BackgroundTemplate, QuickControls } from '../types';

const advanced: AdvancedControls = {
  spacing: 1,
  thickness: 1,
  amplitude: 1,
  frequency: 1,
  perspective: 0.25,
  opacity: 0.7,
  scale: 1,
};

const quick = (values: Partial<QuickControls>): QuickControls => ({
  background: '#101214',
  foreground: '#e8ebe6',
  accent: '#7d94ff',
  density: 0.45,
  speed: 0.35,
  energy: 0.3,
  direction: 0,
  seed: 17,
  ...values,
});

const templateCatalog: BackgroundTemplate[] = [
  {
    id: 'mono-scroll-grid', name: '黑色小网格', description: '灰白细线纵向匀速滑动', renderer: 'scroll-grid', category: '低干扰',
    quick: quick({ background: '#000000', foreground: '#b8bdc2', accent: '#b8bdc2', density: 0.72, speed: 0.34, energy: 0, direction: 270, seed: 17 }),
    advanced: { ...advanced, spacing: 1, thickness: 0.8, amplitude: 0, frequency: 1, perspective: 0, opacity: 0.28 },
  },
  {
    id: 'ambient-gradient', name: '流动渐变', description: '低饱和色彩缓慢漂移', renderer: 'gradient', category: '低干扰',
    quick: quick({ background: '#0d1020', foreground: '#5f7dff', accent: '#bc5cff', density: 0.42, speed: 0.22, energy: 0.34, direction: 12, seed: 37 }),
    advanced: { ...advanced, spacing: 1.15, thickness: 0.8, amplitude: 0.9, frequency: 0.7, perspective: 0, opacity: 0.72, scale: 1.15 },
  },
  {
    id: 'soft-spotlight', name: '柔光呼吸', description: '蓝紫柔光缓慢交叠', renderer: 'spotlight', category: '低干扰',
    quick: quick({ background: '#070910', foreground: '#7ea2ff', accent: '#a65cff', density: 0.42, speed: 0.2, energy: 0.44, direction: 0, seed: 52 }),
    advanced: { ...advanced, spacing: 1.15, thickness: 0.7, amplitude: 0.9, frequency: 1, perspective: 0, opacity: 0.82, scale: 1.08 },
  },
  {
    id: 'film-grain', name: '复古胶片', description: '暖色颗粒、尘点与轻微漏光', renderer: 'grain', category: '极简',
    quick: quick({ background: '#1a120d', foreground: '#f1dfc2', accent: '#b65f32', density: 0.72, speed: 0.52, energy: 0.38, direction: 0, seed: 83 }),
    advanced: { ...advanced, spacing: 0.9, thickness: 1.05, amplitude: 0.75, frequency: 1, perspective: 0, opacity: 0.46, scale: 1.05 },
  },
  {
    id: 'signal-scanline', name: '数据扫描', description: '横向扫描线与移动光带', renderer: 'scanline', category: '科技感',
    quick: quick({ background: '#05090a', foreground: '#4d756f', accent: '#72f2c9', density: 0.6, speed: 0.36, energy: 0.32, direction: 0, seed: 119 }),
    advanced: { ...advanced, spacing: 0.72, thickness: 0.65, amplitude: 0.8, frequency: 1, perspective: 0, opacity: 0.44 },
  },
  {
    id: 'quiet-grid', name: '静音网格', description: '给字幕留足呼吸感', renderer: 'grid', category: '低干扰',
    quick: quick({ background: '#f1f0eb', foreground: '#8d918b', accent: '#4d6bff', density: 0.8, speed: 0.18, energy: 0.12 }),
    advanced: { ...advanced, spacing: 1.35, thickness: 0.65, perspective: 0.08, opacity: 0.42 },
  },
  {
    id: 'blueprint-grid', name: '蓝图呼吸', description: '理性、稳定、轻科技', renderer: 'grid', category: '科技感',
    quick: quick({ background: '#091426', foreground: '#5680b6', accent: '#78a7ff', density: 0.5, speed: 0.26, energy: 0.32, direction: 18, seed: 29 }),
    advanced: { ...advanced, spacing: 0.9, thickness: 0.75, perspective: 0.44, opacity: 0.58 },
  },
  {
    id: 'kinetic-grid', name: '斜向脉冲', description: '有节奏但不喧闹', renderer: 'grid', category: '节奏感',
    quick: quick({ background: '#171310', foreground: '#d28c5e', accent: '#ffb077', density: 0.62, speed: 0.52, energy: 0.58, direction: 35, seed: 44 }),
    advanced: { ...advanced, spacing: 0.76, thickness: 0.9, amplitude: 1.25, frequency: 1.3, opacity: 0.68 },
  },
  {
    id: 'quiet-cross', name: '留白十字', description: '克制的编辑感', renderer: 'cross', category: '极简',
    quick: quick({ background: '#e8e9e4', foreground: '#626761', accent: '#335dff', density: 0.8, speed: 0.4, energy: 0.1, direction: 0, seed: 9 }),
    advanced: { ...advanced, spacing: 1.4, thickness: 0.7, opacity: 0.52 },
  },
  {
    id: 'signal-cross', name: '信号十字', description: '适合工具与数码选题', renderer: 'cross', category: '科技感',
    quick: quick({ background: '#0c0e10', foreground: '#7e878c', accent: '#78f0c1', density: 0.5, speed: 0.35, energy: 0.42, direction: 90, seed: 71 }),
    advanced: { ...advanced, spacing: 0.85, thickness: 0.8, frequency: 1.4, opacity: 0.62 },
  },
  {
    id: 'pulse-cross', name: '节拍矩阵', description: '连续变化的视觉节拍', renderer: 'cross', category: '节奏感',
    quick: quick({ background: '#1b1020', foreground: '#d282bc', accent: '#ff99e0', density: 0.68, speed: 0.65, energy: 0.72, direction: 45, seed: 106 }),
    advanced: { ...advanced, spacing: 0.72, thickness: 1.15, amplitude: 1.3, frequency: 1.6, opacity: 0.7 },
  },
  {
    id: 'soft-dots', name: '柔和点阵', description: '明亮、干净、人物友好', renderer: 'dots', category: '低干扰',
    quick: quick({ background: '#f4f2ed', foreground: '#aaa89f', accent: '#ef6b51', density: 0.7, speed: 0.6, energy: 0.16, seed: 88 }),
    advanced: { ...advanced, spacing: 1.2, thickness: 0.6, amplitude: 0.6, opacity: 0.46 },
  },
  {
    id: 'data-dots', name: '数据涟漪', description: '信息流动的秩序感', renderer: 'dots', category: '科技感',
    quick: quick({ background: '#071a1b', foreground: '#3d9189', accent: '#65e3d3', density: 0.58, speed: 0.4, energy: 0.5, direction: 12, seed: 128 }),
    advanced: { ...advanced, spacing: 0.8, thickness: 0.85, amplitude: 1.2, frequency: 1.4, opacity: 0.7 },
  },
  {
    id: 'mono-dots', name: '灰阶浮点', description: '适合观点与商业内容', renderer: 'dots', category: '极简',
    quick: quick({ background: '#151515', foreground: '#9e9e9a', accent: '#f2f2ea', density: 0.4, speed: 0.4, energy: 0.22, seed: 54 }),
    advanced: { ...advanced, spacing: 1, thickness: 0.55, amplitude: 0.72, opacity: 0.5 },
  },
  {
    id: 'calm-flow', name: '缓流线', description: '柔和托住口播主体', renderer: 'flow', category: '低干扰',
    quick: quick({ background: '#eceff1', foreground: '#87939a', accent: '#406fff', density: 0.25, speed: 0.18, energy: 0.18, direction: 0, seed: 31 }),
    advanced: { ...advanced, spacing: 1.3, thickness: 0.7, amplitude: 0.72, frequency: 0.8, opacity: 0.48 },
  },
  {
    id: 'editorial-flow', name: '编辑曲线', description: '干净的杂志式层次', renderer: 'flow', category: '极简',
    quick: quick({ background: '#151512', foreground: '#77786f', accent: '#d7ff4f', density: 0.36, speed: 0.22, energy: 0.3, direction: 8, seed: 61 }),
    advanced: { ...advanced, spacing: 1.05, thickness: 0.7, amplitude: 1, frequency: 1.2, opacity: 0.58 },
  },
  {
    id: 'wave-flow', name: '层叠波形', description: '适合开场与转场', renderer: 'flow', category: '节奏感',
    quick: quick({ background: '#111425', foreground: '#6a70bc', accent: '#b5a8ff', density: 0.66, speed: 0.6, energy: 0.76, direction: 22, seed: 144 }),
    advanced: { ...advanced, spacing: 0.72, thickness: 1, amplitude: 1.4, frequency: 1.55, opacity: 0.72 },
  },
];

const templateOrder = [
  'mono-scroll-grid',
  'quiet-grid',
  'signal-cross',
  'quiet-cross',
  'soft-dots',
  'mono-dots',
  'pulse-cross',
  'ambient-gradient',
  'soft-spotlight',
  'film-grain',
  'signal-scanline',
  'blueprint-grid',
  'kinetic-grid',
  'data-dots',
  'calm-flow',
  'editorial-flow',
  'wave-flow',
] as const;

const templatesById = new Map(templateCatalog.map((template) => [template.id, template]));

export const templates = templateOrder.map((id) => {
  const template = templatesById.get(id);
  if (!template) throw new Error(`未找到模板：${id}`);
  return template;
});

export const getTemplate = (id: string) => templates.find((item) => item.id === id) ?? templates[0];
