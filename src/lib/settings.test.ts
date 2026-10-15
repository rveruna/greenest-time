import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, parseSettings, serializeSettings } from './settings';

describe('parseSettings', () => {
  it('round-trips valid settings', () => {
    const s = { hours: 4 as const, outcode: 'EH1' };
    expect(parseSettings(serializeSettings(s))).toEqual(s);
  });

  it('falls back to defaults for nothing saved or broken JSON', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('{not json')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('null')).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps the good field when the other is bad', () => {
    expect(parseSettings(JSON.stringify({ hours: 7, outcode: 'EH1' }))).toEqual({ hours: 2, outcode: 'EH1' });
    expect(parseSettings(JSON.stringify({ hours: 3, outcode: 'nonsense' }))).toEqual({
      hours: 3,
      outcode: null,
    });
  });

  it('re-validates a saved postcode and only ever keeps the outward half', () => {
    expect(parseSettings(JSON.stringify({ hours: 1, outcode: 'eh1 1aa' }))).toEqual({
      hours: 1,
      outcode: 'EH1',
    });
  });
});
