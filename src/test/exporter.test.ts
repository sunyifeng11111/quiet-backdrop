import { afterEach, describe, expect, it, vi } from 'vitest';
import { templates } from '../data/templates';
import { exportVideo } from '../export/exporter';
import { createProject } from '../store/projectStore';

describe('video export', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses the regular in-memory worker path for 2K 60fps exports', async () => {
    let postedMessage: Record<string, unknown> | undefined;
    class MockWorker {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: ErrorEvent) => void) | null = null;

      postMessage(message: Record<string, unknown>) {
        if (message.type !== 'start') return;
        postedMessage = message;
        queueMicrotask(() => {
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

    expect(postedMessage).toMatchObject({ type: 'start', bitrate: 24_000_000 });
    expect(postedMessage).not.toHaveProperty('writable');
  });
});
