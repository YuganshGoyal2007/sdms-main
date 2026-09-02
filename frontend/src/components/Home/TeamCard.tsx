import { useState, useEffect } from "react";
import type { TeamCardProps } from "../../types/types";

export function TeamCard({ name, role, image, portfolio, linkedIn, github, x, mail }: TeamCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isNameToggled, setIsNameToggled] = useState(false);

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const cardWidth = isMobile
    ? isHovered
      ? "78vw"
      : "74vw"
    : isHovered
      ? "330px"
      : "270px";
  const cardHeight = isMobile
    ? isHovered
      ? "320px"
      : "280px"
    : isHovered
      ? "400px"
      : "280px";
  const imageSize = isMobile
    ? isHovered
      ? "100%"
      : "110px"
    : isHovered
      ? "100%"
      : "128px";

  // Toggle name for Frontend role only
  const handleRoleClick = () => {
    if (role == "Frontend Developer" || "Project Lead") {
      setIsNameToggled(!isNameToggled);
    }
  };

  const displayName = role === "Frontend Developer" && isNameToggled ? "Kazi" : role === "Project Lead" && isNameToggled ? "Nishant Chauhan" : name;

  return (
    <div
      className="relative group transition-all duration-300"
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      style={{
        zIndex: isHovered ? 10 : 1,
      }}
    >
      {/* Main card */}
      <div
        className="relative bg-[#d4b0c2c6] rounded-3xl overflow-hidden shadow-md border border-gray-200"
        style={{
          width: cardWidth,
          height: cardHeight,
          maxWidth: isMobile ? "300px" : "340px",
          boxShadow: isHovered
            ? "0 20px 50px rgba(123, 59, 90, 0.15), 0 0 0 1px rgba(123, 59, 90, 0.2)"
            : "0 10px 30px rgba(123, 59, 90, 0.1)",
          transform: isHovered
            ? "translateY(-12px) scale(1.05)"
            : "translateY(0) scale(1)",
          transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Profile image */}
        <div
          className="relative mx-auto transition-all duration-500 ease-out overflow-hidden"
          style={{
            width: imageSize,
            height: imageSize,
            borderRadius: isHovered ? "24px 24px 0 0" : "50%",
            marginTop: isHovered ? 0 : 24,
            marginBottom: isHovered ? 0 : 16,
            boxShadow: isHovered
              ? "0 0 0 3px rgba(123, 59, 90, 0.9)"
              : "0 0 0 3px rgba(123, 59, 90, 1)",
          }}
        >
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-all duration-700 ease-out"
            style={{
              transform: isHovered ? "scale(1.05)" : "scale(1.1)",
              filter: isHovered ? "grayscale(0)" : "grayscale(1)",
            }}
          />

          {/* Dark overlay on hover */}
          <div
            className="absolute inset-0 bg-linear-to-b from-black/0 via-black/10 to-black/60 transition-opacity duration-500"
            style={{
              opacity: isHovered ? 1 : 0,
            }}
          />
        </div>

        {/* Content section */}
        <div
          className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-center justify-center transition-all duration-700 overflow-visible"
          style={{
            height: isHovered ? "50%" : "auto",
            paddingTop: isHovered ? "2rem" : isMobile ? "8.5rem" : "11.5rem",
            zIndex: 2,
          }}
        >
          {/* Name and role */}
          <div className="mb-auto transition-all duration-500">
            <h3 className="text-xl font-bold text-gray-900 mb-1 text-center">
              {displayName}
            </h3>
            <p
              className="text-[#7b3b5a] text-base text-center font-bold no-underline hover:opacity-80 transition-opacity"
              onClick={handleRoleClick}
            >
              {role}
            </p>
          </div>

          {/* Contact Icons - appear on hover */}
          <div
            className="transition-all duration-500 ease-out"
            style={{
              maxHeight: isHovered ? "48px" : "0px",
              opacity: isHovered ? 1 : 0,
            }}
          >
            <div className="flex items-center justify-center gap-3 pt-2">
              <a href={portfolio} target="_blank">
                <button
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#E2E8F0] hover:bg-[#6c6d70] transition-all duration-300 relative group/icon cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    transform: isHovered ? "translateY(0)" : "translateY(10px)",
                    transition: "all 0.4s ease-out 0.1s",
                  }}
                >
                  <svg
                    className="w-4 h-4 text-gray-400 group-hover/icon:text-[#E2E8F0]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" />
                  </svg>
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/icon:opacity-100 transition-opacity duration-200 pointer-events-none">
                    Website
                  </span>
                </button>
              </a>
              <a href={linkedIn} target="_blank">
                <button
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#E2E8F0] hover:bg-[#6c6d70] transition-all duration-300 relative group/icon cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    transform: isHovered ? "translateY(0)" : "translateY(10px)",
                    transition: "all 0.4s ease-out 0.1s",
                  }}
                >
                  <svg
                    className="w-4 h-4 text-gray-400 group-hover/icon:text-[#E2E8F0]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect x="2" y="9" width="4" height="12" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/icon:opacity-100 transition-opacity duration-200 pointer-events-none">
                    LinkedIn
                  </span>
                </button>
              </a>
              <a href={github} target="_blank">
                <button
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#E2E8F0] hover:bg-[#6c6d70] transition-all duration-300 relative group/icon cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    transform: isHovered ? "translateY(0)" : "translateY(10px)",
                    transition: "all 0.4s ease-out 0.15s",
                  }}
                >
                  <svg
                    className="w-4 h-4 text-gray-400 group-hover/icon:text-[#E2E8F0]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                  </svg>
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/icon:opacity-100 transition-opacity duration-200 pointer-events-none">
                    GitHub
                  </span>
                </button>
              </a>
              <a href={x} target="_blank">
                <button
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#E2E8F0] hover:bg-[#6c6d70] transition-all duration-300 relative group/icon cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    transform: isHovered ? "translateY(0)" : "translateY(10px)",
                    transition: "all 0.4s ease-out 0.2s",
                  }}
                >
                  <svg viewBox="0 0 1200 1227"
                    fill="#94A3B8" className="w-3 h-3 text-gray-400 group-hover/icon:fill-[#E2E8F0]" >
                    <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z"></path>
                  </svg>
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/icon:opacity-100 transition-opacity duration-200 pointer-events-none">
                    X (Formerly Twitter)
                  </span>
                </button>
              </a>
              <a href={mail} target="_blank">
                <button
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#E2E8F0] hover:bg-[#6c6d70] transition-all duration-300 relative group/icon cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    transform: isHovered ? "translateY(0)" : "translateY(10px)",
                    transition: "all 0.4s ease-out 0.25s",
                  }}
                >
                  <svg
                    className="w-4 h-4 text-gray-400 group-hover/icon:text-[#E2E8F0]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/icon:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                    Email
                  </span>
                </button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
