import { describe, expect, it } from 'vitest';

import { createWorkItem } from '@/test/factories/workItem.ts';
import { buildDeployCardDescription } from '@/utils/deployCardDescription.ts';

describe('buildDeployCardDescription', () => {
  it('groups applications, pull requests and selected work items', () => {
    const feature = createWorkItem({
      id: 100591,
      type: 'Feature',
      title: '[Versionamento] Suporte a versões',
      url: 'https://dev.azure.com/items/100591',
    });
    const firstTask = createWorkItem({
      id: 61407,
      title: 'Ajustar retornos da API',
      assignedTo: 'Alex',
      relatedIds: [feature.id],
      pullRequests: [
        {
          id: 125389,
          repositoryName: 'api',
          projectName: 'novo-banco-questoes',
          targetBranch: 'refs/heads/feature/61407',
          status: 'completed',
        },
        {
          id: 125417,
          repositoryName: 'api',
          projectName: 'novo-banco-questoes',
          targetBranch: 'refs/heads/main',
          status: 'completed',
          url: 'https://dev.azure.com/pullrequest/125417',
        },
      ],
    });
    const secondTask = createWorkItem({
      id: 103810,
      type: 'User Story',
      title: 'Implementar Batch-Versioning-Service',
      assignedTo: 'Sophie',
      url: 'https://dev.azure.com/items/103810',
      pullRequests: [
        {
          id: 124308,
          repositoryName: 'batch-versioning-service',
          projectName: 'lote-banco-questoes',
          targetBranch: 'refs/heads/Main',
          status: 'completed',
          url: 'https://dev.azure.com/pullrequest/124308',
        },
      ],
    });

    expect(
      buildDeployCardDescription(
        [firstTask, secondTask],
        [firstTask, secondTask, feature],
      ),
    ).toBe(`Aplicações afetadas:
api / novo-banco-questoes
batch-versioning-service / lote-banco-questoes

Pull Requests:
api / novo-banco-questoes
(feature/61407) (!125389)
[(main) (!125417)](https://dev.azure.com/pullrequest/125417)
batch-versioning-service / lote-banco-questoes
[(Main) (!124308)](https://dev.azure.com/pullrequest/124308)

Histórias/Funcionalidades:
[FUNCIONALIDADE 100591: [Versionamento] Suporte a versões](https://dev.azure.com/items/100591)
TAREFA 61407: Ajustar retornos da API
[HISTÓRIA DE USUÁRIO 103810: Implementar Batch-Versioning-Service](https://dev.azure.com/items/103810)`);
  });

  it('explains when selected tasks have no pull requests', () => {
    const item = createWorkItem({ id: 1, title: 'Sem PR' });
    const description = buildDeployCardDescription([item]);

    expect(description).toContain(
      'Nenhuma aplicação identificada nas pull requests concluídas das tarefas.',
    );
    expect(description).toContain(
      'Nenhuma pull request concluída vinculada às tarefas selecionadas.',
    );
    expect(description).toContain('TAREFA 1: Sem PR');
  });
});
