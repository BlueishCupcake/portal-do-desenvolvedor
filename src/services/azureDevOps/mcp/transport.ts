import type { McpTransport } from '@/services/azureDevOps/types.ts';
import { AzureDevOpsError } from '@/services/azureDevOps/types.ts';
import { isJsonObject, type JsonValue } from '@/utils/json.ts';

async function readJsonValue(response: Response): Promise<JsonValue> {
  const payload: JsonValue = await response.json();
  return payload;
}

export function createHttpMcpTransport(baseUrl: string): McpTransport {
  return {
    async invoke(tool, args) {
      if (baseUrl.length === 0) {
        throw new AzureDevOpsError(
          'A URL do MCP do Azure DevOps não foi configurada.',
        );
      }

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tool,
          arguments: args ?? {},
        }),
      });

      if (!response.ok) {
        throw new AzureDevOpsError(
          `Não foi possível executar a ferramenta MCP "${tool}".`,
        );
      }

      const payload = await readJsonValue(response);

      if (isJsonObject(payload) && 'result' in payload) {
        return payload.result;
      }

      return payload;
    },
  };
}
