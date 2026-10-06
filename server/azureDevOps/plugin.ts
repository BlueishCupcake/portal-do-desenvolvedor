import type { IncomingMessage, ServerResponse } from 'node:http';

import type { Connect, Plugin } from 'vite';

import { loadAzureDevOpsPluginEnv } from './envFiles.ts';
import { handleAzureDevOpsApi } from './handlers.ts';

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const body = Buffer.concat(chunks).toString('utf8');
  return body ? (JSON.parse(body) as unknown) : undefined;
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
    void (async () =>
      handleAzureDevOpsApi(
        req.method ?? 'GET',
        parsed.pathname,
        parsed.searchParams,
        env,
        req.method === 'POST' ? await readJsonBody(req) : undefined,
      ))()
      .then((result) => {
        sendJson(res, result.status, result.body);
      })
      .catch((error: unknown) => {
        sendJson(res, error instanceof SyntaxError ? 400 : 500, {
          message:
            error instanceof SyntaxError
              ? 'O corpo da requisição contém JSON inválido.'
              : 'Não foi possível comunicar com o Azure DevOps.',
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
