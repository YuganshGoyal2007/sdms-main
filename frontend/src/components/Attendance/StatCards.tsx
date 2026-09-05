import { TrendingUp, CheckCircle2, XCircle, FileText, BookOpen } from 'lucide-react';

interface StatItem {
  label: string;
  value: string | number;
  icon: 'trending' | 'check' | 'x' | 'file' | 'book';
  color: string;
  loading?: boolean;
}

const icons = {
  trending: TrendingUp,
  check: CheckCircle2,
  x: XCircle,
  file: FileText,
  book: BookOpen,
};

const StatCards = ({ items }: { items: StatItem[] }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((it) => {
        const Icon = icons[it.icon];
        return (
          <div key={it.label} className="bg-white border border-[#d9d9d9] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg ${it.color}`}>
                <Icon size={18} className="text-white" />
              </div>
              {it.loading ? (
                <div className="h-7 w-12 bg-gray-200 animate-pulse rounded" />
              ) : (
                <div className="text-2xl font-bold text-gray-900">{it.value}</div>
              )}
            </div>
            <div className="mt-3 text-sm text-gray-600">{it.label}</div>
          </div>
        );
      })}
    </div>
  );
};

export default StatCards;
