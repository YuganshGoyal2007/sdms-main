import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";

import Signup from "./pages/Landing/Signup";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import Records from "./pages/Admin/Records";
import CategoryView from "./pages/Admin/CategoryView";
import StudentDetail from "./pages/Admin/StudentDetails";
import Login from "./pages/Landing/Login";
import LandingPage from "./pages/Landing/LandingPage";
import StudentDashboard from "./pages/Client/StudentDashboard";
import AddStudent from "./pages/Admin/AddStudent";
import Specialization from "./pages/Admin/Specialization";
import NotFound from "./utils/NotFound";
import ProtectedRoute from "./utils/ProtectedRoute";
import DeveloperPage from "./pages/Landing/DeveloperPage";
import Roles from "./pages/Admin/Roles";
import Classes from "./pages/Admin/Classes";
import Chairpersons from "./pages/Admin/Chairpersons";
import ChairpersonDashboard from "./pages/Admin/ChairpersonDashboard";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/developers" element={<DeveloperPage />} />
        <Route path="*" element={<NotFound />} />

        {/* Admin */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/records" element={<Records />} />
          <Route path="/admin/classes" element={<Classes />} />
          <Route path="/admin/register-student" element={<AddStudent />} />
          <Route path="/admin/update-specialization" element={<Specialization />} />
          <Route path="/admin/records/:school/:department/:program/:batch/:specialization" element={<CategoryView />}/>
          <Route path="/admin/records/:rollNo" element={<StudentDetail />}/>
          <Route path="/admin/roles" element={<Roles />} />
          <Route path="/admin/chairpersons" element={<Chairpersons />} />
          <Route path="/chairperson/dashboard" element={<ChairpersonDashboard />} />

          {/* Student */}
          <Route path="/student" element={<StudentDashboard />} />
        </Route>
      </Routes>

      <Toaster richColors position="top-center" expand={false} />
    </BrowserRouter>
  );
};

export default App;
