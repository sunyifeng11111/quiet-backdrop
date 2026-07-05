import { describe, expect, it } from 'vitest';
import { templates } from '../data/templates';
import { createProject } from '../store/projectStore';
import { projectSchema } from '../types';

describe('template catalog', () => {
  it('keeps the requested editor templates at the front in order', () => {
    expect(templates.slice(0, 7).map((template) => template.id)).toEqual([
      'mono-scroll-grid',
      'quiet-grid',
      'signal-cross',
      'quiet-cross',
      'soft-dots',
      'mono-dots',
      'pulse-cross',
    ]);
  });

  it('contains the complete template catalog', () => {
    expect(templates).toHaveLength(17);
    for (const renderer of ['grid', 'cross', 'dots', 'flow']) {
      expect(templates.filter((template) => template.renderer === renderer)).toHaveLength(3);
    }
    expect(templates.filter((template) => template.renderer === 'scroll-grid')).toHaveLength(1);
    for (const renderer of ['gradient', 'spotlight', 'grain', 'scanline']) {
      expect(templates.filter((template) => template.renderer === renderer)).toHaveLength(1);
    }
  });

  it('includes the four creator-focused background templates', () => {
    expect(templates.map((template) => template.id)).toEqual(expect.arrayContaining([
      'ambient-gradient', 'soft-spotlight', 'film-grain', 'signal-scanline',
    ]));
  });

  it('includes a black vertical scrolling small-grid template', () => {
    const template = templates.find((item) => item.id === 'mono-scroll-grid');
    expect(template?.quick.background).toBe('#000000');
    expect(template?.quick.direction).toBe(270);
    expect(template?.advanced.opacity).toBeLessThan(0.4);
  });

  it('creates schema-valid projects from every template', () => {
    for (const template of templates) expect(projectSchema.safeParse(createProject(template)).success).toBe(true);
  });

  it('starts the default grid at 80 density with content guides disabled', () => {
    const project = createProject();
    expect(project.renderer).toBe('grid');
    expect(project.quick.density).toBe(0.8);
    expect(project.guide.mode).toBe('none');
    expect(project.guide.showText).toBe(false);
  });

  it('starts the quiet cross at 80 density and 40 speed', () => {
    const template = templates.find((item) => item.id === 'quiet-cross');
    expect(template?.quick.density).toBe(0.8);
    expect(template?.quick.speed).toBe(0.4);
  });

  it('uses the tuned dot template defaults', () => {
    const softDots = templates.find((item) => item.id === 'soft-dots');
    const monoDots = templates.find((item) => item.id === 'mono-dots');

    expect(softDots?.quick.density).toBe(0.7);
    expect(softDots?.quick.speed).toBe(0.6);
    expect(monoDots?.quick.density).toBe(0.4);
    expect(monoDots?.quick.speed).toBe(0.4);
  });
});
