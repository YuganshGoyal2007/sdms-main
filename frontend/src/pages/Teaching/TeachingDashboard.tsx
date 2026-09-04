import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../context/app/store";
import { getMyClasses } from "../../lib/attendance.api";
import type { TeachingClass } from "../../types/types";
import TeachingClassCard from "../../components/Teaching/TeachingClassCard";

const TeachingDashboard = () => {
  const user = useSelector((state: RootState) => state.admin);
  const role = user?.role ?? "faculty";
  const basePath = role === "chairperson" ? "/chairperson" : role === "coordinator" ? "/coordinator" : "/faculty";

  const [classes, setClasses] = useState<TeachingClass[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getMyClasses()
      .then((d) => { if (alive) setClasses(d.classes); })
      .catch((e: any) => { if (alive) setError(e?.response?.data?.message ?? e?.message ?? "Failed to load classes"); });
    return () => { alive = false; };
  }, []);

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold mb-1">Marking Attendance</h1>
      <p className="text-sm text-gray-500 mb-6">Classes and subjects assigned to you for teaching.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">{error}</div>
      )}

      {classes === null && !error && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-[#d9d9d9] rounded-lg p-5 h-44 animate-pulse" />
          ))}
        </div>
      )}

      {classes !== null && classes.length === 0 && (
        <div className="bg-white border border-[#d9d9d9] rounded-lg p-10 text-center text-gray-500 text-sm">
          No teaching assignments yet. An administrator needs to assign you to a subject and class first.
        </div>
      )}

      {classes !== null && classes.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c) => (
            <TeachingClassCard key={c.id} cls={c} basePath={basePath} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TeachingDashboard;
