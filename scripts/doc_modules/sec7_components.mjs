export function getSection7() {
  return `
---

# SECTION 7: Frontend Component Library & UI Systems

This section catalogs the core reusable and domain-specific UI components that power the GBU-SDSM presentation tier. Each entry documents component props, state hooks, DOM structure, event lifecycles, and styling conventions.

---

## 7.1 Student Domain Components

### 7.1.1 \`StudentForm.tsx\` (\`src/components/StudentForm.tsx\`)
- **Primary Function**: Comprehensive multi-tab form used by Administrators and Coordinators for creating new student profiles and editing existing student records.
- **Props Interface**:
  \`\`\`typescript
  interface StudentFormProps {
    initialData?: Partial<Student> | null;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (studentData: Partial<Student>) => Promise<void>;
    isEditMode: boolean;
    userRole?: 'admin' | 'coordinator' | 'chairperson';
  }
  \`\`\`
- **Tab Structure**:
  1. **Personal Information**: Name, Enrollment Number, Roll Number, Date of Birth, Gender, Blood Group, Category (GEN/OBC/SC/ST/EWS), Religion, Nationality, Aadhaar Number.
  2. **Contact & Family**: Student Mobile, Personal Email, University Email, Father's Name, Father's Contact, Mother's Name, Mother's Contact, Guardian Details, Permanent Address, Current/Correspondence Address, City, State, Pincode.
  3. **Academic Information**: Program (B.Tech, M.Tech, MCA, MBA), Branch, Academic Year, Semester, Section, Admission Year, High School (10th) Board & Percentage, Intermediate (12th) Board & Percentage, Current CGPA, Backlogs Count.
  4. **Internship & Placement Information**:
     - *Internship Details*: Has Internship toggle, Company Name, Date of Joining (DOJ), Date of Exit / Completion (DOE), Paid or Unpaid radio selection, Monthly Stipend Amount (if paid), Internship Role/Designation.
     - *Placement Details*: Placement Status toggle (\`Placed\` vs \`Unplaced\`), Hiring Company Name, CTC / Annual Salary Package (e.g., \`"12.5 LPA"\`), Date of Joining (DOJ), Placement Role / Job Title, Job Location, Is Paid Training radio toggle.
- **Validation Engine**:
  - Validates enrollment number format against university patterns (\`^[0-9]{10}$\`).
  - Asserts email format validity.
  - Validates chronological sanity: Date of Joining must precede Date of Exit.
  - Sanitizes numeric inputs for CGPA ($0.00 \\le \\text{CGPA} \\le 10.00$) and percentages ($0 \\le \\text{pct} \\le 100$).
- **Event Lifecycle**:
  - \`handleChange(field, value)\`: Updates internal form state and clears field-specific validation error.
  - \`handleTabSwitch(tabIndex)\`: Switches active form tab without data loss.
  - \`handleSubmit(e)\`: Prevents default browser submission, runs schema validation, and triggers \`onSubmit(formData)\` async handler.

### 7.1.2 \`StudentDetailComponent.tsx\` & \`CategoryView.tsx\`
- **Primary Function**: High-fidelity, read-only dossier modal rendering all demographic, academic, contact, and career attributes of a student.
- **Props Interface**:
  \`\`\`typescript
  interface StudentDetailComponentProps {
    student: Student;
    isOpen: boolean;
    onClose: () => void;
    onEdit?: (student: Student) => void;
    canEdit?: boolean;
  }
  \`\`\`
- **CategoryView Segmentation**:
  - \`CategoryView\` splits the student record into structured visual cards with clean tabular layout:
    - **Header Block**: Avatar photo, Full Name, Enrollment Number, Program & Section badge, Status indicator.
    - **Demographic Card**: DOB, Gender, Category, Blood Group, Aadhaar.
    - **Academic History Card**: 10th %, 12th %, Current Semester, CGPA badge.
    - **Career & Placement Card**: Displays the full internship and placement breakdown:
      - Internship Status, Company, Duration (DOJ to DOE), Stipend & Paid/Unpaid badge.
      - Placement Status, Hiring Company, Annual Package, Joining Date.
- **Action Buttons**:
  - "Edit Profile": Emits \`onEdit(student)\` allowing coordinators/admins to transition straight into edit mode.
  - "Print / Export PDF": Generates clean print view with university letterhead.
  - "Close": Dismisses the modal.

### 7.1.3 \`BulkEditModal.tsx\`
- **Primary Function**: Batch modification modal accessible to Administrators, Chairpersons, and Academic Coordinators. Enables applying identical changes across multiple selected student records simultaneously.
- **Props Interface**:
  \`\`\`typescript
  interface BulkEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedStudentIds: number[];
    onConfirm: (updates: Partial<Student>) => Promise<void>;
    scope?: 'class' | 'department' | 'universal';
  }
  \`\`\`
- **Batch Modifiable Fields**:
  - Academic Semester & Academic Year.
  - Section Reassignment (e.g. migrating Section A to Section B).
  - Academic Status (\`Active\`, \`Graduated\`, \`Suspended\`, \`Withdrawn\`).
  - Fee Status (\`Paid\`, \`Pending\`, \`Partial\`).
  - Placement Status (\`Placed\`, \`Unplaced\`) and Company Name.
  - Batch Internship updates (Company, Paid/Unpaid, DOJ, DOE).
- **Execution Safeguards**:
  - Displays explicit confirmation tally: *"You are about to modify 38 selected student records"*.
  - Requires checking a confirmation toggle before the "Apply Bulk Changes" button enables.

---

## 7.2 Attendance Domain Components

### 7.2.1 \`AttendanceSession.tsx\`
- **Primary Function**: Real-time attendance marking terminal for instructors and batch coordinators.
- **Props Interface**:
  \`\`\`typescript
  interface AttendanceSessionProps {
    classDetails: {
      program: string;
      branch: string;
      semester: number;
      section: string;
      subject: string;
      subjectCode: string;
    };
    roster: StudentRosterItem[];
    onSubmitSession: (sessionData: AttendanceSessionPayload) => Promise<void>;
    isSubmitting: boolean;
  }
  \`\`\`
- **Roster Interactive Table**:
  - Lists students ordered by Roll Number / Enrollment Number.
  - Interactive Status Selector for each student: \`Present\` (Green button), \`Absent\` (Red button), \`Late\` (Yellow button), \`Excused\` (Blue button).
  - Inline remark input field for noting reasons (e.g. "Hospitalized", "Sports meet").
- **Batch Control Toolbar**:
  - "Mark All Present": One-click action setting every student status to Present.
  - "Mark All Absent": Rapid reset.
  - Summary Header: Dynamically calculates live counts: Total Students, Present Count, Absent Count, Attendance Percentage for the current session.

### 7.2.2 \`AttendanceReport.tsx\`
- **Primary Function**: Visual attendance summary rendering tabular and graphical statistics for a class or department.
- **Features**:
  - Filter bar for Subject, Date Range, and Defaulter threshold ($< 75\\%$).
  - Student attendance ledger showing total lectures conducted vs attended.
  - Color-coded percentage indicators: Green ($\ge 75\%$), Yellow ($65\% - 74\%$), Red ($< 65\%$).
  - One-click export to CSV and Excel via SheetJS.

---

## 7.3 Communication & Messaging Components

### 7.3.1 \`MessagesCenter.tsx\`
- **Primary Function**: Integrated communication console supporting direct messaging, class broadcast announcements, and institutional notifications.
- **Sub-Components**:
  - \`MessageList\`: Paginated inbox list displaying sender avatar, subject, preview snippet, timestamp, and read/unread status.
  - \`MessageReader\`: Full view of selected message with recipient tags, priority badge, and reply button.
  - \`MessageComposerModal\`: New message modal supporting recipient type selection:
    - *Individual*: Autocomplete search by name, enrollment number, or email.
    - *Class*: Dropdown selectors for Program, Branch, Semester, Section.
    - *Universal Broadcast*: Restricted to Administrators.
  - Priority selector (\`Normal\`, \`Important\`, \`Urgent\`).

---

## 7.4 Navigation & Layout Components

### 7.4.1 \`Navbar.tsx\`
- **Primary Function**: Global top navigation header.
- **Features**:
  - Gautam Buddha University emblem and SDSM brand typography.
  - User identity badge: User name, role badge (\`Admin\`, \`Coordinator\`, \`Faculty\`, \`Chairperson\`, \`Student\`).
  - Unread notification bell with counter badge.
  - User profile dropdown with "My Profile", "Settings", and "Logout" actions.

### 7.4.2 \`Sidebar.tsx\`
- **Primary Function**: Role-sensitive side navigation panel.
- **Dynamic Navigation Configuration**:
  - Automatically evaluates active user role and renders corresponding navigation links.
  - Active route highlighting using React Router's \`NavLink\`.
  - Collapsible drawer on mobile/tablet viewports with backdrop overlay.

---

## 7.5 Shared UI Utility Components

### 7.5.1 \`DataTable.tsx\`
- Generic reusable data table supporting client-side and server-side pagination, multi-column sorting, selection checkboxes, and empty state fallbacks.

### 7.5.2 \`Modal.tsx\` & \`Drawer.tsx\`
- Accessible overlay dialogs rendered via React Portals directly into \`document.body\`. Includes keyboard escape listener, backdrop click dismiss, and focus trapping.

### 7.5.3 \`StatCard.tsx\`
- Metric visualization card displaying title, numerical value, trend indicator (+5% vs last month), and thematic icon with colored background ring.
`;
}
