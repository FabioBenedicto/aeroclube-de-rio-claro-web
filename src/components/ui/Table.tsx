import { type ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface TableColumn<T = any> {
  key: string;
  label: string;
  headerClassName?: string;
  cellClassName?: string;
  stopPropagation?: boolean;
  render: (row: T) => ReactNode;
}

interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  keyField: keyof T;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  isLoading?: boolean;
}

const thCls = 'px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line';
const tdCls = 'px-3.5 py-2.5 border-b border-line';

export default function Table<T>({
  columns,
  data,
  keyField,
  onRowClick,
  emptyMessage = 'No records found.',
  isLoading = false,
}: TableProps<T>) {
  if (isLoading) {
    return <div className="py-8 text-center text-[13px] text-ink-3">Loading…</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} className={cn(thCls, col.headerClassName)}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr
              key={String(row[keyField])}
              className={cn('hover:bg-bg-hover', onRowClick && 'cursor-pointer')}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map(col => (
                <td
                  key={col.key}
                  className={cn(tdCls, col.cellClassName)}
                  onClick={col.stopPropagation ? e => e.stopPropagation() : undefined}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3.5 py-8 text-center text-ink-3">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
