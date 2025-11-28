/**
 * Tooltip positioning utilities
 */

export type TooltipPosition = 'top' | 'bottom' | 'bottom-left' | 'left' | 'right';

export interface Position {
  top: number;
  left: number;
}

/**
 * Calculate tooltip position relative to a trigger element
 * @param triggerRect - Bounding rectangle of the trigger element
 * @param position - Desired tooltip position
 * @param gap - Gap between tooltip and trigger in pixels (default: 8)
 * @returns Position coordinates for the tooltip
 */
export function calculateTooltipPosition(
  triggerRect: DOMRect,
  position: TooltipPosition,
  gap = 8
): Position {
  switch (position) {
    case 'top':
      return {
        top: triggerRect.top - gap,
        left: triggerRect.left + triggerRect.width / 2,
      };
    case 'bottom':
      return {
        top: triggerRect.bottom + gap,
        left: triggerRect.left + triggerRect.width / 2,
      };
    case 'bottom-left':
      return {
        top: triggerRect.bottom + gap,
        left: triggerRect.left,
      };
    case 'left':
      return {
        top: triggerRect.top + triggerRect.height / 2,
        left: triggerRect.left - gap,
      };
    case 'right':
      return {
        top: triggerRect.top + triggerRect.height / 2,
        left: triggerRect.right + gap,
      };
  }
}
