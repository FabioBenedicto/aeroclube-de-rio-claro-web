import type { ReactNode } from 'react';

type IconVariant = 'default' | 'success' | 'warn' | 'danger';

const iconBg: Record<IconVariant, string> = {
  default: 'bg-bg-sunk text-ink-3',
  success: 'bg-success-soft text-success',
  warn:    'bg-warn-soft text-warn',
  danger:  'bg-danger-soft text-danger',
};

const valueColor: Record<string, string> = {
  default: '',
  success: 'text-success',
  warn:    'text-warn',
  danger:  'text-danger',
};

interface StatCardProps {
  icon: ReactNode;
  iconVariant?: IconVariant;
  label: string;
  value: string;
  prefix?: string;
  valueVariant?: string;
}

export default function StatCard({ icon, iconVariant = 'default', label, value, prefix, valueVariant = 'default' }: StatCardProps) {
  return (
    <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-[8px] grid place-items-center shrink-0 ${iconBg[iconVariant]}`}>
        {icon}
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="text-[12px] text-ink-3 font-medium">{label}</div>
        <div className={`text-[20px] font-bold tracking-tight font-mono ${valueColor[valueVariant] ?? ''}`}>
          {prefix && <span className="text-[13px] font-medium mr-0.5">{prefix}</span>}
          {value}
        </div>
      </div>
    </div>
  );
}
