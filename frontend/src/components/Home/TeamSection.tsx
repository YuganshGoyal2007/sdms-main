import { teamMembers } from "../../constants";
import { TeamCard } from "./TeamCard";

export function TeamSection() {
  return (
    <section className="relative px-4 md:px-6 py-12 md:py-16 max-w-screen mx-auto">
      {/* Scattered dots */}
      <div className="absolute top-[18%] left-[20%] w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#7b3b5a] opacity-40"></div>
      <div className="absolute bottom-[40%] left-[18%] w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#7b3b5a] opacity-30"></div>
      <div className="absolute bottom-[25%] right-[35%] w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#7b3b5a] opacity-35"></div>

      <div className="relative flex flex-col md:flex-row items-center justify-center gap-2 md:gap-10 px-0 md:px-4 mb-10 md:mb-16 w-full">
        {teamMembers.slice(0, 3).map((member, index) => {
          return (
            <div
              key={index}
              className={`w-full md:w-auto flex justify-center`}
            >
              <TeamCard
                name={member.name}
                role={member.role}
                image={member.image}
                bgColor={member.bgColor}
                portfolio={member.portfolio}
                linkedIn={member.linkedIn}
                github={member.github}
                x={member.x}
                mail={member.mail}
              />
            </div>
          );
        })}
      </div>


      {/* Join Our Team button */}
      {/* <div className="flex justify-center">
        <button className="relative flex items-center gap-2 text-gray-700 font-semibold text-lg hover:text-[#7b3b5a] transition-colors group pb-1 cursor-pointer">
          Join Our Team
          <svg
            className="w-5 h-5 group-hover:translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
          <span className="absolute bottom-0 left-0 h-0.5 bg-[#7b3b5a] w-0 group-hover:w-full transition-all duration-300 ease-out" />
        </button>
      </div> */}
    </section>
  );
}
