import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { loadAzureDevOpsPluginEnv, readAzureDevOpsEnvFiles } from './envFiles.ts';

describe('azure devops env files', () => {
  it('reads prefixed variables and strips quotes', () => {
    const envDir = mkdtempSync(join(tmpdir(), 'azure-devops-env-'));
    writeFileSync(
      join(envDir, '.env'),
      [
        '# comment',
        'VITE_AZURE_DEVOPS_ORGANIZATION=contoso',
        'VITE_AZURE_DEVOPS_PROJECT="Tribo Inovação"',
        'AZURE_DEVOPS_PAT=secret',
        'UNRELATED=ignore',
      ].join('\n'),
    );

    expect(readAzureDevOpsEnvFiles(envDir)).toEqual({
      VITE_AZURE_DEVOPS_ORGANIZATION: 'contoso',
      VITE_AZURE_DEVOPS_PROJECT: 'Tribo Inovação',
      AZURE_DEVOPS_PAT: 'secret',
    });
  });

  it('lets already defined environment values win', () => {
    const envDir = mkdtempSync(join(tmpdir(), 'azure-devops-env-'));
    writeFileSync(join(envDir, '.env'), 'AZURE_DEVOPS_PAT=from-file');

    expect(
      loadAzureDevOpsPluginEnv(envDir, 'development', {
        AZURE_DEVOPS_PAT: 'from-process',
      }),
    ).toMatchObject({
      AZURE_DEVOPS_PAT: 'from-process',
    });
  });
});
