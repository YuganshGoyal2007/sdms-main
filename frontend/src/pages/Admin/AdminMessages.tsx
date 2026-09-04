import AdminSideNav from "../../components/Admin/AdminSideNav";
import Header from "../../components/Admin/Header";
import Footer from "../../components/Admin/Footer";
import MessagesCenter from "../../components/Messages/MessagesCenter";

const AdminMessages = () => {
    return (
        <div className="h-screen w-full flex bg-[#f8f9fa] overflow-hidden">
            <AdminSideNav activeTab={"messages"} />
            <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
                <div className="shrink-0 z-10">
                    <Header />
                </div>
                <main className="flex-1 overflow-y-auto bg-[#f3f3f3] min-h-0">
                    <div className="px-4 sm:px-6 lg:px-10 py-6">
                        <MessagesCenter />
                    </div>
                </main>
                <div className="shrink-0 z-10 border-t border-[#d9d9d9] bg-[#f8f9fa]">
                    <Footer />
                </div>
            </div>
        </div>
    );
};

export default AdminMessages;
