import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '..');

console.log('--- AUDITING BACKEND DEEP CONTRACTS & SCOPES ---');

// 1. Audit Route imports vs Controller exports
const routesDir = path.join(backendDir, 'routes');
const controllersDir = path.join(backendDir, 'controllers');

const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
let importExportIssues = [];

for (const rFile of routeFiles) {
  const rPath = path.join(routesDir, rFile);
  const rContent = fs.readFileSync(rPath, 'utf8');

  // Match import statements from controllers
  const importMatches = [...rContent.matchAll(/import\s*\{([^}]+)\}\s*from\s*["'](\.\.\/controllers\/[^"']+)["']/g)];
  for (const match of importMatches) {
    const importedNames = match[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0]).filter(Boolean);
    const controllerRelPath = match[2];
    const controllerPath = path.resolve(routesDir, controllerRelPath);

    if (!fs.existsSync(controllerPath)) {
      importExportIssues.push(`[BROKEN FILE IMPORT] ${rFile} imports from non-existent file: ${controllerRelPath}`);
      continue;
    }

    const cContent = fs.readFileSync(controllerPath, 'utf8');
    for (const name of importedNames) {
      const exportRegex = new RegExp(`export\\s+(const|function|let|var|class)\\s+${name}\\b|export\\s*\\{[^}]*\\b${name}\\b[^}]*\\}`);
      if (!exportRegex.test(cContent)) {
        importExportIssues.push(`[MISSING EXPORT] ${rFile} imports '${name}', but it is NOT exported in ${path.basename(controllerPath)}`);
      }
    }
  }
}

console.log(`\n1. Route Import vs Controller Export Audit:`);
if (importExportIssues.length === 0) {
  console.log('   PASSED: All route imports match controller exports exactly!');
} else {
  importExportIssues.forEach(iss => console.log('   FAILED:', iss));
}

// 2. Audit asyncHandler wrapping in routes
let unwrappedHandlers = [];
for (const rFile of routeFiles) {
  const rPath = path.join(routesDir, rFile);
  const rContent = fs.readFileSync(rPath, 'utf8');

  // Match router.<method>(path, ...handlers)
  const routeCalls = [...rContent.matchAll(/router\.(get|post|put|delete|patch)\s*\(\s*["'][^"']+["']\s*,\s*([^)]+)\)/g)];
  for (const rc of routeCalls) {
    const handlerList = rc[2].split(',').map(s => s.trim());
    const lastHandler = handlerList[handlerList.length - 1];
    // If inline async function: e.g. async (req, res) without asyncHandler
    if (lastHandler.startsWith('async ') && !lastHandler.includes('asyncHandler')) {
      unwrappedHandlers.push(`${rFile}: Inline async handler not wrapped in asyncHandler: ${lastHandler.slice(0, 40)}...`);
    }
  }
}

console.log(`\n2. Route Handlers asyncHandler Audit:`);
if (unwrappedHandlers.length === 0) {
  console.log('   PASSED: No bare unhandled inline async route handlers detected.');
} else {
  unwrappedHandlers.forEach(u => console.log('   WARNING:', u));
}

// 3. Audit Controllers for asyncHandler
const controllerFiles = fs.readdirSync(controllersDir).filter(f => f.endsWith('.js'));
let unhandledControllerFns = [];

for (const cFile of controllerFiles) {
  const cPath = path.join(controllersDir, cFile);
  const cContent = fs.readFileSync(cPath, 'utf8');

  // Find all export const fn = ...
  const exportFns = [...cContent.matchAll(/export\s+const\s+([a-zA-Z0-9_]+)\s*=\s*([^;]+);/g)];
  for (const ef of exportFns) {
    const fnName = ef[1];
    const fnBody = ef[2];
    if (fnBody.includes('async') && !fnBody.includes('asyncHandler') && !fnBody.includes('try {')) {
      unhandledControllerFns.push(`${cFile}: Exported async function '${fnName}' might not be wrapped in asyncHandler or try-catch.`);
    }
  }
}

console.log(`\n3. Controller Error Boundary Audit:`);
if (unhandledControllerFns.length === 0) {
  console.log('   PASSED: All exported async controller functions use asyncHandler or try/catch.');
} else {
  unhandledControllerFns.forEach(u => console.log('   WARNING:', u));
}

// 4. Audit Multi-table writes in controllers
console.log(`\n4. Multi-Table Write Audit:`);
for (const cFile of controllerFiles) {
  const cPath = path.join(controllersDir, cFile);
  const cContent = fs.readFileSync(cPath, 'utf8');

  // Check if file uses User.create and Student.create or Session.create and Record.create
  const hasUserAndStudent = cContent.includes('User.create') && cContent.includes('Student.');
  const hasSessionAndRecord = cContent.includes('AttendanceSession.create') && cContent.includes('AttendanceRecord.');

  if (hasUserAndStudent || hasSessionAndRecord) {
    const hasTransaction = cContent.includes('transaction') || cContent.includes('sequelize.transaction');
    console.log(`   ${cFile}: multi-table write detected. Transaction present: ${hasTransaction ? 'YES' : 'NO'}`);
  }
}

// 5. Audit Scoped Queries in coordinator, chairperson, faculty controllers
console.log(`\n5. Scoped Role Query Audit:`);
const roleControllers = ['coordinator.controller.js', 'faculty.controller.js', 'chairperson.controller.js'];
for (const cFile of roleControllers) {
  const cPath = path.join(controllersDir, cFile);
  if (!fs.existsSync(cPath)) continue;
  const cContent = fs.readFileSync(cPath, 'utf8');

  const usesProgramBranchSection = cContent.includes('program') && (cContent.includes('branch') || cContent.includes('section') || cContent.includes('department'));
  console.log(`   ${cFile}: Tenancy scoping indicators present: ${usesProgramBranchSection ? 'YES' : 'NO'}`);
}
