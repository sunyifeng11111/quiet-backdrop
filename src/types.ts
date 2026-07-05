import { z } from 'zod';

export const rendererKinds = ['grid', 'scroll-grid', 'gradient', 'spotlight', 'grain', 'scanline', 'cross', 'dots', 'flow'] as const;
export const aspectRatios = ['9:16', '16:9', '1:1', '4:5'] as const;
export const guideModes = ['none', 'center-person', 'left-person', 'title-subtitle'] as const;

export type RendererKind = (typeof rendererKinds)[number];
export type AspectRatio = (typeof aspectRatios)[number];
export type GuideMode = (typeof guideModes)[number];
export type TemplateCategory = '低干扰' | '科技感' | '节奏感' | '极简';

export interface QuickControls {
  background: string;
  foreground: string;
  accent: string;
  density: number;
  speed: number;
  energy: number;
  direction: number;
  seed: number;
}

export interface AdvancedControls {
  spacing: number;
  thickness: number;
  amplitude: number;
  frequency: number;
  perspective: number;
  opacity: number;
  scale: number;
}

export interface CompositionGuide {
  mode: GuideMode;
  title: string;
  subtitle: string;
  textTone: 'light' | 'dark';
  showText: boolean;
}

export interface AnimationSettings {
  duration: number;
  fps: 30 | 60;
  playing: boolean;
  currentTime: number;
}

export interface CanvasSettings {
  aspectRatio: AspectRatio;
  resolution: '1080' | '2k';
  offsetX: number;
  offsetY: number;
}

export interface BackgroundProject {
  version: 1;
  id: string;
  name: string;
  templateId: string;
  renderer: RendererKind;
  quick: QuickControls;
  advanced: AdvancedControls;
  guide: CompositionGuide;
  animation: AnimationSettings;
  canvas: CanvasSettings;
  createdAt: number;
  updatedAt: number;
  revision: number;
}

export interface BackgroundTemplate {
  id: string;
  name: string;
  description: string;
  renderer: RendererKind;
  category: TemplateCategory;
  quick: QuickControls;
  advanced: AdvancedControls;
}

export interface SharePayload {
  version: 1;
  templateId: string;
  renderer: RendererKind;
  quick: QuickControls;
  advanced: AdvancedControls;
  guide: CompositionGuide;
  animation: Pick<AnimationSettings, 'duration' | 'fps'>;
  canvas: Pick<CanvasSettings, 'aspectRatio' | 'resolution' | 'offsetX' | 'offsetY'>;
}

export interface CapabilityReport {
  webCodecs: boolean;
  avc: boolean;
  offscreenCanvas: boolean;
  fileSystemAccess: boolean;
  worker: boolean;
  mobile: boolean;
  maxDynamicResolution: 'none' | '1080' | '2k';
  maxFps: 0 | 30 | 60;
  reason?: string;
}

export type AnalyticsEventName =
  | 'template_selected'
  | 'advanced_opened'
  | 'export_started'
  | 'export_succeeded'
  | 'export_failed'
  | 'share_copied';

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  timestamp: number;
  properties?: Record<string, string | number | boolean>;
}

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const projectSchema: z.ZodType<BackgroundProject> = z.object({
  version: z.literal(1),
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  templateId: z.string().min(1),
  renderer: z.enum(rendererKinds),
  quick: z.object({
    background: hexColor,
    foreground: hexColor,
    accent: hexColor,
    density: z.number().min(0).max(1),
    speed: z.number().min(0).max(1),
    energy: z.number().min(0).max(1),
    direction: z.number().min(0).max(360),
    seed: z.number().int().nonnegative(),
  }),
  advanced: z.object({
    spacing: z.number().min(0.2).max(2),
    thickness: z.number().min(0.2).max(4),
    amplitude: z.number().min(0).max(2),
    frequency: z.number().min(0.2).max(3),
    perspective: z.number().min(0).max(1),
    opacity: z.number().min(0.05).max(1),
    scale: z.number().min(0.5).max(2),
  }),
  guide: z.object({
    mode: z.enum(guideModes),
    title: z.string().max(100),
    subtitle: z.string().max(160),
    textTone: z.enum(['light', 'dark']),
    showText: z.boolean(),
  }),
  animation: z.object({
    duration: z.number().min(1).max(30),
    fps: z.union([z.literal(30), z.literal(60)]),
    playing: z.boolean(),
    currentTime: z.number().nonnegative(),
  }),
  canvas: z.object({
    aspectRatio: z.enum(aspectRatios),
    resolution: z.enum(['1080', '2k']),
    offsetX: z.number().min(-1).max(1),
    offsetY: z.number().min(-1).max(1),
  }),
  createdAt: z.number(),
  updatedAt: z.number(),
  revision: z.number().int().nonnegative(),
});
