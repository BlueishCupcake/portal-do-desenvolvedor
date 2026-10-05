import { Drawer, Links, Text, TitleV2 } from '@poliedro/tamentai/web';

import { BoardStatus } from '@/components/Board/BoardStatus.tsx';
import { DeployedIndicator } from '@/components/DeployedIndicator/DeployedIndicator.tsx';
import { ReleasePrIndicator } from '@/components/ReleasePrIndicator/ReleasePrIndicator.tsx';
import { ErrorState } from '@/components/ErrorState/ErrorState.tsx';
import { DashboardSkeleton } from '@/components/Loading/DashboardSkeleton.tsx';
import styles from '@/components/WorkItemDetails/WorkItemDetails.module.css';
import type { WorkItemDetails as WorkItemDetailsModel } from '@/types/workItem.ts';
import { formatDate } from '@/utils/formatDate.ts';

interface WorkItemDetailsProps {
  isOpen: boolean;
  details: WorkItemDetailsModel | null;
  isLoading: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onRetry: () => void;
}

export function WorkItemDetails({
  isOpen,
  details,
  isLoading,
  errorMessage,
  onClose,
  onRetry,
}: WorkItemDetailsProps) {
  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      title={details?.title ?? 'Detalhes do work item'}
      size="md"
      position="right"
      closeButtonLabel="Fechar"
      footer={
        details?.url ? (
          <Links href={details.url} target="_blank" rel="noreferrer" endIcon="ExternalLink">
            Abrir no Azure DevOps
          </Links>
        ) : null
      }
    >
      {isLoading ? <DashboardSkeleton compact /> : null}
      {errorMessage ? (
        <ErrorState
          title="Não foi possível carregar os detalhes"
          message={errorMessage}
          onRetry={onRetry}
        />
      ) : null}
      {details && !isLoading && !errorMessage ? (
        <div className={styles.content}>
          <dl className={styles.list}>
            <div>
              <dt>
                <Text variant="caption" color="muted">
                  ID
                </Text>
              </dt>
              <dd>#{details.id}</dd>
            </div>
            <div>
              <dt>
                <Text variant="caption" color="muted">
                  Tipo
                </Text>
              </dt>
              <dd>{details.type}</dd>
            </div>
            <div>
              <dt>
                <Text variant="caption" color="muted">
                  Responsável
                </Text>
              </dt>
              <dd>{details.assignedTo}</dd>
            </div>
            <div>
              <dt>
                <Text variant="caption" color="muted">
                  Sprint
                </Text>
              </dt>
              <dd>{details.sprintName}</dd>
            </div>
            <div>
              <dt>
                <Text variant="caption" color="muted">
                  Status
                </Text>
              </dt>
              <dd>{details.state}</dd>
            </div>
            <div>
              <dt>
                <Text variant="caption" color="muted">
                  Board
                </Text>
              </dt>
              <dd>
                <BoardStatus column={details.boardColumn} />
              </dd>
            </div>
            <div>
              <dt>
                <Text variant="caption" color="muted">
                  Release PR
                </Text>
              </dt>
              <dd>
                <ReleasePrIndicator created={details.releasePrCreated} />
              </dd>
            </div>
            <div>
              <dt>
                <Text variant="caption" color="muted">
                  Deployed
                </Text>
              </dt>
              <dd>
                <DeployedIndicator deployed={details.deployed} />
              </dd>
            </div>
            <div>
              <dt>
                <Text variant="caption" color="muted">
                  Criado em
                </Text>
              </dt>
              <dd>{details.createdAt ? formatDate(details.createdAt) : '—'}</dd>
            </div>
            <div>
              <dt>
                <Text variant="caption" color="muted">
                  Atualizado em
                </Text>
              </dt>
              <dd>{details.updatedAt ? formatDate(details.updatedAt) : '—'}</dd>
            </div>
          </dl>
          <section>
            <TitleV2 variant="h4">Descrição</TitleV2>
            <Text color="muted">
              {details.description ?? 'Nenhuma descrição disponível.'}
            </Text>
          </section>
        </div>
      ) : null}
    </Drawer>
  );
}
