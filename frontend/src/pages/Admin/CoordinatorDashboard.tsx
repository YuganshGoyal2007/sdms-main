import AdminSideNav from "../../components/Admin/AdminSideNav";
import Header from "../../components/Admin/Header";
import Footer from "../../components/Admin/Footer";
import CoordinatorDashboardContent from "../../components/Admin/CoordinatorDashboardContent";

const CoordinatorDashboard = () => {
    return (
        <div className="h-screen w-full overflow-hidden flex bg-[#f8f9fa]">
            <AdminSideNav activeTab={"dashboard"} />
            <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
                <div className="shrink-0 z-10">
                    <Header />
                </div>
                <main className="flex-1 overflow-y-auto bg-[#f3f3f3] min-h-0">
                    <CoordinatorDashboardContent />
                </main>
                <div className="shrink-0 z-10 border-t border-[#d9d9d9] bg-[#f8f9fa]">
                    <Footer />
                </div>
            </div>
        </div>
    );
};

export default CoordinatorDashboard;
