import { forwardRef } from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../utils/cn';

type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>;

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, ...props }, ref) => (
    <span className="relative inline-flex w-4 h-4 flex-shrink-0">
      <input
        ref={ref}
        type="checkbox"
        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer peer"
        checked={checked}
        {...props}
      />
      <span
        className={cn(
          'absolute inset-0 rounded border-[1.5px] transition-colors',
          'flex items-center justify-center pointer-events-none',
          'border-line-strong bg-bg-elev',
          'peer-checked:bg-accent peer-checked:border-accent',
          'peer-focus-visible:shadow-[0_0_0_3px_var(--focus)]',
          'peer-disabled:opacity-50',
          className,
        )}
      >
        <Check
          size={10}
          className={cn('text-white transition-opacity', checked ? 'opacity-100' : 'opacity-0')}
          strokeWidth={2.5}
        />
      </span>
    </span>
  ),
);

Checkbox.displayName = 'Checkbox';
export default Checkbox;
