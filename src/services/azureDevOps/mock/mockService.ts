import {
  mockDeveloper,
  mockPipelines,
  mockSprint,
  mockSprints,
  mockWorkItems,
  toWorkItemDetails,
} from '@/services/azureDevOps/mock/mockData.ts';
import { findSprint } from '@/utils/sprint.ts';
import type { AzureDevOpsService } from '@/services/azureDevOps/types.ts';
import { AzureDevOpsError } from '@/services/azureDevOps/types.ts';
import type { Developer } from '@/types/developer.ts';
import type { PipelineRun } from '@/types/pipeline.ts';
import type { Sprint } from '@/types/sprint.ts';
import type { WorkItem, WorkItemDetails } from '@/types/workItem.ts';

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

      if (sprintId.length === 0 || (!queryOptions?.leadMode && userId.length === 0)) {
        return [];
      }

      const sprint = findSprint(sprints, sprintId);
      const sprintItems = workItems.filter((item) => {
        if (
          item.iterationPath === sprintId ||
          item.iterationPath.includes(sprintId)
        ) {
          return true;
        }

        if (!sprint) {
          return false;
        }

        return (
          item.iterationPath === sprint.path ||
          item.iterationPath.endsWith(sprint.name)
        );
      });

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
  };
}
