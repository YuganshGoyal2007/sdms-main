import { useEffect, useMemo, useState } from "react";
import AdminSideNav from "../../components/Admin/AdminSideNav";
import Header from "../../components/Admin/Header";
import Footer from "../../components/Admin/Footer";
import { getChairpersonClasses, getFilteredStudents, sendMessage, exportStudentsToExcel } from "../../lib/user.api";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { GraduationCap, Users, ChevronDown, ChevronRight, Search, Send, Mail, Phone, AlertCircle, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import type { RootState } from "../../context/app/store";

type ClassInfo = {
  id: number;
  school: string;
  department: string;
  program: string;
  batch: string;
  specialization: string;
  studentCount?: number;
  coordinators?: { id: number; userId: number | null; name: string; email: string; phone: string }[];
};

type StudentRow = {
  rollNo: string;
  fullName: string;
  program: string;
  batch: string;
  school?: string;
  department?: string;
  specialization?: string;
  photo?: string;
};

const CoordinatorMessageRow: React.FC<{ coord: NonNullable<ClassInfo["coordinators"]>[number] }> = ({ coord }) => {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const send = async () => {
    if (!text.trim()) return;
    if (!coord.userId) {
      toast.error("Coordinator has not registered yet — cannot send");
      return;
    }
    setSending(true);
    try {
      await sendMessage("coordinator", `[To ${coord.name}] ${text.trim()}`);
      toast.success(`Message sent to ${coord.name}`);
      setText("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="border-t border-gray-100 first:border-t-0 py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="font-medium text-gray-900">{coord.name}</span>
        <span className="text-gray-400">·</span>
        <span className="inline-flex items-center gap-1 text-gray-600">
          <Mail size={12} /> {coord.email}
        </span>
        {coord.phone && (
          <>
            <span className="text-gray-400">·</span>
            <span className="inline-flex items-center gap-1 text-gray-600">
              <Phone size={12} /> {coord.phone}
            </span>
          </>
        )}
        {!coord.userId && (
          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-amber-100 text-amber-800 border border-amber-200">
            NOT REGISTERED
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={`Message ${coord.name.split(" ")[0]}…`}
          className="input-text flex-1"
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-black text-white rounded disabled:opacity-50"
        >
          <Send size={12} /> {sending ? "Sending…" : "Send"}
        </button>
      </div>
    </div>
  );
};

const ClassCard: React.FC<{
  cls: ClassInfo;
  expanded: boolean;
  onToggle: () => void;
  students: StudentRow[];
  loading: boolean;
  search: string;
  onEdit: (rollNo: string) => void;
  onExport: () => void;
}> = ({ cls, expanded, onToggle, students, loading, search, onEdit, onExport }) => {
  const filtered = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.trim().toLowerCase();
    return students.filter((s) =>
      [s.rollNo, s.fullName, s.program, s.batch, s.specialization]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [students, search]);

  return (
    <div className="bg-white border border-[#d9d9d9] rounded-lg shadow-sm flex flex-col min-h-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 p-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 rounded-lg bg-indigo-50/80 border border-[#a5b4fc]/70 flex items-center justify-center text-[#4338ca]">
            <GraduationCap size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {cls.program} {cls.batch} — {cls.specialization}
            </h3>
            <p className="text-xs text-gray-500 truncate">
              {cls.school?.toUpperCase()} / {cls.department?.toUpperCase()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
            <Users size={12} />
            {cls.studentCount ?? students.length} student{(cls.studentCount ?? students.length) === 1 ? "" : "s"}
          </span>
          {expanded ? <ChevronDown size={18} className="text-gray-500" /> : <ChevronRight size={18} className="text-gray-500" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 flex flex-col min-h-0">
          {/* Coordinators — collapsed by default, can be removed if empty */}
          {(cls.coordinators?.length ?? 0) > 0 && (
            <div className="p-3 shrink-0">
              <p className="text-xs font-semibold text-gray-900 mb-1.5">Assigned coordinators</p>
              <div className="space-y-1.5">
                {cls.coordinators?.map((c) => <CoordinatorMessageRow key={c.id} coord={c} />)}
              </div>
            </div>
          )}

          {/* Students table */}
          <div className="border-t border-gray-100 flex flex-col min-h-0">
            {loading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 bg-gray-100 animate-pulse rounded" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">
                {search ? "No students match your search." : "No students in this class."}
              </div>
            ) : (
              <>
                {/* Toolbar above the table — fixed height, doesn't scroll */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#f8f9fa] border-b border-gray-100 shrink-0">
                  <span className="text-xs text-gray-600">
                    {filtered.length} of {students.length} students
                  </span>
                  <button
                    onClick={onExport}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-emerald-600 text-white border border-emerald-800 rounded hover:bg-emerald-700"
                    title="Download all students in this class as Excel"
                  >
                    <FileSpreadsheet size={11} /> Export Excel
                  </button>
                </div>
                {/* Table area — bounded by min-h-0 so it shrinks and scrolls inside */}
                <div className="overflow-x-auto min-h-0 flex-1">
                  <div className="max-h-[42vh] overflow-y-auto h-full">
                    <table className="w-full text-sm">
                      <thead className="bg-[#f8f9fa] text-gray-700 font-semibold border-b border-[#d9d9d9] sticky top-0 z-10">
                        <tr>
                          <th className="text-left px-3 py-1.5 w-10 text-xs">Sr</th>
                          <th className="text-left px-3 py-1.5 w-10 text-xs">Photo</th>
                          <th className="text-left px-3 py-1.5 text-xs">Roll No</th>
                          <th className="text-left px-3 py-1.5 text-xs">Name</th>
                          <th className="text-left px-3 py-1.5 hidden md:table-cell text-xs">Program</th>
                          <th className="text-left px-3 py-1.5 hidden md:table-cell text-xs">Batch</th>
                          <th className="text-right px-3 py-1.5 w-20 text-xs">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((s, idx) => (
                          <tr key={s.rollNo} className="border-b border-gray-100 hover:bg-gray-50/80">
                            <td className="px-3 py-1.5 text-gray-500 font-mono text-xs">{idx + 1}</td>
                            <td className="px-3 py-1.5">
                              {s.photo ? (
                                <img src={s.photo} alt={s.fullName} className="w-7 h-7 rounded-full object-cover border border-gray-300" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-700 font-bold border border-gray-300 flex items-center justify-center text-[10px]">
                                  {s.fullName?.charAt(0).toUpperCase() ?? "?"}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-1.5 font-mono text-gray-800 text-xs whitespace-nowrap">{s.rollNo}</td>
                            <td className="px-3 py-1.5 text-gray-800 text-sm">{s.fullName}</td>
                            <td className="px-3 py-1.5 text-gray-700 text-xs hidden md:table-cell">{s.program}</td>
                            <td className="px-3 py-1.5 text-gray-700 text-xs hidden md:table-cell">{s.batch}</td>
                            <td className="px-3 py-1.5 text-right">
                              <button
                                onClick={() => onEdit(s.rollNo)}
                                className="px-2 py-0.5 border border-[#d9d9d9] rounded text-xs hover:bg-gray-100"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Classes = () => {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [studentsByClass, setStudentsByClass] = useState<Record<string, StudentRow[]>>({});
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingClassId, setLoadingClassId] = useState<number | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.admin);

  const classKey = (c: ClassInfo) => `${c.school}|${c.department}|${c.program}|${c.batch}|${c.specialization}`;

  useEffect(() => {
    const loadClasses = async () => {
      setLoadingClasses(true);
      try {
        if (user.role === "chairperson" || user.role === "admin") {
          const data = await getChairpersonClasses();
          setClasses((data.classes || []) as ClassInfo[]);
        } else {
          // Coordinator path: fetch their classes first, then expand on click
          // First try filter-students without filters to learn their class scope
          // We'll rely on /admin/classes for the class list
          const fallback = await getFilteredStudents(undefined, undefined, undefined, undefined, undefined);
          const list = (fallback.students || []) as StudentRow[];
          // Group students by class key
          const grouped: Record<string, { cls: ClassInfo; rows: StudentRow[] }> = {};
          list.forEach((s) => {
            const k = `${s.school || ""}|${s.department || ""}|${s.program || ""}|${s.batch || ""}|${s.specialization || ""}`;
            if (!grouped[k]) {
              grouped[k] = {
                cls: {
                  id: k.length,
                  school: s.school || "",
                  department: s.department || "",
                  program: s.program || "",
                  batch: s.batch || "",
                  specialization: s.specialization || "",
                  studentCount: 0,
                },
                rows: [],
              };
            }
            grouped[k].rows.push(s);
            grouped[k].cls.studentCount = (grouped[k].cls.studentCount || 0) + 1;
          });
          const derivedClasses = Object.values(grouped).map((g) => g.cls);
          setClasses(derivedClasses);
          setStudentsByClass(Object.fromEntries(Object.entries(grouped).map(([k, v]) => [k, v.rows])));
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load classes");
      } finally {
        setLoadingClasses(false);
      }
    };
    if (user.role) loadClasses();
  }, [user.role]);

  const toggleClass = async (cls: ClassInfo) => {
    const next = new Set(expandedIds);
    if (next.has(cls.id)) {
      next.delete(cls.id);
      setExpandedIds(next);
      return;
    }
    next.add(cls.id);
    setExpandedIds(next);

    const key = classKey(cls);
    if (!studentsByClass[key]) {
      setLoadingClassId(cls.id);
      try {
        const data = await getFilteredStudents(cls.school, cls.department, cls.program, cls.batch, cls.specialization);
        setStudentsByClass((prev) => ({ ...prev, [key]: (data.students || []) as StudentRow[] }));
      } catch (err) {
        console.error(err);
        toast.error("Failed to load students");
      } finally {
        setLoadingClassId(null);
      }
    }
  };

  const onEdit = (rollNo: string) => {
    const base = user.role === "chairperson" ? "/chairperson" : "/admin";
    navigate(`${base}/records/${encodeURIComponent(rollNo)}`);
  };

  const exportClass = async (cls: ClassInfo) => {
    const t = toast.loading(`Exporting ${cls.specialization || cls.program}…`);
    try {
      const blob = await exportStudentsToExcel({
        school: cls.school,
        department: cls.department,
        program: cls.program,
        batch: cls.batch,
        specialization: cls.specialization,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(cls.program || "program").replace(/\s+/g, "_")}-${cls.batch}-${(cls.specialization || "class").replace(/\s+/g, "_")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Excel downloaded", { id: t });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Export failed", { id: t });
    }
  };

  const totalStudents = useMemo(() => {
    return classes.reduce((acc, c) => acc + (c.studentCount || 0), 0);
  }, [classes]);

  return (
    <div className="h-screen w-full flex bg-[#f8f9fa] overflow-hidden">
      {/* Fixed sidebar */}
      <aside className="shrink-0 h-screen sticky top-0 z-20">
        <AdminSideNav activeTab={"classes"} />
      </aside>

      {/* Right column: header + scrollable main + footer */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <div className="shrink-0 z-10">
          <Header />
        </div>

        <main className="flex-1 overflow-y-auto bg-[#f3f3f3] min-h-0">
          <div className="px-4 sm:px-6 lg:px-10 py-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">My Classes</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {user.role === "chairperson" ? "Classes you oversee" : user.role === "coordinator" ? "Classes assigned to you" : "All classes"}
                </p>
              </div>
              <div className="text-xs text-gray-600">
                {classes.length} class{classes.length === 1 ? "" : "es"} · {totalStudents} student{totalStudents === 1 ? "" : "s"}
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white border border-[#d9d9d9] rounded h-11 px-3 sm:px-4">
              <Search size={14} className="text-gray-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by roll no, name, or class…"
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>

            {loadingClasses ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 bg-white border border-[#d9d9d9] rounded-lg animate-pulse" />
                ))}
              </div>
            ) : classes.length === 0 ? (
              <div className="bg-white border border-[#d9d9d9] rounded-lg p-8 text-center">
                <AlertCircle className="mx-auto mb-2 text-gray-400" size={28} />
                <p className="text-sm text-gray-600">No classes are assigned to you yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {classes
                  .filter((c) => {
                    if (!search.trim()) return true;
                    const q = search.trim().toLowerCase();
                    return [c.program, c.batch, c.specialization, c.school, c.department]
                      .filter(Boolean)
                      .some((v) => String(v).toLowerCase().includes(q));
                  })
                  .map((cls) => (
                    <ClassCard
                      key={cls.id}
                      cls={cls}
                      expanded={expandedIds.has(cls.id)}
                      onToggle={() => toggleClass(cls)}
                      students={studentsByClass[classKey(cls)] || []}
                      loading={loadingClassId === cls.id}
                      search={search}
                      onEdit={onEdit}
                      onExport={() => exportClass(cls)}
                    />
                  ))}
              </div>
            )}
          </div>
        </main>

        <div className="shrink-0 z-10 border-t border-[#d9d9d9] bg-[#f8f9fa]">
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Classes;
