const Statistics = () => {

    const StatCard = [
        {
            id: 1,
            stat: '8+',
            title: 'Schools',
        },
        {
            id: 2,
            stat: '30+',
            title: 'Departments',
        },
        {
            id: 3,
            stat: '150+',
            title: 'Specializations',
        },
        {
            id: 4,
            stat: '5K+',
            title: 'Students',
        },
    ]
    return (
        <section className="w-full bg-[#f6eef2] py-20">
            <div className="max-w-[75%] mx-auto px-6">
                {/* Heading */}
                <div className="text-center mb-14">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                        Statistics
                    </h2>
                    <p className="mt-3 text-gray-600 max-w-xl mx-auto">
                        Powering a centralized ecosystem for students.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {StatCard.map((item, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-lg hover:-translate-y-1 transition batch-300 animate-fade-in-up"
                            style={{ animationDelay: "0s" }}
                        >
                            <h3 className="text-4xl font-bold text-[#7b3b5a] mb-2">{item.stat}</h3>
                            <p className="text-gray-600 font-medium">{item.title}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default Statistics