import { Spinner, Text } from '@poliedro/tamentai/web';

import styles from '@/components/Loading/DashboardSkeleton.module.css';

interface DashboardSkeletonProps {
  compact?: boolean;
}

export function DashboardSkeleton({ compact = false }: DashboardSkeletonProps) {
  return (
    <div
      className={compact ? styles.compact : styles.wrapper}
      role="status"
      aria-live="polite"
      aria-label="Carregando tarefas"
    >
      <Spinner
        size={compact ? 'sm' : 'md'}
        label="Carregando tarefas..."
        showLabel={false}
      />
      <Text color="muted">Carregando tarefas...</Text>
    </div>
  );
}
