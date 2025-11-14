import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@lib/utils';

const inputVariants = cva('input', {
  variants: {
    variant: {
      default: 'input-bordered',
      ghost: 'input-ghost',
    },
    size: {
      default: 'input-md',
      lg: 'input-lg',
      sm: 'input-sm',
      xs: 'input-xs',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <input className={cn(inputVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Input.displayName = 'Input';

export { Input };
