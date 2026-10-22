import { SkeletonBlock } from '@/components/Loading/SkeletonBlock.tsx';
import styles from '@/components/Loading/MetricsTabSkeleton.module.css';

const KPI_COUNT = 5;
const ROW_COUNT = 5;

export function MetricsTabSkeleton() {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite" aria-label="Carregando métricas">
      <span className={styles.message}>Carregando métricas...</span>
      <div className={styles.kpis} aria-hidden="true">
        {Array.from({ length: KPI_COUNT }, (_, index) => (
          <SkeletonBlock key={index} className={styles.kpiCard} />
        ))}
      </div>
      <SkeletonBlock className={styles.progress} aria-hidden="true" />
      <div className={styles.charts} aria-hidden="true">
        {Array.from({ length: 3 }, (_, index) => (
          <SkeletonBlock key={index} className={styles.chart} />
        ))}
      </div>
      <div className={styles.tableWrap} aria-hidden="true">
        <div className={styles.headerRow}>
          {Array.from({ length: 5 }, (_, index) => (
            <SkeletonBlock key={`head-${index}`} className={styles.headerCell} />
          ))}
        </div>
        {Array.from({ length: ROW_COUNT }, (_, rowIndex) => (
          <div key={rowIndex} className={styles.bodyRow}>
            <SkeletonBlock className={styles.line} />
            <SkeletonBlock className={styles.lineShort} />
            <SkeletonBlock className={styles.line} />
            <SkeletonBlock className={styles.line} />
            <SkeletonBlock className={styles.line} />
          </div>
        ))}
      </div>
    </div>
  );
}
