import { type ReactNode, useCallback, useMemo, useState } from 'react';

import {
  type WorkspaceView,
  WorkspaceViewContext,
} from '@/app/providers/workspaceViewContext.ts';

interface WorkspaceViewProviderProps {
  children: ReactNode;
}

export function WorkspaceViewProvider({ children }: WorkspaceViewProviderProps) {
  const [view, setViewState] = useState<WorkspaceView>('tasks');

  const setView = useCallback((next: WorkspaceView) => {
    setViewState(next);
  }, []);

  const value = useMemo(
    () => ({
      view,
      setView,
    }),
    [setView, view],
  );

  return (
    <WorkspaceViewContext.Provider value={value}>
      {children}
    </WorkspaceViewContext.Provider>
  );
}
