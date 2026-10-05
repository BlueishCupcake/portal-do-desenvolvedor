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
    label: 'Doing',
    token: 'doing',
  },
  done: {
    label: 'Done',
    token: 'done',
  },
  blocked: {
    label: 'Blocked',
    token: 'blocked',
  },
  default: {
    label: 'Board',
    token: 'default',
  },
};
