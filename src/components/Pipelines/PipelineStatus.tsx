import { Badge } from '@poliedro/tamentai/web';

import type { PipelineRun } from '@/types/pipeline.ts';

interface PipelineStatusProps {
  run: PipelineRun;
}

const labels = {
  notStarted: 'Na fila',
  inProgress: 'Em execução',
  cancelling: 'Cancelando',
  postponed: 'Adiada',
  completed: 'Concluída',
  none: 'Sem status',
  succeeded: 'Sucesso',
  partiallySucceeded: 'Sucesso parcial',
  failed: 'Falhou',
  canceled: 'Cancelada',
} as const;

export function PipelineStatus({ run }: PipelineStatusProps) {
  const value = run.status === 'completed' && run.result ? run.result : run.status;
  const color =
    value === 'succeeded'
      ? 'green'
      : value === 'failed'
        ? 'red'
        : value === 'inProgress' || value === 'notStarted'
          ? 'blue'
          : value === 'partiallySucceeded'
            ? 'yellow'
            : 'gray';
  const label = labels[value];

  return (
    <Badge
      className="tag"
      variant="soft"
      color={color}
      size="sm"
      shape="pilled"
      title={`Pipeline: ${label}`}
      aria-label={`Pipeline: ${label}`}
    >
      {label}
    </Badge>
  );
}
