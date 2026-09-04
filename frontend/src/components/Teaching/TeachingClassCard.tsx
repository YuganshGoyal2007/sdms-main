import type { TeachingClass } from "../../types/types";
import { ClipboardCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

const statusStyles: Record<string, string> = {
  draft: "bg-amber-100 text-amber-800 border-amber-200",
  locked: "bg-green-100 text-green-800 border-green-200",
  submitted: "bg-green-100 text-green-800 border-green-200",
};

const todayStatus = (c: TeachingClass): { label: string; cls: string } => {
  if (!c.todaySessions?.length) return { label: "Not Marked", cls: "bg-gray-100 text-gray-600 border-gray-200" };
  const worst = c.todaySessions.some((s) => s.status === "draft")
    ? "draft"
    : c.todaySessions.some((s) => s.status === "locked" || s.status === "submitted")
      ? "locked"
      : "draft";
  return { label: worst === "draft" ? "Draft" : "Locked", cls: statusStyles[worst] };
};

const TeachingClassCard = ({ cls, basePath }: { cls: TeachingClass; basePath: string }) => {
  const navigate = useNavigate();
  const st = todayStatus(cls);
  const hasDraft = cls.todaySessions?.some((s) => s.status === "draft");
  const isLocked = cls.todaySessions?.some((s) => s.status === "locked" || s.status === "submitted");

  const label = isLocked ? "View Attendance" : hasDraft ? "Continue Attendance" : "Start Attendance";

  return (
    <div className="bg-white border border-[#d9d9d9] rounded-lg shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-base">{cls.subjectName ?? `Subject #${cls.subjectId}`}</h2>
          <p className="text-xs text-gray-500">{cls.subjectCode ?? "—"} · {cls.subjectType ?? "theory"}</p>
        </div>
        <span className={`text-[11px] px-2 py-1 rounded-full border whitespace-nowrap ${st.cls}`}>{st.label}</span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
        <span>School: <b>{cls.school}</b></span>
        <span>Dept: <b>{cls.department}</b></span>
        <span>Program: <b>{cls.program}</b></span>
        <span>Batch: <b>{cls.batch}</b></span>
        <span>Spec: <b>{cls.specialization}</b></span>
        <span>Sem: <b>{cls.semester}</b></span>
        <span className="col-span-2">AY: <b>{cls.academicYear}</b> · Students: <b>{cls.totalStudents}</b></span>
      </div>

      <button
        onClick={() => navigate(`${basePath}/mark-attendance/${encodeURIComponent(cls.classKey)}/${cls.subjectId}`)}
        className="mt-auto flex items-center justify-center gap-2 px-3 py-1.5 text-sm bg-black text-white rounded hover:bg-gray-800 transition-colors cursor-pointer"
      >
        <ClipboardCheck size={15} /> {label}
      </button>
    </div>
  );
};

export default TeachingClassCard;
