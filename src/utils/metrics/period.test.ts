import { describe, expect, it } from 'vitest';

import {
  isDateInRange,
  isUtcDayBefore,
  parseUtcDate,
  resolveMetricPeriodRange,
  startOfUtcDay,
  startOfUtcMonth,
} from '@/utils/metrics/period.ts';

describe('metric period', () => {
  it('parses valid UTC dates and ignores invalid values', () => {
    expect(parseUtcDate('2026-10-06T12:00:00.000Z')?.toISOString()).toBe(
      '2026-10-06T12:00:00.000Z',
    );
    expect(parseUtcDate('amanhã')).toBeUndefined();
    expect(parseUtcDate(undefined)).toBeUndefined();
  });

  it('compares calendar days in UTC', () => {
    const now = new Date('2026-10-06T12:00:00.000Z');

    expect(startOfUtcDay(now).toISOString()).toBe('2026-10-06T00:00:00.000Z');
    expect(startOfUtcMonth(now).toISOString()).toBe('2026-10-01T00:00:00.000Z');
    expect(isUtcDayBefore('2026-10-05', now)).toBe(true);
    expect(isUtcDayBefore('2026-10-06', now)).toBe(false);
    expect(isUtcDayBefore('não-é-data', now)).toBe(false);
  });

  it('keeps dates inside inclusive bounds', () => {
    const start = new Date('2026-10-01T00:00:00.000Z');
    const end = new Date('2026-10-06T12:00:00.000Z');

    expect(isDateInRange(undefined, start, end)).toBe(false);
    expect(isDateInRange(new Date('2026-09-30T23:59:59.000Z'), start, end)).toBe(
      false,
    );
    expect(isDateInRange(new Date('2026-10-01T00:00:00.000Z'), start, end)).toBe(
      true,
    );
    expect(isDateInRange(new Date('2026-10-07T00:00:00.000Z'), start, end)).toBe(
      false,
    );
    expect(isDateInRange(new Date('2026-10-03T00:00:00.000Z'), undefined, undefined)).toBe(
      true,
    );
  });

  it('resolves rolling windows from UTC midnight', () => {
    const now = new Date('2026-10-16T15:00:00.000Z');

    expect(resolveMetricPeriodRange('7-days', undefined, now)).toEqual({
      start: new Date('2026-10-09T00:00:00.000Z'),
      end: now,
    });
    expect(resolveMetricPeriodRange('30-days', undefined, now).start).toEqual(
      new Date('2026-09-16T00:00:00.000Z'),
    );
    expect(resolveMetricPeriodRange('90-days', undefined, now).start).toEqual(
      new Date('2026-07-18T00:00:00.000Z'),
    );
    expect(
      resolveMetricPeriodRange(
        'current-sprint',
        { startDate: '2026-10-01', endDate: '2026-10-15' },
        now,
      ),
    ).toEqual({
      start: new Date('2026-10-01T00:00:00.000Z'),
      end: new Date('2026-10-15T00:00:00.000Z'),
    });
    expect(resolveMetricPeriodRange('current-sprint', undefined, now)).toEqual({
      start: undefined,
      end: now,
    });
  });
});
