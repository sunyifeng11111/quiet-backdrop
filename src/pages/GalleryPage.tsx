import { useMemo, useState } from 'react';
import { ArrowRight, FolderOpen, Sparkle } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { templates } from '../data/templates';
import { track } from '../lib/analytics';
import { listProjects, saveProject } from '../lib/persistence';
import { createProject, useProjectStore } from '../store/projectStore';
import type { RendererKind, TemplateCategory } from '../types';
import { TemplatePreview } from '../components/TemplatePreview';
import { ProjectDialog } from '../components/ProjectDialog';
import { BrandMark } from '../components/BrandMark';

type Filter = '全部' | TemplateCategory | RendererKind;
const filters: Array<{ id: Filter; label: string }> = [
  { id: '全部', label: '推荐' }, { id: '低干扰', label: '低干扰' }, { id: '科技感', label: '科技感' }, { id: '节奏感', label: '节奏感' }, { id: '极简', label: '极简' },
  { id: 'grid', label: '网格' }, { id: 'cross', label: '十字' }, { id: 'dots', label: '点阵' }, { id: 'flow', label: '线条' },
];

export function GalleryPage() {
  const navigate = useNavigate();
  const setProject = useProjectStore((state) => state.setProject);
  const [filter, setFilter] = useState<Filter>('全部');
  const [projectsOpen, setProjectsOpen] = useState(false);
  const projects = listProjects();
  const visible = useMemo(() => templates.filter((template) => filter === '全部' || template.category === filter || template.renderer === filter), [filter]);
  const choose = (template: (typeof templates)[number]) => {
    const project = createProject(template);
    saveProject(project);
    setProject(project);
    track('template_selected', { renderer: template.renderer, category: template.category });
    navigate(`/editor/${project.id}`);
  };
  return (
    <main className="gallery-page">
      <header className="gallery-header">
        <a className="brand" href="/" aria-label="QuietBackdrop 首页"><BrandMark /><span>QuietBackdrop</span></a>
        <button className="secondary-button" type="button" onClick={() => setProjectsOpen(true)}><FolderOpen size={18} />本地项目{projects.length > 0 && <span className="count-badge">{projects.length}</span>}</button>
      </header>

      <section className="gallery-intro">
        <div>
          <p className="gallery-kicker"><Sparkle size={15} weight="fill" />为口播与知识内容设计</p>
          <h1>选一个背景，<br />三分钟就能用。</h1>
          <p>不抢人物，不压字幕。每个模板都能实时调整，并直接导出为视频或图片。</p>
        </div>
        <div className="intro-note"><b>12</b><span>个可直接使用的<br />动态起点</span></div>
      </section>

      <nav className="filter-row" aria-label="模板筛选">
        {filters.map((item) => <button key={item.id} className={filter === item.id ? 'active' : ''} type="button" onClick={() => setFilter(item.id)}>{item.label}</button>)}
      </nav>

      <section className="template-gallery" aria-live="polite">
        {visible.map((template) => (
          <button className="template-card" data-template-id={template.id} type="button" key={template.id} onClick={() => choose(template)}>
            <div className="template-visual"><TemplatePreview template={template} /><span>{template.category}</span></div>
            <div className="template-info"><span><b>{template.name}</b><small>{template.description}</small></span><i><ArrowRight size={18} /></i></div>
          </button>
        ))}
      </section>

      <footer className="gallery-footer"><BrandMark /><span>参数化生成 · 作品不上传 · 不使用 AI</span></footer>
      <ProjectDialog open={projectsOpen} onOpenChange={setProjectsOpen} />
    </main>
  );
}
