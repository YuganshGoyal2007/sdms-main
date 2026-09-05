<<<<<<< HEAD
import type { AttendanceRosterStudent, AttendanceStatus } from "../../types/types";
import { CheckCircle2, XCircle, UserRound } from "lucide-react";

export type RecordMap = Map<number, { status: AttendanceStatus | null; remarks: string }>;

const statusBtn = (active: boolean, kind: AttendanceStatus) => {
  const base = "px-2 py-1 text-[11px] rounded border transition-colors cursor-pointer flex items-center gap-1 ";
  if (!active) return base + "bg-white text-gray-500 border-[#d9d9d9] hover:border-gray-400";
  if (kind === "present") return base + "bg-green-600 text-white border-green-600";
  if (kind === "absent") return base + "bg-red-600 text-white border-red-600";
  return base + "bg-indigo-600 text-white border-indigo-600";
};

const RosterTable = ({
  students,
  records,
  onSet,
  onBulk,
  onRemarks,
  disabled,
}: {
  students: AttendanceRosterStudent[];
  records: RecordMap;
  onSet: (studentId: number, status: AttendanceStatus | null) => void;
  onBulk: (status: AttendanceStatus | null) => void;
  onRemarks: (studentId: number, remarks: string) => void;
  disabled: boolean;
}) => {
  const counts = {
    present: 0, absent: 0, excused: 0, unmarked: 0,
  };
  students.forEach((s) => {
    const st = records.get(s.id)?.status ?? null;
    if (st === "present") counts.present++;
    else if (st === "absent") counts.absent++;
    else if (st === "excused") counts.excused++;
    else counts.unmarked++;
  });

  return (
    <div>
      {/* Bulk actions + live counters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex flex-wrap gap-2">
          <button disabled={disabled} onClick={() => onBulk("present")} className="px-3 py-1.5 text-xs rounded border border-green-600 text-green-700 hover:bg-green-50 disabled:opacity-40 cursor-pointer">Mark All Present</button>
          <button disabled={disabled} onClick={() => onBulk("absent")} className="px-3 py-1.5 text-xs rounded border border-red-600 text-red-700 hover:bg-red-50 disabled:opacity-40 cursor-pointer">Mark All Absent</button>
          <button disabled={disabled} onClick={() => onBulk(null)} className="px-3 py-1.5 text-xs rounded border border-[#d9d9d9] text-gray-600 hover:bg-gray-50 disabled:opacity-40 cursor-pointer">Reset</button>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-green-100 text-green-800">Present: {counts.present}</span>
          <span className="px-2 py-1 rounded bg-red-100 text-red-800">Absent: {counts.absent}</span>
          <span className="px-2 py-1 rounded bg-indigo-100 text-indigo-800">Excused: {counts.excused}</span>
          <span className="px-2 py-1 rounded bg-gray-100 text-gray-700">Unmarked: {counts.unmarked}</span>
          <span className="px-2 py-1 rounded bg-black text-white">Total: {students.length}</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#d9d9d9] bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#d9d9d9] bg-[#f8f9fa] text-left text-xs text-gray-500">
              <th className="p-3">Photo</th>
              <th className="p-3">Roll No</th>
              <th className="p-3">Student</th>
              <th className="p-3">Status</th>
              <th className="p-3">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500 text-sm">No active students found in this class.</td></tr>
            )}
            {students.map((s) => {
              const rec = records.get(s.id) ?? { status: null, remarks: "" };
              return (
                <tr key={s.id} className="border-b border-[#ececec] last:border-0">
                  <td className="p-2">
                    {s.photo ? (
                      <img
                        src={s.photo.startsWith("data:") || s.photo.startsWith("http") ? s.photo : `data:image/jpeg;base64,${s.photo}`}
                        alt={s.fullName}
                        className="w-9 h-9 rounded-full object-cover border border-[#d9d9d9]"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gray-100 border border-[#d9d9d9] flex items-center justify-center text-gray-400">
                        <UserRound size={16} />
                      </div>
                    )}
                  </td>
                  <td className="p-2 whitespace-nowrap text-xs">{s.rollNo}</td>
                  <td className="p-2">{s.fullName}</td>
                  <td className="p-2">
                    <div className="flex gap-1.5">
                      <button disabled={disabled} onClick={() => onSet(s.id, rec.status === "present" ? null : "present")} className={statusBtn(rec.status === "present", "present")}>
                        <CheckCircle2 size={12} /> Present
                      </button>
                      <button disabled={disabled} onClick={() => onSet(s.id, rec.status === "absent" ? null : "absent")} className={statusBtn(rec.status === "absent", "absent")}>
                        <XCircle size={12} /> Absent
                      </button>
                      <button disabled={disabled} onClick={() => onSet(s.id, rec.status === "excused" ? null : "excused")} className={statusBtn(rec.status === "excused", "excused")}>
                        Excused
                      </button>
                    </div>
                  </td>
                  <td className="p-2">
                    <input
                      disabled={disabled}
                      value={rec.remarks}
                      onChange={(e) => onRemarks(s.id, e.target.value)}
                      placeholder="—"
                      className="w-full min-w-[100px] text-xs border border-[#d9d9d9] rounded px-2 py-1 focus:outline-none focus:border-gray-400"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
=======
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
>>>>>>> 95d01e0 (feat: complete SDMS audit, timetable mapping & viewer, security and database hardening)
    </div>
  );
};

export default RosterTable;
