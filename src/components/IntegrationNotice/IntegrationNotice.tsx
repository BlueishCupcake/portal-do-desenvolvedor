import { AlertV2, Icon } from '@poliedro/tamentai/web';

interface IntegrationNoticeProps {
  provider: string;
}

export function IntegrationNotice({ provider }: IntegrationNoticeProps) {
  if (provider !== 'mock') {
    return null;
  }

  return (
    <AlertV2.Root type="soft" color="yellow" role="status">
      <AlertV2.Icon>
        <Icon name="Info" />
      </AlertV2.Icon>
      <AlertV2.Content>
        <AlertV2.Description>
          Você está vendo <strong>dados de demonstração</strong>. Para carregar suas
          tarefas reais, configure o Azure DevOps no arquivo <code>.env</code> e use{' '}
          <code>VITE_AZURE_DEVOPS_PROVIDER=rest</code>.
        </AlertV2.Description>
      </AlertV2.Content>
    </AlertV2.Root>
  );
}
