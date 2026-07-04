import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowCounterClockwise, ArrowClockwise, Check, Copy, DownloadSimple, Export, FolderOpen, House, ShareNetwork, WarningCircle, X } from '@phosphor-icons/react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdvancedControlsPanel, CanvasFormatPanel, QuickControlsPanel } from '../components/Controls';
import { BackgroundCanvas } from '../components/BackgroundCanvas';
import { ExportDrawer } from '../components/ExportDrawer';
import { GuidePanel } from '../components/GuidePanel';
import { ProjectDialog } from '../components/ProjectDialog';
import { TemplateSidebar } from '../components/TemplateSidebar';
import { TemplatePreview } from '../components/TemplatePreview';
import { templates } from '../data/templates';
import { track } from '../lib/analytics';
import { getShareUrl } from '../lib/share';
import { isProjectStorageKey, loadProject, saveProject } from '../lib/persistence';
import { createProject, useProjectStore } from '../store/projectStore';
import type { BackgroundProject } from '../types';
import { BrandMark } from '../components/BrandMark';

type MobilePanel = 'templates' | 'adjust' | 'export';

export function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const project = useProjectStore((state) => state.project);
  const setProject = useProjectStore((state) => state.setProject);
  const update = useProjectStore((state) => state.update);
  const undo = useProjectStore((state) => state.undo);
  const redo = useProjectStore((state) => state.redo);
  const past = useProjectStore((state) => state.past);
  const future = useProjectStore((state) => state.future);
  const beginTransaction = useProjectStore((state) => state.beginTransaction);
  const commitTransaction = useProjectStore((state) => state.commitTransaction);
  const saveState = useProjectStore((state) => state.saveState);
  const setSaveState = useProjectStore((state) => state.setSaveState);
  const conflict = useProjectStore((state) => state.conflict);
  const setConflict = useProjectStore((state) => state.setConflict);
  const [time, setTime] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('adjust');
  const [tipVisible, setTipVisible] = useState(() => localStorage.getItem('quietbackdrop:tip-dismissed') !== '1' && localStorage.getItem('frameground:tip-dismissed') !== '1');
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'error'>('idle');
  const localRevisionRef = useRef(0);

  useEffect(() => {
    if (!id) return;
    if (project?.id === id) return;
    const loaded = loadProject(id);
    if (loaded) {
      setProject(loaded);
      localRevisionRef.current = loaded.revision;
      const timeout = window.setTimeout(() => setTime(loaded.animation.currentTime), 0);
      return () => window.clearTimeout(timeout);
    } else {
      navigate('/', { replace: true });
    }
  }, [id, navigate, project?.id, setProject]);

  useEffect(() => {
    if (!project) return;
    const timeout = window.setTimeout(() => {
      try {
        saveProject(project);
        localRevisionRef.current = project.revision;
        setSaveState('saved');
      } catch {
        setSaveState('error');
      }
    }, 450);
    return () => window.clearTimeout(timeout);
  }, [project, setSaveState]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (!project || !isProjectStorageKey(event.key, project.id) || !event.newValue) return;
      try {
        const remote = JSON.parse(event.newValue) as BackgroundProject;
        if (remote.revision > localRevisionRef.current && saveState === 'saving') setConflict(true);
        else if (remote.revision > localRevisionRef.current) {
          setProject(remote);
          localRevisionRef.current = remote.revision;
        }
      } catch {
        setConflict(true);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [project, saveState, setConflict, setProject]);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'z') return;
      event.preventDefault();
      if (event.shiftKey) redo(); else undo();
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [redo, undo]);

  const handleTime = useCallback((next: number) => setTime(next), []);
  if (!project) return <main className="route-message"><div className="route-loader" /><h1>正在打开编辑器</h1></main>;

  const share = async () => {
    const url = getShareUrl({ ...project, animation: { ...project.animation, currentTime: time } });
    try {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand('copy');
        textarea.remove();
        if (!copied) throw new Error('浏览器拒绝访问剪贴板');
      }
      setShareState('copied');
      track('share_copied', { renderer: project.renderer, aspectRatio: project.canvas.aspectRatio });
    } catch {
      setShareState('error');
    }
    window.setTimeout(() => setShareState('idle'), 1600);
  };
  const newProject = () => {
    const next = createProject(templates[0]);
    saveProject(next);
    setProject(next);
    navigate(`/editor/${next.id}`);
  };
  const openExport = () => {
    update((draft) => { draft.animation.currentTime = time; }, false);
    setExportOpen(true);
  };

  return (
    <main className="editor-page">
      <header className="editor-topbar">
        <div className="editor-brand"><a href="/" aria-label="返回模板库"><BrandMark /></a><span className="topbar-divider" /><button className="project-switcher" type="button" onClick={() => setProjectsOpen(true)}><FolderOpen size={17} /><span>本地项目</span></button></div>
        <input className="project-name" value={project.name} maxLength={80} aria-label="项目名称" onChange={(event) => update((draft) => { draft.name = event.target.value; }, false)} onBlur={() => useProjectStore.getState().commitTransaction()} onFocus={beginTransaction} />
        <div className="topbar-actions">
          <span className={`save-state ${saveState}`}><i />{saveState === 'saved' ? '已自动保存' : saveState === 'saving' ? '保存中' : '保存失败'}</span>
          <button className="icon-button desktop-only" type="button" disabled={past.length === 0} onClick={undo} aria-label="撤销"><ArrowCounterClockwise size={18} /></button>
          <button className="icon-button desktop-only" type="button" disabled={future.length === 0} onClick={redo} aria-label="重做"><ArrowClockwise size={18} /></button>
          <button className="secondary-button share-button" type="button" onClick={share}>{shareState === 'copied' ? <Check size={17} /> : <ShareNetwork size={17} />}{shareState === 'copied' ? '已复制' : shareState === 'error' ? '复制失败' : '分享'}</button>
          <button className="primary-button" type="button" onClick={openExport}><Export size={18} />导出</button>
        </div>
      </header>

      {conflict && <div className="conflict-banner" role="alert"><WarningCircle size={18} /><span>这个项目在另一个标签页中被修改。请保留当前版本或刷新读取新版本。</span><button type="button" onClick={() => setConflict(false)}>保留当前版本</button><button type="button" onClick={() => window.location.reload()}>读取新版本</button></div>}

      <div className="editor-workspace">
        <TemplateSidebar onNewProject={newProject} />
        <section className="stage-area">
          {tipVisible && <div className="context-tip"><span>拖动画布可移动图案中心。构图辅助不会出现在导出文件中。</span><button type="button" aria-label="关闭提示" onClick={() => { localStorage.setItem('quietbackdrop:tip-dismissed', '1'); setTipVisible(false); }}><X size={15} /></button></div>}
          <BackgroundCanvas
            project={project}
            time={time}
            playing={project.animation.playing}
            onTimeChange={handleTime}
            onPlayingChange={(playing) => update((draft) => { draft.animation.playing = playing; }, false)}
            onOffsetChange={(x, y) => update((draft) => { draft.canvas.offsetX = x; draft.canvas.offsetY = y; }, false)}
            onDragStart={beginTransaction}
            onDragEnd={commitTransaction}
            onResetOffset={() => update((draft) => { draft.canvas.offsetX = 0; draft.canvas.offsetY = 0; })}
          />
          <div className="stage-meta"><span>{project.renderer === 'grid' ? '动态网格' : project.renderer === 'cross' ? '动态十字' : project.renderer === 'dots' ? '粒子点阵' : '流动线条'}</span><span>{project.canvas.aspectRatio}</span><span>{project.canvas.resolution === '2k' ? '2K' : '1080'}</span></div>
        </section>
        <aside className="inspector-panel">
          <div className="inspector-scroll">
            <div className="inspector-header"><div><h2>快捷调整</h2><p>先改这几项，就能得到可用背景。</p></div></div>
            <CanvasFormatPanel />
            <QuickControlsPanel />
            <AdvancedControlsPanel />
            <GuidePanel />
          </div>
        </aside>
      </div>

      <div className="mobile-panel-area">
        {mobilePanel === 'templates' && <div className="mobile-template-grid">{templates.map((template) => <button key={template.id} className={template.id === project.templateId ? 'active' : ''} type="button" onClick={() => useProjectStore.getState().applyTemplate(template)}><TemplatePreview template={template} portrait={false} /><span>{template.name}</span></button>)}</div>}
        {mobilePanel === 'adjust' && <div className="mobile-adjust-panel"><CanvasFormatPanel /><QuickControlsPanel /><GuidePanel /></div>}
        {mobilePanel === 'export' && <div className="mobile-export-callout"><DownloadSimple size={26} /><h2>背景准备好了吗？</h2><p>移动端支持 PNG、JPEG 和最高 1080p30 的 MP4。</p><button className="primary-button wide" type="button" onClick={openExport}>打开导出设置</button></div>}
      </div>
      <nav className="mobile-bottom-nav" aria-label="编辑器功能"><button className={mobilePanel === 'templates' ? 'active' : ''} type="button" onClick={() => setMobilePanel('templates')}><House size={20} /><span>模板</span></button><button className={mobilePanel === 'adjust' ? 'active' : ''} type="button" onClick={() => setMobilePanel('adjust')}><Copy size={20} /><span>调整</span></button><button className={mobilePanel === 'export' ? 'active' : ''} type="button" onClick={() => setMobilePanel('export')}><DownloadSimple size={20} /><span>导出</span></button></nav>

      <ExportDrawer open={exportOpen} onOpenChange={setExportOpen} />
      <ProjectDialog open={projectsOpen} onOpenChange={setProjectsOpen} />
    </main>
  );
}
