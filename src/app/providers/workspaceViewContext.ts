import { createContext } from 'react';

export type WorkspaceView = 'tasks' | 'todos' | 'pipelines' | 'metrics';

export interface WorkspaceViewContextValue {
  view: WorkspaceView;
  setView: (view: WorkspaceView) => void;
}

export const WorkspaceViewContext = createContext<WorkspaceViewContextValue | null>(
  null,
);
