interface ProgressBarProps {
  pct: number;
  isPaid: boolean;
}

export default function ProgressBar({ pct, isPaid }: ProgressBarProps) {
  const fillColor = isPaid ? 'var(--success)' : pct > 0 ? 'var(--warn)' : 'var(--line)';
  const textColor = isPaid ? 'var(--success)' : pct > 0 ? 'var(--warn)' : 'var(--ink-3)';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-bg-sunk rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: fillColor, transition: 'width 0.3s' }} />
      </div>
      <span className="font-mono text-[11px] min-w-[32px] text-right" style={{ color: textColor }}>{pct}%</span>
    </div>
  );
}
