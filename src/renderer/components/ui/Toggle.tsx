import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@lib/utils';

const toggleVariants = cva('toggle', {
  variants: {
    variant: {
      default: 'toggle-primary',
      secondary: 'toggle-secondary',
      accent: 'toggle-accent',
    },
    size: {
      default: '',
      lg: 'toggle-lg',
      sm: 'toggle-sm',
      xs: 'toggle-xs',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

export interface ToggleProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof toggleVariants> {}

const Toggle = React.forwardRef<HTMLInputElement, ToggleProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        className={cn(toggleVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Toggle.displayName = 'Toggle';

export { Toggle };
