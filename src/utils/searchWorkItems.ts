import type { WorkItem } from '@/types/workItem.ts';

export function matchesSearch(item: WorkItem, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length === 0) {
    return true;
  }

  return (
    item.title.toLowerCase().includes(normalizedQuery) ||
    String(item.id).includes(normalizedQuery) ||
    item.type.toLowerCase().includes(normalizedQuery) ||
    item.state.toLowerCase().includes(normalizedQuery)
  );
}
