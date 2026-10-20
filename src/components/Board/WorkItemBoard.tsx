import { Button, Checkbox } from '@poliedro/tamentai/web';
import { useCallback, useEffect, useMemo, useState } from 'react';

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
  selectedIds?: number[];
  onSelectedIdsChange?: (ids: number[]) => void;
  onSelect: (id: number) => void;
  onCreateDeployCard?: (input: CreateDeployCardInput) => Promise<DeployCard>;
}

export function WorkItemBoard({
  workItems,
  catalog = workItems,
  leadMode = false,
  selectedIds: controlledSelectedIds,
  onSelectedIdsChange,
  onSelect,
  onCreateDeployCard,
}: WorkItemBoardProps) {
  const [internalSelectedIds, setInternalSelectedIds] = useState<number[]>([]);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const selectedIds = controlledSelectedIds ?? internalSelectedIds;
  const visibleIds = useMemo(() => workItems.map((item) => item.id), [workItems]);
  const catalogIds = useMemo(() => catalog.map((item) => item.id), [catalog]);

  const setSelectedIds = useCallback(
    (next: number[]) => {
      if (onSelectedIdsChange) {
        onSelectedIdsChange(next);
        return;
      }

      setInternalSelectedIds(next);
    },
    [onSelectedIdsChange],
  );

  useEffect(() => {
    const next = selectedIds.filter((id) => catalogIds.includes(id));
    if (next.length !== selectedIds.length) {
      setSelectedIds(next);
    }
  }, [catalogIds, selectedIds, setSelectedIds]);

  useEffect(() => {
    if (!leadMode) {
      if (selectedIds.length > 0) {
        setSelectedIds([]);
      }
      setIsRequestOpen(false);
      setIsDeployOpen(false);
    }
  }, [leadMode, selectedIds, setSelectedIds]);

  const selectedItems = catalog.filter((item) => selectedIds.includes(item.id));
  const selectedAssignees = new Set(selectedItems.map((item) => item.assignedTo));
  const sameAssignee = selectedAssignees.size === 1;
  const canCreateDeployCard = selectedItems.length > 0;
  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const someSelected =
    visibleIds.some((id) => selectedIds.includes(id)) && !allSelected;

  function toggleItem(id: number, selected: boolean) {
    if (selected) {
      setSelectedIds(selectedIds.includes(id) ? selectedIds : [...selectedIds, id]);
      return;
    }

    setSelectedIds(selectedIds.filter((itemId) => itemId !== id));
  }

  return (
    <section className={styles.section} aria-label="Itens de trabalho da Sprint">
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
                      setSelectedIds(
                        checked === true
                          ? [...new Set([...selectedIds, ...visibleIds])]
                          : selectedIds.filter((id) => !visibleIds.includes(id)),
                      );
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
                Pontos
              </th>
              <th className={styles.board} scope="col">
                Quadro
              </th>
              <th className={styles.releasePr} scope="col">
                PR de release
              </th>
              <th className={styles.deployed} scope="col">
                Implantado
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
              Solicitar criação de PR
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
              Criar cartão de deploy
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
