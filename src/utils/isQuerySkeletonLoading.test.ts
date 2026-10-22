import { describe, expect, it } from 'vitest';

import { isQuerySkeletonLoading } from '@/utils/isQuerySkeletonLoading.ts';

describe('isQuerySkeletonLoading', () => {
  it('returns false when the query is disabled', () => {
    expect(
      isQuerySkeletonLoading(
        { isPending: true, isFetching: false, isPlaceholderData: false },
        false,
      ),
    ).toBe(false);
  });

  it('returns true on the initial fetch', () => {
    expect(
      isQuerySkeletonLoading(
        { isPending: true, isFetching: true, isPlaceholderData: false },
        true,
      ),
    ).toBe(true);
  });

  it('returns true while placeholder data is being replaced', () => {
    expect(
      isQuerySkeletonLoading(
        { isPending: false, isFetching: true, isPlaceholderData: true },
        true,
      ),
    ).toBe(true);
  });

  it('returns false during a background refetch with settled data', () => {
    expect(
      isQuerySkeletonLoading(
        { isPending: false, isFetching: true, isPlaceholderData: false },
        true,
      ),
    ).toBe(false);
  });
});
