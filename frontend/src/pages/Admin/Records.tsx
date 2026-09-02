import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSideNav from "../../components/Admin/AdminSideNav";
import Header from "../../components/Admin/Header";
import Footer from "../../components/Admin/Footer";
import type { CategoryFormProps, UniqueForm } from "../../types/types";
import { school, cse, soict } from "../../constants";
import { searchBatches, searchSpecializations } from "../../lib/user.api";
import { getChangeLogs } from "../../lib/user.api";
import { useSelector } from 'react-redux';
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

    const submitClassSearch = (e: React.FormEvent) => {
        e.preventDefault();

        const { school, department, program, batch, specialization } = form;

        if (!school || !department || !program || !batch || !specialization) return;

        navigate(`${school}/${department}/${program}/${batch}/${specialization}`);
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
                                <p className="text-lg font-medium mt-5 mb-2">Search Students</p>
                                <form onSubmit={submitClassSearch} className="bg-white border border-gray-300 p-3">
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                                        <select name="school" required value={form.school} onChange={handleChange} className="input">
                                            <option value="">Select School</option>
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
                                            <option value="">Department</option>
                                            {(departmentMap[form.school] || []).map((dept) => (
                                                <option key={dept.code} value={dept.code}>
                                                    {dept.code.toUpperCase()}
                                                </option>
                                            ))}
                                        </select>

                                        <select name="program" value={form.program} onChange={handleChange} disabled={!form.department} className="input" required >
                                            <option value="">Program</option>
                                            {(programMap[form.department] || []).map((program) => (
                                                <option key={program.code} value={program.name}>{program.name}</option>
                                            ))}
                                        </select>

                                        <select name="batch" value={form.batch} onChange={handleChange} disabled={!form.program} className="input" required >
                                            <option value="">Batch</option>
                                            {batches.map((d) => (
                                                <option key={d} value={d}>
                                                    {d}
                                                </option>
                                            ))}
                                        </select>

                                        <select name="specialization" value={form.specialization} onChange={handleChange} disabled={!form.batch} className="input" required>
                                            <option value="">Specialization</option>
                                            {specializations.map((br) => (
                                                <option key={br} value={br}>
                                                    {br}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex justify-end mt-3">
                                        <button type="submit" className="px-5 py-1.5 border border-gray-400
                             text-sm hover:bg-gray-100 cursor-pointer">
                                            Search
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}

                        {/* Coordinator History Table */}
                        {['coordinator', 'chairperson', 'admin'].includes(user?.role || '') && (
                            <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Coordinator Action & Audit Logs</h2>
                                        <p className="text-xs text-gray-500 mt-0.5">{user?.role === 'coordinator' ? 'Audit history of all changes made by you.' : user?.role === 'chairperson' ? 'Changes made by coordinators in your allowed classes.' : 'All coordinator changes.'}</p>
                                    </div>
                                    <span className="text-xs font-medium px-3 py-1 bg-gray-100 rounded-full text-gray-700">
                                        {logs.length} {logs.length === 1 ? 'Entry' : 'Entries'}
                                    </span>
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
