import React, { useEffect, useState } from "react";
import { school, soict, cse, sobt, soe, sohss, sovsas, som, soljg, it, ece, ce, me, ee, ar, bt, en, ep, et, mc, lb, mb, il, hc, pm, pr, sw, so, ma, ch, ph, es, ft } from "../../constants";
import {
    addCoordinator,
    addSpecialization,
    searchBatches,
    searchSpecializations,
    uploadStudentPhotos,
    uploadStudents,
} from "../../lib/user.api";

const departmentMap: Record<string, { code: string; name: string }[]> = { soict, sobt, soe, sohss, sovsas, som, soljg };
const programMap: Record<string, { code: string; name: string }[]> = { cse, it, ece, ce, me, ee, ar, bt, en, ep, et, mc, lb, mb, il, hc, pm, pr, sw, so, ma, ch, ph, es, ft };

interface AdminModalsProps {
    showSpecializationForm: boolean;
    setShowSpecializationForm: (v: boolean) => void;
    showStudentForm: boolean;
    setshowStudentForm: (v: boolean) => void;
    showPhotoUploadForm: boolean;
    setShowPhotoUploadForm: (v: boolean) => void;
    showAdminForm: boolean;
    setshowAdminForm: (v: boolean) => void;
}

const initialFormState = {
    name: "",
    school: "",
    department: "",
    program: "",
    batch: "",
    specialization: "",
    file: null as File | null,
};
const initialAdminForm = {
    coordinatorId: "",
    name: "",
    email: "",
    phone: "",
    school: "",
    department: "",
    program: "",
    batch: "",
    specialization: "",
};

const AdminModals: React.FC<AdminModalsProps> = ({
    showSpecializationForm,
    setShowSpecializationForm,
    showStudentForm,
    setshowStudentForm,
    showPhotoUploadForm,
    setShowPhotoUploadForm,
    showAdminForm,
    setshowAdminForm,
}) => {
    const [isCustomClass, setIsCustomClass] = useState(false);
    const [customStartYear, setCustomStartYear] = useState("");
    const [customDuration, setCustomDuration] = useState("");
    const [batches, setBatches] = useState<string[]>([]);
    const [specializations, setSpecializations] = useState<string[]>([]);
    const [form, setForm] = useState(initialFormState);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [isPhotoUploading, setIsPhotoUploading] = useState(false);
    const [adminForm, setAdminForm] = useState(initialAdminForm);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const diff = new Date().getFullYear() - 2008;
    const years = Array.from({ length: diff + 1 }, (_, i) => 2008 + i);

    const closeForm = () => {
        setShowSpecializationForm(false);
        setshowStudentForm(false);
        setForm(initialFormState);
        setshowAdminForm(false);
        setIsCustomClass(false);
        setCustomStartYear("");
        setCustomDuration("");
    };

    useEffect(() => {
        if (customStartYear && customDuration) {
            const startYearNum = parseInt(customStartYear);
            const durationNum = parseInt(customDuration);
            if (!isNaN(startYearNum) && !isNaN(durationNum)) {
                const endYearLastTwo = String(startYearNum + durationNum).slice(-2);
                setForm((prev) => ({ ...prev, batch: `${startYearNum}-${endYearLastTwo}` }));
            }
        }
    }, [customStartYear, customDuration]);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };
    const handleAdminFormChange = (e: any) => {
        const { name, value } = e.target;
        setAdminForm((prev) => ({ ...prev, [name]: value }));
    };
    const handleFileChange = (file: File) => setForm((prev) => ({ ...prev, file }));
    const handlePhotoFileChange = (file: File) => setPhotoFile(file);

    const handleUploadStudentPhotos = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPhotoUploading(true);
        if (!(photoFile instanceof File)) {
            alert("Please upload an Excel file with roll numbers and photo data");
            setIsPhotoUploading(false);
            return;
        }
        const fd = new FormData();
        fd.append("file", photoFile);
        try {
            const data = await uploadStudentPhotos(fd);
            if (data) {
                const errorDetails = data.errors?.length ? `\nFirst failure: ${data.errors[0].error}` : "";
                alert(`Photo sheet upload completed - updated: ${data.updated}, failed: ${data.failed}${errorDetails}`);
            }
        } catch (error: any) {
            const responseData = error.response?.data;
            const message = responseData?.message || error.message || "Upload failed";
            const details = responseData?.errors?.length ? `\nFirst failure: ${responseData.errors[0].error}` : "";
            console.error("Photo upload error:", responseData || error);
            alert(`${message}${details}`);
        } finally {
            setIsPhotoUploading(false);
            setPhotoFile(null);
            setShowPhotoUploadForm(false);
        }
    };

    const handleUploadStudents = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        if (!(form.file instanceof File)) {
            alert("Please upload an Excel file");
            return;
        }
        const fd = new FormData();
        fd.append("file", form.file);
        fd.append("school", form.school);
        fd.append("department", form.department);
        fd.append("program", form.program);
        fd.append("batch", form.batch);
        fd.append("specialization", form.specialization);
        try {
            const data = await uploadStudents(fd);
            if (data) {
                const errorDetails = data.errors?.length ? `\nFirst failure: ${data.errors[0].error}` : "";
                alert(`File added successfully - failed: ${data.failed}, inserted: ${data.inserted}${errorDetails}`);
            }
        } catch (error: any) {
            const responseData = error.response?.data;
            const message = responseData?.message || error.message || "Upload failed";
            const details = responseData?.foundHeaders ? `\nFound headers: ${responseData.foundHeaders.join(", ")}` : "";
            const errorDetails = responseData?.errors?.length ? `\nFirst failure: ${responseData.errors[0].error}` : "";
            console.error("Upload error:", responseData || error);
            alert(`${message}${details}${errorDetails}`);
        } finally {
            setIsSubmitting(false);
            setshowStudentForm(false);
            setForm(initialFormState);
        }
    };

    const handleAddSpecialization = async (e: any) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const payload = {
                name: form.name.trim(),
                school: form.school,
                department: form.department,
                program: form.program,
                batch: form.batch,
            };
            const data = await addSpecialization(payload);
            if (data) {
                alert(`Course saved as ${form.school.toLocaleUpperCase()} ${`>`} ${form.department.toLocaleUpperCase()} ${`>`} ${form.program} ${form.batch} ${`>`} ${form.name}`);
            }
            closeForm();
        } catch (error: any) {
            if (!error.response) {
                alert("Network error. Please check your connection.");
                return;
            }
            const { status, data } = error.response;
            switch (status) {
                case 400: alert(data?.message || "Invalid input. Please check the form."); break;
                case 403: alert("You do not have permission to perform this action."); break;
                case 409: alert("This specialization already exists."); break;
                case 500: alert("Server error. Please try again later."); break;
                default: alert(data?.message || "Unexpected error occurred.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddCoordinator = async (e: any) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const payload = {
                coordinatorId: adminForm.coordinatorId,
                name: adminForm.name.trim(),
                email: adminForm.email,
                phone: adminForm.phone,
                school: adminForm.school,
                department: adminForm.department,
                program: adminForm.program,
                batch: adminForm.batch,
                specialization: adminForm.specialization,
            };
            await addCoordinator(payload);
            alert('Coordinator added successfully!');
            closeForm();
        } catch (error: any) {
            if (!error.response) { alert("Network error. Please check your connection."); return; }
            const { status, data } = error.response;
            switch (status) {
                case 400: alert(data?.message || "Invalid input. Please check the form."); break;
                case 403: alert("You do not have permission to perform this action."); break;
                case 409: alert("Conflict - Input Fields already Exists."); break;
                case 500: alert(error.message); break;
                default: alert(data?.message || "Unexpected error occurred.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (!form.school || !form.department || !form.program) {
            setBatches([]);
            return;
        }
        (async () => {
            try {
                const data = await searchBatches({ school: form.school, department: form.department, program: form.program });
                setBatches(data.batches);
            } catch (error) {
                console.log(error);
            }
        })();
    }, [form.school, form.department, form.program]);

    useEffect(() => {
        if (!adminForm.school || !adminForm.department || !adminForm.program) {
            setBatches([]);
            return;
        }
        (async () => {
            try {
                const data = await searchBatches({ school: adminForm.school, department: adminForm.department, program: adminForm.program });
                setBatches(data.batches);
            } catch (error) {
                console.log(error);
            }
        })();
    }, [adminForm.school, adminForm.department, adminForm.program]);

    useEffect(() => {
        const controller = new AbortController();
        const load = async () => {
            if (!form.school || !form.department || !form.program || !form.batch) {
                setSpecializations([]);
                return;
            }
            try {
                const data = await searchSpecializations({
                    school: form.school, department: form.department, program: form.program, batch: form.batch,
                });
                if (!controller.signal.aborted) setSpecializations(data.names || []);
            } catch (error) {
                if (!controller.signal.aborted) { console.error("Error fetching specializations:", error); setSpecializations([]); }
            }
        };
        load();
        return () => controller.abort();
    }, [form.school, form.department, form.program, form.batch]);

    useEffect(() => {
        const controller = new AbortController();
        const load = async () => {
            if (!adminForm.school || !adminForm.department || !adminForm.program || !adminForm.batch) {
                setSpecializations([]);
                return;
            }
            try {
                const data = await searchSpecializations({
                    school: adminForm.school, department: adminForm.department, program: adminForm.program, batch: adminForm.batch,
                });
                if (!controller.signal.aborted) setSpecializations(data.names || []);
            } catch (error) {
                if (!controller.signal.aborted) { console.error("Error fetching specializations:", error); setSpecializations([]); }
            }
        };
        load();
        return () => controller.abort();
    }, [adminForm.school, adminForm.department, adminForm.program, adminForm.batch]);

    return (
        <>
            {showSpecializationForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0">
                    <div className="absolute inset-0 bg-black/30" onClick={closeForm} />
                    <div className="relative z-50 w-full max-w-xl rounded bg-white shadow-lg max-h-[90vh] overflow-y-auto p-8 sm:p-6">
                        <h2 className="mb-4 text-lg sm:text-xl text-center font-semibold text-gray-900">Add Batch</h2>
                        <form onSubmit={handleAddSpecialization} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Course Name <span className="text-red-500">*</span></label>
                                <input name="name" placeholder="Data Science" required value={form.name} onChange={handleChange}
                                    className="w-full text-gray-600 border border-[#d9d9d9] rounded px-3 py-2 mt-1" />
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">School <span className="text-red-500">*</span></label>
                                    <select name="school" required value={form.school} onChange={handleChange}
                                        className="w-full text-gray-600 border cursor-pointer border-[#d9d9d9] rounded px-3 py-2 mt-1">
                                        <option value="">Select School</option>
                                        {school.map((s) => <option key={s.code} value={s.code}>{s.code.toUpperCase()}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Department <span className="text-red-500">*</span></label>
                                    <select name="department" required disabled={!form.school} value={form.department} onChange={handleChange}
                                        className="w-full text-gray-600 border cursor-pointer border-[#d9d9d9] rounded px-3 py-2 mt-1 disabled:bg-gray-100 disabled:cursor-not-allowed">
                                        <option value="">Select Department</option>
                                        {(departmentMap[form.school] || []).map((dept) =>
                                            <option key={dept.code} value={dept.code}>{dept.code.toUpperCase()}</option>
                                        )}
                                    </select>
                                </div>
                                <div className="flex items-center gap-2 sm:col-span-2 mt-1">
                                    <input type="checkbox" id="customClass" checked={isCustomClass}
                                        onChange={(e) => {
                                            setIsCustomClass(e.target.checked);
                                            setForm((prev) => ({ ...prev, program: "", batch: "" }));
                                            setCustomStartYear("");
                                            setCustomDuration("");
                                        }}
                                        className="w-4 h-4 cursor-pointer accent-black text-black" />
                                    <label htmlFor="customClass" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                                        Create custom Program/Class with specific time period (duration)
                                    </label>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Program <span className="text-red-500">*</span></label>
                                    {isCustomClass ? (
                                        <input type="text" name="program" placeholder="e.g. PhD, BCA, MBA" required disabled={!form.department} value={form.program} onChange={handleChange}
                                            className="w-full text-gray-600 border border-[#d9d9d9] rounded px-3 py-2 mt-1 disabled:bg-gray-100 disabled:cursor-not-allowed" />
                                    ) : (
                                        <select name="program" required disabled={!form.department} value={form.program} onChange={handleChange}
                                            className="w-full text-gray-600 border cursor-pointer border-[#d9d9d9] rounded px-3 py-2 mt-1 disabled:bg-gray-100 disabled:cursor-not-allowed">
                                            <option value="">Select Program</option>
                                            {(programMap[form.department] || []).map((p) => <option key={p.code} value={p.name}>{p.name}</option>)}
                                        </select>
                                    )}
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Batch / Time Period <span className="text-red-500">*</span></label>
                                    {isCustomClass || (form.program && !["B.Tech", "M.Tech", "B.Tech + M.Tech"].includes(form.program)) ? (
                                        <div className="grid grid-cols-2 gap-2 w-full mt-1">
                                            <select value={customStartYear} required disabled={!form.program} onChange={(e) => setCustomStartYear(e.target.value)}
                                                className="w-full text-gray-600 border cursor-pointer border-[#d9d9d9] rounded px-3 py-1.5 disabled:bg-gray-100 disabled:cursor-not-allowed">
                                                <option value="">Start Year</option>
                                                {years.map((year) => <option key={year} value={year}>{year}</option>)}
                                            </select>
                                            <select value={customDuration} required disabled={!form.program} onChange={(e) => setCustomDuration(e.target.value)}
                                                className="w-full text-gray-600 border cursor-pointer border-[#d9d9d9] rounded px-3 py-1.5 disabled:bg-gray-100 disabled:cursor-not-allowed">
                                                <option value="">Duration</option>
                                                {[1, 2, 3, 4, 5, 6].map((num) => <option key={num} value={num}>{num} Year{num > 1 ? 's' : ''}</option>)}
                                            </select>
                                            {form.batch && (
                                                <div className="col-span-2 text-xs text-indigo-600 font-semibold mt-1">Generated Batch: {form.batch}</div>
                                            )}
                                        </div>
                                    ) : (
                                        <select name="batch" required disabled={!form.program} value={form.batch} onChange={handleChange}
                                            className="w-full text-gray-600 border cursor-pointer border-[#d9d9d9] rounded px-3 py-2 mt-1 disabled:bg-gray-100 disabled:cursor-not-allowed">
                                            <option value="">Select Batch</option>
                                            {form.program === 'B.Tech' && years.map((year) => <option key={year} value={`${year}-${year - 1996}`}>{year}-{year - 1996}</option>)}
                                            {form.program === 'M.Tech' && years.map((year) => <option key={year} value={`${year}-${year - 1998}`}>{year}-{year - 1998}</option>)}
                                            {form.program === 'B.Tech + M.Tech' && years.map((year) => <option key={year} value={`${year}-${year - 1995}`}>{year}-{year - 1995}</option>)}
                                        </select>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
                                <button type="button" onClick={closeForm} className="text-sm text-gray-600 cursor-pointer hover:text-black">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="rounded-lg bg-black px-4 py-2 cursor-pointer text-sm text-white disabled:opacity-60">
                                    {isSubmitting ? "Saving..." : "Save Batch"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showStudentForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0">
                    <div className="absolute inset-0 bg-black/30" onClick={closeForm} />
                    <div className="relative z-50 w-full max-w-xl rounded bg-white shadow-lg max-h-[90vh] overflow-y-auto p-8 sm:p-6">
                        <h2 className="mb-4 text-lg sm:text-xl text-center font-semibold text-gray-900">Upload Sheet</h2>
                        <form onSubmit={handleUploadStudents} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">School <span className="text-red-500">*</span></label>
                                    <select name="school" required value={form.school} onChange={handleChange} className="w-full cursor-pointer text-gray-600 border border-[#d9d9d9] rounded px-3 py-2 mt-1">
                                        <option value="">Select School</option>
                                        {school.map((s) => <option key={s.code} value={s.code}>{s.code.toUpperCase()}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Department <span className="text-red-500">*</span></label>
                                    <select name="department" required disabled={!form.school} value={form.department} onChange={handleChange} className="w-full cursor-pointer text-gray-600 border border-[#d9d9d9] rounded px-3 py-2 mt-1 disabled:bg-gray-100 disabled:cursor-not-allowed">
                                        <option value="">Select Department</option>
                                        {(departmentMap[form.school] || []).map((d) => <option key={d.code} value={d.code}>{d.code.toUpperCase()}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Program <span className="text-red-500">*</span></label>
                                    <select name="program" required disabled={!form.department} value={form.program} onChange={handleChange} className="w-full text-gray-600 cursor-pointer border border-[#d9d9d9] rounded px-3 py-2 mt-1 disabled:bg-gray-100 disabled:cursor-not-allowed">
                                        <option value="">Select Program</option>
                                        {(programMap[form.department] || []).map((p) => <option key={p.code} value={p.name}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Batch <span className="text-red-500">*</span></label>
                                    <select name="batch" required disabled={!form.program} value={form.batch} onChange={handleChange} className="w-full text-gray-600 border cursor-pointer border-[#d9d9d9] rounded px-3 py-2 mt-1 disabled:bg-gray-100 disabled:cursor-not-allowed">
                                        <option value="">Select Batch</option>
                                        {batches.map((b, i) => <option key={i} value={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Specialization <span className="text-red-500">*</span></label>
                                    <select name="specialization" required disabled={!form.batch} value={form.specialization} onChange={handleChange} className="w-full cursor-pointer text-gray-600 border border-[#d9d9d9] rounded px-3 py-2 mt-1 disabled:bg-gray-100 disabled:cursor-not-allowed">
                                        <option value="">Select Specialization</option>
                                        {specializations.map((s, i) => <option key={i} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="sm:col-start-1 sm:col-end-3">
                                    <label className="text-sm font-medium text-gray-700">Upload Sheet <span className="text-red-500">*</span></label>
                                    <p className="text-xs text-gray-500 mt-1">The file will be reformatted automatically before upload.</p>
                                    <div
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => { e.preventDefault(); const file = e.dataTransfer.files?.[0]; if (file) handleFileChange(file); }}
                                        className="mt-1 flex flex-col items-center justify-center rounded border-2 border-dashed border-gray-300 px-4 py-6 text-center cursor-pointer hover:border-black transition"
                                        onClick={() => document.getElementById('fileInput')?.click()}>
                                        <p className="text-sm text-gray-600">Drag &amp; drop XLSX sheet here</p>
                                        <p className="text-xs text-gray-400 mt-1">or click to browse</p>
                                        {form.file && <p className="mt-2 text-xs text-green-600">Selected: {form.file.name}</p>}
                                    </div>
                                    <input id="fileInput" type="file" accept=".csv,.xls,.xlsx" className="hidden"
                                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileChange(f); }} />
                                </div>
                            </div>
                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
                                <button type="button" onClick={closeForm} className="text-sm text-gray-600 cursor-pointer hover:text-black">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="rounded-lg bg-black px-4 py-2 cursor-pointer text-sm text-white disabled:opacity-60">
                                    {isSubmitting ? "Saving..." : "Reformat & Upload"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showPhotoUploadForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setShowPhotoUploadForm(false)} />
                    <div className="relative z-50 w-full max-w-md rounded bg-white shadow-lg max-h-[90vh] overflow-y-auto p-8 sm:p-6">
                        <h2 className="mb-4 text-lg sm:text-xl text-center font-semibold text-gray-900">Upload Student Photo Sheet</h2>
                        <form onSubmit={handleUploadStudentPhotos} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Excel file with Roll No and Photo Data <span className="text-red-500">*</span></label>
                                <p className="text-xs text-gray-500 mt-1">Upload a sheet containing roll numbers and image values (base64 or file path as supported by backend).</p>
                                <div
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => { e.preventDefault(); const file = e.dataTransfer.files?.[0]; if (file) handlePhotoFileChange(file); }}
                                    className="mt-3 flex flex-col items-center justify-center rounded border-2 border-dashed border-gray-300 px-4 py-6 text-center cursor-pointer hover:border-black transition"
                                    onClick={() => document.getElementById('photoFileInput')?.click()}>
                                    <p className="text-sm text-gray-600">Drag &amp; drop the Excel file here</p>
                                    <p className="text-xs text-gray-400 mt-1">or click to browse</p>
                                    {photoFile && <p className="mt-2 text-xs text-green-600">Selected: {photoFile.name}</p>}
                                </div>
                                <input id="photoFileInput" type="file" accept=".csv,.xls,.xlsx" className="hidden"
                                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoFileChange(f); }} />
                            </div>
                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowPhotoUploadForm(false)} className="text-sm text-gray-600 cursor-pointer hover:text-black">Cancel</button>
                                <button type="submit" disabled={isPhotoUploading} className="rounded-lg bg-black px-4 py-2 cursor-pointer text-sm text-white disabled:opacity-60">
                                    {isPhotoUploading ? "Uploading..." : "Upload Photos"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAdminForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0">
                    <div className="absolute inset-0 bg-black/30" onClick={closeForm} />
                    <div className="relative z-50 w-full max-w-xl rounded bg-white shadow-lg max-h-[90vh] overflow-y-auto p-8 sm:p-6">
                        <h2 className="mb-4 text-lg sm:text-xl text-center font-semibold text-gray-900">Create Coordinator</h2>
                        <form onSubmit={handleAddCoordinator} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Coordinator Id <span className="text-red-500">*</span></label>
                                    <input name="coordinatorId" placeholder="0041" required value={adminForm.coordinatorId} onChange={handleAdminFormChange}
                                        className="w-full text-gray-600 border border-[#d9d9d9] rounded px-3 py-2 mt-1" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Coordinator Name <span className="text-red-500">*</span></label>
                                    <input name="name" placeholder="Arun Solanki" required value={adminForm.name} onChange={handleAdminFormChange}
                                        className="w-full text-gray-600 border border-[#d9d9d9] rounded px-3 py-2 mt-1" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Username (email) <span className="text-red-500">*</span></label>
                                    <input name="email" placeholder="asolanki@gbu.ac.in" required type="email" value={adminForm.email} onChange={handleAdminFormChange}
                                        className="w-full text-gray-600 border border-[#d9d9d9] rounded px-3 py-2 mt-1" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Phone no <span className="text-red-500">*</span></label>
                                    <input name="phone" placeholder="9650906633" required type="phone" maxLength={10} value={adminForm.phone} onChange={handleAdminFormChange}
                                        className="w-full text-gray-600 border border-[#d9d9d9] rounded px-3 py-2 mt-1" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">School <span className="text-red-500">*</span></label>
                                    <select name="school" required value={adminForm.school} onChange={handleAdminFormChange}
                                        className="w-full text-gray-600 border cursor-pointer border-[#d9d9d9] rounded px-3 py-2 mt-1">
                                        <option value="">Select School</option>
                                        {school.map((s) => <option key={s.code} value={s.code}>{s.code.toUpperCase()}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Department <span className="text-red-500">*</span></label>
                                    <select name="department" required disabled={!adminForm.school} value={adminForm.department} onChange={handleAdminFormChange}
                                        className="w-full cursor-pointer text-gray-600 border border-[#d9d9d9] rounded px-3 py-2 mt-1 disabled:bg-gray-100 disabled:cursor-not-allowed">
                                        <option value="">Select Department</option>
                                        {(departmentMap[adminForm.school] || []).map((d) => <option key={d.code} value={d.code}>{d.code.toUpperCase()}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Program <span className="text-red-500">*</span></label>
                                    <select name="program" required disabled={!adminForm.department} value={adminForm.program} onChange={handleAdminFormChange}
                                        className="w-full text-gray-600 cursor-pointer border border-[#d9d9d9] rounded px-3 py-2 mt-1 disabled:bg-gray-100 disabled:cursor-not-allowed">
                                        <option value="">Select Program</option>
                                        {(programMap[adminForm.department] || []).map((p) => <option key={p.code} value={p.name}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Batch <span className="text-red-500">*</span></label>
                                    <select name="batch" required disabled={!adminForm.program} value={adminForm.batch} onChange={handleAdminFormChange}
                                        className="w-full text-gray-600 border cursor-pointer border-[#d9d9d9] rounded px-3 py-2 mt-1 disabled:bg-gray-100 disabled:cursor-not-allowed">
                                        <option value="">Select Batch</option>
                                        {batches.map((b, i) => <option key={i} value={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Specialization <span className="text-red-500">*</span></label>
                                    <select name="specialization" required disabled={!adminForm.batch} value={adminForm.specialization} onChange={handleAdminFormChange}
                                        className="w-full cursor-pointer text-gray-600 border border-[#d9d9d9] rounded px-3 py-2 mt-1 disabled:bg-gray-100 disabled:cursor-not-allowed">
                                        <option value="">Select Specialization</option>
                                        {specializations.map((s, i) => <option key={i} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
                                <button type="button" onClick={closeForm} className="text-sm text-gray-600 cursor-pointer hover:text-black">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="rounded-lg bg-black px-4 py-2 cursor-pointer text-sm text-white disabled:opacity-60">
                                    {isSubmitting ? "Creating..." : "Create Coordinator"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminModals;
