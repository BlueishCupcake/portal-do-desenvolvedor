import { Badge } from '@poliedro/tamentai/web';

import type { BugStatus, WorkItemType } from '@/types/workItem.ts';
import { resolveBugStatus } from '@/utils/resolveBugStatus.ts';

interface BugIndicatorProps {
  type: WorkItemType;
  state?: string;
  status?: BugStatus;
}

export function BugIndicator({ type, state, status }: BugIndicatorProps) {
  const resolvedStatus = status ?? resolveBugStatus({ type, state: state ?? '' });

  if (resolvedStatus === 'fixed') {
    return (
      <Badge
        className="tag"
        variant="soft"
        color="green"
        size="sm"
        shape="pilled"
        data-tag="fixed"
        title="Bugs fixed"
        aria-label="Bugs fixed"
      >
        Bugs fixed
      </Badge>
    );
  }

  if (resolvedStatus === 'open') {
    return (
      <Badge
        className="tag"
        variant="soft"
        color="red"
        size="sm"
        shape="pilled"
        data-tag="bug"
        title="Bug"
        aria-label="Bug"
      >
        BUG
      </Badge>
    );
  }

  return (
    <span aria-label="Sem alerta de bug">
      —
    </span>
  );
}
