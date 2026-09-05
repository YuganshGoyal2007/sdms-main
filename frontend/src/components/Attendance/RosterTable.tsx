import { useMemo } from 'react';
import { Check, X, FileText, User } from 'lucide-react';
import type { RosterStudent, AttendanceStatus } from '../../types/types';

interface Props {
  roster: RosterStudent[];
  statuses: Record<number, AttendanceStatus | undefined>;
  remarks: Record<number, string>;
  onStatusChange: (studentId: number, status: AttendanceStatus) => void;
  onRemarkChange: (studentId: number, remark: string) => void;
  disabled?: boolean;
}

const btnBase =
  'inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50';

const photoFromBase64 = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  if (raw.startsWith('data:image')) return raw;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  if (raw.startsWith('/')) return raw;
  if (raw.length > 100) return `data:image/jpeg;base64,${raw}`;
  return null;
};

const RosterTable = ({ roster, statuses, remarks, onStatusChange, onRemarkChange, disabled }: Props) => {
  const sortedRoster = useMemo(() => {
    return [...roster].sort((a, b) => String(a.rollNo).localeCompare(String(b.rollNo), undefined, { numeric: true }));
  }, [roster]);

  if (sortedRoster.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <User className="mx-auto mb-2 text-gray-400" size={32} />
        No students are enrolled in this class.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-[#d9d9d9] rounded-xl bg-white">
      <table className="w-full text-sm">
        <thead className="bg-[#f8f9fa] text-xs uppercase text-gray-600">
          <tr>
            <th className="px-3 py-2 text-left w-16">Photo</th>
            <th className="px-3 py-2 text-left w-24">Roll No</th>
            <th className="px-3 py-2 text-left">Name</th>
            <th className="px-3 py-2 text-center w-24">Present</th>
            <th className="px-3 py-2 text-center w-24">Absent</th>
            <th className="px-3 py-2 text-center w-24">Excused</th>
            <th className="px-3 py-2 text-left w-48">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {sortedRoster.map((s) => {
            const current = statuses[s.studentId];
            const photo = photoFromBase64(s.photo);
            return (
              <tr key={s.studentId} className="border-t border-[#f0f0f0] hover:bg-[#fafafa]">
                <td className="px-3 py-2">
                  <div className="w-9 h-9 rounded-full bg-[#f0f0f0] overflow-hidden flex items-center justify-center">
                    {photo ? (
                      <img src={photo} alt={s.fullName} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <span className="text-gray-500 text-xs font-semibold">
                        {s.fullName?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 font-mono text-xs">{s.rollNo}</td>
                <td className="px-3 py-2">
                  <div className="font-medium text-gray-900 truncate max-w-xs">{s.fullName}</div>
                  {s.studentStatus === 'inactive' && (
                    <div className="text-[10px] text-amber-600">inactive</div>
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onStatusChange(s.studentId, 'present')}
                    aria-label={`Mark ${s.fullName} present`}
                    aria-pressed={current === 'present'}
                    className={`${btnBase} ${current === 'present' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 border-[#d9d9d9] hover:border-emerald-500'}`}
                  >
                    <Check size={12} />
                    Present
                  </button>
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onStatusChange(s.studentId, 'absent')}
                    aria-label={`Mark ${s.fullName} absent`}
                    aria-pressed={current === 'absent'}
                    className={`${btnBase} ${current === 'absent' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-[#d9d9d9] hover:border-red-500'}`}
                  >
                    <X size={12} />
                    Absent
                  </button>
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onStatusChange(s.studentId, 'excused')}
                    aria-label={`Mark ${s.fullName} excused`}
                    aria-pressed={current === 'excused'}
                    className={`${btnBase} ${current === 'excused' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-700 border-[#d9d9d9] hover:border-amber-500'}`}
                  >
                    <FileText size={12} />
                    Excused
                  </button>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    disabled={disabled}
                    value={remarks[s.studentId] || ''}
                    onChange={(e) => onRemarkChange(s.studentId, e.target.value)}
                    maxLength={255}
                    placeholder="—"
                    className="w-full text-xs px-2 py-1.5 border border-[#d9d9d9] rounded-md focus:outline-none focus:ring-1 focus:ring-[#7b3b5a] disabled:bg-gray-50"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default RosterTable;
