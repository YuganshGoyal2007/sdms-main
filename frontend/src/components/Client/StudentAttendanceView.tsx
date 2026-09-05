import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../context/app/store";
import { getStudentAttendanceSummary } from "../../lib/attendance.api";
import type { StudentAttendanceSummaryResponse } from "../../types/types";
import { BookOpen, CheckCircle, XCircle, Clock, PieChart, RefreshCw, BarChart2 } from "lucide-react";

export const StudentAttendanceView: React.FC = () => {
    const studentObj = useSelector((state: RootState) => state.user.student);
    const userObj = useSelector((state: RootState) => (state.user as any).user);
    const [data, setData] = useState<StudentAttendanceSummaryResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const rollNo = studentObj?.rollNo || studentObj?.enrollmentNo || userObj?.username || "me";

    const fetchAttendance = async () => {
        setLoading(true);
        setError(null);
        try {
            const summary = await getStudentAttendanceSummary(rollNo);
            setData(summary);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to load attendance summary.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, [rollNo]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-gray-500 font-medium">Loading your attendance data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl max-w-2xl mx-auto my-8">
                <h3 className="text-lg font-bold mb-2">Unable to Load Attendance</h3>
                <p className="text-sm mb-4">{error}</p>
                <button
                    onClick={fetchAttendance}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition"
                >
                    <RefreshCw className="w-4 h-4" /> Try Again
                </button>
            </div>
        );
    }

    const overall = data?.overall || { total: 0, present: 0, absent: 0, excused: 0, percentage: 0 };
    const subjects = data?.subjects || [];
    const recent = data?.recentSessions || [];

    const getStatusColor = (pct: number) => {
        if (pct >= 75) return "text-emerald-600 bg-emerald-50 border-emerald-200";
        if (pct >= 65) return "text-amber-600 bg-amber-50 border-amber-200";
        return "text-rose-600 bg-rose-50 border-rose-200";
    };

    const getBarColor = (pct: number) => {
        if (pct >= 75) return "bg-gradient-to-r from-emerald-500 to-teal-500";
        if (pct >= 65) return "bg-gradient-to-r from-amber-400 to-orange-500";
        return "bg-gradient-to-r from-rose-500 to-red-600";
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <PieChart className="w-7 h-7 text-indigo-600" />
                        Semester Attendance Analytics
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Track subject-wise attendance performance and ongoing semester statistics
                    </p>
                </div>
                <button
                    onClick={fetchAttendance}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-semibold rounded-xl hover:bg-indigo-100 transition self-start sm:self-auto"
                >
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {/* Overview Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Overall Attendance</p>
                        <p className={`text-3xl font-extrabold mt-2 ${overall.percentage >= 75 ? 'text-emerald-600' : overall.percentage >= 65 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {overall.percentage}%
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{overall.present} present out of {overall.total}</p>
                    </div>
                    <div className={`p-4 rounded-2xl border ${getStatusColor(overall.percentage)}`}>
                        <BarChart2 className="w-8 h-8" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Classes Attended</p>
                        <p className="text-3xl font-extrabold text-gray-900 mt-2">{overall.present}</p>
                        <p className="text-xs text-gray-400 mt-1">Sessions attended</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Absences</p>
                        <p className="text-3xl font-extrabold text-rose-600 mt-2">{overall.absent}</p>
                        <p className="text-xs text-gray-400 mt-1">Classes missed</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
                        <XCircle className="w-8 h-8" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Excused</p>
                        <p className="text-3xl font-extrabold text-blue-600 mt-2">{overall.excused}</p>
                        <p className="text-xs text-gray-400 mt-1">Approved leaves</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
                        <Clock className="w-8 h-8" />
                    </div>
                </div>
            </div>

            {/* Subject Breakdown & Visual Progress */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    Subject-wise Attendance & Analytics
                </h2>

                {subjects.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        No subject attendance records found for this semester.
                    </div>
                ) : (
                    <div className="space-y-6">
                        {subjects.map((sub) => (
                            <div key={sub.subjectId} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                        <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-700 mr-2">
                                            {sub.subjectCode || `SUB-${sub.subjectId}`}
                                        </span>
                                        <span className="font-semibold text-gray-900">{sub.subjectName}</span>
                                        {sub.type && (
                                            <span className="text-xs text-gray-500 capitalize ml-2">({sub.type})</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs text-gray-500">
                                            {sub.present}/{sub.total} sessions
                                        </span>
                                        <span className={`text-sm font-extrabold px-3 py-1 rounded-full border ${getStatusColor(sub.percentage)}`}>
                                            {sub.percentage}%
                                        </span>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${getBarColor(sub.percentage)}`}
                                        style={{ width: `${Math.min(100, Math.max(0, sub.percentage))}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Sessions */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    Recent Attendance Logs
                </h2>

                {recent.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No recent attendance sessions logged.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                <tr>
                                    <th className="py-3 px-4">Date</th>
                                    <th className="py-3 px-4">Subject</th>
                                    <th className="py-3 px-4">Type</th>
                                    <th className="py-3 px-4">Topic</th>
                                    <th className="py-3 px-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {recent.map((s) => (
                                    <tr key={s.sessionId} className="hover:bg-gray-50/80 transition">
                                        <td className="py-3.5 px-4 font-medium text-gray-900">{s.date}</td>
                                        <td className="py-3.5 px-4">
                                            <span className="font-semibold text-gray-800">{s.subjectName || `Subject #${s.subjectId}`}</span>
                                            {s.subjectCode && <span className="text-xs text-gray-400 block">{s.subjectCode}</span>}
                                        </td>
                                        <td className="py-3.5 px-4 capitalize">{s.sessionType}</td>
                                        <td className="py-3.5 px-4 text-gray-500">{s.topic || "N/A"}</td>
                                        <td className="py-3.5 px-4 text-right">
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${
                                                s.status === 'present' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                s.status === 'absent' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                s.status === 'excused' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                'bg-gray-50 text-gray-600 border-gray-200'
                                            }`}>
                                                {s.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentAttendanceView;
