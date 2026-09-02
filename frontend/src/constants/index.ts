import type { Department, Program, School, StudentProps } from "../types/types";
import developer from "../assets/images/developer1.jpeg";
import yuganshImage from "./10.jpeg";
import ashishImage from "../assets/images/ashish.jpeg";

export const school: School[] = [
  // { _id: '1', code: 'sobt', name: 'School of Biotechnology' },
  // { _id: '2', code: 'soe', name: 'School of Engineering' },
  // { _id: '3', code: 'sohss', name: 'School of Humanities and Social Sciences' },
  { _id: '4', code: 'soict', name: 'School of Information and Communication Technology' },
  // { _id: '5', code: 'soljg', name: 'School of Law, Justice & Governance' },
  // { _id: '6', code: 'som', name: 'School of Management' },
  // { _id: '7', code: 'sovsas', name: 'School of Vocational Studies and Applied Sciences' }
]

export const sobt: Department[] = [
  { _id: '1', code: 'bt', name: 'Department of Biotechnology' },
];

export const soe: Department[] = [
  { _id: '1', code: 'ce', name: 'Civil Engineering' },
  { _id: '2', code: 'me', name: 'Mechanical Engineering' },
  { _id: '3', code: 'ee', name: 'Electrical Engineering' },
  { _id: '4', code: 'ar', name: 'Architecture and Regional Planning' }
]

export const sohss: Department[] = [
  { _id: '1', code: 'en', name: 'English and Modern European Languages' },
  { _id: '2', code: 'il', name: 'Indian Languages and Literature (Hindi/Urdu/Sanskrit)' },
  { _id: '3', code: 'mc', name: 'Mass Communication and Media Studies' },
  { _id: '4', code: 'ep', name: 'Economics, Planning and Development' },
  { _id: '5', code: 'et', name: 'Education and Training' },
  { _id: '6', code: 'hc', name: 'History and Civilization' },
  { _id: '7', code: 'pm', name: 'Psychology and Mental Health' },
  { _id: '8', code: 'pr', name: 'Public Administration, Governance & Policy Research' },
  { _id: '9', code: 'sw', name: 'Social Work' },
  { _id: '10', code: 'so', name: 'Sociology' },
]

export const soict: Department[] = [
  { _id: '1', code: 'cse', name: 'Computer Science and Engineering' },
  // { _id: '2', code: 'ece', name: 'Electrical Engineering' },
  // { _id: '3', code: 'it', name: 'Information Technology' }
];

export const soljg: Department[] = [
  { _id: '1', code: 'lb', name: 'Department of Law, Justice & Governance' }
]

export const som: Department[] = [
  { _id: '1', code: 'mb', name: 'Department of Business Management' }
]

export const sovsas: Department[] = [
  { _id: '1', code: 'ma', name: 'Department of Applied Mathematics' },
  { _id: '2', code: 'ch', name: 'Department of Applied Chemistry' },
  { _id: '3', code: 'ph', name: 'Department of Applied Physics' },
  { _id: '4', code: 'es', name: 'Department of Environmental Sciences' },
  { _id: '5', code: 'ft', name: 'Department of Food Processing and Technology' }
]

export const cse: Program[] = [
  { _id: '1', code: 'btech', name: 'B.Tech' },
  { _id: '2', code: 'mtech', name: 'M.Tech' },
  { _id: '3', code: 'int', name: 'B.Tech + M.Tech' },
  { _id: '4', code: 'phd', name: 'Ph.D.' }
];

export const it: Program[] = [
  { _id: '1', code: 'btech', name: 'B.Tech' },
  { _id: '2', code: 'bca', name: 'BCA' },
  { _id: '3', code: 'mca', name: 'MCA' }
];

export const ece: Program[] = [
  { _id: '1', code: 'btech', name: 'B.Tech' },
  { _id: '2', code: 'mtech', name: 'M.Tech' },
  { _id: '3', code: 'phd', name: 'Ph.D.' }
];

export const ce: Program[] = [
  { _id: '1', code: 'btech', name: 'B.Tech' },
  { _id: '2', code: 'mtech', name: 'M.Tech' },
  { _id: '3', code: 'phd', name: 'Ph.D.' }
];

export const me: Program[] = [
  { _id: '1', code: 'btech', name: 'B.Tech' },
  { _id: '2', code: 'mtech', name: 'M.Tech' },
  { _id: '3', code: 'phd', name: 'Ph.D.' }
];

export const ee: Program[] = [
  { _id: '1', code: 'btech', name: 'B.Tech' },
  { _id: '2', code: 'mtech', name: 'M.Tech' },
  { _id: '3', code: 'phd', name: 'Ph.D.' }
];

export const ar: Program[] = [
  { _id: '1', code: 'barch', name: 'B.Arch' },
  { _id: '2', code: 'march', name: 'M.Arch' },
  { _id: '3', code: 'phd', name: 'Ph.D.' }
];

export const bt: Program[] = [
  { _id: '1', code: 'btech', name: 'B.Tech (Biotechnology)' },
  { _id: '2', code: 'mtech', name: 'M.Tech (Biotechnology)' },
  { _id: '3', code: 'phd', name: 'Ph.D.' },
  { _id: '4', code: 'msc', name: 'M.Sc.' },
]

export const en: Program[] = [
  { _id: '1', code: 'ba', name: 'B.A.' },
  { _id: '2', code: 'ma', name: 'M.A.' },
  { _id: '3', code: 'phd', name: 'Ph.D.' }
];

export const ep: Program[] = [
  { _id: '1', code: 'ba', name: 'B.A.' },
  { _id: '2', code: 'ma', name: 'M.A.' },
  { _id: '3', code: 'phd', name: 'Ph.D.' }
];

export const et: Program[] = [
  { _id: '1', code: 'ba', name: 'B.A. (Education)' },
  { _id: '2', code: 'ma', name: 'M.A. (Education)' },
  { _id: '3', code: 'phd', name: 'Ph.D.' }
];

export const mc: Program[] = [
  { _id: '1', code: 'ba', name: 'B.A. (Journalism & Mass Communication)' },
  { _id: '2', code: 'ma', name: 'M.A. (Mass Communication)' },
  { _id: '3', code: 'phd', name: 'Ph.D.' }
];

export const lb: Program[] = [
  { _id: '1', code: 'ballb', name: 'B.A. LL.B.' },
  { _id: '2', code: 'llm', name: 'LL.M.' },
  { _id: '3', code: 'phd', name: 'Ph.D.' }
];

export const mb: Program[] = [
  { _id: '1', code: 'bba', name: 'BBA' },
  { _id: '2', code: 'mba', name: 'MBA' },
  { _id: '3', code: 'phd', name: 'Ph.D.' }
];

export const il: Program[] = [
  { _id: '1', code: 'ba', name: 'B.A. (Indian Languages)' },
  { _id: '2', code: 'ma', name: 'M.A. (Hindi / Urdu / Sanskrit)' },
  { _id: '3', code: 'phd', name: 'Ph.D.' }
];

export const hc: Program[] = [
  { _id: '1', code: 'ba', name: 'B.A. (History & Civilization)' },
  { _id: '2', code: 'ma', name: 'M.A. (History & Civilization)' },
  { _id: '3', code: 'phd', name: 'Ph.D.' }
];

export const pm: Program[] = [
  { _id: '1', code: 'ba', name: 'B.A. (Psychology)' },
  { _id: '2', code: 'ma', name: 'M.A. (Psychology)' },
  { _id: '3', code: 'phd', name: 'Ph.D.' }
];

export const pr: Program[] = [
  { _id: '1', code: 'ba', name: 'B.A. (Public Administration)' },
  { _id: '2', code: 'ma', name: 'M.A. (Public Policy / Governance)' },
  { _id: '3', code: 'phd', name: 'Ph.D.' }
];

export const sw: Program[] = [
  { _id: '1', code: 'bsw', name: 'Bachelor of Social Work (BSW)' },
  { _id: '2', code: 'msw', name: 'Master of Social Work (MSW)' },
  { _id: '3', code: 'phd', name: 'Ph.D.' }
];

export const so: Program[] = [
  { _id: '1', code: 'ba', name: 'B.A. (Sociology)' },
  { _id: '2', code: 'ma', name: 'M.A. (Sociology)' },
  { _id: '3', code: 'phd', name: 'Ph.D.' }
];

export const ma: Program[] = [
  { _id: '1', code: 'bsc', name: 'B.Sc. (Applied Mathematics)' },
  { _id: '2', code: 'msc', name: 'M.Sc. (Applied Mathematics)' },
  { _id: '3', code: 'phd', name: 'Ph.D.' }
];

export const ch: Program[] = [
  { _id: '1', code: 'bsc', name: 'B.Sc. (Applied Chemistry)' },
  { _id: '2', code: 'msc', name: 'M.Sc. (Applied Chemistry)' },
  { _id: '3', code: 'phd', name: 'Ph.D.' }
];

export const ph: Program[] = [
  { _id: '1', code: 'bsc', name: 'B.Sc. (Applied Physics)' },
  { _id: '2', code: 'msc', name: 'M.Sc. (Applied Physics)' },
  { _id: '3', code: 'phd', name: 'Ph.D.' }
];

export const es: Program[] = [
  { _id: '1', code: 'bsc', name: 'B.Sc. (Environmental Science)' },
  { _id: '2', code: 'msc', name: 'M.Sc. (Environmental Science)' },
  { _id: '3', code: 'phd', name: 'Ph.D.' }
];

export const ft: Program[] = [
  { _id: '1', code: 'btech', name: 'B.Tech (Food Processing & Technology)' },
  { _id: '2', code: 'mtech', name: 'M.Tech (Food Processing & Technology)' },
  { _id: '3', code: 'phd', name: 'Ph.D.' }
];

export const initialStudentForm: StudentProps = {
  rollNo: '',
  enrollmentNo: '',
  fullName: '',
  school: '',
  department: '',
  program: '',
  batch: '',
  specialization: '',
  fatherName: '',
  motherName: '',
  gender: '',
  dob: '',
  category: '',
  nationalId: '',
  mobile: '',
  email: '',
  address: '',
  hosteller: '',
  enrollmentStatus: '',
  admissionType: '',
  twelfthCompartment: '',
  admissionYear: '',
  semesters: [],
  yearCGPA: [],
  internshipStatus: '',
  placementStatus: '',
  photo: '',
  status: 'active',
};

export const teamMembers = [
  {
    name: "Nishant Chauhan",
    role: "Software Engineer",
    image: `${developer}`,
    bgColor: "bg-teal-400",
    portfolio: "https://linktr.ee/nishant.chauhan",
    linkedIn: "https://www.linkedin.com/in/nishantxchauhan",
    github: "https://github.com/githubxnishant",
    x: "https://x.com/chauhanishant_",
    mail: "mailto:mailxnishant@gmail.com"
  },
  {
    name: "Ashish Kumar",
    role: "Full Stack Developer",
    image: ashishImage,
    bgColor: "bg-orange-300",
    portfolio: "https://acrox.space",
    linkedIn: "https://www.linkedin.com/in/ashish-kumar777/",
    github: "",
    x: "",
    mail: "mailto:ashishkhola56@gmail.com"
  },
  {
    name: "Yugansh Goyal",
    role: "Full Stack Developer",
    image: yuganshImage,
    bgColor: "bg-orange-300",
    portfolio: "https://yugahsh-portfolio.netlify.app/",
    linkedIn: "https://www.linkedin.com/in/ yugansh-goyal2007",
    github: "https://github.com/YuganshGoyal2007",
    x: "https://www.instagram.com/yugansh_goyalvines/",
    mail: "mailto:yuganshgoyal2007@gmail.com"
  }
];