import * as Tabs from '@radix-ui/react-tabs';
import { Check, TextT, UserFocus } from '@phosphor-icons/react';
import { useProjectStore } from '../store/projectStore';
import type { GuideMode } from '../types';

const modes: Array<{ id: GuideMode; label: string }> = [
  { id: 'none', label: '关闭' },
  { id: 'center-person', label: '居中人物' },
  { id: 'left-person', label: '左人右字' },
  { id: 'title-subtitle', label: '标题字幕' },
];

export function GuidePanel() {
  const project = useProjectStore((state) => state.project);
  const update = useProjectStore((state) => state.update);
  if (!project) return null;
  return (
    <div className="guide-panel">
      <div className="section-heading"><h3><UserFocus size={18} />内容适配</h3><span>辅助线不会导出</span></div>
      <Tabs.Root value={project.guide.mode} onValueChange={(value) => update((draft) => { draft.guide.mode = value as GuideMode; })}>
        <Tabs.List className="segmented-tabs" aria-label="构图辅助模式">
          {modes.map((mode) => <Tabs.Trigger key={mode.id} value={mode.id}>{mode.label}</Tabs.Trigger>)}
        </Tabs.List>
      </Tabs.Root>
      <label className="toggle-row">
        <span><TextT size={17} />文字可读性预览</span>
        <button className={`switch ${project.guide.showText ? 'on' : ''}`} type="button" role="switch" aria-checked={project.guide.showText} onClick={() => update((draft) => { draft.guide.showText = !draft.guide.showText; })}><i><Check size={11} weight="bold" /></i></button>
      </label>
      {project.guide.showText && <div className="guide-fields">
        <label><span>标题</span><input value={project.guide.title} maxLength={100} onChange={(event) => update((draft) => { draft.guide.title = event.target.value; }, false)} /></label>
        <label><span>字幕</span><input value={project.guide.subtitle} maxLength={160} onChange={(event) => update((draft) => { draft.guide.subtitle = event.target.value; }, false)} /></label>
        <div className="tone-switch"><span>文字颜色</span><button type="button" className={project.guide.textTone === 'light' ? 'active' : ''} onClick={() => update((draft) => { draft.guide.textTone = 'light'; })}>浅色</button><button type="button" className={project.guide.textTone === 'dark' ? 'active' : ''} onClick={() => update((draft) => { draft.guide.textTone = 'dark'; })}>深色</button></div>
      </div>}
    </div>
  );
}
