import { describe, expect, it } from 'vitest';

import type { PipelineRun } from '@/types/pipeline.ts';
import {
  detectPipelineEvents,
  pipelineResultLabel,
} from '@/utils/pipelineNotifications.ts';

function run(overrides: Partial<PipelineRun> = {}): PipelineRun {
  return {
    id: 1,
    name: 'ui',
    buildNumber: '20261006.1',
    status: 'inProgress',
    requestedFor: 'Sophie',
    queueTime: '2026-10-06T14:00:00Z',
    url: 'https://dev.azure.com/build/1',
    ...overrides,
  };
}

describe('pipeline notifications', () => {
  it('detects new running pipelines', () => {
    expect(detectPipelineEvents(new Map(), [run()])).toMatchObject([
      { type: 'started', run: { id: 1 } },
    ]);
  });

  it('detects pipeline completion and its result label', () => {
    const previous = new Map([[1, run()]]);
    const completed = run({ status: 'completed', result: 'failed' });

    expect(detectPipelineEvents(previous, [completed])).toMatchObject([
      { type: 'finished', run: { id: 1, result: 'failed' } },
    ]);
    expect(pipelineResultLabel(completed)).toBe('com falha');
  });

  it('does not emit events when status is unchanged', () => {
    const current = run();
    expect(detectPipelineEvents(new Map([[1, current]]), [current])).toEqual([]);
  });
});
