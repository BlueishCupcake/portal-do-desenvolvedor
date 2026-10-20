import { Badge } from '@poliedro/tamentai/web';

interface ReleasePrIndicatorProps {
  created?: boolean;
}

export function ReleasePrIndicator({ created = false }: ReleasePrIndicatorProps) {
  const label = created ? 'Criada' : 'Não criada';

  return (
    <Badge
      className="tag"
      variant="soft"
      color={created ? 'green' : 'gray'}
      size="sm"
      shape="pilled"
      data-tag={created ? 'release-created' : 'release-missing'}
      title={`PR de release: ${label}`}
      aria-label={`PR de release: ${label}`}
    >
      {label}
    </Badge>
  );
}
