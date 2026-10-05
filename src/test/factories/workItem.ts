import type { WorkItem, WorkItemDetails } from '@/types/workItem.ts';

export function createWorkItem(overrides: Partial<WorkItem> = {}): WorkItem {
  return {
    id: 123,
    title: 'Implement new filter',
    type: 'Task',
    state: 'Active',
    assignedTo: 'developer',
    boardColumn: 'Ag. QA',
    iterationPath: 'Sprint 42',
    ...overrides,
  };
}

export function createWorkItemDetails(
  overrides: Partial<WorkItemDetails> = {},
): WorkItemDetails {
  return {
    ...createWorkItem(overrides),
    sprintName: 'Sprint 42',
    createdAt: '2026-10-01',
    updatedAt: '2026-10-04',
    ...overrides,
  };
}
