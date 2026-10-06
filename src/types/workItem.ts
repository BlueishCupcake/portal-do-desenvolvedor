export type WorkItemType =
  'Task' | 'Bug' | 'User Story' | 'Product Backlog Item' | 'Feature' | 'Other';

export type BugStatus = 'none' | 'open' | 'fixed';

export interface WorkItemPullRequest {
  id: number;
  repositoryName: string;
  projectName: string;
  targetBranch: string;
  status?: string;
  url?: string;
}

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
  pullRequests?: WorkItemPullRequest[];
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
