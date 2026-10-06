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
