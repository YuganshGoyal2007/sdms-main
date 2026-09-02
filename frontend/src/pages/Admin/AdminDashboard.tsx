import Dashboard from "../../components/Admin/Dashboard";
import Footer from "../../components/Admin/Footer";
import Header from "../../components/Admin/Header";
import AdminSideNav from "../../components/Admin/AdminSideNav";

const AdminDashboard = () => {

  return (
    <div className="h-screen w-full overflow-hidden flex bg-[#f8f9fa]">

      <AdminSideNav activeTab={"dashboard"} />

      <div className="flex flex-col flex-1">

        <div className="sm:h-[10vh] shrink-0">
          <Header />
        </div>

        <main className="flex-1 overflow-y-auto min-h-[88vh] sm:min-h-[83vh] bg-[#f3f3f3] px-5 sm:px-0">
          <Dashboard />
        </main>

        <div className="h-14 shrink-0">
          <Footer />
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;