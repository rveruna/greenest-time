import { describe, expect, it } from 'vitest';
import { describeMix, summariseMix } from './mix';

// South Scotland on 15 October 2026, when the forecast was 0 gCO2/kWh for 48 hours
const southScotland = [
  { fuel: 'biomass', perc: 0 },
  { fuel: 'coal', perc: 0 },
  { fuel: 'imports', perc: 0 },
  { fuel: 'gas', perc: 0 },
  { fuel: 'nuclear', perc: 24.9 },
  { fuel: 'other', perc: 0 },
  { fuel: 'hydro', perc: 0 },
  { fuel: 'solar', perc: 4.2 },
  { fuel: 'wind', perc: 70.9 },
];

describe('summariseMix', () => {
  it('names the biggest sources, largest first, in whole percent', () => {
    expect(summariseMix(southScotland)!.parts).toEqual([
      { fuel: 'wind', perc: 71 },
      { fuel: 'nuclear', perc: 25 },
      { fuel: 'solar', perc: 4 },
    ]);
  });

  it('keeps only the top three, and leaves out anything under 1%', () => {
    const parts = summariseMix([
      { fuel: 'wind', perc: 40.3 },
      { fuel: 'imports', perc: 17.1 },
      { fuel: 'solar', perc: 14.1 },
      { fuel: 'gas', perc: 12.7 },
      { fuel: 'coal', perc: 0.4 },
    ])!.parts.map((p) => p.fuel);
    expect(parts).toEqual(['wind', 'imports', 'solar']);
  });

  it('adds up wind, solar, nuclear and hydro as the zero-carbon share', () => {
    expect(summariseMix(southScotland)!.zeroCarbonPercent).toBe(100);
    expect(
      summariseMix([
        { fuel: 'wind', perc: 40 },
        { fuel: 'gas', perc: 30 },
        { fuel: 'hydro', perc: 5 },
        { fuel: 'biomass', perc: 25 },
      ])!.zeroCarbonPercent,
    ).toBe(45);
  });

  it('gives nothing when the API gave no mix, so the screen shows nothing rather than an empty card', () => {
    expect(summariseMix(null)).toBeNull();
    expect(summariseMix([])).toBeNull();
    expect(summariseMix([{ fuel: 'wind', perc: 0.2 }])).toBeNull();
  });
});

describe('describeMix', () => {
  it('reads as a sentence', () => {
    expect(describeMix(summariseMix(southScotland)!)).toBe('71% wind, 25% nuclear and 4% solar');
    expect(describeMix({ parts: [{ fuel: 'wind', perc: 100 }], zeroCarbonPercent: 100 })).toBe('100% wind');
  });
});
