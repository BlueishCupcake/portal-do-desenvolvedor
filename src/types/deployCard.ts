export interface CreateDeployCardInput {
  title: string;
  description: string;
  workItemIds: number[];
  iterationPath?: string;
}

export interface DeployCard {
  id: number;
  title: string;
  url: string;
}

export interface DeployCardSummary extends DeployCard {
  state: string;
  iterationPath?: string;
}

export interface AttachTasksToDeployCardInput {
  description: string;
  workItemIds: number[];
}

export interface AttachTasksToDeployCardResult extends DeployCard {
  attachedWorkItemIds: number[];
  closedWorkItemIds: number[];
}
