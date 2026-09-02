import { Link } from "react-router-dom";

const LandingFooter = () => (
    <footer className="w-full z-50 bg-[#7b3b5a] text-white">
        <div className="max-w-[75%] mx-auto px-6 pt-16 pb-8">
            {/* TOP GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {/* COLUMN 1 */}
                <div>
                    <h3 className="text-lg font-semibold mb-2">
                        Gautam Buddha University
                    </h3>
                    <Link to={'/'}>
                        <p className="text-sm opacity-90">
                            Student Data Management System
                        </p>
                    </Link>
                </div>

                {/* COLUMN 2 */}
                <div>
                    <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                    <ul className="space-y-2 text-sm opacity-90">
                        <li>
                            <Link to={'/developers'} className="hover:underline">
                                Developers
                            </Link>
                        </li>
                        <li>
                            <Link to={'/privacy-policy'} className="hover:underline">
                                Privacy Policy
                            </Link>
                        </li>
                        <li>
                            <Link to={'terms-and-conditions'} className="hover:underline">
                                Terms and Conditions
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* COLUMN 3 */}
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold mb-4">Support</h3>
                    <p className="text-sm opacity-90">
                        Main Website:{" "}
                        <a href="https://www.gbu.ac.in/" className="hover:underline">
                            Gautam Buddha University
                        </a>
                    </p>
                    <p className="text-sm opacity-90">
                        For Queries:{" "}
                        <a href="mailto:sdms@gbu.ac.in" className="hover:underline">
                            sdms@gbu.ac.in
                        </a>
                    </p>
                </div>
            </div>

            {/* DIVIDER */}
            <div className="border-t border-white/20 mt-12 pt-6 text-center text-sm opacity-80">
                © 2002 - {new Date().getFullYear()} Gautam Buddha University. All Rights Reserved.
            </div>
        </div>
    </footer>
)

export default LandingFooter;