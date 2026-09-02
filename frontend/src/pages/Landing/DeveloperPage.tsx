import { AnimatedBackground } from "../../components/Home/AnimatedBackground";
import { Header } from "../../components/Home/Header";
import { HeroSection } from "../../components/Home/HeroSection";
import { TeamSection } from "../../components/Home/TeamSection";

// NOTICE
// This page is dedicated to v1 devs
// In future, surely another one will continue developing the site
// To maintain the dignity and ethics of software development, add your presence to the constants
// Also do not remove any of the pre-defined dev and this notice

const DeveloperPage = () => {
  return (
    <div className="relative max-h-screen sm:overflow-hidden bg-white text-gray-900">
      <AnimatedBackground />
      <div className="relative z-10">
        <Header />
        <main className="pb-20 pt-5">
          <HeroSection />
          <TeamSection />
        </main>
      </div>
    </div>
  );
};

export default DeveloperPage;
