import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  azureDevOpsRequest,
  createAzureAuthHeader,
  encodeSegment,
  escapeWiqlValue,
  readAzureErrorMessage,
  withApiVersion,
} from './client.ts';

const config = {
  organization: 'contoso',
  project: 'portal',
  team: 'devs',
  pat: 'secret',
};

describe('azure devops rest client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('builds auth, paths and WIQL escapes', () => {
    expect(createAzureAuthHeader('secret')).toBe(
      `Basic ${Buffer.from(':secret').toString('base64')}`,
    );
    expect(encodeSegment('My Team')).toBe('My%20Team');
    expect(escapeWiqlValue("Proj\\Sprint '42'")).toBe("Proj\\Sprint ''42''");
    expect(withApiVersion('/_apis/foo')).toBe('/_apis/foo?api-version=7.1');
    expect(withApiVersion('/_apis/foo?bar=1')).toBe(
      '/_apis/foo?bar=1&api-version=7.1',
    );
    expect(withApiVersion('/_apis/connectionData', '7.1-preview')).toBe(
      '/_apis/connectionData?api-version=7.1-preview',
    );
  });

  it('returns JSON from Azure DevOps', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ displayName: 'Sophie' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      azureDevOpsRequest(config, '/_apis/connectionData'),
    ).resolves.toEqual({ displayName: 'Sophie' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://dev.azure.com/contoso/_apis/connectionData',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: createAzureAuthHeader('secret'),
        }),
      }),
    );
  });

  it('keeps absolute URLs and maps error payloads', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      }),
    );

    await expect(
      azureDevOpsRequest(config, 'https://dev.azure.com/other/_apis/foo'),
    ).rejects.toThrow('Unauthorized');

    expect(readAzureErrorMessage({}, 401)).toMatch(/PAT/);
    expect(readAzureErrorMessage({}, 500)).toMatch(/500/);
  });
});
