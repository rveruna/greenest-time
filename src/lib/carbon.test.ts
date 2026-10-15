import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchForecast,
  formatStart,
  parseGeneration,
  parseRegional,
  parseSlots,
  PostcodeNotFoundError,
} from './carbon';

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

describe('the generation mix', () => {
  const mix = [
    { fuel: 'wind', perc: 70.9 },
    { fuel: 'nuclear', perc: 24.9 },
  ];
  const slot = (generationmix?: unknown) => ({
    from: '2026-10-15T08:30Z',
    to: '2026-10-15T09:00Z',
    intensity: { forecast: 0, index: 'very low' },
    ...(generationmix ? { generationmix } : {}),
  });

  it('takes the first half-hour of a regional forecast as the mix now', () => {
    const f = parseRegional({ data: { shortname: 'South Scotland', data: [slot(mix), slot([])] } }, 'EH22');
    expect(f.mixNow).toEqual(mix);
  });

  it('is null when a regional forecast has no mix', () => {
    expect(
      parseRegional({ data: { shortname: 'South Scotland', data: [slot()] } }, 'EH22').mixNow,
    ).toBeNull();
  });

  it('reads the national mix, and gives null for anything unexpected', () => {
    expect(parseGeneration({ data: { from: 'x', to: 'y', generationmix: mix } })).toEqual(mix);
    expect(parseGeneration({ data: {} })).toBeNull();
    expect(parseGeneration(null)).toBeNull();
  });

  describe('fetching the national forecast', () => {
    afterEach(() => vi.unstubAllGlobals());
    const json = (body: unknown, ok = true) =>
      Promise.resolve({ ok, status: ok ? 200 : 500, json: async () => body });

    it('asks for the current mix at the same time', async () => {
      const fetchMock = vi.fn((url: string) =>
        url.endsWith('/generation') ? json({ data: { generationmix: mix } }) : json({ data: [slot()] }),
      );
      vi.stubGlobal('fetch', fetchMock);

      const f = await fetchForecast(new Date('2026-10-15T08:30:00Z'), null);

      expect(f.mixNow).toEqual(mix);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.carbonintensity.org.uk/generation',
        expect.anything(),
      );
    });

    it('still shows the forecast when the mix cannot be had', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn((url: string) => (url.endsWith('/generation') ? json({}, false) : json({ data: [slot()] }))),
      );
      expect((await fetchForecast(new Date(), null)).mixNow).toBeNull();

      vi.stubGlobal(
        'fetch',
        vi.fn((url: string) =>
          url.endsWith('/generation') ? Promise.reject(new Error('offline')) : json({ data: [slot()] }),
        ),
      );
      const f = await fetchForecast(new Date(), null);
      expect(f.slots).toHaveLength(1);
      expect(f.mixNow).toBeNull();
    });

    it('does not make the extra request for a regional forecast, which carries its own mix', async () => {
      const fetchMock = vi.fn(() => json({ data: { shortname: 'South Scotland', data: [slot(mix)] } }));
      vi.stubGlobal('fetch', fetchMock);

      await fetchForecast(new Date(), 'EH22');

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
