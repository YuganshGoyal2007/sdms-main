import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download } from "lucide-react";
import AdminSideNav from "../../components/Admin/AdminSideNav";
import Header from "../../components/Admin/Header";
import Footer from "../../components/Admin/Footer";
import type { CategoryFormProps, UniqueForm } from "../../types/types";
import { school, cse, soict } from "../../constants";
import { searchBatches, searchSpecializations, exportStudentsToExcel } from "../../lib/user.api";
import { getChangeLogs } from "../../lib/user.api";
import { downloadExcel } from "../../utils/excel";
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import type { RootState } from '../../context/app/store';

type Mode = "CATEGORY" | "UNIQUE";

const departmentMap: Record<string, { code: string; name: string }[]> = { soict };
const programMap: Record<string, { code: string; name: string }[]> = { cse };

const Records = () => {
    const [mode, setMode] = useState<Mode>("CATEGORY");

    const navigate = useNavigate();

    const [form, setform] = useState<CategoryFormProps>({
        school: "",
        department: "",
        program: "",
        batch: "",
        specialization: "",
    });
    const [batches, setBatches] = useState<string[]>([]);
    const [specializations, setSpecializations] = useState<string[]>([]);
    const [uniqueForm, setUniqueForm] = useState<UniqueForm>({
        uniqueId: "",
    });
    const user = useSelector((state: RootState) => state.admin);
    const [logs, setLogs] = useState<any[]>([]);
    const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

    const renderActionBadge = (action: string) => {
        const act = (action || '').toLowerCase();
        if (act === 'create' || act === 'add') {
            return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">CREATE</span>;
        }
        if (act === 'update' || act === 'update_photo') {
            return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-300">UPDATE</span>;
        }
        if (act === 'delete' || act.includes('delete')) {
            return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-300">DELETE</span>;
        }
        if (act.includes('upload')) {
            return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-300">UPLOAD</span>;
        }
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-300">{action.toUpperCase()}</span>;
    };

    const renderLogDetailsSummary = (log: any) => {
        const { action, details } = log;
        if (!details) return "N/A";
        const act = (action || '').toLowerCase();
        if (act === 'create') {
            return `Registered student ${details.fullName || details.rollNo || ''} (${details.program || ''} ${details.batch || ''})`;
        }
        if (act === 'update' && details.before && details.after) {
            const changes: string[] = [];
            Object.keys(details.after).forEach((key) => {
                if (JSON.stringify(details.before[key]) !== JSON.stringify(details.after[key]) && key !== 'updatedAt' && key !== 'updatedBy') {
                    changes.push(key);
                }
            });
            return changes.length > 0 ? `Updated fields: ${changes.join(', ')}` : 'Updated student details';
        }
        if (act === 'update_photo') {
            return `Updated photo for student ${log.entityId}`;
        }
        if (act === 'delete') {
            return `Deleted student ${details.fullName || details.rollNo || ''} (${details.rollNo || ''})`;
        }
        if (act === 'upload_students') {
            return `Bulk upload for ${log.entityId}: ${details.inserted || 0} inserted, ${details.failed || 0} failed`;
        }
        return typeof details === 'object' ? JSON.stringify(details).slice(0, 100) : String(details);
    };

    useEffect(() => {
        const fetchLogs = async () => {
            if (!['coordinator', 'chairperson', 'admin'].includes(user?.role || '')) return;
            try {
                const data = await getChangeLogs();
                setLogs(data.logs || []);
            } catch (err) { console.error(err); }
        };
        fetchLogs();
    }, [user?.role]);

    const handleChange = (
        e: React.ChangeEvent<HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        setform((prev) => ({
            ...prev,
            [name]: value,
            ...(name === "batch" && { specialization: "" }),
        }));
    };

    const [exporting, setExporting] = useState(false);
    const [withPhotos, setWithPhotos] = useState(false);

    const triggerExcelDownload = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const handleExportScope = async (scope: 'department' | 'batch' | 'class' | 'all') => {
        let params: Record<string, string> = {};
        let label = "Students";

        if (scope === 'all') {
            params = {};
            label = "All Students in University";
        } else if (scope === 'department') {
            if (!form.school || !form.department) {
                toast.error("Please select School and Department first");
                return;
            }
            params = { school: form.school, department: form.department };
            label = `Entire ${form.department.toUpperCase()} Department`;
        } else if (scope === 'batch') {
            if (!form.batch) {
                toast.error("Please select a Batch first");
                return;
            }
            params = {
                school: form.school,
                department: form.department,
                program: form.program,
                batch: form.batch,
            };
            label = `Batch ${form.batch}`;
        } else if (scope === 'class') {
            if (!form.specialization) {
                toast.error("Please select a Specialization first");
                return;
            }
            params = {
                school: form.school,
                department: form.department,
                program: form.program,
                batch: form.batch,
                specialization: form.specialization,
            };
            label = `Class ${form.specialization}`;
        }

        if (withPhotos) {
            params.withPhotos = 'true';
        }

        setExporting(true);
        const t = toast.loading(`Preparing Excel export for ${label}…`);
        try {
            const blob = await exportStudentsToExcel(params);
            const dateStr = new Date().toISOString().slice(0, 10);
            let filename = `students_${dateStr}.xlsx`;
            if (scope === 'department') {
                filename = `${form.school.toUpperCase()}_${form.department.toUpperCase()}_all_students_${dateStr}.xlsx`;
            } else if (scope === 'batch') {
                filename = `${form.department.toUpperCase()}_Batch_${form.batch}_students_${dateStr}.xlsx`;
            } else if (scope === 'class') {
                filename = `${form.department.toUpperCase()}_${form.batch}_${form.specialization.replace(/\s+/g, '_')}_students_${dateStr}.xlsx`;
            } else {
                filename = `all_university_students_${dateStr}.xlsx`;
            }

            triggerExcelDownload(blob, filename);
            toast.success(`Export complete: ${label}`, { id: t });
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to export Excel", { id: t });
        } finally {
            setExporting(false);
        }
    };

    const submitClassSearch = (e: React.FormEvent) => {
        e.preventDefault();

        const { school, department, program, batch, specialization } = form;

        if (school && department && program && batch && specialization) {
            navigate(`${school}/${department}/${program}/${batch}/${specialization}`);
            return;
        }

        if (school && department) {
            if (batch) {
                handleExportScope('batch');
            } else {
                handleExportScope('department');
            }
            return;
        }

        toast.error("Please select at least School and Department");
    };

    const submitUniqueSearch = (e: React.FormEvent) => {
        e.preventDefault();
        navigate(`${encodeURIComponent(uniqueForm.uniqueId)}`)
    };

    useEffect(() => {
        const getSpecializationsBatch = async () => {
            if (!form.school || !form.department || !form.program) return;

            try {
                const params = {
                    school: form.school,
                    department: form.department,
                    program: form.program,
                }
                const data = await searchBatches(params)
                setBatches(data.batches);
            } catch (error) {
                console.log(error);
            }
        };
        getSpecializationsBatch();
    }, [form.school, form.department, form.program]);

    useEffect(() => {
        const getSpecializations = async () => {
            if (!form.school || !form.department || !form.program || !form.batch) return;
            try {
                const params = {
                    school: form.school,
                    department: form.department,
                    program: form.program,
                    batch: form.batch,
                }
                const data = await searchSpecializations(params);
                setSpecializations(data.names);
            } catch (error) {
                console.log(error);
            }
        };
        getSpecializations();
    }, [form.school, form.department, form.program, form.batch]);

    return (
        <div className="flex w-full h-full overflow-hidden">
            <AdminSideNav activeTab={'records'} />

            <div className="flex sm:w-[80vw] w-[85vw] flex-col">
                <Header />

                {/* {user?.role == "admin" && */}
                    <div className="bg-[#f3f3f3] min-h-[88vh] sm:min-h-[83vh] sm:overflow-hidden overflow-scroll px-10 py-6">
                        <h1 className="text-2xl font-semibold mb-5">Records</h1>

                        {/* MODE TOGGLE */}
                        <div className="flex gap-2 mb-5">
                            <button onClick={() => setMode("CATEGORY")} className={`px-4 py-1.5 text-sm border cursor-pointer ${mode === "CATEGORY"
                                ? "bg-black text-white border-black"
                                : "bg-white border-gray-300 hover:bg-gray-100"
                                }`}>
                                Category Search
                            </button>

                            <button onClick={() => setMode("UNIQUE")} className={`px-4 py-1.5 text-sm border cursor-pointer ${mode === "UNIQUE"
                                ? "bg-black text-white border-black"
                                : "bg-white border-gray-300 hover:bg-gray-100"
                                }`}
                            >
                                Unique ID Search
                            </button>
                        </div>

                        {/* CATEGORY SEARCH */}
                        {mode === "CATEGORY" && (
                            <>
                                <p className="text-lg font-medium mt-5 mb-2">Search & Export Students</p>
                                <form onSubmit={submitClassSearch} className="bg-white border border-gray-300 p-4 rounded-lg shadow-2xs">
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
                                        <select name="school" required value={form.school} onChange={handleChange} className="input">
                                            <option value="">Select School *</option>
                                            {school.map((s) => (
                                                <option key={s.code} value={s.code}>
                                                    {s.code.toUpperCase()}
                                                </option>
                                            ))}
                                        </select>

                                        <select name="department" value={form.department} onChange={handleChange} disabled={!form.school}
                                            className="input"
                                            required
                                        >
                                            <option value="">Department *</option>
                                            {(departmentMap[form.school] || []).map((dept) => (
                                                <option key={dept.code} value={dept.code}>
                                                    {dept.code.toUpperCase()}
                                                </option>
                                            ))}
                                        </select>

                                        <select name="program" value={form.program} onChange={handleChange} disabled={!form.department} className="input">
                                            <option value="">All Programs (Optional)</option>
                                            {(programMap[form.department] || []).map((program) => (
                                                <option key={program.code} value={program.name}>{program.name}</option>
                                            ))}
                                        </select>

                                        <select name="batch" value={form.batch} onChange={handleChange} disabled={!form.program} className="input">
                                            <option value="">All Batches (Optional)</option>
                                            {batches.map((d) => (
                                                <option key={d} value={d}>
                                                    {d}
                                                </option>
                                            ))}
                                        </select>

                                        <select name="specialization" value={form.specialization} onChange={handleChange} disabled={!form.batch} className="input">
                                            <option value="">All Specializations (Optional)</option>
                                            {specializations.map((br) => (
                                                <option key={br} value={br}>
                                                    {br}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Action & Export Controls */}
                                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 flex-wrap gap-2">
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span className="font-medium">Filter Scope:</span>
                                            {form.specialization ? (
                                                <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                    Class: {form.specialization} ({form.batch})
                                                </span>
                                            ) : form.batch ? (
                                                <span className="font-semibold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                                    Batch: {form.batch} (All sections)
                                                </span>
                                            ) : form.department ? (
                                                <span className="font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                                    Entire Department: {form.department.toUpperCase()}
                                                </span>
                                            ) : (
                                                <span className="italic text-gray-400">Select School & Department</span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap">
                                            <label className="flex items-center gap-1.5 text-sm mr-2 cursor-pointer">
                                                <input type="checkbox" checked={withPhotos} onChange={(e) => setWithPhotos(e.target.checked)} className="cursor-pointer" />
                                                Include Photos
                                            </label>
                                            {/* Department-level export */}
                                            {form.department && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleExportScope('department')}
                                                    disabled={exporting}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-800 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 transition disabled:opacity-50 cursor-pointer"
                                                    title={`Export all students in ${form.department.toUpperCase()} department`}
                                                >
                                                    <Download size={13} /> {exporting ? "Exporting..." : `Export Entire ${form.department.toUpperCase()} Dept`}
                                                </button>
                                            )}

                                            {/* Batch-level export */}
                                            {form.batch && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleExportScope('batch')}
                                                    disabled={exporting}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 transition disabled:opacity-50 cursor-pointer"
                                                    title={`Export all students in batch ${form.batch}`}
                                                >
                                                    <Download size={13} /> {exporting ? "Exporting..." : `Export Batch ${form.batch}`}
                                                </button>
                                            )}

                                            {/* Search / View specific class roster */}
                                            <button
                                                type="submit"
                                                className="px-4 py-1.5 bg-black text-white text-xs font-medium hover:bg-gray-800 cursor-pointer rounded transition"
                                                title={form.specialization ? "View class student records" : "Select specialization to view class roster"}
                                            >
                                                {form.specialization ? "Search Class Roster" : "Search / Export"}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </>
                        )}

                        {/* Coordinator History Table */}
                        {['coordinator', 'chairperson', 'admin'].includes(user?.role || '') && (
                            <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
                                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Coordinator Action & Audit Logs</h2>
                                        <p className="text-xs text-gray-500 mt-0.5">{user?.role === 'coordinator' ? 'Audit history of all changes made by you.' : user?.role === 'chairperson' ? 'Changes made by coordinators in your allowed classes.' : 'All coordinator changes.'}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium px-3 py-1 bg-gray-100 rounded-full text-gray-700">
                                            {logs.length} {logs.length === 1 ? 'Entry' : 'Entries'}
                                        </span>
                                        <button
                                            onClick={async () => {
                                                if (!logs.length) {
                                                    toast.error("No logs to export");
                                                    return;
                                                }
                                                const t = toast.loading("Preparing Excel export…");
                                                try {
                                                    const headers = ["Sr No", "Date & Time", "Actor", "Action", "Entity", "Target ID"];
                                                    const rows = logs.map((l: any, idx: number) => [
                                                        idx + 1,
                                                        l.createdAt ? new Date(l.createdAt).toLocaleString() : "—",
                                                        l.actorName || `User #${l.userId}`,
                                                        l.action || "—",
                                                        l.entity || "—",
                                                        l.entityId || "—",
                                                    ]);
                                                    const today = new Date().toISOString().slice(0, 10);
                                                    await downloadExcel(
                                                        `audit-logs-${today}.xlsx`,
                                                        [{ name: "Audit Logs", rows: [headers, ...rows] }]
                                                    );
                                                    toast.success("Excel downloaded", { id: t });
                                                } catch (e: any) {
                                                    toast.error(e?.message || "Failed to export", { id: t });
                                                }
                                            }}
                                            disabled={!logs.length}
                                            className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 border border-emerald-800 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                            <Download size={14} /> Export Excel
                                        </button>
                                    </div>
                                </div>
                                {logs.length === 0 ? (
                                    <div className="py-8 text-center text-gray-500 border border-dashed border-gray-200 rounded-lg">
                                        No recent actions or changes logged for your account.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                                                <tr>
                                                    <th className="p-3">Date & Time</th>
                                                    {user?.role !== 'coordinator' && <th className="p-3">Coordinator</th>}
                                                    <th className="p-3">Action</th>
                                                    <th className="p-3">Entity</th>
                                                    <th className="p-3">Target ID</th>
                                                    <th className="p-3">Summary of Changes</th>
                                                    <th className="p-3 text-center">Payload</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 bg-white">
                                                {logs.map((l: any) => {
                                                    const isExpanded = expandedLogId === l.id;
                                                    return (
                                                        <React.Fragment key={l.id}>
                                                            <tr className="hover:bg-gray-50/80 transition-colors">
                                                                <td className="p-3 whitespace-nowrap text-gray-600 text-xs font-medium">
                                                                    {new Date(l.createdAt).toLocaleDateString(undefined, {
                                                                        day: 'numeric',
                                                                        month: 'short',
                                                                        year: 'numeric'
                                                                    })}, {new Date(l.createdAt).toLocaleTimeString(undefined, {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </td>
                                                                {user?.role !== 'coordinator' && <td className="p-3 whitespace-nowrap font-medium">{l.actorName}</td>}
                                                                <td className="p-3 whitespace-nowrap">
                                                                    {renderActionBadge(l.action)}
                                                                </td>
                                                                <td className="p-3 whitespace-nowrap capitalize text-gray-700 font-medium">
                                                                    {l.entity}
                                                                </td>
                                                                <td className="p-3 whitespace-nowrap text-gray-900 font-mono text-xs">
                                                                    {l.entityId || 'N/A'}
                                                                </td>
                                                                <td className="p-3 text-gray-700 text-xs">
                                                                    {renderLogDetailsSummary(l)}
                                                                </td>
                                                                <td className="p-3 text-center whitespace-nowrap">
                                                                    <button
                                                                        onClick={() => setExpandedLogId(isExpanded ? null : l.id)}
                                                                        className="px-2.5 py-1 text-xs border border-gray-300 rounded bg-white hover:bg-gray-100 text-gray-700 transition cursor-pointer"
                                                                    >
                                                                        {isExpanded ? 'Hide' : 'Details'}
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                            {isExpanded && (
                                                                <tr className="bg-gray-50/90">
                                                                    <td colSpan={user?.role === 'coordinator' ? 6 : 7} className="p-4">
                                                                        <div className="bg-gray-900 text-gray-100 p-3 rounded text-xs font-mono max-h-48 overflow-auto">
                                                                            <pre className="whitespace-pre-wrap">{JSON.stringify(l.details, null, 2)}</pre>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* UNIQUE ID SEARCH */}
                        {mode === "UNIQUE" && (
                            <form onSubmit={submitUniqueSearch} className="bg-white border border-gray-300 p-3 max-w-xl">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                                    <input type="text" value={uniqueForm.uniqueId} onChange={(e) => setUniqueForm({ uniqueId: e.target.value })} maxLength={20} placeholder="Unique ID (Roll No)" className="input-text md:col-span-2" required />

                                    <button type="submit" className="px-4 py-1.5 border border-gray-400 hover:bg-gray-100 cursor-pointer text-sm" >
                                        Search
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                {/* } */}
                <Footer />
            </div>
        </div>
    );
};

export default Records;
