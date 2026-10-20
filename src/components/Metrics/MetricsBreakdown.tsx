import { Text } from '@poliedro/tamentai/web';

import styles from '@/components/Metrics/MetricsBreakdown.module.css';
import type { MetricBreakdown } from '@/types/metrics.ts';

interface MetricsBreakdownProps {
  title: string;
  items: MetricBreakdown[];
}

export function MetricsBreakdown({ title, items }: MetricsBreakdownProps) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className={styles.section} aria-label={title}>
      <Text variant="label">{title}</Text>
      {items.length === 0 ? (
        <Text color="muted">Sem dados para este recorte.</Text>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => {
            const percent = total === 0 ? 0 : Math.round((item.count / total) * 100);

            return (
              <li key={item.label} className={styles.item}>
                <div className={styles.row}>
                  <span>{item.label}</span>
                  <span>
                    {item.count} ({percent}%)
                  </span>
                </div>
                <div
                  className={styles.track}
                  role="meter"
                  aria-label={`${item.label}: ${String(item.count)} de ${String(total)}`}
                  aria-valuemin={0}
                  aria-valuemax={total}
                  aria-valuenow={item.count}
                >
                  <span className={styles.fill} style={{ width: `${String(percent)}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
