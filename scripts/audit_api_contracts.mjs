import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const libDir = path.resolve(rootDir, 'frontend', 'src', 'lib');
const routesDir = path.resolve(rootDir, 'backend', 'routes');
const serverJs = fs.readFileSync(path.resolve(rootDir, 'backend', 'server.js'), 'utf8');

console.log('--- AUDITING FRONTEND API CONTRACTS AGAINST BACKEND ROUTES ---');

// Parse server.js mounts: app.use('/prefix', routeName)
const mountMap = {};
const mountMatches = [...serverJs.matchAll(/app\.use\s*\(\s*["']([^"']+)["']\s*,\s*([a-zA-Z0-9_]+)\s*\)/g)];
for (const mm of mountMatches) {
  const prefix = mm[1] === '/' ? '' : mm[1];
  const routeName = mm[2];
  if (!mountMap[routeName]) mountMap[routeName] = [];
  mountMap[routeName].push(prefix);
}

// Find route imports in server.js
const routeImportMap = {};
const importMatches = [...serverJs.matchAll(/import\s+([a-zA-Z0-9_]+)\s+from\s+["'](\.\/routes\/[^"']+)["']/g)];
for (const im of importMatches) {
  const routeVar = im[1];
  const routeFile = path.basename(im[2]);
  routeImportMap[routeVar] = routeFile;
}

// Build list of all mounted backend routes: { method, pathRegex, rawPath, file }
const backendEndpoints = [];

for (const [routeVar, prefixes] of Object.entries(mountMap)) {
  const routeFileName = routeImportMap[routeVar];
  if (!routeFileName) continue;
  const routeFilePath = path.join(routesDir, routeFileName);
  if (!fs.existsSync(routeFilePath)) continue;
  const rContent = fs.readFileSync(routeFilePath, 'utf8');

  // Match router.get('/path', ...), router.post('/path', ...), etc.
  const routeDefs = [...rContent.matchAll(/router\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/g)];
  for (const rd of routeDefs) {
    const method = rd[1].toUpperCase();
    const subPath = rd[2];
    for (const prefix of prefixes) {
      const fullPath = (prefix + subPath).replace(/\/+/g, '/');
      backendEndpoints.push({
        method,
        fullPath,
        routeFile: routeFileName
      });
    }
  }
}

console.log(`Discovered ${backendEndpoints.length} mounted backend endpoints.`);

// Now parse all calls in frontend/src/lib/*.api.ts
const apiFiles = fs.readdirSync(libDir).filter(f => f.endsWith('.api.ts'));
let mismatches = [];
let matchedCount = 0;

for (const aFile of apiFiles) {
  const aPath = path.join(libDir, aFile);
  const content = fs.readFileSync(aPath, 'utf8');

  // Match api.get('/path', ...), api.post('/path', ...), axiosInstance, etc.
  // Also match template literals like `/path/${param}`
  const apiCalls = [...content.matchAll(/(?:api|axiosInstance)\.(get|post|put|delete|patch)\s*(?:<[^>]+>)?\s*\(\s*[`"']([^`"']+(?:\$\{[^}]+\}[^`"']*)*)[`"']/g)];
  
  for (const ac of apiCalls) {
    const method = ac[1].toUpperCase();
    let urlPattern = ac[2];
    
    // Normalize template strings: replace ${...} with :param
    const normalizedUrl = urlPattern.replace(/\$\{[^}]+\}/g, ':param').split('?')[0];

    // Check if matching backend endpoint exists
    // Compare normalized URL against backend endpoint paths
    const exists = backendEndpoints.some(be => {
      if (be.method !== method) return false;
      const beNormalized = be.fullPath.replace(/:[a-zA-Z0-9_]+/g, ':param');
      return beNormalized === normalizedUrl || be.fullPath === normalizedUrl;
    });

    if (exists) {
      matchedCount++;
    } else {
      mismatches.push({
        file: aFile,
        method,
        url: urlPattern,
        normalizedUrl
      });
    }
  }
}

console.log(`Matched API calls: ${matchedCount}`);
console.log(`Mismatches or unmapped calls: ${mismatches.length}`);

if (mismatches.length > 0) {
  console.log('\nPotential Mismatches Details:');
  mismatches.forEach(m => {
    console.log(`- [${m.file}] ${m.method} ${m.url} (normalized: ${m.normalizedUrl})`);
  });
} else {
  console.log('SUCCESS: All frontend API calls match backend routes!');
}
