import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSideNav from "../../components/Admin/AdminSideNav";
import Header from "../../components/Admin/Header";
import Footer from "../../components/Admin/Footer";
import Dropdown from "../../utils/Dropdown";
import type { SpecializationProps } from "../../types/types";
import { deleteSpecialization, deleteSpecializationStudents, viewSpecializations } from "../../lib/user.api";

const sortOptions = ["Name", "Batch", "Program"];

const Specialization = () => {
    const [menu] = useState(false);
    const [specializations, setSpecializations] = useState<SpecializationProps[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [changeTracker, setChangeTracker] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortField, setSortField] = useState("Batch");

    const navigate = useNavigate();

    const parseBatchStart = (batch?: string) => {
        const match = batch?.match(/^(\d{4})/);
        return match ? Number(match[1]) : 0;
    };

    const downloadSpecializations = () => {
        if (!specializations.length) {
            alert("There are no specializations to export.");
            return;
        }

        const headers = ["Name", "School", "Department", "Program", "Batch", "Students"];
        const rows = filteredAndSortedSpecializations.map((item) => [
            item.name || "",
            item.school || "",
            item.department || "",
            item.program || "",
            item.batch || "",
            item.studentCount ?? 0,
        ]);

        const csv = [headers, ...rows]
            .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
            .join("\r\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "specializations.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleDelete = async (school: string | undefined, department: string | undefined, program: string | undefined, batch: string | undefined, name: string | undefined) => {
        if (window.confirm("This action will also delete students associated with this course!")) {
            try {
                const deleteStudents = await deleteSpecializationStudents(school, department, program, batch, name);
                const deleteCourse = await deleteSpecialization(school, department, program, batch, name);
                if (deleteCourse && deleteStudents) {
                    alert(`Specialization deleted successfully - ${school?.toLocaleUpperCase()} > ${department?.toLocaleUpperCase()} > ${program} ${batch} > ${name}`);
                }
            } catch (error: any) {
                console.log(error)
                alert(error.message);
            } finally {
                setChangeTracker(!changeTracker);
            }
        }
    }

    useEffect(() => {
        const getSpecialization = async () => {
            try {
                setIsLoading(true);
                const data = await viewSpecializations();
                if (data) {
                    setSpecializations(data.specializations || []);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        }
        getSpecialization();
    }, [changeTracker])

    const filteredAndSortedSpecializations = [...specializations]
        .filter((item) => {
            const query = searchQuery.toLowerCase().trim();
            if (!query) return true;
            return (
                (item.name && item.name.toLowerCase().includes(query)) ||
                (item.school && item.school.toLowerCase().includes(query)) ||
                (item.department && item.department.toLowerCase().includes(query)) ||
                (item.program && item.program.toLowerCase().includes(query)) ||
                (item.batch && item.batch.toLowerCase().includes(query))
            );
        })
        .sort((a, b) => {
            if (sortField === "Batch") {
                const batchA = parseBatchStart(a.batch);
                const batchB = parseBatchStart(b.batch);
                if (batchA !== batchB) return batchB - batchA;
                return (b.batch || "").localeCompare(a.batch || "", undefined, { numeric: true, sensitivity: 'base' });
            }
            if (sortField === "Program") {
                return (a.program || "").localeCompare(b.program || "", undefined, { sensitivity: 'base' });
            }
            // Default to "Name"
            return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: 'base' });
        });

    return (
        <div className="w-full max-h-screen overflow-hidden flex">

            <AdminSideNav activeTab={'dashboard'} />

            <div className={`flex flex-col flex-1 transition-all batch-300 ${!menu ? 'sm:w-[80vw] w-[85vw]' : 'w-[95vw]'}`}>

                <Header />

                <div className='sm:h-full flex-1 sm:min-h-[83vh] min-h-[88vh] overflow-y-auto py-5 px-10 bg-[#f3f3f3]'>
                    <div className="sm:flex grid grid-cols-1 grid-rows-2 justify-between items-center sm:mb-5 mb-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="sm:px-4 sm:py-2 px-2 py-1 sm:text-base text-sm col-end-1 bg-gray-200 border border-[#d9d9d9] rounded cursor-pointer hover:bg-gray-300"
                        >
                            Back
                        </button>
                        <button
                            onClick={downloadSpecializations}
                            className="sm:px-4 sm:py-2 px-2 py-1 sm:text-base text-sm col-start-2 bg-gray-200 border border-[#d9d9d9] rounded cursor-pointer flex justify-center items-center hover:bg-blue-600 hover:text-white transition-all batch-300"
                        >Export
                        </button>
                    </div>

                    {/* Search Component */}
                    <div className="w-full flex justify-between gap-3 sm:mb-5 mb-4">
                        <div className='flex'>
                            <div className="h-12 w-auto border border-[#d9d9d9] bg-white rounded sm:px-5 px-2 flex justify-start items-center">
                                <label className="mr-3 sm:block hidden">Search</label>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`sm:w-80 w-36 border border-[#d9d9d9] px-3 sm:ml-3 h-8 focus:outline-none focus:border-black rounded-sm`} 
                                    placeholder="Search Course or Batch" 
                                />
                            </div>
                        </div>
                        <div className="w-auto flex justify-between">
                            <Dropdown categories={sortOptions} selected={sortField} onSelect={setSortField} />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="w-full max-h-[65vh] sm:max-h-[60vh] overflow-y-auto overflow-x-auto rounded border border-[#d9d9d9]">
                        <table className="min-w-max w-full text-center bg-white">
                            <thead className="font-semibold sticky top-0 bg-white z-10">
                                <tr className="h-12">
                                    <td className="px-3 whitespace-nowrap">S.no.</td>
                                    <td className="px-3 whitespace-nowrap">Name</td>
                                    <td className="px-3 whitespace-nowrap">School</td>
                                    <td className="px-3 whitespace-nowrap">Department</td>
                                    <td className="px-3 whitespace-nowrap">Program</td>
                                    <td className="px-3 whitespace-nowrap">Batch</td>
                                    <td className="px-3 whitespace-nowrap">Students</td>
                                    <td className="px-3 whitespace-nowrap">Options</td>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading
                                    ? Array.from({ length: 10 }).map((_, index) => (
                                        <tr
                                            key={index}
                                            className="bg-[#f8f9fa] border-t border-[#d9d9d9] h-16 animate-pulse"
                                        >
                                            {Array.from({ length: 8 }, (_, i) => (
                                                <td key={i} className="px-3">
                                                    <div className="h-7 w-20 mx-auto bg-gray-300 rounded" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                    : filteredAndSortedSpecializations.length > 0
                                        ? filteredAndSortedSpecializations.map((item, index) => (
                                            <tr key={index} className="bg-[#f8f9fa] border-y border-[#d9d9d9] h-16">
                                                <td className="px-3 whitespace-nowrap">{index + 1}.</td>
                                                <td className="px-3 whitespace-nowrap">{item.name}</td>
                                                <td className="px-3 whitespace-nowrap">{item.school?.toLocaleUpperCase()}</td>
                                                <td className="px-3 whitespace-nowrap">{item.department?.toLocaleUpperCase()}</td>
                                                <td className="px-3 whitespace-nowrap">{item.program}</td>
                                                <td className="px-3 whitespace-nowrap">{item.batch}</td>
                                                <td className="px-3 whitespace-nowrap">{item.studentCount ?? 0}</td>
                                                <td className="px-3 whitespace-nowrap">
                                                    <button
                                                        onClick={() => navigate(`/admin/records/${item.school}/${item.department}/${item.program}/${item.batch}/${item.name}`)}
                                                        className="border px-2 py-1 border-[#d9d9d9] cursor-pointer transition-all batch-300 hover:text-white hover:bg-blue-600 rounded mr-2"
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.school, item.department, item.program, item.batch, item.name)}
                                                        className="border px-2 py-1 border-[#d9d9d9] cursor-pointer transition-all batch-300 hover:text-white hover:bg-red-600 rounded"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        )) :
                                        <tr className="border-t border-[#d9d9d9] h-16">
                                            <td
                                                colSpan={9}
                                                className="text-center align-middle text-gray-600"
                                            >
                                                {specializations.length > 0
                                                    ? "No specialization matches your search query"
                                                    : "No specialization found in the database"
                                                }
                                            </td>
                                        </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="h-14 shrink-0">
                    <Footer />
                </div>
            </div>
        </div>
    );
};

export default Specialization;