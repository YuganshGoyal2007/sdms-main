import { ArrowRight, BookOpen, Users, Calendar, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { TeachingClass } from '../../types/types';

interface Props {
  cls: TeachingClass;
  basePath: string;
}

const statusMeta = (status: 'draft' | 'submitted' | 'locked' | null) => {
  if (status === 'draft') return { label: 'Draft', color: 'bg-amber-100 text-amber-800 border-amber-200' };
  if (status === 'submitted') return { label: 'Submitted', color: 'bg-blue-100 text-blue-800 border-blue-200' };
  if (status === 'locked') return { label: 'Locked', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  return { label: 'Not Marked', color: 'bg-gray-100 text-gray-700 border-gray-200' };
};

const buttonMeta = (status: 'draft' | 'submitted' | 'locked' | null) => {
  if (status === 'draft') return { label: 'Continue Attendance', color: 'bg-amber-600 hover:bg-amber-700' };
  if (status === 'submitted' || status === 'locked') return { label: 'View Attendance', color: 'bg-slate-700 hover:bg-slate-800' };
  return { label: 'Start Attendance', color: 'bg-[#7b3b5a] hover:bg-[#5e2a44]' };
};

const classKey = (c: { school: string; department: string; program: string; batch: string; specialization: string }) =>
  [c.school, c.department, c.program, c.batch, c.specialization]
    .map((v) => encodeURIComponent(v))
    .join('|');

const TeachingClassCard = ({ cls, basePath }: Props) => {
  const navigate = useNavigate();
  const sm = statusMeta(cls.todaySession?.status ?? null);
  const bm = buttonMeta(cls.todaySession?.status ?? null);

  const handleClick = () => {
    const ck = classKey(cls);
    const safeBase = basePath && basePath !== '/' ? basePath : '/faculty';
    navigate(`${safeBase}/mark-attendance/${ck}/${cls.subjectId}`);
  };

  return (
    <div className="bg-white border border-[#d9d9d9] rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <BookOpen size={14} />
            <span className="font-mono">{cls.subjectCode || '—'}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mt-1 truncate">{cls.subjectName || 'Untitled subject'}</h3>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full border ${sm.color} font-medium whitespace-nowrap`}>
          {sm.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-[#f8f9fa] rounded-lg px-3 py-2">
          <div className="text-[10px] uppercase text-gray-500 tracking-wider">School</div>
          <div className="font-medium truncate">{cls.school}</div>
        </div>
        <div className="bg-[#f8f9fa] rounded-lg px-3 py-2">
          <div className="text-[10px] uppercase text-gray-500 tracking-wider">Department</div>
          <div className="font-medium truncate">{cls.department}</div>
        </div>
        <div className="bg-[#f8f9fa] rounded-lg px-3 py-2">
          <div className="text-[10px] uppercase text-gray-500 tracking-wider">Program · Batch</div>
          <div className="font-medium truncate">{cls.program} · {cls.batch}</div>
        </div>
        <div className="bg-[#f8f9fa] rounded-lg px-3 py-2">
          <div className="text-[10px] uppercase text-gray-500 tracking-wider">Specialization</div>
          <div className="font-medium truncate">{cls.specialization}</div>
        </div>
        <div className="bg-[#f8f9fa] rounded-lg px-3 py-2">
          <div className="text-[10px] uppercase text-gray-500 tracking-wider">Semester</div>
          <div className="font-medium">{cls.semester}</div>
        </div>
        <div className="bg-[#f8f9fa] rounded-lg px-3 py-2">
          <div className="text-[10px] uppercase text-gray-500 tracking-wider">Academic Year</div>
          <div className="font-medium">{cls.academicYear}</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 border-t border-[#f0f0f0] pt-3">
        <span className="inline-flex items-center gap-1">
          <Layers size={12} />
          {cls.subjectType || 'theory'} · {cls.subjectCredits ?? 0} credits
        </span>
        <span className="inline-flex items-center gap-1">
          <Users size={12} />
          {cls.teacherRole}
        </span>
      </div>

      <button
        onClick={handleClick}
        className={`${bm.color} text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer`}
      >
        <Calendar size={16} />
        {bm.label}
        <ArrowRight size={16} />
      </button>
    </div>
  );
};

export default TeachingClassCard;
