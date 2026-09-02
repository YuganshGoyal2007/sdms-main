import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Header() {

  const navigate = useNavigate();
  return (
    <header className="w-full px-4 md:px-6 py-4 md:py-5">
      <div className="flex items-center justify-between">
        {/* Back button */}
        <button onClick={() => {navigate(-1)}}
          className="flex items-center gap-2 px-3 md:px-4 py-2 hover:bg-gray-800 rounded-lg transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 text-gray-300 group-hover:text-white transition-colors" />
          <span className="text-sm md:text-base text-gray-300 font-medium group-hover:text-white transition-colors">
            Back
          </span>
        </button>
      </div>
    </header>
  );
}
