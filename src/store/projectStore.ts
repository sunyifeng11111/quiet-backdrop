import { create } from 'zustand';
import { getTemplate } from '../data/templates';
import type { BackgroundProject, BackgroundTemplate } from '../types';

const MAX_HISTORY = 100;

export const createProject = (template: BackgroundTemplate = getTemplate('quiet-grid')): BackgroundProject => {
  const now = Date.now();
  return {
    version: 1,
    id: crypto.randomUUID(),
    name: template.name,
    templateId: template.id,
    renderer: template.renderer,
    quick: structuredClone(template.quick),
    advanced: structuredClone(template.advanced),
    guide: { mode: 'none', title: '把复杂的事讲明白', subtitle: '这里是一行口播字幕的可读性预览', textTone: template.quick.background > '#777777' ? 'dark' : 'light', showText: false },
    animation: { duration: 10, fps: 30, playing: true, currentTime: 0 },
    canvas: { aspectRatio: '9:16', resolution: '1080', offsetX: 0, offsetY: 0 },
    createdAt: now,
    updatedAt: now,
    revision: 0,
  };
};

interface ProjectStore {
  project: BackgroundProject | null;
  past: BackgroundProject[];
  future: BackgroundProject[];
  transactionStart: BackgroundProject | null;
  saveState: 'saved' | 'saving' | 'error';
  conflict: boolean;
  setProject: (project: BackgroundProject) => void;
  update: (recipe: (draft: BackgroundProject) => void, record?: boolean) => void;
  beginTransaction: () => void;
  commitTransaction: () => void;
  undo: () => void;
  redo: () => void;
  applyTemplate: (template: BackgroundTemplate) => void;
  setSaveState: (saveState: ProjectStore['saveState']) => void;
  setConflict: (conflict: boolean) => void;
}

const changedProject = (project: BackgroundProject, recipe: (draft: BackgroundProject) => void) => {
  const next = structuredClone(project);
  recipe(next);
  next.updatedAt = Date.now();
  next.revision += 1;
  return next;
};

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: null,
  past: [],
  future: [],
  transactionStart: null,
  saveState: 'saved',
  conflict: false,
  setProject: (project) => set({ project, past: [], future: [], transactionStart: null, saveState: 'saved', conflict: false }),
  update: (recipe, record = true) => {
    const current = get().project;
    if (!current) return;
    const next = changedProject(current, recipe);
    set((state) => ({
      project: next,
      past: record && !state.transactionStart ? [...state.past.slice(-(MAX_HISTORY - 1)), current] : state.past,
      future: record && !state.transactionStart ? [] : state.future,
      saveState: 'saving',
    }));
  },
  beginTransaction: () => {
    const current = get().project;
    if (current && !get().transactionStart) set({ transactionStart: structuredClone(current) });
  },
  commitTransaction: () => {
    const start = get().transactionStart;
    const current = get().project;
    if (!start || !current) return set({ transactionStart: null });
    const changed = JSON.stringify(start) !== JSON.stringify(current);
    set((state) => ({
      transactionStart: null,
      past: changed ? [...state.past.slice(-(MAX_HISTORY - 1)), start] : state.past,
      future: changed ? [] : state.future,
    }));
  },
  undo: () => {
    const { project, past, future } = get();
    if (!project || past.length === 0) return;
    set({ project: structuredClone(past[past.length - 1]), past: past.slice(0, -1), future: [project, ...future].slice(0, MAX_HISTORY), saveState: 'saving' });
  },
  redo: () => {
    const { project, past, future } = get();
    if (!project || future.length === 0) return;
    set({ project: structuredClone(future[0]), past: [...past, project].slice(-MAX_HISTORY), future: future.slice(1), saveState: 'saving' });
  },
  applyTemplate: (template) => get().update((draft) => {
    draft.templateId = template.id;
    draft.name = template.name;
    draft.renderer = template.renderer;
    draft.quick = structuredClone(template.quick);
    draft.advanced = structuredClone(template.advanced);
  }),
  setSaveState: (saveState) => set({ saveState }),
  setConflict: (conflict) => set({ conflict }),
}));
