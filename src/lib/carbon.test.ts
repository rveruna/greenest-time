import { describe, expect, it } from 'vitest';
import { formatStart, parseRegional, parseSlots, PostcodeNotFoundError } from './carbon';

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

describe('parseRegional', () => {
  const slot = {
    from: '2026-10-15T08:30Z',
    to: '2026-10-15T09:00Z',
    intensity: { forecast: 0, index: 'very low' },
  };

  it('reads the region name and its slots', () => {
    const f = parseRegional({ data: { shortname: 'South Scotland', postcode: 'EH1', data: [slot] } }, 'EH1');
    expect(f.region).toBe('South Scotland');
    expect(f.slots[0].intensity).toBe(0);
  });

  it("turns the API's `null` for an unknown postcode into a not-found error, not a crash", () => {
    expect(() => parseRegional({ data: null }, 'ZZ99')).toThrow(PostcodeNotFoundError);
    expect(() => parseRegional(null, 'ZZ99')).toThrow(PostcodeNotFoundError);
  });
});
