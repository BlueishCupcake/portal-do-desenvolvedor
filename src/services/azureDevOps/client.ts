import { createMcpAzureDevOpsService } from '@/services/azureDevOps/mcp/mcpService.ts';
import { createHttpMcpTransport } from '@/services/azureDevOps/mcp/transport.ts';
import { createMockAzureDevOpsService } from '@/services/azureDevOps/mock/mockService.ts';
import { createRestAzureDevOpsService } from '@/services/azureDevOps/rest/restService.ts';
import type {
  AzureDevOpsContext,
  AzureDevOpsMcpToolMap,
  AzureDevOpsService,
  McpTransport,
} from '@/services/azureDevOps/types.ts';
import { readEnv } from '@/utils/env.ts';

export const DEFAULT_MCP_TOOLS: AzureDevOpsMcpToolMap = {
  getCurrentUser: 'get_current_user',
  getCurrentSprint: 'get_current_sprint',
  getSprints: 'get_sprints',
  getUserWorkItems: 'get_user_work_items',
  getWorkItemDetails: 'get_work_item_details',
};

export interface AzureDevOpsClientConfig {
  provider: string;
  mcpUrl: string;
  tools: AzureDevOpsMcpToolMap;
  context: AzureDevOpsContext;
}

export function createAzureDevOpsServiceFromConfig(
  config: AzureDevOpsClientConfig,
  transport?: McpTransport,
): AzureDevOpsService {
  if (config.provider === 'mcp') {
    return createMcpAzureDevOpsService({
      transport: transport ?? createHttpMcpTransport(config.mcpUrl),
      tools: config.tools,
      context: config.context,
    });
  }

  if (config.provider === 'rest') {
    return createRestAzureDevOpsService();
  }

  return createMockAzureDevOpsService();
}

export function createAzureDevOpsService(): AzureDevOpsService {
  return createAzureDevOpsServiceFromConfig({
    provider: readEnv('VITE_AZURE_DEVOPS_PROVIDER', 'mock'),
    mcpUrl: readEnv('VITE_AZURE_DEVOPS_MCP_URL'),
    tools: {
      getCurrentUser: readEnv(
        'VITE_AZURE_DEVOPS_MCP_TOOL_CURRENT_USER',
        DEFAULT_MCP_TOOLS.getCurrentUser,
      ),
      getCurrentSprint: readEnv(
        'VITE_AZURE_DEVOPS_MCP_TOOL_CURRENT_SPRINT',
        DEFAULT_MCP_TOOLS.getCurrentSprint,
      ),
      getSprints: readEnv(
        'VITE_AZURE_DEVOPS_MCP_TOOL_SPRINTS',
        DEFAULT_MCP_TOOLS.getSprints,
      ),
      getUserWorkItems: readEnv(
        'VITE_AZURE_DEVOPS_MCP_TOOL_USER_WORK_ITEMS',
        DEFAULT_MCP_TOOLS.getUserWorkItems,
      ),
      getWorkItemDetails: readEnv(
        'VITE_AZURE_DEVOPS_MCP_TOOL_WORK_ITEM_DETAILS',
        DEFAULT_MCP_TOOLS.getWorkItemDetails,
      ),
    },
    context: {
      organization: readEnv('VITE_AZURE_DEVOPS_ORGANIZATION'),
      project: readEnv('VITE_AZURE_DEVOPS_PROJECT'),
      team: readEnv('VITE_AZURE_DEVOPS_TEAM'),
    },
  });
}
