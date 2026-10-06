export type WorkItemType =
  'Task' | 'Bug' | 'User Story' | 'Product Backlog Item' | 'Feature' | 'Other';

export type BugStatus = 'none' | 'open' | 'fixed';

export interface WorkItem {
  id: number;
  title: string;
  type: WorkItemType;
  state: string;
  assignedTo: string;
  assignedToId?: string;
  assignedToUniqueName?: string;
  boardColumn: string;
  iterationPath: string;
  description?: string;
  url?: string;
  priority?: number;
  createdAt?: string;
  updatedAt?: string;
  relatedIds?: number[];
  bugStatus?: BugStatus;
  deployed?: boolean;
  releasePrCreated?: boolean;
  storyPoints?: number;
}

export interface WorkItemDetails extends WorkItem {
  sprintName: string;
  createdAt: string;
  updatedAt: string;
}

export type WorkItemTypeFilter =
  'all' | 'Task' | 'Bug' | 'User Story' | 'Product Backlog Item' | 'Feature';

export type SortField = 'title' | 'type' | 'state' | 'id' | 'priority' | 'updatedAt';

export type SortDirection = 'asc' | 'desc';
