export function HeroSection() {
  return (
    <div className="text-center max-w-4xl mx-auto px-6 mb-8 md:mb-10">
      {/* <p className="text-gray-600 text-xs md:text-sm mb-3 md:mb-4 tracking-wide">
        Stay True to Your Vision.
      </p> */}
      <h1 className="text-3xl md:text-7xl lg:text-5xl font-bold text-gray-900">
        Meet the People Behind the{" "}
        <span className="relative inline-block font-extrabold text-4xl md:text-6xl lg:text-6xl">
          SDMS
          <svg
            className="absolute -bottom-1 md:-bottom-2 left-0 w-full transition-all duration-300 ease-out"
            height="8"
            viewBox="0 0 200 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path
              d="M0 4 Q50 2, 100 4 T200 4"
              stroke="#7b3b5a"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </h1>
    </div>
  );
}
