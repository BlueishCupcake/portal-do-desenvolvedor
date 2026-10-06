import type { PipelineRun } from '@/types/pipeline.ts';

export interface PipelineNotificationEvent {
  type: 'started' | 'finished';
  run: PipelineRun;
}

function isRunning(run: PipelineRun): boolean {
  return run.status === 'notStarted' || run.status === 'inProgress';
}

export function detectPipelineEvents(
  previousRuns: ReadonlyMap<number, PipelineRun>,
  currentRuns: readonly PipelineRun[],
): PipelineNotificationEvent[] {
  const events: PipelineNotificationEvent[] = [];

  for (const run of currentRuns) {
    const previous = previousRuns.get(run.id);

    if (!previous) {
      if (isRunning(run)) {
        events.push({ type: 'started', run });
      }

      if (run.status === 'completed') {
        events.push({ type: 'finished', run });
      }

      continue;
    }

    if (!isRunning(previous) && isRunning(run)) {
      events.push({ type: 'started', run });
    }

    if (previous.status !== 'completed' && run.status === 'completed') {
      events.push({ type: 'finished', run });
    }
  }

  return events;
}

export function pipelineResultLabel(run: PipelineRun): string {
  switch (run.result) {
    case 'succeeded':
      return 'com sucesso';
    case 'partiallySucceeded':
      return 'com sucesso parcial';
    case 'failed':
      return 'com falha';
    case 'canceled':
      return 'cancelada';
    default:
      return 'concluída';
  }
}
