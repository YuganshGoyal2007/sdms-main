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
        <Route path="*" element={<NotFound />} />

        {/* Admin */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/messages" element={<AdminMessages />} />
          <Route path="/admin/classes" element={<Classes />} />
          <Route path="/admin/records" element={<Records />} />
          <Route path="/admin/records/:school/:department/:program/:batch/:specialization" element={<CategoryView />} />
          <Route path="/admin/records/:rollNo" element={<StudentDetail />} />
          <Route path="/admin/register-student" element={<AddStudent />} />
          <Route path="/coordinator/dashboard" element={<CoordinatorDashboard />} />
          <Route path="/coordinator/messages" element={<CoordinatorMessages />} />
          <Route path="/coordinator/classes" element={<Classes />} />
          <Route path="/coordinator/records" element={<Records />} />
          <Route path="/coordinator/records/:school/:department/:program/:batch/:specialization" element={<CategoryView />} />
          <Route path="/coordinator/records/:rollNo" element={<StudentDetail />} />
          <Route path="/coordinator/register-student" element={<AddStudent />} />
          <Route path="/admin/records" element={<Records />} />
          <Route path="/admin/classes" element={<Classes />} />
          <Route path="/admin/register-student" element={<AddStudent />} />
          <Route path="/admin/update-specialization" element={<Specialization />} />
          <Route path="/admin/records/:school/:department/:program/:batch/:specialization" element={<CategoryView />}/>
          <Route path="/admin/records/:rollNo" element={<StudentDetail />}/>
          <Route path="/admin/roles" element={<Roles />} />
          <Route path="/admin/chairpersons" element={<Chairpersons />} />
          <Route path="/admin/timetable" element={<TimetableAdmin />} />
          <Route path="/chairperson/dashboard" element={<ChairpersonDashboard />} />
          <Route path="/chairperson/classes" element={<ChairpersonClasses />} />
          <Route path="/chairperson/records" element={<ChairpersonRecords />} />
          <Route path="/chairperson/logs" element={<ChairpersonLogs />} />
          <Route path="/chairperson/messages" element={<ChairpersonMessages />} />
          <Route path="/chairperson/records/:school/:department/:program/:batch/:specialization" element={<ChairpersonCategoryView />} />
          <Route path="/chairperson/records/:rollNo" element={<ChairpersonStudentDetail />} />

          {/* Student */}
          <Route path="/student" element={<StudentDashboard />} />
        </Route>
      </Routes>
      <Toaster richColors position="top-center" expand={false} />
    </BrowserRouter>
    </AppErrorBoundary>
  );
};

export default App;
