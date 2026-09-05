const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, '..', 'routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.route.js'));

let endpoints = [];

files.forEach(file => {
  const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
  // Match router.<method>(...) statements
  const statements = content.split(/router\.(get|post|put|patch|delete)\s*\(/g);
  for (let i = 1; i < statements.length; i += 2) {
    const method = statements[i].toUpperCase();
    const statementBody = statements[i+1].split(';')[0];
    const pathMatch = statementBody.match(/(\[[^\]]+\]|'[^']+'|"[^"]+")/);
    const routePath = pathMatch ? pathMatch[0] : 'unknown';
    
    const isPublic = routePath.includes('/login') || routePath.includes('/register') || routePath.includes('/send-otp') || routePath.includes('/verify-otp') || routePath.includes('/forgot-password') || routePath.includes('/reset-password') || routePath.includes('/validate-username') || routePath.includes('/status');
    const hasAuth = statementBody.includes('isAuthenticated') || statementBody.includes('verifyToken');
    const hasRoles = statementBody.includes('allowRoles') || statementBody.includes('authorizeRoles');

    endpoints.push({
      file,
      method,
      routePath,
      isPublic,
      hasAuth,
      hasRoles,
      statementBody: statementBody.replace(/\s+/g, ' ').slice(0, 100)
    });
  }
});

console.log('=== TOTAL MOUNTED ENDPOINTS AUDITED:', endpoints.length, '===');
const unprotected = endpoints.filter(e => !e.isPublic && !e.hasAuth);
console.log('Total Unprotected Endpoints (Missing isAuthenticated):', unprotected.length);
unprotected.forEach(u => console.log(`  [UNPROTECTED] ${u.file} ${u.method} ${u.routePath}`));

const missingRoles = endpoints.filter(e => !e.isPublic && e.hasAuth && !e.hasRoles);
console.log('\nTotal Endpoints Missing Role Restrictions (has auth, but missing allowRoles):', missingRoles.length);
missingRoles.forEach(m => console.log(`  [NO_ROLE_CHECK] ${m.file} ${m.method} ${m.routePath} -> ${m.statementBody}`));
