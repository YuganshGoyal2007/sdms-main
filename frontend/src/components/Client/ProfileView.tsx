import { User, Phone, FileText, NotebookText } from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "../../context/app/store";
export function ProfileView() {

  const student = useSelector((state: RootState) => state.user.student);

  const getOrdinal = (n: number) => {
    if (n === 1) return "st";
    if (n === 2) return "nd";
    if (n === 3) return "rd";
    return "th";
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Profile Header with Academic Performance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 md:p-6">
        <div className="flex items-start gap-4 md:gap-6 flex-wrap lg:flex-nowrap">
          <div className="flex items-start gap-4 md:gap-6 flex-1 min-w-0 flex-wrap sm:flex-nowrap">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-[#faf7f9] rounded-xl flex items-center justify-center shrink-0 border border-[#e5d5df]">
              <span className="text-[#7b3b5a] text-2xl md:text-3xl font-medium">
                {student?.fullName.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
                {student?.fullName}
              </h1>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-3 md:mt-4">
                {renderField("Roll Number", student?.rollNo.toLocaleUpperCase())}
                {renderField("Enrollment Number", student?.enrollmentNo)}
                {renderField("Program", student?.program)}
                {renderField("Course", student?.specialization)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Personal Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-[#7b3b5a]" />
              <h2 className="font-semibold text-gray-900">Personal Information</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {renderField("Father's Name", student?.fatherName)}
              {renderField("Mother's Name", student?.motherName)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {renderField("Gender", student?.gender)}
              {renderField("Date of Birth", student?.dob ? new Date(student?.dob).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : '')}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {renderField("Category", student?.category)}
              {renderField("Aadhar/National Id", student?.nationalId)}
            </div>
          </div>
        </div>

        {/* Academic Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <NotebookText className="w-5 h-5 text-[#7b3b5a]" />
              <h2 className="font-semibold text-gray-900">Academic Results (CGPA)</h2>
            </div>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            {student?.yearCGPA.map((item) => {
              const isCompleted = item.cgpa !== null;

              return (
                <div
                  key={item.year}
                  className={`flex items-center justify-between p-4 border rounded-lg bg-gray-50 border-gray-200`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">
                      {item.year}{getOrdinal(item.year)} Year
                    </span>
                  </div>
                  <span
                    className={`text-sm font-semibold ${isCompleted ? "text-[#7b3b5a]" : "text-gray-500"
                      }`}
                  >
                    {isCompleted ? `${item.cgpa}` : "N/A"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Admission Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#7b3b5a]" />
              <h2 className="font-semibold text-gray-900">
                Admission Details
              </h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {renderField("Enrollment Status", student?.enrollmentStatus)}
              {renderField("Admission Type", student?.admissionType)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {renderField("Admission Year", student?.admissionYear)}
              {renderField("12th Compartment", student?.twelfthCompartment)}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-[#7b3b5a]" />
              <h2 className="font-semibold text-gray-900">
                Contact Information
              </h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderField("Mobile Number", student?.mobile)}
              {renderField("Email", student?.email)}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderField("Address", student?.address)}
              {renderField("Hosteller", student?.hosteller)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const renderField = (label: string, value: string | undefined) => (
  <div>
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className="font-medium text-gray-900">{value}</p>
  </div>
)