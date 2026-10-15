import { describe, expect, it } from 'vitest';
import { formatStart, parseSlots } from './carbon';

describe('formatStart', () => {
  it('drops seconds so the API accepts it', () => {
    expect(formatStart(new Date('2026-10-15T08:30:45.123Z'))).toBe('2026-10-15T08:30Z');
  });
});

describe('parseSlots', () => {
  it('maps the API shape to slots with real dates', () => {
    const [s] = parseSlots({
      data: [
        { from: '2026-10-15T08:30Z', to: '2026-10-15T09:00Z', intensity: { forecast: 75, index: 'low' } },
      ],
    });
    expect(s.intensity).toBe(75);
    expect(s.index).toBe('low');
    expect(s.from.toISOString()).toBe('2026-10-15T08:30:00.000Z');
  });

  it('rejects a body with no data instead of returning an empty chart', () => {
    expect(() => parseSlots({ error: { code: '400' } })).toThrow();
    expect(() => parseSlots(null)).toThrow();
  });
});
