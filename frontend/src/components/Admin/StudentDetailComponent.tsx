import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';
import type { StudentProps, StudentAttendanceSummaryResponse } from '../../types/types';
import user from '../../assets/images/user.png';
import { deleteStudent, getStudentProfile, updateStudentPhoto } from '../../lib/user.api';
import { getStudentAttendanceSummary } from '../../lib/attendance.api';
import { useSelector } from 'react-redux';
import type { RootState } from '../../context/app/store';

const StudentDetailComponent = () => {

    const [student, setStudent] = useState<StudentProps | null>(null);
    const [photoUploadFile, setPhotoUploadFile] = useState<File | null>(null);
    const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);
    const [attendanceSummary, setAttendanceSummary] = useState<StudentAttendanceSummaryResponse | null>(null);
    const [attendanceLoading, setAttendanceLoading] = useState(false);

    const { school, department, program, batch, rollNo } = useParams();

    const navigate = useNavigate();
    const location = useLocation();

    const renderField = (label: string, value: string | number | boolean | null | undefined, index?: number) => (
        <div key={index} className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-gray-200">
            <span className="font-medium text-gray-700">{label}</span>
            <span className="text-gray-900 max-w-[60%] text-justify">{value ? value : "N/A"}</span>
        </div>
    );

    const getOrdinal = (n: number) => {
        if (n === 1) return "st";
        if (n === 2) return "nd";
        if (n === 3) return "rd";
        return "th";
    };

    const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            if (typeof result === 'string') {
                resolve(result);
            } else {
                reject(new Error('Unable to convert file to data URL'));
            }
        };
        reader.onerror = () => reject(new Error('File reading failed'));
        reader.readAsDataURL(file);
    });

    const handlePhotoUploadChange = (file: File) => {
        setPhotoUploadFile(file);
    };

    const handleSavePhoto = async () => {
        if (!photoUploadFile || !student?.rollNo) {
            alert('Please select an image file first.');
            return;
        }

        try {
            setIsUpdatingPhoto(true);
            const photoData = await fileToDataUrl(photoUploadFile);
            await updateStudentPhoto(student.rollNo, photoData);
            alert('Student photo updated successfully.');
            setPhotoUploadFile(null);
            const refreshed = await getStudentProfile(student.rollNo);
            setStudent(refreshed.student);
        } catch (error: any) {
            console.error(error);
            alert(error?.response?.data?.message || 'Unable to update student photo.');
        } finally {
            setIsUpdatingPhoto(false);
        }
    };

    const currentUser = useSelector((state: RootState) => state.admin);

    const handleEdit = () => {
        const userRole = (currentUser as any)?.role;
        const basePath = (userRole === 'chairperson' || location.pathname.startsWith('/chairperson'))
            ? '/chairperson/register-student'
            : (userRole === 'coordinator' || location.pathname.startsWith('/coordinator'))
            ? '/coordinator/register-student'
            : '/admin/register-student';

        navigate(basePath, {
            state: {
                mode: "edit",
                student, school, department, program, batch
            }
        });
    };

    const handleDelete = async () => {
        try {
            if (window.confirm("Are you sure you want to delete this student?")) {
                const data = await deleteStudent(student?.rollNo);
                if (data) {
                    alert(`Student (Roll No - ${rollNo?.toLocaleUpperCase()}) deleted successfully!`);
                    navigate(-1)
                }
            }
        } catch (error: any) {
            if (error.status === 404) {
                alert('Student not found');
            }
        }
    };

    useEffect(() => {
        const fetchStudent = async () => {
            try {
                const data = await getStudentProfile(rollNo);
                setStudent(data.student);
            } catch (error) {
                alert('Student not found!')
            }
        };

        const fetchAttendance = async () => {
            if (!rollNo) return;
            try {
                setAttendanceLoading(true);
                const att = await getStudentAttendanceSummary(rollNo);
                if (att?.success) {
                    setAttendanceSummary(att);
                }
            } catch (err) {
                console.error('Failed to load student attendance:', err);
            } finally {
                setAttendanceLoading(false);
            }
        };

        fetchStudent();
        fetchAttendance();
    }, [rollNo]);

    if (!student) {
        return (
            <div className='flex justify-center flex-col items-center h-full w-full text-center'>
                Student not found (Roll No: {`${rollNo?.toLocaleUpperCase()}`})
                <button className='px-2 py-1 sm:text-base text-sm col-end-1 bg-gray-200 border border-[#d9d9d9] rounded cursor-pointer hover:bg-gray-300 mt-2' onClick={() => navigate(-1)}>Go Back</button>
            </div>
        )
    }

    return (
        <div className="sm:h-[83vh] h-[88vh] py-5 px-10 bg-[#f4f4f4] overflow-auto">
            {/* Top Row: Back + Actions */}
            <div className="flex items-center justify-between mb-5 gap-4 whitespace-nowrap">
                <button
                    onClick={() => navigate(-1)}
                    className="sm:px-4 sm:py-2 px-2 py-1 sm:text-base text-sm bg-gray-200 rounded border border-[#d9d9d9] cursor-pointer hover:bg-gray-300 shrink-0"
                >
                    Back
                </button>

                <div className="flex items-center gap-3 shrink-0">
                    <button
                        className="sm:px-4 sm:py-2 px-2 py-1 sm:text-base text-sm bg-emerald-600 transition-all batch-300 cursor-pointer text-white rounded hover:bg-emerald-700"
                    >
                        Print
                    </button>

                    <button
                        onClick={handleEdit}
                        className="sm:px-4 sm:py-2 px-2 py-1 sm:text-base text-sm bg-blue-600 transition-all batch-300 cursor-pointer text-white rounded hover:bg-blue-700"
                    >
                        Edit
                    </button>

                    <button
                        onClick={handleDelete}
                        className="sm:px-4 sm:py-2 px-2 py-1 sm:text-base text-sm bg-red-600 transition-all batch-300 cursor-pointer text-white rounded hover:bg-red-700"
                    >
                        Delete
                    </button>
                </div>
            </div>

            {/* Main Form Container */}
            <div className=" rounded-none space-y-6">
                {/* Personal Details & Photo */}
                <div className="flex flex-col md:flex-row gap-6">

                    <div className="md:w-1/4 flex sm:justify-start justify-center items-start">
                        <div className="flex flex-col items-center gap-3">
                            <img
                                src={student?.photo || user}
                                alt={student?.fullName}
                                className="w-52 h-52 object-cover rounded-none bg-white border border-gray-300"
                            />
                            <div className="flex flex-col gap-2 w-full">
                                <input
                                    id="studentPhotoFile"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handlePhotoUploadChange(file);
                                    }}
                                />
                                <label htmlFor="studentPhotoFile" className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-center cursor-pointer hover:bg-gray-100">
                                    Choose Photo
                                </label>
                                <button
                                    type="button"
                                    disabled={!photoUploadFile || isUpdatingPhoto}
                                    onClick={handleSavePhoto}
                                    className="rounded-lg bg-black px-3 py-2 text-sm text-white disabled:opacity-60"
                                >
                                    {isUpdatingPhoto ? 'Saving...' : 'Save Photo'}
                                </button>
                                {photoUploadFile && (
                                    <p className="text-xs text-gray-500">Selected file: {photoUploadFile.name}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="md:w-full bg-white p-5 rounded-none border border-gray-200 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                            <div className="flex flex-col sm:flex-row sm:justify-between py-1">
                                <span className="font-medium text-gray-700">Full Name</span>
                                <span className="text-gray-900">{student?.fullName || "N/A"}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between py-1">
                                <span className="font-medium text-gray-700">Enrollment No.</span>
                                <span className="text-gray-900">{student?.enrollmentNo ? student.enrollmentNo.toLocaleUpperCase() : "N/A"}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between py-1">
                                <span className="font-medium text-gray-700">Roll no.</span>
                                <span className="text-gray-900">{student?.rollNo ? student.rollNo.toLocaleUpperCase() : "N/A"}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between py-1">
                                <span className="font-medium text-gray-700">School</span>
                                <span className="text-gray-900">{student?.school ? student.school.toLocaleUpperCase() : "N/A"}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between py-1">
                                <span className="font-medium text-gray-700">Department</span>
                                <span className="text-gray-900">{student?.department ? student.department.toLocaleUpperCase() : "N/A"}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between py-1">
                                <span className="font-medium text-gray-700">Specialization</span>
                                <span className="text-gray-900">{student?.specialization || "N/A"}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between py-1">
                                <span className="font-medium text-gray-700">Program</span>
                                <span className="text-gray-900">{student?.program || "N/A"}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between py-1">
                                <span className="font-medium text-gray-700">Batch</span>
                                <span className="text-gray-900">{student?.batch || "N/A"}</span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Personal Details Left */}
                <div className="bg-white p-5 rounded-none border border-gray-200 space-y-3">
                    <h2 className="text-xl font-semibold border-b border-gray-300 pb-2 mb-3">
                        Personal Details
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                        {renderField("Father's Name", student?.fatherName)}
                        {renderField("Mother's Name", student?.motherName)}
                        {renderField("Gender", student?.gender)}
                        {renderField("Date of Birth", student?.dob ? new Date(student.dob).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "N/A")}
                        {renderField("Category", student?.category)}
                        {renderField("Aadhaar / National ID", student?.nationalId ? student.nationalId.toLocaleUpperCase() : "N/A")}
                        {renderField("Mobile No", student?.mobile)}
                        {renderField("Email ID", student?.email)}
                        {renderField("Address", student?.address ? student?.address : '-')}
                        {renderField("Hosteller", student?.hosteller)}
                    </div>
                </div>

                {/* Academic Details */}
                <div className="bg-white p-5 rounded-none border border-gray-200 space-y-3">
                    <h2 className="text-xl font-semibold border-b border-gray-300 pb-2 mb-3">
                        Academic Details
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                        {renderField("Status", student?.status ? (student.status.charAt(0).toUpperCase() + student.status.slice(1)) : "Active")}
                        {renderField("Enrollment Status", student?.enrollmentStatus)}
                        {renderField("12th Compartment", student?.twelfthCompartment)}
                        {renderField("Admission Year", student?.admissionYear)}
                        {renderField("Admission Type", student?.admissionType)}
                        {student?.yearCGPA?.map((item, index) =>
                            renderField(`${item.year}${getOrdinal(item.year)} Year CGPA`, item.cgpa, index)
                        )}
                    </div>
                </div>

                {/* Attendance & Subject Engagement Details */}
                <div className="bg-white p-5 rounded-none border border-gray-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-300 pb-2">
                        <div className="flex items-center gap-2">
                            <ClipboardCheck className="text-[#7b3b5a]" size={22} />
                            <h2 className="text-xl font-semibold text-gray-900">
                                Attendance & Subject Engagement
                            </h2>
                        </div>
                        {attendanceSummary && attendanceSummary.overall.total > 0 && (
                            <span
                                className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                                    attendanceSummary.overall.percentage >= 75
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : attendanceSummary.overall.percentage >= 65
                                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                        : 'bg-red-100 text-red-800 border border-red-300'
                                }`}
                            >
                                Overall Attendance: {attendanceSummary.overall.percentage}%
                            </span>
                        )}
                    </div>

                    {attendanceLoading ? (
                        <div className="py-6 text-center text-sm text-gray-500">Loading attendance data...</div>
                    ) : !attendanceSummary || attendanceSummary.overall.total === 0 ? (
                        <div className="py-6 text-center text-sm text-gray-500">
                            No attendance records logged for this student yet.
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {/* Summary Metric Counters */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="p-3 bg-gray-50 rounded border border-gray-200 text-center">
                                    <div className="text-xs text-gray-500 font-medium">Total Classes</div>
                                    <div className="text-xl font-bold text-gray-800">{attendanceSummary.overall.total}</div>
                                </div>
                                <div className="p-3 bg-emerald-50 rounded border border-emerald-200 text-center">
                                    <div className="text-xs text-emerald-700 font-medium">Present</div>
                                    <div className="text-xl font-bold text-emerald-700">{attendanceSummary.overall.present}</div>
                                </div>
                                <div className="p-3 bg-red-50 rounded border border-red-200 text-center">
                                    <div className="text-xs text-red-700 font-medium">Absent</div>
                                    <div className="text-xl font-bold text-red-700">{attendanceSummary.overall.absent}</div>
                                </div>
                                <div className="p-3 bg-amber-50 rounded border border-amber-200 text-center">
                                    <div className="text-xs text-amber-700 font-medium">Excused</div>
                                    <div className="text-xl font-bold text-amber-700">{attendanceSummary.overall.excused}</div>
                                </div>
                            </div>

                            {/* Subject-Wise Attendance Breakdown */}
                            {attendanceSummary.subjects && attendanceSummary.subjects.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-800 mb-2">Subject Breakdown</h3>
                                    <div className="overflow-x-auto border border-gray-200 rounded">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-[#f8f9fa] text-gray-700 uppercase font-semibold border-b border-gray-200">
                                                <tr>
                                                    <th className="px-3 py-2">Subject</th>
                                                    <th className="px-3 py-2">Code</th>
                                                    <th className="px-3 py-2">Sem</th>
                                                    <th className="px-3 py-2 text-center">Total</th>
                                                    <th className="px-3 py-2 text-center">Present</th>
                                                    <th className="px-3 py-2 text-center">Absent</th>
                                                    <th className="px-3 py-2 text-center">Excused</th>
                                                    <th className="px-3 py-2">Attendance %</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {attendanceSummary.subjects.map((sub) => (
                                                    <tr key={sub.subjectId} className="hover:bg-gray-50">
                                                        <td className="px-3 py-2 font-medium text-gray-900">{sub.subjectName}</td>
                                                        <td className="px-3 py-2 font-mono text-gray-600">{sub.subjectCode || '—'}</td>
                                                        <td className="px-3 py-2 text-gray-600">{sub.semester ? `Sem ${sub.semester}` : '—'}</td>
                                                        <td className="px-3 py-2 text-center font-semibold">{sub.total}</td>
                                                        <td className="px-3 py-2 text-center text-emerald-700 font-medium">{sub.present}</td>
                                                        <td className="px-3 py-2 text-center text-red-600 font-medium">{sub.absent}</td>
                                                        <td className="px-3 py-2 text-center text-amber-600 font-medium">{sub.excused}</td>
                                                        <td className="px-3 py-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-20 bg-gray-200 rounded-full h-2 overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full ${
                                                                            sub.percentage >= 75
                                                                                ? 'bg-emerald-500'
                                                                                : sub.percentage >= 65
                                                                                ? 'bg-amber-500'
                                                                                : 'bg-red-500'
                                                                        }`}
                                                                        style={{ width: `${Math.min(100, sub.percentage)}%` }}
                                                                    />
                                                                </div>
                                                                <span className="font-bold text-gray-800">{sub.percentage}%</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Recent Sessions History */}
                            {attendanceSummary.recentSessions && attendanceSummary.recentSessions.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-800 mb-2">Recent Attendance Sessions</h3>
                                    <div className="overflow-x-auto border border-gray-200 rounded max-h-56 overflow-y-auto">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-[#f8f9fa] text-gray-700 uppercase font-semibold border-b border-gray-200 sticky top-0">
                                                <tr>
                                                    <th className="px-3 py-2">Date</th>
                                                    <th className="px-3 py-2">Subject</th>
                                                    <th className="px-3 py-2">Type</th>
                                                    <th className="px-3 py-2">Topic</th>
                                                    <th className="px-3 py-2 text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {attendanceSummary.recentSessions.map((rec) => {
                                                    const isPresent = rec.status === 'present';
                                                    const isAbsent = rec.status === 'absent';
                                                    const isExcused = rec.status === 'excused';
                                                    return (
                                                        <tr key={rec.sessionId} className="hover:bg-gray-50">
                                                            <td className="px-3 py-2 font-medium">{rec.date}</td>
                                                            <td className="px-3 py-2 text-gray-800">{rec.subjectName || `Subject #${rec.subjectId}`}</td>
                                                            <td className="px-3 py-2 text-gray-600 capitalize">{rec.sessionType}</td>
                                                            <td className="px-3 py-2 text-gray-500 italic max-w-xs truncate">{rec.topic || '—'}</td>
                                                            <td className="px-3 py-2 text-center">
                                                                <span
                                                                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                                                                        isPresent
                                                                            ? 'bg-emerald-100 text-emerald-800'
                                                                            : isAbsent
                                                                            ? 'bg-red-100 text-red-800'
                                                                            : isExcused
                                                                            ? 'bg-amber-100 text-amber-800'
                                                                            : 'bg-gray-100 text-gray-600'
                                                                    }`}
                                                                >
                                                                    {rec.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Registration Details */}
                <div className="bg-white p-5 rounded-none border border-gray-200 space-y-3">
                    <h2 className="text-xl font-semibold border-b border-gray-300 pb-2 mb-3">
                        Registration Details
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                        {student?.semesters?.map((sem, index) =>
                            renderField(`Semester ${index + 1}`, sem.registered, index)
                        )}
                    </div>
                </div>

                {/* Professional Details */}
                <div className="bg-white p-5 rounded-none border border-gray-200 space-y-5">
                    <h2 className="text-xl font-semibold border-b border-gray-300 pb-2 mb-3">
                        Professional Details
                    </h2>

                    {/* Internship Details */}
                    <div className="space-y-2">
                        <h3 className="text-base font-semibold text-[#7b3b5a] flex items-center gap-1.5">
                            <span>💼</span> Internship Details
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                            {renderField("Internship Status", student?.internshipStatus)}
                            {renderField("Company Name", student?.internshipCompany)}
                            {renderField("Time Period (DOJ - DOE)", (student?.internshipDOJ || student?.internshipDOE) ? `${student?.internshipDOJ || "N/A"} to ${student?.internshipDOE || "N/A"}` : "N/A")}
                            {renderField("Joining Date (DOJ)", student?.internshipDOJ)}
                            {renderField("Ending Date (DOE)", student?.internshipDOE)}
                            {renderField("Internship Type", student?.internshipType)}
                        </div>
                    </div>

                    {/* Placement Details */}
                    <div className="space-y-2 pt-4 border-t border-gray-200">
                        <h3 className="text-base font-semibold text-[#7b3b5a] flex items-center gap-1.5">
                            <span>🏢</span> Placement Details
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                            {renderField("Placement Status", student?.placementStatus)}
                            {renderField("Company Name", student?.placementCompany)}
                            {renderField("Time Period (DOJ - DOE)", (student?.placementDOJ || student?.placementDOE) ? `${student?.placementDOJ || "N/A"} to ${student?.placementDOE || "N/A"}` : "N/A")}
                            {renderField("Joining Date (DOJ)", student?.placementDOJ)}
                            {renderField("Ending Date / Bond End (DOE)", student?.placementDOE)}
                            {renderField("Placement Type", student?.placementType)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StudentDetailComponent