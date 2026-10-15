import { describe, expect, it } from 'vitest';
import { buildIcs, reminderAt } from './reminder';

const now = new Date('2026-10-15T10:00:00Z');
const at = (iso: string) => new Date(iso);

describe('reminderAt', () => {
  it('fires five minutes before the window', () => {
    expect(reminderAt({ from: at('2026-10-15T11:30:00Z') }, now)).toEqual(at('2026-10-15T11:25:00Z'));
  });

  it('returns null when the window is about to start or already has', () => {
    expect(reminderAt({ from: at('2026-10-15T10:03:00Z') }, now)).toBeNull();
    expect(reminderAt({ from: now }, now)).toBeNull();
  });

  it('respects a custom lead time', () => {
    expect(reminderAt({ from: at('2026-10-15T11:30:00Z') }, now, 15)).toEqual(at('2026-10-15T11:15:00Z'));
  });
});

describe('buildIcs', () => {
  const window = { from: at('2026-10-15T11:30:00Z'), to: at('2026-10-15T13:30:00Z'), average: 59 };
  const ics = buildIcs(window, now, 'South Scotland');

  it('uses CRLF line endings throughout, as the spec requires', () => {
    expect(ics.endsWith('\r\n')).toBe(true);
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/);
  });

  it('puts the window times in UTC', () => {
    expect(ics).toContain('DTSTART:20261015T113000Z');
    expect(ics).toContain('DTEND:20261015T133000Z');
    expect(ics).toContain('DTSTAMP:20261015T100000Z');
  });

  it('includes an alert five minutes before', () => {
    expect(ics).toContain('BEGIN:VALARM');
    expect(ics).toContain('TRIGGER:-PT5M');
  });

  it('escapes iCalendar special characters in text', () => {
    expect(buildIcs(window, now, 'Wales; North, West')).toContain(String.raw`Wales\; North\, West`);
  });

  it('is one well-formed event', () => {
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true);
  });
});
