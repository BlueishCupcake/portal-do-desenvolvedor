import { readEnv } from '@/utils/env.ts';

export function readVdmObjective(fallback = 7): number {
  const parsed = Number(readEnv('VITE_AZURE_DEVOPS_VDM_OBJECTIVE', String(fallback)));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
