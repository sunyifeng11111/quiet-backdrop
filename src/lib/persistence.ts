import { projectSchema, type BackgroundProject } from '../types';

const PREFIX = 'quietbackdrop';
const LEGACY_PREFIX = 'frameground';
const INDEX_KEY = `${PREFIX}:projects`;
const LEGACY_INDEX_KEY = `${LEGACY_PREFIX}:projects`;
const ACTIVE_KEY = `${PREFIX}:active`;
const LEGACY_ACTIVE_KEY = `${LEGACY_PREFIX}:active`;
const SNAPSHOT_SUFFIX = ':snapshot';

const projectKey = (id: string, prefix = PREFIX) => `${prefix}:project:${id}`;

export const isProjectStorageKey = (key: string | null, id: string) => key === projectKey(id) || key === projectKey(id, LEGACY_PREFIX);

const readIndex = (key: string): string[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

const getIndex = (): string[] => [...new Set([...readIndex(INDEX_KEY), ...readIndex(LEGACY_INDEX_KEY)])];

export const listProjects = (): BackgroundProject[] => getIndex()
  .map((id) => loadProject(id))
  .filter((project): project is BackgroundProject => Boolean(project))
  .sort((a, b) => b.updatedAt - a.updatedAt);

export const loadProject = (id: string): BackgroundProject | null => {
  const currentKey = projectKey(id);
  const legacyKey = projectKey(id, LEGACY_PREFIX);
  const keys = [currentKey, `${currentKey}${SNAPSHOT_SUFFIX}`, legacyKey, `${legacyKey}${SNAPSHOT_SUFFIX}`];
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = projectSchema.safeParse(JSON.parse(raw));
      if (parsed.success) return parsed.data;
    } catch {
      continue;
    }
  }
  return null;
};

export const saveProject = (project: BackgroundProject) => {
  const validated = projectSchema.parse(project);
  const key = projectKey(validated.id);
  const previous = localStorage.getItem(key);
  if (previous) localStorage.setItem(`${key}${SNAPSHOT_SUFFIX}`, previous);
  localStorage.setItem(key, JSON.stringify(validated));
  const index = [validated.id, ...getIndex().filter((id) => id !== validated.id)];
  localStorage.setItem(INDEX_KEY, JSON.stringify(index.slice(0, 30)));
  localStorage.setItem(ACTIVE_KEY, validated.id);
  window.dispatchEvent(new CustomEvent('quietbackdrop:project-saved', { detail: { id: validated.id, revision: validated.revision } }));
};

export const deleteProject = (id: string) => {
  for (const prefix of [PREFIX, LEGACY_PREFIX]) {
    localStorage.removeItem(projectKey(id, prefix));
    localStorage.removeItem(`${projectKey(id, prefix)}${SNAPSHOT_SUFFIX}`);
  }
  localStorage.setItem(INDEX_KEY, JSON.stringify(getIndex().filter((item) => item !== id)));
  localStorage.setItem(LEGACY_INDEX_KEY, JSON.stringify(readIndex(LEGACY_INDEX_KEY).filter((item) => item !== id)));
};

export const getActiveProjectId = () => localStorage.getItem(ACTIVE_KEY) ?? localStorage.getItem(LEGACY_ACTIVE_KEY);

export const exportProjectJson = (project: BackgroundProject) => {
  const blob = new Blob([JSON.stringify(projectSchema.parse(project), null, 2)], { type: 'application/json' });
  downloadBlob(blob, `${safeFileName(project.name)}.quietbackdrop.json`);
};

export const importProjectJson = async (file: File): Promise<BackgroundProject> => {
  const parsed = projectSchema.parse(JSON.parse(await file.text()));
  const now = Date.now();
  return { ...parsed, id: crypto.randomUUID(), name: `${parsed.name} 副本`, createdAt: now, updatedAt: now, revision: 0 };
};

export const safeFileName = (name: string) => name.replace(/[\\/:*?"<>|]/g, '-').trim() || 'video-background';

export const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};
