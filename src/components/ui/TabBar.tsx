export type Tab = { key: string | undefined; label: string };

interface TabBarProps {
  tabs: Tab[];
  active: string | undefined;
  onChange: (key: string | undefined) => void;
}

export default function TabBar({ tabs, active, onChange }: TabBarProps) {
  return (
    <>
      {tabs.map(t => (
        <button
          key={t.key ?? '__all__'}
          onClick={() => onChange(t.key)}
          className="px-3.5 py-2 text-[13px] font-medium cursor-pointer bg-transparent border-0 border-b-2 whitespace-nowrap"
          style={{
            color: active === t.key ? 'var(--ink)' : 'var(--ink-3)',
            borderBottomColor: active === t.key ? 'var(--accent)' : 'transparent',
            marginBottom: -1,
          }}
        >
          {t.label}
        </button>
      ))}
    </>
  );
}
