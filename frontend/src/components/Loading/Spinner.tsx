import { motion } from 'framer-motion';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'cyan' | 'gray';
  className?: string;
}

const sizes = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
  xl: 'h-16 w-16 border-4',
};

const colors = {
  primary: 'border-primary border-t-transparent',
  white: 'border-white border-t-transparent',
  cyan: 'border-cyan-500 border-t-transparent',
  gray: 'border-gray-400 border-t-transparent',
};

export default function Spinner({ size = 'md', color = 'cyan', className = '' }: SpinnerProps) {
  return (
    <motion.div
      className={`inline-block rounded-full ${sizes[size]} ${colors[color]} ${className}`}
      animate={{ rotate: 360 }}
      transition={{
        duration: 0.8,
        repeat: Infinity,
        ease: 'linear',
      }}
      role="status"
      aria-label="Loading"
    />
  );
}

// Button spinner variant
export function ButtonSpinner({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent ${className}`}
      animate={{ rotate: 360 }}
      transition={{
        duration: 0.6,
        repeat: Infinity,
        ease: 'linear',
      }}
      role="status"
      aria-label="Loading"
    />
  );
}

// Full page spinner
export function FullPageSpinner() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-900">
      <div className="text-center">
        <Spinner size="xl" color="cyan" />
        <p className="mt-4 text-gray-400">Loading...</p>
      </div>
    </div>
  );
}
