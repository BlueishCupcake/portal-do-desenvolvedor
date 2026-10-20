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
  const workItems = options.workItems ?? mockWorkItems;

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
          'Não foi possível carregar os work items da Sprint.',
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
        throw new AzureDevOpsError(`Work item #${String(id)} não encontrado.`);
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

      return {
        id: 99999,
        title: input.title,
        url: 'https://dev.azure.com/mock/project/_workitems/edit/99999',
      };
    },
  };
}
