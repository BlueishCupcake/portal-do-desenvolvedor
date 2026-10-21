import { Button, Dialog, Links, Text } from '@poliedro/tamentai/web';
import { useEffect, useMemo, useState } from 'react';

import styles from '@/components/AddToDeployCardDialog/AddToDeployCardDialog.module.css';
import type {
  AttachTasksToDeployCardInput,
  AttachTasksToDeployCardResult,
  DeployCardSummary,
} from '@/types/deployCard.ts';
import type { WorkItem } from '@/types/workItem.ts';
import { buildDeployCardDescription } from '@/utils/deployCardDescription.ts';
import { unifiedDeployWorkItems } from '@/utils/deployCardUnifiedWorkItems.ts';

interface AddToDeployCardDialogProps {
  open: boolean;
  workItems: WorkItem[];
  catalog: WorkItem[];
  deployCards: DeployCardSummary[];
  isLoadingDeployCards: boolean;
  deployCardsError: string | null;
  onLoadDeployCardRelatedIds: (deployCardId: number) => Promise<number[]>;
  onAttach: (
    deployCardId: number,
    input: AttachTasksToDeployCardInput,
  ) => Promise<AttachTasksToDeployCardResult>;
  onClose: () => void;
  onAttached: () => void;
}

export function AddToDeployCardDialog({
  open,
  workItems,
  catalog,
  deployCards,
  isLoadingDeployCards,
  deployCardsError,
  onLoadDeployCardRelatedIds,
  onAttach,
  onClose,
  onAttached,
}: AddToDeployCardDialogProps) {
  const [selectedDeployCardId, setSelectedDeployCardId] = useState('');
  const [relatedIds, setRelatedIds] = useState<number[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [isAttaching, setIsAttaching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<AttachTasksToDeployCardResult | null>(
    null,
  );

  const unifiedItems = useMemo(
    () => unifiedDeployWorkItems(workItems, catalog, relatedIds),
    [catalog, relatedIds, workItems],
  );
  const description = useMemo(
    () => buildDeployCardDescription(unifiedItems, catalog),
    [catalog, unifiedItems],
  );

  useEffect(() => {
    if (!open) {
      setSelectedDeployCardId('');
      setRelatedIds([]);
      setErrorMessage(null);
      setResult(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || selectedDeployCardId.length === 0) {
      setRelatedIds([]);
      return;
    }

    const deployCardId = Number(selectedDeployCardId);
    if (!Number.isInteger(deployCardId)) {
      return;
    }

    let cancelled = false;
    setIsLoadingRelated(true);
    setErrorMessage(null);

    void onLoadDeployCardRelatedIds(deployCardId)
      .then((ids) => {
        if (!cancelled) {
          setRelatedIds(ids);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setRelatedIds([]);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar o cartão de deploy selecionado.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingRelated(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [onLoadDeployCardRelatedIds, open, selectedDeployCardId]);

  const listMessage = deployCardsError
    ? deployCardsError
    : isLoadingDeployCards
      ? 'Carregando cartões de deploy...'
      : deployCards.length === 0
        ? 'Nenhum item de trabalho nesta Sprint.'
        : null;

  const canAttach =
    selectedDeployCardId.length > 0 &&
    !isLoadingDeployCards &&
    !isLoadingRelated &&
    !deployCardsError &&
    deployCards.length > 0;

  async function attachTasks() {
    const deployCardId = Number(selectedDeployCardId);
    if (!Number.isInteger(deployCardId)) {
      setErrorMessage('Selecione um cartão de deploy.');
      return;
    }

    setIsAttaching(true);
    setErrorMessage(null);

    try {
      const attachResult = await onAttach(deployCardId, {
        description,
        workItemIds: workItems.map((item) => item.id),
      });
      setResult(attachResult);
      onAttached();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível adicionar as tarefas ao cartão de deploy.',
      );
    } finally {
      setIsAttaching(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Adicionar tarefas a um card de deploy"
      aria-label="Adicionar tarefas a um card de deploy"
      size="lg"
      closeButtonLabel="Fechar"
      footer={
        <div className={styles.footer}>
          <Button
            type="button"
            variant="outline"
            color="secondary"
            onClick={onClose}
          >
            {result ? 'Concluir' : 'Cancelar'}
          </Button>
          {!result ? (
            <Button
              type="button"
              color="primary"
              disabled={!canAttach || isAttaching}
              onClick={() => void attachTasks()}
            >
              {isAttaching ? 'Adicionando...' : 'Adicionar ao cartão'}
            </Button>
          ) : null}
        </div>
      }
    >
      <div className={styles.content}>
        {result ? (
          <>
            <Text>Tarefas adicionadas ao cartão de deploy com sucesso.</Text>
            <Links href={result.url} target="_blank" rel="noreferrer">
              Abrir #{result.id} — {result.title}
            </Links>
          </>
        ) : (
          <>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="deploy-card-select">
                Cartão de deploy
              </label>
              <select
                id="deploy-card-select"
                className={styles.select}
                value={selectedDeployCardId}
                disabled={isLoadingDeployCards || deployCards.length === 0}
                onChange={(event) => {
                  setSelectedDeployCardId(event.target.value);
                }}
              >
                <option value="">Selecione um cartão</option>
                {deployCards.map((card) => (
                  <option key={card.id} value={String(card.id)}>
                    #{card.id} — {card.title}
                  </option>
                ))}
              </select>
              {listMessage ? (
                <Text>
                  <span role="status">{listMessage}</span>
                </Text>
              ) : null}
            </div>
            <div>
              <Text as="span">Tarefas selecionadas</Text>
              <ul className={styles.taskList}>
                {workItems.map((item) => (
                  <li key={item.id}>
                    #{item.id} — {item.title}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <Text as="span">Descrição que será aplicada ao cartão</Text>
              <pre className={styles.preview}>
                {isLoadingRelated
                  ? 'Carregando vínculos do cartão...'
                  : description}
              </pre>
            </div>
            {errorMessage ? (
              <Text>
                <span role="alert" className={styles.error}>
                  {errorMessage}
                </span>
              </Text>
            ) : null}
          </>
        )}
      </div>
    </Dialog>
  );
}
