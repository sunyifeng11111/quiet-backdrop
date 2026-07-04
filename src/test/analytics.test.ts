import { beforeEach, describe, expect, it } from 'vitest';
import { track } from '../lib/analytics';

describe('privacy-safe analytics', () => {
  beforeEach(() => localStorage.clear());

  it('drops project content and keeps approved capability fields', () => {
    track('export_started', { resolution: '1080', fps: 30, projectName: '私密项目', color: '#ff0000' });
    const events = JSON.parse(localStorage.getItem('quietbackdrop:analytics') ?? '[]');
    expect(events[0].properties).toEqual({ resolution: '1080', fps: 30 });
    expect(JSON.stringify(events)).not.toContain('私密项目');
    expect(JSON.stringify(events)).not.toContain('#ff0000');
  });
});
