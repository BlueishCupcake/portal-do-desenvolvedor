import type { BugStatus, WorkItem } from '@/types/workItem.ts';

const RESOLVED_STATE_PATTERN =
  /resolv|closed|done|conclu|encerr|fixed|corrig|pronto/i;

export function isResolvedWorkItemState(state: string): boolean {
  return RESOLVED_STATE_PATTERN.test(state);
}

type BugStatusSource = Pick<WorkItem, 'type' | 'state'> &
  Partial<Pick<WorkItem, 'id' | 'relatedIds' | 'relatedBugs'>>;

export function resolveBugStatus(
  workItem: BugStatusSource,
  catalog: readonly WorkItem[] = [],
): BugStatus {
  if (workItem.type === 'Bug') {
    return isResolvedWorkItemState(workItem.state) ? 'fixed' : 'open';
  }

  const relatedIds = new Set(workItem.relatedIds ?? []);
  const catalogBugs = catalog.filter((item) => {
    if (item.type !== 'Bug') {
      return false;
    }

    return (
      relatedIds.has(item.id) ||
      (workItem.id !== undefined && (item.relatedIds ?? []).includes(workItem.id))
    );
  });
  const relatedBugs = new Map<number, string>();

  for (const bug of workItem.relatedBugs ?? []) {
    relatedBugs.set(bug.id, bug.state);
  }
  for (const bug of catalogBugs) {
    relatedBugs.set(bug.id, bug.state);
  }

  if (relatedBugs.size === 0) {
    return 'none';
  }

  return [...relatedBugs.values()].every(isResolvedWorkItemState) ? 'fixed' : 'open';
}
