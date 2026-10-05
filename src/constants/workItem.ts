import type { WorkItemTypeFilter } from '@/types/workItem.ts';

export const WORK_ITEM_TYPE_FILTERS: ReadonlyArray<{
  id: WorkItemTypeFilter;
  label: string;
}> = [
  { id: 'all', label: 'Todos' },
  { id: 'Task', label: 'Tasks' },
  { id: 'Bug', label: 'Bugs' },
  { id: 'User Story', label: 'Stories' },
];

export const SORT_FIELD_OPTIONS: ReadonlyArray<{
  id: 'title' | 'type' | 'state' | 'id' | 'priority' | 'updatedAt';
  label: string;
}> = [
  { id: 'updatedAt', label: 'Atualização' },
  { id: 'title', label: 'Título' },
  { id: 'type', label: 'Tipo' },
  { id: 'state', label: 'Estado' },
  { id: 'id', label: 'ID' },
  { id: 'priority', label: 'Prioridade' },
];
