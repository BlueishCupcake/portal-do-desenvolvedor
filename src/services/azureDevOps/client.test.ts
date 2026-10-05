import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createAzureDevOpsService,
  createAzureDevOpsServiceFromConfig,
  DEFAULT_MCP_TOOLS,
} from '@/services/azureDevOps/client.ts';

describe('azure devops client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('creates a mock service by default', async () => {
    vi.stubEnv('VITE_AZURE_DEVOPS_PROVIDER', '');
    const service = createAzureDevOpsService();
    const user = await service.getCurrentUser();

    expect(user.displayName).toBe('Sophie Quines');
  });

  it('creates an MCP service when requested', async () => {
    const service = createAzureDevOpsServiceFromConfig(
      {
        provider: 'mcp',
        mcpUrl: '',
        tools: DEFAULT_MCP_TOOLS,
        context: {
          organization: '',
          project: '',
          team: '',
        },
      },
      {
        invoke: async () => ({
          displayName: 'MCP User',
          id: 'mcp-user',
        }),
      },
    );

    await expect(service.getCurrentUser()).resolves.toMatchObject({
      displayName: 'MCP User',
    });
  });

  it('uses the HTTP MCP transport when none is injected', async () => {
    const service = createAzureDevOpsServiceFromConfig({
      provider: 'mcp',
      mcpUrl: '',
      tools: DEFAULT_MCP_TOOLS,
      context: {
        organization: '',
        project: '',
        team: '',
      },
    });

    await expect(service.getCurrentUser()).rejects.toThrow(/URL do MCP/);
  });

  it('creates a REST service when requested', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ displayName: 'REST User', id: 'rest-user' }),
      }),
    );

    const service = createAzureDevOpsServiceFromConfig({
      provider: 'rest',
      mcpUrl: '',
      tools: DEFAULT_MCP_TOOLS,
      context: {
        organization: 'contoso',
        project: 'portal',
        team: 'devs',
      },
    });

    await expect(service.getCurrentUser()).resolves.toMatchObject({
      displayName: 'REST User',
    });
  });
});
