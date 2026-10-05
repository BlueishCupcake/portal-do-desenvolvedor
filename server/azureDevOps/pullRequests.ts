export interface AzurePullRequestRef {
  projectId: string;
  repositoryId: string;
  pullRequestId: number;
}

export interface AzurePullRequestSummary {
  status?: string;
  targetRefName?: string;
}

const ENCODED_PR_PATTERN =
  /PullRequestId\/([^/]+)%2F([^/%]+)%2F(\d+)/i;
const PLAIN_PR_PATTERN = /PullRequestId\/([^/]+)\/([^/]+)\/(\d+)/i;

export function parsePullRequestArtifact(
  url: string,
): AzurePullRequestRef | undefined {
  const encoded = ENCODED_PR_PATTERN.exec(url);
  if (encoded?.[1] && encoded[2] && encoded[3]) {
    return {
      projectId: decodeURIComponent(encoded[1]),
      repositoryId: decodeURIComponent(encoded[2]),
      pullRequestId: Number(encoded[3]),
    };
  }

  const plain = PLAIN_PR_PATTERN.exec(url);
  if (plain?.[1] && plain[2] && plain[3]) {
    return {
      projectId: decodeURIComponent(plain[1]),
      repositoryId: decodeURIComponent(plain[2]),
      pullRequestId: Number(plain[3]),
    };
  }

  return undefined;
}

function readBranchName(targetRefName: string): string {
  return targetRefName.replace(/^refs\/heads\//i, '').toLowerCase();
}

export function isMainBranch(targetRefName: string): boolean {
  const branch = readBranchName(targetRefName);
  return branch === 'main' || branch === 'master';
}

export function isReleaseBranch(targetRefName: string): boolean {
  const branch = readBranchName(targetRefName);
  return branch === 'release' || branch.startsWith('release/');
}

export function isCreatedOrCompletedPullRequest(status: string): boolean {
  const normalized = status.toLowerCase();
  return normalized === 'active' || normalized === 'completed';
}

export function isDeployedPullRequest(
  pullRequest: AzurePullRequestSummary,
): boolean {
  const status = pullRequest.status ?? '';
  const targetRefName = pullRequest.targetRefName ?? '';

  return isCreatedOrCompletedPullRequest(status) && isMainBranch(targetRefName);
}

export function isReleasePullRequestCreated(
  pullRequest: AzurePullRequestSummary,
): boolean {
  const status = pullRequest.status ?? '';
  const targetRefName = pullRequest.targetRefName ?? '';

  return isCreatedOrCompletedPullRequest(status) && isReleaseBranch(targetRefName);
}

export function pullRequestCacheKey(ref: AzurePullRequestRef): string {
  return `${ref.repositoryId}:${String(ref.pullRequestId)}`;
}
