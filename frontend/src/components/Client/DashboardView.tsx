import {
  CheckCircle,
  AlertCircle,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
// import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DashboardViewProps {
  setActiveView: (view: string) => void;
}

export function DashboardView({ setActiveView }: DashboardViewProps) {
  const [showGraph, setShowGraph] = useState(false);

  const cgpaData = [
    {
      year: "1st Year",
      cgpa: 8.2,
    },
    {
      year: "2nd Year",
      cgpa: 8.5,
    },
    {
      year: "3rd Year",
      cgpa: 8.8,
    },
    {
      year: "4th Year",
      cgpa: 9.1,
    },
  ];

  const registrationStatus = [
    {
      semester: "Semester 7",
      status: "completed",
      date: "Aug 2025",
    },
    {
      semester: "Semester 8",
      status: "pending",
      date: "Due: Jan 25, 2026",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Profile Header with Academic Performance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 md:p-6">
        <div className="flex items-start gap-4 md:gap-6 flex-wrap lg:flex-nowrap">
          <div className="flex items-start gap-4 md:gap-6 flex-1 min-w-0 flex-wrap sm:flex-nowrap">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-[#faf7f9] rounded-xl flex items-center justify-center shrink-0 border border-[#e5d5df]">
              <span className="text-[#7b3b5a] text-2xl md:text-3xl font-medium">
                AR
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
                Aman Rai
              </h1>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-3 md:mt-4">
                <div>
                  <p className="text-xs text-gray-500">Enrollment No.</p>
                  <p className="font-medium text-gray-900 text-sm md:text-base">
                    EN2021CS1045
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Roll Number</p>
                  <p className="font-medium text-gray-900 text-sm md:text-base">
                    235UCD010
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Course</p>
                  <p className="font-medium text-gray-900 text-sm md:text-base">
                    B.Tech CSE
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Specialization</p>
                  <p className="font-medium text-gray-900 text-sm md:text-base">
                    Data Science
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* <div className="flex gap-3 md:gap-4 w-full lg:w-auto lg:shrink-0">
            <div className="flex-1 lg:w-40 p-3 md:p-4 bg-[#faf7f9] rounded-lg text-center border border-[#e5d5df]">
              <p className="text-xs text-gray-600 mb-1">Cumulative CGPA</p>
              <p className="text-2xl md:text-3xl font-semibold text-[#7b3b5a]">
                8.65
              </p>
            </div>
            <div className="flex-1 lg:w-40 p-3 md:p-4 bg-green-50 rounded-lg text-center border border-green-100">
              <p className="text-xs text-gray-600 mb-1">Current Sem CGPA</p>
              <p className="text-2xl md:text-3xl font-semibold text-green-700">
                9.1
              </p>
            </div>
          </div> */}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Registration Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Registration Status</h2>
            <button
              onClick={() => setActiveView("registration")}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-[#7b3b5a] hover:bg-[#faf7f9] rounded-lg transition-colors cursor-pointer"
            >
              See More
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            {registrationStatus.map((reg, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200"
              >
                <div>
                  <h3 className="font-medium text-gray-900">{reg.semester}</h3>
                  <p className="text-sm text-gray-500 mt-1">{reg.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  {reg.status === "completed" ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-700">
                        Completed
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-700">
                        Pending
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Professional Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Professional Status</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Internship Status</h3>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">
                Tech Mahindra • Software Development
              </p>
              <p className="text-xs text-gray-500 mt-1">
                June 2025 - Aug 2025 (Completed)
              </p>
            </div>
            <div className="p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Placement Status</h3>
                <span className="px-2 py-1 bg-[#faf7f9] text-[#7b3b5a] text-xs rounded">
                  Registered
                </span>
              </div>
              <p className="text-sm text-gray-600">Placement Drive 2025-26</p>
              <p className="text-xs text-gray-500 mt-1">
                5 companies applied • 2 interviews scheduled
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Academic Progress */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Academic Progress</h2>
            <p className="text-sm text-gray-500 mt-1">
              Year-wise CGPA Overview
            </p>
          </div>
          <button
            onClick={() => setShowGraph(!showGraph)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer ${showGraph
                ? "bg-[#7b3b5a] text-white hover:bg-[#643048]"
                : "bg-[#faf7f9] text-[#7b3b5a] hover:bg-[#f3edf1]"
              }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm font-medium">
              {showGraph ? "Hide Graph" : "View Graph"}
            </span>
          </button>
        </div>
        <div className="p-6">
          {showGraph ? (
            <div className="space-y-6">
              <div className="w-full h-80 min-h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cgpaData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="year"
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      stroke="#9ca3af"
                    />
                    <YAxis
                      domain={[7, 10]}
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      stroke="#9ca3af"
                      label={{
                        value: "CGPA",
                        angle: -90,
                        position: "insideLeft",
                        style: { fill: "#6b7280" },
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        padding: "8px 12px",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="cgpa"
                      stroke="#7b3b5a"
                      strokeWidth={3}
                      dot={{ fill: "#7b3b5a", r: 5 }}
                      activeDot={{ r: 7 }}
                      name="Yearly GPA"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="pt-6 border-t border-gray-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {cgpaData.map((year, index) => (
                    <div key={index} className="text-center">
                      <div className="mb-3">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#faf7f9] border-4 border-[#e5d5df]">
                          <span className="text-2xl font-semibold text-[#7b3b5a]">
                            {year.cgpa}
                          </span>
                        </div>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-2">
                        {year.year}
                      </h3>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {cgpaData.map((year, index) => (
                <div key={index} className="text-center">
                  <div className="mb-3">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#faf7f9] border-4 border-[#e5d5df]">
                      <span className="text-2xl font-semibold text-[#7b3b5a]">
                        {year.cgpa}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    {year.year}
                  </h3>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              Cumulative CGPA:{" "}
              <span className="text-2xl font-semibold text-gray-900 ml-2">
                8.65
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
