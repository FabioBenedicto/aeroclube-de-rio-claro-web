import { type HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'aluno' | 'socio' | 'instrutor' | 'funcionario' | 'student' | 'partner' | 'instructor' | 'employee' | 'default';
}

const variantClass: Record<string, string> = {
  aluno: 'bg-accent-soft text-accent-ink border-transparent',
  student: 'bg-accent-soft text-accent-ink border-transparent',
  socio: 'bg-success-soft text-success border-transparent',
  partner: 'bg-success-soft text-success border-transparent',
  instrutor: 'bg-warn-soft text-warn border-transparent',
  instructor: 'bg-warn-soft text-warn border-transparent',
  funcionario: 'bg-danger-soft text-danger border-transparent',
  employee: 'bg-danger-soft text-danger border-transparent',
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
