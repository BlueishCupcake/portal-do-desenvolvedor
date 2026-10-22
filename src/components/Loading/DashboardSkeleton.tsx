import { TasksTabSkeleton } from '@/components/Loading/TasksTabSkeleton.tsx';

interface DashboardSkeletonProps {
  compact?: boolean;
}

export function DashboardSkeleton({ compact = false }: DashboardSkeletonProps) {
  return <TasksTabSkeleton compact={compact} />;
}
