import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT = path.resolve(__dirname, '..');
const PROJECT_ROOT = path.resolve(BACKEND_ROOT, '..', '..');

const execp = promisify(exec);

dotenv.config({ path: path.join(BACKEND_ROOT, '.env') });

const BACKUP_DIR = process.env.BACKUP_DIR || path.join('C:', 'backups', 'gbu-sdsm');
const RETENTION_DAYS = Number(process.env.BACKUP_RETENTION_DAYS || 14);
const BACKUP_LOG = path.join(BACKEND_ROOT, 'logs', 'backup.log');

const now = new Date();
const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

const logLine = (level, msg, extra) => {
  const line = JSON.stringify({
    level,
    time: now.toISOString(),
    service: 'gbu-sdsm-backup',
    msg,
    ...(extra || {}),
  });
  fs.appendFileSync(BACKUP_LOG, line + '\n');
  if (level === 'error' || level === 'fatal') {
    process.stderr.write(line + '\n');
  } else {
    process.stdout.write(line + '\n');
  }
};

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logLine('info', `Created directory`, { dir });
  }
};

const findMysqldump = () => {
  if (process.env.MYSQLDUMP_PATH && fs.existsSync(process.env.MYSQLDUMP_PATH)) {
    return process.env.MYSQLDUMP_PATH;
  }
  const candidates = [
    'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysqldump.exe',
    'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe',
    'C:\\Program Files\\MySQL\\MySQL Server 5.7\\bin\\mysqldump.exe',
    'C:\\Program Files\\MariaDB 10.11\\bin\\mysqldump.exe',
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return 'mysqldump';
};

const fileAgeDays = (filePath) => {
  const stat = fs.statSync(filePath);
  const ageMs = Date.now() - stat.mtimeMs;
  return ageMs / (1000 * 60 * 60 * 24);
};

const cleanupOldBackups = () => {
  if (!fs.existsSync(BACKUP_DIR)) return { removed: 0, kept: 0 };
  const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith('.zip') || f.endsWith('.sql'));
  let removed = 0;
  let kept = 0;
  for (const f of files) {
    const full = path.join(BACKUP_DIR, f);
    const age = fileAgeDays(full);
    if (age > RETENTION_DAYS) {
      try {
        fs.unlinkSync(full);
        removed += 1;
        logLine('info', `Removed old backup (${age.toFixed(1)} days old)`, { file: f });
      } catch (err) {
        logLine('error', `Failed to remove old backup`, { file: f, err: { name: err.name, message: err.message } });
      }
    } else {
      kept += 1;
    }
  }
  return { removed, kept };
};

const dumpMysql = async () => {
  const dialect = process.env.DB_DIALECT || 'mysql';
  if (dialect !== 'mysql') {
    logLine('warn', `DB_DIALECT is ${dialect} - skipping mysqldump (only MySQL is supported in this script)`, { dialect });
    return null;
  }
  const dumpPath = path.join(BACKUP_DIR, `db-${ts}.sql`);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;
  const db = process.env.DB_NAME || 'gbu_sdms';

  const mysqldumpBin = findMysqldump();
  logLine('info', `Using mysqldump`, { path: mysqldumpBin });
  const cmd = `"${mysqldumpBin}" --user="${user}" --password="${password}" --host="${host}" --port=${port} --single-transaction --quick --routines --triggers --events --default-character-set=utf8mb4 "${db}"`;
  try {
    const { stdout } = await execp(cmd, { maxBuffer: 1024 * 1024 * 1024 });
    fs.writeFileSync(dumpPath, stdout, 'utf8');
    const stat = fs.statSync(dumpPath);
    logLine('info', `MySQL dump written`, { path: dumpPath, sizeBytes: stat.size, db, host });
    return dumpPath;
  } catch (err) {
    logLine('error', `mysqldump failed`, {
      err: { name: err.name, message: err.message, stderr: err.stderr?.slice(0, 500) },
      hint: 'Make sure mysqldump is in PATH (usually C:\\Program Files\\MySQL\\MySQL Server X.X\\bin)',
    });
    return null;
  }
};

const zipBackend = async () => {
  const zipPath = path.join(BACKUP_DIR, `code-${ts}.zip`);
  let archiver;
  try {
    ({ default: archiver } = await import('archiver'));
  } catch (_) {
    logLine('warn', 'archiver module not available - falling back to PowerShell Compress-Archive', {});
    return null;
  }

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', () => {
      const stat = fs.statSync(zipPath);
      logLine('info', `Backend code zipped`, { path: zipPath, sizeBytes: stat.size });
      resolve(zipPath);
    });
    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        logLine('warn', `Archive warning: ${err.message}`, {});
      } else {
        reject(err);
      }
    });
    archive.on('error', (err) => reject(err));
    archive.pipe(output);

    const excludeDirs = ['node_modules', 'logs', '.git', 'dist', 'backups'];
    archive.glob('**/*', {
      cwd: PROJECT_ROOT,
      ignore: excludeDirs.map((d) => `**/${d}/**`),
    });

    archive.finalize();
  });
};

const zipBackendPowershell = () => {
  const zipPath = path.join(BACKUP_DIR, `code-${ts}.zip`);
  const include = [
    path.join(PROJECT_ROOT, 'backend'),
    path.join(PROJECT_ROOT, 'frontend', 'src'),
    path.join(PROJECT_ROOT, 'frontend', 'public'),
    path.join(PROJECT_ROOT, 'frontend', 'package.json'),
    path.join(PROJECT_ROOT, 'frontend', 'vite.config.ts'),
    path.join(PROJECT_ROOT, 'frontend', 'index.html'),
  ].filter((p) => fs.existsSync(p));
  const psCmd = `Compress-Archive -Path ${include.map((p) => `"${p}"`).join(',')} -DestinationPath "${zipPath}" -Force`;
  return execp(`powershell -NoProfile -Command "${psCmd}"`)
    .then(() => {
      const stat = fs.statSync(zipPath);
      logLine('info', `Backend code zipped (PowerShell)`, { path: zipPath, sizeBytes: stat.size });
      return zipPath;
    })
    .catch((err) => {
      logLine('error', `PowerShell zip failed`, { err: { name: err.name, message: err.message } });
      return null;
    });
};

const main = async () => {
  logLine('info', 'Backup started', { backupDir: BACKUP_DIR, retentionDays: RETENTION_DAYS, timestamp: ts });
  ensureDir(BACKUP_DIR);
  ensureDir(path.dirname(BACKUP_LOG));

  let dumpPath = null;
  let codeZipPath = null;
  let success = true;

  try {
    dumpPath = await dumpMysql();
  } catch (err) {
    success = false;
    logLine('fatal', `Unexpected error during DB dump`, { err: { name: err.name, message: err.message } });
  }

  try {
    codeZipPath = await zipBackend();
    if (!codeZipPath) codeZipPath = await zipBackendPowershell();
  } catch (err) {
    success = false;
    logLine('fatal', `Unexpected error during code zip`, { err: { name: err.name, message: err.message } });
  }

  let cleanup = { removed: 0, kept: 0 };
  try {
    cleanup = cleanupOldBackups();
  } catch (err) {
    logLine('error', `Cleanup failed`, { err: { name: err.name, message: err.message } });
  }

  logLine('info', 'Backup finished', {
    success,
    dbDump: dumpPath,
    codeZip: codeZipPath,
    cleanup,
  });

  process.exit(success ? 0 : 1);
};

main().catch((err) => {
  logLine('fatal', `Backup script crashed`, { err: { name: err.name, message: err.message, stack: err.stack } });
  process.exit(1);
});
