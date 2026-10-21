import type { WorkItem } from '@/types/workItem.ts';

export function unifiedDeployWorkItems(
  selectedItems: WorkItem[],
  catalog: WorkItem[],
  existingRelatedIds: number[],
): WorkItem[] {
  const ids = new Set([
    ...existingRelatedIds,
    ...selectedItems.map((item) => item.id),
  ]);
  const byId = new Map<number, WorkItem>();

  for (const item of catalog) {
    if (ids.has(item.id)) {
      byId.set(item.id, item);
    }
  }

  for (const item of selectedItems) {
    if (!byId.has(item.id)) {
      byId.set(item.id, item);
    }
  }

  return [...byId.values()];
}
