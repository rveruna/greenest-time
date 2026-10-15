import { describe, expect, it } from 'vitest';
import { outwardCode } from './postcode';

describe('outwardCode', () => {
  it.each([
    ['EH1', 'EH1'],
    ['eh1', 'EH1'],
    ['EH1 1AA', 'EH1'],
    ['eh11aa', 'EH1'],
    ['  sw1a 2aa ', 'SW1A'],
    ['M1 1AE', 'M1'],
    ['B33 8TH', 'B33'],
    ['EC1A 1BB', 'EC1A'],
  ])('reads %j as %j', (input, expected) => {
    expect(outwardCode(input)).toBe(expected);
  });

  it.each(['', '   ', 'hello', '123', 'EH', 'E H 1 1 A A X', '1AA'])('rejects %j', (input) => {
    expect(outwardCode(input)).toBeNull();
  });

  it('never returns the inward half, so the full address cannot leak', () => {
    expect(outwardCode('EH1 1AA')).not.toContain('1AA');
  });
});
