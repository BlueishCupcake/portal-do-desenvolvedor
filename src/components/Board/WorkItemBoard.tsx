import { useEffect, useMemo, useState } from 'react';

import { Button, Checkbox } from '@poliedro/tamentai/web';

import styles from '@/components/Board/WorkItemBoard.module.css';
import { PrRequestDialog } from '@/components/PrRequestDialog/PrRequestDialog.tsx';
import { WorkItemRow } from '@/components/WorkItem/WorkItemRow.tsx';
import type { WorkItem } from '@/types/workItem.ts';
import { resolveBugStatus } from '@/utils/resolveBugStatus.ts';

interface WorkItemBoardProps {
  workItems: WorkItem[];
  catalog?: WorkItem[];
  leadMode?: boolean;
  onSelect: (id: number) => void;
}

export function WorkItemBoard({
  workItems,
  catalog = workItems,
  leadMode = false,
  onSelect,
}: WorkItemBoardProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const visibleIds = useMemo(
    () => workItems.map((item) => item.id),
    [workItems],
  );

  useEffect(() => {
    setSelectedIds((current) => {
      const next = current.filter((id) => visibleIds.includes(id));
      return next.length === current.length ? current : next;
    });
  }, [visibleIds]);

  useEffect(() => {
    if (!leadMode) {
      setSelectedIds([]);
      setIsRequestOpen(false);
    }
  }, [leadMode]);

  const selectedItems = workItems.filter((item) => selectedIds.includes(item.id));
  const selectedAssignee = selectedItems[0]?.assignedTo;
  const assigneeItems = selectedAssignee
    ? workItems.filter((item) => item.assignedTo === selectedAssignee)
    : [];
  const assigneeIds = assigneeItems.map((item) => item.id);
  const allSelected =
    assigneeIds.length > 0 && assigneeIds.every((id) => selectedIds.includes(id));
  const someSelected = selectedIds.length > 0 && !allSelected;

  function toggleItem(id: number, selected: boolean) {
    const item = workItems.find((workItem) => workItem.id === id);

    if (
      selected &&
      selectedAssignee &&
      item &&
      item.assignedTo !== selectedAssignee
    ) {
      return;
    }

    setSelectedIds((current) => {
      if (selected) {
        return current.includes(id) ? current : [...current, id];
      }

      return current.filter((itemId) => itemId !== id);
    });
  }

  return (
    <section className={styles.section} aria-label="Work items da Sprint">
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {leadMode ? (
                <th className={styles.select} scope="col">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    disabled={!selectedAssignee}
                    aria-label={
                      selectedAssignee
                        ? `Selecionar todas as tarefas de ${selectedAssignee}`
                        : 'Selecione uma tarefa para marcar todas do mesmo responsável'
                    }
                    onCheckedChange={(checked) => {
                      setSelectedIds(checked === true ? assigneeIds : []);
                    }}
                  />
                </th>
              ) : null}
              <th className={styles.bug} scope="col">
                BUG
              </th>
              <th scope="col">Tarefa</th>
              {leadMode ? <th scope="col">Responsável</th> : null}
              <th className={styles.board} scope="col">
                Board
              </th>
              <th className={styles.releasePr} scope="col">
                Release PR
              </th>
              <th className={styles.deployed} scope="col">
                Deployed
              </th>
            </tr>
          </thead>
          <tbody>
            {workItems.map((workItem) => (
              <WorkItemRow
                key={workItem.id}
                workItem={workItem}
                bugStatus={resolveBugStatus(workItem, catalog)}
                leadMode={leadMode}
                selected={selectedIds.includes(workItem.id)}
                selectDisabled={
                  Boolean(selectedAssignee) &&
                  workItem.assignedTo !== selectedAssignee
                }
                onToggleSelect={toggleItem}
                onSelect={onSelect}
              />
            ))}
          </tbody>
        </table>
      </div>
      {leadMode && selectedItems.length > 0 ? (
        <div className={styles.actions}>
          <Button
            type="button"
            color="primary"
            onClick={() => {
              setIsRequestOpen(true);
            }}
          >
            Request PR creation
          </Button>
        </div>
      ) : null}
      <PrRequestDialog
        open={isRequestOpen}
        workItems={selectedItems}
        onClose={() => {
          setIsRequestOpen(false);
        }}
      />
    </section>
  );
}
