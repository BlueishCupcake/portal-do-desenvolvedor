import { Badge } from '@poliedro/tamentai/web';

interface ReleasePrIndicatorProps {
  created?: boolean;
}

export function ReleasePrIndicator({ created = false }: ReleasePrIndicatorProps) {
  const label = created ? 'created' : 'not created';

  return (
    <Badge
      className="tag"
      variant="soft"
      color={created ? 'green' : 'gray'}
      size="sm"
      shape="pilled"
      data-tag={created ? 'release-created' : 'release-missing'}
      title={`Release PR: ${label}`}
      aria-label={`Release PR: ${label}`}
    >
      {label}
    </Badge>
  );
}
