import { describe, expect, it } from 'vitest';

import { createWorkItem } from '@/test/factories/workItem.ts';
import { sumAssignedStoryPoints } from '@/utils/sumAssignedStoryPoints.ts';

describe('sumAssignedStoryPoints', () => {
  it('sums story points only for the current user', () => {
    const total = sumAssignedStoryPoints(
      [
        createWorkItem({ assignedTo: 'Sophie Quines', storyPoints: 5 }),
        createWorkItem({ assignedTo: 'Sophie Quines', storyPoints: 3 }),
        createWorkItem({ assignedTo: 'Alex Santos', storyPoints: 8 }),
        createWorkItem({ assignedTo: 'Sophie Quines' }),
      ],
      'Sophie Quines',
    );

    expect(total).toBe(8);
  });

  it('matches the current user by Azure identity when display names differ', () => {
    const total = sumAssignedStoryPoints(
      [
        createWorkItem({
          assignedTo: 'Sophie Quines Mendonca',
          assignedToId: 'aad-1',
          assignedToUniqueName: 'sophie.mendonca@sistemapoliedro.com.br',
          storyPoints: 4,
        }),
        createWorkItem({
          assignedTo: 'Alex Santos',
          assignedToId: 'aad-2',
          storyPoints: 3,
        }),
      ],
      {
        id: 'aad-1',
        displayName: 'Sophie Mendonca',
        email: 'sophie.mendonca@sistemapoliedro.com.br',
      },
    );

    expect(total).toBe(4);
  });

  it('returns zero without an assignee', () => {
    expect(sumAssignedStoryPoints([createWorkItem({ storyPoints: 5 })])).toBe(0);
  });
});
