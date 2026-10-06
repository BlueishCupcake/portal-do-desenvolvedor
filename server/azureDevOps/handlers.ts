import {
  azureDevOpsRequest,
  encodeSegment,
  escapeWiqlValue,
  withApiVersion,
} from './client.ts';
import {
  type AzureDevOpsServerConfig,
  readAzureDevOpsServerConfig,
} from './config.ts';
import {
  type AzurePullRequestRef,
  type AzurePullRequestSummary,
  isDeployedPullRequest,
  isReleasePullRequestCreated,
  parsePullRequestArtifact,
  pullRequestCacheKey,
} from './pullRequests.ts';

export interface AzureDevOpsApiResult {
  status: number;
  body: unknown;
}

interface JsonRecord {
  [key: string]: unknown;
}

class InvalidRequestError extends Error {}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function descriptionToHtml(value: string): string {
  return value
    .split('\n')
    .map((line) => {
      const link = /^\[(.+)\]\((https?:\/\/[^)\s]+)\)$/.exec(line);
      if (!link?.[1] || !link[2]) {
        return escapeHtml(line);
      }

      return `<a href="${escapeHtml(link[2])}">${escapeHtml(link[1])}</a>`;
    })
    .join('<br>');
}

function readDeployCardPayload(payload: unknown): {
  title: string;
  description: string;
  workItemIds: number[];
  iterationPath?: string;
} {
  if (!isRecord(payload)) {
    throw new InvalidRequestError('Dados do cartão de deploy inválidos.');
  }

  const title = readString(payload.title)?.trim();
  const description = readString(payload.description)?.trim();
  const workItemIds = Array.isArray(payload.workItemIds)
    ? payload.workItemIds.filter(
        (id): id is number => typeof id === 'number' && Number.isInteger(id),
      )
    : [];

  if (!title || !description || workItemIds.length === 0) {
    throw new InvalidRequestError(
      'Informe o título, a descrição e ao menos uma tarefa para criar o cartão de deploy.',
    );
  }

  return {
    title,
    description,
    workItemIds: [...new Set(workItemIds)],
    iterationPath: readString(payload.iterationPath)?.trim(),
  };
}

async function resolveTeam(config: AzureDevOpsServerConfig): Promise<string> {
  if (config.team) {
    return config.team;
  }

  const payload = await azureDevOpsRequest(
    config,
    withApiVersion(`/${encodeSegment(config.project)}/_apis/teams`),
  );

  if (!isRecord(payload) || !Array.isArray(payload.value)) {
    return config.project;
  }

  const teams = payload.value.filter(isRecord);
  const matchingTeam = teams.find((team) => {
    const name = readString(team.name);
    return name === config.project || name === `${config.project} Team`;
  });

  return (
    readString(matchingTeam?.name) ?? readString(teams[0]?.name) ?? config.project
  );
}

function toIdentity(payload: unknown): JsonRecord {
  if (!isRecord(payload)) {
    throw new Error('Usuário inválido retornado pelo Azure DevOps.');
  }

  if (typeof payload.displayName === 'string') {
    return payload;
  }

  const user = isRecord(payload.authenticatedUser)
    ? payload.authenticatedUser
    : payload;
  const properties = isRecord(user.properties) ? user.properties : undefined;
  const account =
    properties && isRecord(properties.Account) ? properties.Account : undefined;

  const displayName =
    readString(user.providerDisplayName) ?? readString(user.displayName);
  const email = readString(account?.$value);

  if (!displayName) {
    throw new Error('Usuário inválido retornado pelo Azure DevOps.');
  }

  return {
    id: readString(user.id),
    displayName,
    uniqueName: email,
    mailAddress: email,
  };
}

async function getAuthenticatedIdentity(
  config: AzureDevOpsServerConfig,
): Promise<JsonRecord> {
  const connectionPayload = await azureDevOpsRequest(
    config,
    withApiVersion('/_apis/connectionData', '7.1-preview'),
  );
  const identity = toIdentity(connectionPayload);

  try {
    const profile = await azureDevOpsRequest(
      config,
      `https://vssps.dev.azure.com/${encodeSegment(config.organization)}/_apis/profile/profiles/me?api-version=7.1`,
    );

    if (!isRecord(profile)) {
      return identity;
    }

    const email =
      readString(profile.emailAddress) ??
      readString(identity.mailAddress) ??
      readString(identity.uniqueName);

    return {
      ...identity,
      displayName: readString(profile.displayName) ?? identity.displayName,
      uniqueName: email,
      mailAddress: email,
    };
  } catch {
    return identity;
  }
}

function workItemWebUrl(
  config: AzureDevOpsServerConfig,
  item: JsonRecord,
): string | undefined {
  const links = isRecord(item._links) ? item._links : undefined;
  const html = links && isRecord(links.html) ? links.html : undefined;
  const href = readString(html?.href);
  if (href) {
    return href;
  }

  const id = readNumber(item.id);
  if (id === undefined) {
    return readString(item.url);
  }

  return `https://dev.azure.com/${encodeSegment(config.organization)}/${encodeSegment(config.project)}/_workitems/edit/${String(id)}`;
}

function withWebUrl(config: AzureDevOpsServerConfig, item: unknown): JsonRecord {
  if (!isRecord(item)) {
    throw new Error('Work item inválido retornado pelo Azure DevOps.');
  }

  return {
    ...item,
    url: workItemWebUrl(config, item),
  };
}

function readPullRequestRefs(item: JsonRecord): AzurePullRequestRef[] {
  if (!Array.isArray(item.relations)) {
    return [];
  }

  return item.relations.flatMap((relation) => {
    if (!isRecord(relation)) {
      return [];
    }

    const url = readString(relation.url);
    if (!url) {
      return [];
    }

    const ref = parsePullRequestArtifact(url);
    return ref ? [ref] : [];
  });
}

async function fetchPullRequestSummary(
  config: AzureDevOpsServerConfig,
  ref: AzurePullRequestRef,
): Promise<AzurePullRequestSummary | undefined> {
  const projectCandidates = [ref.projectId, config.project].filter(
    (project, index, all) => project.length > 0 && all.indexOf(project) === index,
  );

  for (const project of projectCandidates) {
    try {
      const payload = await azureDevOpsRequest(
        config,
        withApiVersion(
          `/${encodeSegment(project)}/_apis/git/repositories/${encodeSegment(ref.repositoryId)}/pullrequests/${String(ref.pullRequestId)}`,
        ),
      );

      if (!isRecord(payload)) {
        continue;
      }

      const repository = isRecord(payload.repository)
        ? payload.repository
        : undefined;
      const repositoryProject =
        repository && isRecord(repository.project) ? repository.project : undefined;
      const links = isRecord(payload._links) ? payload._links : undefined;
      const webLink = links && isRecord(links.web) ? links.web : undefined;
      const repositoryName = readString(repository?.name) ?? ref.repositoryId;
      const projectName = readString(repositoryProject?.name) ?? project;

      return {
        id: readNumber(payload.pullRequestId) ?? ref.pullRequestId,
        repositoryName,
        projectName,
        status: readString(payload.status),
        targetRefName: readString(payload.targetRefName),
        url:
          readString(webLink?.href) ??
          `https://dev.azure.com/${encodeSegment(config.organization)}/${encodeSegment(projectName)}/_git/${encodeSegment(repositoryName)}/pullrequest/${String(ref.pullRequestId)}`,
      };
    } catch {
      continue;
    }
  }

  return undefined;
}

async function withDeployment(
  config: AzureDevOpsServerConfig,
  items: JsonRecord[],
): Promise<JsonRecord[]> {
  const uniqueRefs = new Map<string, AzurePullRequestRef>();

  for (const item of items) {
    for (const ref of readPullRequestRefs(item)) {
      uniqueRefs.set(pullRequestCacheKey(ref), ref);
    }
  }

  const deployedByKey = new Map<string, boolean>();
  const releasePrByKey = new Map<string, boolean>();
  const pullRequestByKey = new Map<string, AzurePullRequestSummary>();

  await Promise.all(
    [...uniqueRefs.entries()].map(async ([key, ref]) => {
      const summary = await fetchPullRequestSummary(config, ref);
      deployedByKey.set(key, summary ? isDeployedPullRequest(summary) : false);
      releasePrByKey.set(
        key,
        summary ? isReleasePullRequestCreated(summary) : false,
      );
      if (summary) {
        pullRequestByKey.set(key, summary);
      }
    }),
  );

  return items.map((item) => {
    const refs = readPullRequestRefs(item);
    const deployed = refs.some((ref) => deployedByKey.get(pullRequestCacheKey(ref)));
    const releasePrCreated = refs.some((ref) =>
      releasePrByKey.get(pullRequestCacheKey(ref)),
    );

    return {
      ...item,
      deployed,
      releasePrCreated,
      pullRequests: refs.flatMap((ref) => {
        const pullRequest = pullRequestByKey.get(pullRequestCacheKey(ref));
        return pullRequest ? [pullRequest] : [];
      }),
    };
  });
}

async function createDeployCard(
  config: AzureDevOpsServerConfig,
  payload: unknown,
): Promise<JsonRecord> {
  const input = readDeployCardPayload(payload);
  const description = descriptionToHtml(input.description);
  const patch: JsonRecord[] = [
    { op: 'add', path: '/fields/System.Title', value: input.title },
    { op: 'add', path: '/fields/System.Description', value: description },
  ];

  if (input.iterationPath) {
    patch.push({
      op: 'add',
      path: '/fields/System.IterationPath',
      value: input.iterationPath,
    });
  }

  for (const workItemId of input.workItemIds) {
    patch.push({
      op: 'add',
      path: '/relations/-',
      value: {
        rel: 'System.LinkTypes.Related',
        url: `https://dev.azure.com/${encodeSegment(config.organization)}/${encodeSegment(config.project)}/_apis/wit/workItems/${String(workItemId)}`,
        attributes: {
          comment:
            'Tarefa incluída no cartão de deploy pelo Portal do Desenvolvedor.',
        },
      },
    });
  }

  const created = await azureDevOpsRequest(
    config,
    withApiVersion(
      `/${encodeSegment(config.project)}/_apis/wit/workitems/$${encodeSegment(config.deployWorkItemType)}`,
    ),
    {
      method: 'POST',
      contentType: 'application/json-patch+json',
      body: JSON.stringify(patch),
    },
  );

  return withWebUrl(config, created);
}

async function fetchWorkItemsByIds(
  config: AzureDevOpsServerConfig,
  ids: number[],
): Promise<JsonRecord[]> {
  if (ids.length === 0) {
    return [];
  }

  const items: JsonRecord[] = [];

  for (let index = 0; index < ids.length; index += 200) {
    const chunk = ids.slice(index, index + 200);
    const payload = await azureDevOpsRequest(
      config,
      withApiVersion(
        `/${encodeSegment(config.project)}/_apis/wit/workitems?ids=${chunk.join(',')}&$expand=all`,
      ),
    );

    if (!isRecord(payload) || !Array.isArray(payload.value)) {
      throw new Error('Lista de work items inválida.');
    }

    for (const item of payload.value) {
      items.push(withWebUrl(config, item));
    }
  }

  return items;
}

function readWorkItemIds(payload: unknown): number[] {
  if (!isRecord(payload) || !Array.isArray(payload.workItems)) {
    throw new Error('Consulta WIQL inválida.');
  }

  return payload.workItems.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }

    const id = readNumber(item.id);
    return id === undefined ? [] : [id];
  });
}

function buildSprintQuery(sprintId: string, leadMode: boolean): string {
  const assignment = leadMode ? '' : ' AND [System.AssignedTo] = @Me';

  if (sprintId.includes('\\') || sprintId.includes('/')) {
    return `SELECT [System.Id] FROM WorkItems WHERE [System.IterationPath] UNDER '${escapeWiqlValue(sprintId)}'${assignment}`;
  }

  return `SELECT [System.Id] FROM WorkItems WHERE [System.IterationPath] = @CurrentIteration${assignment}`;
}

export async function handleAzureDevOpsApi(
  method: string,
  pathname: string,
  searchParams: URLSearchParams,
  env: Record<string, string | undefined> = process.env,
  requestBody?: unknown,
): Promise<AzureDevOpsApiResult> {
  if (
    method !== 'GET' &&
    !(method === 'POST' && pathname === '/api/azure-devops/deploy-cards')
  ) {
    return { status: 405, body: { message: 'Método não permitido.' } };
  }

  const config = readAzureDevOpsServerConfig(env);

  if (!config.organization || !config.project || !config.pat) {
    return {
      status: 503,
      body: {
        message:
          'Configure AZURE_DEVOPS_PAT, VITE_AZURE_DEVOPS_ORGANIZATION e VITE_AZURE_DEVOPS_PROJECT no arquivo .env.',
      },
    };
  }

  try {
    if (method === 'POST' && pathname === '/api/azure-devops/deploy-cards') {
      return {
        status: 201,
        body: await createDeployCard(config, requestBody),
      };
    }

    const team = await resolveTeam(config);
    const teamSegment = `/${encodeSegment(config.project)}/${encodeSegment(team)}`;

    if (pathname === '/api/azure-devops/me') {
      return { status: 200, body: await getAuthenticatedIdentity(config) };
    }

    if (pathname === '/api/azure-devops/sprint/current') {
      const payload = await azureDevOpsRequest(
        config,
        withApiVersion(
          `${teamSegment}/_apis/work/teamsettings/iterations?$timeframe=current`,
        ),
      );

      if (!isRecord(payload) || !Array.isArray(payload.value) || !payload.value[0]) {
        throw new Error('Não foi possível identificar a Sprint atual.');
      }

      return { status: 200, body: payload.value[0] };
    }

    if (pathname === '/api/azure-devops/sprints') {
      const payload = await azureDevOpsRequest(
        config,
        withApiVersion(`${teamSegment}/_apis/work/teamsettings/iterations`),
      );

      if (!isRecord(payload) || !Array.isArray(payload.value)) {
        throw new Error('Não foi possível carregar as Sprints.');
      }

      return { status: 200, body: payload };
    }

    if (pathname === '/api/azure-devops/pipelines') {
      const identityPayload = await azureDevOpsRequest(
        config,
        withApiVersion('/_apis/connectionData', '7.1-preview'),
      );
      const identity = toIdentity(identityPayload);
      const requestedFor =
        readString(identity.id) ??
        readString(identity.uniqueName) ??
        readString(identity.mailAddress) ??
        readString(identity.displayName);

      if (!requestedFor) {
        throw new Error('Não foi possível identificar o usuário das pipelines.');
      }

      const query = new URLSearchParams({
        requestedFor,
        statusFilter: 'all',
        queryOrder: 'queueTimeDescending',
        $top: '50',
      });
      if (config.pipelineDefinitionIds.length > 0) {
        query.set('definitions', config.pipelineDefinitionIds.join(','));
      }
      const payload = await azureDevOpsRequest(
        config,
        withApiVersion(
          `/${encodeSegment(config.pipelineProject)}/_apis/build/builds?${query.toString()}`,
        ),
      );

      if (!isRecord(payload) || !Array.isArray(payload.value)) {
        throw new Error('Lista de pipelines inválida.');
      }

      return { status: 200, body: payload };
    }

    const detailsMatch = /^\/api\/azure-devops\/work-items\/(\d+)$/.exec(pathname);
    if (detailsMatch) {
      const payload = await azureDevOpsRequest(
        config,
        withApiVersion(
          `/${encodeSegment(config.project)}/_apis/wit/workitems/${detailsMatch[1]}?$expand=all`,
        ),
      );
      const [item] = await withDeployment(config, [withWebUrl(config, payload)]);
      return { status: 200, body: item };
    }

    if (pathname === '/api/azure-devops/work-items') {
      const sprintId = searchParams.get('sprintId') ?? '';
      const leadMode = searchParams.get('leadMode') === 'true';
      const queryPayload = await azureDevOpsRequest(
        config,
        withApiVersion(`${teamSegment}/_apis/wit/wiql`),
        {
          method: 'POST',
          body: JSON.stringify({ query: buildSprintQuery(sprintId, leadMode) }),
        },
      );

      return {
        status: 200,
        body: {
          value: await withDeployment(
            config,
            await fetchWorkItemsByIds(config, readWorkItemIds(queryPayload)),
          ),
        },
      };
    }

    return {
      status: 404,
      body: { message: 'Rota do Azure DevOps não encontrada.' },
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Não foi possível comunicar com o Azure DevOps.';

    return {
      status: error instanceof InvalidRequestError ? 400 : 502,
      body: { message },
    };
  }
}
