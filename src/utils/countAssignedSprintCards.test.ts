import { describe, expect, it } from 'vitest';

import { createWorkItem } from '@/test/factories/workItem.ts';
import { countAssignedSprintCards } from '@/utils/countAssignedSprintCards.ts';

describe('countAssignedSprintCards', () => {
  it('counts assigned pulled and closed cards', () => {
    const counts = countAssignedSprintCards(
      [
        createWorkItem({
          assignedTo: 'Sophie Quines',
          boardColumn: 'Ag Desenvolvimento',
          state: 'Active',
        }),
        createWorkItem({
          assignedTo: 'Sophie Quines',
          boardColumn: 'Ag. Desenvolvimento',
          state: 'Closed',
        }),
        createWorkItem({
          assignedTo: 'Sophie Quines',
          boardColumn: 'Doing',
          state: 'Resolved',
        }),
        createWorkItem({
          assignedTo: 'Sophie Quines',
          boardColumn: 'QA',
          state: 'Active',
        }),
        createWorkItem({
          assignedTo: 'Alex Santos',
          boardColumn: 'Done',
          state: 'Closed',
        }),
      ],
      'Sophie Quines',
    );

    expect(counts).toEqual({ pulled: 2, closed: 2 });
  });

  it('matches Azure identity and returns zero without a user', () => {
    const workItems = [
      createWorkItem({
        assignedTo: 'Sophie Quines Mendonca',
        assignedToId: 'aad-1',
        boardColumn: 'Done',
        state: 'Closed',
      }),
    ];

    expect(
      countAssignedSprintCards(workItems, {
        id: 'aad-1',
        displayName: 'Sophie Mendonca',
      }),
    ).toEqual({ pulled: 1, closed: 1 });
    expect(countAssignedSprintCards(workItems)).toEqual({
      pulled: 0,
      closed: 0,
    });
  });
});
