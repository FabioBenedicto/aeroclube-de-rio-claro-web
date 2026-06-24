import { type HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export default function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('bg-bg-elev border border-line rounded-lg', className)} {...props}>
      {children}
    </div>
  );
}
