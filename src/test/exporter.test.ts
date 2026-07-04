import type { StreamTargetChunk } from 'mediabunny';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { templates } from '../data/templates';
import { exportVideo } from '../export/exporter';
import { createProject } from '../store/projectStore';

describe('video export', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete window.showSaveFilePicker;
  });

  it('bridges high-spec output to the file stream without transferring the file stream itself', async () => {
    const chunks: StreamTargetChunk[] = [];
    const fileStream = new WritableStream<StreamTargetChunk>({
      write: (chunk) => { chunks.push(chunk); },
    });
    const createWritable = vi.fn().mockResolvedValue(fileStream);
    window.showSaveFilePicker = vi.fn().mockResolvedValue({ createWritable });

    let transferred: Transferable[] = [];
    class MockWorker {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: ErrorEvent) => void) | null = null;

      postMessage(message: { type: string; writable?: WritableStream<StreamTargetChunk> }, transfer?: Transferable[]) {
        if (message.type !== 'start' || !message.writable) return;
        transferred = transfer ?? [];
        queueMicrotask(async () => {
          const writer = message.writable!.getWriter();
          await writer.write({ type: 'write', data: new Uint8Array([1, 2, 3]), position: 0 });
          await writer.close();
          this.onmessage?.(new MessageEvent('message', { data: { type: 'complete' } }));
        });
      }

      terminate() {}
    }
    vi.stubGlobal('Worker', MockWorker);

    const project = createProject(templates[0]);
    project.canvas.resolution = '2k';
    project.animation.fps = 60;

    await exportVideo(project, vi.fn());

    expect(createWritable).toHaveBeenCalledOnce();
    expect(transferred).toHaveLength(1);
    expect(transferred[0]).not.toBe(fileStream);
    expect(chunks).toEqual([{ type: 'write', data: new Uint8Array([1, 2, 3]), position: 0 }]);
  });
});
