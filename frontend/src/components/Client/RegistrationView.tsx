import { CheckCircle, Clock } from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "../../context/app/store";
// import { useEffect } from "react";

export function RegistrationView() {

  const student = useSelector((state: RootState) => state.user.student);

  const getOrdinal = (n: number) => {
    if (n === 1) return "st";
    if (n === 2) return "nd";
    if (n === 3) return "rd";
    return "th";
  };

  // const coordinator = {
  //   name: "Dr. Rajesh Kumar Singh",
  //   designation: "Registration Coordinator & Associate Professor",
  //   department: "Department of Computer Science & Engineering",
  //   email: "rajesh.singh@university.edu.in",
  //   phone: "+91 98765 43210",
  //   office: "CS Block, Room 305",
  //   availableHours: "Mon-Fri, 10:00 AM - 4:00 PM",
  // };

  // useEffect(() => {
  //   try {
  //     const data = 
  //   } catch (error: any) {
  //     alert(error.message)
  //   }
  // })

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Registration Coordinator */}
      {/* <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
          Registration Coordinator
        </h2>

        <div className="flex items-start gap-4 md:gap-6 flex-wrap sm:flex-nowrap">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-[#f3edf1] rounded-full flex items-center justify-center shrink-0">
            <User className="w-8 h-8 md:w-10 md:h-10 text-[#7b3b5a]" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">
              {coordinator.name}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Email</p>
                  <p className="text-sm text-gray-900 font-medium">
                    {coordinator.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Phone</p>
                  <p className="text-sm text-gray-900 font-medium">
                    {coordinator.phone}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>  */}

      {/* Registration Status Card */}
      {/* <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Registration Status
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className={`p-4 rounded-lg border ${
              isCompleted
                ? "bg-green-50/50 border-green-200/60"
                : "bg-yellow-50/50 border-yellow-200/60"
            }`}
          >
            <div className="flex items-start gap-3">
              {isCompleted ? (
                <div className="w-9 h-9 bg-green-100/70 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              ) : (
                <div className="w-9 h-9 bg-yellow-100/70 rounded-full flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              )}
              <div className="flex-1">
                <p
                  className={`font-semibold mb-1 ${
                    isCompleted ? "text-green-800" : "text-yellow-800"
                  }`}
                >
                  {isCompleted
                    ? "Registration Completed"
                    : "Registration Pending"}
                </p>
                <p
                  className={`text-sm ${
                    isCompleted ? "text-green-600" : "text-yellow-600"
                  }`}
                >
                  {isCompleted
                    ? `Submitted on: ${registrationStatus.submittedDate}`
                    : `Semester ${registrationStatus.semester.split(" ")[1]} • ${registrationStatus.academicYear}`}
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg border bg-[#faf7f9] border-[#e5d5df]">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-[#f3edf1] rounded-full flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-[#7b3b5a]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[#7b3b5a] mb-1">
                  Registration Deadline
                </p>
                <p className="text-sm text-[#643048]">
                  {registrationStatus.deadline}
                </p>
              </div>
            </div>
          </div>
        </div>

        {isPending && (
          <div className="mt-4 p-2 bg-red-50/30 border-l-2 border-red-300 rounded">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-[rgb(213,19,29)] text-xs">
                  Action Required
                </p>
                <p className="text-xs text-[rgb(207,122,126)] mt-0.5">
                  You must complete your registration to enroll in courses for
                  this semester. Contact your registration coordinator if you
                  need assistance.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>  */}

      {/* Registered Courses */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Registration Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {student?.semesters.map((sem, index) => {
            const isCompleted = sem.registered == 'Completed'

            return (
              <div key={index} className={`flex items-center justify-between p-4 border rounded-lg ${isCompleted
                ? "bg-green-50/30 border-green-200/50"
                : "border-yellow-200/50 bg-yellow-50/30"}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isCompleted ? "bg-green-50/50" : "bg-yellow-50/50"}`}>
                    {isCompleted ? <CheckCircle className={`w-5 h-5 text-green-600/80`} /> : <Clock className="w-5 h-5 text-yellow-600/80" />}
                  </div>

                  <span className="text-sm font-medium text-gray-900">
                    {sem.semester}{getOrdinal(sem.semester)} Sem Registration
                  </span>
                </div>

                <span className={`text-sm font-semibold ${isCompleted
                  ? "text-green-700/80"
                  : "text-yellow-700/80"
                  }`}>{sem.registered}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}
