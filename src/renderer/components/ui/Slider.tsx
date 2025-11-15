import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@lib/utils';

const sliderVariants = cva('range', {
  variants: {
    variant: {
      default: 'range-primary',
      secondary: 'range-secondary',
      accent: 'range-accent',
    },
    size: {
      default: 'range-md',
      lg: 'range-lg',
      sm: 'range-sm',
      xs: 'range-xs',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

export interface SliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof sliderVariants> {}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <input
        type="range"
        className={cn(sliderVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Slider.displayName = 'Slider';

export { Slider };
