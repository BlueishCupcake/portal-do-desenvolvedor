import { SkeletonBlock } from '@/components/Loading/SkeletonBlock.tsx';
import styles from '@/components/Loading/PipelinesTabSkeleton.module.css';

const ROW_COUNT = 5;

export function PipelinesTabSkeleton() {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite" aria-label="Carregando pipelines">
      <span className={styles.message}>Carregando pipelines...</span>
      <div className={styles.tableWrap} aria-hidden="true">
        <div className={styles.headerRow}>
          {Array.from({ length: 5 }, (_, index) => (
            <SkeletonBlock key={`head-${index}`} className={styles.headerCell} />
          ))}
        </div>
        {Array.from({ length: ROW_COUNT }, (_, rowIndex) => (
          <div key={rowIndex} className={styles.bodyRow}>
            <div className={styles.pipelineCell}>
              <SkeletonBlock className={styles.pipelineTitle} />
              <SkeletonBlock className={styles.pipelineMeta} />
            </div>
            <SkeletonBlock className={styles.statusPill} />
            <SkeletonBlock className={styles.line} />
            <SkeletonBlock className={styles.line} />
            <SkeletonBlock className={styles.line} />
          </div>
        ))}
      </div>
    </div>
  );
}
