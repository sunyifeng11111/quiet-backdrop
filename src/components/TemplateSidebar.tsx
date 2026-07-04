import { GridFour, Plus } from '@phosphor-icons/react';
import { templates } from '../data/templates';
import { track } from '../lib/analytics';
import { useProjectStore } from '../store/projectStore';
import { TemplatePreview } from './TemplatePreview';

export function TemplateSidebar({ onNewProject }: { onNewProject: () => void }) {
  const project = useProjectStore((state) => state.project);
  const applyTemplate = useProjectStore((state) => state.applyTemplate);
  return (
    <aside className="template-sidebar">
      <div className="sidebar-title"><span><GridFour size={17} />模板</span><button type="button" onClick={onNewProject} aria-label="新建项目"><Plus size={17} /></button></div>
      <div className="sidebar-template-list">
        {templates.map((template) => (
          <button key={template.id} data-template-id={template.id} type="button" className={`sidebar-template ${project?.templateId === template.id ? 'active' : ''}`} onClick={() => {
            applyTemplate(template);
            track('template_selected', { renderer: template.renderer, category: template.category });
          }}>
            <div><TemplatePreview template={template} portrait={false} /></div>
            <span>{template.name}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
