import { cn } from '../../utils/cn';

interface BlockProps {
  className?: string;
  style?: React.CSSProperties;
}

function Block({ className, style }: BlockProps) {
  return <div className={cn('skeleton', className)} style={style} />;
}

function Text({ className, width = 'w-32' }: { className?: string; width?: string }) {
  return <Block className={cn('h-[13px]', width, className)} />;
}

function Title({ className, width = 'w-48' }: { className?: string; width?: string }) {
  return <Block className={cn('h-[22px]', width, className)} />;
}

function Avatar({ size = 36 }: { size?: number }) {
  return <Block className="rounded-full shrink-0" style={{ width: size, height: size }} />;
}

function TableRows({ cols, rows = 5 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-line">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-3.5 py-3">
              <Block className={`h-[13px] ${j === 0 ? 'w-36' : j === cols - 1 ? 'w-16 ml-auto' : 'w-24'}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function Card({ className }: { className?: string }) {
  return <Block className={cn('h-[72px] rounded-lg', className)} />;
}

const Skeleton = { Block, Text, Title, Avatar, TableRows, Card };
export default Skeleton;
