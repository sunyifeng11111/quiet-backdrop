import { drawFrame, getDimensions } from '../render/renderers';
import type { BackgroundProject } from '../types';
import { downloadBlob, safeFileName } from '../lib/persistence';

export type ExportStage = 'preparing' | 'rendering' | 'encoding' | 'finalizing' | 'saving';
export interface ExportProgress { stage: ExportStage; progress: number; frame?: number; totalFrames?: number }

const bitrateFor = (project: BackgroundProject) => {
  if (project.canvas.resolution === '2k') return project.animation.fps === 60 ? 24_000_000 : 16_000_000;
  return project.animation.fps === 60 ? 12_000_000 : 8_000_000;
};

export const estimateFileSize = (project: BackgroundProject) => Math.round(bitrateFor(project) * project.animation.duration / 8 / 1024 / 1024);

export const exportStill = async (project: BackgroundProject, format: 'png' | 'jpeg') => {
  const { width, height } = getDimensions(project.canvas.aspectRatio, project.canvas.resolution);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('无法创建静态导出画布');
  drawFrame(ctx, project, project.animation.currentTime, { width, height });
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('图片生成失败')), `image/${format}`, 0.94));
  downloadBlob(blob, `${safeFileName(project.name)}.${format === 'jpeg' ? 'jpg' : 'png'}`);
};

export const exportVideo = async (
  project: BackgroundProject,
  onProgress: (progress: ExportProgress) => void,
  signal?: AbortSignal,
) => {
  const snapshot = structuredClone(project);
  const fileName = `${safeFileName(project.name)}-${project.canvas.aspectRatio.replace(':', 'x')}.mp4`;

  return new Promise<void>((resolve, reject) => {
    const worker = new Worker(new URL('./export.worker.ts', import.meta.url), { type: 'module' });
    const cleanup = () => worker.terminate();
    const cancel = () => worker.postMessage({ type: 'cancel' });
    signal?.addEventListener('abort', cancel, { once: true });
    worker.onmessage = (event: MessageEvent) => {
      if (event.data.type === 'progress') onProgress(event.data as ExportProgress);
      if (event.data.type === 'complete') {
        if (event.data.buffer) downloadBlob(new Blob([event.data.buffer], { type: 'video/mp4' }), fileName);
        cleanup();
        resolve();
      }
      if (event.data.type === 'cancelled') {
        cleanup();
        reject(new Error('导出已取消'));
      }
      if (event.data.type === 'error') {
        cleanup();
        reject(new Error(event.data.message));
      }
    };
    worker.onerror = (event) => {
      cleanup();
      reject(new Error(event.message || '导出任务启动失败'));
    };
    worker.postMessage({ type: 'start', project: snapshot, bitrate: bitrateFor(snapshot) });
  });
};
