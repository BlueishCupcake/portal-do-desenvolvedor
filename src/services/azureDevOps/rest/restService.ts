import { mapAzureDeveloper } from '@/mappers/azureDevOps/mapDeveloper.ts';
import { mapAzureSprint } from '@/mappers/azureDevOps/mapSprint.ts';
import {
  mapAzureWorkItem,
  mapAzureWorkItemDetails,
} from '@/mappers/azureDevOps/mapWorkItem.ts';
import { parseMetricsDashboard } from '@/services/azureDevOps/metricsParser.ts';
import {
  parseAzureDeveloper,
  parseAzureSprint,
  parseAzureSprintList,
  parseAzureWorkItem,
  parseAzureWorkItemList,
} from '@/services/azureDevOps/parsers.ts';
import { parsePipelineRunList } from '@/services/azureDevOps/pipelineParsers.ts';
import type { AzureDevOpsService } from '@/services/azureDevOps/types.ts';
import { AzureDevOpsError } from '@/services/azureDevOps/types.ts';
import type {
  AttachTasksToDeployCardResult,
  DeployCard,
  DeployCardSummary,
} from '@/types/deployCard.ts';
import {
  isJsonObject,
  type JsonValue,
  readNumberField,
  readObjectField,
  readStringField,
} from '@/utils/json.ts';
import { readVdmObjective } from '@/utils/metrics/vdm.ts';

export const AZURE_DEVOPS_API_BASE = '/api/azure-devops';

async function readApi(path: string): Promise<JsonValue> {
  const response = await fetch(`${AZURE_DEVOPS_API_BASE}${path}`);
  const payload: JsonValue = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      isJsonObject(payload) && typeof payload.message === 'string'
        ? payload.message
        : 'Não foi possível comunicar com o Azure DevOps.';
    throw new AzureDevOpsError(message);
  }

  return payload;
}

async function writeApi(path: string, input: unknown): Promise<JsonValue> {
  const response = await fetch(`${AZURE_DEVOPS_API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const payload: JsonValue = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      isJsonObject(payload) && typeof payload.message === 'string'
        ? payload.message
        : 'Não foi possível concluir a operação no cartão de deploy.';
    throw new AzureDevOpsError(message);
  }

  return payload;
}

function parseDeployCard(payload: JsonValue): DeployCard {
  if (!isJsonObject(payload)) {
    throw new AzureDevOpsError('Cartão de deploy inválido.');
  }

  const id = readNumberField(payload, 'id');
  const fields = readObjectField(payload, 'fields');
  const title = fields ? readStringField(fields, 'System.Title') : undefined;
  const url = readStringField(payload, 'url');

  if (id === undefined || !title || !url) {
    throw new AzureDevOpsError('Cartão de deploy criado sem id, título ou URL.');
  }

  return { id, title, url };
}

function parseDeployCardSummary(payload: JsonValue): DeployCardSummary {
  if (!isJsonObject(payload)) {
    throw new AzureDevOpsError('Cartão de deploy inválido.');
  }

  const id = readNumberField(payload, 'id');
  const title = readStringField(payload, 'title');
  const url = readStringField(payload, 'url');
  const state = readStringField(payload, 'state');
  const iterationPath = readStringField(payload, 'iterationPath');

  if (id === undefined || !title || !url || !state) {
    throw new AzureDevOpsError('Cartão de deploy inválido.');
  }

  return { id, title, url, state, iterationPath };
}

function parseDeployCardList(payload: JsonValue): DeployCardSummary[] {
  if (!isJsonObject(payload) || !Array.isArray(payload.value)) {
    throw new AzureDevOpsError('Lista de cartões de deploy inválida.');
  }

  return payload.value.map((entry) => parseDeployCardSummary(entry));
}

function parseAttachResult(payload: JsonValue): AttachTasksToDeployCardResult {
  if (!isJsonObject(payload)) {
    throw new AzureDevOpsError('Resposta de anexação inválida.');
  }

  const card = parseDeployCardSummary(payload);
  const attachedWorkItemIds = Array.isArray(payload.attachedWorkItemIds)
    ? payload.attachedWorkItemIds.filter(
        (id): id is number => typeof id === 'number',
      )
    : [];
  const closedWorkItemIds = Array.isArray(payload.closedWorkItemIds)
    ? payload.closedWorkItemIds.filter(
        (id): id is number => typeof id === 'number',
      )
    : [];

  return {
    ...card,
    attachedWorkItemIds,
    closedWorkItemIds,
  };
}

export function createRestAzureDevOpsService(): AzureDevOpsService {
  return {
    async getCurrentUser() {
      return mapAzureDeveloper(parseAzureDeveloper(await readApi('/me')));
    },

    async getUserPipelines() {
      return parsePipelineRunList(await readApi('/pipelines'));
    },

    async getCurrentSprint() {
      return mapAzureSprint(parseAzureSprint(await readApi('/sprint/current')));
    },

    async getSprints() {
      return parseAzureSprintList(await readApi('/sprints')).map((sprint) =>
        mapAzureSprint(sprint),
      );
    },

    async getUserWorkItems(sprintId, userId, options) {
      const sprintIds = Array.isArray(sprintId) ? sprintId : [sprintId];
      const query = new URLSearchParams({ userId });
      for (const id of sprintIds) {
        query.append('sprintId', id);
      }
      if (options?.leadMode) {
        query.set('leadMode', 'true');
      }
      const payload = await readApi(`/work-items?${query.toString()}`);
      return parseAzureWorkItemList(payload).map((item) => mapAzureWorkItem(item));
    },

    async getWorkItemDetails(id) {
      const workItem = parseAzureWorkItem(
        await readApi(`/work-items/${String(id)}`),
      );
      const sprintName =
        workItem.fields['System.IterationLevel3'] ??
        workItem.fields['System.IterationPath'].split('\\').at(-1) ??
        workItem.fields['System.IterationPath'];

      return mapAzureWorkItemDetails(workItem, sprintName);
    },

    async getMetrics(query) {
      const params = new URLSearchParams({
        scope: query.scope,
        period: query.period,
      });
      if (query.sprintId) {
        params.set('sprintId', query.sprintId);
      }

      const payload = await readApi(`/metrics?${params.toString()}`);
      return parseMetricsDashboard(payload, {
        scope: query.scope,
        period: query.period,
        vdmObjective: readVdmObjective(),
      });
    },

    async createDeployCard(input) {
      return parseDeployCard(await writeApi('/deploy-cards', input));
    },

    async listDeployCards(sprintId) {
      const sprintIds = Array.isArray(sprintId) ? sprintId : [sprintId];
      const params = new URLSearchParams();
      for (const id of sprintIds) {
        params.append('sprintId', id);
      }
      return parseDeployCardList(
        await readApi(`/deploy-cards?${params.toString()}`),
      );
    },

    async attachTasksToDeployCard(deployCardId, input) {
      return parseAttachResult(
        await writeApi(`/deploy-cards/${String(deployCardId)}/tasks`, input),
      );
    },
  };
}
