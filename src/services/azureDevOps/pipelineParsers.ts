import type {
  PipelineRun,
  PipelineRunResult,
  PipelineRunStatus,
} from '@/types/pipeline.ts';
import {
  isJsonObject,
  type JsonObject,
  type JsonValue,
  readArrayField,
  readNumberField,
  readObjectField,
  readStringField,
} from '@/utils/json.ts';

const statuses: PipelineRunStatus[] = [
  'notStarted',
  'inProgress',
  'cancelling',
  'postponed',
  'completed',
  'none',
];

const results: PipelineRunResult[] = [
  'succeeded',
  'partiallySucceeded',
  'failed',
  'canceled',
  'none',
];

function readEnum<T extends string>(
  source: JsonObject,
  key: string,
  values: readonly T[],
): T | undefined {
  const value = readStringField(source, key);
  return value && values.includes(value as T) ? (value as T) : undefined;
}

export function parsePipelineRun(payload: JsonValue): PipelineRun {
  if (!isJsonObject(payload)) {
    throw new Error('Pipeline inválida retornada pelo Azure DevOps.');
  }

  const definition = readObjectField(payload, 'definition');
  const requestedFor = readObjectField(payload, 'requestedFor');
  const links = readObjectField(payload, '_links');
  const webLink = links ? readObjectField(links, 'web') : undefined;
  const id = readNumberField(payload, 'id');
  const name = definition ? readStringField(definition, 'name') : undefined;
  const buildNumber = readStringField(payload, 'buildNumber');
  const status = readEnum(payload, 'status', statuses);
  const queueTime = readStringField(payload, 'queueTime');
  const url =
    (webLink ? readStringField(webLink, 'href') : undefined) ??
    readStringField(payload, 'url');

  if (
    id === undefined ||
    !name ||
    !buildNumber ||
    !status ||
    !queueTime ||
    !url
  ) {
    throw new Error('Pipeline inválida retornada pelo Azure DevOps.');
  }

  return {
    id,
    name,
    buildNumber,
    status,
    result: readEnum(payload, 'result', results),
    requestedFor: requestedFor
      ? readStringField(requestedFor, 'displayName') ?? 'Usuário desconhecido'
      : 'Usuário desconhecido',
    sourceBranch: readStringField(payload, 'sourceBranch'),
    queueTime,
    startTime: readStringField(payload, 'startTime'),
    finishTime: readStringField(payload, 'finishTime'),
    url,
  };
}

export function parsePipelineRunList(payload: JsonValue): PipelineRun[] {
  const values = Array.isArray(payload)
    ? payload
    : isJsonObject(payload)
      ? readArrayField(payload, 'value')
      : undefined;

  if (!values) {
    throw new Error('Lista de pipelines inválida.');
  }

  return values.map(parsePipelineRun);
}
