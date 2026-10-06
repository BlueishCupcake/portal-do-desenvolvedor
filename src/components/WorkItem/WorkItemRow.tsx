import { Button, Checkbox, Text } from '@poliedro/tamentai/web';

import { BoardStatus } from '@/components/Board/BoardStatus.tsx';
import { BugIndicator } from '@/components/BugIndicator/BugIndicator.tsx';
import { DeployedIndicator } from '@/components/DeployedIndicator/DeployedIndicator.tsx';
import { ReleasePrIndicator } from '@/components/ReleasePrIndicator/ReleasePrIndicator.tsx';
import styles from '@/components/WorkItem/WorkItemRow.module.css';
import type { BugStatus, WorkItem } from '@/types/workItem.ts';

interface WorkItemRowProps {
  workItem: WorkItem;
  bugStatus?: BugStatus;
  leadMode?: boolean;
  selected?: boolean;
  selectDisabled?: boolean;
  onToggleSelect?: (id: number, selected: boolean) => void;
  onSelect: (id: number) => void;
}

export function WorkItemRow({
  workItem,
  bugStatus,
  leadMode = false,
  selected = false,
  selectDisabled = false,
  onToggleSelect,
  onSelect,
}: WorkItemRowProps) {
  return (
    <tr className={styles.row} aria-label={`Work item ${workItem.title}`}>
      {leadMode ? (
        <td className={styles.select}>
          <Checkbox
            checked={selected}
            disabled={selectDisabled}
            aria-label={`Selecionar ${workItem.title}`}
            onCheckedChange={(checked) => {
              onToggleSelect?.(workItem.id, checked === true);
            }}
          />
        </td>
      ) : null}
      <td className={styles.bug}>
        <BugIndicator
          type={workItem.type}
          state={workItem.state}
          status={bugStatus}
        />
      </td>
      <td className={styles.task}>
        <Button
          type="button"
          variant="link"
          color="primary"
          onClick={() => {
            onSelect(workItem.id);
          }}
        >
          {workItem.title}
        </Button>
        <Text variant="caption" color="muted">
          #{workItem.id} · {workItem.type} · {workItem.state}
        </Text>
      </td>
      {leadMode ? (
        <td className={styles.assignee}>{workItem.assignedTo}</td>
      ) : null}
      <td className={styles.points}>
        <span
          aria-label={
            workItem.storyPoints === undefined
              ? 'Sem story points'
              : `Story points: ${String(workItem.storyPoints)}`
          }
        >
          <Text as="span">{workItem.storyPoints ?? '—'}</Text>
        </span>
      </td>
      <td className={styles.board}>
        <BoardStatus column={workItem.boardColumn} />
      </td>
      <td className={styles.releasePr}>
        <ReleasePrIndicator created={workItem.releasePrCreated} />
      </td>
      <td className={styles.deployed}>
        <DeployedIndicator deployed={workItem.deployed} />
      </td>
    </tr>
  );
}
