import { describe, expect, it } from 'vitest';

import { createWorkItem } from '@/test/factories/workItem.ts';
import {
  isResolvedWorkItemState,
  resolveBugStatus,
} from '@/utils/resolveBugStatus.ts';

describe('resolveBugStatus', () => {
  it('marks resolved bugs as fixed', () => {
    expect(isResolvedWorkItemState('Closed')).toBe(true);
    expect(
      resolveBugStatus(createWorkItem({ type: 'Bug', state: 'Resolved' })),
    ).toBe('fixed');
    expect(
      resolveBugStatus(createWorkItem({ type: 'Bug', state: 'Active' })),
    ).toBe('open');
  });

  it('uses related bugs on a task', () => {
    const task = createWorkItem({ id: 10, type: 'Task', relatedIds: [20] });
    const openBug = createWorkItem({ id: 20, type: 'Bug', state: 'Active' });
    const fixedBug = createWorkItem({ id: 20, type: 'Bug', state: 'Closed' });

    expect(resolveBugStatus(task, [task, openBug])).toBe('open');
    expect(resolveBugStatus(task, [task, fixedBug])).toBe('fixed');
    expect(resolveBugStatus(createWorkItem({ type: 'Task' }), [])).toBe('none');
  });
});
