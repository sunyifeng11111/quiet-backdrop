import * as Dialog from '@radix-ui/react-dialog';
import { Copy, DownloadSimple, FileArrowUp, Plus, Trash, X } from '@phosphor-icons/react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteProject, exportProjectJson, importProjectJson, listProjects, saveProject } from '../lib/persistence';
import { createProject, useProjectStore } from '../store/projectStore';
import { getTemplate } from '../data/templates';

export function ProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate();
  const current = useProjectStore((state) => state.project);
  const setProject = useProjectStore((state) => state.setProject);
  const [projects, setProjects] = useState(() => listProjects());
  const inputRef = useRef<HTMLInputElement>(null);
  const refresh = () => setProjects(listProjects());
  const openProject = (id: string) => { onOpenChange(false); navigate(`/editor/${id}`); };
  const createNew = () => {
    const project = createProject(getTemplate('quiet-grid'));
    saveProject(project);
    setProject(project);
    onOpenChange(false);
    navigate(`/editor/${project.id}`);
  };
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="project-dialog">
          <div className="drawer-header"><div><Dialog.Title>本地项目</Dialog.Title><Dialog.Description>作品只保存在这台设备的浏览器中</Dialog.Description></div><Dialog.Close className="icon-button" aria-label="关闭"><X size={18} /></Dialog.Close></div>
          <div className="project-top-actions">
            <button className="primary-button" type="button" onClick={createNew}><Plus size={17} />新建项目</button>
            <button className="secondary-button" type="button" onClick={() => inputRef.current?.click()}><FileArrowUp size={17} />导入 JSON</button>
            <input ref={inputRef} type="file" accept="application/json,.json" hidden onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const imported = await importProjectJson(file);
              saveProject(imported);
              refresh();
              openProject(imported.id);
            }} />
          </div>
          <div className="project-list">
            {projects.length === 0 && <div className="empty-projects">还没有本地项目。选择一个模板即可开始。</div>}
            {projects.map((project) => (
              <div className={`project-row ${project.id === current?.id ? 'current' : ''}`} key={project.id}>
                <button type="button" className="project-main" onClick={() => openProject(project.id)}><i style={{ background: project.quick.background }} /><span><b>{project.name}</b><small>{project.canvas.aspectRatio} · {new Date(project.updatedAt).toLocaleDateString('zh-CN')}</small></span></button>
                <div className="project-row-actions">
                  <button type="button" aria-label="复制项目" onClick={() => {
                    const copy = { ...structuredClone(project), id: crypto.randomUUID(), name: `${project.name} 副本`, createdAt: Date.now(), updatedAt: Date.now(), revision: 0 };
                    saveProject(copy); refresh();
                  }}><Copy size={16} /></button>
                  <button type="button" aria-label="导出项目 JSON" onClick={() => exportProjectJson(project)}><DownloadSimple size={16} /></button>
                  <button type="button" aria-label="删除项目" onClick={() => { deleteProject(project.id); refresh(); }}><Trash size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
