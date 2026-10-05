import { Badge, type BadgeColor } from '@poliedro/tamentai/web';

import type { BoardStatusKey } from '@/types/board.ts';
import { resolveBoardStatus, resolveBoardStatusKey } from '@/utils/resolveBoardStatus.ts';

interface BoardStatusProps {
  column: string;
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

export function BoardStatus({ column }: BoardStatusProps) {
  const status = resolveBoardStatus(column);
  const color = STATUS_COLORS[resolveBoardStatusKey(column)];

  return (
    <Badge
      className="tag"
      variant="soft"
      color={color}
      size="sm"
      shape="pilled"
      data-tag="board"
      data-status={status.token}
    >
      {column}
    </Badge>
  );
}
