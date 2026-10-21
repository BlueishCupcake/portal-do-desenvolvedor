import type {
  AttachTasksToDeployCardInput,
  AttachTasksToDeployCardResult,
  CreateDeployCardInput,
  DeployCard,
  DeployCardSummary,
} from '@/types/deployCard.ts';
import type { Developer } from '@/types/developer.ts';
import type { MetricsDashboardData, MetricsQuery } from '@/types/metrics.ts';
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
    sprintId: string | readonly string[],
    userId: string,
    options?: WorkItemQueryOptions,
  ): Promise<WorkItem[]>;
  getWorkItemDetails(id: number): Promise<WorkItemDetails>;
  getMetrics(query: MetricsQuery): Promise<MetricsDashboardData>;
  createDeployCard(input: CreateDeployCardInput): Promise<DeployCard>;
  listDeployCards(
    sprintId: string | readonly string[],
  ): Promise<DeployCardSummary[]>;
  attachTasksToDeployCard(
    deployCardId: number,
    input: AttachTasksToDeployCardInput,
  ): Promise<AttachTasksToDeployCardResult>;
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
  'Microsoft.VSTS.Common.ClosedDate'?: string;
  'Microsoft.VSTS.Scheduling.DueDate'?: string;
  'System.IterationLevel3'?: string;
  'System.Tags'?: string;
  'Microsoft.VSTS.CMMI.Blocked'?: string | boolean;
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
  pullRequests?: AzurePullRequest[];
  relatedBugs?: AzureRelatedBug[];
}

export interface AzureRelatedBug {
  id: number;
  title: string;
  state: string;
  url?: string;
}

export interface AzurePullRequest {
  id: number;
  repositoryName: string;
  projectName: string;
  targetRefName: string;
  status?: string;
  url?: string;
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
