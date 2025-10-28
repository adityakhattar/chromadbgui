import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: boolean;
}

export default function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = true,
}: SkeletonProps) {
  const baseClasses = 'bg-zinc-800';

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  if (animation) {
    return (
      <motion.div
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        style={style}
        animate={{
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        role="status"
        aria-label="Loading"
      />
    );
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className} animate-pulse`}
      style={style}
      role="status"
      aria-label="Loading"
    />
  );
}

// Predefined skeleton variants
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-lg border border-white/10 bg-zinc-800 p-6 ${className}`}>
      <Skeleton variant="text" height={24} width="60%" className="mb-4" />
      <Skeleton variant="text" height={16} width="100%" className="mb-2" />
      <Skeleton variant="text" height={16} width="90%" className="mb-2" />
      <Skeleton variant="text" height={16} width="80%" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, className = '' }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex gap-4 border-b border-white/10 pb-3">
        <Skeleton variant="text" height={16} width="25%" />
        <Skeleton variant="text" height={16} width="25%" />
        <Skeleton variant="text" height={16} width="25%" />
        <Skeleton variant="text" height={16} width="25%" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton variant="text" height={20} width="25%" />
          <Skeleton variant="text" height={20} width="25%" />
          <Skeleton variant="text" height={20} width="25%" />
          <Skeleton variant="text" height={20} width="25%" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ items = 5, className = '' }: { items?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="rounded-lg border border-white/10 bg-zinc-800 p-4 flex items-center gap-4">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" height={20} width="40%" />
            <Skeleton variant="text" height={16} width="60%" />
          </div>
        </div>
      ))}
    </div>
  );
}
