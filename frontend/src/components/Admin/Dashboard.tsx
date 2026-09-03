import { UserPlus, Upload, BookCopy, TableOfContents, Users, FileText, GraduationCap, BookOpen } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { school, soict, cse, sobt, soe, sohss, sovsas, som, soljg, it, ece, ce, me, ee, ar, bt, en, ep, et, mc, lb, mb, il, hc, pm, pr, sw, so, ma, ch, ph, es, ft } from "../../constants";
import type { QuickActionCardProps, StatCardProps } from "../../types/types";
import { addCoordinator, addSpecialization, countSpecialization, getAdmins, getStudentsCount, searchBatches, searchSpecializations, uploadStudents, uploadStudentPhotos, getCoordinatorDetails } from "../../lib/user.api";
import { useSelector } from "react-redux";
import type { RootState } from "../../context/app/store";

const totalDepartments = soict.length;

interface UploadFormState {
    name: string;
    school: string;
    department: string;
    program: string;
    batch: string;
    specialization: string;
    file?: File | null;
}

const Dashboard: React.FC = () => {

    const initialFormState = {
        name: "",
        school: "",
        department: "",
        program: "",
        batch: "",
        specialization: "",
        file: null
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

    const [showSpecializationForm, setShowSpecializationForm] = useState(false);
    const [showStudentForm, setshowStudentForm] = useState(false);
    const [showPhotoUploadForm, setShowPhotoUploadForm] = useState(false);
    const [showAdminForm, setshowAdminForm] = useState(false);
    const [isCustomClass, setIsCustomClass] = useState(false);
    const [customStartYear, setCustomStartYear] = useState("");
    const [customDuration, setCustomDuration] = useState("");
    const [batches, setBatches] = useState([])
    const [specializations, setSpecializations] = useState<string[]>([]);
    const [form, setForm] = useState<UploadFormState>(initialFormState);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [isPhotoUploading, setIsPhotoUploading] = useState(false);
    const [adminForm, setAdminForm] = useState(initialAdminForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [totalSpecialization, setTotalSpecializationCount] = useState(0);
    const [totalStudents, setTotalStudents] = useState(0);
    const [totalAdmins, setTotalAdmins] = useState(0);
    const [statLoading, setStatLoading] = useState(false);
    const [changeTracker, setChangeTracker] = useState(false);

    const departmentMap: Record<string, { code: string; name: string }[]> = { soict, sobt, soe, sohss, sovsas, som, soljg };
    const programMap: Record<string, { code: string; name: string }[]> = { cse, it, ece, ce, me, ee, ar, bt, en, ep, et, mc, lb, mb, il, hc, pm, pr, sw, so, ma, ch, ph, es, ft };

    const diff = new Date().getFullYear() - 2008;
    const years = Array.from({ length: diff + 1 }, (_, i) => 2008 + i);

    const navigate = useNavigate();
    const user = useSelector((state: RootState) => state.admin);
    const [coordinatorAssignments, setCoordinatorAssignments] = useState<any[]>([]);

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
                setForm((prev) => ({
                    ...prev,
                    batch: `${startYearNum}-${endYearLastTwo}`
                }));
            }
        }
    }, [customStartYear, customDuration]);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAdminFormChange = (e: any) => {
        const { name, value } = e.target;
        setAdminForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (file: File) => {
        setForm(prev => ({
            ...prev,
            file
        }));
    };

    const handlePhotoFileChange = (file: File) => {
        setPhotoFile(file);
    };

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
        setChangeTracker(true);
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
            setChangeTracker(false);
            setForm(initialFormState);
        }
    }

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
                setChangeTracker(!changeTracker)
            }
            closeForm();
        } catch (error: any) {
            if (!error.response) {
                alert("Network error. Please check your connection.");
                return;
            }
            const { status, data } = error.response;
            switch (status) {
                case 400:
                    alert(data?.message || "Invalid input. Please check the form.");
                    break;
                case 403:
                    alert("You do not have permission to perform this action.");
                    break;
                case 409:
                    alert("This specialization already exists.");
                    break;
                case 500:
                    alert("Server error. Please try again later.");
                    break;
                default:
                    alert(data?.message || "Unexpected error occurred.");
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
            const data = await addCoordinator(payload);
            if (data) {
                alert('Coordinator added successfully!')
                setChangeTracker(!changeTracker)
            }
            closeForm();
        } catch (error: any) {
            if (!error.response) {
                alert("Network error. Please check your connection.");
                return;
            }
            const { status, data } = error.response;
            switch (status) {
                case 400:
                    alert(data?.message || "Invalid input. Please check the form.");
                    break;
                case 403:
                    alert("You do not have permission to perform this action.");
                    break;
                case 409:
                    alert("Conflict - Input Fields already Exists.");
                    break;
                case 500:
                    alert(error.message);
                    break;
                default:
                    alert(data?.message || "Unexpected error occurred.");
            }
            console.log(error)
        } finally {
            setIsSubmitting(false);
        }
    }

    const downloadSheet = () => {
        const link = document.createElement("a");
        link.href = "/sample.xlsx";
        link.download = "sdms-student-sheet-format.xlsx";
        link.click();
    };

    useEffect(() => {
        const getSpecializationsBatch = async () => {
            if (!form.school || !form.department || !form.program) return;
            try {
                const params = {
                    school: form?.school,
                    department: form?.department,
                    program: form?.program
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
        const getSpecializationsBatch = async () => {
            if (!adminForm.school || !adminForm.department || !adminForm.program) return;
            try {
                const params = {
                    school: adminForm.school,
                    department: adminForm.department,
                    program: adminForm.program
                }
                const data = await searchBatches(params)
                setBatches(data.batches);
            } catch (error) {
                console.log(error);
            }
        };
        getSpecializationsBatch();
    }, [adminForm.school, adminForm.department, adminForm.program]);

    useEffect(() => {
        const controller = new AbortController();

        const getSpecializations = async () => {
            if (!form.school || !form.department || !form.program || !form.batch) {
                setSpecializations([]);
                return;
            }

            // setIsLoading(true);
            try {
                const params = {
                    school: form.school,
                    department: form.department,
                    program: form.program,
                    batch: form.batch,
                };
                const data = await searchSpecializations(params);
                if (!controller.signal.aborted) {
                    setSpecializations(data.names || []);
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    console.error("Error fetching specializations:", error);
                    // setError("Failed to load specializations. Please try again.");
                    setSpecializations([]);
                }
            } finally {
                if (!controller.signal.aborted) {
                    // setIsLoading(false);
                }
            }
        };
        getSpecializations();

        return () => controller.abort();
    }, [form.school, form.department, form.program, form.batch]);

    useEffect(() => {
        const controller = new AbortController();
        const getSpecializations = async () => {
            if (!adminForm.school || !adminForm.department || !adminForm.program || !adminForm.batch) {
                setSpecializations([]);
                return;
            }
            try {
                const params = {
                    school: adminForm.school,
                    department: adminForm.department,
                    program: adminForm.program,
                    batch: adminForm.batch,
                };
                const data = await searchSpecializations(params);
                if (!controller.signal.aborted) {
                    setSpecializations(data.names || []);
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    console.error("Error fetching specializations:", error);
                    // setError("Failed to load specializations. Please try again.");
                    setSpecializations([]);
                }
            }
        };
        getSpecializations();
        return () => controller.abort();
    }, [adminForm.school, adminForm.department, adminForm.program, adminForm.batch]);

    useEffect(() => {
        const fetchCoordinator = async () => {
            if (user?.role !== 'coordinator') return;
            try {
                const data = await getCoordinatorDetails();
                // Support multiple assignment shapes:
                // 1) { user: { ... } } single object
                // 2) { user: [{...}, {...}] } array
                // 3) { coordinators: [...] }
                if (!data) return;
                if (Array.isArray(data.user)) {
                    setCoordinatorAssignments(data.user);
                } else if (Array.isArray(data.coordinators)) {
                    setCoordinatorAssignments(data.coordinators);
                } else if (data.user) {
                    setCoordinatorAssignments([data.user]);
                }
            } catch (err) {
                console.error('Failed to fetch coordinator details', err);
            }
        };
        fetchCoordinator();

        const getSpecializationCount = async () => {
            try {
                setStatLoading(true);
                const data = await countSpecialization()
                setTotalSpecializationCount(data.total);
            } catch (err) {
                console.error("Failed to fetch count:", err);
            } finally {
                setStatLoading(false);
            }
        };

        const getStudentCount = async () => {
            try {
                const data = await getStudentsCount();
                setTotalStudents(data.count);
            } catch (error) {
                console.log(error);
            } finally {
                setStatLoading(false);
            }
        };

        const getAdminCount = async () => {
            try {
                const data = await getAdmins();
                if (data) {
                    setTotalAdmins(data.count)
                }
            } catch (error: any) {
                console.log(error.message)
            }
        }

        if (user?.role === 'admin' || user?.role === 'coordinator') {
            getAdminCount();
        }
        getStudentCount();
        getSpecializationCount();
    }, [changeTracker]);

    return (
        <div className="min-h-full w-full bg-[#f3f3f3] px-4 sm:px-6 lg:px-10 py-6">

            {showSpecializationForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0">
                    {/* Background overlay */}
                    <div
                        className="absolute inset-0 bg-black/30"
                        onClick={closeForm}
                    />

                    {/* Modal */}
                    <div className="relative z-50 w-full max-w-xl rounded bg-white shadow-lg
                    max-h-[90vh] overflow-y-auto p-8 sm:p-6">
                        <h2 className="mb-4 text-lg sm:text-xl text-center font-semibold text-gray-900">
                            Add Batch
                        </h2>
                        <form onSubmit={handleAddSpecialization} className="space-y-4">
                            {/* Course Name */}
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Course Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="name"
                                    placeholder="Data Science"
                                    required
                                    value={form.name}
                                    onChange={handleChange}
                                    className="w-full text-gray-600 border border-[#d9d9d9] rounded px-3 py-2 mt-1"
                                />
                            </div>

                            {/* Grid section */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">School <span className="text-red-500">*</span></label>
                                    <select
                                        name="school"
                                        required
                                        value={form.school}
                                        onChange={handleChange}
                                        className="w-full text-gray-600 border cursor-pointer border-[#d9d9d9] rounded px-3 py-2 mt-1"
                                    >
                                        <option value="">Select School</option>
                                        {school.map((s) => (
                                            <option key={s.code} value={s.code}>
                                                {s.code.toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">Department <span className="text-red-500">*</span></label>
                                    <select
                                        name="department"
                                        required
                                        disabled={!form.school}
                                        value={form.department}
                                        onChange={handleChange}
                                        className="w-full text-gray-600 border cursor-pointer border-[#d9d9d9] rounded px-3 py-2 mt-1 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    >
                                        <option value="">Select Department</option>
                                        {(departmentMap[form.school] || []).map((dept) => (
                                            <option key={dept.code} value={dept.code}>
                                                {dept.code.toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                 <div className="flex items-center gap-2 sm:col-span-2 mt-1">
                                    <input
                                        type="checkbox"
                                        id="customClass"
                                        checked={isCustomClass}
                                        onChange={(e) => {
                                            setIsCustomClass(e.target.checked);
                                            setForm((prev) => ({
                                                ...prev,
                                                program: "",
                                                batch: ""
                                            }));
                                            setCustomStartYear("");
                                            setCustomDuration("");
                                        }}
                                        className="w-4 h-4 cursor-pointer accent-black text-black"
                                    />
                                    <label htmlFor="customClass" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                                        Create custom Program/Class with specific time period (duration)
                                    </label>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">Program <span className="text-red-500">*</span></label>
                                    {isCustomClass ? (
                                        <input
                                            type="text"
                                            name="program"
                                            placeholder="e.g. PhD, BCA, MBA"
                                            required
                                            disabled={!form.department}
                                            value={form.program}
                                            onChange={handleChange}
                                            className="w-full text-gray-600 border border-[#d9d9d9] rounded px-3 py-2 mt-1 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        />
                                    ) : (
                                        <select
                                            name="program"
                                            required
                                            disabled={!form.department}
                                            value={form.program}
                                            onChange={handleChange}
                                            className="w-full text-gray-600 border cursor-pointer border-[#d9d9d9] rounded px-3 py-2 mt-1 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        >
                                            <option value="">Select Program</option>
                                            {(programMap[form.department] || []).map((program) => (
                                                <option key={program.code} value={program.name}>{program.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">Batch / Time Period <span className="text-red-500">*</span></label>
                                    {isCustomClass || (form.program && !["B.Tech", "M.Tech", "B.Tech + M.Tech"].includes(form.program)) ? (
                                        <div className="grid grid-cols-2 gap-2 w-full mt-1">
                                            <div>
                                                <select
                                                    value={customStartYear}
                                                    required
                                                    disabled={!form.program}
                                                    onChange={(e) => setCustomStartYear(e.target.value)}
                                                    className="w-full text-gray-600 border cursor-pointer border-[#d9d9d9] rounded px-3 py-1.5 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                >
                                                    <option value="">Start Year</option>
                                                    {years.map((year) => (
                                                        <option key={year} value={year}>{year}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <select
                                                    value={customDuration}
                                                    required
                                                    disabled={!form.program}
                                                    onChange={(e) => setCustomDuration(e.target.value)}
                                                    className="w-full text-gray-600 border cursor-pointer border-[#d9d9d9] rounded px-3 py-1.5 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                >
                                                    <option value="">Duration</option>
                                                    {[1, 2, 3, 4, 5, 6].map((num) => (
                                                        <option key={num} value={num}>{num} Year{num > 1 ? 's' : ''}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {form.batch && (
                                                <div className="col-span-2 text-xs text-indigo-600 font-semibold mt-1">
                                                    Generated Batch: {form.batch}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <select
                                            name="batch"
                                            required
                                            disabled={!form.program}
                                            value={form.batch}
                                            onChange={handleChange}
                                            className="w-full text-gray-600 border cursor-pointer border-[#d9d9d9] rounded px-3 py-2 mt-1 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        >
                                            <option value="">Select Batch </option>
                                            {form.program == 'B.Tech' ? (years.map((year) => (
                                                <option key={year} value={`${year}-${year - 1996}`}> {year}-{year - 1996}</option>
                                            ))) : ''}
                                            {form.program == 'M.Tech' ? (years.map((year) => (
                                                <option key={year} value={`${year}-${year - 1998}`}> {year}-{year - 1998}</option>
                                            ))) : ''}
                                            {form.program == 'B.Tech + M.Tech' ? (years.map((year) => (
                                                <option key={year} value={`${year}-${year - 1995}`}> {year}-{year - 1995}</option>
                                            ))) : ''}
                                        </select>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className="text-sm text-gray-600 cursor-pointer hover:text-black"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="rounded-lg bg-black px-4 py-2 cursor-pointer text-sm text-white disabled:opacity-60"
                                >
                                    {isSubmitting ? "Saving..." : "Save Batch"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showStudentForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0">
                    {/* Background overlay */}
                    <div
                        className="absolute inset-0 bg-black/30"
                        onClick={closeForm}
                    />

                    {/* Modal */}
                    <div className="relative z-50 w-full max-w-xl rounded bg-white shadow-lg
                    max-h-[90vh] overflow-y-auto p-8 sm:p-6">
                        <h2 className="mb-4 text-lg sm:text-xl text-center font-semibold text-gray-900">
                            Upload Sheet
                        </h2>
                        <form onSubmit={handleUploadStudents} className="space-y-4">

                            {/* Grid section */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">School <span className="text-red-500">*</span></label>
                                    <select name="school" required value={form.school} onChange={handleChange} className="w-full cursor-pointer text-gray-600 border border-[#d9d9d9] rounded px-3 py-2 mt-1">
                                        <option value="">Select School</option>
                                        {school.map((s) => (
                                            <option key={s.code} value={s.code}>
                                                {s.code.toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">Department <span className="text-red-500">*</span></label>
                                    <select name="department" required disabled={!form.school} value={form.department} onChange={handleChange} className="w-full cursor-pointer text-gray-600 border border-[#d9d9d9] rounded px-3 py-2 mt-1 disabled:bg-gray-100 disabled:cursor-not-allowed">
                                        <option value="">Select Department</option>
                                        {(departmentMap[form.school] || []).map((dept) => (
                                            <option key={dept.code} value={dept.code}>
                                                {dept.code.toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Program <span className="text-red-500">*</span></label>
                                    <select name="program" required disabled={!form.department} value={form.program} onChange={handleChange} className="w-full text-gray-600 cursor-pointer border border-[#d9d9d9] rounded px-3 py-2 mt-1 disabled:bg-gray-100 disabled:cursor-not-allowed">
                                        <option value="">Select Program</option>
                                        {(programMap[form.department] || []).map((program) => (
                                            <option key={program.code} value={program.name}>{program.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Batch <span className="text-red-500">*</span></label>
                                    <select
                                        name="batch" required disabled={!form.program} value={form.batch} onChange={handleChange} className="w-full text-gray-600 border cursor-pointer border-[#d9d9d9] rounded px-3 py-2 mt-1 disabled:bg-gray-100 disabled:cursor-not-allowed">
                                        <option value="">Select Batch</option>
                                        {batches.map((batch, index) => (
                                            <option key={index} value={batch}>{batch}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Specialization <span className="text-red-500">*</span></label>
                                    <select name="specialization" required disabled={!form.batch} value={form.specialization} onChange={handleChange} className="w-full cursor-pointer text-gray-600 border border-[#d9d9d9] rounded px-3 py-2 mt-1 disabled:bg-gray-100 disabled:cursor-not-allowed">
                                        <option value="">Select Specialization</option>
                                        {specializations.map((specialization, index) => (
                                            <option key={index} value={specialization}>{specialization}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="sm:col-start-1 sm:col-end-3">
                                    <label className="text-sm font-medium text-gray-700">
                                        Upload Sheet <span className="text-red-500">*</span>
                                    </label>
                                    <p className="text-xs text-gray-500 mt-1">
                                        The file will be reformatted automatically before upload.
                                    </p>

                                    <div onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            const file = e.dataTransfer.files?.[0];
                                            if (file) handleFileChange(file);
                                        }}
                                        className="mt-1 flex flex-col items-center justify-center rounded border-2 border-dashed border-gray-300 px-4 py-6 text-center cursor-pointer hover:border-black transition"
                                        onClick={() => document.getElementById('fileInput')?.click()}>
                                        <p className="text-sm text-gray-600">
                                            Drag & drop XLSX sheet here
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            or click to browse
                                        </p>

                                        {form.file && (
                                            <p className="mt-2 text-xs text-green-600">
                                                Selected: {form.file.name}
                                            </p>
                                        )}
                                    </div>

                                    <input
                                        id="fileInput"
                                        type="file"
                                        accept=".csv,.xls,.xlsx"
                                        className="hidden"
                                        onChange={(e) => {
                                            const selectedFile = e.target.files?.[0];
                                            if (selectedFile) handleFileChange(selectedFile);
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className="text-sm text-gray-600 cursor-pointer hover:text-black"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="rounded-lg bg-black px-4 py-2 cursor-pointer text-sm text-white disabled:opacity-60"
                                >
                                    {isSubmitting ? "Saving..." : "Reformat & Upload"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showPhotoUploadForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0">
                    <div
                        className="absolute inset-0 bg-black/30"
                        onClick={() => setShowPhotoUploadForm(false)}
                    />
                    <div className="relative z-50 w-full max-w-md rounded bg-white shadow-lg max-h-[90vh] overflow-y-auto p-8 sm:p-6">
                        <h2 className="mb-4 text-lg sm:text-xl text-center font-semibold text-gray-900">
                            Upload Student Photo Sheet
                        </h2>
                        <form onSubmit={handleUploadStudentPhotos} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Excel file with Roll No and Photo Data <span className="text-red-500">*</span>
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                    Upload a sheet containing roll numbers and image values (base64 or file path as supported by backend).
                                </p>
                                <div
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const file = e.dataTransfer.files?.[0];
                                        if (file) handlePhotoFileChange(file);
                                    }}
                                    className="mt-3 flex flex-col items-center justify-center rounded border-2 border-dashed border-gray-300 px-4 py-6 text-center cursor-pointer hover:border-black transition"
                                    onClick={() => document.getElementById('photoFileInput')?.click()}
                                >
                                    <p className="text-sm text-gray-600">
                                        Drag & drop the Excel file here
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        or click to browse
                                    </p>
                                    {photoFile && (
                                        <p className="mt-2 text-xs text-green-600">
                                            Selected: {photoFile.name}
                                        </p>
                                    )}
                                </div>
                                <input
                                    id="photoFileInput"
                                    type="file"
                                    accept=".csv,.xls,.xlsx"
                                    className="hidden"
                                    onChange={(e) => {
                                        const selectedFile = e.target.files?.[0];
                                        if (selectedFile) handlePhotoFileChange(selectedFile);
                                    }}
                                />
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowPhotoUploadForm(false)}
                                    className="text-sm text-gray-600 cursor-pointer hover:text-black"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPhotoUploading}
                                    className="rounded-lg bg-black px-4 py-2 cursor-pointer text-sm text-white disabled:opacity-60"
                                >
                                    {isPhotoUploading ? "Uploading..." : "Upload Photos"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAdminForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0">
                    {/* Background overlay */}
                    <div
                        className="absolute inset-0 bg-black/30"
                        onClick={closeForm}
                    />

                    {/* Modal */}
                    <div className="relative z-50 w-full max-w-xl rounded bg-white shadow-lg
                    max-h-[90vh] overflow-y-auto p-8 sm:p-6">
                        <h2 className="mb-4 text-lg sm:text-xl text-center font-semibold text-gray-900">
                            Create Coordinator
                        </h2>
                        <form onSubmit={handleAddCoordinator} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Coordinator Id <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        name="coordinatorId"
                                        placeholder="0041"
                                        required
                                        value={adminForm.coordinatorId}
                                        onChange={handleAdminFormChange}
                                        className="w-full text-gray-600 border border-[#d9d9d9] rounded px-3 py-2 mt-1"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Coordinator Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        name="name"
                                        placeholder="Arun Solanki"
                                        required
                                        value={adminForm.name}
                                        onChange={handleAdminFormChange}
                                        className="w-full text-gray-600 border border-[#d9d9d9] rounded px-3 py-2 mt-1"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Username (email) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        name="email"
                                        placeholder="asolanki@gbu.ac.in"
                                        required
                                        type="email"
                                        value={adminForm.email}
                                        onChange={handleAdminFormChange}
                                        className="w-full text-gray-600 border border-[#d9d9d9] rounded px-3 py-2 mt-1"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Phone no <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        name="phone"
                                        placeholder="9650906633"
                                        required
                                        type="phone"
                                        maxLength={10}
                                        value={adminForm.phone}
                                        onChange={handleAdminFormChange}
                                        className="w-full text-gray-600 border border-[#d9d9d9] rounded px-3 py-2 mt-1"
                                    />
                                </div>
                            </div>

                            {/* Grid section */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">School <span className="text-red-500">*</span></label>
                                    <select
                                        name="school"
                                        required
                                        value={adminForm.school}
                                        onChange={handleAdminFormChange}
                                        className="w-full text-gray-600 border cursor-pointer border-[#d9d9d9] rounded px-3 py-2 mt-1"
                                    >
                                        <option value="">Select School</option>
                                        {school.map((s) => (
                                            <option key={s.code} value={s.code}>
                                                {s.code.toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Department <span className="text-red-500">*</span></label>
                                    <select name="department" required disabled={!adminForm.school} value={adminForm.department} onChange={handleAdminFormChange} className="w-full cursor-pointer text-gray-600 border border-[#d9d9d9] rounded px-3 py-2 mt-1 disabled:bg-gray-100 disabled:cursor-not-allowed">
                                        <option value="">Select Department</option>
                                        {(departmentMap[adminForm.school] || []).map((dept) => (
                                            <option key={dept.code} value={dept.code}>
                                                {dept.code.toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Program <span className="text-red-500">*</span></label>
                                    <select name="program" required disabled={!adminForm.department} value={adminForm.program} onChange={handleAdminFormChange} className="w-full text-gray-600 cursor-pointer border border-[#d9d9d9] rounded px-3 py-2 mt-1 disabled:bg-gray-100 disabled:cursor-not-allowed">
                                        <option value="">Select Program</option>
                                        {(programMap[adminForm.department] || []).map((program) => (
                                            <option key={program.code} value={program.name}>{program.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Batch <span className="text-red-500">*</span></label>
                                    <select
                                        name="batch" required disabled={!adminForm.program} value={adminForm.batch} onChange={handleAdminFormChange} className="w-full text-gray-600 border cursor-pointer border-[#d9d9d9] rounded px-3 py-2 mt-1 disabled:bg-gray-100 disabled:cursor-not-allowed">
                                        <option value="">Select Batch</option>
                                        {batches.map((batch, index) => (
                                            <option key={index} value={batch}>{batch}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Specialization <span className="text-red-500">*</span></label>
                                    <select name="specialization" required disabled={!adminForm.batch} value={adminForm.specialization} onChange={handleAdminFormChange} className="w-full cursor-pointer text-gray-600 border border-[#d9d9d9] rounded px-3 py-2 mt-1 disabled:bg-gray-100 disabled:cursor-not-allowed">
                                        <option value="">Select Specialization</option>
                                        {specializations.map((specialization, index) => (
                                            <option key={index} value={specialization}>{specialization}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className="text-sm text-gray-600 cursor-pointer hover:text-black"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="rounded-lg bg-black px-4 py-2 cursor-pointer text-sm text-white disabled:opacity-60"
                                >
                                    {isSubmitting ? "Creating..." : "Create Coordinator"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-2xl font-semibold mb-5">Dashboard</h1>
            </div>

            <div className="max-w-350 mx-auto flex flex-col lg:flex-row gap-8">

                {/* LEFT */}
                <div className="w-full lg:w-[70%] space-y-4">

                    {/* Coordinator Classes */}
                    {user?.role === 'coordinator' && coordinatorAssignments.length > 0 && (
                        <section className="mb-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {coordinatorAssignments.map((c, idx) => {
                                    const themes = [
                                        { bg: "bg-blue-50/80", icon: "text-[#2563eb]", title: "text-[#1d4ed8]" },
                                        { bg: "bg-emerald-50/80", icon: "text-[#16a34a]", title: "text-[#16a34a]" },
                                        { bg: "bg-purple-50/80", icon: "text-[#9333ea]", title: "text-[#9333ea]" },
                                        { bg: "bg-amber-50/80", icon: "text-[#d97706]", title: "text-[#d97706]" },
                                    ];
                                    const theme = themes[idx % themes.length];
                                    const specName = c.specialization || c.department || '';
                                    const specText = specName ? `(${specName})` : '';
                                    const batchText = c.batch || '';
                                    const classTitle = `${c.program || ''} ${specText} ${batchText}`.replace(/\s+/g, ' ').trim() || 'Class';

                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => navigate(`/admin/records/${encodeURIComponent(c.school)}/${encodeURIComponent(c.department)}/${encodeURIComponent(c.program)}/${encodeURIComponent(c.batch)}/${encodeURIComponent(c.specialization)}`)}
                                            className="cursor-pointer bg-white border border-[#a5b4fc]/70 rounded-xl p-5 shadow-xs hover:shadow-md hover:border-indigo-400 transition-all flex items-center gap-4"
                                        >
                                            <div className={`h-12 w-12 rounded-full ${theme.bg} flex items-center justify-center shrink-0`}>
                                                <GraduationCap className={`w-6 h-6 ${theme.icon}`} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-semibold text-gray-500 tracking-wide">
                                                    Class Name
                                                </span>
                                                <h3 className={`text-base sm:text-lg font-bold ${theme.title} mt-0.5`}>
                                                    {classTitle}
                                                </h3>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Quick Actions */}
                    <section className="space-y-3">
                        <h2 className="text-lg font-medium text-gray-800">
                            Quick Actions
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {user.role === 'coordinator' &&
                                <QuickActionCard icon={<BookOpen />} title="My Class" description="View your assigned class and students" onClick={() => navigate("/admin/classes")} />
                            }
                            <QuickActionCard icon={<UserPlus />} title="Add Student" description="Manually register a new student" onClick={() => navigate("/admin/register-student")} />
                            <QuickActionCard icon={<Upload />} title="Upload Sheet" description="Bulk upload using CSV / Excel" onClick={() => setshowStudentForm(!showStudentForm)} />
                            <QuickActionCard icon={<Upload />} title="Upload Student Photos" description="Upload roll numbers with image data" onClick={() => setShowPhotoUploadForm(true)} />
                            <QuickActionCard icon={<FileText />} title="Reformat & Upload" description="Reformat Excel data and insert in one step" onClick={() => setshowStudentForm(true)} />
                            <QuickActionCard icon={<Users />} title="Browse Student Records" description="View and search all student records" onClick={() => navigate("/admin/records")} />
                            {user.role === 'admin' &&
                                <QuickActionCard icon={<BookCopy />} title="Create Specializations" description="Create student batches and courses" onClick={() => setShowSpecializationForm(true)} />
                            }
                            {user.role === 'admin' &&
                                <QuickActionCard icon={<TableOfContents />} title="Manage Specializations" description="Update student batches and courses" onClick={() => navigate("/admin/update-specialization")} />
                            }
                            {user.role === 'admin' &&
                                <QuickActionCard icon={<Users />} title="Create Coordinators" description="Add Coordinators Credentials" onClick={() => setshowAdminForm(true)} />
                            }
                        </div>
                    </section>

                    {/* Instructions */}
                    <section className="space-y-3">
                        <h2 className="text-lg font-medium text-gray-800">
                            Instructions
                        </h2>
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm w-full min-w-full">
                            <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2 mb-5">
                                <li>Download the Excel sheet format.</li>
                                <li>Fill student details according to the provided columns.</li>
                                <li>All allowed fields are mentioned in sheet, any other entry will not be supported.</li>
                                <li>Do not change the column headers.</li>
                                <li>Save the file as ".xls".</li>
                                <li>Upload the completed sheet using the Upload Sheet option.</li>
                            </ol>

                            <button
                                onClick={downloadSheet}
                                className="w-full cursor-pointer bg-gray-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-gray-800 transition"
                            >
                                Download Sheet Format
                            </button>

                        </div>
                    </section>
                </div>

                {/* RIGHT */}
                <aside className="w-full lg:w-[30%] space-y-4">
                    <section className="space-y-3">
                        <h2 className="text-lg font-medium text-gray-800">Statistics</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                            <StatCard label="Departments" value={totalDepartments} />
                            <StatCard label="Specializations" value={Number(totalSpecialization)} loading={statLoading} />
                            <StatCard label="Coordinators" value={totalAdmins} />
                            <StatCard label="Students" value={totalStudents} loading={statLoading} />
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    )
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({ icon, title, description, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="group text-left cursor-pointer bg-white border border-gray-200 rounded-xl p-5 transition-all
                 hover:border-gray-300 hover:shadow-sm active:scale-[0.98]"
        >
            <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg
                        bg-gray-100 text-gray-700
                        group-hover:bg-black group-hover:text-white transition-colors">
                    {icon}
                </div>

                <div className="space-y-1">
                    <h3 className="font-semibold text-gray-900">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-500">
                        {description}
                    </p>
                </div>
            </div>
        </button>
    )
}


const StatCard: React.FC<StatCardProps> = ({ value, label, loading }) => {
    return (
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-5 hover:shadow-sm transition">
            <p className="text-sm text-gray-500">{label}</p>

            {loading ? (
                // Skeleton Loader
                <div className="mt-2 h-10 w-8 bg-gray-200 rounded animate-pulse"></div>
            ) : (
                <p className="text-3xl font-semibold text-gray-900 mt-2">
                    {value}
                </p>
            )}
        </div>
    )
}

export default Dashboard