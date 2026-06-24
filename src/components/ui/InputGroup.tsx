import { type ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface InputGroupProps {
  prefix?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function InputGroup({ prefix, children, className }: InputGroupProps) {
  return (
    <div className={cn('flex items-center border border-line rounded-md overflow-hidden', className)}>
      {prefix && (
        <span className="px-2 bg-bg-sunk text-ink-3 text-[12.5px] h-full flex items-center border-r border-line whitespace-nowrap self-stretch">
          {prefix}
        </span>
      )}
      <div className="flex-1 [&_input]:border-0 [&_input]:rounded-none">{children}</div>
    </div>
  );
}
