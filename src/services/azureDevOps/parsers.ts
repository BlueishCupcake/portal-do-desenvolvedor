import type {
  AzureIdentity,
  AzureIdentityRef,
  AzureSprint,
  AzureWorkItem,
  AzureWorkItemFields,
} from '@/services/azureDevOps/types.ts';
import { AzureDevOpsError } from '@/services/azureDevOps/types.ts';
import {
  isJsonObject,
  type JsonObject,
  type JsonValue,
  readArrayField,
  readNumberField,
  readObjectField,
  readStringField,
} from '@/utils/json.ts';

function requireString(source: JsonObject, key: string, context: string): string {
  const value = readStringField(source, key);

  if (!value) {
    throw new AzureDevOpsError(`${context}: campo "${key}" ausente.`);
  }

  return value;
}

function readAssignedTo(source: JsonObject): AzureIdentity | string | undefined {
  const value = source['System.AssignedTo'];

  if (typeof value === 'string') {
    return value;
  }

  if (!isJsonObject(value)) {
    return undefined;
  }

  const displayName = readStringField(value, 'displayName');
  if (!displayName) {
    return undefined;
  }

  return {
    displayName,
    uniqueName: readStringField(value, 'uniqueName'),
    id: readStringField(value, 'id'),
  };
}

export function parseAzureWorkItemFields(source: JsonObject): AzureWorkItemFields {
  return {
    'System.Title': requireString(source, 'System.Title', 'Work item'),
    'System.WorkItemType': requireString(source, 'System.WorkItemType', 'Work item'),
    'System.State': requireString(source, 'System.State', 'Work item'),
    'System.AssignedTo': readAssignedTo(source),
    'System.BoardColumn': readStringField(source, 'System.BoardColumn'),
    'System.IterationPath': requireString(
      source,
      'System.IterationPath',
      'Work item',
    ),
    'System.Description': readStringField(source, 'System.Description'),
    'Microsoft.VSTS.Common.Priority': readNumberField(
      source,
      'Microsoft.VSTS.Common.Priority',
    ),
    'System.CreatedDate': readStringField(source, 'System.CreatedDate'),
    'System.ChangedDate': readStringField(source, 'System.ChangedDate'),
    'System.IterationLevel3': readStringField(source, 'System.IterationLevel3'),
  };
}

export function parseAzureWorkItem(payload: JsonValue): AzureWorkItem {
  if (!isJsonObject(payload)) {
    throw new AzureDevOpsError('Work item inválido retornado pelo Azure DevOps.');
  }

  const id = readNumberField(payload, 'id');
  const fields = readObjectField(payload, 'fields');

  if (id === undefined || !fields) {
    throw new AzureDevOpsError('Work item inválido: id ou fields ausente.');
  }

  const links = readObjectField(payload, '_links');
  const html = links ? readObjectField(links, 'html') : undefined;
  const relations = readArrayField(payload, 'relations');

  return {
    id,
    url: html ? readStringField(html, 'href') : readStringField(payload, 'url'),
    fields: parseAzureWorkItemFields(fields),
    relations: relations?.flatMap((item) => {
      if (!isJsonObject(item)) {
        return [];
      }

      const url = readStringField(item, 'url');
      if (
        !url ||
        (!/workItems\/\d+$/i.test(url) && !/PullRequestId\//i.test(url))
      ) {
        return [];
      }

      return [
        {
          rel: readStringField(item, 'rel'),
          url,
        },
      ];
    }),
    deployed: payload.deployed === true,
    releasePrCreated: payload.releasePrCreated === true,
  };
}

export function parseAzureWorkItemList(payload: JsonValue): AzureWorkItem[] {
  if (Array.isArray(payload)) {
    return payload.map((item) => parseAzureWorkItem(item));
  }

  if (!isJsonObject(payload)) {
    throw new AzureDevOpsError('Lista de work items inválida.');
  }

  const values = readArrayField(payload, 'value');
  if (!values) {
    throw new AzureDevOpsError('Lista de work items inválida.');
  }

  return values.map((item) => parseAzureWorkItem(item));
}

export function parseAzureSprintList(payload: JsonValue): AzureSprint[] {
  if (Array.isArray(payload)) {
    return payload.map((item) => parseAzureSprint(item));
  }

  if (!isJsonObject(payload)) {
    throw new AzureDevOpsError('Lista de sprints inválida.');
  }

  const values = readArrayField(payload, 'value');
  if (!values) {
    throw new AzureDevOpsError('Lista de sprints inválida.');
  }

  return values.map((item) => parseAzureSprint(item));
}

export function parseAzureSprint(payload: JsonValue): AzureSprint {
  if (!isJsonObject(payload)) {
    throw new AzureDevOpsError('Sprint inválida retornada pelo Azure DevOps.');
  }

  const attributes = readObjectField(payload, 'attributes') ?? {};
  const timeFrame = readStringField(attributes, 'timeFrame');

  return {
    id: requireString(payload, 'id', 'Sprint'),
    name: requireString(payload, 'name', 'Sprint'),
    path: requireString(payload, 'path', 'Sprint'),
    attributes: {
      startDate: readStringField(attributes, 'startDate'),
      finishDate: readStringField(attributes, 'finishDate'),
      timeFrame:
        timeFrame === 'past' || timeFrame === 'current' || timeFrame === 'future'
          ? timeFrame
          : undefined,
    },
  };
}

export function parseAzureDeveloper(payload: JsonValue): AzureIdentityRef {
  if (!isJsonObject(payload)) {
    throw new AzureDevOpsError('Usuário inválido retornado pelo Azure DevOps.');
  }

  return {
    id: readStringField(payload, 'id'),
    displayName: requireString(payload, 'displayName', 'Usuário'),
    uniqueName: readStringField(payload, 'uniqueName'),
    mailAddress: readStringField(payload, 'mailAddress'),
  };
}
