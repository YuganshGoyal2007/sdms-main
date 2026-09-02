import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AdminSideNav from "../../components/Admin/AdminSideNav";
import Header from "../../components/Admin/Header";
import Footer from "../../components/Admin/Footer";
import Dropdown from "../../utils/Dropdown";
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
          alert(`Successfully deleted all students in - ${school} > ${department} > ${program} ${batch} > ${specialization}`);
          setStudents([]);
        }
      } catch (error: any) {
        alert(error?.response?.data?.message || error.message)
      } finally {
        setDeleting(false);
      }
    }
  }

  const downloadClassSheet = () => {
    if (!students.length) {
      alert("No students available to export for this class.");
      return;
    }

    const headers = [
      "Roll No",
      "Enrollment No",
      "Full Name",
      "Father Name",
      "Category",
      "Enrollment Status",
      "Admission Type",
      "School",
      "Department",
      "Program",
      "Batch",
      "Specialization",
      "Mobile",
      "Email",
      "Hosteller",
      "Gender",
      "DOB",
      "Admission Year",
    ];

    const rows = students.map((student) => [
      student.rollNo,
      student.enrollmentNo,
      student.fullName,
      student.fatherName,
      student.category,
      student.enrollmentStatus,
      student.admissionType,
      student.school,
      student.department,
      student.program,
      student.batch,
      student.specialization,
      student.mobile,
      student.email,
      student.hosteller,
      student.gender,
      student.dob,
      student.admissionYear,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeName = `${program || "program"}_${batch || "batch"}_${specialization || "specialization"}`
      .replace(/\s+/g, "_")
      .replace(/[^\w\-]/g, "");
    link.download = `${safeName}_students.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

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
          alert(error?.response?.data?.message || error?.message || 'Failed to fetch students');
        }
        setStudents([]);
      } finally {
        setIsLoading(false);
      }
    }
    filteredStudents();
  }, [school, department, program, batch, specialization]);

  const filteredAndSortedStudents = [...students]
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
      if (sortField === "Name") {
        return a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' });
      }
      if (sortField === "Category") {
        return a.category.localeCompare(b.category, undefined, { sensitivity: 'base' });
      }
      if (sortField === "Enrollment Status") {
        return (a.enrollmentStatus || "").localeCompare(b.enrollmentStatus || "", undefined, { sensitivity: 'base' });
      }
      if (sortField === "Admission Type") {
        return (a.admissionType || "").localeCompare(b.admissionType || "", undefined, { sensitivity: 'base' });
      }
      // Default / "Roll No"
      return a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true, sensitivity: 'base' });
    });

  return (
    <div className="w-full max-h-screen overflow-hidden flex">

      <AdminSideNav activeTab={'records'} />

      <div className={`flex flex-col flex-1 transition-all batch-300 ${!menu ? 'sm:w-[80vw] w-[85vw]' : 'w-[95vw]'}`}>

        <Header />

        <div className='sm:h-full flex-1 sm:min-h-[83vh] min-h-[88vh] overflow-y-auto py-5 px-10 bg-[#f3f3f3]'>
          {accessDenied ? (
            <div className="bg-white border border-red-200 rounded-xl p-8 text-center max-w-lg mx-auto my-12 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
                !
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
              <p className="text-sm text-gray-600 mb-6">
                {accessErrorMessage || `You are not assigned to manage or view this class (${school} > ${department} > ${program} ${batch}).`}
              </p>
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="px-5 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          ) : (
            <>
              <div className="sm:flex grid grid-cols-1 grid-rows-2 justify-between items-center sm:mb-5 mb-3">
                <button onClick={() => navigate(-1)} className="px-2 py-1 sm:text-base text-sm col-end-1 bg-gray-200 border border-[#d9d9d9] rounded cursor-pointer hover:bg-gray-300">
                  Back
                </button>
                <h3 className="row-start-2 text-sm my-1 sm:my-0 sm:text-base -col-start-3 col-end-3">{school?.toLocaleUpperCase()} &gt; {department?.toLocaleUpperCase()} &gt; {program} {batch} &gt; {specialization}</h3>
                <div className="flex justify-end sm:justify-center items-center gap-3">
                  <button onClick={() => navigate("/admin/register-student")} className="px-2 py-1 sm:text-base text-sm col-start-2 bg-blue-600 text-white border border-blue-800 rounded cursor-pointer flex justify-center items-center hover:bg-blue-700">Add Student</button>
                  <button onClick={downloadClassSheet} className="px-2 py-1 sm:text-base text-sm col-start-2 bg-gray-200 border border-[#d9d9d9] rounded cursor-pointer flex justify-center items-center hover:bg-gray-300">Export</button>
                  {user.role === 'admin' &&
                    <button onClick={handleDelete} className="px-2 py-1 sm:text-base text-sm text-white col-start-2 bg-red-600 border border-red-800 rounded cursor-pointer flex justify-center items-center hover:bg-red-700"> {deleting ? 'Deleting' : 'Delete'} </button>
                  }
                </div>
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
                      placeholder="Name or Roll No"
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
                      <td className="px-3 whitespace-nowrap">S.No</td>
                      <td className="px-3 whitespace-nowrap">Photo</td>
                      <td className="px-3 whitespace-nowrap">Roll No</td>
                      <td className="px-3 whitespace-nowrap">Full Name</td>
                      <td className="px-3 whitespace-nowrap">Father’s Name</td>
                      <td className="px-3 whitespace-nowrap">Category</td>
                      <td className="px-3 whitespace-nowrap">Enrollment Status</td>
                      <td className="px-3 whitespace-nowrap">Admission Type</td>
                      <td className="px-3 whitespace-nowrap">Options</td>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading
                      ? Array.from({ length: 10 }).map((_, index) => (
                        <tr key={index} className="bg-[#f8f9fa] border-t border-[#d9d9d9] h-16 animate-pulse">
                          {Array.from({ length: 9 }, (_, i) => (
                            <td key={i} className="px-3">
                              <div className="h-7 w-20 mx-auto bg-gray-300 rounded" />
                            </td>
                          ))}
                        </tr>
                      ))
                      : filteredAndSortedStudents.length > 0 ? (
                        filteredAndSortedStudents.map((item, index) => (
                          <tr
                            key={item.rollNo}
                            className="bg-[#f8f9fa] border-y border-[#d9d9d9] h-16"
                          >
                            <td className="px-3 whitespace-nowrap">{index + 1}.</td>
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
                                    {item.fullName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-3 whitespace-nowrap">{item.rollNo.toLocaleUpperCase()}</td>
                            <td className="px-3 whitespace-nowrap">{item.fullName}</td>
                            <td className="px-3 whitespace-nowrap">{item.fatherName}</td>
                            <td className="px-3 whitespace-nowrap">{item.category}</td>
                            <td className="px-3 whitespace-nowrap">{item.enrollmentStatus}</td>
                            <td className="px-3 whitespace-nowrap">{item.admissionType}</td>
                            <td className="px-3 whitespace-nowrap">
                              <button
                                onClick={() => navigate(`/admin/records/${encodeURIComponent(item.rollNo)}`)}
                                className="px-2 py-1 bg-gray-200 border cursor-pointer border-[#d9d9d9] rounded hover:bg-gray-300 transition"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="border-t border-[#d9d9d9] h-16">
                          <td
                            colSpan={8}
                            className="text-center align-middle text-gray-600"
                          >
                            {students.length > 0
                              ? "No students match your search query"
                              : "No student found in the selected course"
                            }
                          </td>
                        </tr>
                      )
                    }
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="h-14 shrink-0">
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default CategoryDomain;