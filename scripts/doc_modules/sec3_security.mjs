export function getSection3() {
  return `
---

# SECTION 3: Authentication, Authorization & Security Architecture

## 3.1 Dual-Token Authentication Engine

The Gautam Buddha University Student Data Management System (GBU-SDSM) implements an enterprise-grade stateless authentication engine built on the JSON Web Token (JWT) specification (RFC 7519). Authentication tokens represent cryptographically verifiable claims issued by the central identity authority upon successful credential verification.

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor User as Client (Browser / Agent)
    participant AuthRouter as Express Router (/api/auth)
    participant AuthCtrl as AuthController
    participant Bcrypt as bcryptjs Engine
    participant DB as MySQL Database
    participant JWT as jsonwebtoken Engine

    User->>AuthRouter: POST /api/auth/login { identifier, password, role }
    AuthRouter->>AuthCtrl: login(req, res, next)
    AuthCtrl->>DB: User.findOne({ where: { [Op.or]: [{ email }, { username }, { enrollmentNo }] } })
    DB-->>AuthCtrl: userRecord (with passwordHash, salt, status)
    
    alt User Not Found or Inactive
        AuthCtrl-->>User: 401 Unauthorized { success: false, message: "Invalid credentials or account inactive" }
    else User Exists & Active
        AuthCtrl->>Bcrypt: compare(plaintextPassword, userRecord.passwordHash)
        Bcrypt-->>AuthCtrl: isMatch (boolean)
        alt Password Mismatch
            AuthCtrl->>DB: Increment failedLoginAttempts (Lock if > 5)
            AuthCtrl-->>User: 401 Unauthorized { success: false, message: "Invalid credentials" }
        else Password Valid
            AuthCtrl->>JWT: sign({ id, role, email, program, branch, section }, ACCESS_SECRET, { expiresIn: '15m' })
            JWT-->>AuthCtrl: accessToken
            AuthCtrl->>JWT: sign({ id, tokenVersion }, REFRESH_SECRET, { expiresIn: '7d' })
            JWT-->>AuthCtrl: refreshToken
            AuthCtrl->>DB: Update lastLoginAt, reset failedLoginAttempts
            AuthCtrl-->>User: 200 OK + Set-Cookie: refreshToken (HttpOnly, Secure, SameSite=Strict) + JSON { accessToken, user }
        end
    end
\`\`\`

### 3.1.1 Access Token Architecture
- **Cryptographic Algorithm**: HMAC using SHA-256 (\`HS256\`), parameterized by the \`JWT_SECRET\` environment variable.
- **Payload Claims Schema**:
  \`\`\`json
  {
    "id": 142,
    "email": "faculty.cs@gbu.ac.in",
    "role": "faculty",
    "name": "Dr. Ramesh Sharma",
    "program": "B.Tech",
    "branch": "Computer Science and Engineering",
    "section": "A",
    "department": "CSE",
    "iat": 1757053200,
    "exp": 1757054100
  }
  \`\`\`
- **Lifespan**: Short-lived TTL (Time-To-Live) of 15 minutes (\`900 seconds\`) or 1 hour depending on deployment environment configuration. Short lifespans minimize the exploitation window should an access token be intercepted in transit.
- **Transmission Vector**: Clients transmit the access token within the HTTP \`Authorization\` request header using standard Bearer token formatting:
  \`Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\`
- **Verification Engine**: Express middleware (\`middleware/authMiddleware.js\`) intercepts incoming HTTP traffic, parses the Bearer string, executes \`jwt.verify(token, process.env.JWT_SECRET)\`, catches \`TokenExpiredError\` or \`JsonWebTokenError\`, and populates \`req.user\` with the decoded claims.

### 3.1.2 Refresh Token Architecture
- **Cryptographic Algorithm**: HMAC SHA-256 (\`HS256\`), parameterized by a segregated \`REFRESH_TOKEN_SECRET\` environment variable.
- **Payload Claims Schema**:
  \`\`\`json
  {
    "id": 142,
    "tokenVersion": 3,
    "iat": 1757053200,
    "exp": 1757658000
  }
  \`\`\`
- **Lifespan**: Long-lived TTL of 7 days (\`604800 seconds\`).
- **Storage Strategy**: Transmitted via HTTP-only, \`Secure\` (in production HTTPS), \`SameSite=Strict\` cookie named \`refreshToken\`. This architectural decision renders the refresh token completely immune to Cross-Site Scripting (XSS) document object model exfiltration.
- **Rotation and Revocation Mechanism**: Every invocation of the \`POST /api/auth/refresh-token\` endpoint triggers automatic token rotation. The server validates the existing refresh token, checks that \`userRecord.tokenVersion\` matches the token's \`tokenVersion\` claim, increments \`tokenVersion\` in the database, generates a brand new refresh token, and issues a fresh 15-minute access token. If a compromised refresh token is reused after rotation, the token version mismatch immediately flags the session, invalidating all active sessions for that account.

---

## 3.2 Password Hashing, Salting & Cryptographic Standards

GBU-SDSM strictly adheres to modern cryptographic standards for credential security, prohibiting any plaintext or reversibly encrypted password storage.

### 3.2.1 bcryptjs Salting & Key Derivation
- **Algorithm**: The Blowfish-based adaptive key derivation function (\`bcrypt\`).
- **Cost Factor / Salt Rounds**: Configured to \`10\` rounds ($2^{10} = 1024$ iterations). This provides an optimal equilibrium between cryptographic defense against specialized FPGA/ASIC offline brute-force attacks (~80-120ms computation per verification on modern CPUs) and server throughput during concurrent login spikes.
- **Salt Generation**: Cryptographically secure pseudo-random salt generated via \`bcrypt.genSaltSync(10)\`.
- **Model Hook Lifecycle**: Password hashing is encapsulated directly within the Sequelize \`User\` model lifecycle hooks (\`beforeCreate\`, \`beforeUpdate\`). Whenever the \`password\` attribute is marked as dirty or changed, the hook transparently executes:
  \`\`\`javascript
  user.password = await bcrypt.hash(user.password, 10);
  \`\`\`
- **Constant-Time Verification**: Password verification uses \`bcrypt.compare(candidatePassword, storedHash)\`, ensuring constant-time character comparison to eliminate timing side-channel attacks.

### 3.2.2 One-Time Password (OTP) Generation & Password Reset Workflow
- **Entropy Source**: Cryptographically secure pseudorandom number generation using Node.js native \`crypto.randomInt(100000, 999999)\` producing a 6-digit numeric OTP with $10^6$ equiprobable combinations.
- **Time-To-Live (TTL)**: OTP values are stored alongside an explicit timestamp:
  \`\`\`javascript
  user.resetPasswordOtp = generatedOtp;
  user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10-Minute Expiry
  \`\`\`
- **Verification and Invalidation**: Upon verification via \`POST /api/auth/verify-reset-otp\`, the system checks:
  1. \`user.resetPasswordOtp === submittedOtp\`
  2. \`new Date() < user.resetPasswordExpires\`
  Upon successful validation and subsequent password update, both \`resetPasswordOtp\` and \`resetPasswordExpires\` are set to \`null\` within an atomic database transaction, preventing OTP reuse or replay attacks.

---

## 3.3 Role-Based Access Control (RBAC) Matrix & Permission Hierarchy

GBU-SDSM enforces strict multi-tenant authorization partitions. The platform categorizes all actors into five distinct roles, mapped to an explicit privilege hierarchy:

\`\`\`
Level 5: admin (Super Administrator - Unrestricted Domain Authority)
Level 4: chairperson (Departmental Executive - Program & Cross-Class Authority)
Level 3: coordinator (Batch Supervisor - Specific Class/Section Authority)
Level 2: faculty (Instructor - Assigned Course & Attendance Authority)
Level 1: student / client (End-User - Self Data & Read-Only Domain Authority)
\`\`\`

### 3.3.1 Master Privilege Comparison Matrix

| Operational Capability / Action | Admin | Chairperson | Coordinator | Faculty | Student |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **System Configuration & Maintenance** | Full | None | None | None | None |
| **Manage Academic Programs & Branches** | Full | Read/Assign | Read-Only | None | None |
| **Create / Import New Students (Excel Bulk)** | Full | Allowed | Allowed | None | None |
| **View Student Profile & Demographics** | Universal | Assigned Dept | Assigned Class | Assigned Class | Own Only |
| **Edit Student Profile (Single Record)** | Universal | Assigned Dept | Assigned Class | None | Limited Own |
| **Bulk Edit Student Records** | Universal | Assigned Dept | Assigned Class | None | None |
| **Delete Student Record** | Full | None | None | None | None |
| **Export Student Data (CSV / Excel)** | Universal | Departmental | Assigned Class | None | None |
| **View Internship & Placement Records** | Universal | Departmental | Assigned Class | Assigned Class | Own Only |
| **Edit Placement / Package / Company Info** | Universal | Departmental | Assigned Class | None | Own Profile |
| **Create Coordinator Accounts** | Full | None | None | None | None |
| **Assign Classes to Coordinator** | Full | None | None | None | None |
| **Create Chairperson Accounts** | Full | None | None | None | None |
| **Assign Programs to Chairperson** | Full | None | None | None | None |
| **Create / Manage Faculty Profiles** | Full | Departmental | View Only | View Own | None |
| **Create Faculty Teaching Assignments** | Full | Departmental | Assigned Class | None | None |
| **Mark Class Attendance Sessions** | Full (Override) | Full (Override) | Assigned Class | Assigned Class | None |
| **Edit Historical Attendance Records** | Full | Departmental | Assigned Class | Assigned (24h) | None |
| **Lock / Finalize Attendance Session** | Full | Departmental | Assigned Class | Assigned Class | None |
| **View Live Attendance Statistics & Percentages** | Universal | Departmental | Assigned Class | Assigned Class | Own Only |
| **Export Attendance Reports (PDF / Excel)** | Universal | Departmental | Assigned Class | Assigned Class | Own Only |
| **Upload Course Timetable / Class Schedule** | Full | Departmental | Assigned Class | None | None |
| **Broadcast System-Wide Notifications** | Full | None | None | None | None |
| **Send Departmental Broadcast Messages** | Full | Full | None | None | None |
| **Send Class-Specific Messages** | Full | Full | Full | Assigned Class | None |
| **Send Direct Peer Messages (Faculty to Admin)**| Allowed | Allowed | Allowed | Allowed | None |
| **View System Audit Logs** | Full | None | None | None | None |

---

## 3.4 Express Middleware Pipeline Architecture

Every incoming HTTP request traverses a specialized sequence of Express middleware layers designed to filter, sanitize, authenticate, authorize, and audit every interaction before it reaches controller business logic.

\`\`\`mermaid
flowchart LR
    A[Inbound Request] --> B[Security Headers: Helmet]
    B --> C[CORS Engine]
    C --> D[Rate Limiter: express-rate-limit]
    D --> E[Body Parsers: express.json / urlencoded]
    E --> F[Request Logger: Correlation ID]
    F --> G[Auth Middleware: JWT Verification]
    G --> H[Role Middleware: RBAC Enforcement]
    H --> I[Multipart Handler: Multer]
    I --> J[Controller Business Logic]
\`\`\`

### 3.4.1 Authentication Middleware (\`middleware/authMiddleware.js\`)
The authentication middleware is the primary gatekeeper for all protected API routes. Its operational procedure is as follows:
1. **Header Extraction**: Inspects the \`req.headers.authorization\` string.
2. **Format Verification**: Asserts that the string starts with the literal prefix \`"Bearer "\`. If absent, immediately returns HTTP \`401 Unauthorized\` with payload \`{ success: false, message: "Authorization header missing or improperly formatted" }\`.
3. **Cryptographic Validation**: Invokes \`jwt.verify(token, process.env.JWT_SECRET)\`.
   - If \`TokenExpiredError\` is thrown: Returns HTTP \`401\` with code \`TOKEN_EXPIRED\` alerting the frontend interceptor to invoke the refresh pipeline.
   - If \`JsonWebTokenError\` is thrown: Returns HTTP \`401\` with message \`"Invalid token signature"\`.
4. **Database Identity Synchronization**: Queries the \`User\` model by the decoded \`id\` to verify that:
   - The user record continues to exist in the database.
   - The account status is active (\`isActive === true\`).
   - The user's role has not been demoted or revoked since token generation.
5. **Context Attachment**: Attaches the Sequelize user instance to \`req.user\` and passes control via \`next()\`.

### 3.4.2 Role-Based Authorization Middleware (\`middleware/roleMiddleware.js\`)
Role-based authorization is enforced through higher-order middleware factory functions:
- \`verifyRole(...allowedRoles)\`: Accepts an array of permissible roles (e.g., \`verifyRole('admin', 'coordinator')\`).
- Evaluates whether \`req.user.role\` matches any element of \`allowedRoles\`.
- If unmatched, terminates the request with HTTP \`403 Forbidden\`:
  \`\`\`json
  {
    "success": false,
    "message": "Access denied: Required role not possessed",
    "requiredRoles": ["admin", "coordinator"],
    "currentRole": "faculty"
  }
  \`\`\`
- Provides specialized scope validators such as \`verifyClassOwnership\`, which inspects \`req.params.classId\` or \`req.body.section\` to confirm that a coordinator or faculty member is authorized to access the specific class payload.

### 3.4.3 Rate Limiting Engine (\`middleware/rateLimiter.js\`)
To safeguard the API against brute-force attacks and denial-of-service (DoS) attempts, GBU-SDSM employs \`express-rate-limit\`:
- **General API Limiter**:
  - \`windowMs\`: 15 minutes (\`15 * 60 * 1000\` ms).
  - \`max\`: 500 requests per IP address per window.
  - \`standardHeaders\`: true (returns \`RateLimit-Limit\`, \`RateLimit-Remaining\`, and \`RateLimit-Reset\` headers).
- **Strict Authentication Limiter** (applied to \`/api/auth/login\` and \`/api/auth/reset-password\`):
  - \`windowMs\`: 15 minutes.
  - \`max\`: 10 requests per IP address.
  - Returns HTTP \`429 Too Many Requests\` with retry delay metadata.

### 3.4.4 HTTP Security Headers (\`middleware/securityHeaders.js\`)
Implemented using \`helmet\`, configuring defensive HTTP response headers:
- \`Content-Security-Policy (CSP)\`: Restricts script and style execution origins.
- \`X-Frame-Options: DENY\`: Prevents clickjacking by prohibiting rendering inside \`<iframe>\` or \`<frame>\`.
- \`X-Content-Type-Options: nosniff\`: Disables MIME-type sniffing.
- \`Strict-Transport-Security (HSTS)\`: Enforces HTTPS for 1 year (\`max-age=31536000; includeSubDomains\`).
- \`Referrer-Policy: strict-origin-when-cross-origin\`: Safeguards sensitive route tokens from leaking in referrer headers.

### 3.4.5 Request Audit Logger (\`middleware/requestLogger.js\`)
Every inbound request is assigned a UUIDv4 Correlation ID (\`X-Correlation-ID\`). The logger records:
- Timestamp (ISO 8601 UTC).
- HTTP Method & Full URL path.
- Request IP address (resolving \`X-Forwarded-For\` when behind reverse proxies).
- Authenticated User ID & Role (if available).
- Execution Latency (high-resolution timer \`process.hrtime()\`).
- Sanitized request body (automatically masking fields like \`password\`, \`token\`, \`otp\`, \`cardNumber\`).

### 3.4.6 Multipart File Ingestion Pipeline (\`middleware/multerUpload.js\`)
Handles binary uploads for student profile pictures and bulk Excel spreadsheets:
- **Storage Engine**: Memory storage for Excel parsing (allowing direct in-memory buffer streaming into \`xlsx\` without temporary disk I/O overhead) and disk storage for persistent media uploads.
- **Disk Storage Directory**: Configured to \`uploads/students/\` and \`uploads/documents/\`.
- **Filename Sanitization**: Replaces non-alphanumeric characters with hyphens and prepends high-resolution timestamps to guarantee uniqueness (\`Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname)\`).
- **File Filter & MIME Whitelist**:
  - Documents: \`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\` (\`.xlsx\`), \`application/vnd.ms-excel\` (\`.xls\`), \`text/csv\` (\`.csv\`), \`application/pdf\` (\`.pdf\`).
  - Images: \`image/jpeg\`, \`image/png\`, \`image/webp\`.
- **Payload Limits**: Max file size capped at 10 MB for spreadsheets and 5 MB for profile photographs.

---

## 3.5 Cross-Origin Resource Sharing (CORS) & Network Configuration

GBU-SDSM supports segmented multi-origin deployments where the React Single Page Application (SPA) runs on a separate port or domain from the Express API server.

\`\`\`javascript
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      process.env.CLIENT_URL,
      process.env.FRONTEND_APP_URL
    ].filter(Boolean);

    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Cross-Origin Request Blocked by CORS Security Policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Correlation-ID', 'Accept'],
  exposedHeaders: ['Content-Disposition', 'RateLimit-Limit', 'RateLimit-Remaining'],
  maxAge: 86400 // 24-hour pre-flight cache
};
\`\`\`

---

## 3.6 Attack Vector Mitigations & Threat Modeling

| Threat Vector | Severity | Vulnerability Mechanism | GBU-SDSM Architectural Mitigation |
| :--- | :---: | :--- | :--- |
| **SQL Injection (SQLi)** | Critical | Malicious SQL fragments injected via query parameters or form fields. | Sequelize ORM parameterized queries with strict typed attribute binding. All raw SQL queries (where utilized) mandate explicit replacement objects (\`:param\`). |
| **Cross-Site Scripting (XSS)** | High | Injection of malicious client-side JavaScript into profile fields or chat messages. | React's virtual DOM auto-escapes all rendered text strings. Backend input sanitization removes raw HTML tags from user strings. CSP headers block untrusted script sources. |
| **Cross-Site Request Forgery (CSRF)** | High | Unauthorized state-changing commands executed from a trusted user session. | API commands require access tokens passed via explicit \`Authorization: Bearer\` headers, which third-party sites cannot forge. Refresh cookies utilize \`SameSite=Strict\`. |
| **Insecure Direct Object Reference (IDOR)** | High | Manipulating database primary keys in URL params (e.g. \`GET /students/105\`) to access unauthorized records. | Scoped authorization checks: Coordinators are restricted to students belonging to their assigned \`program\` + \`branch\` + \`section\`. Faculty can only view students in their assigned course rosters. Students can only access their own user ID record. |
| **Brute-Force & Credential Stuffing** | High | Automated high-frequency dictionary attacks against user login endpoints. | Dual-layer defense: Express rate limiting throttles requests per IP; User model tracks consecutive failed login attempts, locking accounts after 5 failures for 30 minutes. |
| **Mass Assignment Vulnerability** | Medium | Over-posting unvalidated JSON fields to overwrite protected columns (e.g. \`role: "admin"\`). | Controller endpoints explicitly destructure and whitelist permissible fields before passing to Sequelize \`create\` or \`update\` calls. |
| **Timing Attacks** | Medium | Measuring execution time differences to deduce valid usernames or password hash bytes. | Constant-time password hashing comparisons via \`bcrypt.compare\` and normalized error messages preventing account enumeration. |
| **Denial of Service (Memory Exhaustion)** | Medium | Ingestion of multi-gigabyte files or unbounded database queries. | Strict Multer file size limits (10MB) combined with mandatory database pagination (\`limit\` and \`offset\` defaults). |
`;
}