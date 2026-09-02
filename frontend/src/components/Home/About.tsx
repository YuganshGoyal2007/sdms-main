import { Calendar, CircleCheckBig, TrendingUp, Megaphone } from 'lucide-react'

const About = () => {

    const AboutCards = [
        {
            id: 1,
            icon: <Megaphone size={22} />,
            heading: 'Announcements',
            subheading: 'Real-time updates.',
        },
        {
            id: 2,
            icon: <Calendar size={22} />,
            heading: 'Class Schedule',
            subheading: 'Timetable management.',
        },
        {
            id: 3,
            icon: <CircleCheckBig size={22} />,
            heading: 'Attendance',
            subheading: 'Track daily attendance.',
        },
        {
            id: 4,
            icon: <TrendingUp size={22} />,
            heading: 'Results',
            subheading: 'Access academic records.',
        },
    ]

    return (
        <section id="about" className="w-full bg-white py-10">
            <div className="max-w-[70%] mx-auto px-6">
                {/* HEADING */}
                <div className="text-center mb-14">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                        About SDMS
                    </h2>

                    <p className="text-gray-600 leading-relaxed max-w-3xl mx-auto mb-6">
                        The Student Data Management System (SDMS) is a comprehensive
                        digital platform designed to streamline student-related operations
                        at Gautam Buddha University. It provides a unified interface for
                        students to manage registrations, view academic records, and stay updated
                        with important university announcements.
                    </p>

                    <p className="text-gray-600 leading-relaxed max-w-3xl mx-auto">
                        Everything you need through a centralized
                        student management system.
                    </p>
                </div>

                {/* FEATURES GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {AboutCards.map((item, index) => (
                        <div
                            key={index}
                            className="bg-[#f8f2f5] rounded-2xl p-8 hover:shadow-lg hover:-translate-y-1 transition batch-300 animate-fade-in-up"
                            style={{ animationDelay: "0.2s" }}
                        >
                            <div className="w-11 h-11 rounded-xl bg-[#7b3b5a] flex items-center justify-center text-white mb-5 group-hover:scale-110 transition batch-300">
                                {item.icon}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {item.heading}
                            </h3>
                            <p className="text-sm text-gray-600">
                                {item.subheading}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default About