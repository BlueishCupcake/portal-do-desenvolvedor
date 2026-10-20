import { describe, expect, it } from 'vitest';

import { createWorkItem } from '@/test/factories/workItem.ts';
import {
  dedupeWorkItems,
  isActiveWorkItemState,
  isCompletedWorkItemState,
  isInactiveWorkItemState,
  isOverdueWorkItem,
  isUnassignedWorkItem,
} from '@/utils/metrics/classify.ts';

describe('metric classification', () => {
  it('classifies completed, inactive and active states', () => {
    expect(isCompletedWorkItemState('Closed')).toBe(true);
    expect(isCompletedWorkItemState('Resolved')).toBe(true);
    expect(isCompletedWorkItemState('Active')).toBe(false);
    expect(isInactiveWorkItemState('Removed')).toBe(true);
    expect(isInactiveWorkItemState('Cancelled')).toBe(true);
    expect(isActiveWorkItemState('Active')).toBe(true);
    expect(isActiveWorkItemState('Closed')).toBe(false);
    expect(isActiveWorkItemState('Removed')).toBe(false);
  });

  it('detects unassigned and overdue items only with a valid due date', () => {
    const now = new Date('2026-10-06T12:00:00.000Z');

    expect(isUnassignedWorkItem(createWorkItem({ assignedTo: 'Não atribuído' }))).toBe(
      true,
    );
    expect(isUnassignedWorkItem(createWorkItem({ assignedTo: 'Sophie' }))).toBe(false);
    expect(
      isOverdueWorkItem(createWorkItem({ dueDate: '2026-10-01', state: 'Active' }), now),
    ).toBe(true);
    expect(
      isOverdueWorkItem(createWorkItem({ dueDate: '2026-10-06', state: 'Active' }), now),
    ).toBe(false);
    expect(
      isOverdueWorkItem(createWorkItem({ dueDate: '2026-10-01', state: 'Closed' }), now),
    ).toBe(false);
    expect(isOverdueWorkItem(createWorkItem({ state: 'Active' }), now)).toBe(false);
    expect(
      isOverdueWorkItem(createWorkItem({ dueDate: 'invalid', state: 'Active' }), now),
    ).toBe(false);
  });

  it('deduplicates work items by stable id', () => {
    expect(
      dedupeWorkItems([
        createWorkItem({ id: 1, title: 'A' }),
        createWorkItem({ id: 2, title: 'B' }),
        createWorkItem({ id: 1, title: 'A duplicado' }),
      ]).map((item) => item.id),
    ).toEqual([1, 2]);
  });
});
