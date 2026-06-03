import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'default' | 'secondary' | 'ghost' | 'danger' | 'icon';
  size?: 'sm';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          variant === 'icon'
            ? 'inline-flex items-center justify-center w-7 h-7 rounded-[5px] border-0 bg-transparent text-ink-3 cursor-pointer hover:bg-bg-hover hover:text-ink'
            : variant === 'ghost'
            ? 'inline-flex items-center gap-1.5 rounded-md text-[13px] font-medium border-0 bg-transparent cursor-pointer text-ink-2 hover:bg-bg-hover hover:text-ink [&_svg]:w-3.5 [&_svg]:h-3.5 whitespace-nowrap px-2.5 py-1.5'
            : [
                'inline-flex items-center gap-1.5 rounded-md text-[13px] font-medium border cursor-pointer transition-[background,border-color,opacity] duration-[80ms] whitespace-nowrap',
                '[&_svg]:w-3.5 [&_svg]:h-3.5',
                size === 'sm' ? 'px-2.5 py-1' : 'px-3 py-1.5',
                variant === 'primary'   && 'bg-accent border-accent text-white hover:opacity-90',
                variant === 'secondary' && 'bg-bg-elev text-ink-2 border-line hover:bg-bg-hover hover:text-ink hover:border-line-strong',
                variant === 'default'   && 'bg-bg-elev text-ink-2 border-line hover:bg-bg-hover hover:text-ink hover:border-line-strong',
                variant === 'danger'    && 'text-danger border-danger-soft bg-bg-elev hover:bg-danger-soft',
              ],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
export default Button;
