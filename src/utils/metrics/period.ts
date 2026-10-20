import type { MetricPeriod } from '@/types/metrics.ts';

const PERIOD_DAYS: Record<Exclude<MetricPeriod, 'current-sprint'>, number> = {
  '7-days': 7,
  '30-days': 30,
  '90-days': 90,
};

export function parseUtcDate(value: string | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

export function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function startOfUtcMonth(date: Date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function isUtcDayBefore(value: string, now: Date): boolean {
  const date = parseUtcDate(value);
  if (!date) {
    return false;
  }

  return startOfUtcDay(date).getTime() < startOfUtcDay(now).getTime();
}

export function isDateInRange(
  value: Date | undefined,
  start: Date | undefined,
  end: Date | undefined,
): boolean {
  if (!value) {
    return false;
  }

  if (start && value.getTime() < start.getTime()) {
    return false;
  }

  if (end && value.getTime() > end.getTime()) {
    return false;
  }

  return true;
}

export function resolveMetricPeriodRange(
  period: MetricPeriod,
  sprint?: { startDate?: string; endDate?: string },
  now: Date = new Date(),
): { start?: Date; end: Date } {
  if (period === 'current-sprint') {
    return {
      start: parseUtcDate(sprint?.startDate),
      end: parseUtcDate(sprint?.endDate) ?? now,
    };
  }

  const start = startOfUtcDay(now);
  start.setUTCDate(start.getUTCDate() - PERIOD_DAYS[period]);

  return { start, end: now };
}
