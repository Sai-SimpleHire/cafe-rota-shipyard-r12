import { describe, expect, it } from 'vitest';

import {
  addDays,
  dayLabel,
  isIsoDate,
  mondayOf,
  parseTime,
  timeRange,
  weekDays,
} from '@/lib/rota/time';

describe('weeks run Monday to Sunday', () => {
  it('finds the Monday of any day in the week', () => {
    expect(mondayOf('2026-11-09')).toBe('2026-11-09');
    expect(mondayOf('2026-11-12')).toBe('2026-11-09');
    expect(mondayOf('2026-11-15')).toBe('2026-11-09');
    expect(mondayOf('2026-11-16')).toBe('2026-11-16');
  });

  it('crosses months and years', () => {
    expect(mondayOf('2027-01-01')).toBe('2026-12-28');
    expect(addDays('2026-12-28', 7)).toBe('2027-01-04');
  });

  it('lists seven days', () => {
    const days = weekDays('2026-11-09');
    expect(days).toHaveLength(7);
    expect(days[6]).toBe('2026-11-15');
  });

  it('labels a day the way the café says it', () => {
    expect(dayLabel('2026-11-10')).toBe('Tue 10 Nov');
  });

  it('accepts only real calendar dates', () => {
    expect(isIsoDate('2026-02-28')).toBe(true);
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(isIsoDate('next week')).toBe(false);
  });
});

describe('shift times', () => {
  it('reads a time of day', () => {
    expect(parseTime('09:30')).toBe(570);
    expect(parseTime('7:05')).toBe(425);
  });

  it('refuses something that is not a time', () => {
    expect(parseTime('25:00')).toBeNull();
    expect(parseTime('09:60')).toBeNull();
    expect(parseTime('nine')).toBeNull();
  });

  it('shows a shift as a range', () => {
    expect(timeRange(540, 900)).toBe('09:00–15:00');
  });
});
