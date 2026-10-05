import type { WorkItem } from '@/types/workItem.ts';

export function buildPrRequestMessage(workItems: readonly WorkItem[]): string {
  const tasks = workItems
    .map((item) => {
      const link = item.url ?? `Work item #${String(item.id)}`;
      return `- #${String(item.id)} — ${item.title}\n  Responsável: ${item.assignedTo}\n  Link: ${link}`;
    })
    .join('\n\n');

  return [
    'Olá,',
    '',
    'Gostaria de solicitar a criação das pull requests de release para as tarefas abaixo.',
    '',
    tasks,
    '',
    'Fico à disposição para qualquer alinhamento.',
    '',
    'Obrigado.',
  ].join('\n');
}
