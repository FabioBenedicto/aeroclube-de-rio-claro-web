import { type HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'aluno' | 'socio' | 'instrutor' | 'funcionario' | 'student' | 'partner' | 'instructor' | 'employee' | 'airplane' | 'default';
}

const variantClass: Record<string, string> = {
  aluno: 'bg-bg-sunk text-ink-3 border-line',
  student: 'bg-bg-sunk text-ink-3 border-line',
  airplane: 'bg-bg-sunk text-ink-3 border-line',
  socio: 'bg-bg-sunk text-ink-3 border-line',
  partner: 'bg-bg-sunk text-ink-3 border-line',
  instrutor: 'bg-bg-sunk text-ink-3 border-line',
  instructor: 'bg-bg-sunk text-ink-3 border-line',
  funcionario: 'bg-bg-sunk text-ink-3 border-line',
  employee: 'bg-bg-sunk text-ink-3 border-line',
  default: 'bg-bg-sunk text-ink-3 border-line',
};

export default function Chip({ variant = 'default', className, children, ...props }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-px rounded-[3px] text-[11px] font-medium border',
        variantClass[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
