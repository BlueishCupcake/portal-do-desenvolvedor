import { describe, expect, it, vi } from 'vitest';

import { createHttpMcpTransport } from '@/services/azureDevOps/mcp/transport.ts';
import { AzureDevOpsError } from '@/services/azureDevOps/types.ts';

describe('createHttpMcpTransport', () => {
  it('throws when the MCP url is empty', async () => {
    const transport = createHttpMcpTransport('');

    await expect(transport.invoke('get_current_user')).rejects.toThrow(/URL do MCP/);
  });

  it('posts the tool call and unwraps result', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: { displayName: 'Sophie' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const transport = createHttpMcpTransport('https://mcp.local');
    await expect(transport.invoke('get_current_user', { id: 1 })).resolves.toEqual({
      displayName: 'Sophie',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://mcp.local',
      expect.objectContaining({ method: 'POST' }),
    );

    vi.unstubAllGlobals();
  });

  it('returns a raw payload and fails on http errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ displayName: 'Sophie' }),
      }),
    );

    const transport = createHttpMcpTransport('https://mcp.local');
    await expect(transport.invoke('get_current_user')).resolves.toEqual({
      displayName: 'Sophie',
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({}),
      }),
    );

    await expect(transport.invoke('get_current_user')).rejects.toBeInstanceOf(
      AzureDevOpsError,
    );
    vi.unstubAllGlobals();
  });
});
