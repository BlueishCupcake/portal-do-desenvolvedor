import {
  mockDeveloper,
  mockPipelines,
  mockSprint,
  mockSprints,
  mockWorkItems,
  toWorkItemDetails,
} from '@/services/azureDevOps/mock/mockData.ts';
import type { AzureDevOpsService } from '@/services/azureDevOps/types.ts';
import { AzureDevOpsError } from '@/services/azureDevOps/types.ts';
import type { DeployCardSummary } from '@/types/deployCard.ts';
import type { Developer } from '@/types/developer.ts';
import type { PipelineRun } from '@/types/pipeline.ts';
import type { Sprint } from '@/types/sprint.ts';
import type { WorkItem, WorkItemDetails } from '@/types/workItem.ts';
import { buildMetricsDashboard } from '@/utils/metrics/buildMetricsDashboard.ts';
import { isCompletedWorkItemState } from '@/utils/metrics/classify.ts';
import {
  isDateInRange,
  parseUtcDate,
  resolveMetricPeriodRange,
  startOfUtcMonth,
} from '@/utils/metrics/period.ts';
import { readVdmObjective } from '@/utils/metrics/vdm.ts';
import { findSprint } from '@/utils/sprint.ts';
import { isAssignedToUser } from '@/utils/sumAssignedStoryPoints.ts';

export const MOCK_METRICS_NOW = new Date('2026-10-06T12:00:00.000Z');
export const MOCK_PULL_REQUEST_COUNT = 3;

export interface MockAzureDevOpsOptions {
  delayMs?: number;
  currentUser?: Developer;
  pipelines?: PipelineRun[];
  currentSprint?: Sprint;
  sprints?: Sprint[];
  workItems?: WorkItem[];
  failSprints?: boolean;
  detailsById?: Record<number, WorkItemDetails>;
  failCurrentUser?: boolean;
  failPipelines?: boolean;
  failCurrentSprint?: boolean;
  failWorkItems?: boolean;
  failWorkItemDetails?: boolean;
  failCreateDeployCard?: boolean;
  failListDeployCards?: boolean;
  failAttachTasksToDeployCard?: boolean;
  failMetrics?: boolean;
  pullRequestCount?: number;
  failPullRequests?: boolean;
}

function matchesSprint(item: WorkItem, sprint: Sprint | undefined, sprintId?: string): boolean {
  if (sprintId && (item.iterationPath === sprintId || item.iterationPath.includes(sprintId))) {
    return true;
  }

  if (!sprint) {
    return false;
  }

  return (
    item.iterationPath === sprint.path ||
    item.iterationPath.endsWith(sprint.name) ||
    item.iterationPath === sprint.id ||
    item.iterationPath.includes(sprint.id)
  );
}

function wait(delayMs: number): Promise<void> {
  if (delayMs <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    window.setTimeout(resolve, delayMs);
  });
}

export function createMockAzureDevOpsService(
  options: MockAzureDevOpsOptions = {},
): AzureDevOpsService {
  const delayMs = options.delayMs ?? 400;
  const currentUser = options.currentUser ?? mockDeveloper;
  const pipelines = options.pipelines ?? mockPipelines;
  const currentSprint = options.currentSprint ?? mockSprint;
  const sprints = options.sprints ?? mockSprints;
  let workItems = [...(options.workItems ?? mockWorkItems)];
  let deployCards: DeployCardSummary[] = [
    {
      id: 88888,
      title: 'Deploy Sprint 42 (mock)',
      url: 'https://dev.azure.com/mock/project/_workitems/edit/88888',
      state: 'Active',
      iterationPath: currentSprint.path,
    },
  ];
  let nextDeployCardId = 99999;

  return {
    async getCurrentUser() {
      await wait(delayMs);

      if (options.failCurrentUser) {
        throw new AzureDevOpsError('Não foi possível identificar o usuário atual.');
      }

      return currentUser;
    },

    async getUserPipelines() {
      await wait(delayMs);

      if (options.failPipelines) {
        throw new AzureDevOpsError('Não foi possível carregar as pipelines.');
      }

      return pipelines;
    },

    async getCurrentSprint() {
      await wait(delayMs);

      if (options.failCurrentSprint) {
        throw new AzureDevOpsError('Não foi possível identificar a Sprint atual.');
      }

      return currentSprint;
    },

    async getSprints() {
      await wait(delayMs);

      if (options.failSprints) {
        throw new AzureDevOpsError('Não foi possível carregar as Sprints.');
      }

      return sprints;
    },

    async getUserWorkItems(sprintId, userId, queryOptions) {
      await wait(delayMs);

      if (options.failWorkItems) {
        throw new AzureDevOpsError(
          'Não foi possível carregar os itens de trabalho da Sprint.',
        );
      }

      const sprintIds = (Array.isArray(sprintId) ? sprintId : [sprintId]).filter(
        (id) => id.length > 0,
      );

      if (
        sprintIds.length === 0 ||
        (!queryOptions?.leadMode && userId.length === 0)
      ) {
        return [];
      }

      const sprintItems = workItems.filter((item) =>
        sprintIds.some((id) => matchesSprint(item, findSprint(sprints, id), id)),
      );

      if (queryOptions?.leadMode) {
        return sprintItems;
      }

      const assignedToCurrentUser = sprintItems.filter(
        (item) =>
          item.assignedTo === currentUser.displayName ||
          item.assignedTo === currentUser.id,
      );

      return assignedToCurrentUser.length > 0 ? assignedToCurrentUser : sprintItems;
    },

    async getWorkItemDetails(id) {
      await wait(delayMs);

      if (options.failWorkItemDetails) {
        throw new AzureDevOpsError(
          'Não foi possível carregar os detalhes do work item.',
        );
      }

      const predefined = options.detailsById?.[id];
      if (predefined) {
        return predefined;
      }

      const workItem = workItems.find((item) => item.id === id);
      if (!workItem) {
        throw new AzureDevOpsError(`Item de trabalho #${String(id)} não encontrado.`);
      }

      return toWorkItemDetails(workItem, currentSprint.name);
    },

    async getMetrics(query) {
      await wait(delayMs);

      if (options.failMetrics) {
        throw new AzureDevOpsError('Não foi possível carregar as métricas.');
      }

      const sprint =
        findSprint(sprints, query.sprintId) ?? currentSprint;
      const range = resolveMetricPeriodRange(query.period, sprint, MOCK_METRICS_NOW);
      const generatedAt = MOCK_METRICS_NOW.toISOString();

      const sprintItems = workItems.filter((item) => matchesSprint(item, sprint));
      const periodItems = workItems.filter((item) => {
        const updated = parseUtcDate(item.updatedAt ?? item.closedAt ?? item.createdAt);
        const completedAt = isCompletedWorkItemState(item.state)
          ? parseUtcDate(item.closedAt ?? item.updatedAt)
          : undefined;

        return (
          isDateInRange(updated, range.start, range.end) ||
          isDateInRange(completedAt, range.start, range.end)
        );
      });

      const scopedPool =
        query.period === 'current-sprint' ? sprintItems : periodItems;
      const items =
        query.scope === 'personal'
          ? scopedPool.filter((item) => isAssignedToUser(item, currentUser))
          : scopedPool;

      return buildMetricsDashboard({
        generatedAt,
        scope: query.scope,
        period: query.period,
        context: {
          organization: 'contoso',
          project: 'portal',
          team: 'devs',
          periodStart:
            query.period === 'current-sprint'
              ? sprint.startDate
              : range.start?.toISOString(),
          periodEnd:
            query.period === 'current-sprint'
              ? sprint.endDate
              : generatedAt,
          sprintId: sprint.id,
          sprintName: sprint.name,
        },
        items,
        user: currentUser,
        vdm: {
          objective: readVdmObjective(),
          closedInMonth: workItems.filter((item) => {
            const closedAt = isCompletedWorkItemState(item.state)
              ? parseUtcDate(item.closedAt ?? item.updatedAt)
              : undefined;
            return (
              isAssignedToUser(item, currentUser) &&
              isDateInRange(closedAt, startOfUtcMonth(MOCK_METRICS_NOW), MOCK_METRICS_NOW)
            );
          }).length,
          monthStart: startOfUtcMonth(MOCK_METRICS_NOW).toISOString(),
        },
        pullRequestCount: options.failPullRequests
          ? undefined
          : (options.pullRequestCount ?? MOCK_PULL_REQUEST_COUNT),
        pipelineCount: options.failPipelines ? undefined : pipelines.length,
        sources: {
          workItems: 'ok',
          pullRequests: options.failPullRequests ? 'error' : 'ok',
          pipelines: options.failPipelines ? 'error' : 'ok',
        },
        errors: [
          ...(options.failPullRequests
            ? [
                {
                  source: 'pullRequests' as const,
                  message: 'Não foi possível carregar as pull requests.',
                },
              ]
            : []),
          ...(options.failPipelines
            ? [
                {
                  source: 'pipelines' as const,
                  message: 'Não foi possível carregar as pipelines.',
                },
              ]
            : []),
        ],
        now: MOCK_METRICS_NOW,
      });
    },

    async createDeployCard(input) {
      await wait(delayMs);

      if (options.failCreateDeployCard) {
        throw new AzureDevOpsError('Não foi possível criar o cartão de deploy.');
      }

      const id = nextDeployCardId;
      nextDeployCardId += 1;
      const card: DeployCardSummary = {
        id,
        title: input.title,
        url: `https://dev.azure.com/mock/project/_workitems/edit/${String(id)}`,
        state: 'New',
        iterationPath: input.iterationPath ?? currentSprint.path,
      };
      deployCards = [card, ...deployCards];

      return card;
    },

    async listDeployCards(sprintId) {
      await wait(delayMs);

      if (options.failListDeployCards) {
        throw new AzureDevOpsError(
          'Não foi possível listar os cartões de deploy.',
        );
      }

      const sprintIds = (Array.isArray(sprintId) ? sprintId : [sprintId]).filter(
        (id) => id.length > 0,
      );
      const fromWorkItems: DeployCardSummary[] = workItems
        .filter((item) =>
          sprintIds.some((id) =>
            matchesSprint(item, findSprint(sprints, id), id),
          ),
        )
        .map((item) => ({
          id: item.id,
          title: item.title,
          url: item.url ?? `https://dev.azure.com/mock/project/_workitems/edit/${String(item.id)}`,
          state: item.state,
          iterationPath: item.iterationPath,
        }));
      const knownIds = new Set(fromWorkItems.map((item) => item.id));
      const fromCreatedCards = deployCards.filter(
        (card) =>
          !knownIds.has(card.id) &&
          sprintIds.some((id) =>
            matchesSprint(
              {
                id: card.id,
                title: card.title,
                type: 'Task',
                state: card.state,
                assignedTo: '',
                boardColumn: '',
                iterationPath: card.iterationPath ?? '',
              },
              findSprint(sprints, id),
              id,
            ),
          ),
      );

      return [...fromWorkItems, ...fromCreatedCards].sort((left, right) =>
        left.title.localeCompare(right.title, 'pt-BR', { sensitivity: 'base' }),
      );
    },

    async attachTasksToDeployCard(deployCardId, input) {
      await wait(delayMs);

      if (options.failAttachTasksToDeployCard) {
        throw new AzureDevOpsError(
          'Não foi possível adicionar as tarefas ao cartão de deploy.',
        );
      }

      const card =
        deployCards.find((entry) => entry.id === deployCardId) ??
        workItems
          .filter((item) => item.id === deployCardId)
          .map((item) => ({
            id: item.id,
            title: item.title,
            url:
              item.url ??
              `https://dev.azure.com/mock/project/_workitems/edit/${String(item.id)}`,
            state: item.state,
            iterationPath: item.iterationPath,
          }))[0];
      if (!card) {
        throw new AzureDevOpsError('Cartão de deploy não encontrado.');
      }

      workItems = workItems.map((item) =>
        input.workItemIds.includes(item.id)
          ? { ...item, state: 'Closed' }
          : item,
      );

      return {
        ...card,
        attachedWorkItemIds: input.workItemIds,
        closedWorkItemIds: input.workItemIds,
      };
    },
  };
}
