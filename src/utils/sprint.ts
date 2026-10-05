import type { Sprint } from '@/types/sprint.ts';

export function sprintValue(sprint: Sprint): string {
  return sprint.path || sprint.id;
}

export function findSprint(
  sprints: readonly Sprint[],
  value?: string | null,
): Sprint | undefined {
  if (!value) {
    return undefined;
  }

  return sprints.find(
    (sprint) =>
      sprint.path === value || sprint.id === value || sprint.name === value,
  );
}

export function sortSprints(sprints: readonly Sprint[]): Sprint[] {
  return [...sprints].sort((left, right) => {
    const leftDate = left.startDate || left.endDate;
    const rightDate = right.startDate || right.endDate;

    if (leftDate === rightDate) {
      return right.name.localeCompare(left.name);
    }

    if (!leftDate) {
      return 1;
    }

    if (!rightDate) {
      return -1;
    }

    return rightDate.localeCompare(leftDate);
  });
}

export function mergeSprints(
  sprints: readonly Sprint[],
  current?: Sprint,
): Sprint[] {
  if (!current) {
    return sortSprints(sprints);
  }

  const alreadyListed = sprints.some(
    (sprint) => sprint.id === current.id || sprint.path === current.path,
  );

  return sortSprints(alreadyListed ? sprints : [current, ...sprints]);
}
