import { AlertV2, Button, Icon } from '@poliedro/tamentai/web';

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry: () => void;
}

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <AlertV2.Root type="soft" color="red" role="alert">
      <AlertV2.Icon>
        <Icon name="CircleAlert" />
      </AlertV2.Icon>
      <AlertV2.Content>
        <AlertV2.Title>{title}</AlertV2.Title>
        <AlertV2.Description>{message}</AlertV2.Description>
        <AlertV2.Actions>
          <Button color="destructive" variant="soft" onClick={onRetry}>
            Tentar novamente
          </Button>
        </AlertV2.Actions>
      </AlertV2.Content>
    </AlertV2.Root>
  );
}
