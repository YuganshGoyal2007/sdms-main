import React, { useEffect, useState, type JSX } from "react"
import user from '../../assets/images/user.png'
import { useLocation, useNavigate } from "react-router-dom"
import { cse, initialStudentForm, school, soict } from "../../constants"
import type { StudentProps } from "../../types/types"
import { addStudent, searchBatches, searchSpecializations, updateStudent } from "../../lib/user.api"
import { useSelector } from "react-redux"
import type { RootState } from "../../context/app/store"

type LocationState = {
    mode?: "edit" | "add";
    student?: Partial<StudentProps>;
};

const getOrdinal = (n: number): string => {
    if (n === 1) return "st";
    if (n === 2) return "nd";
    if (n === 3) return "rd";
    return "th";
};

const departmentMap: Record<string, { code: string; name: string }[]> = { soict };
const programMap: Record<string, { code: string; name: string }[]> = { cse };

const AddStudentForm: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as LocationState | null;
    const isEditMode = state?.mode === "edit";

    const [batches, setBatches] = useState<string[]>([]);
    const [specializations, setSpecializations] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [form, setForm] = useState<StudentProps>(() => ({
        ...initialStudentForm,
        ...(state?.student ?? {}),
        dob: state?.student?.dob
            ? new Date(state.student.dob).toISOString().split("T")[0]
            : "",
    }));

    const AdminUser = useSelector((state: RootState) => state.admin);

    const validateForm = (): boolean => {
        if (!form.fullName?.trim()) {
            setError("Full Name is required");
            return false;
        }
        if (!form.rollNo?.trim()) {
            setError("Roll No is required");
            return false;
        }
        if (!form.enrollmentNo?.trim()) {
            setError("Enrollment No is required");
            return false;
        }
        if (!form.school) {
            setError("School is required");
            return false;
        }
        if (!form.department) {
            setError("Department is required");
            return false;
        }
        if (!form.program) {
            setError("Program Type is required");
            return false;
        }
        if (!form.batch) {
            setError("Batch is required");
            return false;
        }
        if (!form.specialization) {
            setError("Specialization is required");
            return false;
        }
        if (!form.gender) {
            setError("Gender is required");
            return false;
        }
        if (!form.fatherName) {
            setError("Father's Name is required");
            return false;
        }
        if (!form.motherName) {
            setError("Mother's Name is required");
            return false;
        }
        if (!form.hosteller) {
            setError("Hosteller Status is required");
            return false;
        }
        if (!form.dob) {
            setError("Date of Birth is required");
            return false;
        }
        if (!form.category) {
            setError("Category is required");
            return false;
        }
        if (!form.mobile?.trim()) {
            setError("Mobile No is required");
            return false;
        }
        if (!form.email?.trim()) {
            setError("Email ID is required");
            return false;
        }
        if (!form.admissionType) {
            setError("Admission Type is required");
            return false;
        }
        if (!form.admissionYear) {
            setError("Admission Year is required");
            return false;
        }
        if (!form.nationalId) {
            setError("National Id is required");
            return false;
        }
        if (!form.enrollmentStatus) {
            setError("Enrollment Status is required");
            return false;
        }
        if (!form.twelfthCompartment) {
            setError("Twelfth Compartment Status is required");
            return false;
        }
        if (!form.internshipStatus) {
            setError("Internship Status is required");
            return false;
        }
        if (!form.placementStatus) {
            setError("Placement Status is required");
            return false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email)) {
            setError("Please enter a valid email address");
            return false;
        }

        // Mobile validation (basic 10 digit check)
        const mobileRegex = /^[0-9]{10}$/;
        if (!mobileRegex.test(form.mobile.replace(/\s/g, ''))) {
            setError("Please enter a valid 10-digit mobile number");
            return false;
        }

        setError("");
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (!validateForm()) {
                return;
            }

            if (isEditMode) {
                const data = await updateStudent(form.rollNo, form);
                if (data) {
                    alert(`Student (Roll no - ${form.rollNo}) updated successfully`);
                    navigate(-1);
                }
            } else {
                const data = await addStudent(form);
                if (data) {
                    alert(`Student (Roll no - ${form.rollNo}) added succesfully`);
                    navigate(-1);
                }
            }
        } catch (error: any) {
            if (error.status === 409) {
                setError(error.response.data.message)
            }
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (error) setError("");
    };

    // useEffect(() => {
    //     const getSemesterCount = (program: string): number => {
    //         switch (program) {
    //             case 'B.Tech':
    //                 return 8;
    //             case 'M.Tech':
    //                 return 4;
    //             case 'B.Tech + M.Tech':
    //                 return 10;
    //             default:
    //                 return 0;
    //         }
    //     };

    //     const getYearCount = (program: string): number => {
    //         switch (program) {
    //             case 'B.Tech':
    //                 return 4;
    //             case 'M.Tech':
    //                 return 2;
    //             case 'B.Tech + M.Tech':
    //                 return 5;
    //             default:
    //                 return 0;
    //         }
    //     };

    //     const updateSemesters = () => {
    //         const count = getSemesterCount(form.program);
    //         if (count === 0) {
    //             setForm(prev => ({ ...prev, semesters: [] }));
    //             return;
    //         }
    //         setForm(prev => ({
    //             ...prev,
    //             semesters: Array.from({ length: count }, (_, i) => ({
    //                 semester: i + 1,
    //                 registered: "Pending",
    //             })),
    //         }));
    //     };

    //     const updateYearCGPA = () => {
    //         const count = getYearCount(form.program);

    //         if (count === 0) {
    //             setForm(prev => ({ ...prev, yearCGPA: [] }));
    //             return;
    //         }

    //         setForm(prev => ({
    //             ...prev,
    //             yearCGPA: Array.from({ length: count }, (_, i) => ({
    //                 year: i + 1,
    //                 cgpa: null,
    //             })),
    //         }));
    //     };

    //     updateSemesters();
    //     updateYearCGPA();
    // }, [form.program]);

    useEffect(() => {
        const getSemesterCount = (program: string, batchStr: string): number => {
            switch (program) {
                case 'B.Tech': return 8;
                case 'M.Tech': return 4;
                case 'B.Tech + M.Tech': return 10;
                default: {
                    if (batchStr && batchStr.includes('-')) {
                        const parts = batchStr.split('-');
                        const start = parseInt(parts[0]);
                        let end = parseInt(parts[1]);
                        if (!isNaN(start) && !isNaN(end)) {
                            if (end < 100) {
                                end = Math.floor(start / 100) * 100 + end;
                            }
                            const duration = end - start;
                            if (duration > 0 && duration <= 10) {
                                return duration * 2;
                            }
                        }
                    }
                    return 8; // fallback to 8 semesters / 4 years
                }
            }
        };
        const getYearCount = (program: string, batchStr: string): number => {
            switch (program) {
                case 'B.Tech': return 4;
                case 'M.Tech': return 2;
                case 'B.Tech + M.Tech': return 5;
                default: {
                    if (batchStr && batchStr.includes('-')) {
                        const parts = batchStr.split('-');
                        const start = parseInt(parts[0]);
                        let end = parseInt(parts[1]);
                        if (!isNaN(start) && !isNaN(end)) {
                            if (end < 100) {
                                end = Math.floor(start / 100) * 100 + end;
                            }
                            const duration = end - start;
                            if (duration > 0 && duration <= 10) {
                                return duration;
                            }
                        }
                    }
                    return 4; // fallback to 4 years
                }
            }
        };
        if (isEditMode) return; // ⭐ Prevent overwrite in edit mode
        const semCount = getSemesterCount(form.program, form.batch);
        const yearCount = getYearCount(form.program, form.batch);
        setForm(prev => ({
            ...prev,
            semesters: Array.from({ length: semCount }, (_, i) => ({
                semester: i + 1,
                registered: "Pending",
            })),
            yearCGPA: Array.from({ length: yearCount }, (_, i) => ({
                year: i + 1,
                cgpa: null,
            })),
        }));
    }, [form.program, form.batch, isEditMode]);

    useEffect(() => {
        const controller = new AbortController();

        const getBatches = async () => {
            if (!form.school || !form.department || !form.program) {
                setBatches([]);
                return;
            }

            setIsLoading(true);
            try {
                const payload = {
                    school: form.school,
                    department: form.department,
                    program: form.program,
                };
                const data = await searchBatches(payload);
                if (!controller.signal.aborted) {
                    setBatches(data.batches || []);
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    console.error("Error fetching batches:", error);
                    setError("Failed to load batches. Please try again.");
                    setBatches([]);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        getBatches();

        return () => controller.abort();
    }, [form.school, form.department, form.program]);

    useEffect(() => {
        const controller = new AbortController();

        const getSpecializations = async () => {
            if (!form.school || !form.department || !form.program || !form.batch) {
                setSpecializations([]);
                return;
            }

            setIsLoading(true);
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
                    setError("Failed to load specializations. Please try again.");
                    setSpecializations([]);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        getSpecializations();

        return () => controller.abort();
    }, [form.school, form.department, form.program, form.batch]);

    return (
        <div className="max-w-6xl mx-auto border-[#d9d9d9] rounded-lg p-6">
            <h2 className="flex mb-5 justify-between items-center">
                <p className="sm:text-2xl text-lg font-semibold">
                    {isEditMode ? "Edit Student" : "Add Student"}
                </p>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="sm:px-4 sm:py-2 px-2 py-1 sm:text-base text-sm bg-gray-200 rounded border border-[#d9d9d9] cursor-pointer hover:bg-gray-300 shrink-0"
                        disabled={isLoading}
                    >
                        Back
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="sm:px-4 sm:py-2 px-2 py-1 sm:text-base text-sm bg-blue-600 cursor-pointer text-white rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
                        disabled={isLoading}
                    >
                        {isEditMode ? "Update" : "Submit"}
                    </button>
                </div>
            </h2>

            {/* Error Display */}
            {error && (
                <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded text-red-700">
                    {error}
                </div>
            )}

            {/* BASIC INFO */}
            <Section title="Basic Information">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/4 flex justify-center items-start">
                        <img
                            src={user}
                            alt='Full Name'
                            className="w-52 h-52 object-cover rounded-none bg-white border border-gray-300"
                        />
                    </div>
                    <div className="md:w-full bg-white p-5 rounded-none border border-gray-200 space-y-4">
                        <Grid>
                            <Input required name="fullName" label="Full Name" disabled={isEditMode && AdminUser.role !== 'admin'} value={form.fullName} onChange={handleChange} />
                            <Input required name="rollNo" label="Roll No" value={form.rollNo} disabled={isEditMode && AdminUser.role !== 'admin'} onChange={handleChange} />
                            <Input required name="enrollmentNo" label="Enrollment No" disabled={isEditMode && AdminUser.role !== 'admin'} value={form.enrollmentNo} onChange={handleChange} />
                            <Select required name="school" label="School" value={form.school} onChange={handleChange}>
                                <option value="">Select</option>
                                {renderOptions(
                                    school,
                                    (s) => s.code,
                                    (s) => s.code.toUpperCase()
                                )}
                            </Select>
                            <Select required name="department" label="Department" value={form.department} onChange={handleChange} disabled={!form.school}>
                                <option value="">Select</option>
                                {renderOptions(
                                    departmentMap[form.school] || [],
                                    (d) => d.code,
                                    (d) => d.code.toUpperCase()
                                )}
                            </Select>
                            <Select required name="program" label="Program Type" value={form.program} onChange={handleChange} disabled={!form.department}>
                                <option value="">Select</option>
                                {renderOptions(
                                    programMap[form.department] || [],
                                    (p) => p.name,
                                    (p) => p.name
                                )}
                            </Select>
                            <Select required name="batch" label="Batch" value={form.batch} onChange={handleChange} disabled={!form.program || isLoading}>
                                <option value="">Select</option>
                                {batches.map((d, i) => (
                                    <option key={i} value={d}>{d}</option>
                                ))}
                            </Select>
                            <Select required name="specialization" label="Specialization" value={form.specialization} onChange={handleChange} disabled={!form.batch || isLoading}>
                                <option value="">Select</option>
                                {specializations.map((s, i) => (
                                    <option key={i} value={s}>{s}</option>
                                ))}
                            </Select>
                        </Grid>
                    </div>
                </div>
            </Section>

            {/* PERSONAL */}
            <Section title="Personal Information">
                <Grid>
                    <Input required name="fatherName" label="Father's Name" value={form.fatherName} disabled={isEditMode && AdminUser.role !== 'admin'} onChange={handleChange} />
                    <Input required name="motherName" label="Mother's Name" value={form.motherName} disabled={isEditMode && AdminUser.role !== 'admin'} onChange={handleChange} />
                    <Select required name="gender" label="Gender" value={form.gender} disabled={isEditMode && AdminUser.role !== 'admin'} onChange={handleChange}>
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Others">Others</option>
                    </Select>
                    <Input required type="date" name="dob" label="Date of Birth" disabled={isEditMode && AdminUser.role !== 'admin'} value={form.dob} onChange={handleChange} />
                    <Select required name="category" label="Category" value={form.category} disabled={isEditMode && AdminUser.role !== 'admin'} onChange={handleChange}>
                        <option value="">Select</option>
                        {["General", "OBC", "SC", "ST", "EWS", "PwD"].map(c =>
                            <option key={c} value={c}>{c}</option>
                        )}
                    </Select>
                    <Input required name="nationalId" label="Aadhaar / National ID" disabled={isEditMode && AdminUser.role !== 'admin'} value={form.nationalId} onChange={handleChange} />
                    <Input required name="mobile" label="Mobile No" value={form.mobile} disabled={isEditMode && AdminUser.role !== 'admin'} onChange={handleChange} type="tel" />
                    <Input required name="email" label="Email ID" value={form.email} disabled={isEditMode && AdminUser.role !== 'admin'} onChange={handleChange} type="email" />
                    <Select required name="hosteller" label="Hosteller" value={form.hosteller} disabled={isEditMode && AdminUser.role !== 'admin'} onChange={handleChange}>
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                    </Select>
                    <Textarea name="address" label="Address" value={form.address} disabled={isEditMode && AdminUser.role !== 'admin'} onChange={handleChange} />
                </Grid>
            </Section>

            {/* REGISTRATION */}
            <Section title="Semester Registration">
                <Grid>
                    {form.semesters.map((sem, index) => (
                        <Select required key={sem.semester} label={`${sem.semester}${getOrdinal(sem.semester)} semester registration`} value={sem.registered} onChange={(e) => {
                            const updated = [...form.semesters];
                            updated[index] = {
                                ...sem,
                                registered: e.target.value as "Pending" | "Completed",
                            };
                            setForm({ ...form, semesters: updated });
                        }}>
                            <option value='Pending'>Pending</option>
                            <option value='Completed'>Completed</option>
                        </Select>
                    ))}
                </Grid>
            </Section>

            {/* ACADEMIC */}
            <Section title="Academic Information">
                <Grid>
                    <Select required name="status" label="Status" value={form.status || 'active'} onChange={handleChange}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </Select>
                    <Select required name="enrollmentStatus" label="Enrollment Status" value={form.enrollmentStatus} onChange={handleChange}>
                        <option value="">Select</option>
                        <option value="Enrolled">Enrolled</option>
                        <option value="Graduated">Graduated</option>
                        <option value="Discontinued">Discontinued</option>
                        <option value="Hold">Hold</option>
                        <option value="Suspended">Suspended</option>
                        <option value="Expelled">Expelled</option>
                    </Select>
                    <Select required name="admissionType" label="Admission Type" disabled={isEditMode && AdminUser.role !== 'admin'} value={form.admissionType} onChange={handleChange}>
                        <option value="">Select</option>
                        <option value="Regular">Regular</option>
                        <option value="Lateral">Lateral</option>
                    </Select>
                    <Input required name="admissionYear" label="Admission Year" disabled={isEditMode && AdminUser.role !== 'admin'} value={form.admissionYear} onChange={handleChange} />
                    <Select required name="twelfthCompartment" label="12th Compartment" disabled={isEditMode && AdminUser.role !== 'admin'} value={form.twelfthCompartment} onChange={handleChange}>
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                    </Select>
                    {form.yearCGPA?.map((cg, index) => (
                        <Input key={cg.year} type="number" label={`${cg.year}${getOrdinal(cg.year)} year CGPA`} min={0} max={10} step={0.01} value={cg.cgpa ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const value = e.target.value === '' ? null : Number(e.target.value);
                            setForm(prev => ({
                                ...prev,
                                yearCGPA: prev.yearCGPA.map((y, i) =>
                                    i === index ? { ...y, cgpa: value } : y
                                ),
                            }));
                        }}
                        />
                    ))}
                </Grid>
            </Section>

            {/* PROFESSIONAL */}
            <Section title="Professional Status">
                <Grid>
                    <Select required name="internshipStatus" label="Internship Status" value={form.internshipStatus} onChange={handleChange}>
                        <option value="">Select</option>
                        {["Inactive", "Ongoing", "Completed"].map(i =>
                            <option key={i} value={i}>{i}</option>
                        )}
                    </Select>
                    <Select required name="placementStatus" label="Placement Status" value={form.placementStatus} onChange={handleChange}>
                        <option value="">Select</option>
                        {["Placed", "Not Placed"].map(i =>
                            <option key={i} value={i}>{i}</option>
                        )}
                    </Select>
                </Grid>
            </Section>
        </div>
    );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="md:w-full mb-5 bg-white p-5 rounded-none border border-[#d9d9d9] space-y-4">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        {children}
    </div>
);

const Grid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {children}
    </div>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

const Input: React.FC<InputProps> = ({ label, ...props }) => {

    const AdminUser = useSelector((state: RootState) => state.admin);

    return (
        <div className="flex flex-col w-full min-w-0">
            <label className="text-sm mb-1">
                {label}
                {props.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
                {...props}
                onWheel={(e) => {
                    if (props.type === "number") {
                        (e.target as HTMLInputElement).blur();
                    }
                }}
                className={`w-full min-w-0 text-gray-600 border border-[#d9d9d9] rounded px-3 py-2
                focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent no-spinner
                ${AdminUser.role !== 'admin'
                ? 'bg-[#f3f4f6] cursor-not-allowed disabled:color-gray-500'
                : ''}`}
            />
        </div>
    )
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({ label, children, ...props }) => (
    <div className="flex flex-col w-full min-w-0">
        <label className="text-sm mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <select
            {...props}
            className="w-full min-w-0 text-gray-600 border cursor-pointer border-[#d9d9d9] rounded px-3 py-2
                 disabled:bg-gray-100 disabled:cursor-not-allowed
                 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
        >
            {children}
        </select>
    </div>
);

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
}

const Textarea: React.FC<TextareaProps> = ({ label, ...props }) => (
    <div className="md:col-span-4">
        <label className="text-sm">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <textarea
            {...props}
            className="w-full text-gray-600 border border-[#d9d9d9] rounded px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            rows={3}
        />
    </div>
);

const renderOptions = <T,>(
    items: T[],
    getValue: (item: T) => string,
    getLabel: (item: T) => string
): JSX.Element[] =>
    items.map((item) => {
        const value = getValue(item);
        return (
            <option key={value} value={value}>
                {getLabel(item)}
            </option>
        );
    });

export default AddStudentForm;