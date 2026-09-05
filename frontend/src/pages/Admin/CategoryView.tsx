import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
    ArrowLeft,
    FileSpreadsheet,
    Search,
    Edit3,
    X,
    Loader2,
    CheckCircle2,
    SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";

import AdminSideNav from "../../components/Admin/AdminSideNav";
import Header from "../../components/Admin/Header";
import Footer from "../../components/Admin/Footer";
import Dropdown from "../../utils/Dropdown";
import { downloadExcel } from "../../utils/excel";
import type { StudentProps } from "../../types/types";
import {
    deleteSpecializationStudents,
    getFilteredStudents,
    bulkUpdateStudents,
} from "../../lib/user.api";
import { useSelector } from "react-redux";
import type { RootState } from "../../context/app/store";

const sortOptions = ["Roll No", "Name", "Category", "Enrollment Status", "Admission Type"];

const CategoryDomain = () => {
    const [students, setStudents] = useState<StudentProps[]>([]);
    const [deleting, setDeleting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [menu] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortField, setSortField] = useState("Roll No");
    const [exporting, setExporting] = useState(false);

    const [accessDenied, setAccessDenied] = useState(false);
    const [accessErrorMessage, setAccessErrorMessage] = useState("");

    // Bulk selection and edit states
    const [selectedRollNos, setSelectedRollNos] = useState<string[]>([]);
    const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [enabledFields, setEnabledFields] = useState<Record<string, boolean>>({});
    const [fieldValues, setFieldValues] = useState<Record<string, any>>({
        status: "active",
        enrollmentStatus: "Regular",
        admissionType: "Entrance Examination",
        admissionYear: "",
        internshipStatus: "Not Applied",
        internshipCompany: "",
        internshipDOJ: "",
        internshipDOE: "",
        internshipType: "Paid",
        placementStatus: "Unplaced",
        placementCompany: "",
        placementDOJ: "",
        placementDOE: "",
        placementType: "Paid",
        hosteller: "Hosteller",
        category: "General",
        specialization: "",
        semesterNumber: 1,
        semesterRegistered: "Registered",
    });

    const navigate = useNavigate();
    const location = useLocation();
    const user = useSelector((state: RootState) => state.admin);

    const { school, department, program, batch, specialization } = useParams();

    const isChairperson = location.pathname.startsWith("/chairperson") || user.role === "chairperson";
    const isCoordinator = location.pathname.startsWith("/coordinator") || user.role === "coordinator";
    const basePath = isChairperson ? "/chairperson" : isCoordinator ? "/coordinator" : "/admin";

    const loadStudents = useCallback(async () => {
        if (!school || !department || !program || !batch || !specialization) {
            setStudents([]);
            return;
        }

        try {
            setIsLoading(true);
            setAccessDenied(false);
            const data = await getFilteredStudents(school, department, program, batch, specialization);
            const studentArray = Array.isArray(data?.students) ? data.students : [];
            setStudents(studentArray);
        } catch (error: any) {
            if (error?.response?.status === 403 || error?.response?.data?.message?.includes("Access denied")) {
                setAccessDenied(true);
                setAccessErrorMessage(error?.response?.data?.message || "You are not assigned to manage or view this class.");
            } else {
                toast.error(error?.response?.data?.message || error?.message || "Failed to fetch students");
            }
            setStudents([]);
        } finally {
            setIsLoading(false);
        }
    }, [school, department, program, batch, specialization]);

    useEffect(() => {
        loadStudents();
    }, [loadStudents]);

    const handleDelete = async () => {
        if (window.confirm("This action will delete all the students associated with this specialization!")) {
            try {
                setDeleting(true);
                const data = await deleteSpecializationStudents(school, department, program, batch, specialization);
                if (data) {
                    toast.success(`Deleted all students in - ${school} > ${department} > ${program} ${batch} > ${specialization}`);
                    setStudents([]);
                    setSelectedRollNos([]);
                }
            } catch (error: any) {
                toast.error(error?.response?.data?.message || error.message);
            } finally {
                setDeleting(false);
            }
        }
    };

    const exportStudentsExcel = async () => {
        if (!students.length) {
            toast.error("No students available to export for this class.");
            return;
        }
        setExporting(true);
        const t = toast.loading("Preparing Excel export…");
        try {
            const headers = [
                "Sr No", "Roll No", "Enrollment No", "Full Name", "Father Name", "Mother Name",
                "Gender", "Date of Birth", "Category", "Aadhaar", "Mobile", "Email", "Address",
                "School", "Department", "Program", "Batch", "Specialization",
                "Hosteller", "Enrollment Status", "Admission Type", "12th Compartment", "Admission Year",
                "Internship Status", "Placement Status", "Status",
            ];
            const rows = students.map((s, idx) => [
                idx + 1,
                s.rollNo,
                s.enrollmentNo,
                s.fullName,
                s.fatherName,
                s.motherName,
                s.gender,
                s.dob ? new Date(s.dob).toISOString().slice(0, 10) : "",
                s.category,
                s.nationalId,
                s.mobile,
                s.email,
                s.address,
                s.school,
                s.department,
                s.program,
                s.batch,
                s.specialization,
                s.hosteller,
                s.enrollmentStatus,
                s.admissionType,
                s.twelfthCompartment,
                s.admissionYear,
                s.internshipStatus,
                s.placementStatus,
                s.status,
            ]);
            const safe = `${program || "program"}_${batch || "batch"}_${specialization || "specialization"}`
                .replace(/\s+/g, "_").replace(/[^\w\-]/g, "");
            await downloadExcel(
                `${safe}_students.xlsx`,
                [{ name: "Students", rows: [headers, ...rows] }]
            );
            toast.success("Excel downloaded", { id: t });
        } catch (e: any) {
            toast.error(e?.message || "Failed to export", { id: t });
        } finally {
            setExporting(false);
        }
    };

    const filteredAndSortedStudents = useMemo(
        () =>
            [...students]
                .filter((student) => {
                    const query = searchQuery.toLowerCase().trim();
                    if (!query) return true;
                    return (
                        student.fullName.toLowerCase().includes(query) ||
                        student.rollNo.toLowerCase().includes(query) ||
                        (student.enrollmentNo && student.enrollmentNo.toLowerCase().includes(query))
                    );
                })
                .sort((a, b) => {
                    if (sortField === "Name") return a.fullName.localeCompare(b.fullName, undefined, { sensitivity: "base" });
                    if (sortField === "Category") return a.category.localeCompare(b.category, undefined, { sensitivity: "base" });
                    if (sortField === "Enrollment Status") return (a.enrollmentStatus || "").localeCompare(b.enrollmentStatus || "", undefined, { sensitivity: "base" });
                    if (sortField === "Admission Type") return (a.admissionType || "").localeCompare(b.admissionType || "", undefined, { sensitivity: "base" });
                    return a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true, sensitivity: "base" });
                }),
        [students, searchQuery, sortField]
    );

    // Selection handlers
    const isAllSelected =
        filteredAndSortedStudents.length > 0 &&
        filteredAndSortedStudents.every((s) => selectedRollNos.includes(s.rollNo));

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedRollNos([]);
        } else {
            setSelectedRollNos(filteredAndSortedStudents.map((s) => s.rollNo));
        }
    };

    const toggleSelectStudent = (rollNo: string) => {
        setSelectedRollNos((prev) =>
            prev.includes(rollNo) ? prev.filter((x) => x !== rollNo) : [...prev, rollNo]
        );
    };

    // Bulk edit submit
    const handleBulkSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedRollNos.length === 0) {
            toast.error("Please select at least one student.");
            return;
        }

        const updates: Record<string, any> = {};
        if (enabledFields.status) updates.status = fieldValues.status;
        if (enabledFields.enrollmentStatus) updates.enrollmentStatus = fieldValues.enrollmentStatus;
        if (enabledFields.admissionType) updates.admissionType = fieldValues.admissionType;
        if (enabledFields.admissionYear && fieldValues.admissionYear.trim()) {
            updates.admissionYear = fieldValues.admissionYear.trim();
        }
        if (enabledFields.internshipStatus) updates.internshipStatus = fieldValues.internshipStatus;
        if (enabledFields.internshipCompany && fieldValues.internshipCompany.trim()) updates.internshipCompany = fieldValues.internshipCompany.trim();
        if (enabledFields.internshipDOJ) updates.internshipDOJ = fieldValues.internshipDOJ;
        if (enabledFields.internshipDOE) updates.internshipDOE = fieldValues.internshipDOE;
        if (enabledFields.internshipType) updates.internshipType = fieldValues.internshipType;
        if (enabledFields.placementStatus) updates.placementStatus = fieldValues.placementStatus;
        if (enabledFields.placementCompany && fieldValues.placementCompany.trim()) updates.placementCompany = fieldValues.placementCompany.trim();
        if (enabledFields.placementDOJ) updates.placementDOJ = fieldValues.placementDOJ;
        if (enabledFields.placementDOE) updates.placementDOE = fieldValues.placementDOE;
        if (enabledFields.placementType) updates.placementType = fieldValues.placementType;
        if (enabledFields.hosteller) updates.hosteller = fieldValues.hosteller;
        if (enabledFields.category) updates.category = fieldValues.category;
        if (enabledFields.specialization && fieldValues.specialization.trim()) {
            updates.specialization = fieldValues.specialization.trim();
        }
        if (enabledFields.semesterRegistration) {
            updates.semesterRegistration = {
                semesterNumber: Number(fieldValues.semesterNumber),
                registered: fieldValues.semesterRegistered,
            };
        }

        if (Object.keys(updates).length === 0) {
            toast.error("Check at least one field box to apply updates.");
            return;
        }

        try {
            setBulkLoading(true);
            const res = await bulkUpdateStudents(selectedRollNos, updates);
            if (res.success) {
                toast.success(`Successfully updated ${res.count} student(s).`);
                setIsBulkEditOpen(false);
                setSelectedRollNos([]);
                setEnabledFields({});
                loadStudents();
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to update students");
        } finally {
            setBulkLoading(false);
        }
    };

    return (
        <div className="h-screen w-full flex bg-[#f8f9fa] overflow-hidden">
            <aside className="shrink-0 h-screen sticky top-0 z-20">
                <AdminSideNav activeTab={"records"} />
            </aside>

            <div className={`flex flex-col flex-1 min-w-0 h-screen overflow-hidden transition-all batch-300 ${!menu ? "sm:w-[80vw] w-[85vw]" : "w-[95vw]"}`}>
                <div className="shrink-0 z-10">
                    <Header />
                </div>

                <main className="flex-1 overflow-y-auto bg-[#f3f3f3] min-h-0">
                    <div className="px-4 sm:px-6 lg:px-10 py-6">
                        {accessDenied ? (
                            <div className="bg-white border border-red-200 rounded-xl p-8 text-center max-w-lg mx-auto my-12 shadow-sm">
                                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 font-bold text-xl">!</div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
                                <p className="text-sm text-gray-600 mb-6">
                                    {accessErrorMessage || `You are not assigned to manage or view this class (${school} > ${department} > ${program} ${batch}).`}
                                </p>
                                <button
                                    onClick={() => navigate(`${basePath}/dashboard`)}
                                    className="px-5 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition cursor-pointer"
                                >
                                    Return to Dashboard
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Top action bar: Back | breadcrumb | action buttons */}
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => navigate(-1)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-200 border border-[#d9d9d9] rounded hover:bg-gray-300 cursor-pointer"
                                        >
                                            <ArrowLeft size={14} /> Back
                                        </button>
                                        <h3 className="text-sm sm:text-base text-gray-700 truncate">
                                            <span className="text-gray-500">{school?.toLocaleUpperCase()} &gt; </span>
                                            <span className="text-gray-500">{department?.toLocaleUpperCase()} &gt; </span>
                                            <span className="font-semibold text-gray-900">{program} {batch} &gt; {specialization}</span>
                                        </h3>
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        <button
                                            onClick={() => navigate(`${basePath}/register-student`)}
                                            className="px-3 py-1.5 text-sm bg-blue-600 text-white border border-blue-800 rounded hover:bg-blue-700 cursor-pointer"
                                        >
                                            + Add Student
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (selectedRollNos.length === 0) {
                                                    setSelectedRollNos(filteredAndSortedStudents.map((s) => s.rollNo));
                                                }
                                                setIsBulkEditOpen(true);
                                            }}
                                            disabled={!students.length}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#7b3b5a] text-white border border-[#5d2b43] rounded hover:bg-[#68304b] disabled:opacity-50 cursor-pointer font-medium shadow-xs"
                                            title="Bulk edit student details for this class"
                                        >
                                            <Edit3 size={14} />
                                            Bulk Edit Details {selectedRollNos.length > 0 ? `(${selectedRollNos.length})` : ""}
                                        </button>
                                        <button
                                            onClick={exportStudentsExcel}
                                            disabled={exporting || !students.length}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-600 text-white border border-emerald-800 rounded hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                                            title="Download all students in this class as Excel"
                                        >
                                            <FileSpreadsheet size={14} />
                                            {exporting ? "Exporting…" : "Export Excel"}
                                        </button>
                                        {user.role === "admin" && (
                                            <button
                                                onClick={handleDelete}
                                                className="px-3 py-1.5 text-sm text-white bg-red-600 border border-red-800 rounded hover:bg-red-700 cursor-pointer"
                                            >
                                                {deleting ? "Deleting…" : "Delete"}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Selection Floating Toolbar */}
                                {selectedRollNos.length > 0 && (
                                    <div className="mb-4 p-3 bg-[#7b3b5a]/10 border border-[#7b3b5a]/30 rounded-xl flex items-center justify-between flex-wrap gap-3 animate-in fade-in">
                                        <div className="flex items-center gap-3 text-sm">
                                            <span className="font-bold text-[#7b3b5a]">
                                                {selectedRollNos.length} of {students.length} student(s) selected
                                            </span>
                                            <button
                                                type="button"
                                                onClick={toggleSelectAll}
                                                className="text-xs text-[#7b3b5a] underline hover:text-[#5e2741] cursor-pointer"
                                            >
                                                {isAllSelected ? "Deselect All" : `Select All ${filteredAndSortedStudents.length}`}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedRollNos([])}
                                                className="text-xs text-gray-500 underline hover:text-gray-700 cursor-pointer"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsBulkEditOpen(true)}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#7b3b5a] text-white text-xs font-semibold rounded-lg hover:bg-[#652f49] transition shadow-xs cursor-pointer"
                                        >
                                            <Edit3 size={14} /> Bulk Edit Details ({selectedRollNos.length})
                                        </button>
                                    </div>
                                )}

                                {/* Search + sort row */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                    <div className="flex items-center gap-2 bg-white border border-[#d9d9d9] rounded h-11 px-3 sm:w-96">
                                        <Search size={14} className="text-gray-500" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search by name, roll no, or enrollment no"
                                            className="flex-1 bg-transparent outline-none text-sm"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <span className="hidden sm:inline">Sort by</span>
                                        <Dropdown categories={sortOptions} selected={sortField} onSelect={setSortField} />
                                    </div>
                                </div>

                                {/* Table card with sticky header */}
                                <div className="bg-white border border-[#d9d9d9] rounded-lg overflow-hidden shadow-xs">
                                    <div className="overflow-x-auto">
                                        <div className="max-h-[60vh] overflow-y-auto">
                                            <table className="min-w-max w-full text-sm text-center bg-white">
                                                <thead className="font-semibold sticky top-0 bg-white z-10 border-b border-[#d9d9d9]">
                                                    <tr className="h-12">
                                                        <th className="px-3 w-10">
                                                            <input
                                                                type="checkbox"
                                                                checked={isAllSelected}
                                                                onChange={toggleSelectAll}
                                                                className="w-4 h-4 text-[#7b3b5a] rounded border-gray-300 focus:ring-[#7b3b5a] cursor-pointer"
                                                            />
                                                        </th>
                                                        <th className="px-3 whitespace-nowrap w-14">Sr No</th>
                                                        <th className="px-3 whitespace-nowrap w-16">Photo</th>
                                                        <th className="px-3 whitespace-nowrap">Roll No</th>
                                                        <th className="px-3 whitespace-nowrap text-left pl-4">Full Name</th>
                                                        <th className="px-3 whitespace-nowrap text-left pl-4">Father's Name</th>
                                                        <th className="px-3 whitespace-nowrap">Category</th>
                                                        <th className="px-3 whitespace-nowrap">Enrollment Status</th>
                                                        <th className="px-3 whitespace-nowrap">Admission Type</th>
                                                        <th className="px-3 whitespace-nowrap w-28">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {isLoading ? (
                                                        Array.from({ length: 10 }).map((_, index) => (
                                                            <tr key={index} className="bg-[#f8f9fa] border-t border-[#d9d9d9] h-16 animate-pulse">
                                                                {Array.from({ length: 10 }, (_, i) => (
                                                                    <td key={i} className="px-3">
                                                                        <div className="h-7 w-16 mx-auto bg-gray-300 rounded" />
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))
                                                    ) : filteredAndSortedStudents.length > 0 ? (
                                                        filteredAndSortedStudents.map((item, index) => {
                                                            const isChecked = selectedRollNos.includes(item.rollNo);
                                                            return (
                                                                <tr
                                                                    key={item.rollNo}
                                                                    className={`border-t border-[#d9d9d9] h-16 transition ${
                                                                        isChecked ? "bg-purple-50 hover:bg-purple-100/60" : "bg-[#f8f9fa] hover:bg-gray-100"
                                                                    }`}
                                                                >
                                                                    <td className="px-3">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isChecked}
                                                                            onChange={() => toggleSelectStudent(item.rollNo)}
                                                                            className="w-4 h-4 text-[#7b3b5a] rounded border-gray-300 focus:ring-[#7b3b5a] cursor-pointer"
                                                                        />
                                                                    </td>
                                                                    <td className="px-3 whitespace-nowrap text-gray-500 font-mono">{index + 1}</td>
                                                                    <td className="px-3 whitespace-nowrap">
                                                                        <div className="flex justify-center items-center">
                                                                            {item.photo ? (
                                                                                <img
                                                                                    src={item.photo}
                                                                                    alt={item.fullName}
                                                                                    className="w-10 h-10 rounded-full object-cover border border-gray-300 shadow-xs"
                                                                                />
                                                                            ) : (
                                                                                <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 font-bold border border-gray-300 flex items-center justify-center shadow-xs">
                                                                                    {item.fullName?.charAt(0).toUpperCase() ?? "?"}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-3 whitespace-nowrap font-mono">{item.rollNo?.toLocaleUpperCase()}</td>
                                                                    <td className="px-3 whitespace-nowrap text-left pl-4 font-medium text-gray-900">{item.fullName}</td>
                                                                    <td className="px-3 whitespace-nowrap text-left pl-4 text-gray-700">{item.fatherName}</td>
                                                                    <td className="px-3 whitespace-nowrap">{item.category}</td>
                                                                    <td className="px-3 whitespace-nowrap">{item.enrollmentStatus}</td>
                                                                    <td className="px-3 whitespace-nowrap">{item.admissionType}</td>
                                                                    <td className="px-3 whitespace-nowrap">
                                                                        <div className="flex items-center justify-center gap-1.5">
                                                                            <button
                                                                                onClick={() => navigate(`${basePath}/records/${encodeURIComponent(item.rollNo)}`)}
                                                                                className="px-2.5 py-1 bg-gray-200 border border-[#d9d9d9] rounded hover:bg-gray-300 transition text-xs font-medium cursor-pointer"
                                                                            >
                                                                                View
                                                                            </button>
                                                                            <button
                                                                                onClick={() => navigate(`${basePath}/register-student`, {
                                                                                    state: {
                                                                                        mode: "edit",
                                                                                        student: item,
                                                                                        school,
                                                                                        department,
                                                                                        program,
                                                                                        batch,
                                                                                    },
                                                                                })}
                                                                                className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 transition text-xs font-medium cursor-pointer"
                                                                            >
                                                                                Edit
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    ) : (
                                                        <tr className="border-t border-[#d9d9d9] h-16">
                                                            <td colSpan={10} className="text-center align-middle text-gray-600 py-6">
                                                                {students.length > 0 ? "No students match your search query" : "No student found in the selected course"}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    <div className="px-4 py-2 border-t border-[#d9d9d9] bg-[#f8f9fa] text-xs text-gray-600 flex items-center justify-between">
                                        <span>Showing {filteredAndSortedStudents.length} of {students.length} students</span>
                                        <span>Sorted by {sortField}</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </main>

                <div className="shrink-0 z-10 border-t border-[#d9d9d9] bg-[#f8f9fa]">
                    <Footer />
                </div>
            </div>

            {/* Bulk Edit Modal */}
            {isBulkEditOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-[#fafafa]">
                            <div>
                                <div className="flex items-center gap-2">
                                    <SlidersHorizontal className="text-[#7b3b5a]" size={20} />
                                    <h2 className="text-lg font-bold text-gray-900">
                                        Bulk Edit Student Details
                                    </h2>
                                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#7b3b5a]/10 text-[#7b3b5a] font-semibold">
                                        {selectedRollNos.length} Selected
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Check the box next to any field you want to update across all {selectedRollNos.length} selected students.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsBulkEditOpen(false)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form id="bulkEditForm" onSubmit={handleBulkSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Status */}
                                <div className="p-3 border rounded-xl bg-gray-50/50 space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-gray-800">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(enabledFields.status)}
                                            onChange={(e) => setEnabledFields((p) => ({ ...p, status: e.target.checked }))}
                                            className="w-4 h-4 text-[#7b3b5a] rounded"
                                        />
                                        Student Academic Status
                                    </label>
                                    <select
                                        disabled={!enabledFields.status}
                                        value={fieldValues.status}
                                        onChange={(e) => setFieldValues((p) => ({ ...p, status: e.target.value }))}
                                        className="w-full text-xs p-2 border rounded-md bg-white disabled:bg-gray-100 disabled:opacity-50"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>

                                {/* Enrollment Status */}
                                <div className="p-3 border rounded-xl bg-gray-50/50 space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-gray-800">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(enabledFields.enrollmentStatus)}
                                            onChange={(e) => setEnabledFields((p) => ({ ...p, enrollmentStatus: e.target.checked }))}
                                            className="w-4 h-4 text-[#7b3b5a] rounded"
                                        />
                                        Enrollment Status
                                    </label>
                                    <select
                                        disabled={!enabledFields.enrollmentStatus}
                                        value={fieldValues.enrollmentStatus}
                                        onChange={(e) => setFieldValues((p) => ({ ...p, enrollmentStatus: e.target.value }))}
                                        className="w-full text-xs p-2 border rounded-md bg-white disabled:bg-gray-100 disabled:opacity-50"
                                    >
                                        <option value="Regular">Regular</option>
                                        <option value="Lateral Entry">Lateral Entry</option>
                                        <option value="Re-admitted">Re-admitted</option>
                                        <option value="Ex-Student">Ex-Student</option>
                                    </select>
                                </div>

                                {/* Admission Type */}
                                <div className="p-3 border rounded-xl bg-gray-50/50 space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-gray-800">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(enabledFields.admissionType)}
                                            onChange={(e) => setEnabledFields((p) => ({ ...p, admissionType: e.target.checked }))}
                                            className="w-4 h-4 text-[#7b3b5a] rounded"
                                        />
                                        Admission Type
                                    </label>
                                    <select
                                        disabled={!enabledFields.admissionType}
                                        value={fieldValues.admissionType}
                                        onChange={(e) => setFieldValues((p) => ({ ...p, admissionType: e.target.value }))}
                                        className="w-full text-xs p-2 border rounded-md bg-white disabled:bg-gray-100 disabled:opacity-50"
                                    >
                                        <option value="Entrance Examination">Entrance Examination</option>
                                        <option value="Direct Admission">Direct Admission</option>
                                        <option value="Management Quota">Management Quota</option>
                                    </select>
                                </div>

                                {/* Admission Year */}
                                <div className="p-3 border rounded-xl bg-gray-50/50 space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-gray-800">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(enabledFields.admissionYear)}
                                            onChange={(e) => setEnabledFields((p) => ({ ...p, admissionYear: e.target.checked }))}
                                            className="w-4 h-4 text-[#7b3b5a] rounded"
                                        />
                                        Admission Year
                                    </label>
                                    <input
                                        type="text"
                                        disabled={!enabledFields.admissionYear}
                                        value={fieldValues.admissionYear}
                                        onChange={(e) => setFieldValues((p) => ({ ...p, admissionYear: e.target.value }))}
                                        placeholder="e.g. 2025"
                                        className="w-full text-xs p-2 border rounded-md bg-white disabled:bg-gray-100 disabled:opacity-50"
                                    />
                                </div>

                                {/* Internship Status */}
                                <div className="p-3 border rounded-xl bg-gray-50/50 space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-gray-800">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(enabledFields.internshipStatus)}
                                            onChange={(e) => setEnabledFields((p) => ({ ...p, internshipStatus: e.target.checked }))}
                                            className="w-4 h-4 text-[#7b3b5a] rounded"
                                        />
                                        Internship Status
                                    </label>
                                    <select
                                        disabled={!enabledFields.internshipStatus}
                                        value={fieldValues.internshipStatus}
                                        onChange={(e) => setFieldValues((p) => ({ ...p, internshipStatus: e.target.value }))}
                                        className="w-full text-xs p-2 border rounded-md bg-white disabled:bg-gray-100 disabled:opacity-50"
                                    >
                                        <option value="Not Applied">Not Applied</option>
                                        <option value="Searching">Searching</option>
                                        <option value="Ongoing">Ongoing</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>

                                {/* Internship Company & Period */}
                                <div className="p-3 border rounded-xl bg-gray-50/50 space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-gray-800">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(enabledFields.internshipCompany)}
                                            onChange={(e) => setEnabledFields((p) => ({ ...p, internshipCompany: e.target.checked, internshipDOJ: e.target.checked, internshipDOE: e.target.checked, internshipType: e.target.checked }))}
                                            className="w-4 h-4 text-[#7b3b5a] rounded"
                                        />
                                        Internship Company & Period
                                    </label>
                                    <input
                                        type="text"
                                        disabled={!enabledFields.internshipCompany}
                                        value={fieldValues.internshipCompany}
                                        onChange={(e) => setFieldValues((p) => ({ ...p, internshipCompany: e.target.value }))}
                                        placeholder="Company name"
                                        className="w-full text-xs p-2 border rounded-md bg-white disabled:bg-gray-100 disabled:opacity-50"
                                    />
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <input
                                            type="date"
                                            disabled={!enabledFields.internshipCompany}
                                            value={fieldValues.internshipDOJ}
                                            onChange={(e) => setFieldValues((p) => ({ ...p, internshipDOJ: e.target.value }))}
                                            className="w-full text-[11px] p-1.5 border rounded-md bg-white disabled:bg-gray-100 disabled:opacity-50"
                                            title="DOJ"
                                        />
                                        <input
                                            type="date"
                                            disabled={!enabledFields.internshipCompany}
                                            value={fieldValues.internshipDOE}
                                            onChange={(e) => setFieldValues((p) => ({ ...p, internshipDOE: e.target.value }))}
                                            className="w-full text-[11px] p-1.5 border rounded-md bg-white disabled:bg-gray-100 disabled:opacity-50"
                                            title="DOE"
                                        />
                                    </div>
                                    <select
                                        disabled={!enabledFields.internshipCompany}
                                        value={fieldValues.internshipType}
                                        onChange={(e) => setFieldValues((p) => ({ ...p, internshipType: e.target.value }))}
                                        className="w-full text-xs p-2 border rounded-md bg-white disabled:bg-gray-100 disabled:opacity-50"
                                    >
                                        <option value="Paid">Paid</option>
                                        <option value="Unpaid">Unpaid</option>
                                    </select>
                                </div>

                                {/* Placement Status */}
                                <div className="p-3 border rounded-xl bg-gray-50/50 space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-gray-800">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(enabledFields.placementStatus)}
                                            onChange={(e) => setEnabledFields((p) => ({ ...p, placementStatus: e.target.checked }))}
                                            className="w-4 h-4 text-[#7b3b5a] rounded"
                                        />
                                        Placement Status
                                    </label>
                                    <select
                                        disabled={!enabledFields.placementStatus}
                                        value={fieldValues.placementStatus}
                                        onChange={(e) => setFieldValues((p) => ({ ...p, placementStatus: e.target.value }))}
                                        className="w-full text-xs p-2 border rounded-md bg-white disabled:bg-gray-100 disabled:opacity-50"
                                    >
                                        <option value="Unplaced">Unplaced</option>
                                        <option value="Placed">Placed</option>
                                        <option value="Higher Studies">Higher Studies</option>
                                        <option value="Opted Out">Opted Out</option>
                                    </select>
                                </div>

                                {/* Placement Company & Period */}
                                <div className="p-3 border rounded-xl bg-gray-50/50 space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-gray-800">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(enabledFields.placementCompany)}
                                            onChange={(e) => setEnabledFields((p) => ({ ...p, placementCompany: e.target.checked, placementDOJ: e.target.checked, placementDOE: e.target.checked, placementType: e.target.checked }))}
                                            className="w-4 h-4 text-[#7b3b5a] rounded"
                                        />
                                        Placement Company & Period
                                    </label>
                                    <input
                                        type="text"
                                        disabled={!enabledFields.placementCompany}
                                        value={fieldValues.placementCompany}
                                        onChange={(e) => setFieldValues((p) => ({ ...p, placementCompany: e.target.value }))}
                                        placeholder="Company name"
                                        className="w-full text-xs p-2 border rounded-md bg-white disabled:bg-gray-100 disabled:opacity-50"
                                    />
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <input
                                            type="date"
                                            disabled={!enabledFields.placementCompany}
                                            value={fieldValues.placementDOJ}
                                            onChange={(e) => setFieldValues((p) => ({ ...p, placementDOJ: e.target.value }))}
                                            className="w-full text-[11px] p-1.5 border rounded-md bg-white disabled:bg-gray-100 disabled:opacity-50"
                                            title="DOJ"
                                        />
                                        <input
                                            type="date"
                                            disabled={!enabledFields.placementCompany}
                                            value={fieldValues.placementDOE}
                                            onChange={(e) => setFieldValues((p) => ({ ...p, placementDOE: e.target.value }))}
                                            className="w-full text-[11px] p-1.5 border rounded-md bg-white disabled:bg-gray-100 disabled:opacity-50"
                                            title="DOE"
                                        />
                                    </div>
                                    <select
                                        disabled={!enabledFields.placementCompany}
                                        value={fieldValues.placementType}
                                        onChange={(e) => setFieldValues((p) => ({ ...p, placementType: e.target.value }))}
                                        className="w-full text-xs p-2 border rounded-md bg-white disabled:bg-gray-100 disabled:opacity-50"
                                    >
                                        <option value="Paid">Paid</option>
                                        <option value="Unpaid">Unpaid</option>
                                    </select>
                                </div>

                                {/* Hosteller */}
                                <div className="p-3 border rounded-xl bg-gray-50/50 space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-gray-800">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(enabledFields.hosteller)}
                                            onChange={(e) => setEnabledFields((p) => ({ ...p, hosteller: e.target.checked }))}
                                            className="w-4 h-4 text-[#7b3b5a] rounded"
                                        />
                                        Hosteller / Day Scholar
                                    </label>
                                    <select
                                        disabled={!enabledFields.hosteller}
                                        value={fieldValues.hosteller}
                                        onChange={(e) => setFieldValues((p) => ({ ...p, hosteller: e.target.value }))}
                                        className="w-full text-xs p-2 border rounded-md bg-white disabled:bg-gray-100 disabled:opacity-50"
                                    >
                                        <option value="Hosteller">Hosteller</option>
                                        <option value="Day Scholar">Day Scholar</option>
                                        <option value="Bus Commuter">Bus Commuter</option>
                                    </select>
                                </div>

                                {/* Category */}
                                <div className="p-3 border rounded-xl bg-gray-50/50 space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-gray-800">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(enabledFields.category)}
                                            onChange={(e) => setEnabledFields((p) => ({ ...p, category: e.target.checked }))}
                                            className="w-4 h-4 text-[#7b3b5a] rounded"
                                        />
                                        Category
                                    </label>
                                    <select
                                        disabled={!enabledFields.category}
                                        value={fieldValues.category}
                                        onChange={(e) => setFieldValues((p) => ({ ...p, category: e.target.value }))}
                                        className="w-full text-xs p-2 border rounded-md bg-white disabled:bg-gray-100 disabled:opacity-50"
                                    >
                                        <option value="General">General</option>
                                        <option value="OBC">OBC</option>
                                        <option value="SC">SC</option>
                                        <option value="ST">ST</option>
                                        <option value="EWS">EWS</option>
                                    </select>
                                </div>

                                {/* Specialization Track */}
                                <div className="p-3 border rounded-xl bg-gray-50/50 space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-gray-800">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(enabledFields.specialization)}
                                            onChange={(e) => setEnabledFields((p) => ({ ...p, specialization: e.target.checked }))}
                                            className="w-4 h-4 text-[#7b3b5a] rounded"
                                        />
                                        Specialization / Track
                                    </label>
                                    <input
                                        type="text"
                                        disabled={!enabledFields.specialization}
                                        value={fieldValues.specialization}
                                        onChange={(e) => setFieldValues((p) => ({ ...p, specialization: e.target.value }))}
                                        placeholder="e.g. Data Science, AI & ML"
                                        className="w-full text-xs p-2 border rounded-md bg-white disabled:bg-gray-100 disabled:opacity-50"
                                    />
                                </div>

                                {/* Semester Registration */}
                                <div className="p-3 border rounded-xl bg-gray-50/50 space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-gray-800">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(enabledFields.semesterRegistration)}
                                            onChange={(e) => setEnabledFields((p) => ({ ...p, semesterRegistration: e.target.checked }))}
                                            className="w-4 h-4 text-[#7b3b5a] rounded"
                                        />
                                        Semester Registration Status
                                    </label>
                                    <div className="flex gap-2">
                                        <select
                                            disabled={!enabledFields.semesterRegistration}
                                            value={fieldValues.semesterNumber}
                                            onChange={(e) => setFieldValues((p) => ({ ...p, semesterNumber: e.target.value }))}
                                            className="w-1/2 text-xs p-2 border rounded-md bg-white disabled:bg-gray-100 disabled:opacity-50"
                                        >
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((sem) => (
                                                <option key={sem} value={sem}>
                                                    Semester {sem}
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            disabled={!enabledFields.semesterRegistration}
                                            value={fieldValues.semesterRegistered}
                                            onChange={(e) => setFieldValues((p) => ({ ...p, semesterRegistered: e.target.value }))}
                                            className="w-1/2 text-xs p-2 border rounded-md bg-white disabled:bg-gray-100 disabled:opacity-50"
                                        >
                                            <option value="Registered">Registered</option>
                                            <option value="Not Registered">Not Registered</option>
                                            <option value="Pending">Pending</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </form>

                        {/* Modal Footer */}
                        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                                {Object.values(enabledFields).filter(Boolean).length} field(s) selected to update
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsBulkEditOpen(false)}
                                    disabled={bulkLoading}
                                    className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 rounded-lg cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form="bulkEditForm"
                                    disabled={bulkLoading || selectedRollNos.length === 0}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#7b3b5a] text-white text-xs font-semibold rounded-lg hover:bg-[#652f49] disabled:opacity-50 transition cursor-pointer"
                                >
                                    {bulkLoading ? <Loader2 className="animate-spin" size={13} /> : <CheckCircle2 size={13} />}
                                    Apply Changes to {selectedRollNos.length} Student(s)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryDomain;

