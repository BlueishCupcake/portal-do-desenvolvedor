import { describe, expect, it } from 'vitest';

import {
  resolveBoardStatus,
  resolveBoardStatusKey,
} from '@/utils/resolveBoardStatus.ts';

describe('resolveBoardStatus', () => {
  it('maps known columns to visual tokens', () => {
    expect(resolveBoardStatusKey('Ag. Desenvolvimento')).toBe('development');
    expect(resolveBoardStatusKey('Development')).toBe('development');
    expect(resolveBoardStatusKey('Ag. QA')).toBe('qa');
    expect(resolveBoardStatusKey('Testes')).toBe('qa');
    expect(resolveBoardStatusKey('Ag. Deploy')).toBe('deploy');
    expect(resolveBoardStatusKey('Doing')).toBe('doing');
    expect(resolveBoardStatusKey('Em andamento')).toBe('doing');
    expect(resolveBoardStatusKey('In Progress')).toBe('doing');
    expect(resolveBoardStatusKey('Done')).toBe('done');
    expect(resolveBoardStatusKey('Concluído')).toBe('done');
    expect(resolveBoardStatusKey('Blocked')).toBe('blocked');
    expect(resolveBoardStatusKey('Bloqueado')).toBe('blocked');
    expect(resolveBoardStatusKey('New')).toBe('default');
    expect(resolveBoardStatus('Ag. QA').token).toBe('qa');
  });
});
