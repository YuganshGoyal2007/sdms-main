import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import type { SubjectAttendanceSummary } from "../../types/types";

const SubjectBarChart = ({ subjects }: { subjects: SubjectAttendanceSummary[] }) => {
  const data = subjects.map((s) => ({
    name: s.subjectCode ?? s.subjectName ?? `#${s.subjectId}`,
    pct: s.percentage ?? 0,
  }));

  if (data.length === 0) {
    return <div className="bg-white border border-[#d9d9d9] rounded-lg p-10 text-center text-gray-500 text-sm">No subject-wise attendance yet.</div>;
  }

  return (
    <div className="bg-white border border-[#d9d9d9] rounded-lg shadow-sm p-4 h-72">
      <h2 className="text-sm font-semibold mb-2">Subject-wise Attendance %</h2>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ececec" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v: number) => [`${v}%`, "Attendance"]} />
          <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.pct >= 75 ? "#16a34a" : d.pct >= 50 ? "#f59e0b" : "#dc2626"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SubjectBarChart;
