import { Badge } from '@poliedro/tamentai/web';

interface DeployedIndicatorProps {
  deployed?: boolean;
}

export function DeployedIndicator({ deployed = false }: DeployedIndicatorProps) {
  const label = deployed ? 'Yes' : 'No';

  return (
    <Badge
      className="tag"
      variant="soft"
      color={deployed ? 'green' : 'gray'}
      size="sm"
      shape="pilled"
      data-tag={deployed ? 'deployed-yes' : 'deployed-no'}
      title={`Deployed: ${label}`}
      aria-label={`Deployed: ${label}`}
    >
      {label}
    </Badge>
  );
}
