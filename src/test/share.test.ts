import { describe, expect, it } from 'vitest';
import { templates } from '../data/templates';
import { decodeSharePayload, encodeSharePayload } from '../lib/share';
import { createProject } from '../store/projectStore';

describe('share payload', () => {
  it('round-trips a project into a new local copy', () => {
    const source = createProject(templates[4]);
    source.quick.density = 0.73;
    source.canvas.aspectRatio = '4:5';
    const decoded = decodeSharePayload(encodeSharePayload(source));
    expect(decoded.id).not.toBe(source.id);
    expect(decoded.templateId).toBe(source.templateId);
    expect(decoded.quick.density).toBe(0.73);
    expect(decoded.canvas.aspectRatio).toBe('4:5');
    expect(decoded.name).toContain('分享副本');
  });
});
