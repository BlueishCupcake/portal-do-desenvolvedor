import type { AzureIdentityRef } from '@/services/azureDevOps/types.ts';
import type { Developer } from '@/types/developer.ts';

export function mapAzureDeveloper(identity: AzureIdentityRef): Developer {
  return {
    id: identity.id ?? identity.uniqueName ?? identity.displayName,
    displayName: identity.displayName,
    email: identity.mailAddress ?? identity.uniqueName,
  };
}
