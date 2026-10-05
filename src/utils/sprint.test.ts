import { describe, expect, it } from 'vitest';

import {
  findSprint,
  mergeSprints,
  sortSprints,
  sprintValue,
} from '@/utils/sprint.ts';

const sprint42 = {
  id: 'sprint-42',
  name: 'Sprint 42',
  path: 'Portal\\Sprint 42',
  startDate: '2026-10-01',
  endDate: '2026-10-15',
};

const sprint41 = {
  id: 'sprint-41',
  name: 'Sprint 41',
  path: 'Portal\\Sprint 41',
  startDate: '2026-09-16',
  endDate: '2026-09-30',
};

describe('sprint helpers', () => {
  it('sorts sprints from newest to oldest', () => {
    expect(sortSprints([sprint41, sprint42]).map((sprint) => sprint.id)).toEqual([
      'sprint-42',
      'sprint-41',
    ]);
  });

  it('finds a sprint by path, id or name', () => {
    expect(findSprint([sprint42], 'Portal\\Sprint 42')?.id).toBe('sprint-42');
    expect(findSprint([sprint42], 'sprint-42')?.name).toBe('Sprint 42');
    expect(sprintValue(sprint42)).toBe('Portal\\Sprint 42');
  });

  it('keeps the current sprint in the list', () => {
    expect(mergeSprints([sprint41], sprint42).map((sprint) => sprint.id)).toEqual([
      'sprint-42',
      'sprint-41',
    ]);
    expect(mergeSprints([sprint42], sprint42)).toHaveLength(1);
  });
});
