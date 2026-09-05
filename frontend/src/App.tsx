import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AppErrorBoundary } from "./components/AppErrorBoundary";

import Signup from "./pages/Landing/Signup";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import CoordinatorDashboard from "./pages/Admin/CoordinatorDashboard";
import AdminMessages from "./pages/Admin/AdminMessages";
import CoordinatorMessages from "./pages/Admin/CoordinatorMessages";
import Records from "./pages/Admin/Records";
import CategoryView from "./pages/Admin/CategoryView";
import StudentDetail from "./pages/Admin/StudentDetails";
import Login from "./pages/Landing/Login";
import LandingPage from "./pages/Landing/LandingPage";
import StudentDashboard from "./pages/Client/StudentDashboard";
import AddStudent from "./pages/Admin/AddStudent";
import Specialization from "./pages/Admin/Specialization";
import TimetableAdmin from "./pages/Admin/TimetableAdmin";
import NotFound from "./utils/NotFound";
import ProtectedRoute from "./utils/ProtectedRoute";
import DeveloperPage from "./pages/Landing/DeveloperPage";
import Roles from "./pages/Admin/Roles";
import Classes from "./pages/Admin/Classes";
import Chairpersons from "./pages/Admin/Chairpersons";
import ChairpersonDashboard from "./pages/Admin/ChairpersonDashboard";
import ChairpersonClasses from "./pages/Chairperson/ChairpersonClasses";
import ChairpersonRecords from "./pages/Chairperson/ChairpersonRecords";
import ChairpersonCategoryView from "./pages/Chairperson/ChairpersonCategoryView";
import ChairpersonStudentDetail from "./pages/Chairperson/ChairpersonStudentDetail";
import ChairpersonMessages from "./pages/Chairperson/ChairpersonMessages";
import ChairpersonLogs from "./pages/Chairperson/ChairpersonLogs";
import TeachingDashboard from "./pages/Teaching/TeachingDashboard";
import MarkAttendance from "./pages/Teaching/MarkAttendance";
import StudentAttendance from "./pages/Student/StudentAttendance";
import AdminAttendanceSessions from "./pages/Admin/AdminAttendanceSessions";
import FacultyAssignmentsAdmin from "./pages/Admin/FacultyAssignmentsAdmin";
import FacultyAdmin from "./pages/Admin/FacultyAdmin";
import FacultyProfile from "./pages/Faculty/FacultyProfile";
import FacultyMessages from "./pages/Faculty/FacultyMessages";
import FacultyLeaves from "./pages/Faculty/FacultyLeaves";
import NoDuesAdmin from "./pages/Admin/NoDuesAdmin";
import LeaveAdmin from "./pages/Admin/LeaveAdmin";

const App = () => {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Signup />} />
          <Route path="/developers" element={<DeveloperPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            {/* Admin */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/messages" element={<AdminMessages />} />
            <Route path="/admin/classes" element={<Classes />} />
            <Route path="/admin/records" element={<Records />} />
            <Route path="/admin/records/:school/:department/:program/:batch/:specialization" element={<CategoryView />} />
            <Route path="/admin/records/:rollNo" element={<StudentDetail />} />
            <Route path="/admin/register-student" element={<AddStudent />} />
            <Route path="/admin/update-specialization" element={<Specialization />} />
            <Route path="/admin/roles" element={<Roles />} />
            <Route path="/admin/chairpersons" element={<Chairpersons />} />
            <Route path="/admin/timetable" element={<TimetableAdmin />} />
            <Route path="/admin/attendance" element={<AdminAttendanceSessions />} />
            <Route path="/admin/faculty" element={<FacultyAdmin />} />
            <Route path="/admin/faculty-assignments" element={<FacultyAssignmentsAdmin />} />
            <Route path="/admin/no-dues" element={<NoDuesAdmin />} />
            <Route path="/admin/leaves" element={<LeaveAdmin />} />

            {/* Coordinator */}
            <Route path="/coordinator/dashboard" element={<CoordinatorDashboard />} />
            <Route path="/coordinator/messages" element={<CoordinatorMessages />} />
            <Route path="/coordinator/classes" element={<Classes />} />
            <Route path="/coordinator/records" element={<Records />} />
            <Route path="/coordinator/records/:school/:department/:program/:batch/:specialization" element={<CategoryView />} />
            <Route path="/coordinator/records/:rollNo" element={<StudentDetail />} />
            <Route path="/coordinator/register-student" element={<AddStudent />} />
            <Route path="/coordinator/no-dues" element={<NoDuesAdmin />} />
            <Route path="/coordinator/leaves" element={<LeaveAdmin />} />

            {/* Chairperson */}
            <Route path="/chairperson/dashboard" element={<ChairpersonDashboard />} />
            <Route path="/chairperson/classes" element={<ChairpersonClasses />} />
            <Route path="/chairperson/records" element={<ChairpersonRecords />} />
            <Route path="/chairperson/logs" element={<ChairpersonLogs />} />
            <Route path="/chairperson/messages" element={<ChairpersonMessages />} />
            <Route path="/chairperson/records/:school/:department/:program/:batch/:specialization" element={<ChairpersonCategoryView />} />
            <Route path="/chairperson/records/:rollNo" element={<ChairpersonStudentDetail />} />
            <Route path="/chairperson/register-student" element={<AddStudent />} />
            <Route path="/chairperson/no-dues" element={<NoDuesAdmin />} />
            <Route path="/chairperson/leaves" element={<LeaveAdmin />} />

            {/* Faculty & Teaching portal */}
            <Route path="/faculty/dashboard" element={<TeachingDashboard />} />
            <Route path="/faculty/profile" element={<FacultyProfile />} />
            <Route path="/faculty/classes" element={<TeachingDashboard />} />
            <Route path="/faculty/messages" element={<FacultyMessages />} />
            <Route path="/faculty/leaves" element={<FacultyLeaves />} />
            <Route path="/faculty/mark-attendance" element={<TeachingDashboard />} />
            <Route path="/faculty/mark-attendance/:classKey/:subjectId" element={<MarkAttendance />} />

            {/* Coordinator teaching */}
            <Route path="/coordinator/mark-attendance" element={<TeachingDashboard />} />
            <Route path="/coordinator/mark-attendance/:classKey/:subjectId" element={<MarkAttendance />} />

            {/* Chairperson teaching */}
            <Route path="/chairperson/mark-attendance" element={<TeachingDashboard />} />
            <Route path="/chairperson/mark-attendance/:classKey/:subjectId" element={<MarkAttendance />} />

            {/* Generic /teaching fallbacks so 404 never occurs */}
            <Route path="/teaching/dashboard" element={<TeachingDashboard />} />
            <Route path="/teaching/mark-attendance" element={<TeachingDashboard />} />
            <Route path="/teaching/mark-attendance/:classKey/:subjectId" element={<MarkAttendance />} />

            <Route path="/student/attendance" element={<StudentAttendance />} />
            <Route path="/student/attendance/:subjectId" element={<StudentAttendance />} />

            {/* Student */}
            <Route path="/student" element={<StudentDashboard />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster richColors position="top-center" expand={false} />
      </BrowserRouter>
    </AppErrorBoundary>
  );
};

export default App;
