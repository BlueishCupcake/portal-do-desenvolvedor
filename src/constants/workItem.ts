import type { WorkItemType, WorkItemTypeFilter } from '@/types/workItem.ts';

export const WORK_ITEM_TYPE_LABELS: Record<WorkItemType, string> = {
  Task: 'Tarefa',
  Bug: 'Bug',
  'User Story': 'História de usuário',
  'Product Backlog Item': 'Item do backlog',
  Feature: 'Funcionalidade',
  Other: 'Outro',
};

export function formatWorkItemType(type: string): string {
  return WORK_ITEM_TYPE_LABELS[type as WorkItemType] ?? type;
}

export const WORK_ITEM_TYPE_FILTERS: ReadonlyArray<{
  id: WorkItemTypeFilter;
  label: string;
}> = [
  { id: 'all', label: 'Todos' },
  { id: 'Task', label: 'Tarefas' },
  { id: 'Bug', label: 'Bugs' },
  { id: 'User Story', label: 'Histórias' },
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
