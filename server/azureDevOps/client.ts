import type { AzureDevOpsServerConfig } from './config.ts';

const API_VERSION = '7.1';

export interface AzureDevOpsRequestOptions {
  method?: 'GET' | 'POST';
  body?: string;
  contentType?: string;
}

export function createAzureAuthHeader(pat: string): string {
  return `Basic ${Buffer.from(`:${pat}`).toString('base64')}`;
}

export function encodeSegment(value: string): string {
  return encodeURIComponent(value);
}

export function escapeWiqlValue(value: string): string {
  return value.replaceAll("'", "''");
}

export async function azureDevOpsRequest(
  config: AzureDevOpsServerConfig,
  path: string,
  options: AzureDevOpsRequestOptions = {},
): Promise<unknown> {
  const url = path.startsWith('https://')
    ? path
    : `https://dev.azure.com/${encodeSegment(config.organization)}${path}`;

  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: createAzureAuthHeader(config.pat),
      'Content-Type': options.contentType ?? 'application/json',
    },
    body: options.body,
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message = readAzureErrorMessage(payload, response.status);
    throw new Error(message);
  }

  return payload;
}

export function readAzureErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = payload.message;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }

  if (status === 401 || status === 403) {
    return 'Não foi possível autenticar no Azure DevOps. Verifique o PAT.';
  }

  return `O Azure DevOps retornou o status ${String(status)}.`;
}

export function withApiVersion(path: string, apiVersion = API_VERSION): string {
  return path.includes('?')
    ? `${path}&api-version=${apiVersion}`
    : `${path}?api-version=${apiVersion}`;
}
