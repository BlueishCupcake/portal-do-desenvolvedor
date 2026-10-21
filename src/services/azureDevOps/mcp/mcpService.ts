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
import { buildMetricsDashboard } from '@/utils/metrics/buildMetricsDashboard.ts';
import { dedupeWorkItems } from '@/utils/metrics/classify.ts';
import { sprintValue } from '@/utils/sprint.ts';

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
      const sprintIds = Array.isArray(sprintId) ? sprintId : [sprintId];
      const batches = await Promise.all(
        sprintIds.map(async (id) => {
          const payload = await invokeTool(tools.getUserWorkItems, {
            sprintId: id,
            userId,
            leadMode: options?.leadMode === true,
          });
          return parseAzureWorkItemList(payload).map((item) => mapAzureWorkItem(item));
        }),
      );

      return dedupeWorkItems(batches.flat());
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

    async getMetrics(query) {
      const user = await this.getCurrentUser();
      const sprint = await this.getCurrentSprint();
      const sprints = query.period === 'current-sprint' ? [sprint] : await this.getSprints();
      const batches = await Promise.all(
        sprints.map((item) =>
          this.getUserWorkItems(query.sprintId ?? sprintValue(item), user.id, {
            leadMode: query.scope !== 'personal',
          }),
        ),
      );

      let pipelineCount: number | undefined;
      let pipelineState: 'ok' | 'error' | 'unavailable' = 'unavailable';
      const errors: Array<{ source: 'pipelines'; message: string }> = [];

      if (query.scope === 'personal') {
        try {
          pipelineCount = (await this.getUserPipelines()).length;
          pipelineState = 'ok';
        } catch (error) {
          pipelineState = 'error';
          errors.push({
            source: 'pipelines',
            message:
              error instanceof Error
                ? error.message
                : 'Não foi possível carregar as pipelines.',
          });
        }
      }

      return buildMetricsDashboard({
        generatedAt: new Date().toISOString(),
        scope: query.scope,
        period: query.period,
        context: {
          organization: context.organization,
          project: context.project,
          team: context.team,
          periodStart: sprint.startDate,
          periodEnd: sprint.endDate,
          sprintId: query.sprintId ?? sprintValue(sprint),
          sprintName: sprint.name,
          permissionNote:
            'O provider MCP calcula métricas a partir das ferramentas já existentes. Pull requests e Analytics ficam indisponíveis.',
        },
        items: dedupeWorkItems(batches.flat()),
        user,
        pipelineCount,
        sources: {
          workItems: 'ok',
          pullRequests: 'unavailable',
          pipelines: pipelineState,
        },
        errors: [
          {
            source: 'pullRequests',
            message: 'O provider MCP não consulta a API de pull requests.',
          },
          ...errors,
        ],
      });
    },

    async createDeployCard() {
      throw new AzureDevOpsError(
        'A criação de cartão de deploy requer o provider REST e um PAT com Work Items (Read & write).',
      );
    },

    async listDeployCards() {
      throw new AzureDevOpsError(
        'A listagem de cartões de deploy requer o provider REST e um PAT com Work Items (Read).',
      );
    },

    async attachTasksToDeployCard() {
      throw new AzureDevOpsError(
        'Anexar tarefas a um cartão de deploy requer o provider REST e um PAT com Work Items (Read & write).',
      );
    },
  };
}
