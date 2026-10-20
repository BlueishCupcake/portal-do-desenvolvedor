import { Badge, type BadgeColor } from '@poliedro/tamentai/web';

import type { BoardStatusKey } from '@/types/board.ts';
import { resolveBoardStatus, resolveBoardStatusKey } from '@/utils/resolveBoardStatus.ts';

interface BoardStatusProps {
  column: string;
  blocked?: boolean;
}

const STATUS_COLORS: Record<BoardStatusKey, BadgeColor> = {
  development: 'yellow',
  qa: 'blue',
  deploy: 'yellow',
  doing: 'green',
  done: 'green',
  blocked: 'red',
  default: 'gray',
};

export function BoardStatus({ column, blocked = false }: BoardStatusProps) {
  const key = blocked ? 'blocked' : resolveBoardStatusKey(column);
  const status = blocked
    ? { key: 'blocked' as const, token: 'blocked' }
    : resolveBoardStatus(column);
  const color = STATUS_COLORS[key];

  return (
    <Badge
      className="tag"
      variant="soft"
      color={color}
      size="sm"
      shape="pilled"
      data-tag="board"
      data-status={status.token}
      title={blocked ? `Bloqueado · ${column}` : column}
    >
      {blocked ? 'Bloqueado' : column}
    </Badge>
  );
}
