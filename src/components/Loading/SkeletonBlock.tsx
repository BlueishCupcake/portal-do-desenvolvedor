import skeletonStyles from '@/components/Loading/skeleton.module.css';

interface SkeletonBlockProps {
  className?: string;
  width?: string;
  height?: string;
  borderRadius?: string;
}

export function SkeletonBlock({
  className,
  width,
  height,
  borderRadius,
}: SkeletonBlockProps) {
  return (
    <div
      className={[skeletonStyles.block, className].filter(Boolean).join(' ')}
      style={{ width, height, borderRadius }}
      aria-hidden="true"
    />
  );
}
