export function getSection5() {
  return `
---

# SECTION 5: Frontend Architecture, State Management & Routing

## 5.1 Technology Stack & Architectural Paradigms

The user interface of GBU-SDSM is engineered as a modern Single Page Application (SPA) leveraging **React 18** and **TypeScript**, bundled with **Vite 5**. The frontend architecture is structured around modularity, strict type safety, unidirectional data flow, and responsive presentation.

\`\`\`mermaid
flowchart TD
    subgraph ViewLayer["Presentation Layer (React 18 & Tailwind CSS)"]
        Landing["Landing & Public Pages"]
        AdminUI["Admin Portal"]
        CoordUI["Coordinator Portal"]
        ChairUI["Chairperson Portal"]
        FacUI["Faculty Portal"]
        StudentUI["Student / Client Portal"]
    end

    subgraph StateLayer["State Management & Navigation"]
        Router["React Router DOM (BrowserRouter)"]
        ReduxStore["Redux Toolkit Store"]
        AdminSlice["adminSlice (Students, Stats, Filters)"]
        UserSlice["userSlice (Auth, Identity, Roles)"]
        LocalState["Component Hooks (useState, useMemo, useCallback)"]
    end

    subgraph NetworkLayer["Data Synchronization Layer"]
        AxiosClient["Axios HTTP Client (Singleton)"]
        ReqInterceptor["Request Interceptor (Bearer Token Injection)"]
        RespInterceptor["Response Interceptor (401 Refresh & Errors)"]
    end

    ViewLayer --> Router
    Router --> StateLayer
    StateLayer --> NetworkLayer
    NetworkLayer --> BackEnd["Express REST API (/api/*)"]
\`\`\`

### 5.1.1 Core Frontend Dependencies
- **React 18.2+**: Utilizes concurrent rendering capabilities, functional components, hooks pattern, and React Suspense for lazy code-splitting.
- **TypeScript 5.x**: Enforces compile-time type validation across components, props, state slices, and API payload structures.
- **Vite 5**: Delivers fast Hot Module Replacement (HMR) in development and Rollup-based chunk optimization for production distributions.
- **Tailwind CSS 3.x**: Utility-first CSS framework providing a custom GBU design system (custom primary blues, emerald accents, dark/light surface tokens, and responsive breakpoints: \`sm: 640px\`, \`md: 768px\`, \`lg: 1024px\`, \`xl: 1280px\`, \`2xl: 1536px\`).
- **Lucide React**: Modern, tree-shakeable icon suite ensuring visual consistency across portals.
- **XLSX (SheetJS)**: Client-side spreadsheet parsing and generation for instant data export without server latency.

---

## 5.2 Application Root & Router Tree Hierarchy (\`src/App.tsx\`)

Routing in GBU-SDSM is powered by **React Router DOM v6**, structured into public routes, authentication routes, and role-guarded portal layouts.

### 5.2.1 Route Guarding & Protection Wrappers
- **\`ProtectedRoute\`**: Verifies that an authentication token exists and that the user session is active. Unauthenticated requests are redirected to \`/login\` with the original URL preserved in \`location.state.from\` for post-login redirection.
- **\`RoleRoute\`**: Takes an array of permissible roles (\`allowedRoles: Role[]\`). Evaluates the authenticated user's role:
  - If matches: Renders target route layout via \`<Outlet />\`.
  - If mismatch: Redirects to unauthorized fallback or the user's appropriate default dashboard.

### 5.2.2 Complete Router Navigation Matrix

| Path | Component / Page | Access Control / Roles | Purpose & Features |
| :--- | :--- | :--- | :--- |
| \`/\` | \`LandingPage\` | Public | Institutional landing page, news ticker, key metrics, portal links |
| \`/about\` | \`AboutPage\` | Public | Information on Gautam Buddha University & SDSM platform history |
| \`/contact\` | \`ContactPage\` | Public | Contact directories, departmental emails, campus map |
| \`/gallery\` | \`GalleryPage\` | Public | Campus and departmental photographic gallery |
| \`/developers\` | \`DevelopersPage\` | Public | Developer credits, engineering specifications, release log |
| \`/login\` | \`LoginPage\` | Public (Guest) | Multi-role authentication portal with identifier & password input |
| \`/register\` | \`RegisterPage\` | Public (Guest) | Student initial registration and profile onboarding |
| \`/forgot-password\` | \`ForgotPassword\` | Public (Guest) | Request 6-digit OTP for password recovery |
| \`/reset-password\` | \`ResetPassword\` | Public (Guest) | Submit OTP and establish new account password |
| **Admin Portal** | | | |
| \`/admin\` | \`AdminDashboard\` | Role: \`admin\` | Macro analytics, student distributions, system health, audit logs |
| \`/admin/dashboard\` | \`AdminDashboard\` | Role: \`admin\` | Canonical dashboard route alias |
| \`/admin/students\` | \`StudentList\` | Role: \`admin\` | Full student directory, multi-filter search, pagination, bulk edit |
| \`/admin/students/bulk-upload\` | \`BulkUploadPage\` | Role: \`admin\` | Excel spreadsheet ingestion, column mapping, batch import |
| \`/admin/coordinators\` | \`CoordinatorManagement\` | Role: \`admin\` | Create, edit, and assign classes to academic coordinators |
| \`/admin/chairpersons\` | \`ChairpersonManagement\` | Role: \`admin\` | Create and configure departmental chairpersons |
| \`/admin/faculty\` | \`FacultyManagement\` | Role: \`admin\` | Manage faculty database, designations, departments |
| \`/admin/attendance\` | \`AdminAttendance\` | Role: \`admin\` | Cross-department attendance tracking, session override, lock |
| \`/admin/reports\` | \`ReportsPage\` | Role: \`admin\` | Comprehensive data exports, placement reports, demographic charts |
| \`/admin/settings\` | \`SettingsPage\` | Role: \`admin\` | System configuration, academic terms, database maintenance |
| **Coordinator Portal** | | | |
| \`/coordinator\` | \`CoordinatorDashboard\` | Role: \`coordinator\` | Scoped dashboard for assigned class/section metrics |
| \`/coordinator/students\` | \`CoordinatorStudents\` | Role: \`coordinator\` | Assigned section student list, single & bulk edit, export |
| \`/coordinator/attendance\` | \`CoordinatorAttendance\` | Role: \`coordinator\` | Mark and review class attendance sessions, defaulter alert |
| \`/coordinator/messages\` | \`CoordinatorMessages\` | Role: \`coordinator\` | Send announcements to class students, contact faculty/admin |
| **Chairperson Portal** | | | |
| \`/chairperson\` | \`ChairpersonDashboard\` | Role: \`chairperson\` | Departmental multi-program analytics and performance overview |
| \`/chairperson/classes\` | \`ChairpersonClasses\` | Role: \`chairperson\` | Class and section management across overseen programs |
| \`/chairperson/faculty\` | \`ChairpersonFaculty\` | Role: \`chairperson\` | Faculty teaching assignments, workload distribution |
| \`/chairperson/students\` | \`ChairpersonStudents\` | Role: \`chairperson\` | Department-wide student lookup and performance review |
| \`/chairperson/attendance\` | \`ChairpersonAttendance\` | Role: \`chairperson\` | Departmental attendance audits and reports |
| **Faculty Portal** | | | |
| \`/faculty\` | \`FacultyDashboard\` | Role: \`faculty\` | Assigned courses, daily timetable, upcoming sessions |
| \`/faculty/classes\` | \`FacultyClasses\` | Role: \`faculty\` | List of assigned classes and enrolled rosters |
| \`/faculty/attendance\` | \`FacultyAttendance\` | Role: \`faculty\` | Mark attendance session for specific course/section |
| \`/faculty/profile\` | \`FacultyProfile\` | Role: \`faculty\` | View and update faculty profile information |
| \`/faculty/messages\` | \`FacultyMessages\` | Role: \`faculty\` | Peer and student communication center |
| **Student Portal** | | | |
| \`/client\` | \`ClientDashboard\` | Role: \`student\` | Student personal dashboard, attendance summary, notifications |
| \`/client/profile\` | \`ClientProfile\` | Role: \`student\` | Comprehensive student personal & academic profile |
| \`/client/attendance\` | \`ClientAttendance\` | Role: \`student\` | Subject-wise attendance percentages, detailed session logs |
| \`/client/timetable\` | \`ClientTimetable\` | Role: \`student\` | Weekly class timetable schedule |
| \`/client/messages\` | \`ClientMessages\` | Role: \`student\` | Announcements received from coordinators and faculty |
| **Teaching Portal** | | | |
| \`/teaching\` | \`TeachingDashboard\` | Role: \`faculty\`, \`coordinator\` | Teaching schedule, syllabus progression tracking |
| \`*\` | \`NotFoundPage\` | Public | 404 error page with navigation back to safe roots |

---

## 5.3 Global State Management Architecture (\`src/store\`)

GBU-SDSM utilizes **Redux Toolkit (RTK)** to manage application-wide shared state. State slices are normalized and typed to eliminate invalid state transitions.

\`\`\`
src/store/
├── index.ts          # Central store configuration, typed dispatch & selector hooks
├── adminSlice.ts     # Admin domain state: students, statistics, filters, pagination
└── userSlice.ts      # Authentication domain state: user profile, tokens, role, status
\`\`\`

### 5.3.1 Store Configuration (\`src/store/index.ts\`)
\`\`\`typescript
import { configureStore } from '@reduxjs/toolkit';
import adminReducer from './adminSlice';
import userReducer from './userSlice';

export const store = configureStore({
  reducer: {
    admin: adminReducer,
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable dates in specific action payloads
        ignoredActions: ['admin/setLastUpdated'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
\`\`\`

### 5.3.2 Admin State Slice (\`src/store/adminSlice.ts\`)
The \`adminSlice\` encapsulates all data necessary for administrative queries and modifications:
- **State Interface**:
  \`\`\`typescript
  interface AdminState {
    students: Student[];
    totalStudents: number;
    currentPage: number;
    pageSize: number;
    totalPages: number;
    filters: {
      program: string;
      branch: string;
      year: string;
      section: string;
      searchTerm: string;
      placementStatus: string;
    };
    stats: {
      totalEnrolled: number;
      totalCoordinators: number;
      totalFaculty: number;
      averageAttendanceRate: number;
      placedCount: number;
    } | null;
    selectedStudent: Student | null;
    loading: boolean;
    error: string | null;
  }
  \`\`\`
- **Key Async Thunks**:
  - \`fetchStudents(params)\`: Dispatches \`GET /api/admin/students\` with active filter parameters.
  - \`fetchStudentStats()\`: Fetches institutional metrics.
  - \`updateStudent(studentData)\`: Sends \`PUT /api/admin/students/:id\` and updates local state immutably.
  - \`bulkEditStudents({ ids, updates })\`: Executes batch update and refreshes current view.

### 5.3.3 User & Authentication State Slice (\`src/store/userSlice.ts\`)
Manages the user's active session and authentication state:
- **State Interface**:
  \`\`\`typescript
  interface UserState {
    currentUser: UserProfile | null;
    token: string | null;
    isAuthenticated: boolean;
    role: 'admin' | 'coordinator' | 'chairperson' | 'faculty' | 'student' | null;
    loading: boolean;
    error: string | null;
  }
  \`\`\`
- **Reducers**:
  - \`setCredentials({ user, token })\`: Persists token in \`localStorage\` and updates Redux state.
  - \`logoutUser()\`: Clears \`localStorage\`, resets state to \`null\`, and disconnects authenticated sockets.
  - \`updateCurrentUser(profileData)\`: Merges updated profile fields into \`currentUser\`.

---

## 5.4 Network Client & Axios Interceptor Pipeline (\`src/utils/api.ts\`)

All network communication with the backend Express API is channeled through a centralized Axios client instance configured with defensive interceptors.

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Component as React Component
    participant Axios as Axios Client
    participant ReqInt as Request Interceptor
    participant Backend as Express Backend
    participant ResInt as Response Interceptor
    participant Store as Redux UserSlice

    Component->>Axios: api.get('/admin/students')
    Axios->>ReqInt: Intercept outgoing request
    ReqInt->>ReqInt: Attach Authorization: Bearer <token>
    ReqInt->>Backend: HTTP GET /api/admin/students
    
    alt Success (200 OK)
        Backend-->>ResInt: HTTP 200 { success: true, data: [...] }
        ResInt-->>Component: return response.data
    else Token Expired (401 Unauthorized)
        Backend-->>ResInt: HTTP 401 TokenExpiredError
        ResInt->>Backend: POST /api/auth/refresh-token (with HttpOnly Cookie)
        alt Refresh Successful
            Backend-->>ResInt: HTTP 200 { token: "<new_token>" }
            ResInt->>Store: dispatch(setCredentials({ token: "<new_token>" }))
            ResInt->>Backend: Replay original request with new token
            Backend-->>Component: Return replayed response
        else Refresh Failed
            Backend-->>ResInt: HTTP 401 Session Expired
            ResInt->>Store: dispatch(logoutUser())
            ResInt-->>Component: Redirect to /login
        end
    end
\`\`\`

### 5.4.1 Axios Instance Configuration
\`\`\`typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000, // 30-second network timeout
  withCredentials: true, // Required for HttpOnly refresh cookie transmission
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = \`Bearer \${token}\`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await axios.post('/api/auth/refresh-token', {}, { withCredentials: true });
        const newToken = refreshResponse.data.token;
        localStorage.setItem('token', newToken);
        originalRequest.headers.Authorization = \`Bearer \${newToken}\`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('token');
        window.location.href = '/login?session=expired';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
\`\`\`
`;
}
