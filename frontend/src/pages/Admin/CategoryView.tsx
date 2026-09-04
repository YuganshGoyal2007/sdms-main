import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileSpreadsheet, Search } from "lucide-react";
import { toast } from "sonner";

import AdminSideNav from "../../components/Admin/AdminSideNav";
import Header from "../../components/Admin/Header";
import Footer from "../../components/Admin/Footer";
import Dropdown from "../../utils/Dropdown";
import { downloadExcel } from "../../utils/excel";
import type { StudentProps } from "../../types/types";
import { deleteSpecializationStudents, getFilteredStudents } from "../../lib/user.api";
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

    const navigate = useNavigate();
    const user = useSelector((state: RootState) => state.admin);

    const { school, department, program, batch, specialization } = useParams();

    const handleDelete = async () => {
        if (window.confirm("This action will delete all the students associated with this specialization!")) {
            try {
                setDeleting(true);
                const data = await deleteSpecializationStudents(school, department, program, batch, specialization);
                if (data) {
                    toast.success(`Deleted all students in - ${school} > ${department} > ${program} ${batch} > ${specialization}`);
                    setStudents([]);
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

    useEffect(() => {
        const filteredStudents = async () => {
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
        };
        filteredStudents();
    }, [school, department, program, batch, specialization]);

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
                                    onClick={() => navigate("/admin/dashboard")}
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
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-200 border border-[#d9d9d9] rounded hover:bg-gray-300"
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
                                            onClick={() => navigate("/admin/register-student")}
                                            className="px-3 py-1.5 text-sm bg-blue-600 text-white border border-blue-800 rounded hover:bg-blue-700"
                                        >
                                            + Add Student
                                        </button>
                                        <button
                                            onClick={exportStudentsExcel}
                                            disabled={exporting || !students.length}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-600 text-white border border-emerald-800 rounded hover:bg-emerald-700 disabled:opacity-50"
                                            title="Download all students in this class as Excel"
                                        >
                                            <FileSpreadsheet size={14} />
                                            {exporting ? "Exporting…" : "Export Excel"}
                                        </button>
                                        {user.role === "admin" && (
                                            <button
                                                onClick={handleDelete}
                                                className="px-3 py-1.5 text-sm text-white bg-red-600 border border-red-800 rounded hover:bg-red-700"
                                            >
                                                {deleting ? "Deleting…" : "Delete"}
                                            </button>
                                        )}
                                    </div>
                                </div>

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
                                <div className="bg-white border border-[#d9d9d9] rounded-lg overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <div className="max-h-[60vh] overflow-y-auto">
                                            <table className="min-w-max w-full text-sm text-center bg-white">
                                                <thead className="font-semibold sticky top-0 bg-white z-10 border-b border-[#d9d9d9]">
                                                    <tr className="h-12">
                                                        <td className="px-3 whitespace-nowrap w-14">Sr No</td>
                                                        <td className="px-3 whitespace-nowrap w-16">Photo</td>
                                                        <td className="px-3 whitespace-nowrap">Roll No</td>
                                                        <td className="px-3 whitespace-nowrap text-left pl-4">Full Name</td>
                                                        <td className="px-3 whitespace-nowrap text-left pl-4">Father's Name</td>
                                                        <td className="px-3 whitespace-nowrap">Category</td>
                                                        <td className="px-3 whitespace-nowrap">Enrollment Status</td>
                                                        <td className="px-3 whitespace-nowrap">Admission Type</td>
                                                        <td className="px-3 whitespace-nowrap w-20">Action</td>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {isLoading ? (
                                                        Array.from({ length: 10 }).map((_, index) => (
                                                            <tr key={index} className="bg-[#f8f9fa] border-t border-[#d9d9d9] h-16 animate-pulse">
                                                                {Array.from({ length: 9 }, (_, i) => (
                                                                    <td key={i} className="px-3">
                                                                        <div className="h-7 w-20 mx-auto bg-gray-300 rounded" />
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))
                                                    ) : filteredAndSortedStudents.length > 0 ? (
                                                        filteredAndSortedStudents.map((item, index) => (
                                                            <tr key={item.rollNo} className="bg-[#f8f9fa] border-t border-[#d9d9d9] h-16 hover:bg-gray-100">
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
                                                                    <button
                                                                        onClick={() => navigate(`/admin/records/${encodeURIComponent(item.rollNo)}`)}
                                                                        className="px-2 py-1 bg-gray-200 border border-[#d9d9d9] rounded hover:bg-gray-300 transition"
                                                                    >
                                                                        View
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr className="border-t border-[#d9d9d9] h-16">
                                                            <td colSpan={9} className="text-center align-middle text-gray-600 py-6">
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
        </div>
    );
};

export default CategoryDomain;
