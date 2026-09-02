export const PROGRAM_CONFIG = {
  "B.Tech": { years: 4, semesters: 8 },
  "M.Tech": { years: 2, semesters: 4 },
  "B.Tech + M.Tech": { years: 5, semesters: 10 },
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
