import { mapAzureDeveloper } from '@/mappers/azureDevOps/mapDeveloper.ts';
import { mapAzureSprint } from '@/mappers/azureDevOps/mapSprint.ts';
import {
  mapAzureWorkItem,
  mapAzureWorkItemDetails,
} from '@/mappers/azureDevOps/mapWorkItem.ts';
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
import type { CreateDeployCardInput, DeployCard } from '@/types/deployCard.ts';
import {
  isJsonObject,
  type JsonValue,
  readNumberField,
  readObjectField,
  readStringField,
} from '@/utils/json.ts';

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

async function writeApi(
  path: string,
  input: CreateDeployCardInput,
): Promise<JsonValue> {
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
        : 'Não foi possível criar o cartão de deploy.';
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
      const query = new URLSearchParams({ sprintId, userId });
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

    async createDeployCard(input) {
      return parseDeployCard(await writeApi('/deploy-cards', input));
    },
  };
}
