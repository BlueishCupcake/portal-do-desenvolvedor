import { afterEach, describe, expect, it, vi } from 'vitest';

import { readVdmObjective } from '@/utils/metrics/vdm.ts';

describe('readVdmObjective', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reads a positive number from the env and falls back otherwise', () => {
    vi.stubEnv('VITE_AZURE_DEVOPS_VDM_OBJECTIVE', '7');
    expect(readVdmObjective()).toBe(7);

    vi.stubEnv('VITE_AZURE_DEVOPS_VDM_OBJECTIVE', '0');
    expect(readVdmObjective()).toBe(7);

    vi.stubEnv('VITE_AZURE_DEVOPS_VDM_OBJECTIVE', 'abc');
    expect(readVdmObjective(9)).toBe(9);
  });
});
