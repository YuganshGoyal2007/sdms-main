import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom'
import type { StudentProps } from '../../types/types';
import user from '../../assets/images/user.png'
import { deleteStudent, getStudentProfile, updateStudentPhoto } from '../../lib/user.api';

const StudentDetailComponent = () => {

    const [student, setStudent] = useState<StudentProps | null>(null);
    const [photoUploadFile, setPhotoUploadFile] = useState<File | null>(null);
    const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);

    const { school, department, program, batch, rollNo } = useParams();

    const navigate = useNavigate()

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

    const handleEdit = () => {
        navigate("/admin/register-student", {
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

        fetchStudent();
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
                                <span className="text-gray-900">{student?.fullName}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between py-1">
                                <span className="font-medium text-gray-700">Enrollment No.</span>
                                <span className="text-gray-900">{student?.enrollmentNo.toLocaleUpperCase()}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between py-1">
                                <span className="font-medium text-gray-700">Roll no.</span>
                                <span className="text-gray-900">{student?.rollNo.toLocaleUpperCase()}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between py-1">
                                <span className="font-medium text-gray-700">School</span>
                                <span className="text-gray-900">{student?.school.toLocaleUpperCase()}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between py-1">
                                <span className="font-medium text-gray-700">Department</span>
                                <span className="text-gray-900">{student?.department.toLocaleUpperCase()}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between py-1">
                                <span className="font-medium text-gray-700">Specialization</span>
                                <span className="text-gray-900">{student?.specialization}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between py-1">
                                <span className="font-medium text-gray-700">Program</span>
                                <span className="text-gray-900">{student?.program}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between py-1">
                                <span className="font-medium text-gray-700">Batch</span>
                                <span className="text-gray-900">{student?.batch}</span>
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
                        {renderField("Date of Birth", new Date(student?.dob).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }))}
                        {renderField("Category", student?.category)}
                        {renderField("Aadhaar / National ID", student?.nationalId.toLocaleUpperCase())}
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
                <div className="bg-white p-5 rounded-none border border-gray-200 space-y-3">
                    <h2 className="text-xl font-semibold border-b border-gray-300 pb-2 mb-3">
                        Professional Details
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                        {renderField("Internship Status", student?.internshipStatus)}
                        {renderField("Placement Status", student?.placementStatus)}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StudentDetailComponent