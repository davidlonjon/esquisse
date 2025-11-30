type EdgeFadePosition = 'top' | 'bottom';

interface HUDEdgeFadeProps {
  position: EdgeFadePosition;
}

export function HUDEdgeFade({ position }: HUDEdgeFadeProps) {
  const gradientDirection = position === 'top' ? 'bg-gradient-to-b' : 'bg-gradient-to-t';

  return (
    <div
      className={`pointer-events-none fixed left-0 right-0 ${position}-0 z-10 h-12 ${gradientDirection} from-background to-transparent`}
    />
  );
}
