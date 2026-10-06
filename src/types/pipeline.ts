export type PipelineRunStatus =
  | 'notStarted'
  | 'inProgress'
  | 'cancelling'
  | 'postponed'
  | 'completed'
  | 'none';

export type PipelineRunResult =
  | 'succeeded'
  | 'partiallySucceeded'
  | 'failed'
  | 'canceled'
  | 'none';

export interface PipelineRun {
  id: number;
  name: string;
  buildNumber: string;
  status: PipelineRunStatus;
  result?: PipelineRunResult;
  requestedFor: string;
  sourceBranch?: string;
  queueTime: string;
  startTime?: string;
  finishTime?: string;
  url: string;
}
