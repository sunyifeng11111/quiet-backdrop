import { describe, expect, it } from 'vitest';
import { animationPhase, getDimensions, loopingPhase, scrollGridOffset } from '../render/renderers';

describe('rendering dimensions', () => {
  it.each([
    ['9:16', '1080', 1080, 1920], ['16:9', '1080', 1920, 1080], ['1:1', '1080', 1080, 1080], ['4:5', '1080', 1080, 1350],
    ['9:16', '2k', 1440, 2560], ['16:9', '2k', 2560, 1440], ['1:1', '2k', 1440, 1440], ['4:5', '2k', 1440, 1800],
  ] as const)('maps %s %s to %sx%s', (aspect, resolution, width, height) => {
    expect(getDimensions(aspect, resolution)).toEqual({ width, height });
  });
});

describe('animation phase', () => {
  it('is based only on elapsed time and speed', () => {
    expect(animationPhase(2.5, 0.4)).toBe(animationPhase(2.5, 0.4));
  });

  it('moves faster when the speed control increases', () => {
    const slowTravel = animationPhase(1, 0.2);
    const fastTravel = animationPhase(1, 0.8);
    expect(fastTravel).toBeGreaterThan(slowTravel);
  });
});

describe('scrolling grid', () => {
  it('moves upward or downward based on the selected direction', () => {
    expect(scrollGridOffset(1, 10, 0.4, 40, 270)).toBeLessThan(0);
    expect(scrollGridOffset(1, 10, 0.4, 40, 90)).toBeGreaterThan(0);
  });

  it('returns to its starting position at the loop boundary', () => {
    expect(scrollGridOffset(0, 10, 0.4, 40, 270)).toBe(0);
    expect(scrollGridOffset(10, 10, 0.4, 40, 270)).toBe(0);
  });
});

describe('looping creator backgrounds', () => {
  it('returns to the same phase at the duration boundary', () => {
    expect(loopingPhase(0, 10, 0.4)).toBe(0);
    expect(loopingPhase(10, 10, 0.4)).toBe(0);
  });
});
