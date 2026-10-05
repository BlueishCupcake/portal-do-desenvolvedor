import { boardStatusConfig } from '@/constants/boardStatus.ts';
import type { BoardStatusKey, BoardStatusVisual } from '@/types/board.ts';

function normalizeColumn(column: string): string {
  return column
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export function resolveBoardStatusKey(column: string): BoardStatusKey {
  const normalized = normalizeColumn(column);

  if (normalized.includes('block') || normalized.includes('bloque')) {
    return 'blocked';
  }

  if (normalized.includes('done') || normalized.includes('conclu')) {
    return 'done';
  }

  if (normalized.includes('deploy')) {
    return 'deploy';
  }

  if (normalized.includes('qa') || normalized.includes('test')) {
    return 'qa';
  }

  if (
    normalized.includes('doing') ||
    normalized.includes('andamento') ||
    normalized.includes('progress')
  ) {
    return 'doing';
  }

  if (normalized.includes('dev') || normalized.includes('desenvolv')) {
    return 'development';
  }

  return 'default';
}

export function resolveBoardStatus(column: string): BoardStatusVisual {
  const key = resolveBoardStatusKey(column);
  return {
    key,
    token: boardStatusConfig[key].token,
  };
}
