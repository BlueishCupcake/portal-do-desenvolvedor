export type BoardStatusKey =
  'development' | 'qa' | 'deploy' | 'doing' | 'done' | 'blocked' | 'default';

export interface BoardStatusVisual {
  key: BoardStatusKey;
  token: string;
}
