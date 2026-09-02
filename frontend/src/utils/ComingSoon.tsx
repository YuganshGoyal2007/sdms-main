import { Clock } from "lucide-react";

export function ComingSoon({ feature }: { feature: string }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] bg-linear-to-b bg-white shadow-sm rounded-lg border border-gray-200 p-8">
            {feature !== 'GBU Academics'
                ? <>
                    <div className="flex items-center justify-center w-16 h-16 bg-[#7b3b5a]/10 rounded-full mb-4">
                        <Clock className="w-8 h-8 text-[#7b3b5a]" />
                    </div>

                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                        Coming Soon
                    </h2>

                    <p className="text-gray-600 text-center">
                        The <span className="font-medium capitalize">{feature}</span> feature
                        is currently under development. Check back soon!
                    </p>
                </>
                : <>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                        GBU Academics
                    </h2>

                    <p className="text-gray-600 text-center">
                        GBU Academics, developed by <a href="https://linktr.ee/nishant.chauhan" target="_blank" className="underline font-semibold">Nishant</a>, is an open-source student-managed community project that serves as a digital library for students, offering PYQs, research papers, and various other academic resources. Aimed to promote easy access to study materials.
                    </p>

                    <a href="https://gbu-academics.vercel.app/" target="_blank" className="text-gray-600 text-center">
                        <button
                            type="button"
                            className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 mt-4 text-sm font-semibold text-white bg-[#7b3b5a] shadow-sm cursor-pointer transition-all duration-200 ease-out hover:bg-[#6a334e] hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7b3b5a] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none">
                            Visit
                        </button>

                    </a>
                </>
            }
        </div>
    );
}