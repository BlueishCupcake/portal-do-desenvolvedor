import type { WorkItemType } from '@/types/workItem.ts';

const WORK_ITEM_TYPE_MAP: Record<string, WorkItemType> = {
  Task: 'Task',
  Bug: 'Bug',
  'User Story': 'User Story',
  'Product Backlog Item': 'Product Backlog Item',
  Feature: 'Feature',
};

export function mapWorkItemType(workItemType: string): WorkItemType {
  return WORK_ITEM_TYPE_MAP[workItemType] ?? 'Other';
}
