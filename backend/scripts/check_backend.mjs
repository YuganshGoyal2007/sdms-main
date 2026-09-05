import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '..');

const dirs = ['controllers', 'routes', 'middlewares', 'services', 'models', 'lib'];
let totalChecked = 0;
let errCount = 0;

for (const d of dirs) {
  const fullDir = path.join(backendDir, d);
  if (!fs.existsSync(fullDir)) continue;
  const files = fs.readdirSync(fullDir).filter(f => f.endsWith('.js') || f.endsWith('.mjs') || f.endsWith('.cjs'));
  for (const f of files) {
    const filePath = path.join(fullDir, f);
    totalChecked++;
    try {
      execSync(`node --check "${filePath}"`, { stdio: 'pipe' });
    } catch (e) {
      console.error(`Syntax error in: ${filePath}`, e.message);
      errCount++;
    }
  }
}

console.log(`Backend syntax check completed.`);
console.log(`Total files checked: ${totalChecked}`);
console.log(`Syntax errors: ${errCount}`);
