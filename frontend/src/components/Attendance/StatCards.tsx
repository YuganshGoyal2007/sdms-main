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
    </div>
  );
};

export default StatCards;
