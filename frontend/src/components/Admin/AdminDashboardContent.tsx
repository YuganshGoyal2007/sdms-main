import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
    UserPlus,
    Upload,
    BookCopy,
    TableOfContents,
    Users,
    FileText,
} from "lucide-react";
import { soict } from "../../constants";
import { countSpecialization, getAdmins, getStudentsCount } from "../../lib/user.api";
import type { RootState } from "../../context/app/store";
import { QuickActionCard, StatCard } from "./DashboardCards";
import AdminModals from "./AdminModals";

const totalDepartments = soict.length;

const AdminDashboardContent: React.FC = () => {
    const navigate = useNavigate();
    const user = useSelector((state: RootState) => state.admin);

    const [showSpecializationForm, setShowSpecializationForm] = useState(false);
    const [showStudentForm, setshowStudentForm] = useState(false);
    const [showPhotoUploadForm, setShowPhotoUploadForm] = useState(false);
    const [showAdminForm, setshowAdminForm] = useState(false);

    const [totalSpecialization, setTotalSpecializationCount] = useState(0);
    const [totalStudents, setTotalStudents] = useState(0);
    const [totalAdmins, setTotalAdmins] = useState(0);
    const [statLoading, setStatLoading] = useState(false);

    const downloadSheet = () => {
        const link = document.createElement("a");
        link.href = "/sample.xlsx";
        link.download = "sdms-student-sheet-format.xlsx";
        link.click();
    };

    useEffect(() => {
        const getSpecializationCount = async () => {
            try {
                setStatLoading(true);
                const data = await countSpecialization();
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
            } catch (err) {
                console.log(err);
            } finally {
                setStatLoading(false);
            }
        };

        const getAdminCount = async () => {
            try {
                const data = await getAdmins();
                if (data) setTotalAdmins(data.count);
            } catch (err: any) {
                console.log(err.message);
            }
        };

        if (user?.role === 'admin') getAdminCount();
        getStudentCount();
        getSpecializationCount();
    }, [user?.role]);

    return (
        <div className="min-h-full w-full bg-[#f3f3f3] px-4 sm:px-6 lg:px-10 py-6">
            <AdminModals
                showSpecializationForm={showSpecializationForm}
                setShowSpecializationForm={setShowSpecializationForm}
                showStudentForm={showStudentForm}
                setshowStudentForm={setshowStudentForm}
                showPhotoUploadForm={showPhotoUploadForm}
                setShowPhotoUploadForm={setShowPhotoUploadForm}
                showAdminForm={showAdminForm}
                setshowAdminForm={setshowAdminForm}
            />

            <div className="mb-5">
                <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">Manage the entire student database, classes, and coordinator accounts.</p>
            </div>

            <div className="max-w-350 mx-auto flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-[70%] space-y-4">
                    <section className="space-y-3">
                        <h2 className="text-lg font-medium text-gray-800">Quick Actions</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <QuickActionCard icon={<UserPlus />} title="Add Student" description="Manually register a new student" onClick={() => navigate("/admin/register-student")} />
                            <QuickActionCard icon={<Upload />} title="Upload Sheet" description="Bulk upload using CSV / Excel" onClick={() => setshowStudentForm(true)} />
                            <QuickActionCard icon={<Upload />} title="Upload Student Photos" description="Upload roll numbers with image data" onClick={() => setShowPhotoUploadForm(true)} />
                            <QuickActionCard icon={<FileText />} title="Reformat & Upload" description="Reformat Excel data and insert in one step" onClick={() => setshowStudentForm(true)} />
                            <QuickActionCard icon={<Users />} title="Browse Student Records" description="View and search all student records" onClick={() => navigate("/admin/records")} />
                            <QuickActionCard icon={<BookCopy />} title="Create Specializations" description="Create student batches and courses" onClick={() => setShowSpecializationForm(true)} />
                            <QuickActionCard icon={<TableOfContents />} title="Manage Specializations" description="Update student batches and courses" onClick={() => navigate("/admin/update-specialization")} />
                            <QuickActionCard icon={<UserPlus />} title="Create Coordinators" description="Add Coordinator Credentials" onClick={() => setshowAdminForm(true)} />
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-medium text-gray-800">Instructions</h2>
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                            <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2 mb-5">
                                <li>Download the Excel sheet format.</li>
                                <li>Fill student details according to the provided columns.</li>
                                <li>All allowed fields are mentioned in sheet, any other entry will not be supported.</li>
                                <li>Do not change the column headers.</li>
                                <li>Save the file as ".xls".</li>
                                <li>Upload the completed sheet using the Upload Sheet option.</li>
                            </ol>
                            <button onClick={downloadSheet} className="w-full cursor-pointer bg-gray-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-gray-800 transition">
                                Download Sheet Format
                            </button>
                        </div>
                    </section>
                </div>

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
    );
};

export default AdminDashboardContent;
