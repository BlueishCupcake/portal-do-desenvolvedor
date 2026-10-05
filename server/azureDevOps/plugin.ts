import type { IncomingMessage, ServerResponse } from 'node:http';

import type { Connect, Plugin } from 'vite';

import { loadAzureDevOpsPluginEnv } from './envFiles.ts';
import { handleAzureDevOpsApi } from './handlers.ts';

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export function createAzureDevOpsMiddleware(
  env: Record<string, string | undefined> = process.env,
): Connect.NextHandleFunction {
  return (req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
    const requestUrl = req.url ?? '';
    if (!requestUrl.startsWith('/api/azure-devops')) {
      next();
      return;
    }

    const parsed = new URL(requestUrl, 'http://localhost');
    void handleAzureDevOpsApi(
      req.method ?? 'GET',
      parsed.pathname,
      parsed.searchParams,
      env,
    )
      .then((result) => {
        sendJson(res, result.status, result.body);
      })
      .catch(() => {
        sendJson(res, 500, {
          message: 'Não foi possível comunicar com o Azure DevOps.',
        });
      });
  };
}

export function azureDevOpsApiPlugin(): Plugin {
  const env: Record<string, string | undefined> = loadAzureDevOpsPluginEnv(
    process.cwd(),
  );

  return {
    name: 'azure-devops-api',
    configResolved(config) {
      Object.assign(
        env,
        loadAzureDevOpsPluginEnv(config.envDir || config.root, config.mode, env),
      );
    },
    configureServer(server) {
      server.middlewares.use(createAzureDevOpsMiddleware(env));
    },
    configurePreviewServer(server) {
      server.middlewares.use(createAzureDevOpsMiddleware(env));
    },
  };
}
