export function TimetableView() {
  const timeSlots = [
    { id: "I", time: "8:30-9:30" },
    { id: "II", time: "9:30-10:30" },
    { id: "III", time: "10:30-11:00" },
    { id: "IV", time: "11:30-12:30" },
    { id: "V", time: "12:30-1:30" },
    { id: "VI", time: "1:30-2:30" },
    { id: "VII", time: "2:30-3:30" },
    { id: "VIII", time: "3:30-4:30" },
    { id: "IX", time: "4:30-5:30" },
    { id: "X", time: "5:30-6:30" },
    { id: "XI", time: "6:30-7:30" },
  ];

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Timetable data structure
  const timetable: {
    [key: string]: {
      [key: string]: Array<{
        code: string;
        room: string;
        batch?: string;
        color: string;
      }>;
    };
  } = {
    Mon: {
      VI: [{ code: "CD310(ACD)", room: "L-103", color: "blue" }],
      VII: [{ code: "CD302(RK)", room: "L-103", color: "blue" }],
      VIII: [{ code: "CD308(MG)", room: "L-103", color: "blue" }],
      IX: [{ code: "CD304(KKY)", room: "L-103", color: "blue" }],
    },
    Tue: {
      V: [{ code: "CD310(ACD)", room: "L-104 (CLT)", color: "blue" }],
      VI: [{ code: "CD306(SK)", room: "L-104 (CLT)", color: "blue" }],
      VII: [{ code: "CD302(RK)", room: "L-103", color: "blue" }],
    },
    Wed: {
      VI: [
        { code: "CD384(KKY)", room: "IP102 T-2", color: "red" },
        { code: "CD382(SG)", room: "IP106 T-1", color: "green" },
      ],
      VII: [
        { code: "CD384(KKY)", room: "IP102 T-2", color: "red" },
        { code: "CD382(SG)", room: "IP102 T-1", color: "green" },
      ],
      VIII: [{ code: "CD312(GK)", room: "L-103", color: "blue" }],
      IX: [{ code: "CD304(KKY)", room: "L-103", color: "blue" }],
    },
    Thu: {
      II: [{ code: "CD308(MG)", room: "L-106 (CLT)", color: "blue" }],
      III: [{ code: "CD310(ACD)", room: "L-106 (CLT)", color: "blue" }],
      VII: [{ code: "CD302(RK)", room: "L-103", color: "blue" }],
      VIII: [{ code: "CD308(MG)", room: "L-103", color: "blue" }],
      IX: [{ code: "CD306(SK)", room: "L-103", color: "blue" }],
    },
    Fri: {
      II: [
        { code: "CD384(KKY)", room: "CCC-1 T-1", color: "red" },
        { code: "CD386(AGD)", room: "IP106 T-2", color: "green" },
      ],
      III: [
        { code: "CD384(KKY)", room: "CCC-1 T-2", color: "red" },
        { code: "CD386(AGD)", room: "IP106 T-1", color: "green" },
      ],
      IV: [
        { code: "CD384(KKY)", room: "IP102 T-1", color: "red" },
        { code: "CD382(SG)", room: "CCC-1 T-2", color: "green" },
      ],
      V: [
        { code: "CD384(KKY)", room: "IP102 T-1", color: "red" },
        { code: "CD382(SG)", room: "CCC-1", color: "green" },
      ],
      VII: [{ code: "CD304(KKY)", room: "L-103", color: "blue" }],
      VIII: [{ code: "CD306(SK)", room: "L-103", color: "blue" }],
      IX: [{ code: "CD312(GK)", room: "L-103", color: "blue" }],
    },
    Sat: {},
    Sun: {},
  };

  const subjects = [
    {
      code: "CD302",
      name: "Web Development using PHP",
      credits: "3",
      facultyABR: "RK",
      facultyName: "Rakesh Kumar",
      load: "3.0",
    },
    {
      code: "CD304",
      name: "Introduction to Statistical Learning",
      credits: "3",
      facultyABR: "KKY",
      facultyName: "Kauntey Kumar Yadav",
      load: "3.0",
    },
    {
      code: "CD384",
      name: "Statistical learning lab",
      credits: "3",
      facultyABR: "KKY",
      facultyName: "Kauntey Kumar Yadav",
      load: "3.0",
    },
    {
      code: "CD306",
      name: "Operation Research in Data Science",
      credits: "4",
      facultyABR: "SK",
      facultyName: "Sumit Katiyar",
      load: "4.0",
    },
    {
      code: "CD308",
      name: "Cloud Computing",
      credits: "3",
      facultyABR: "MG",
      facultyName: "Manjari Gangwar",
      load: "3.0",
    },
    {
      code: "CD310",
      name: "Data Privacy and Database Security",
      credits: "3",
      facultyABR: "AGD",
      facultyName: "Aarti Gautam Dinker",
      load: "3.0",
    },
    {
      code: "CD386",
      name: "Data Privacy and Database Security lab",
      credits: "3",
      facultyABR: "AGD",
      facultyName: "Aarti Gautam Dinker",
      load: "3.0",
    },
    {
      code: "CD382",
      name: "Web Development using PHP Lab",
      credits: "3",
      facultyABR: "SG",
      facultyName: "Snehlata Gautam",
      load: "3.0",
    },
    {
      code: "CD312",
      name: "Big Data Platforms",
      credits: "3",
      facultyABR: "GK",
      facultyName: "Gautam Kaumar",
      load: "3.0",
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-[#f3edf1] text-[#7b3b5a] border-[#e5d5df]";
      case "green":
        return "bg-green-100 text-green-800 border-green-300";
      case "red":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
              Class Timetable
            </h1>
            <p className="text-xs md:text-sm text-gray-600 mt-1">
              B.Tech CSE Data Science (CSE-DS-III) • Semester 7
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 text-sm text-[#7b3b5a] border border-[#e5d5df] rounded-lg hover:bg-[#faf7f9] transition-colors w-full sm:w-auto cursor-pointer"
          >
            PRINT
          </button>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="bg-white rounded-lg shadow-sm p-3 md:p-6 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#7b3b5a]/30 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-[#7b3b5a]/50">
        <div className="min-w-200">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="p-2 text-left font-semibold text-gray-700 bg-gray-50 border border-gray-300 sticky left-0 z-10 text-xs md:text-sm">
                  Day
                </th>
                {timeSlots.map((slot) => (
                  <th
                    key={slot.id}
                    className="p-2 text-center font-medium text-gray-700 bg-gray-50 border border-gray-300 min-w-25"
                  >
                    <div className="text-xs font-semibold">{slot.id}</div>
                    <div className="text-xs text-gray-600">{slot.time}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day) => (
                <tr key={day} className="border-b border-gray-300">
                  <td className="p-2 font-semibold text-gray-700 bg-gray-50 border border-gray-300 sticky left-0 z-10 text-xs md:text-sm">
                    {day}
                  </td>
                  {timeSlots.map((slot) => {
                    const classes = timetable[day]?.[slot.id] || [];
                    return (
                      <td
                        key={slot.id}
                        className="p-1.5 border border-gray-300 align-top"
                      >
                        {classes.length > 0 && (
                          <div className="space-y-1">
                            {classes.map((classItem, idx) => (
                              <div
                                key={idx}
                                className={`text-xs p-1.5 rounded border ${getColorClasses(
                                  classItem.color,
                                )}`}
                              >
                                <div className="font-semibold text-xs">
                                  {classItem.code}
                                </div>
                                <div className="text-xs">{classItem.room}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subject Details */}
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
          Subject Details
        </h2>
        <div className="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#7b3b5a]/30 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-[#7b3b5a]/50">
          <table className="w-full min-w-150">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-700">
                  Code
                </th>
                <th className="text-left py-2 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-700">
                  Subject Name
                </th>
                <th className="text-left py-2 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-700">
                  Credits
                </th>
                <th className="text-left py-2 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-700 hidden sm:table-cell">
                  Faculty ABR
                </th>
                <th className="text-left py-2 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-700">
                  Faculty
                </th>
                <th className="text-left py-2 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-700 hidden lg:table-cell">
                  Load (Hrs)
                </th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject, index) => (
                <tr
                  key={subject.code}
                  className={`border-b border-gray-100 ${
                    index % 2 === 0 ? "bg-gray-50" : "bg-white"
                  }`}
                >
                  <td className="py-2 px-2 md:px-4 text-xs md:text-sm text-gray-900">
                    {subject.code}
                  </td>
                  <td className="py-2 px-2 md:px-4 text-xs md:text-sm text-gray-900">
                    {subject.name}
                  </td>
                  <td className="py-2 px-2 md:px-4 text-xs md:text-sm text-gray-900">
                    {subject.credits}
                  </td>
                  <td className="py-2 px-2 md:px-4 text-xs md:text-sm text-gray-900 hidden sm:table-cell">
                    {subject.facultyABR}
                  </td>
                  <td className="py-2 px-2 md:px-4 text-xs md:text-sm text-gray-900">
                    {subject.facultyName}
                  </td>
                  <td className="py-2 px-2 md:px-4 text-xs md:text-sm text-gray-900 hidden lg:table-cell">
                    {subject.load}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
