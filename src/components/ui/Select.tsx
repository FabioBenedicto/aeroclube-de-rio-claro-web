import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] outline-none cursor-pointer',
        'focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]',
        className,
      )}
      {...props}
    />
  ),
);
Select.displayName = 'Select';
export default Select;
