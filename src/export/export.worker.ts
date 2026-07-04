/// <reference lib="webworker" />
import { BufferTarget, CanvasSource, Mp4OutputFormat, Output, StreamTarget, type StreamTargetChunk } from 'mediabunny';
import { drawFrame, getDimensions } from '../render/renderers';
import type { BackgroundProject } from '../types';

type ExportStage = 'preparing' | 'rendering' | 'encoding' | 'finalizing' | 'saving';

interface ExportRequest {
  type: 'start';
  project: BackgroundProject;
  bitrate: number;
  writable?: WritableStream<StreamTargetChunk>;
}

let cancelled = false;

const postProgress = (stage: ExportStage, progress: number, frame?: number, totalFrames?: number) => {
  self.postMessage({ type: 'progress', stage, progress, frame, totalFrames });
};

self.onmessage = async (event: MessageEvent<ExportRequest | { type: 'cancel' }>) => {
  if (event.data.type === 'cancel') {
    cancelled = true;
    return;
  }
  cancelled = false;
  const { project, bitrate, writable } = event.data;
  let output: Output | null = null;
  try {
    postProgress('preparing', 0);
    const { width, height } = getDimensions(project.canvas.aspectRatio, project.canvas.resolution);
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('无法创建后台画布');
    const target = writable ? new StreamTarget(writable, { chunked: true, chunkSize: 4 * 1024 * 1024 }) : new BufferTarget();
    output = new Output({ format: new Mp4OutputFormat({ fastStart: writable ? 'reserve' : 'in-memory' }), target });
    const source = new CanvasSource(canvas, {
      codec: 'avc', bitrate, keyFrameInterval: 2, alpha: 'discard', latencyMode: 'quality', hardwareAcceleration: 'no-preference', contentHint: 'animation',
    });
    output.addVideoTrack(source, { frameRate: project.animation.fps });
    await output.start();
    const totalFrames = Math.round(project.animation.duration * project.animation.fps);
    for (let frame = 0; frame < totalFrames; frame += 1) {
      if (cancelled) {
        await output.cancel();
        self.postMessage({ type: 'cancelled' });
        return;
      }
      drawFrame(ctx, project, frame / project.animation.fps, { width, height });
      await source.add(frame / project.animation.fps, 1 / project.animation.fps, { keyFrame: frame % (project.animation.fps * 2) === 0 });
      if (frame % Math.max(1, Math.round(totalFrames / 100)) === 0) {
        postProgress(frame < totalFrames * 0.7 ? 'rendering' : 'encoding', (frame + 1) / totalFrames * 0.9, frame + 1, totalFrames);
      }
    }
    postProgress('finalizing', 0.94, totalFrames, totalFrames);
    await output.finalize();
    postProgress('saving', 0.99, totalFrames, totalFrames);
    if (target instanceof BufferTarget && target.buffer) {
      self.postMessage({ type: 'complete', buffer: target.buffer }, [target.buffer]);
    } else {
      self.postMessage({ type: 'complete' });
    }
  } catch (error) {
    if (output && output.state === 'started') await output.cancel().catch(() => undefined);
    self.postMessage({ type: 'error', message: error instanceof Error ? error.message : '视频导出失败' });
  }
};
