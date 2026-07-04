import { canEncodeVideo } from 'mediabunny';
import type { CapabilityReport } from '../types';

export const detectCapabilities = async (): Promise<CapabilityReport> => {
  const mobile = window.matchMedia('(max-width: 767px), (pointer: coarse)').matches;
  const webCodecs = 'VideoEncoder' in window;
  const offscreenCanvas = 'OffscreenCanvas' in window;
  const worker = 'Worker' in window;
  const fileSystemAccess = 'showSaveFilePicker' in window;
  let avc = false;
  if (webCodecs) {
    try {
      avc = await canEncodeVideo('avc', { width: mobile ? 1080 : 1920, height: mobile ? 1920 : 1080, bitrate: 8_000_000 });
    } catch {
      avc = false;
    }
  }
  const ready = avc && offscreenCanvas && worker;
  return {
    webCodecs,
    avc,
    offscreenCanvas,
    fileSystemAccess,
    worker,
    mobile,
    maxDynamicResolution: ready ? (mobile ? '1080' : '2k') : 'none',
    maxFps: ready ? (mobile ? 30 : 60) : 0,
    reason: ready ? undefined : !webCodecs ? '当前浏览器没有提供视频编码接口' : !avc ? '当前浏览器无法编码 H.264 视频' : !offscreenCanvas ? '当前浏览器不支持后台画布' : '当前浏览器无法启动导出任务',
  };
};
