import banner from "/Images/GBU_BANNER.png";
import LandingFooter from "../../components/Home/Footer";
import LandingNavbar from "../../components/Home/Navbar";
import About from "../../components/Home/About";
import Statistics from "../../components/Home/Statistics";
import Carousel from "../../components/Home/Carousal";

const LandingPage = () => {
    return (
        <>
            <LandingNavbar />
            <section id="home" className="relative w-full bg-cover bg-center" style={{ backgroundImage: `url(${banner})` }}>
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/50"></div>
                {/* Texture overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:16px_16px] opacity-25 mix-blend-overlay pointer-events-none"></div>
                {/* Content */}
                <div className="relative max-w-4xl mx-auto px-6 py-32 text-center text-white">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in-up">
                        Welcome to SDMS
                    </h1>
                    <p className="text-lg md:text-xl font-medium mb-6 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                        Student Data Management System 
                    </p>
                    <p className="text-sm md:text-base leading-relaxed opacity-90 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
                        A centralized platform designed for students to seamlessly manage academics, track results,
                        and stay connected through clear and efficient communication, all
                        from one unified dashboard.
                    </p>
                </div>
            </section>
            <Statistics />
            <About />
            <Carousel />
            <LandingFooter />
        </>
    );
};

export default LandingPage;