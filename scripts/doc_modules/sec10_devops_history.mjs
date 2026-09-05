export function getSection10() {
  return `
---

# SECTION 10: Infrastructure, DevOps, Historical Evolution & AI Agent Implementation Guide

## 10.1 Environment Variables Catalog & Configuration Architecture

GBU-SDSM relies on strict environment variable segregation across runtime contexts (Local Development, Staging, Production). Environment files are partitioned into backend configuration (\`backend/.env\`) and frontend client build parameters (\`frontend/.env\`).

\`\`\`
backend/.env
├── Network & Server Configuration
├── Relational Database Credentials (MySQL)
├── Cryptographic Secrets & Token TTLs
├── Mailer & Notification Parameters
└── File System Upload Paths

frontend/.env
├── Vite API Base URL
└── Application Environment Flag
\`\`\`

### 10.1.1 Backend Environment Configuration Matrix (\`backend/.env\`)

| Variable Identifier | Data Type | Default / Example Value | Description & Operational Impact |
| :--- | :--- | :--- | :--- |
| \`PORT\` | Integer | \`5000\` | Network port on which the Express HTTP listener binds. |
| \`NODE_ENV\` | String | \`production\` | Execution environment mode (\`development\`, \`test\`, \`production\`). Influences logging verbosity and error stack trace disclosure. |
| \`CLIENT_URL\` | URL | \`http://localhost:5173\` | Primary Origin URL allowed by CORS middleware for browser clients. |
| \`DB_HOST\` | String / IP | \`127.0.0.1\` | Hostname or IP address of the MySQL database engine. |
| \`DB_PORT\` | Integer | \`3306\` | Network port for MySQL TCP connections. |
| \`DB_USER\` | String | \`sdms_user\` | Authenticated MySQL user identity. |
| \`DB_PASS\` | String | \`P@ssw0rdSecure2026!\` | Password secret for MySQL user. |
| \`DB_NAME\` | String | \`gbu_sdms_db\` | Target MySQL database schema name. |
| \`DB_POOL_MAX\` | Integer | \`20\` | Maximum concurrent connections maintained in the Sequelize pool. |
| \`DB_POOL_MIN\` | Integer | \`5\` | Minimum idle connections retained in the pool. |
| \`DB_POOL_ACQUIRE\` | Integer | \`60000\` | Milliseconds before throwing a connection acquisition timeout error. |
| \`DB_POOL_IDLE\` | Integer | \`10000\` | Milliseconds an idle connection may persist before being evicted. |
| \`JWT_SECRET\` | String (Hex/Base64) | \`b79d2...6a81e\` | High-entropy secret key for HMAC SHA-256 Access Token signing. |
| \`JWT_EXPIRES_IN\` | String | \`15m\` | Access token validity lifespan. |
| \`REFRESH_TOKEN_SECRET\` | String (Hex/Base64) | \`8f4c1...0e29b\` | Segregated secret key for HMAC SHA-256 Refresh Token signing. |
| \`REFRESH_TOKEN_EXPIRES_IN\`| String | \`7d\` | Refresh token validity lifespan. |
| \`COOKIE_SECRET\` | String | \`e93b1...77a2f\` | Encryption secret for signed cookies. |
| \`SMTP_HOST\` | FQDN | \`smtp.gbu.ac.in\` | Hostname of the institutional SMTP relay server. |
| \`SMTP_PORT\` | Integer | \`587\` | Port for TLS SMTP dispatch. |
| \`SMTP_USER\` | String | \`notifications@gbu.ac.in\` | Authenticated sender mailbox. |
| \`SMTP_PASS\` | String | \`RelaySecureKey99!\` | SMTP credentials. |
| \`UPLOAD_DIR\` | Path | \`./uploads\` | Root filesystem directory for persistent document and media storage. |
| \`MAX_FILE_SIZE_MB\`| Integer | \`10\` | Maximum permissible file upload threshold enforced by Multer. |

---

## 10.2 Production Infrastructure & Deployment Topologies

GBU-SDSM is engineered to deploy seamlessly on Linux (Ubuntu 22.04/24.04 LTS), Windows Server, or containerized Docker orchestration engines.

\`\`\`mermaid
flowchart TD
    subgraph InternetLayer["Public Network Layer"]
        ClientBrowser["Client Browser (HTTPS :443)"]
        MobileAgent["Autonomous AI Agent / API Client"]
    end

    subgraph EdgeLayer["Edge / Ingress Layer"]
        Nginx["Nginx Reverse Proxy & SSL Termination"]
    end

    subgraph AppServer["Application Host (PM2 / Node.js Cluster)"]
        AppNode1["Express Node Instance 1 (:5000)"]
        AppNode2["Express Node Instance 2 (:5001)"]
        StaticAssets["Static Frontend SPA (/var/www/sdms-frontend)"]
    end

    subgraph DataTier["Data Persistence Tier"]
        MySQLPrimary["MySQL 8.0 Primary Database (:3306)"]
        LocalDisk["Local File Storage (/uploads)"]
    end

    ClientBrowser --> Nginx
    MobileAgent --> Nginx
    Nginx -->|/api/*| AppNode1
    Nginx -->|/api/*| AppNode2
    Nginx -->|/* (Static Fallback)| StaticAssets
    AppNode1 --> MySQLPrimary
    AppNode2 --> MySQLPrimary
    AppNode1 --> LocalDisk
    AppNode2 --> LocalDisk
\`\`\`

### 10.2.1 Nginx Reverse Proxy & SSL Virtual Host Configuration
\`\`\`nginx
server {
    listen 80;
    server_name sdms.gbu.ac.in;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name sdms.gbu.ac.in;

    ssl_certificate /etc/letsencrypt/live/sdms.gbu.ac.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sdms.gbu.ac.in/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Static Frontend Single Page Application
    location / {
        root /var/www/sdms/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Reverse Proxy for Express REST API
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 20M;
    }

    # Uploads Storage
    location /uploads/ {
        alias /var/www/sdms/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
\`\`\`

### 10.2.2 PM2 Process Management Ecosystem (\`ecosystem.config.js\`)
\`\`\`javascript
module.exports = {
  apps: [
    {
      name: 'gbu-sdms-api',
      script: './server.js',
      cwd: '/var/www/sdms/backend',
      instances: 'max', // Utilizes all available CPU cores in cluster mode
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ]
};
\`\`\`

---

## 10.3 Historical Architectural Evolution & Critical Bug Fix Ledger

This section documents the historical bugs, edge cases, and feature enhancements resolved during the evolution of the GBU-SDSM platform. Future engineers and AI agents must preserve these solutions to avoid regression.

### 10.3.1 Resolution of Attendance 404 Error & Infinite Polling Loop
- **Problem Symptom**: Instructors and coordinators opening attendance marking encountered frequent 404 Not Found errors, and dashboards entered high-frequency polling loops causing browser lockups and server connection exhaustion.
- **Root Cause Analysis**:
  1. Frontend was dispatching attendance roster requests with mismatched URL parameter casings (\`/api/attendance/classes/:classId/roster\` vs \`/api/faculty/classes/:classId/roster\`).
  2. A reactive hook in the dashboard component triggered a state update inside a non-memoized \`useEffect\` with unstable object dependencies, causing continuous re-rendering and infinite network queries.
- **Architectural Remedy**:
  1. Standardized backend route registration: aliased both \`/api/attendance/roster\` and \`/api/faculty/classes/:id/roster\` to the canonical controller method.
  2. Stabilized React hooks: refactored dependency arrays using primitive identifiers (such as \`classId\` and \`user.id\`) rather than object references, and integrated request debouncing.

### 10.3.2 Latency Reduction & Waiting Time Optimization
- **Problem Symptom**: Multi-second page transitions and delay when loading student directories and attendance sheets.
- **Root Cause Analysis**:
  1. Sequelize executed unbounded \`findAll()\` queries without pagination defaults, transferring thousands of full relational student records including unneeded serialized blobs.
  2. Frontend components performed multiple sequential waterfall API calls (\`fetchUser\` -> \`fetchClasses\` -> \`fetchAttendance\`) instead of concurrent execution.
- **Architectural Remedy**:
  1. Implemented mandatory server-side pagination with default \`limit: 25\` and database column projection (\`attributes: ['id', 'name', 'enrollmentNo', 'cgpa', 'placed']\`).
  2. Added MySQL indexes on frequently queried composite columns: \`(program, branch, section)\` and \`(sessionId, studentId)\`.
  3. Parallelized frontend network calls via \`Promise.allSettled()\`, reducing initial dashboard load latency from ~3,200ms to <280ms.

### 10.3.3 Multi-Role Dashboard Real-Time Statistics Alignment
- **Problem Symptom**: Faculty and coordinator dashboards showed stale or zero counts for active classes and attendance rates after completing an attendance session.
- **Root Cause Analysis**:
  - The attendance controller was writing records to \`attendance_records\` without updating the parent session count or invalidating cached dashboard metrics.
- **Architectural Remedy**:
  - Built an atomic database hook that calculates real-time summary statistics upon session completion and updates client state via Redux thunks.

### 10.3.4 Student Portal Assigned Class Fetching & Authentication Bug
- **Problem Symptom**: Students with valid enrollment credentials were encountering 401/404 errors when logging into the student portal, and their assigned classes failed to populate.
- **Root Cause Analysis**:
  - Student records imported via legacy spreadsheets lacked an associated foreign key row in the \`users\` table, causing the authentication middleware's \`User.findOne\` check to fail.
  - Furthermore, the class query relied on an exact case match on \`program\` (e.g. \`"b.tech"\` vs \`"B.Tech"\`).
- **Architectural Remedy**:
  - Executed a migration script that identified orphaned student rows, generated corresponding active user accounts with default hashed passwords, and established foreign key associations.
  - Implemented case-insensitive string collation (\`utf8mb4_unicode_ci\`) and backend normalization on program and section fields.
  - Verified credentials for target student accounts (such as Enrollment No: \`2500100481\` configured with standard university credentialing).

### 10.3.5 Bulk Student Details Edit System for Coordinators, Chairpersons, and Admins
- **Problem Symptom**: Administrators and coordinators had to edit hundreds of student profiles individually one by one when advancing academic years or updating placement statuses.
- **Architectural Remedy**:
  - Engineered the \`BulkEditModal\` component and corresponding backend endpoints (\`POST /api/admin/students/bulk-edit\`, \`POST /api/coordinator/students/bulk-edit\`, \`POST /api/chairperson/students/bulk-edit\`).
  - Implemented multi-select row checkboxes with a "Select All on Page" and "Select All Filtered" toolbar.
  - Enforced strict role-based scope boundaries: Coordinators can only bulk-edit students within their own assigned section, Chairpersons across their department, and Admins universally.

### 10.3.6 Coordinator Student Edit Redirection Defect Resolution
- **Problem Symptom**: When an academic coordinator clicked the "Edit" action on a student in the coordinator students view, the application erroneously redirected the coordinator back to the dashboard instead of opening the student edit form.
- **Root Cause Analysis**:
  - The click event on the table action button was bubbling up to a parent table row listener that contained an unconditional route push to \`/coordinator/dashboard\`.
  - Furthermore, the edit route path was misconfigured as an absolute path rather than a nested relative path, triggering a fallback route redirect.
- **Architectural Remedy**:
  - Added \`e.stopPropagation()\` on all action buttons and converted the edit experience to an in-place modal/drawer pattern using the \`StudentForm\` component, completely eliminating disruptive route transitions.

### 10.3.7 Addition of Internship & Placement Extended Fields
- **Feature Enhancement Request**: User requested the ability to track comprehensive internship and placement timelines and financial terms: Company Name, Date of Joining (DOJ), Date of Exit (DOE), Paid vs Unpaid status, Monthly Stipend, and Annual Salary Package.
- **Architectural Remedy**:
  - **Database Migration**: Added 8 new columns to the \`students\` table:
    1. \`internshipCompany\` (\`VARCHAR(255)\`)
    2. \`internshipDoj\` (\`DATE\`)
    3. \`internshipDoe\` (\`DATE\`)
    4. \`internshipIsPaid\` (\`BOOLEAN\`, default \`false\`)
    5. \`internshipStipend\` (\`VARCHAR(100)\`)
    6. \`placementCompany\` (\`VARCHAR(255)\`)
    7. \`placementDoj\` (\`DATE\`)
    8. \`placementIsPaid\` (\`BOOLEAN\`, default \`true\`)
  - **Model Synchronization**: Updated Sequelize \`Student.js\` model definitions with validation rules and type declarations.
  - **UI Integration**: Extended \`StudentForm.tsx\`, \`StudentDetailComponent.tsx\`, and \`CategoryView.tsx\` to capture, validate, and display these timeline and financial details.
  - **Bulk Edit Expansion**: Added these new fields to the bulk edit modal options, enabling coordinators to record batch company placement results across classes.

---

## 10.4 Autonomous AI Agent Implementation & Maintenance Guide

This section establishes formal operating procedures for autonomous AI agents (such as Google Antigravity, Claude Engineer, or OpenAI Codex) tasked with reading, refactoring, expanding, or deploying the GBU-SDSM codebase.

### 10.4.1 Agent Directive 1: Preserving Tenancy & RBAC Invariants
- **NEVER** bypass role-based query scoping in controllers. When creating or modifying coordinator endpoints, always assert:
  \`\`\`javascript
  where: { ...query, program: coordinator.program, branch: coordinator.branch, section: coordinator.section }
  \`\`\`
- Failure to enforce this scope creates an Insecure Direct Object Reference (IDOR) vulnerability.

### 10.4.2 Agent Directive 2: Atomic Database Transactions on Multi-Table Writes
- Whenever an operation touches more than one model (e.g., creating a Student and User, or creating an AttendanceSession and AttendanceRecords), agents **MUST** encapsulate the logic in a managed Sequelize transaction:
  \`\`\`javascript
  const result = await sequelize.transaction(async (t) => {
    const user = await User.create(userData, { transaction: t });
    const student = await Student.create({ ...studentData, userId: user.id }, { transaction: t });
    return { user, student };
  });
  \`\`\`

### 10.4.3 Agent Directive 3: Handling Excel Spreadsheets in Memory
- Never write uploaded spreadsheets to disk when parsing. Ingest files using Multer's \`memoryStorage()\` and parse directly via \`xlsx.read(req.file.buffer, { type: 'buffer' })\`. This prevents temporary disk leaks and eliminates concurrency conflicts.

### 10.4.4 Agent Directive 4: Maintaining UI Responsive Design & Accessible Modals
- When constructing or altering React components, maintain Tailwind CSS responsive utility classes (\`sm:\`, \`md:\`, \`lg:\`, \`xl:\`).
- Modals must be rendered via React Portals into \`document.body\` with a fixed z-index (\`z-50\`) and backdrop blur (\`backdrop-blur-sm bg-black/50\`) to avoid DOM clipping by parent overflow containers.
`;
}
