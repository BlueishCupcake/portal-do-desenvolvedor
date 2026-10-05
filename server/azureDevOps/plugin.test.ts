import { EventEmitter } from 'node:events';

import { describe, expect, it, vi } from 'vitest';

import { azureDevOpsApiPlugin, createAzureDevOpsMiddleware } from './plugin.ts';

describe('azure devops vite plugin', () => {
  it('exposes server and preview middleware', () => {
    const plugin = azureDevOpsApiPlugin();
    const use = vi.fn();

    const server = { middlewares: { use } };

    if (typeof plugin.configureServer === 'function') {
      plugin.configureServer(server as never);
    }

    if (typeof plugin.configurePreviewServer === 'function') {
      plugin.configurePreviewServer(server as never);
    }

    expect(use).toHaveBeenCalledTimes(2);
    expect(plugin.name).toBe('azure-devops-api');
  });

  it('ignores non-api routes and answers api routes', async () => {
    const middleware = createAzureDevOpsMiddleware({});
    const next = vi.fn();
    middleware({ url: '/health' }, {}, next);
    expect(next).toHaveBeenCalledTimes(1);

    const res = new EventEmitter() as EventEmitter & {
      statusCode: number;
      setHeader: ReturnType<typeof vi.fn>;
      end: ReturnType<typeof vi.fn>;
    };
    res.setHeader = vi.fn();
    res.end = vi.fn();

    middleware({ url: '/api/azure-devops/unknown', method: 'GET' }, res, next);

    await vi.waitFor(() => {
      expect(res.end).toHaveBeenCalled();
    });
    expect(res.statusCode).toBe(503);
  });
});
