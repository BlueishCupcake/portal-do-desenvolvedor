import { describe, expect, it } from 'vitest';

import {
  parsePipelineRun,
  parsePipelineRunList,
} from '@/services/azureDevOps/pipelineParsers.ts';

const run = {
  id: 501,
  buildNumber: '20261006.4',
  status: 'completed',
  result: 'succeeded',
  definition: { name: 'portal-ci' },
  requestedFor: { displayName: 'Sophie Quines' },
  sourceBranch: 'refs/heads/main',
  queueTime: '2026-10-06T14:00:00Z',
  finishTime: '2026-10-06T14:05:00Z',
  _links: {
    web: {
      href: 'https://dev.azure.com/contoso/portal/_build/results?buildId=501',
    },
  },
};

describe('pipeline parsers', () => {
  it('maps an Azure build into a pipeline run', () => {
    expect(parsePipelineRun(run)).toMatchObject({
      id: 501,
      name: 'portal-ci',
      buildNumber: '20261006.4',
      status: 'completed',
      result: 'succeeded',
      requestedFor: 'Sophie Quines',
      sourceBranch: 'refs/heads/main',
    });
  });

  it('parses wrapped and array lists', () => {
    expect(parsePipelineRunList({ value: [run] })).toHaveLength(1);
    expect(parsePipelineRunList([run])).toHaveLength(1);
  });

  it('rejects malformed runs and lists', () => {
    expect(() => parsePipelineRun({ id: 1 })).toThrow(/Pipeline inválida/);
    expect(() => parsePipelineRunList({})).toThrow(/Lista de pipelines inválida/);
  });
});
