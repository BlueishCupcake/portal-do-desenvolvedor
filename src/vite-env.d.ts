/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AZURE_DEVOPS_PROVIDER?: string;
  readonly VITE_AZURE_DEVOPS_ORGANIZATION?: string;
  readonly VITE_AZURE_DEVOPS_PROJECT?: string;
  readonly VITE_AZURE_DEVOPS_TEAM?: string;
  readonly VITE_AZURE_DEVOPS_MCP_URL?: string;
  readonly VITE_AZURE_DEVOPS_MCP_TOOL_CURRENT_USER?: string;
  readonly VITE_AZURE_DEVOPS_MCP_TOOL_CURRENT_SPRINT?: string;
  readonly VITE_AZURE_DEVOPS_MCP_TOOL_USER_WORK_ITEMS?: string;
  readonly VITE_AZURE_DEVOPS_MCP_TOOL_WORK_ITEM_DETAILS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
