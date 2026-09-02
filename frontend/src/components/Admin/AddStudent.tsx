import Footer from "../../components/Admin/Footer";
import Header from "../../components/Admin/Header";
import StudentForm from "../../components/Admin/StudentForm";
import AdminSideNav from "../../components/Admin/AdminSideNav";

const AddStudent = () => {
    return (
        <div className="h-screen w-full overflow-hidden flex bg-[#f8f9fa]">

            {/* Sidebar */}
            <AdminSideNav activeTab={"dashboard"} />

            <div className="flex flex-col flex-1">

                <div className="sm:h-[10vh] h-[7vh] shrink-0">
                    <Header />
                </div>

                <main className="flex-1 overflow-y-auto h-[88vh] sm:min-h-[83vh] bg-[#f3f3f3] px-5 sm:px-0">
                    <StudentForm />
                </main>

                <div className="sm:h-[7vh] h-[5vh] shrink-0">
                    <Footer />
                </div>

            </div>
        </div>
    );
};

export default AddStudent;