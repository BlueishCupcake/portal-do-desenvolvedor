import type { AzureSprint } from '@/services/azureDevOps/types.ts';
import type { Sprint } from '@/types/sprint.ts';

export function mapAzureSprint(sprint: AzureSprint): Sprint {
  return {
    id: sprint.id,
    name: sprint.name,
    path: sprint.path,
    startDate: sprint.attributes.startDate ?? '',
    endDate: sprint.attributes.finishDate ?? '',
  };
}
