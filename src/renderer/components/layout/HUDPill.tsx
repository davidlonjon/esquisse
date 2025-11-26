interface HUDPillProps {
  label: string;
}

export function HUDPill({ label }: HUDPillProps) {
  return (
    <div className="rounded-full bg-background/70 px-3 py-1 text-xs font-medium text-base-content/60 backdrop-blur-sm">
      {label}
    </div>
  );
}
