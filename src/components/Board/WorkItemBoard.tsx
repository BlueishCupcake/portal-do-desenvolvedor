import { Button, Checkbox } from '@poliedro/tamentai/web';
import { useEffect, useMemo, useState } from 'react';

import styles from '@/components/Board/WorkItemBoard.module.css';
import { DeployCardDialog } from '@/components/DeployCardDialog/DeployCardDialog.tsx';
import { PrRequestDialog } from '@/components/PrRequestDialog/PrRequestDialog.tsx';
import { WorkItemRow } from '@/components/WorkItem/WorkItemRow.tsx';
import type { CreateDeployCardInput, DeployCard } from '@/types/deployCard.ts';
import type { WorkItem } from '@/types/workItem.ts';
import { resolveBugStatus } from '@/utils/resolveBugStatus.ts';

interface WorkItemBoardProps {
  workItems: WorkItem[];
  catalog?: WorkItem[];
  leadMode?: boolean;
  onSelect: (id: number) => void;
  onCreateDeployCard?: (input: CreateDeployCardInput) => Promise<DeployCard>;
}

export function WorkItemBoard({
  workItems,
  catalog = workItems,
  leadMode = false,
  onSelect,
  onCreateDeployCard,
}: WorkItemBoardProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const visibleIds = useMemo(() => workItems.map((item) => item.id), [workItems]);

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
      setIsDeployOpen(false);
    }
  }, [leadMode]);

  const selectedItems = workItems.filter((item) => selectedIds.includes(item.id));
  const selectedAssignees = new Set(selectedItems.map((item) => item.assignedTo));
  const sameAssignee = selectedAssignees.size === 1;
  const canCreateDeployCard = selectedItems.length > 0;
  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const someSelected = selectedIds.length > 0 && !allSelected;

  function toggleItem(id: number, selected: boolean) {
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
                    disabled={visibleIds.length === 0}
                    aria-label="Selecionar todas as tarefas visíveis"
                    onCheckedChange={(checked) => {
                      setSelectedIds(checked === true ? visibleIds : []);
                    }}
                  />
                </th>
              ) : null}
              <th className={styles.bug} scope="col">
                BUG
              </th>
              <th scope="col">Tarefa</th>
              {leadMode ? <th scope="col">Responsável</th> : null}
              <th className={styles.points} scope="col">
                Points
              </th>
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
                selectDisabled={false}
                onToggleSelect={toggleItem}
                onSelect={onSelect}
              />
            ))}
          </tbody>
        </table>
      </div>
      {leadMode && selectedItems.length > 0 ? (
        <div className={styles.actions}>
          {sameAssignee ? (
            <Button
              type="button"
              color="primary"
              onClick={() => {
                setIsRequestOpen(true);
              }}
            >
              Request PR creation
            </Button>
          ) : null}
          {canCreateDeployCard ? (
            <Button
              type="button"
              color="primary"
              onClick={() => {
                setIsDeployOpen(true);
              }}
            >
              Create deploy card
            </Button>
          ) : null}
        </div>
      ) : null}
      <PrRequestDialog
        open={isRequestOpen}
        workItems={selectedItems}
        onClose={() => {
          setIsRequestOpen(false);
        }}
      />
      <DeployCardDialog
        open={isDeployOpen}
        workItems={selectedItems}
        catalog={catalog}
        onCreate={
          onCreateDeployCard ??
          (() =>
            Promise.reject(
              new Error('A criação do cartão de deploy não está configurada.'),
            ))
        }
        onClose={() => {
          setIsDeployOpen(false);
        }}
        onCreated={() => {
          setSelectedIds([]);
        }}
      />
    </section>
  );
}
