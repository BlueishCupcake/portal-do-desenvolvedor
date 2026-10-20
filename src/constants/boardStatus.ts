import type { BoardStatusKey } from '@/types/board.ts';

export const boardStatusConfig: Record<
  BoardStatusKey,
  {
    label: string;
    token: string;
  }
> = {
  development: {
    label: 'Ag. Desenvolvimento',
    token: 'development',
  },
  qa: {
    label: 'Ag. QA',
    token: 'qa',
  },
  deploy: {
    label: 'Ag. Deploy',
    token: 'deploy',
  },
  doing: {
    label: 'Em andamento',
    token: 'doing',
  },
  done: {
    label: 'Concluído',
    token: 'done',
  },
  blocked: {
    label: 'Bloqueado',
    token: 'blocked',
  },
  default: {
    label: 'Quadro',
    token: 'default',
  },
};
