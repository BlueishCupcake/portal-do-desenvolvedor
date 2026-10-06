import type { Developer } from '@/types/developer.ts';
import type { PipelineRun } from '@/types/pipeline.ts';
import type { Sprint } from '@/types/sprint.ts';
import type { WorkItem, WorkItemDetails } from '@/types/workItem.ts';
import type { JsonValue } from '@/utils/json.ts';

export interface AzureDevOpsService {
  getCurrentSprint(): Promise<Sprint>;
  getSprints(): Promise<Sprint[]>;
  getCurrentUser(): Promise<Developer>;
  getUserPipelines(): Promise<PipelineRun[]>;
  getUserWorkItems(
    sprintId: string,
    userId: string,
    options?: WorkItemQueryOptions,
  ): Promise<WorkItem[]>;
  getWorkItemDetails(id: number): Promise<WorkItemDetails>;
}

export interface WorkItemQueryOptions {
  leadMode?: boolean;
}

export interface AzureIdentity {
  displayName: string;
  uniqueName?: string;
  id?: string;
}

export interface AzureWorkItemFields {
  'System.Title': string;
  'System.WorkItemType': string;
  'System.State': string;
  'System.AssignedTo'?: AzureIdentity | string;
  'System.BoardColumn'?: string;
  'System.IterationPath': string;
  'System.Description'?: string;
  'Microsoft.VSTS.Common.Priority'?: number;
  'Microsoft.VSTS.Scheduling.StoryPoints'?: number;
  'Microsoft.VSTS.Scheduling.Effort'?: number;
  'System.CreatedDate'?: string;
  'System.ChangedDate'?: string;
  'System.IterationLevel3'?: string;
}

export interface AzureWorkItemRelation {
  rel?: string;
  url?: string;
}

export interface AzureWorkItem {
  id: number;
  url?: string;
  fields: AzureWorkItemFields;
  relations?: AzureWorkItemRelation[];
  deployed?: boolean;
  releasePrCreated?: boolean;
}

export interface AzureSprint {
  id: string;
  name: string;
  path: string;
  attributes: {
    startDate?: string;
    finishDate?: string;
    timeFrame?: 'past' | 'current' | 'future';
  };
}

export interface AzureIdentityRef {
  id?: string;
  displayName: string;
  uniqueName?: string;
  mailAddress?: string;
}

export interface AzureDevOpsContext {
  organization: string;
  project: string;
  team: string;
}

export interface AzureDevOpsMcpToolMap {
  getCurrentUser: string;
  getUserPipelines: string;
  getCurrentSprint: string;
  getSprints: string;
  getUserWorkItems: string;
  getWorkItemDetails: string;
}

export interface McpTransport {
  invoke(
    tool: string,
    args?: Record<string, string | number | boolean>,
  ): Promise<JsonValue>;
}

export class AzureDevOpsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AzureDevOpsError';
  }
}
