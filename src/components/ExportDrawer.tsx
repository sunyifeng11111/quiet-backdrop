import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, DownloadSimple, FileJpg, FilePng, FilmStrip, WarningCircle, X } from '@phosphor-icons/react';
import { detectCapabilities } from '../lib/capabilities';
import { track } from '../lib/analytics';
import { estimateFileSize, exportStill, exportVideo, type ExportProgress } from '../export/exporter';
import { useProjectStore } from '../store/projectStore';
import type { CapabilityReport } from '../types';

const stageLabels: Record<ExportProgress['stage'], string> = {
  preparing: '准备画布', rendering: '渲染画面', encoding: '编码视频', finalizing: '封装文件', saving: '保存文件',
};

export function ExportDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const project = useProjectStore((state) => state.project);
  const update = useProjectStore((state) => state.update);
  const [capability, setCapability] = useState<CapabilityReport | null>(null);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [status, setStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  useEffect(() => {
    if (open) detectCapabilities().then(setCapability);
  }, [open]);

  const estimated = useMemo(() => project ? estimateFileSize(project) : 0, [project]);
  if (!project) return null;
  const mobile = capability?.mobile ?? false;
  const dynamicAllowed = Boolean(capability?.avc && capability?.offscreenCanvas && capability?.worker);
  const incompatibleHighSpec = mobile && (project.canvas.resolution === '2k' || project.animation.fps === 60);

  const runStill = async (format: 'png' | 'jpeg') => {
    setStatus('exporting');
    setMessage('正在生成图片');
    try {
      await exportStill(structuredClone(project), format);
      setStatus('success');
      setMessage(`${format === 'png' ? 'PNG' : 'JPEG'} 已开始下载`);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : '图片导出失败');
    }
  };

  const runVideo = async () => {
    const controller = new AbortController();
    setAbortController(controller);
    setStatus('exporting');
    setMessage('正在准备导出');
    track('export_started', { aspectRatio: project.canvas.aspectRatio, resolution: project.canvas.resolution, fps: project.animation.fps, duration: project.animation.duration, mobile, streaming: Boolean(capability?.fileSystemAccess) });
    try {
      await exportVideo(project, (next) => { setProgress(next); setMessage(stageLabels[next.stage]); }, controller.signal);
      setStatus('success');
      setMessage('MP4 已成功导出');
      track('export_succeeded', { aspectRatio: project.canvas.aspectRatio, resolution: project.canvas.resolution, fps: project.animation.fps, duration: project.animation.duration });
    } catch (error) {
      const reason = error instanceof Error ? error.message : '视频导出失败';
      setStatus('error');
      setMessage(reason);
      track('export_failed', { aspectRatio: project.canvas.aspectRatio, resolution: project.canvas.resolution, fps: project.animation.fps, reason });
    } finally {
      setAbortController(null);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (status !== 'exporting') onOpenChange(next); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="export-drawer" aria-describedby="export-description">
          <div className="drawer-header">
            <div><Dialog.Title>导出作品</Dialog.Title><Dialog.Description id="export-description">保存纯背景，不包含辅助线和预览文字</Dialog.Description></div>
            <Dialog.Close className="icon-button" aria-label="关闭导出"><X size={18} /></Dialog.Close>
          </div>

          <div className="export-preview-chip"><span style={{ background: project.quick.background }} /><b>{project.name}</b><small>{project.canvas.aspectRatio} · {project.canvas.resolution === '2k' ? '2K' : '1080'} · {project.animation.fps}fps</small></div>

          <section className="export-section">
            <h3>画面规格</h3>
            <div className="export-grid">
              <label><span>画幅</span><select value={project.canvas.aspectRatio} onChange={(event) => update((draft) => { draft.canvas.aspectRatio = event.target.value as typeof draft.canvas.aspectRatio; })}><option value="9:16">9:16 竖屏</option><option value="16:9">16:9 横屏</option><option value="1:1">1:1 方形</option><option value="4:5">4:5 信息流</option></select></label>
              <label><span>分辨率</span><select value={project.canvas.resolution} onChange={(event) => update((draft) => { draft.canvas.resolution = event.target.value as '1080' | '2k'; })}><option value="1080">1080</option><option value="2k" disabled={mobile}>2K{mobile ? ' 桌面可用' : ''}</option></select></label>
              <label><span>帧率</span><select value={project.animation.fps} onChange={(event) => update((draft) => { draft.animation.fps = Number(event.target.value) as 30 | 60; })}><option value="30">30 fps</option><option value="60" disabled={mobile}>60 fps{mobile ? ' 桌面可用' : ''}</option></select></label>
              <label><span>时长</span><select value={project.animation.duration} onChange={(event) => update((draft) => { const duration = Number(event.target.value); draft.animation.duration = duration; draft.animation.currentTime %= duration; })}>{[3, 5, 10, 15, 20, 30].map((value) => <option key={value} value={value}>{value} 秒</option>)}</select></label>
            </div>
          </section>

          <section className="export-section">
            <h3>静态背景</h3>
            <div className="static-export-row">
              <button className="secondary-button" type="button" disabled={status === 'exporting'} onClick={() => runStill('png')}><FilePng size={18} />导出 PNG</button>
              <button className="secondary-button" type="button" disabled={status === 'exporting'} onClick={() => runStill('jpeg')}><FileJpg size={18} />导出 JPEG</button>
            </div>
          </section>

          <section className="export-section video-export-section">
            <div className="video-title"><div><FilmStrip size={19} /><span><b>MP4 动态背景</b><small>预计约 {estimated} MB</small></span></div>{capability && <span className={`capability-badge ${dynamicAllowed ? 'ready' : 'blocked'}`}>{dynamicAllowed ? '设备可导出' : '设备不支持'}</span>}</div>
            {capability?.reason && <div className="inline-alert"><WarningCircle size={18} />{capability.reason}。建议使用最新版 Chrome 或 Edge。</div>}
            {incompatibleHighSpec && <div className="inline-alert"><WarningCircle size={18} />移动端最高支持 1080p 30fps，请降低规格后导出。</div>}
            {status !== 'idle' && <div className={`export-status ${status}`} role="status" aria-live="polite">
              {status === 'success' ? <CheckCircle size={19} weight="fill" /> : status === 'error' ? <WarningCircle size={19} weight="fill" /> : <span className="status-pulse" />}
              <div><b>{message}</b>{progress && status === 'exporting' && <span>{Math.round(progress.progress * 100)}%{progress.totalFrames ? ` · ${progress.frame}/${progress.totalFrames} 帧` : ''}</span>}</div>
            </div>}
            {status === 'exporting' && progress && <div className="progress-track"><i style={{ width: `${Math.round(progress.progress * 100)}%` }} /></div>}
            <div className="export-actions">
              {status === 'exporting' ? <button className="danger-button" type="button" onClick={() => abortController?.abort()}>取消导出</button> : <button className="primary-button wide" type="button" disabled={!dynamicAllowed || incompatibleHighSpec} onClick={runVideo}><DownloadSimple size={18} />导出 MP4</button>}
              {status === 'error' && <button className="secondary-button" type="button" onClick={() => update((draft) => { draft.canvas.resolution = '1080'; draft.animation.fps = 30; })}>降低到 1080p30</button>}
            </div>
          </section>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
