import { describe, expect, it } from 'vitest';

import {
  assertAzureDevOpsServerConfig,
  readAzureDevOpsServerConfig,
} from './config.ts';

describe('azure devops server config', () => {
  it('reads organization, project, team and PAT', () => {
    expect(
      readAzureDevOpsServerConfig({
        VITE_AZURE_DEVOPS_ORGANIZATION: 'contoso',
        VITE_AZURE_DEVOPS_PROJECT: 'portal',
        VITE_AZURE_DEVOPS_TEAM: 'devs',
        AZURE_DEVOPS_PAT: 'secret',
        AZURE_DEVOPS_PIPELINE_PROJECT: 'pipelines',
        AZURE_DEVOPS_PIPELINE_DEFINITION_IDS: '690, 1132,invalid',
      }),
    ).toEqual({
      organization: 'contoso',
      project: 'portal',
      team: 'devs',
      pat: 'secret',
      deployWorkItemType: 'Task',
      pipelineProject: 'pipelines',
      pipelineDefinitionIds: ['690', '1132'],
    });
  });

  it('prefers server-side organization variables', () => {
    expect(
      readAzureDevOpsServerConfig({
        AZURE_DEVOPS_ORGANIZATION: 'server-org',
        VITE_AZURE_DEVOPS_ORGANIZATION: 'client-org',
        AZURE_DEVOPS_PROJECT: 'server-project',
        AZURE_DEVOPS_PAT: 'secret',
      }),
    ).toMatchObject({
      organization: 'server-org',
      project: 'server-project',
      pipelineProject: 'server-project',
      pipelineDefinitionIds: [],
    });
  });

  it('rejects incomplete configuration', () => {
    expect(() =>
      assertAzureDevOpsServerConfig(readAzureDevOpsServerConfig({})),
    ).toThrow(/AZURE_DEVOPS_PAT/);
  });
});
