export interface AzureDevOpsServerConfig {
  organization: string;
  project: string;
  team: string;
  pat: string;
  pipelineProject: string;
  pipelineDefinitionIds: string[];
}

function readValue(
  env: Record<string, string | undefined>,
  names: string[],
): string {
  for (const name of names) {
    const value = env[name];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return '';
}

export function readAzureDevOpsServerConfig(
  env: Record<string, string | undefined> = process.env,
): AzureDevOpsServerConfig {
  const organization = readValue(env, [
    'AZURE_DEVOPS_ORGANIZATION',
    'VITE_AZURE_DEVOPS_ORGANIZATION',
  ]);
  const project = readValue(env, [
    'AZURE_DEVOPS_PROJECT',
    'VITE_AZURE_DEVOPS_PROJECT',
  ]);
  const pipelineDefinitions = readValue(env, [
    'AZURE_DEVOPS_PIPELINE_DEFINITION_IDS',
  ]);

  return {
    organization,
    project,
    team: readValue(env, ['AZURE_DEVOPS_TEAM', 'VITE_AZURE_DEVOPS_TEAM']),
    pat: readValue(env, ['AZURE_DEVOPS_PAT']),
    pipelineProject:
      readValue(env, ['AZURE_DEVOPS_PIPELINE_PROJECT']) || project,
    pipelineDefinitionIds: pipelineDefinitions
      .split(',')
      .map((value) => value.trim())
      .filter((value) => /^\d+$/.test(value)),
  };
}

export function assertAzureDevOpsServerConfig(
  config: AzureDevOpsServerConfig,
): AzureDevOpsServerConfig {
  if (!config.organization || !config.project || !config.pat) {
    throw new Error(
      'Configure AZURE_DEVOPS_PAT, VITE_AZURE_DEVOPS_ORGANIZATION e VITE_AZURE_DEVOPS_PROJECT no arquivo .env.',
    );
  }

  return config;
}
