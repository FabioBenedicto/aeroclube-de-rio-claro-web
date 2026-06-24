import { type HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warn' | 'danger' | 'accent' | 'default';
  dot?: boolean;
}

const dotColor: Record<string, string> = {
  success: 'bg-success',
  warn: 'bg-warn',
  danger: 'bg-danger',
  accent: 'bg-accent',
  default: 'bg-ink-4',
};

const variantClass: Record<string, string> = {
  success: 'bg-success-soft text-success',
  warn: 'bg-warn-soft text-warn',
  danger: 'bg-danger-soft text-danger',
  accent: 'bg-accent-soft text-accent-ink',
  default: 'bg-bg-sunk text-ink-3',
};

export default function Badge({ variant = 'default', dot = true, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11.5px] font-medium',
        variantClass[variant],
        className,
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColor[variant])} />}
      {children}
    </span>
  );
}
