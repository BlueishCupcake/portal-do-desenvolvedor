import { Card, Text } from '@poliedro/tamentai/web';

import styles from '@/components/Metrics/MetricCard.module.css';
import type { MetricKpi } from '@/types/metrics.ts';

interface MetricCardProps {
  kpi: MetricKpi;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

export function MetricCard({ kpi, selected = false, onSelect }: MetricCardProps) {
  return (
    <Card>
      <button
        type="button"
        className={styles.button}
        aria-pressed={selected}
        aria-label={`${kpi.label}: ${String(kpi.value)}. ${kpi.kind === 'period' ? 'Contagem do período' : 'Contagem atual'}. ${kpi.definition}`}
        onClick={() => {
          onSelect?.(kpi.id);
        }}
      >
        <Text variant="overline" color="muted">
          {kpi.kind === 'period' ? 'Período' : 'Atual'}
        </Text>
        <p className={styles.value}>{kpi.value}</p>
        <Text variant="label">{kpi.label}</Text>
      </button>
    </Card>
  );
}
