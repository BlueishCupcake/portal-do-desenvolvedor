import { Button, Links, Spinner, Text, TitleV2 } from '@poliedro/tamentai/web';

import { EmptyState } from '@/components/EmptyState/EmptyState.tsx';
import { ErrorState } from '@/components/ErrorState/ErrorState.tsx';
import styles from '@/components/Pipelines/PipelinesBoard.module.css';
import { PipelineStatus } from '@/components/Pipelines/PipelineStatus.tsx';
import type { PipelineRun } from '@/types/pipeline.ts';

interface PipelinesBoardProps {
  runs: PipelineRun[];
  isLoading: boolean;
  errorMessage: string | null;
  notifications: {
    supported: boolean;
    enabled: boolean;
    permission: NotificationPermission;
    requestPermission: () => Promise<void>;
    disable: () => void;
  };
  onRetry: () => void;
}

function formatRunDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function formatBranch(branch?: string): string {
  return branch?.replace(/^refs\/heads\//, '') ?? '—';
}

export function PipelinesBoard({
  runs,
  isLoading,
  errorMessage,
  notifications,
  onRetry,
}: PipelinesBoardProps) {
  return (
    <section className={styles.section} aria-label="Pipelines do usuário">
      <div className={styles.heading}>
        <div>
          <TitleV2 variant="h2">Pipelines</TitleV2>
          <Text color="muted">Execuções solicitadas em seu nome</Text>
        </div>
        <div className={styles.notifications}>
          {notifications.supported ? (
            <Button
              type="button"
              color="secondary"
              variant={notifications.enabled ? 'solid' : 'outline'}
              disabled={
                !notifications.enabled && notifications.permission === 'denied'
              }
              onClick={() => {
                if (notifications.enabled) {
                  notifications.disable();
                } else {
                  void notifications.requestPermission();
                }
              }}
            >
              {notifications.enabled
                ? 'Desativar notificações'
                : notifications.permission === 'denied'
                  ? 'Notificações bloqueadas'
                  : 'Ativar notificações'}
            </Button>
          ) : (
            <Text color="muted">Notificações não suportadas neste navegador</Text>
          )}
          {notifications.permission === 'denied' && notifications.supported ? (
            <Text variant="caption" color="muted">
              Libere as notificações nas configurações do navegador.
            </Text>
          ) : null}
        </div>
      </div>

      {isLoading ? (
        <div role="status" aria-label="Carregando pipelines">
          <Spinner label="Carregando pipelines..." showLabel />
        </div>
      ) : null}

      {errorMessage ? (
        <ErrorState
          title="Não foi possível carregar suas pipelines"
          message={errorMessage}
          onRetry={onRetry}
        />
      ) : null}

      {!isLoading && !errorMessage && runs.length === 0 ? (
        <EmptyState
          title="Nenhuma pipeline encontrada"
          message="Não há execuções recentes solicitadas em seu nome."
        />
      ) : null}

      {!isLoading && !errorMessage && runs.length > 0 ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Pipeline</th>
                <th className={styles.status} scope="col">
                  Status
                </th>
                <th scope="col">Branch</th>
                <th className={styles.time} scope="col">
                  Solicitada em
                </th>
                <th scope="col">Solicitada para</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id}>
                  <td>
                    <div className={styles.pipeline}>
                      <Links href={run.url} target="_blank" rel="noreferrer">
                        {run.name}
                      </Links>
                      <Text variant="caption" color="muted">
                        #{run.buildNumber}
                      </Text>
                    </div>
                  </td>
                  <td>
                    <PipelineStatus run={run} />
                  </td>
                  <td className={styles.branch} title={formatBranch(run.sourceBranch)}>
                    {formatBranch(run.sourceBranch)}
                  </td>
                  <td className={styles.time}>{formatRunDate(run.queueTime)}</td>
                  <td>{run.requestedFor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
