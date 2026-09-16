export const PROGRAM_CONFIG = {
  "B.Tech": { years: 4, semesters: 8 },
  "M.Tech": { years: 2, semesters: 4 },
  "B.Tech + M.Tech": { years: 5, semesters: 10 },
  "Integrated B.Tech-M.Tech": { years: 5, semesters: 10 },
  "Integrated B.Tech - M.Tech": { years: 5, semesters: 10 },
  "BCA": { years: 3, semesters: 6 },
  "MCA": { years: 2, semesters: 4 },
  "B.Sc": { years: 3, semesters: 6 },
  "M.Sc": { years: 2, semesters: 4 },
  "MBA": { years: 2, semesters: 4 },
  "BBA": { years: 3, semesters: 6 },
  "Diploma": { years: 3, semesters: 6 },
  "Ph.D": { years: 3, semesters: 6 },
};

export const buildSemesters = (count) =>
  Array.from({ length: count }, (_, i) => ({
    semester: i + 1,
    registered: "Pending",
  }));

export const buildYearCGPA = (years) =>
  Array.from({ length: years }, (_, i) => ({
    year: i + 1,
    cgpa: null,
  }));

export const COLUMN_ORDER = [
  "rollNo",
  "enrollmentNo",
  "fullName",
  "fatherName",
  "motherName",
  "gender",
  "dob",
  "category",
  "nationalId",
  "mobile",
  "email",
  "address",
  "hosteller",
  "admissionType",
  "admissionYear",
  "enrollmentStatus",
  "twelfthCompartment",
  "internshipStatus",
  "placementStatus",
];
