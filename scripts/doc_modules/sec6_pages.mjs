export function getSection6() {
  return `
---

# SECTION 6: Frontend Pages Deep-Dive Catalog (All 28 Pages)

This section provides an exhaustive technical breakdown of every page component in the GBU-SDSM frontend codebase. Each page entry details its file location, role restrictions, internal state variables, React hooks, API calls, event handlers, and UI architecture.

---

## 6.1 Administrative Portal Pages (\`src/pages/admin/\`)

### 6.1.1 \`AdminDashboard.tsx\` (\`src/pages/admin/AdminDashboard.tsx\`)
- **Access Control**: Role: \`admin\`.
- **Primary Purpose**: Executive operational dashboard providing real-time institutional metrics, enrollment distributions, attendance health, and rapid administrative navigation.
- **Key State Variables**:
  - \`stats\`: Aggregated institutional counters (total students, total coordinators, total faculty, average attendance percentage, placed student count).
  - \`enrollmentByProgram\`: Array of objects mapping academic programs to student counts for graphical charting.
  - \`recentAuditLogs\`: Recent administrative actions and system events.
  - \`isLoading\`: Boolean loading flag.
  - \`error\`: Error message string if data fetching fails.
- **Hooks & Lifecycle**:
  - \`useEffect\`: Dispatches API calls to \`/api/admin/statistics\` and \`/api/admin/audit-logs\` on initial mount.
  - \`useMemo\`: Computes program percentage distributions and placement ratios.
- **DOM Structure & Visual Elements**:
  - Top header with university branding, system status indicator, and quick-action buttons ("Add Student", "Bulk Upload", "Export Database").
  - Stat grid rendering 5 high-impact metric cards with Lucide icons (\`Users\`, \`GraduationCap\`, \`CalendarCheck\`, \`Briefcase\`, \`ShieldCheck\`).
  - Dual analytical panels: Program-wise enrollment bar chart and gender/category distribution breakdown.
  - Audit activity stream displaying timestamped event logs with user identity tags.

### 6.1.2 \`StudentList.tsx\` (\`src/pages/admin/StudentList.tsx\`)
- **Access Control**: Role: \`admin\`.
- **Primary Purpose**: Centralized student directory management interface with multi-dimensional filtering, pagination, detailed single-student modal, and bulk editing capabilities.
- **Key State Variables**:
  - \`students\`: Array of \`Student\` records for the active page.
  - \`filters\`: Object containing \`program\`, \`branch\`, \`year\`, \`section\`, \`category\`, \`gender\`, \`placed\`, and \`search\`.
  - \`selectedStudentIds\`: Set/Array of student ID numbers selected via checkboxes for bulk operations.
  - \`isBulkEditOpen\`: Boolean controlling visibility of the Bulk Edit modal dialog.
  - \`bulkEditFields\`: Object holding target attribute updates for selected students.
  - \`viewingStudent\`: Student record currently opened in the detailed view drawer or modal.
  - \`editingStudent\`: Student record currently opened in the edit form.
  - \`pagination\`: Object holding \`currentPage\`, \`pageSize\`, \`totalRecords\`, and \`totalPages\`.
- **Hooks & Lifecycle**:
  - \`useEffect\`: Debounced fetch triggered whenever \`filters\` or \`pagination.currentPage\` changes.
  - \`useCallback\`: Memoized handlers for \`handleSelectAll\`, \`handleToggleStudent\`, and \`handleExportData\`.
- **User Interactions & Handlers**:
  - \`handleSearchInput(e)\`: Updates search filter with 300ms debounce.
  - \`handleFilterChange(field, value)\`: Updates respective filter and resets \`currentPage\` to 1.
  - \`handleBulkEditSubmit()\`: Calls \`POST /api/admin/students/bulk-edit\` with selected IDs and fields.
  - \`handleExport(format)\`: Generates downloadable Excel or CSV via SheetJS.

### 6.1.3 \`BulkUploadPage.tsx\` (\`src/pages/admin/BulkUploadPage.tsx\`)
- **Access Control**: Role: \`admin\`.
- **Primary Purpose**: Ingestion portal for multi-row student enrollment spreadsheets (\`.xlsx\`, \`.xls\`, \`.csv\`).
- **Key State Variables**:
  - \`file\`: Selected binary File object.
  - \`dragActive\`: Boolean state for drag-and-drop file styling.
  - \`previewData\`: First 10 rows parsed from the spreadsheet for visual confirmation.
  - \`columnMappings\`: Map of detected spreadsheet headers to SDSM student schema attributes.
  - \`uploadStatus\`: \`'idle' | 'parsing' | 'uploading' | 'success' | 'error'\`.
  - \`validationErrors\`: Array of row-by-row validation failure descriptions.
  - \`uploadResult\`: Summary object ({ totalRows, insertedCount, updatedCount, skippedCount }).
- **User Interactions**:
  - Drag-and-drop dropzone with file type validation.
  - Interactive header mapping selectors allowing manual correction of unmatched columns.
  - Process execution trigger with real-time progress bar.

### 6.1.4 \`CoordinatorManagement.tsx\` (\`src/pages/admin/CoordinatorManagement.tsx\`)
- **Access Control**: Role: \`admin\`.
- **Primary Purpose**: Administrative control interface for academic coordinators. Allows registering new coordinators, assigning specific program/branch/section batches, modifying assignments, and resetting coordinator access credentials.
- **Key State Variables**:
  - \`coordinators\`: List of all registered coordinator profiles.
  - \`isCreateModalOpen\`: Boolean modal toggle for new coordinator creation.
  - \`formData\`: Form state holding name, email, department, assigned program, branch, and section.
  - \`searchTerm\`: String filter for coordinator name or email.

### 6.1.5 \`ChairpersonManagement.tsx\` (\`src/pages/admin/ChairpersonManagement.tsx\`)
- **Access Control**: Role: \`admin\`.
- **Primary Purpose**: Creation and management of departmental Chairpersons and assignment of executive jurisdiction over academic departments and programs.
- **Key State Variables**:
  - \`chairpersons\`: List of chairpersons with their associated departments and programs.
  - \`selectedPrograms\`: Multi-select array of programs assigned to a chairperson.
  - \`isAssignModalOpen\`: Modal toggle for modifying departmental assignments.

### 6.1.6 \`FacultyManagement.tsx\` (\`src/pages/admin/FacultyManagement.tsx\`)
- **Access Control**: Role: \`admin\`.
- **Primary Purpose**: Faculty master directory. Displays teaching staff profiles, employee codes, designations, departments, contact details, and teaching assignment summaries.
- **Key Features**:
  - Search by employee code, name, or department.
  - Modal form for creating and updating faculty records.
  - Direct link to view courses and classes assigned to each faculty member.

### 6.1.7 \`AdminAttendance.tsx\` (\`src/pages/admin/AdminAttendance.tsx\`)
- **Access Control**: Role: \`admin\`.
- **Primary Purpose**: Institutional attendance surveillance. Allows administrators to inspect attendance records across any program, branch, section, or course, override mistaken session records, and lock or unlock historical attendance dates.
- **Key Features**:
  - Dropdown selectors for Program, Branch, Semester, Section, Subject, and Date Range.
  - Attendance session table with status badges (Present, Absent, Late, Excused).
  - Administrative session override modal with mandatory audit remark input.
  - Session lock/unlock toggle switch.

### 6.1.8 \`ReportsPage.tsx\` (\`src/pages/admin/ReportsPage.tsx\`)
- **Access Control**: Role: \`admin\`.
- **Primary Purpose**: Advanced reporting engine generating downloadable tabular and graphical reports for accreditation, institutional research, and placement cell tracking.
- **Report Types**:
  - Defaulter List Report (students with attendance below 75%).
  - Placement & Internship Summary (salary packages, top hiring partners, internship status).
  - Demographic & Category Distribution Report (GEN, OBC, SC, ST, EWS).
  - Academic Performance Distribution (CGPA brackets: >9.0, 8.0-9.0, 7.0-8.0, <7.0).

### 6.1.9 \`SettingsPage.tsx\` (\`src/pages/admin/SettingsPage.tsx\`)
- **Access Control**: Role: \`admin\`.
- **Primary Purpose**: Global system configuration parameters: active academic year, semester boundaries, attendance penalty thresholds, email notification server settings, and system backup triggers.

---

## 6.2 Coordinator Portal Pages (\`src/pages/coordinator/\`)

### 6.2.1 \`CoordinatorDashboard.tsx\` (\`src/pages/coordinator/CoordinatorDashboard.tsx\`)
- **Access Control**: Role: \`coordinator\`.
- **Primary Purpose**: Home view for academic batch coordinators. Displays vital operational metrics for their assigned section.
- **Key Metrics Displayed**:
  - Assigned Class Badge (e.g. "B.Tech CSE - 3rd Year Section A").
  - Enrolled Students count.
  - Batch Average Attendance percentage with trend sparkline.
  - Defaulter Alert Card (count of students below 75% attendance).
  - Recent attendance sessions and unread communications.

### 6.2.2 \`CoordinatorStudents.tsx\` (\`src/pages/coordinator/CoordinatorStudents.tsx\`)
- **Access Control**: Role: \`coordinator\`.
- **Primary Purpose**: Section roster management. Coordinators can view complete student profiles, execute single student edits, launch the Bulk Edit modal for batch updates, and export the section roster.
- **Key Features & Recent Fixes**:
  - Seamless in-place student editing: Clicking edit opens \`StudentForm\` within a modal or drawer without triggering unintended redirects to the dashboard.
  - Bulk Edit Toolbar: Select multiple students via checkboxes and open the bulk editor to modify batch parameters (semester, section, status, placement fields).
  - Detailed Student Drawer: Displays all student details including the 8 new internship and placement fields (company, DOJ, DOE, paid/unpaid status, stipend, package).

### 6.2.3 \`CoordinatorAttendance.tsx\` (\`src/pages/coordinator/CoordinatorAttendance.tsx\`)
- **Access Control**: Role: \`coordinator\`.
- **Primary Purpose**: Class attendance hub. Allows the coordinator to mark attendance sessions for their assigned class, view historical sessions, modify session entries within permissible limits, and identify chronic absentees.

### 6.2.4 \`CoordinatorMessages.tsx\` (\`src/pages/coordinator/CoordinatorMessages.tsx\`)
- **Access Control**: Role: \`coordinator\`.
- **Primary Purpose**: Section communication terminal. Allows broadcasting announcements to all students in the assigned class or sending direct messages to individual students, faculty instructors, or the administrator.

---

## 6.3 Chairperson Portal Pages (\`src/pages/chairperson/\`)

### 6.3.1 \`ChairpersonDashboard.tsx\` (\`src/pages/chairperson/ChairpersonDashboard.tsx\`)
- **Access Control**: Role: \`chairperson\`.
- **Primary Purpose**: Departmental executive overview aggregating metrics across multiple programs and sections under the chairperson's authority.
- **Key Features**:
  - Program-by-program student count breakdown.
  - Faculty workload metrics (total teaching assignments, active courses).
  - Departmental attendance averages with comparative section benchmarks.

### 6.3.2 \`ChairpersonClasses.tsx\` (\`src/pages/chairperson/ChairpersonClasses.tsx\`)
- **Access Control**: Role: \`chairperson\`.
- **Primary Purpose**: Departmental class catalog. Displays all academic sections, assigned coordinators, enrolled student counts, and course schedules.

### 6.3.3 \`ChairpersonFaculty.tsx\` (\`src/pages/chairperson/ChairpersonFaculty.tsx\`)
- **Access Control**: Role: \`chairperson\`.
- **Primary Purpose**: Faculty workload management. Allows viewing departmental faculty and assigning them to specific courses and class sections.

### 6.3.4 \`ChairpersonStudents.tsx\` (\`src/pages/chairperson/ChairpersonStudents.tsx\`)
- **Access Control**: Role: \`chairperson\`.
- **Primary Purpose**: Multi-class student exploration across the entire department with filtering by program, branch, year, section, and placement status.

### 6.3.5 \`ChairpersonAttendance.tsx\` (\`src/pages/chairperson/ChairpersonAttendance.tsx\`)
- **Access Control**: Role: \`chairperson\`.
- **Primary Purpose**: Departmental attendance audit interface with section comparison reports and defaulter export tools.

---

## 6.4 Faculty Portal Pages (\`src/pages/faculty/\`)

### 6.4.1 \`FacultyDashboard.tsx\` (\`src/pages/faculty/FacultyDashboard.tsx\`)
- **Access Control**: Role: \`faculty\`.
- **Primary Purpose**: Faculty workspace providing immediate access to assigned classes, today's lecture schedule, and pending attendance marking tasks.
- **Key Metrics**:
  - Assigned Classes count.
  - Total Enrolled Students across all assigned courses.
  - Sessions Conducted this month.
  - Quick action to open attendance marking for today's active session.

### 6.4.2 \`FacultyClasses.tsx\` (\`src/pages/faculty/FacultyClasses.tsx\`)
- **Access Control**: Role: \`faculty\`.
- **Primary Purpose**: Class directory listing all courses and sections mapped to the faculty member via \`FacultyAssignment\`. Clicking a class displays its enrolled student roster.

### 6.4.3 \`FacultyAttendance.tsx\` (\`src/pages/faculty/FacultyAttendance.tsx\`)
- **Access Control**: Role: \`faculty\`.
- **Primary Purpose**: Core attendance marking terminal.
- **User Flow**:
  1. Faculty selects assigned class and course from dropdown.
  2. Selects date and session type (Lecture, Lab, Tutorial).
  3. Class roster loads with all students defaulted to "Present".
  4. Faculty toggles absent students via one-click toggles or bulk action ("Mark All Present", "Mark All Absent").
  5. Clicks "Submit Attendance" to persist session atomically via \`POST /api/attendance/sessions\`.

### 6.4.4 \`FacultyProfile.tsx\` (\`src/pages/faculty/FacultyProfile.tsx\`)
- **Access Control**: Role: \`faculty\`.
- **Primary Purpose**: Personal faculty profile view and editor (name, designation, department, contact information, research interests).

### 6.4.5 \`FacultyMessages.tsx\` (\`src/pages/faculty/FacultyMessages.tsx\`)
- **Access Control**: Role: \`faculty\`.
- **Primary Purpose**: Faculty communication center for messaging enrolled students, coordinators, or administration.

---

## 6.5 Student / Client Portal Pages (\`src/pages/client/\`)

### 6.5.1 \`ClientDashboard.tsx\` (\`src/pages/client/ClientDashboard.tsx\`)
- **Access Control**: Role: \`student\` (client).
- **Primary Purpose**: Student home portal presenting personal academic status, aggregate attendance meter, upcoming timetable classes, and recent notifications.
- **Key Elements**:
  - Radial Attendance Gauge with color coding (Green: $\\ge 75\\%$, Amber: $65-74\\%$, Red: $< 65\\%$).
  - Quick summary cards for Enrolled Semester, Program, Section, and Current CGPA.
  - Recent announcements list.

### 6.5.2 \`ClientProfile.tsx\` (\`src/pages/client/ClientProfile.tsx\`)
- **Access Control**: Role: \`student\`.
- **Primary Purpose**: Comprehensive student dossier displaying demographic, academic, contact, and placement/internship records. Includes self-service update requests for permissible fields.

### 6.5.3 \`ClientAttendance.tsx\` (\`src/pages/client/ClientAttendance.tsx\`)
- **Access Control**: Role: \`student\`.
- **Primary Purpose**: Transparent attendance ledger. Displays subject-by-subject attendance percentages, total lectures conducted vs attended, and a calendar view of individual session presence.

### 6.5.4 \`ClientTimetable.tsx\` (\`src/pages/client/ClientTimetable.tsx\`)
- **Access Control**: Role: \`student\`.
- **Primary Purpose**: Interactive weekly schedule grid showing lecture times, subject names, course codes, instructors, and classroom numbers.

### 6.5.5 \`ClientMessages.tsx\` (\`src/pages/client/ClientMessages.tsx\`)
- **Access Control**: Role: \`student\`.
- **Primary Purpose**: Student notification inbox displaying broadcast messages and class announcements with read/unread tracking.

---

## 6.6 Teaching & Public Pages

### 6.6.1 \`TeachingDashboard.tsx\` (\`src/pages/teaching/TeachingDashboard.tsx\`)
- **Access Control**: Role: \`faculty\`, \`coordinator\`.
- **Primary Purpose**: Syllabus progression and academic calendar tracker across courses.

### 6.6.2 \`LandingPage.tsx\` (\`src/pages/LandingPage.tsx\`)
- **Access Control**: Public.
- **Primary Purpose**: High-impact institutional showcase for Gautam Buddha University SDSM. Features hero banner, quick portal login links, news highlights, and campus statistics.

### 6.6.3 Authentication Pages (\`LoginPage.tsx\`, \`RegisterPage.tsx\`, \`ForgotPassword.tsx\`, \`ResetPassword.tsx\`)
- Responsive credential intake forms with input validation, password reveal toggles, OTP input fields with countdown timers, and role selector tabs.
`;
}
