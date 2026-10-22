interface QuerySkeletonState {
  isPending: boolean;
  isFetching: boolean;
  isPlaceholderData: boolean;
}

/** True while the query has no settled data yet (initial load or placeholder swap). */
export function isQuerySkeletonLoading(
  query: QuerySkeletonState,
  enabled = true,
): boolean {
  if (!enabled) {
    return false;
  }

  if (query.isPending && query.isFetching) {
    return true;
  }

  return query.isFetching && query.isPlaceholderData;
}
