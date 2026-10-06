import type { WorkItem, WorkItemPullRequest } from '@/types/workItem.ts';

function uniqueBy<T>(values: T[], key: (value: T) => string): T[] {
  const seen = new Set<string>();

  return values.filter((value) => {
    const valueKey = key(value);
    if (seen.has(valueKey)) {
      return false;
    }

    seen.add(valueKey);
    return true;
  });
}

function targetsMain(pullRequest: WorkItemPullRequest): boolean {
  const branch = pullRequest.targetBranch
    .replace(/^refs\/heads\//i, '')
    .toLowerCase();

  return branch === 'main';
}

function workItemTypeLabel(item: WorkItem): string {
  const labels: Record<WorkItem['type'], string> = {
    Bug: 'BUG',
    Feature: 'FEATURE',
    Other: 'ITEM',
    'Product Backlog Item': 'PRODUCT BACKLOG ITEM',
    Task: 'TAREFA',
    'User Story': 'USER STORY',
  };

  return labels[item.type];
}

export function buildDeployCardDescription(
  selectedItems: WorkItem[],
  catalog: WorkItem[] = selectedItems,
): string {
  const pullRequests = selectedItems.flatMap((item) =>
    (item.pullRequests ?? [])
      .filter(targetsMain)
      .map((pullRequest) => ({ item, pullRequest })),
  );
  const applications = uniqueBy(
    pullRequests.map(({ pullRequest }) => ({
      repositoryName: pullRequest.repositoryName,
      projectName: pullRequest.projectName,
    })),
    (application) =>
      `${application.repositoryName.toLowerCase()}:${application.projectName.toLowerCase()}`,
  );
  const groupedPullRequests = new Map<
    string,
    Array<{ item: WorkItem; pullRequest: WorkItemPullRequest }>
  >();

  for (const entry of pullRequests) {
    const key = `${entry.pullRequest.repositoryName} / ${entry.pullRequest.projectName}`;
    const current = groupedPullRequests.get(key) ?? [];
    current.push(entry);
    groupedPullRequests.set(key, current);
  }

  const relatedStoryIds = new Set(
    selectedItems.flatMap((item) => item.relatedIds ?? []),
  );
  const relatedStories = catalog.filter(
    (item) =>
      relatedStoryIds.has(item.id) &&
      (item.type === 'Feature' ||
        item.type === 'User Story' ||
        item.type === 'Product Backlog Item'),
  );
  const storiesAndFeatures = uniqueBy(
    [...relatedStories, ...selectedItems],
    (item) => String(item.id),
  );
  const lines = ['Aplicações afetadas:'];

  lines.push(
    ...(applications.length > 0
      ? applications.map(
          (application) =>
            `${application.repositoryName} / ${application.projectName}`,
        )
      : ['Nenhuma aplicação identificada nas pull requests das tarefas.']),
  );
  lines.push('', 'Pull Requests:');

  if (groupedPullRequests.size === 0) {
    lines.push('Nenhuma pull request vinculada às tarefas selecionadas.');
  } else {
    for (const [application, entries] of groupedPullRequests) {
      lines.push(application);
      lines.push(
        ...uniqueBy(entries, ({ pullRequest }) => String(pullRequest.id)).map(
          ({ pullRequest }) => {
            const label = `(Main) (!${String(pullRequest.id)})`;
            return pullRequest.url
              ? `[${label}](${pullRequest.url})`
              : label;
          },
        ),
      );
    }
  }

  lines.push('', 'Stories/Features:');
  lines.push(
    ...storiesAndFeatures.map((item) => {
      const label = `${workItemTypeLabel(item)} ${String(item.id)}: ${item.title}`;
      return item.url ? `[${label}](${item.url})` : label;
    }),
  );

  return lines.join('\n');
}
