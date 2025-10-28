import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  showLabel?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
}

const colors = {
  primary: 'bg-cyan-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
};

const sizes = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export default function ProgressBar({
  progress,
  className = '',
  showLabel = false,
  color = 'primary',
  size = 'md',
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="mb-2 flex justify-between text-sm text-gray-400">
          <span>Progress</span>
          <span>{Math.round(clampedProgress)}%</span>
        </div>
      )}
      <div className={`w-full overflow-hidden rounded-full bg-zinc-800 ${sizes[size]}`}>
        <motion.div
          className={`${sizes[size]} ${colors[color]} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{
            duration: 0.3,
            ease: 'easeOut',
          }}
        />
      </div>
    </div>
  );
}

// Indeterminate progress bar (for unknown progress)
export function IndeterminateProgress({
  className = '',
  color = 'primary',
  size = 'md',
}: {
  className?: string;
  color?: 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <div className={`w-full overflow-hidden rounded-full bg-zinc-800 ${sizes[size]} ${className}`}>
      <motion.div
        className={`${sizes[size]} w-1/3 ${colors[color]} rounded-full`}
        animate={{
          x: ['-100%', '400%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

// Circular progress
export function CircularProgress({
  progress,
  size = 60,
  strokeWidth = 4,
  color = 'primary',
  showLabel = true,
  className = '',
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: 'primary' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  className?: string;
}) {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (clampedProgress / 100) * circumference;

  const strokeColors = {
    primary: '#06b6d4',
    success: '#22c55e',
    warning: '#eab308',
    error: '#ef4444',
  };

  return (
    <div className={`relative inline-flex ${className}`} style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#27272a"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColors[color]}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-white">{Math.round(clampedProgress)}%</span>
        </div>
      )}
    </div>
  );
}
