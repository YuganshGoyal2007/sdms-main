import XLSX from 'xlsx';

const STANDARD_COLUMNS = [
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

const normalizeHeader = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const headerAliases = {
  rollNo: ["rollno", "rollnumber", "roll", "rollnum", "rollnumber", "rn", "registrationnumber", "registrationno", "regno", "regnumber", "rollid", "rollidnumber", "srno", "srnumber", "sno"],
  enrollmentNo: ["enrollmentno", "enrollmentnumber", "enroll", "enrollment", "enrollno", "enrollnumber", "registrationnumber", "registrationno", "regno", "regnumber", "admissionnumber", "admissionno", "studentid", "studentidnumber", "studentidno", "id", "idnumber", "idno", "admissionid", "studentregistration", "studentregistrationnumber", "registrationid"],
  fullName: ["fullname", "name", "studentname", "nameofstudent", "candidate", "fullnamet", "student", "studentfullname", "nameofthestudent", "stdname"],
  fatherName: ["fathername", "father", "fathersname", "fathersname"],
  motherName: ["mothername", "mother", "mothersname", "mothersname"],
  gender: ["gender", "sex"],
  dob: ["dob", "dateofbirth", "birthdate", "birthday"],
  category: ["category", "caste"],
  nationalId: ["nationalid", "aadhar", "aadharnumber", "aadhaar", "idnumber", "idno"],
  mobile: ["mobile", "phone", "phoneno", "mobilephone", "contactnumber", "contactno", "contact"],
  email: ["email", "emailaddress", "emailid", "mail", "e-mail"],
  address: ["address", "residence", "permanentaddress"],
  hosteller: ["hosteller", "hostel", "hostelstatus", "hosteltype"],
  admissionType: ["admissiontype", "admission", "admissioncategory", "admissionstatus"],
  admissionYear: ["admissionyear", "yearofadmission", "admissionyr"],
  enrollmentStatus: ["enrollmentstatus", "status", "studentstatus"],
  twelfthCompartment: ["twelfthcompartment", "twelvethcompartment", "12thcompartment", "compartment"],
  internshipStatus: ["internshipstatus", "internship"],
  placementStatus: ["placementstatus", "placement"],
};

const matchHeaderField = (normalizedHeader) => {
  if (!normalizedHeader) return null;

  for (const field of STANDARD_COLUMNS) {
    const normalizedField = normalizeHeader(field);
    const aliases = headerAliases[field] || [];

    if (normalizedHeader === normalizedField || aliases.includes(normalizedHeader)) {
      return field;
    }
  }

  if (normalizedHeader.includes("father")) return "fatherName";
  if (normalizedHeader.includes("mother")) return "motherName";

  if (normalizedHeader.includes("roll") && (normalizedHeader.includes("no") || normalizedHeader.includes("num") || normalizedHeader.includes("number") || normalizedHeader.includes("rn") || normalizedHeader.includes("id"))) {
    if (normalizedHeader.includes("enroll")) return null;
    return "rollNo";
  }

  if (
    normalizedHeader.includes("enrol") ||
    normalizedHeader.includes("enroll") ||
    normalizedHeader === "registrationno" ||
    normalizedHeader === "registrationnumber" ||
    normalizedHeader === "registrationid" ||
    normalizedHeader === "admissionno" ||
    normalizedHeader === "admissionnumber" ||
    normalizedHeader === "studentid" ||
    normalizedHeader === "studentidnumber" ||
    (normalizedHeader.includes("id") && normalizedHeader.includes("student")) ||
    (normalizedHeader.includes("id") && (normalizedHeader.includes("no") || normalizedHeader.includes("num") || normalizedHeader.includes("number")))
  ) {
    if (normalizedHeader.includes("status") || normalizedHeader.includes("type") || normalizedHeader.includes("year")) {
      // Skip
    } else {
      return "enrollmentNo";
    }
  }

  if (
    normalizedHeader === "id" ||
    normalizedHeader === "studentid" ||
    (normalizedHeader.includes("student") && normalizedHeader.includes("id"))
  ) {
    return "enrollmentNo";
  }
  if (normalizedHeader.includes("name") && !normalizedHeader.includes("father") && !normalizedHeader.includes("mother")) {
    return "fullName";
  }
  if (normalizedHeader.includes("phone") || normalizedHeader.includes("contact") || normalizedHeader.includes("mobile")) return "mobile";
  if (normalizedHeader.includes("mail")) return "email";
  if (normalizedHeader.includes("dob") || normalizedHeader.includes("birth")) return "dob";
  if (normalizedHeader.includes("hostel")) return "hosteller";
  if (normalizedHeader.includes("aadhar") || normalizedHeader.includes("aadhaar") || normalizedHeader.includes("national")) return "nationalId";

  if (normalizedHeader.includes("admission") && normalizedHeader.includes("type")) return "admissionType";
  if (normalizedHeader.includes("admission") && normalizedHeader.includes("year")) return "admissionYear";

  // Dynamic Regex for Semester Registration (e.g. "1 Sem Registration" -> "1semregistration")
  const semRegMatch = normalizedHeader.match(/^(\d+|i|ii|iii|iv|v|vi|vii|viii)(st|nd|rd|th)?sem(?:ester)?reg(?:istration)?/);
  if (semRegMatch) {
    let num = parseInt(semRegMatch[1]);
    if (isNaN(num)) {
      const romanMap = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ist: 1, iind: 2, iiird: 3, ivth: 4 };
      num = romanMap[semRegMatch[1].replace(/(st|nd|rd|th)$/, "")] || romanMap[semRegMatch[1]];
    }
    return `semRegistration_${num}`;
  }

  // Dynamic Regex for Year CGPA (e.g. "1st Year CGPA" -> "1styearcgpa", "Ist Year CGPA" -> "istyearcgpa")
  const yearCGPAMatch = normalizedHeader.match(/^(\d+|ist|iind|iiird|ivth|i|ii|iii|iv|v)(st|nd|rd|th)?yearcgpa/);
  if (yearCGPAMatch) {
    let num = parseInt(yearCGPAMatch[1]);
    if (isNaN(num)) {
      const romanMap = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, ist: 1, iind: 2, iiird: 3, ivth: 4 };
      num = romanMap[yearCGPAMatch[1]];
    }
    return `yearCGPA_${num}`;
  }
  
  // Dynamic Regex for Semester SGPA/CGPA (e.g. "1 Sem SGPA" -> "1semsgpa")
  const semSGPAMatch = normalizedHeader.match(/^(\d+|i|ii|iii|iv|v|vi|vii|viii)(st|nd|rd|th)?sem(?:ester)?s?gpa/);
  if (semSGPAMatch) {
    let num = parseInt(semSGPAMatch[1]);
    if (isNaN(num)) {
      const romanMap = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ist: 1, iind: 2, iiird: 3, ivth: 4 };
      num = romanMap[semSGPAMatch[1].replace(/(st|nd|rd|th)$/, "")] || romanMap[semSGPAMatch[1]];
    }
    return `semSGPA_${num}`;
  }

  return null;
};

const findHeaderRowInSheet = (sheet) => {
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });
  if (data.length < 2) return null;

  let bestCandidate = null;
  let bestScore = -1;

  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex];
    if (!Array.isArray(row)) continue;

    const currentMapping = {};
    const dynamicColumns = new Set();
    let requiredFound = 0;
    let recognizedCount = 0;

    row.forEach((cell, index) => {
      const normalizedHeader = normalizeHeader(cell);
      const field = matchHeaderField(normalizedHeader);
      if (!field) return;

      currentMapping[index] = field;
      recognizedCount += 1;
      
      if (["rollNo", "enrollmentNo", "fullName"].includes(field)) {
        requiredFound += 1;
      } else if (!STANDARD_COLUMNS.includes(field)) {
        dynamicColumns.add(field);
      }
    });

    if (requiredFound === 3) {
      return { data, headerRowIndex: rowIndex, headerMapping: currentMapping, dynamicColumns: Array.from(dynamicColumns) };
    }

    const score = requiredFound * 10 + recognizedCount;
    if (recognizedCount >= 3 && requiredFound >= 2 && score > bestScore) {
      bestScore = score;
      bestCandidate = { data, headerRowIndex: rowIndex, headerMapping: currentMapping, dynamicColumns: Array.from(dynamicColumns) };
    }
  }

  return bestCandidate;
};

export const reformatExcel = (buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  let sheetResult = null;
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    sheetResult = findHeaderRowInSheet(sheet);
    if (sheetResult) break;
  }

  if (!sheetResult) {
    throw new Error('Unable to detect header row. Make sure the file contains Roll No, Enrollment No and Full Name columns.');
  }

  const { data, headerRowIndex, headerMapping, dynamicColumns } = sheetResult;
  const rows = data.slice(headerRowIndex + 1).filter(row => Array.isArray(row) && row.some(cell => cell !== "" && cell !== null));
  const finalColumns = [...STANDARD_COLUMNS, ...dynamicColumns];

  // Fields that must be stored as strings to prevent scientific notation corruption
  const FORCE_STRING_FIELDS = ["nationalId", "mobile", "enrollmentNo", "rollNo"];

  const forceString = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === "number") {
      return value.toLocaleString('fullwide', { useGrouping: false });
    }
    let str = String(value).trim();
    // If it's already in scientific notation string form, convert back to full number
    if (str.match(/^[0-9.]+E\+\d+$/i)) {
      return Number(str).toLocaleString('fullwide', { useGrouping: false });
    }
    return str;
  };

  const transformedRows = rows.map(row => {
    const newRow = {};
    finalColumns.forEach(col => {
      newRow[col] = null;
    });

    Object.entries(headerMapping).forEach(([indexString, field]) => {
      const columnIndex = Number(indexString);
      let value = row[columnIndex] !== undefined ? row[columnIndex] : null;
      
      // Force ID-like fields to strings to prevent scientific notation
      if (FORCE_STRING_FIELDS.includes(field)) {
        value = forceString(value);
      }
      
      newRow[field] = value;
    });

    return newRow;
  });

  // Create new workbook
  const newWorkbook = XLSX.utils.book_new();
  const newSheet = XLSX.utils.json_to_sheet(transformedRows, { header: finalColumns });
  
  // Force all nationalId, mobile, enrollmentNo cells to text type
  const range = XLSX.utils.decode_range(newSheet['!ref']);
  const headerRow = [];
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: C });
    headerRow.push(newSheet[cellRef] ? newSheet[cellRef].v : null);
  }
  for (let R = range.s.r + 1; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const colName = headerRow[C];
      if (FORCE_STRING_FIELDS.includes(colName)) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        if (newSheet[cellRef] && newSheet[cellRef].v !== null && newSheet[cellRef].v !== undefined) {
          newSheet[cellRef].t = 's';
          newSheet[cellRef].v = forceString(newSheet[cellRef].v);
          delete newSheet[cellRef].w;
        }
      }
    }
  }
  
  XLSX.utils.book_append_sheet(newWorkbook, newSheet, 'Reformatted');

  // Return buffer
  return XLSX.write(newWorkbook, { type: 'buffer', bookType: 'xlsx' });
};