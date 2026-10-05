import { describe, expect, it } from 'vitest';

import { createWorkItem } from '@/test/factories/workItem.ts';
import { buildPrRequestMessage } from '@/utils/prRequestMessage.ts';

describe('buildPrRequestMessage', () => {
  it('builds a professional Portuguese request with tasks and links', () => {
    const message = buildPrRequestMessage([
      createWorkItem({
        id: 10,
        title: 'Ajustar retorno da API',
        assignedTo: 'Sophie Quines',
        url: 'https://dev.azure.com/item/10',
      }),
      createWorkItem({
        id: 11,
        title: 'Corrigir validação',
        assignedTo: 'Alex Santos',
        url: undefined,
      }),
    ]);

    expect(message).toContain('Olá,');
    expect(message).toContain('criação das pull requests de release');
    expect(message).toContain('#10 — Ajustar retorno da API');
    expect(message).toContain('Responsável: Sophie Quines');
    expect(message).toContain('https://dev.azure.com/item/10');
    expect(message).toContain('Responsável: Alex Santos');
    expect(message).toContain('Obrigado.');
  });
});
