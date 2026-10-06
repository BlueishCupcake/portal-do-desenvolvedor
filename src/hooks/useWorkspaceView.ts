import { useContext } from 'react';

import {
  WorkspaceViewContext,
  type WorkspaceViewContextValue,
} from '@/app/providers/workspaceViewContext.ts';

export function useWorkspaceView(): WorkspaceViewContextValue {
  const value = useContext(WorkspaceViewContext);

  if (!value) {
    throw new Error(
      'useWorkspaceView deve ser usado dentro de WorkspaceViewProvider.',
    );
  }

  return value;
}
