import Header from "../../components/Admin/Header";
import Footer from "../../components/Admin/Footer";
import SideNav from "../../components/Admin/AdminSideNav";
import StudentDetailComponent from "../../components/Admin/StudentDetailComponent";

const DetailPage = () => {

    return (
        <div className="w-full h-full flex overflow-hidden">
            <SideNav activeTab={'records'} />
            <div className="flex flex-col sm:w-[80vw] w-[85vw] transition-all batch-300">
                <Header />
                <StudentDetailComponent />
                <Footer />
            </div>
        </div>
    );
};

export default DetailPage;