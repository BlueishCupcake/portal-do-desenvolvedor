import { describe, expect, it } from 'vitest';

import {
  isDeployedPullRequest,
  isMainBranch,
  isReleaseBranch,
  isReleasePullRequestCreated,
  parsePullRequestArtifact,
} from './pullRequests.ts';

describe('pull request deployment helpers', () => {
  it('parses encoded and plain Azure pull request artifacts', () => {
    expect(
      parsePullRequestArtifact(
        'vstfs:///Git/PullRequestId/54d6b024-e746-483b-9dc4-8a2a621c3b85%2F4d92d49c-7272-4be6-b3fe-7fba46d5dab0%2F125176',
      ),
    ).toEqual({
      projectId: '54d6b024-e746-483b-9dc4-8a2a621c3b85',
      repositoryId: '4d92d49c-7272-4be6-b3fe-7fba46d5dab0',
      pullRequestId: 125176,
    });

    expect(
      parsePullRequestArtifact(
        'vstfs:///Git/PullRequestId/project/repo/42',
      ),
    ).toEqual({
      projectId: 'project',
      repositoryId: 'repo',
      pullRequestId: 42,
    });

    expect(parsePullRequestArtifact('vstfs:///Git/Commit/abc')).toBeUndefined();
  });

  it('distinguishes main and release target branches', () => {
    expect(isMainBranch('refs/heads/main')).toBe(true);
    expect(isReleaseBranch('refs/heads/release/106.3')).toBe(true);
    expect(isMainBranch('refs/heads/release')).toBe(false);
    expect(isReleaseBranch('refs/heads/main')).toBe(false);
    expect(isReleaseBranch('refs/heads/feature/foo')).toBe(false);
  });

  it('marks only created or completed main PRs as deployed', () => {
    expect(
      isDeployedPullRequest({
        status: 'completed',
        targetRefName: 'refs/heads/main',
      }),
    ).toBe(true);
    expect(
      isDeployedPullRequest({
        status: 'active',
        targetRefName: 'refs/heads/main',
      }),
    ).toBe(true);
    expect(
      isDeployedPullRequest({
        status: 'active',
        targetRefName: 'refs/heads/release',
      }),
    ).toBe(false);
    expect(
      isDeployedPullRequest({
        status: 'abandoned',
        targetRefName: 'refs/heads/main',
      }),
    ).toBe(false);
  });

  it('marks created or completed release PRs', () => {
    expect(
      isReleasePullRequestCreated({
        status: 'active',
        targetRefName: 'refs/heads/release',
      }),
    ).toBe(true);
    expect(
      isReleasePullRequestCreated({
        status: 'completed',
        targetRefName: 'refs/heads/release/106.3',
      }),
    ).toBe(true);
    expect(
      isReleasePullRequestCreated({
        status: 'completed',
        targetRefName: 'refs/heads/main',
      }),
    ).toBe(false);
  });
});
