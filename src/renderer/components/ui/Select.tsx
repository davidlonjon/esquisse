import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@lib/utils';

const selectVariants = cva('select', {
  variants: {
    variant: {
      default: 'select-bordered',
      ghost: 'select-ghost',
    },
    size: {
      default: 'select-md',
      lg: 'select-lg',
      sm: 'select-sm',
      xs: 'select-xs',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    VariantProps<typeof selectVariants> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <select className={cn(selectVariants({ variant, size, className }))} ref={ref} {...props}>
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';

export { Select };
