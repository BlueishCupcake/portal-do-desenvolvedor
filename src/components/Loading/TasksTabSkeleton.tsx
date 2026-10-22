import { SkeletonBlock } from '@/components/Loading/SkeletonBlock.tsx';
import styles from '@/components/Loading/TasksTabSkeleton.module.css';

const ROW_COUNT = 6;

interface TasksTabSkeletonProps {
  compact?: boolean;
}

export function TasksTabSkeleton({ compact = false }: TasksTabSkeletonProps) {
  if (compact) {
    return (
      <div className={styles.compact} role="status" aria-live="polite" aria-label="Carregando tarefas">
        <span className={styles.message}>Carregando tarefas...</span>
        <SkeletonBlock className={styles.compactLineWide} />
        <SkeletonBlock className={styles.compactLineMedium} />
        <SkeletonBlock className={styles.compactLine} />
        <SkeletonBlock className={styles.compactLine} />
        <SkeletonBlock className={styles.compactLineMedium} />
      </div>
    );
  }

  return (
    <div className={styles.wrapper} role="status" aria-live="polite" aria-label="Carregando tarefas">
      <span className={styles.message}>Carregando tarefas...</span>
      <div className={styles.toolbar} aria-hidden="true">
        <SkeletonBlock className={styles.search} />
        <SkeletonBlock className={styles.filter} />
        <SkeletonBlock className={styles.filter} />
        <SkeletonBlock className={styles.filter} />
        <SkeletonBlock className={styles.sort} />
      </div>
      <div className={styles.tableWrap} aria-hidden="true">
        <div className={styles.headerRow}>
          {Array.from({ length: 8 }, (_, index) => (
            <SkeletonBlock key={`head-${index}`} className={styles.headerCell} />
          ))}
        </div>
        {Array.from({ length: ROW_COUNT }, (_, rowIndex) => (
          <div key={rowIndex} className={styles.bodyRow}>
            <SkeletonBlock className={styles.cellShort} />
            <SkeletonBlock className={styles.cellTall} />
            <SkeletonBlock className={styles.cellBadge} />
            <SkeletonBlock className={styles.cellShort} />
            <SkeletonBlock className={styles.cellShort} />
            <SkeletonBlock className={styles.cellShort} />
            <SkeletonBlock className={styles.cellShort} />
            <SkeletonBlock className={styles.cellBadge} />
          </div>
        ))}
      </div>
    </div>
  );
}
