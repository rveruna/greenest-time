import { describe, expect, it } from 'vitest';
import type { Slot } from './carbon';
import { describeStart, findBestWindow, untilLabel } from './window';

const T0 = new Date('2026-10-15T08:00:00Z');

function slots(values: number[]): Slot[] {
  return values.map((intensity, i) => ({
    from: new Date(T0.getTime() + i * 30 * 60000),
    to: new Date(T0.getTime() + (i + 1) * 30 * 60000),
    intensity,
    index: 'moderate',
  }));
}

describe('findBestWindow', () => {
  it('finds the cleanest consecutive run, not just the single lowest slot', () => {
    // One lone dip at index 1 (50) is a trap: the clean *run* is at indices 4-5 (60, 60).
    const w = findBestWindow(slots([200, 50, 300, 200, 60, 60, 250]), 1)!;
    expect(w.start).toBe(4);
    expect(w.average).toBe(60);
  });

  it('prefers the earliest window when two tie', () => {
    const w = findBestWindow(slots([100, 100, 100, 100, 100, 100]), 1)!;
    expect(w.start).toBe(0);
    expect(w.savingPercent).toBe(0);
  });

  it('reports how much cleaner it is than starting now', () => {
    const w = findBestWindow(slots([200, 200, 100, 100]), 1)!;
    expect(w.averageNow).toBe(200);
    expect(w.average).toBe(100);
    expect(w.savingPercent).toBe(50);
  });

  it('spans the right time range', () => {
    const w = findBestWindow(slots([300, 300, 300, 100, 100, 100, 100]), 2)!;
    expect(w.start).toBe(3);
    expect(w.from).toEqual(new Date('2026-10-15T09:30:00Z'));
    expect(w.to).toEqual(new Date('2026-10-15T11:30:00Z'));
  });

  it('returns null when the forecast is too short', () => {
    expect(findBestWindow(slots([100, 100]), 3)).toBeNull();
    expect(findBestWindow([], 1)).toBeNull();
  });

  it('handles a zero-intensity grid without dividing by zero', () => {
    expect(findBestWindow(slots([0, 0, 0, 0]), 1)!.savingPercent).toBe(0);
  });
});

describe('labels', () => {
  it('says now when the window starts within 15 minutes', () => {
    expect(describeStart(new Date(T0.getTime() + 10 * 60000), T0)).toBe('Now is the best time');
  });

  it('formats a wait as hours and minutes', () => {
    expect(untilLabel(new Date(T0.getTime() + 95 * 60000), T0)).toBe('in 1 h 35 min');
    expect(untilLabel(new Date(T0.getTime() + 120 * 60000), T0)).toBe('in 2 h');
    expect(untilLabel(new Date(T0.getTime() + 20 * 60000), T0)).toBe('in 20 min');
  });
});
