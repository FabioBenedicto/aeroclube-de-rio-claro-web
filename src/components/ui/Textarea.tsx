import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] outline-none resize-y min-h-[72px]',
        'focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';
export default Textarea;
