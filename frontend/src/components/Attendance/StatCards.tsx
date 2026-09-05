<<<<<<< HEAD
import { Percent, CheckCircle2, XCircle, BookOpen } from "lucide-react";

const StatCards = ({
  percentage, present, absent, subjects,
}: { percentage: number | null; present: number; absent: number; subjects: number }) => {
  const cards = [
    { label: "Overall Attendance", value: percentage === null ? "—" : `${percentage}%`, icon: <Percent size={16} />, accent: "text-indigo-600" },
    { label: "Present Days", value: String(present), icon: <CheckCircle2 size={16} />, accent: "text-green-600" },
    { label: "Absent Days", value: String(absent), icon: <XCircle size={16} />, accent: "text-red-600" },
    { label: "Subjects Tracked", value: String(subjects), icon: <BookOpen size={16} />, accent: "text-gray-700" },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="bg-white border border-[#d9d9d9] rounded-lg shadow-sm p-4">
          <div className={`flex items-center gap-1.5 text-xs text-gray-500 ${c.accent}`}>{c.icon} {c.label}</div>
          <div className="text-2xl font-bold mt-1">{c.value}</div>
        </div>
      ))}
=======
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
>>>>>>> 95d01e0 (feat: complete SDMS audit, timetable mapping & viewer, security and database hardening)
    </div>
  );
};

export default StatCards;
