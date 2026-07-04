import { strFromU8, strToU8, zlibSync, unzlibSync } from 'fflate';
import { getTemplate } from '../data/templates';
import { projectSchema, type BackgroundProject, type SharePayload } from '../types';

const toBase64Url = (bytes: Uint8Array) => {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
};

const fromBase64Url = (value: string) => {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

export const createSharePayload = (project: BackgroundProject): SharePayload => ({
  version: 1,
  templateId: project.templateId,
  renderer: project.renderer,
  quick: project.quick,
  advanced: project.advanced,
  guide: project.guide,
  animation: { duration: project.animation.duration, fps: project.animation.fps },
  canvas: project.canvas,
});

export const encodeSharePayload = (project: BackgroundProject) => toBase64Url(zlibSync(strToU8(JSON.stringify(createSharePayload(project)))));

export const decodeSharePayload = (encoded: string): BackgroundProject => {
  const payload = JSON.parse(strFromU8(unzlibSync(fromBase64Url(encoded)))) as SharePayload;
  if (payload.version !== 1) throw new Error('分享链接版本不受支持');
  const template = getTemplate(payload.templateId);
  const now = Date.now();
  return projectSchema.parse({
    version: 1,
    id: crypto.randomUUID(),
    name: `${template.name} 分享副本`,
    templateId: payload.templateId,
    renderer: payload.renderer,
    quick: payload.quick,
    advanced: payload.advanced,
    guide: payload.guide,
    animation: { ...payload.animation, playing: true, currentTime: 0 },
    canvas: payload.canvas,
    createdAt: now,
    updatedAt: now,
    revision: 0,
  });
};

export const getShareUrl = (project: BackgroundProject) => {
  const url = new URL(window.location.origin);
  url.pathname = '/share';
  url.searchParams.set('p', encodeSharePayload(project));
  return url.toString();
};
