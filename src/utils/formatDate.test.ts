import { describe, expect, it } from 'vitest';

import {
  formatDate,
  formatDateRange,
  formatShortDate,
  formatShortDateRange,
} from '@/utils/formatDate.ts';

describe('formatDate', () => {
  it('formats ISO dates in pt-BR without timezone drift', () => {
    expect(formatDate('2026-10-01')).toBe('01/10/2026');
    expect(formatShortDate('2026-10-15T12:00:00.000Z')).toBe('15/10');
    expect(formatDateRange('2026-10-01', '2026-10-15')).toBe(
      '01/10/2026 → 15/10/2026',
    );
    expect(formatShortDateRange('2026-10-01', '2026-10-15')).toBe('01/10 → 15/10');
  });

  it('returns the original value when the date is invalid', () => {
    expect(formatDate('amanhã')).toBe('amanhã');
    expect(formatShortDate('depois')).toBe('depois');
  });
});
