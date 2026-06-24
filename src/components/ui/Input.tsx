import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] outline-none',
        'focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]',
        '[&[type=date]]:cursor-text [&[type=datetime-local]]:cursor-text',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
export default Input;
