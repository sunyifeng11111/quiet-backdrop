import { beforeEach, describe, expect, it } from 'vitest';
import { templates } from '../data/templates';
import { loadProject, saveProject } from '../lib/persistence';
import { createProject, useProjectStore } from '../store/projectStore';

describe('project editing flow', () => {
  beforeEach(() => {
    localStorage.clear();
    useProjectStore.getState().setProject(createProject(templates[0]));
  });

  it('coalesces a slider gesture into one undo step', () => {
    const store = useProjectStore.getState();
    const initial = store.project!.quick.density;
    store.beginTransaction();
    store.update((draft) => { draft.quick.density = 0.5; }, false);
    store.update((draft) => { draft.quick.density = 0.8; }, false);
    useProjectStore.getState().commitTransaction();
    expect(useProjectStore.getState().past).toHaveLength(1);
    useProjectStore.getState().undo();
    expect(useProjectStore.getState().project!.quick.density).toBe(initial);
    useProjectStore.getState().redo();
    expect(useProjectStore.getState().project!.quick.density).toBe(0.8);
  });

  it('recovers the last valid snapshot when the current project is corrupt', () => {
    const original = createProject(templates[2]);
    saveProject(original);
    const changed = { ...original, name: '有效的新版本', revision: 1, updatedAt: Date.now() + 1 };
    saveProject(changed);
    localStorage.setItem(`quietbackdrop:project:${original.id}`, '{broken json');
    const recovered = loadProject(original.id);
    expect(recovered?.name).toBe(original.name);
  });

  it('keeps legacy Frameground projects readable after the rename', () => {
    const legacy = createProject(templates[1]);
    localStorage.setItem('frameground:projects', JSON.stringify([legacy.id]));
    localStorage.setItem(`frameground:project:${legacy.id}`, JSON.stringify(legacy));

    expect(loadProject(legacy.id)?.name).toBe(legacy.name);
  });
});
