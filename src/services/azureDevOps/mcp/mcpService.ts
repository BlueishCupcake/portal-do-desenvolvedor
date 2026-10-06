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
import type {
  AzureDevOpsContext,
  AzureDevOpsMcpToolMap,
  AzureDevOpsService,
  McpTransport,
} from '@/services/azureDevOps/types.ts';
import { AzureDevOpsError } from '@/services/azureDevOps/types.ts';
import { isJsonObject, type JsonValue } from '@/utils/json.ts';

export interface McpAzureDevOpsServiceOptions {
  transport: McpTransport;
  tools: AzureDevOpsMcpToolMap;
  context: AzureDevOpsContext;
}

export function createMcpAzureDevOpsService(
  options: McpAzureDevOpsServiceOptions,
): AzureDevOpsService {
  const { transport, tools, context } = options;

  async function invokeTool(
    tool: string,
    args?: Record<string, string | number | boolean>,
  ): Promise<JsonValue> {
    try {
      return await transport.invoke(tool, {
        organization: context.organization,
        project: context.project,
        team: context.team,
        ...args,
      });
    } catch (error) {
      if (error instanceof AzureDevOpsError) {
        throw error;
      }

      if (error instanceof Error) {
        throw new AzureDevOpsError(error.message);
      }

      throw new AzureDevOpsError(
        'Não foi possível comunicar com o Azure DevOps através do MCP.',
      );
    }
  }

  return {
    async getCurrentUser() {
      const payload = await invokeTool(tools.getCurrentUser);
      return mapAzureDeveloper(parseAzureDeveloper(payload));
    },

    async getUserPipelines() {
      return parsePipelineRunList(await invokeTool(tools.getUserPipelines));
    },

    async getCurrentSprint() {
      const payload = await invokeTool(tools.getCurrentSprint, {
        timeFrame: 'current',
      });

      if (isJsonObject(payload) && Array.isArray(payload.value)) {
        const current = payload.value[0];
        if (!current) {
          throw new AzureDevOpsError('Não foi possível identificar a Sprint atual.');
        }
        return mapAzureSprint(parseAzureSprint(current));
      }

      return mapAzureSprint(parseAzureSprint(payload));
    },

    async getSprints() {
      const payload = await invokeTool(tools.getSprints);
      return parseAzureSprintList(payload).map((sprint) => mapAzureSprint(sprint));
    },

    async getUserWorkItems(sprintId, userId, options) {
      const payload = await invokeTool(tools.getUserWorkItems, {
        sprintId,
        userId,
        leadMode: options?.leadMode === true,
      });

      return parseAzureWorkItemList(payload).map((item) => mapAzureWorkItem(item));
    },

    async getWorkItemDetails(id) {
      const payload = await invokeTool(tools.getWorkItemDetails, { id });
      const workItem = parseAzureWorkItem(payload);
      const sprintName =
        workItem.fields['System.IterationLevel3'] ??
        workItem.fields['System.IterationPath'].split('\\').at(-1) ??
        workItem.fields['System.IterationPath'];

      return mapAzureWorkItemDetails(workItem, sprintName);
    },
  };
}
