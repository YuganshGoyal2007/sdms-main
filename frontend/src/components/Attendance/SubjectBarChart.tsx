import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import type { SubjectAttendanceSummary } from '../../types/types';

const colorForPercentage = (p: number) => {
  if (p >= 75) return '#059669';
  if (p >= 60) return '#d97706';
  return '#dc2626';
};

interface Props {
  data: SubjectAttendanceSummary[];
}

const SubjectBarChart = ({ data }: Props) => {
  if (!data.length) {
    return (
      <div className="text-center py-6 text-sm text-gray-500">
        No attendance data yet.
      </div>
    );
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="subjectCode"
            tick={{ fontSize: 11 }}
            interval={0}
            angle={-15}
            textAnchor="end"
            height={50}
          />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload as SubjectAttendanceSummary;
                return (
                  <div className="bg-white border border-[#d9d9d9] rounded-lg shadow-md p-3 text-sm">
                    <div className="font-semibold">{d.subjectName}</div>
                    <div className="text-xs text-gray-500 mb-1">{d.subjectCode} · Sem {d.semester ?? '—'}</div>
                    <div>Attendance: <span className="font-semibold">{d.percentage}%</span></div>
                    <div className="text-xs text-gray-500">
                      Present {d.present} / Absent {d.absent} / Excused {d.excused} / Total {d.total}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={colorForPercentage(entry.percentage)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SubjectBarChart;
